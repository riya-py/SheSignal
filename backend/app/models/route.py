from datetime import datetime
from typing import List, Optional

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


class RouteAlternative(BaseModel):
    """The best-scoring route provider found that's distinct from the
    primary one. Included whenever a geometrically distinct alternate
    exists, regardless of whether it actually scores better - `is_safer`
    and `score_delta` tell the caller the truth so the UI never claims an
    improvement that isn't real. score_delta is primary_score - alt_score,
    so positive means the alternative is actually safer, zero means tied,
    and negative means it's actually riskier than the primary route."""

    total_distance_meters: float
    total_duration_seconds: float
    overall_risk_score: int
    overall_risk_level: RiskLevel
    segments: List[SegmentRisk]
    is_safer: bool
    score_delta: int


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
    # None when no geometrically distinct alternate route could be found or
    # the alternative lookup failed - not an error, just nothing else to
    # offer. When present, check alternative.is_safer before calling it
    # "safer" - a present alternative is not a guarantee it beats the
    # primary route's score.
    alternative: Optional[RouteAlternative] = None