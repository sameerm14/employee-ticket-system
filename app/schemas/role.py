from typing import Optional

from pydantic import BaseModel, ConfigDict


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)