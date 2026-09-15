from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "EMPLOYEE"
    department_id: Optional[int] = None
    team_id: Optional[int] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

    role: Optional[str] = None

    department_id: Optional[int] = None
    team_id: Optional[int] = None

    location: Optional[str] = None
    work_mode: Optional[str] = None

    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str

    department_id: Optional[int]
    team_id: Optional[int]

    is_active: bool

    location: Optional[str]
    work_mode: Optional[str]

    model_config = ConfigDict(
        from_attributes=True
    )

class UserListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    users: list[UserResponse]