from datetime import datetime
from typing import Dict, List
from uuid import UUID

from pydantic import BaseModel


class PatternResponse(BaseModel):
    id: UUID
    geohash: str
    time_bucket: str
    centroid_latitude: float
    centroid_longitude: float
    report_count: int
    category_breakdown: Dict[str, int]
    factor_breakdown: Dict[str, int]
    first_report_at: datetime
    last_report_at: datetime
    computed_at: datetime


class PatternListResponse(BaseModel):
    items: List[PatternResponse]
    limit: int
    offset: int