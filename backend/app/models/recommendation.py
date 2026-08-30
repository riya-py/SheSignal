from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.risk import ContributingFactor


class Recommendation(BaseModel):
    text: str
    factor: Optional[str] = None


class RecommendationResponse(BaseModel):
    latitude: float
    longitude: float
    radius_meters: float
    based_on_reports: int
    based_on_patterns: int
    based_on_factors: List[ContributingFactor]
    user_recommendations: List[Recommendation]
    authority_recommendations: List[Recommendation]
    computed_at: datetime