from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DepartmentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    departments: list[DepartmentResponse]