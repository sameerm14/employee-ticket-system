from fastapi import (
    APIRouter,
    Depends,
    status,
    HTTPException
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.schemas.ticket_assignment import (
    TicketAssignmentCreate,
    TicketAssignmentResponse,
    TeamWorkloadResponse,
)
from app.services.assignment_service import (
    create_assignment,
    assign_ticket_to_user,
    assign_ticket_to_team,
    unassign_ticket,
    get_current_assignment,
    get_assignment_history,
    get_user_workload,
    get_team_workload,
    auto_assign_ticket,
)


router = APIRouter(
    prefix="/api/assignments",
    tags=["Ticket Assignments"]
)


@router.post(
    "",
    response_model=TicketAssignmentResponse,
    status_code=status.HTTP_201_CREATED
)
def assign_ticket(
    assignment_data: TicketAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_assignment(
        db=db,
        assignment_data=assignment_data,
        current_user=current_user
    )


@router.post(
    "/user/{ticket_id}/{user_id}",
    response_model=TicketAssignmentResponse,
    status_code=status.HTTP_201_CREATED
)
def assign_to_user(
    ticket_id: int,
    user_id: int,
    reason: str | None = None,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    return assign_ticket_to_user(
        db=db,
        ticket_id=ticket_id,
        user_id=user_id,
        current_user=current_user,
        reason=reason
    )


@router.post(
    "/team/{ticket_id}/{team_id}",
    response_model=TicketAssignmentResponse,
    status_code=status.HTTP_201_CREATED
)
def assign_to_team(
    ticket_id: int,
    team_id: int,
    reason: str | None = None,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    return assign_ticket_to_team(
        db=db,
        ticket_id=ticket_id,
        team_id=team_id,
        current_user=current_user,
        reason=reason
    )


@router.post(
    "/auto/{ticket_id}",
    response_model=TicketAssignmentResponse,
    status_code=status.HTTP_201_CREATED
)
def auto_assign(
    ticket_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    return auto_assign_ticket(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user
    )


@router.delete(
    "/{ticket_id}"
)
def unassign(
    ticket_id: int,
    reason: str | None = None,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    return unassign_ticket(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user,
        reason=reason
    )


@router.get(
    "/{ticket_id}/current",
    response_model=TicketAssignmentResponse
)
def current_assignment(
    ticket_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_admin)
):
    return get_current_assignment(
        db=db,
        ticket_id=ticket_id
    )


@router.get(
    "/{ticket_id}/history",
    response_model=list[TicketAssignmentResponse]
)
def assignment_history(
    ticket_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_admin)
):
    return get_assignment_history(
        db=db,
        ticket_id=ticket_id
    )


@router.get(
    "/workload/user/{user_id}"
)
def user_workload(
    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_admin)
):
    return get_user_workload(
        db=db,
        user_id=user_id
    )


@router.get(
    "/workload/team/{team_id}",
    response_model=TeamWorkloadResponse
)
def team_workload(
    team_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_admin)
):
    return get_team_workload(
        db=db,
        team_id=team_id
    )


@router.get(
    "/team-lead/workload",
    response_model=TeamWorkloadResponse
)
def team_lead_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "TEAM_LEAD":
        raise HTTPException(
            status_code=403,
            detail="Team Lead access required"
        )

    if current_user.team_id is None:
        raise HTTPException(
            status_code=400,
            detail="Team Lead is not assigned to a team"
        )

    return get_team_workload(
        db=db,
        team_id=current_user.team_id
    )

