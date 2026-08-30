from typing import Optional

from fastapi import APIRouter, Query, Request

from app.models.recommendation import RecommendationResponse
from app.recommendations.service import get_recommendations

router = APIRouter(tags=["recommendations"])


@router.get("/recommendations", response_model=RecommendationResponse)
def get_recommendations_route(
    request: Request,
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    radius_meters: Optional[float] = Query(default=None, gt=0),
):
    client_ip = request.client.host if request.client else "unknown"
    return get_recommendations(latitude, longitude, radius_meters, client_ip)