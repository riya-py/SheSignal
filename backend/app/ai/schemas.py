from typing import List, Literal

from pydantic import BaseModel, field_validator

from app.models.report import ReportCategory

Severity = Literal["low", "medium", "high"]
TimeContext = Literal["morning", "afternoon", "evening", "night", "unknown"]

ALLOWED_FACTORS = {
    "poor_lighting",
    "isolated_area",
    "following",
    "harassment",
    "no_security_presence",
    "crowded_unsafe",
    "unsafe_transit_exit",
    "verbal_abuse",
    "physical_contact",
    "suspicious_vehicle",
}

MAX_FACTORS = 6


class AIExtractionResult(BaseModel):
    category: ReportCategory
    severity: Severity
    time_context: TimeContext
    factors: List[str] = []

    @field_validator("factors")
    @classmethod
    def filter_and_cap_factors(cls, v: List[str]) -> List[str]:
        cleaned = [f.strip().lower() for f in v if isinstance(f, str)]
        cleaned = [f for f in cleaned if f in ALLOWED_FACTORS]
        # de-dupe while preserving order
        seen = set()
        deduped = []
        for f in cleaned:
            if f not in seen:
                seen.add(f)
                deduped.append(f)
        return deduped[:MAX_FACTORS]