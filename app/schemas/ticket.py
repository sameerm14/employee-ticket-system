from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TicketCreate(BaseModel):
    title: str
    description: str
    department_id: int
    project_id: Optional[int] = None
    priority: str = "MEDIUM"


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    project_id: Optional[int] = None
    priority: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    department_id: int
    project_id: Optional[int]
    created_by: int
    assigned_user_id: Optional[int]
    assigned_team_id: Optional[int]
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True
    )


class TicketListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    tickets: list[TicketResponse]