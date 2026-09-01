import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app import database
from app.config import Settings, get_settings
from app.models.route import (
    Coordinate,
    RouteAlternative,
    RouteRiskRequest,
    RouteRiskResponse,
    SegmentRisk,
)
from app.rate_limit import limiter
from app.risk import engine as risk_engine
from app.routing import segmentation
from app.routing.cache import build_cache_key, route_cache
from app.routing.exceptions import RouteProviderError
from app.routing import provider as route_provider
from app.routing.risk import build_route_explanation, combine_segment_scores

logger = logging.getLogger("shesignal.routing.service")

# How many alternate routes to ask the provider for. ORS's own cap is 3
# total (primary + alternates), and each extra alternate is one more set of
# per-segment pattern lookups, so keep this modest.
ROUTE_ALTERNATIVE_COUNT = 2


def _score_route(coordinates, distance_meters: float, settings: Settings, now):
    """Segments a route's coordinates and scores every segment. Shared by
    the primary route and every alternate candidate so they're all scored
    the exact same way and are directly comparable."""
    target_segments = max(
        1,
        min(
            settings.ROUTE_MAX_SEGMENTS,
            round(distance_meters / settings.ROUTE_SEGMENT_TARGET_LENGTH_METERS) or 1,
        ),
    )
    raw_segments = segmentation.compute_segments(coordinates, target_segments)

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
    return segments, overall_score, overall_level, explanation


def _find_safer_alternative(
    origin: Coordinate, destination: Coordinate, primary_score: int, settings: Settings, now
) -> RouteAlternative | None:
    """Best-effort: fetches alternate routes and returns the lowest-risk one,
    but only if it actually scores better than the primary route. Never
    raises - any failure here just means no alternative is offered."""
    try:
        alt_routes = route_provider.get_alternative_routes(
            (origin.latitude, origin.longitude),
            (destination.latitude, destination.longitude),
            count=ROUTE_ALTERNATIVE_COUNT,
        )
    except Exception:
        logger.warning("Alternative route lookup raised unexpectedly", exc_info=True)
        return None

    best: tuple[dict, int, str, list[SegmentRisk]] | None = None
    for alt in alt_routes:
        if alt["distance_meters"] > settings.ROUTE_MAX_DISTANCE_METERS:
            continue
        try:
            alt_segments, alt_score, alt_level, _ = _score_route(
                alt["coordinates"], alt["distance_meters"], settings, now
            )
        except ValueError:
            continue
        if best is None or alt_score < best[1]:
            best = (alt, alt_score, alt_level, alt_segments)

    if best is None or best[1] >= primary_score:
        return None

    alt, alt_score, alt_level, alt_segments = best
    return RouteAlternative(
        total_distance_meters=alt["distance_meters"],
        total_duration_seconds=alt["duration_seconds"],
        overall_risk_score=alt_score,
        overall_risk_level=alt_level,
        segments=alt_segments,
    )


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

    now = datetime.now(timezone.utc)
    segments, overall_score, overall_level, explanation = _score_route(
        route["coordinates"], route["distance_meters"], settings, now
    )

    alternative = _find_safer_alternative(origin, destination, overall_score, settings, now)

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
        alternative=alternative,
    )

    route_cache.set(cache_key, response, settings.ROUTE_CACHE_TTL_SECONDS)
    return response