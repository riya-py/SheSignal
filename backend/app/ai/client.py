"""
Thin client for an OpenAI-compatible chat/completions endpoint.

Works unmodified with Google Gemini's OpenAI-compat layer, Groq, OpenAI,
OpenRouter, or any other provider that speaks the same wire format - only
AI_API_BASE_URL / AI_MODEL / AI_API_KEY need to change (see README).

Retries only on transient failures (timeouts, 5xx). Never retries on 4xx
(bad key, bad request) since retrying won't help. Every failure path raises
AIError - callers decide how to degrade; this module never talks to the DB
or HTTP layer of the app.
"""
import json
import logging
import time
from typing import Any, Dict, Optional

import httpx

from app.ai.exceptions import AIError
from app.config import get_settings

logger = logging.getLogger("shesignal.ai")

SYSTEM_PROMPT = (
    "You are a safety-report classifier. Given a short anonymous safety "
    "report, extract structured data. Respond with ONLY a JSON object, no "
    "prose, no markdown fences, matching exactly this shape:\n"
    '{"category": one of '
    "[harassment, poor_lighting, stalking, isolated_area, unsafe_transit, "
    "suspicious_activity, other], "
    '"severity": one of [low, medium, high], '
    '"time_context": one of [morning, afternoon, evening, night, unknown], '
    '"factors": array of up to 6 strings from '
    "[poor_lighting, isolated_area, following, harassment, "
    "no_security_presence, crowded_unsafe, unsafe_transit_exit, "
    "verbal_abuse, physical_contact, suspicious_vehicle]}"
)


class AIClient:
    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        timeout_seconds: float,
        max_retries: int,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout_seconds = timeout_seconds
        self._max_retries = max_retries
        # Allows tests to inject an httpx.Client with a MockTransport.
        self._http_client = http_client or httpx.Client(timeout=timeout_seconds)

    def extract(self, description: str, submitted_category: str) -> Dict[str, Any]:
        user_prompt = (
            f"Submitted category (may be inaccurate): {submitted_category}\n"
            f"Report text: {description}"
        )
        body = {
            "model": self._model,
            "temperature": 0,
            "max_tokens": 300,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        last_error: Optional[Exception] = None
        for attempt in range(self._max_retries + 1):
            try:
                resp = self._http_client.post(
                    f"{self._base_url}/chat/completions", json=body, headers=headers
                )
            except httpx.TimeoutException as exc:
                last_error = exc
                logger.warning("AI request timeout, attempt %s", attempt + 1)
                self._backoff(attempt)
                continue
            except httpx.HTTPError as exc:
                last_error = exc
                logger.warning("AI transport error, attempt %s", attempt + 1)
                self._backoff(attempt)
                continue

            if resp.status_code >= 500:
                last_error = AIError(f"provider returned {resp.status_code}")
                logger.warning("AI provider 5xx, attempt %s", attempt + 1)
                self._backoff(attempt)
                continue

            if resp.status_code >= 400:
                # Non-retryable: bad key, bad request, etc.
                logger.error("AI provider rejected request: status=%s", resp.status_code)
                raise AIError(f"provider returned {resp.status_code}")

            return self._parse_content(resp)

        logger.error("AI request failed after retries: %s", type(last_error).__name__)
        raise AIError("exhausted retries") from last_error

    def _parse_content(self, resp: httpx.Response) -> Dict[str, Any]:
        try:
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            logger.error("AI response could not be parsed: %s", type(exc).__name__)
            raise AIError("unparseable provider response") from exc

    def _backoff(self, attempt: int) -> None:
        time.sleep(min(0.5 * (2**attempt), 2.0))


_client: Optional[AIClient] = None


def get_client() -> AIClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AIClient(
            api_key=settings.AI_API_KEY,
            base_url=settings.AI_API_BASE_URL,
            model=settings.AI_MODEL,
            timeout_seconds=settings.AI_TIMEOUT_SECONDS,
            max_retries=settings.AI_MAX_RETRIES,
        )
    return _client


def extract(description: str, submitted_category: str) -> Dict[str, Any]:
    """Module-level entry point so app/ai/service.py (and tests) can call/mock
    this without reaching into the AIClient singleton directly."""
    return get_client().extract(description, submitted_category)