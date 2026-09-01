from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from app import database
from app.config import get_settings
from app.models.risk import RiskScoreResponse
from app.rate_limit import limiter
from app.risk.cache import build_cache_key, risk_cache
from app.risk.engine import compute_risk


def get_risk_assessment(
    latitude: float,
    longitude: float,
    radius_meters: Optional[float],
    client_ip: str,
) -> RiskScoreResponse:
    settings = get_settings()

    limiter.check(
        f"risk:{client_ip}",
        settings.RATE_LIMIT_RISK,
    )

    radius = (
    radius_meters
        if radius_meters is not None
        else settings.RISK_DEFAULT_RADIUS_METERS
    )

    if radius <= 0 or radius > settings.RISK_MAX_RADIUS_METERS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"radius_meters must be between 0 and "
                f"{settings.RISK_MAX_RADIUS_METERS}"
            ),
        )

    cache_key = build_cache_key(
        latitude,
        longitude,
        radius,
        settings.RISK_CACHE_COORD_PRECISION,
    )

    cached = risk_cache.get(cache_key)

    if cached is not None:
        return cached

    patterns = database.find_nearby_patterns(
        latitude,
        longitude,
        radius,
    )

    (
        score,
        level,
        factors,
        explanation,
        reports,
        pattern_count,
    ) = compute_risk(
        patterns,
        settings,
    )

    response = RiskScoreResponse(
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius,
        risk_score=score,
        risk_level=level,
        based_on_patterns=pattern_count,
        based_on_reports=reports,
        contributing_factors=factors,
        explanation=explanation,
        computed_at=datetime.now(timezone.utc),
    )

    risk_cache.set(
        cache_key,
        response,
        settings.RISK_CACHE_TTL_SECONDS,
    )

    return response