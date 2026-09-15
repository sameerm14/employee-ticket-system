from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TicketAssignmentCreate(BaseModel):
    ticket_id: int
    user_id: Optional[int] = None
    team_id: Optional[int] = None
    reason: Optional[str] = None


class TicketAssignmentResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: Optional[int]
    team_id: Optional[int]
    assigned_by: Optional[int]
    assigned_at: datetime
    unassigned_at: Optional[datetime]
    reason: Optional[str]

    model_config = ConfigDict(
        from_attributes=True
    )


class TeamWorkloadResponse(BaseModel):
    team_id: int
    total_members: int
    assigned_tickets: int
    members: list