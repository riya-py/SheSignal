from datetime import datetime
from typing import Dict, List, Literal

from pydantic import BaseModel

RiskLevel = Literal["low", "moderate", "high"]


class ContributingFactor(BaseModel):
    factor: str
    count: int
    share: float


class RiskScoreResponse(BaseModel):
    latitude: float
    longitude: float
    radius_meters: float
    risk_score: int
    risk_level: RiskLevel
    based_on_patterns: int
    based_on_reports: int
    contributing_factors: List[ContributingFactor]
    time_of_day_breakdown: Dict[str, int]
    explanation: str
    computed_at: datetime