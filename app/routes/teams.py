from fastapi import (
    APIRouter,
    Depends,
    status,
    Query
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_admin
)
from app.models.user import User
from app.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamListResponse,
)
from app.services.team_service import (
    create_team,
    get_teams,
    get_team,
    update_team,
    delete_team,
)


router = APIRouter(
    prefix="/api/teams",
    tags=["Teams"]
)


@router.post(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED
)
def create(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return create_team(
        db=db,
        team_data=team_data
    )


@router.get(
    "",
    response_model=TeamListResponse
)
def list_teams(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),

    search: str | None = None,

    department_id: int | None = None,

    is_active: bool | None = None,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return get_teams(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        department_id=department_id,
        is_active=is_active
    )


@router.get(
    "/{team_id}",
    response_model=TeamResponse
)
def get_one(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_team(
        db=db,
        team_id=team_id
    )


@router.put(
    "/{team_id}",
    response_model=TeamResponse
)
def update(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return update_team(
        db=db,
        team_id=team_id,
        team_data=team_data
    )


@router.delete(
    "/{team_id}"
)
def delete(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    return delete_team(
        db=db,
        team_id=team_id
    )