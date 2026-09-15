from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import LoginRequest
from app.utils.jwt import (
    create_access_token,
    create_refresh_token,
)
from app.utils.security import (
    hash_password,
    verify_password,
)


def register_user(
    db: Session,
    full_name: str,
    email: str,
    password: str,
    role: str = "EMPLOYEE",
    department_id: int | None = None,
    team_id: int | None = None,
    location: str | None = None,
    work_mode: str | None = None,
):
    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role=role,
        department_id=department_id,
        team_id=team_id,
        location=location,
        work_mode=work_mode,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    login_data: LoginRequest,
):
    user = db.query(User).filter(
        User.email == login_data.email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
    })

    refresh_token = create_refresh_token({
        "sub": str(user.id),
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }