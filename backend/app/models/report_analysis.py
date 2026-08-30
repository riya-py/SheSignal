from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel

AnalysisStatus = Literal["pending", "completed", "failed"]


class ReportAnalysisResponse(BaseModel):
    report_id: UUID
    status: AnalysisStatus
    category: Optional[str] = None
    severity: Optional[str] = None
    time_context: Optional[str] = None
    factors: Optional[List[str]] = None