import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app import database
from app.config import get_settings
from app.models.route import Coordinate, RouteRiskRequest, RouteRiskResponse, SegmentRisk
from app.rate_limit import limiter
from app.risk import engine as risk_engine
from app.routing import segmentation
from app.routing.cache import build_cache_key, route_cache
from app.routing.exceptions import RouteProviderError
from app.routing import provider as route_provider
from app.routing.risk import build_route_explanation, combine_segment_scores

logger = logging.getLogger("shesignal.routing.service")


def get_route_risk(user_id: str, payload: RouteRiskRequest) -> RouteRiskResponse:
    settings = get_settings()

    # Explicit, authenticated, user-initiated action - a hit rate limit is
    # surfaced directly (unlike the AI auto-trigger's fail-open behavior).
    limiter.check(f"route:{user_id}", settings.RATE_LIMIT_ROUTE_ANALYSIS)

    origin, destination = payload.origin, payload.destination
    if origin.latitude == destination.latitude and origin.longitude == destination.longitude:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="origin and destination must be different locations",
        )

    cache_key = build_cache_key(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude,
        settings.ROUTE_CACHE_COORD_PRECISION,
    )
    cached = route_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        route = route_provider.get_route(
            (origin.latitude, origin.longitude), (destination.latitude, destination.longitude)
        )
    except RouteProviderError:
        logger.exception("route provider failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to calculate a route right now. Please try again shortly.",
        )

    if route["distance_meters"] > settings.ROUTE_MAX_DISTANCE_METERS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Route distance exceeds the maximum supported "
                f"({settings.ROUTE_MAX_DISTANCE_METERS} meters)."
            ),
        )

    target_segments = max(
        1,
        min(
            settings.ROUTE_MAX_SEGMENTS,
            round(route["distance_meters"] / settings.ROUTE_SEGMENT_TARGET_LENGTH_METERS) or 1,
        ),
    )
    raw_segments = segmentation.compute_segments(route["coordinates"], target_segments)

    now = datetime.now(timezone.utc)
    segments: list[SegmentRisk] = []
    for i, seg in enumerate(raw_segments):
        mid_lat, mid_lng = seg["midpoint"]
        patterns = database.find_nearby_patterns(
            mid_lat, mid_lng, settings.ROUTE_SEGMENT_RISK_RADIUS_METERS
        )
        score, level, factors, _explanation, reports, pattern_count = risk_engine.compute_risk(
            patterns, settings, now=now
        )
        segments.append(
            SegmentRisk(
                sequence=i,
                start=Coordinate(latitude=seg["start"][0], longitude=seg["start"][1]),
                end=Coordinate(latitude=seg["end"][0], longitude=seg["end"][1]),
                distance_meters=seg["distance_meters"],
                risk_score=score,
                risk_level=level,
                contributing_factors=factors,
                based_on_patterns=pattern_count,
                based_on_reports=reports,
            )
        )

    overall_score = combine_segment_scores([s.risk_score for s in segments], settings)
    overall_level = risk_engine.determine_risk_level(overall_score, settings)
    explanation = build_route_explanation([s.risk_level for s in segments], overall_level)

    response = RouteRiskResponse(
        origin=origin,
        destination=destination,
        total_distance_meters=route["distance_meters"],
        total_duration_seconds=route["duration_seconds"],
        overall_risk_score=overall_score,
        overall_risk_level=overall_level,
        explanation=explanation,
        segments=segments,
        computed_at=now,
    )

    route_cache.set(cache_key, response, settings.ROUTE_CACHE_TTL_SECONDS)
    return response