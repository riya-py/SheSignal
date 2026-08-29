"""
Ties together: rate limiting -> AI call -> Pydantic validation -> storage.
Mirrors the Phase 0 flow diagram:
Report -> Supabase -> FastAPI -> Rate Limit -> AI -> Validate JSON -> report_analysis

The original report is always written first (in the reports router) and is
never rolled back or blocked by anything that happens in here.
"""
import logging

from fastapi import HTTPException
from pydantic import ValidationError

from app import database
from app.ai import client as ai_client
from app.ai.exceptions import AIError
from app.ai.schemas import AIExtractionResult
from app.config import get_settings
from app.rate_limit import limiter

logger = logging.getLogger("shesignal.ai.service")


def process_report_analysis(
    report_id: str,
    description: str,
    submitted_category: str,
    user_id: str,
    raise_on_rate_limit: bool = False,
) -> None:
    settings = get_settings()

    try:
        limiter.check(f"ai:{user_id}", settings.RATE_LIMIT_AI)
    except HTTPException:
        if raise_on_rate_limit:
            raise
        # Auto-triggered path (right after report submission): the report
        # itself must still succeed even if AI capacity is currently used up.
        logger.info("AI analysis skipped by rate limit report_id=%s", report_id)
        return

    truncated_description = description[: settings.AI_MAX_INPUT_CHARS]

    try:
        raw = ai_client.extract(truncated_description, submitted_category)
        result = AIExtractionResult.model_validate(raw)
    except (AIError, ValidationError) as exc:
        logger.warning(
            "AI analysis failed report_id=%s reason=%s", report_id, type(exc).__name__
        )
        database.upsert_report_analysis(
            {
                "report_id": report_id,
                "status": "failed",
                "category": None,
                "severity": None,
                "time_context": None,
                "factors": None,
            }
        )
        return

    database.upsert_report_analysis(
        {
            "report_id": report_id,
            "status": "completed",
            "category": result.category,
            "severity": result.severity,
            "time_context": result.time_context,
            "factors": result.factors,
        }
    )
    logger.info("AI analysis completed report_id=%s", report_id)