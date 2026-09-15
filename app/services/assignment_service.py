from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.services.notification_service import notify_user
from app.models.ticket import Ticket
from app.models.ticket_assignment import TicketAssignment
from app.models.user import User
from app.models.team import Team
from app.models.department import Department
from app.schemas.ticket_assignment import TicketAssignmentCreate


def get_ticket_or_404(
    db: Session,
    ticket_id: int
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    return ticket


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

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign ticket to an inactive user"
        )

    return user


def get_team_or_404(
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

    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign ticket to an inactive team"
        )

    return team


def validate_user_for_ticket(
    user: User,
    ticket: Ticket
):
    if user.department_id != ticket.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not belong to the ticket department"
        )

    if ticket.assigned_team_id is not None:
        if user.team_id != ticket.assigned_team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not belong to the assigned team"
            )


def validate_team_for_ticket(
    team: Team,
    ticket: Ticket
):
    if team.department_id != ticket.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team does not belong to the ticket department"
        )


def close_current_assignment(
    db: Session,
    ticket_id: int
):
    current_assignment = db.query(
        TicketAssignment
    ).filter(
        TicketAssignment.ticket_id == ticket_id,
        TicketAssignment.unassigned_at.is_(None)
    ).first()

    if current_assignment:
        current_assignment.unassigned_at = datetime.utcnow()

    return current_assignment


def validate_assignment_permission(
    current_user: User,
    ticket: Ticket
):
    # Admin can assign any ticket
    if current_user.role == "ADMIN":
        return

    # Team Lead can only assign tickets
    # belonging to their department
    if current_user.role == "TEAM_LEAD":
        if current_user.department_id != ticket.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only assign tickets from your department"
            )

        return

    # Employees cannot assign tickets
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not allowed to assign tickets"
    )

def create_assignment(
    db: Session,
    assignment_data: TicketAssignmentCreate,
    current_user: User
):
    ticket = get_ticket_or_404(
        db,
        assignment_data.ticket_id
    )

    validate_assignment_permission(
        current_user=current_user,
        ticket=ticket
    )

    # Assignment requires either a user or a team
    if (
        assignment_data.user_id is None
        and assignment_data.team_id is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either user_id or team_id is required"
        )

    # Do not accept both
    if (
        assignment_data.user_id is not None
        and assignment_data.team_id is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either user_id or team_id, not both"
        )

    assigned_user = None
    assigned_team = None

    # User assignment
    if assignment_data.user_id is not None:
        assigned_user = get_user_or_404(
            db,
            assignment_data.user_id
        )

        validate_user_for_ticket(
            assigned_user,
            ticket
        )

    # Team assignment
    if assignment_data.team_id is not None:
        assigned_team = get_team_or_404(
            db,
            assignment_data.team_id
        )

        validate_team_for_ticket(
            assigned_team,
            ticket
        )

    # Close previous assignment
    close_current_assignment(
        db,
        ticket.id
    )

    # Create assignment history
    assignment = TicketAssignment(
        ticket_id=ticket.id,
        user_id=(
            assigned_user.id
            if assigned_user
            else None
        ),
        team_id=(
            assigned_team.id
            if assigned_team
            else None
        ),
        assigned_by=current_user.id,
        reason=assignment_data.reason,
    )

    db.add(assignment)

    # Update ticket
    ticket.assigned_user_id = (
        assigned_user.id
        if assigned_user
        else None
    )

    ticket.assigned_team_id = (
        assigned_team.id
        if assigned_team
        else None
    )

    # Ticket becomes assigned
    if ticket.status == "OPEN":
        ticket.status = "ASSIGNED"

    db.commit()
    db.refresh(assignment)

        # Send notification to assigned user
    if assigned_user:
        notify_user(
            db=db,
            user_id=assigned_user.id,
            title="Ticket Assigned",
            message=f"Ticket {ticket.ticket_number} has been assigned to you.",
            notification_type="TICKET_ASSIGNED",
            ticket_id=ticket.id
        )

    return assignment


def assign_ticket_to_user(
    db: Session,
    ticket_id: int,
    user_id: int,
    current_user: User,
    reason: str | None = None
):
    assignment_data = TicketAssignmentCreate(
        ticket_id=ticket_id,
        user_id=user_id,
        reason=reason
    )

    return create_assignment(
        db=db,
        assignment_data=assignment_data,
        current_user=current_user
    )


def assign_ticket_to_team(
    db: Session,
    ticket_id: int,
    team_id: int,
    current_user: User,
    reason: str | None = None
):
    assignment_data = TicketAssignmentCreate(
        ticket_id=ticket_id,
        team_id=team_id,
        reason=reason
    )

    return create_assignment(
        db=db,
        assignment_data=assignment_data,
        current_user=current_user
    )


def unassign_ticket(
    db: Session,
    ticket_id: int,
    current_user: User,
    reason: str | None = None
):
    ticket = get_ticket_or_404(
        db,
        ticket_id
    )

    if (
        ticket.assigned_user_id is None
        and ticket.assigned_team_id is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is not currently assigned"
        )

    current_assignment = close_current_assignment(
        db,
        ticket.id
    )

    if current_assignment and reason:
        current_assignment.reason = reason

    ticket.assigned_user_id = None
    ticket.assigned_team_id = None

    # Return ticket to OPEN
    if ticket.status == "ASSIGNED":
        ticket.status = "OPEN"

    db.commit()

    return {
        "message": "Ticket unassigned successfully"
    }


def get_current_assignment(
    db: Session,
    ticket_id: int
):
    get_ticket_or_404(
        db,
        ticket_id
    )

    assignment = db.query(
        TicketAssignment
    ).filter(
        TicketAssignment.ticket_id == ticket_id,
        TicketAssignment.unassigned_at.is_(None)
    ).first()

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket is not currently assigned"
        )

    return assignment


def get_assignment_history(
    db: Session,
    ticket_id: int
):
    get_ticket_or_404(
        db,
        ticket_id
    )

    return db.query(
        TicketAssignment
    ).filter(
        TicketAssignment.ticket_id == ticket_id
    ).order_by(
        TicketAssignment.assigned_at.desc()
    ).all()


def get_user_workload(
    db: Session,
    user_id: int
):
    user = get_user_or_404(
        db,
        user_id
    )

    workload = db.query(
        TicketAssignment
    ).filter(
        TicketAssignment.user_id == user.id,
        TicketAssignment.unassigned_at.is_(None)
    ).count()

    return {
        "user_id": user.id,
        "user_name": user.full_name,
        "active_tickets": workload
    }


def get_team_workload(
    db: Session,
    team_id: int
):
    team = get_team_or_404(
        db,
        team_id
    )

    members = db.query(User).filter(
        User.team_id == team.id,
        User.is_active == True
    ).all()

    result = []

    total_tickets = 0

    for member in members:
        ticket_count = db.query(
            TicketAssignment
        ).filter(
            TicketAssignment.user_id == member.id,
            TicketAssignment.unassigned_at.is_(None)
        ).count()

        total_tickets += ticket_count

        result.append({
            "user_id": member.id,
            "user_name": member.full_name,
            "active_tickets": ticket_count
        })

    return {
        "team_id": team.id,
        "total_members": len(members),
        "assigned_tickets": total_tickets,
        "members": result
    }


def auto_assign_ticket(
    db: Session,
    ticket_id: int,
    current_user: User
):
    ticket = get_ticket_or_404(
        db,
        ticket_id
    )

    # Ticket must not already be assigned
    if (
        ticket.assigned_user_id is not None
        or ticket.assigned_team_id is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is already assigned"
        )

    # Find active users in same department
    users = db.query(User).filter(
        User.department_id == ticket.department_id,
        User.is_active == True
    ).all()

    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active users available in this department"
        )

    # Find user with lowest active workload
    selected_user = None
    lowest_workload = None

    for user in users:

        workload = db.query(
            TicketAssignment
        ).filter(
            TicketAssignment.user_id == user.id,
            TicketAssignment.unassigned_at.is_(None)
        ).count()

        if (
            lowest_workload is None
            or workload < lowest_workload
        ):
            selected_user = user
            lowest_workload = workload

    assignment_data = TicketAssignmentCreate(
        ticket_id=ticket.id,
        user_id=selected_user.id,
        reason="Automatically assigned based on lowest workload"
    )

    return create_assignment(
        db=db,
        assignment_data=assignment_data,
        current_user=current_user
    )