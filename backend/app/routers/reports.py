"""
POST /reports  -> authenticated, rate-limited per user, writes a report
GET  /reports  -> public, rate-limited per IP, reads sanitized/paginated reports

Neither endpoint ever returns reporter_id — see app/models/report.py.
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app import database
from app.ai.service import process_report_analysis
from app.config import get_settings
from app.dependencies import CurrentUser, get_current_user
from app.models.report import ReportCreate, ReportListResponse, ReportResponse
from app.models.report_analysis import ReportAnalysisResponse
from app.rate_limit import limiter

logger = logging.getLogger("shesignal.reports")
router = APIRouter(tags=["reports"])


@router.post("/reports", response_model=ReportResponse, status_code=201)
def create_report(
    payload: ReportCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    settings = get_settings()
    # Rate-limited per authenticated user, not per IP, so one user can't
    # bypass the limit by rotating networks.
    limiter.check(f"reports:{current_user.id}", settings.RATE_LIMIT_REPORTS)

    row = {
        "reporter_id": current_user.id,
        "category": payload.category,
        "description": payload.description,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "occurred_at": (payload.occurred_at or datetime.now(timezone.utc)).isoformat(),
        "status": "active",
    }
    created = database.insert_report(row)
    logger.info("report created category=%s", payload.category)  # no description/coords logged

    # Best-effort: the report is already saved and this response is already
    # 201 no matter what happens next. AI failure/rate-limiting never
    # undoes or blocks the report itself.
    try:
        process_report_analysis(
            report_id=created["id"],
            description=payload.description,
            submitted_category=payload.category,
            user_id=current_user.id,
            raise_on_rate_limit=False,
        )
    except Exception:
        logger.exception("AI analysis pipeline errored report_id=%s", created["id"])

    return created


def _get_owned_report_or_404(report_id: str, current_user: CurrentUser) -> dict:
    report = database.get_report_by_id(report_id)
    if not report or report.get("reporter_id") != current_user.id:
        # 404 rather than 403: don't confirm another user's report exists.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.get("/reports/{report_id}/analysis", response_model=ReportAnalysisResponse)
def get_report_analysis(
    report_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    settings = get_settings()
    limiter.check(f"analysis_read:{current_user.id}", settings.RATE_LIMIT_PUBLIC_API)

    _get_owned_report_or_404(report_id, current_user)
    analysis = database.get_report_analysis(report_id)
    if not analysis:
        return ReportAnalysisResponse(report_id=report_id, status="pending")
    return ReportAnalysisResponse(**analysis)


@router.post("/reports/{report_id}/reanalyze", response_model=ReportAnalysisResponse)
def reanalyze_report(
    report_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    report = _get_owned_report_or_404(report_id, current_user)

    existing = database.get_report_analysis(report_id)
    if existing and existing.get("status") == "completed":
        # Duplicate-processing prevention: don't silently re-run AI on an
        # already-analyzed report.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This report has already been analyzed.",
        )

    process_report_analysis(
        report_id=report_id,
        description=report["description"],
        submitted_category=report["category"],
        user_id=current_user.id,
        raise_on_rate_limit=True,
    )

    analysis = database.get_report_analysis(report_id)
    if not analysis:
        return ReportAnalysisResponse(report_id=report_id, status="failed")
    return ReportAnalysisResponse(**analysis)


@router.get("/reports", response_model=ReportListResponse)
def list_reports(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    settings = get_settings()
    client_ip = request.client.host if request.client else "unknown"
    limiter.check(f"public_reports:{client_ip}", settings.RATE_LIMIT_PUBLIC_API)

    rows = database.list_public_reports(limit=limit, offset=offset)
    return ReportListResponse(items=rows, limit=limit, offset=offset)