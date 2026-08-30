from typing import Optional

from fastapi import APIRouter, Query, Request

from app.models.risk import RiskScoreResponse
from app.risk.service import get_risk_assessment

router = APIRouter(tags=["risk"])


@router.get("/risk", response_model=RiskScoreResponse)
def get_risk(
    request: Request,
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    radius_meters: Optional[float] = Query(default=None, gt=0),
):
    # Score is always computed server-side from validated aggregated
    # pattern data - there is no request field that lets a caller supply
    # or influence the numeric score directly.
    client_ip = request.client.host if request.client else "unknown"
    return get_risk_assessment(latitude, longitude, radius_meters, client_ip)