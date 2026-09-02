"""
One-off admin script: re-run AI analysis for every report that doesn't have
a *completed* report_analysis row (covers both "pending" - the AI call was
never made or never finished - and "failed", which is what every report hit
before the SYSTEM_PROMPT/ReportCategory mismatch was fixed in app/ai/client.py).

Run from backend/ with the venv active and .env loaded:

    python -m scripts.backfill_report_analysis

Safe to re-run: reports that already have status="completed" are skipped
(upsert_report_analysis is idempotent per report_id, but we skip them up
front anyway so this doesn't burn AI calls re-doing work that already
succeeded). Uses the service-role client directly, bypassing the per-user
AI rate limit that guards the normal request path - this is an admin tool,
not a request handler, so a small fixed delay between calls is used instead
to stay polite to the AI provider.
"""
import logging
import sys
import time

from pydantic import ValidationError

from app import database
from app.ai import client as ai_client
from app.ai.exceptions import AIError
from app.ai.schemas import AIExtractionResult
from app.config import get_settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("backfill")

DELAY_BETWEEN_CALLS_SECONDS = 1.0


def fetch_all_reports() -> list[dict]:
    client = database.get_service_client()
    result = (
        client.table(database.REPORTS_TABLE)
        .select("id, category, description")
        .order("created_at", desc=False)
        .execute()
    )
    return result.data


def fetch_completed_report_ids() -> set[str]:
    client = database.get_service_client()
    result = (
        client.table(database.REPORT_ANALYSIS_TABLE)
        .select("report_id")
        .eq("status", "completed")
        .execute()
    )
    return {row["report_id"] for row in result.data}


def analyze_one(settings, report: dict) -> bool:
    """Returns True on a completed analysis, False otherwise."""
    report_id = report["id"]
    description = report["description"][: settings.AI_MAX_INPUT_CHARS]

    try:
        raw = ai_client.extract(description, report["category"])
        result = AIExtractionResult.model_validate(raw)
    except (AIError, ValidationError) as exc:
        logger.warning("report_id=%s FAILED (%s)", report_id, type(exc).__name__)
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
        return False

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
    logger.info("report_id=%s completed (category=%s, factors=%s)", report_id, result.category, result.factors)
    return True


def main() -> int:
    settings = get_settings()

    reports = fetch_all_reports()
    completed_ids = fetch_completed_report_ids()
    pending = [r for r in reports if r["id"] not in completed_ids]

    logger.info("%d total reports, %d already completed, %d to (re)analyze", len(reports), len(completed_ids), len(pending))

    if not pending:
        logger.info("Nothing to do.")
        return 0

    succeeded = 0
    failed = 0
    for i, report in enumerate(pending, start=1):
        logger.info("[%d/%d] analyzing report_id=%s", i, len(pending), report["id"])
        if analyze_one(settings, report):
            succeeded += 1
        else:
            failed += 1
        if i < len(pending):
            time.sleep(DELAY_BETWEEN_CALLS_SECONDS)

    logger.info("Done: %d completed, %d still failed", succeeded, failed)

    logger.info("Recomputing patterns...")
    pattern_count = database.recompute_patterns(
        min_reports=settings.CLUSTER_MIN_REPORTS,
        lookback_days=settings.CLUSTER_LOOKBACK_DAYS,
        geohash_precision=settings.CLUSTER_GEOHASH_PRECISION,
    )
    logger.info("Patterns recomputed: %s qualifying pattern(s)", pattern_count)

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())