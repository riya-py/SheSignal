from datetime import datetime
from typing import List, Literal

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
    explanation: str
    computed_at: datetime