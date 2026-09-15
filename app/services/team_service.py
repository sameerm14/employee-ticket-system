from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math
from app.models.team import Team
from app.models.department import Department
from app.schemas.team import TeamCreate, TeamUpdate


def create_team(
    db: Session,
    team_data: TeamCreate
):
    # Check department exists
    department = db.query(Department).filter(
        Department.id == team_data.department_id
    ).first()

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    if not department.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create team in an inactive department"
        )

    # Check duplicate team name inside same department
    existing_team = db.query(Team).filter(
        Team.name == team_data.name,
        Team.department_id == team_data.department_id
    ).first()

    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team already exists in this department"
        )

    team = Team(
        name=team_data.name,
        description=team_data.description,
        department_id=team_data.department_id,
    )

    db.add(team)
    db.commit()
    db.refresh(team)

    return team


def get_teams(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    department_id: int | None = None,
    is_active: bool | None = None
):
    query = db.query(Team)

    # Search by team name
    if search:
        query = query.filter(
            Team.name.ilike(
                f"%{search}%"
            )
        )

    # Department filter
    if department_id is not None:
        query = query.filter(
            Team.department_id == department_id
        )

    # Active / inactive filter
    if is_active is not None:
        query = query.filter(
            Team.is_active == is_active
        )

    total = query.count()

    total_pages = (
        math.ceil(total / page_size)
        if total > 0
        else 0
    )

    teams = query.order_by(
        Team.created_at.desc()
    ).offset(
        (page - 1) * page_size
    ).limit(
        page_size
    ).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "teams": teams
    }


def get_team(
    db: Session,
    team_id: int
):
    team = db.query(Team).filter(
        Team.id == team_id
    ).first()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    return team


def update_team(
    db: Session,
    team_id: int,
    team_data: TeamUpdate
):
    team = get_team(
        db=db,
        team_id=team_id
    )

    new_department_id = (
        team_data.department_id
        if team_data.department_id is not None
        else team.department_id
    )

    new_name = (
        team_data.name
        if team_data.name is not None
        else team.name
    )

    # If department is being changed, verify it exists
    department = db.query(Department).filter(
        Department.id == new_department_id
    ).first()

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    if not department.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign team to an inactive department"
        )

    # Check duplicate name within target department
    existing_team = db.query(Team).filter(
        Team.name == new_name,
        Team.department_id == new_department_id,
        Team.id != team_id
    ).first()

    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name already exists in this department"
        )

    if team_data.name is not None:
        team.name = team_data.name

    if team_data.description is not None:
        team.description = team_data.description

    if team_data.department_id is not None:
        team.department_id = team_data.department_id

    if team_data.is_active is not None:
        team.is_active = team_data.is_active

    db.commit()
    db.refresh(team)

    return team


def delete_team(
    db: Session,
    team_id: int
):
    team = get_team(
        db=db,
        team_id=team_id
    )

    db.delete(team)
    db.commit()

    return {
        "message": "Team deleted successfully"
    }