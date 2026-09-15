from fastapi import (
    APIRouter,
    Depends,
    status
)

from sqlalchemy.orm import Session
from fastapi import Query
from app.core.database import get_db

from app.core.dependencies import (
    get_current_user,
    get_current_admin
)

from app.models.user import User

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse
)

from app.services.user_service import (
    create_user,
    get_all_users,
    get_user,
    update_user,
    deactivate_user,
    activate_user,
    delete_user
)


router = APIRouter(
    prefix="/api/users",
    tags=["User Management"]
)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create(
    user_data: UserCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_admin
    )
):
    return create_user(
        db=db,
        user_data=user_data
    )


@router.get(
    "",
    response_model=UserListResponse
)
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),

    search: str | None = None,

    role: str | None = None,

    department_id: int | None = None,

    team_id: int | None = None,

    is_active: bool | None = None,

    db: Session = Depends(get_db),

    current_admin: User = Depends(
        get_current_admin
    )
):
    return get_all_users(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        role=role,
        department_id=department_id,
        team_id=team_id,
        is_active=is_active
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_one(
    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_admin
    )
):
    return get_user(
        db=db,
        user_id=user_id
    )


@router.put(
    "/{user_id}",
    response_model=UserResponse
)
def update(
    user_id: int,

    user_data: UserUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_admin
    )
):
    return update_user(
        db=db,
        user_id=user_id,
        user_data=user_data
    )


@router.patch(
    "/{user_id}/deactivate",
    response_model=UserResponse
)
def deactivate(
    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_admin
    )
):
    return deactivate_user(
        db=db,
        user_id=user_id
    )


@router.patch(
    "/{user_id}/activate",
    response_model=UserResponse
)
def activate(
    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_admin
    )
):
    return activate_user(
        db=db,
        user_id=user_id
    )


@router.delete(
    "/{user_id}"
)
def delete(
    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_admin
    )
):
    return delete_user(
        db=db,
        user_id=user_id,
        current_user=current_user
    )