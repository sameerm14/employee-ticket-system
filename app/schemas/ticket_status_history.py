from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TicketStatusUpdate(BaseModel):
    status: str
    comment: Optional[str] = None


class TicketStatusHistoryResponse(BaseModel):
    id: int
    ticket_id: int
    old_status: Optional[str]
    new_status: str
    changed_by: Optional[int]
    comment: Optional[str]
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )