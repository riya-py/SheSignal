"""
Diagnose + backfill missing/failed AI report_analysis rows, then
recompute patterns so Top Issues / the risk pie chart populate.

Run from inside backend/ (same folder as app/), with your normal
backend .env loaded, e.g.:

    cd backend
    python ../backfill_report_analysis.py            # just show status
    python ../backfill_report_analysis.py --fix       # also re-run AI
    python ../backfill_report_analysis.py --fix --recompute   # + recompute_patterns after

Requires the same deps as the backend (supabase, pydantic, etc.) to
already be installed in your venv.
"""
import argparse
import sys
from pathlib import Path

# Make sure `backend/` (the parent of this scripts/ folder) is on sys.path,
# so `app` resolves no matter where this script is invoked from.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import database
from app.ai.service import process_report_analysis


def fetch_all_active_reports() -> list[dict]:
    client = database.get_service_client()
    result = (
        client.table(database.REPORTS_TABLE)
        .select("id, reporter_id, category, description, occurred_at, status")
        .eq("status", "active")
        .execute()
    )
    return result.data


def fetch_analysis_by_report_id() -> dict[str, dict]:
    client = database.get_service_client()
    result = client.table(database.REPORT_ANALYSIS_TABLE).select("*").execute()
    return {row["report_id"]: row for row in result.data}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true", help="re-run AI analysis on affected reports")
    parser.add_argument("--recompute", action="store_true", help="call recompute_patterns() after fixing")
    args = parser.parse_args()

    reports = fetch_all_active_reports()
    analysis_by_report = fetch_analysis_by_report_id()

    missing, failed, pending, completed = [], [], [], []
    for r in reports:
        a = analysis_by_report.get(r["id"])
        if a is None:
            missing.append(r)
        elif a.get("status") == "failed":
            failed.append(r)
        elif a.get("status") == "completed":
            completed.append(r)
        else:
            pending.append(r)

    print(f"Total active reports: {len(reports)}")
    print(f"  completed analysis: {len(completed)}")
    print(f"  MISSING analysis row: {len(missing)}")
    print(f"  FAILED analysis: {len(failed)}")
    print(f"  other/pending: {len(pending)}")

    affected = missing + failed + pending
    if not affected:
        print("\nNothing to fix — every active report has a completed analysis.")
        return

    print("\nAffected reports:")
    for r in affected:
        state = "missing" if r in missing else ("failed" if r in failed else "pending")
        print(f"  {r['id']}  category={r['category']!r}  occurred_at={r['occurred_at']}  [{state}]")

    if not args.fix:
        print("\nRe-run with --fix to attempt AI analysis on these now.")
        return

    print("\nRe-running AI analysis (raise_on_rate_limit=True, so real errors surface)...")
    ok, still_failing = 0, []
    for r in affected:
        try:
            process_report_analysis(
                report_id=r["id"],
                description=r["description"],
                submitted_category=r["category"],
                user_id=r["reporter_id"],
                raise_on_rate_limit=True,
            )
            result = database.get_report_analysis(r["id"])
            if result and result.get("status") == "completed":
                ok += 1
                print(f"  OK      {r['id']}  factors={result.get('factors')}")
            else:
                still_failing.append(r["id"])
                print(f"  FAILED  {r['id']}  (wrote status={result.get('status') if result else None})")
        except Exception as exc:  # surface the real reason instead of swallowing it
            still_failing.append(r["id"])
            print(f"  ERROR   {r['id']}  {type(exc).__name__}: {exc}")

    print(f"\nFixed {ok}/{len(affected)}.")
    if still_failing:
        print("Still failing — check AI_API_KEY / AI_API_BASE_URL / AI_MODEL and the error text above:")
        for rid in still_failing:
            print(f"  {rid}")

    if args.recompute:
        print("\nRecomputing patterns...")
        count = database.recompute_patterns(min_reports=3, lookback_days=90, geohash_precision=7)
        print(f"Patterns recomputed: {count} pattern(s) now qualify.")
    elif ok:
        print("\nRun with --recompute too (or hit your existing recompute path) so patterns.factor_breakdown picks these up.")


if __name__ == "__main__":
    sys.exit(main())