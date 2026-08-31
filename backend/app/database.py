from functools import lru_cache
from typing import Any, Dict, List

from supabase import Client, create_client

from app.config import get_settings

REPORTS_TABLE = "reports"
PUBLIC_REPORTS_VIEW = "public_reports"
REPORT_ANALYSIS_TABLE = "report_analysis"
PATTERNS_TABLE = "patterns"
RECOMPUTE_PATTERNS_RPC = "recompute_patterns"
PATTERNS_WITHIN_RADIUS_RPC = "patterns_within_radius"


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


def recompute_patterns(min_reports: int, lookback_days: int, geohash_precision: int) -> int:
    """Runs the whole geographic+temporal aggregation inside Postgres (see
    supabase/migrations/0003_patterns.sql) so no report rows are ever pulled
    into Python memory. Returns the number of qualifying patterns found."""
    client = get_service_client()
    result = client.rpc(
        RECOMPUTE_PATTERNS_RPC,
        {
            "p_min_reports": min_reports,
            "p_lookback_days": lookback_days,
            "p_geohash_precision": geohash_precision,
        },
    ).execute()
    return result.data


def list_patterns(limit: int, offset: int) -> List[Dict[str, Any]]:
    client = get_service_client()
    result = (
        client.table(PATTERNS_TABLE)
        .select("*")
        .order("report_count", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data


def find_nearby_patterns(
    latitude: float, longitude: float, radius_meters: float
) -> List[Dict[str, Any]]:
    """Indexed spatial lookup (PostGIS ST_DWithin, see
    supabase/migrations/0004_risk_engine_support.sql) - already-aggregated
    pattern rows only, never individual reports."""
    client = get_service_client()
    result = client.rpc(
        PATTERNS_WITHIN_RADIUS_RPC,
        {"p_lat": latitude, "p_lng": longitude, "p_radius_meters": radius_meters},
    ).execute()
    return result.data