from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel

from app.models.risk import ContributingFactor, RiskLevel

RecommendationType = Literal[
    "route",
    "warning",
    "personal_action",
    "report_action",
    "intervention",
    "priority",
    "hotspot_insight",
    "infrastructure_action",
    "general",
]

PriorityLevel = Literal["low", "medium", "high"]


class Recommendation(BaseModel):
    text: str
    factor: Optional[str] = None
    type: RecommendationType = "general"
    priority: Optional[PriorityLevel] = None


class RecommendationResponse(BaseModel):
    latitude: float
    longitude: float
    radius_meters: float
    based_on_reports: int
    based_on_patterns: int
    based_on_factors: List[ContributingFactor]
    risk_level: RiskLevel
    user_recommendations: List[Recommendation]
    authority_recommendations: List[Recommendation]
    computed_at: datetime