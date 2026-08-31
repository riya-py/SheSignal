"""
Report request/response schemas.

Validation here is the server-side source of truth — the frontend (Phase 7)
may duplicate it for UX, but this is what actually gets enforced.

ReportResponse deliberately has NO reporter_id field, so even if a future
code change accidentally passed one through, FastAPI's response_model would
strip it before it reaches the client.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

ReportCategory = Literal[
    "harassment",
    "poor_lighting",
    "lack_of_security",
    "isolated_area",
    "unsafe_transit",
    "suspicious_activity",
    "other",
]


class ReportCreate(BaseModel):
    category: ReportCategory
    description: str = Field(min_length=1, max_length=1000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    occurred_at: Optional[datetime] = None

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("description cannot be empty or whitespace only")
        return v

    @field_validator("occurred_at")
    @classmethod
    def occurred_at_not_in_future(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return v
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v > datetime.now(timezone.utc) + timedelta(minutes=5):
            raise ValueError("occurred_at cannot be in the future")
        return v


class ReportResponse(BaseModel):
    id: UUID
    category: ReportCategory
    description: str
    latitude: float
    longitude: float
    occurred_at: datetime
    created_at: datetime
    status: str


class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    limit: int
    offset: int


class ReportFlagResponse(BaseModel):
    flag_count: int
    status: str | None  # non-null only when this flag pushed it into quarantine