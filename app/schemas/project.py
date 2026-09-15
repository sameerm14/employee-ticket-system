from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    department_id: int
    priority: str = "MEDIUM"
    status: str = "ACTIVE"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    department_id: int
    priority: str
    status: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class ProjectListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    projects: list[ProjectResponse]