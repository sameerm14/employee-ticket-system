from typing import Optional

from pydantic import BaseModel, ConfigDict


class PermissionCreate(BaseModel):
    name: str
    description: Optional[str] = None


class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PermissionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)