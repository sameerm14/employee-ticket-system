from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user,get_current_admin

from app.models.user import User

from app.schemas.dashboard import TeamLeadDashboardResponse, UserDashboardResponse, AdminDashboardResponse

from app.services.dashboard_service import (
    get_employee_dashboard,
    get_admin_dashboard,
    get_team_lead_dashboard,
)


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/employee",
    response_model=UserDashboardResponse
)
def employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_employee_dashboard(
        db=db,
        current_user=current_user
    )

@router.get(
    "/admin",
    response_model=AdminDashboardResponse
)
def admin_dashboard(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    return get_admin_dashboard(
        db=db,
        current_user=current_admin
    )

@router.get("/team-lead", response_model=TeamLeadDashboardResponse)
def team_lead_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_team_lead_dashboard(
        db=db,
        current_user=current_user
    )