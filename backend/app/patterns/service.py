from datetime import datetime, timezone

from fastapi import HTTPException, status

from app import database
from app.config import get_settings
from app.models.recommendation import RecommendationResponse
from app.rate_limit import limiter
from app.recommendations.cache import build_cache_key, recommendation_cache
from app.recommendations.engine import build_recommendations


def get_recommendations(
    latitude: float, longitude: float, radius_meters: float | None, client_ip: str
) -> RecommendationResponse:
    settings = get_settings()
    limiter.check(f"recommendations:{client_ip}", settings.RATE_LIMIT_RECOMMENDATIONS)

    radius = radius_meters if radius_meters is not None else settings.RISK_DEFAULT_RADIUS_METERS
    if radius <= 0 or radius > settings.RISK_MAX_RADIUS_METERS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"radius_meters must be between 0 and {settings.RISK_MAX_RADIUS_METERS}",
        )

    cache_key = build_cache_key(latitude, longitude, radius, settings.RISK_CACHE_COORD_PRECISION)
    cached = recommendation_cache.get(cache_key)
    if cached is not None:
        return cached

    patterns = database.find_nearby_patterns(latitude, longitude, radius)
    user_recs, authority_recs, factors, reports, pattern_count = build_recommendations(
        patterns, settings.RECOMMENDATIONS_MAX_FACTORS
    )

    response = RecommendationResponse(
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius,
        based_on_reports=reports,
        based_on_patterns=pattern_count,
        based_on_factors=factors,
        user_recommendations=user_recs,
        authority_recommendations=authority_recs,
        computed_at=datetime.now(timezone.utc),
    )

    recommendation_cache.set(cache_key, response, settings.RECOMMENDATIONS_CACHE_TTL_SECONDS)
    return response