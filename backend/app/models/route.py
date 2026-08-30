from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from app.models.risk import ContributingFactor, RiskLevel


class Coordinate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class RouteRiskRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate


class SegmentRisk(BaseModel):
    sequence: int
    start: Coordinate
    end: Coordinate
    distance_meters: float
    risk_score: int
    risk_level: RiskLevel
    contributing_factors: List[ContributingFactor]
    based_on_patterns: int
    based_on_reports: int


class RouteRiskResponse(BaseModel):
    origin: Coordinate
    destination: Coordinate
    total_distance_meters: float
    total_duration_seconds: float
    overall_risk_score: int
    overall_risk_level: RiskLevel
    explanation: str
    segments: List[SegmentRisk]
    computed_at: datetime