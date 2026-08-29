"""
All direct database access lives here, isolated behind small functions.

IMPORTANT: this module uses the Supabase SERVICE ROLE key, which bypasses RLS.
It must never run in the browser and must never be imported by frontend code.
Column-level privacy (e.g. never returning reporter_id publicly) is enforced
in the Pydantic response models in app/models/report.py, in addition to the
RLS/view design in supabase/migrations — defense in depth.
"""
from functools import lru_cache
from typing import Any, Dict, List

from supabase import Client, create_client

from app.config import get_settings

REPORTS_TABLE = "reports"
PUBLIC_REPORTS_VIEW = "public_reports"
REPORT_ANALYSIS_TABLE = "report_analysis"


@lru_cache
def get_service_client() -> Client:
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def insert_report(payload: Dict[str, Any]) -> Dict[str, Any]:
    client = get_service_client()
    result = client.table(REPORTS_TABLE).insert(payload).execute()
    return result.data[0]


def list_public_reports(limit: int, offset: int) -> List[Dict[str, Any]]:
    client = get_service_client()
    result = (
        client.table(PUBLIC_REPORTS_VIEW)
        .select("*")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


def get_report_by_id(report_id: str) -> Dict[str, Any] | None:
    client = get_service_client()
    result = client.table(REPORTS_TABLE).select("*").eq("id", report_id).limit(1).execute()
    return result.data[0] if result.data else None


def get_report_analysis(report_id: str) -> Dict[str, Any] | None:
    client = get_service_client()
    result = (
        client.table(REPORT_ANALYSIS_TABLE)
        .select("*")
        .eq("report_id", report_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def upsert_report_analysis(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Idempotent by report_id (unique constraint). Used both for the first
    write and for retrying a previously-failed analysis. Whether a *new*
    analysis attempt is allowed at all (duplicate-processing prevention) is
    decided by the caller before this is ever invoked."""
    client = get_service_client()
    result = (
        client.table(REPORT_ANALYSIS_TABLE)
        .upsert(payload, on_conflict="report_id")
        .execute()
    )
    return result.data[0]