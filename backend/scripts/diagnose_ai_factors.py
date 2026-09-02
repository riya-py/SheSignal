"""
For every 'completed' report_analysis row whose factors ended up empty,
re-call the AI directly (bypassing AIExtractionResult validation) and show
the RAW factors it returned, next to the allowlist, so you can see exactly
which tokens are getting silently filtered out by filter_and_cap_factors().

This makes NO writes - read-only diagnostic.

Run from backend/:
    python scripts/diagnose_ai_factors.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import database
from app.ai import client as ai_client
from app.ai.schemas import ALLOWED_FACTORS
from app.config import get_settings


def main() -> None:
    settings = get_settings()
    client = database.get_service_client()

    analyses = (
        client.table(database.REPORT_ANALYSIS_TABLE)
        .select("report_id, status, factors")
        .eq("status", "completed")
        .execute()
        .data
    )
    empty = [a for a in analyses if not a.get("factors")]

    print(f"Completed analyses: {len(analyses)}")
    print(f"Completed but EMPTY factors: {len(empty)}\n")

    if not empty:
        print("Nothing to diagnose - every completed analysis already has factors.")
        return

    ai = ai_client.AIClient(
        api_key=settings.AI_API_KEY,
        base_url=settings.AI_API_BASE_URL,
        model=settings.AI_MODEL,
        timeout_seconds=settings.AI_TIMEOUT_SECONDS,
        max_retries=settings.AI_MAX_RETRIES,
    )

    for a in empty:
        report = database.get_report_by_id(a["report_id"])
        if not report:
            print(f"{a['report_id']}  (report row not found, skipping)")
            continue

        try:
            raw = ai.extract(report["description"], report["category"])
        except Exception as exc:
            print(f"{a['report_id']}  AI call errored on re-fetch: {type(exc).__name__}: {exc}")
            continue

        raw_factors = raw.get("factors", [])
        rejected = [f for f in raw_factors if str(f).strip().lower() not in ALLOWED_FACTORS]

        print(f"report_id: {a['report_id']}")
        print(f"  category:      {report['category']}")
        print(f"  description:   {report['description'][:100]!r}")
        print(f"  RAW factors:   {raw_factors}")
        print(f"  rejected (not in ALLOWED_FACTORS): {rejected}")
        print()


if __name__ == "__main__":
    main()