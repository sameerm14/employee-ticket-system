from fastapi import (
    APIRouter,
    Depends,
    status,
    Query
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentListResponse,
)
from app.services.department_service import (
    create_department,
    get_departments,
    get_department,
    update_department,
    delete_department,
)


router = APIRouter(
    prefix="/api/departments",
    tags=["Departments"]
)


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create(
    department_data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return create_department(
        db=db,
        department_data=department_data
    )


@router.get(
    "",
    response_model=DepartmentListResponse
)
def list_departments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),

    search: str | None = None,

    is_active: bool | None = None,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return get_departments(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active
    )


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse
)
def get_one(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_department(
        db=db,
        department_id=department_id
    )


@router.put(
    "/{department_id}",
    response_model=DepartmentResponse
)
def update(
    department_id: int,
    department_data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return update_department(
        db=db,
        department_id=department_id,
        department_data=department_data
    )


@router.delete(
    "/{department_id}"
)
def delete(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return delete_department(
        db=db,
        department_id=department_id
    )