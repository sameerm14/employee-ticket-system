from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math
from app.models.user import User
from app.models.department import Department
from app.models.team import Team
from sqlalchemy import or_
from app.schemas.user import (
    UserCreate,
    UserUpdate
)

from app.utils.security import hash_password


ALLOWED_ROLES = {
    "ADMIN",
    "TEAM_LEAD",
    "EMPLOYEE",
}

ALLOWED_WORK_MODES = {
    "WFO",
    "WFH",
    "HYBRID",
}


def get_user_or_404(
    db: Session,
    user_id: int
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


def validate_role(role: str):
    role = role.upper()

    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid role. Allowed values: "
                "ADMIN, TEAM_LEAD, EMPLOYEE"
            )
        )

    return role


def validate_work_mode(
    work_mode: str | None
):
    if work_mode is None:
        return None

    work_mode = work_mode.upper()

    if work_mode not in ALLOWED_WORK_MODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid work mode. Allowed values: "
                "WFO, WFH, HYBRID"
            )
        )

    return work_mode


def validate_department(
    db: Session,
    department_id: int | None
):
    if department_id is None:
        return None

    department = db.query(
        Department
    ).filter(
        Department.id == department_id
    ).first()

    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    if not department.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign user to an inactive department"
        )

    return department


def validate_team(
    db: Session,
    team_id: int | None,
    department_id: int | None
):
    if team_id is None:
        return None

    team = db.query(
        Team
    ).filter(
        Team.id == team_id
    ).first()

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign user to an inactive team"
        )

    if department_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team cannot be assigned without a department"
        )

    if team.department_id != department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team does not belong to the selected department"
        )

    return team


def create_user(
    db: Session,
    user_data: UserCreate
):
    # Check email
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate role
    role = validate_role(
        user_data.role
    )

    # Validate department
    validate_department(
        db,
        user_data.department_id
    )

    # Validate team
    validate_team(
        db,
        user_data.team_id,
        user_data.department_id
    )

    # Validate work mode
    work_mode = validate_work_mode(
        user_data.work_mode
    )

    user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(
            user_data.password
        ),
        role=role,
        department_id=user_data.department_id,
        team_id=user_data.team_id,
        location=user_data.location,
        work_mode=work_mode,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_all_users(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    role: str | None = None,
    department_id: int | None = None,
    team_id: int | None = None,
    is_active: bool | None = None
):
    query = db.query(User)

    # -----------------------------
    # Search
    # -----------------------------

    if search:
        search_value = f"%{search}%"

        query = query.filter(
            or_(
                User.full_name.ilike(search_value),
                User.email.ilike(search_value)
            )
        )

    # -----------------------------
    # Role filter
    # -----------------------------

    if role:
        query = query.filter(
            User.role == role
        )

    # -----------------------------
    # Department filter
    # -----------------------------

    if department_id is not None:
        query = query.filter(
            User.department_id == department_id
        )

    # -----------------------------
    # Team filter
    # -----------------------------

    if team_id is not None:
        query = query.filter(
            User.team_id == team_id
        )

    # -----------------------------
    # Active / inactive filter
    # -----------------------------

    if is_active is not None:
        query = query.filter(
            User.is_active == is_active
        )

    # -----------------------------
    # Total count
    # -----------------------------

    total = query.count()

    # -----------------------------
    # Pagination
    # -----------------------------

    total_pages = math.ceil(
        total / page_size
    ) if total > 0 else 0

    users = query.order_by(
        User.created_at.desc()
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
        "users": users
    }

def get_user(
    db: Session,
    user_id: int
):
    return get_user_or_404(
        db,
        user_id
    )


def update_user(
    db: Session,
    user_id: int,
    user_data: UserUpdate
):
    user = get_user_or_404(
        db,
        user_id
    )

    # Email update
    if user_data.email is not None:

        existing_user = db.query(
            User
        ).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        user.email = user_data.email

    # Name
    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    # Password
    if user_data.password is not None:
        user.password_hash = hash_password(
            user_data.password
        )

    # Role
    if user_data.role is not None:
        user.role = validate_role(
            user_data.role
        )

    # Determine final department
    new_department_id = (
        user_data.department_id
        if user_data.department_id is not None
        else user.department_id
    )

    # Validate department
    validate_department(
        db,
        new_department_id
    )

    # Determine final team
    new_team_id = (
        user_data.team_id
        if user_data.team_id is not None
        else user.team_id
    )

    # Validate team against final department
    validate_team(
        db,
        new_team_id,
        new_department_id
    )

    # Department
    if user_data.department_id is not None:
        user.department_id = (
            user_data.department_id
        )

    # Team
    if user_data.team_id is not None:
        user.team_id = user_data.team_id

    # Location
    if user_data.location is not None:
        user.location = user_data.location

    # Work mode
    if user_data.work_mode is not None:
        user.work_mode = validate_work_mode(
            user_data.work_mode
        )

    # Active status
    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    db.commit()
    db.refresh(user)

    return user


def deactivate_user(
    db: Session,
    user_id: int
):
    user = get_user_or_404(
        db,
        user_id
    )

    user.is_active = False

    db.commit()
    db.refresh(user)

    return user


def activate_user(
    db: Session,
    user_id: int
):
    user = get_user_or_404(
        db,
        user_id
    )

    user.is_active = True

    db.commit()
    db.refresh(user)

    return user


def delete_user(
    db: Session,
    user_id: int,
    current_user: User
):
    user = get_user_or_404(
        db,
        user_id
    )

    # Prevent admin from deleting himself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }