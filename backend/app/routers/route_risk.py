from fastapi import APIRouter, Depends

from app.dependencies import CurrentUser, get_current_user
from app.models.route import RouteRiskRequest, RouteRiskResponse
from app.routing.service import get_route_risk

router = APIRouter(tags=["route-risk"])


@router.post("/route-risk", response_model=RouteRiskResponse)
def post_route_risk(
    payload: RouteRiskRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    return get_route_risk(current_user.id, payload)