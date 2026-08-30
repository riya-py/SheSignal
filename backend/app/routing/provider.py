"""
Thin client for a walking-directions provider that speaks the
OpenRouteService (ORS) directions/geojson wire format - see README for a
free API key. Mirrors app/ai/client.py's timeout/retry shape deliberately,
for consistency.
"""
import logging
import time
from typing import List, Optional, Tuple

import httpx

from app.routing.exceptions import RouteProviderError

logger = logging.getLogger("shesignal.routing")

Coordinate = Tuple[float, float]  # (latitude, longitude)


class RouteProvider:
    def __init__(
        self,
        api_key: str,
        base_url: str,
        profile: str,
        timeout_seconds: float,
        max_retries: int,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._profile = profile
        self._timeout_seconds = timeout_seconds
        self._max_retries = max_retries
        self._http_client = http_client or httpx.Client(timeout=timeout_seconds)

    def get_route(self, origin: Coordinate, destination: Coordinate) -> dict:
        url = f"{self._base_url}/{self._profile}/geojson"
        body = {
            # ORS wants [lng, lat] pairs.
            "coordinates": [
                [origin[1], origin[0]],
                [destination[1], destination[0]],
            ]
        }
        headers = {
            "Authorization": self._api_key,
            "Content-Type": "application/json",
        }

        last_error: Optional[Exception] = None
        for attempt in range(self._max_retries + 1):
            try:
                resp = self._http_client.post(url, json=body, headers=headers)
            except httpx.TimeoutException as exc:
                last_error = exc
                logger.warning("Route provider timeout, attempt %s", attempt + 1)
                self._backoff(attempt)
                continue
            except httpx.HTTPError as exc:
                last_error = exc
                logger.warning("Route provider transport error, attempt %s", attempt + 1)
                self._backoff(attempt)
                continue

            if resp.status_code >= 500:
                last_error = RouteProviderError(f"provider returned {resp.status_code}")
                logger.warning("Route provider 5xx, attempt %s", attempt + 1)
                self._backoff(attempt)
                continue

            if resp.status_code >= 400:
                logger.error("Route provider rejected request: status=%s", resp.status_code)
                raise RouteProviderError(f"provider returned {resp.status_code}")

            return self._parse_route(resp)

        logger.error("Route request failed after retries: %s", type(last_error).__name__)
        raise RouteProviderError("exhausted retries") from last_error

    def _parse_route(self, resp: httpx.Response) -> dict:
        try:
            data = resp.json()
            feature = data["features"][0]
            raw_coords = feature["geometry"]["coordinates"]  # [[lng, lat], ...]
            coordinates: List[Coordinate] = [(lat, lng) for lng, lat in raw_coords]
            segment_summary = feature["properties"]["segments"][0]
            distance_meters = float(segment_summary["distance"])
            duration_seconds = float(segment_summary["duration"])
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            logger.error("Route response could not be parsed: %s", type(exc).__name__)
            raise RouteProviderError("unparseable provider response") from exc

        if len(coordinates) < 2:
            raise RouteProviderError("provider returned an empty route")

        return {
            "coordinates": coordinates,
            "distance_meters": distance_meters,
            "duration_seconds": duration_seconds,
        }

    def _backoff(self, attempt: int) -> None:
        time.sleep(min(0.5 * (2**attempt), 2.0))


_provider: Optional[RouteProvider] = None


def get_provider() -> RouteProvider:
    global _provider
    if _provider is None:
        from app.config import get_settings

        settings = get_settings()
        _provider = RouteProvider(
            api_key=settings.ROUTE_PROVIDER_API_KEY,
            base_url=settings.ROUTE_PROVIDER_BASE_URL,
            profile=settings.ROUTE_PROFILE,
            timeout_seconds=settings.ROUTE_TIMEOUT_SECONDS,
            max_retries=settings.ROUTE_MAX_RETRIES,
        )
    return _provider


def get_route(origin: Coordinate, destination: Coordinate) -> dict:
    """Module-level entry point so app/routing/service.py (and tests) can
    call/mock this without reaching into the RouteProvider singleton."""
    return get_provider().get_route(origin, destination)