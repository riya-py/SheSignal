from fastapi import APIRouter, Query, Request

from app import database
from app.config import get_settings
from app.models.pattern import PatternListResponse
from app.patterns.service import maybe_recompute_patterns
from app.rate_limit import limiter

router = APIRouter(tags=["patterns"])


@router.get("/patterns", response_model=PatternListResponse)
def get_patterns(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    settings = get_settings()
    client_ip = request.client.host if request.client else "unknown"
    limiter.check(f"patterns:{client_ip}", settings.RATE_LIMIT_PUBLIC_API)

    maybe_recompute_patterns()
    rows = database.list_patterns(limit=limit, offset=offset)
    return PatternListResponse(items=rows, limit=limit, offset=offset)