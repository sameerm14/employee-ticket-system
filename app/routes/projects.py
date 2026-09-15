from fastapi import (
    APIRouter,
    Depends,
    status,
    Query,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_admin
)
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from app.services.project_service import (
    create_project,
    get_projects,
    get_project,
    update_project,
    delete_project,
)


router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"]
)


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def create(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return create_project(
        db=db,
        project_data=project_data
    )


@router.get(
    "",
    response_model=ProjectListResponse
)
def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),

    search: str | None = None,

    department_id: int | None = None,

    priority: str | None = None,

    status: str | None = None,

    is_active: bool | None = None,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return get_projects(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        department_id=department_id,
        priority=priority,
        status=status,
        is_active=is_active
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse
)
def get_one(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_project(
        db=db,
        project_id=project_id
    )


@router.put(
    "/{project_id}",
    response_model=ProjectResponse
)
def update(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return update_project(
        db=db,
        project_id=project_id,
        project_data=project_data
    )


@router.delete(
    "/{project_id}"
)
def delete(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return delete_project(
        db=db,
        project_id=project_id
    )