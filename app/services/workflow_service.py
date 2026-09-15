from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.services.notification_service import notify_user
from app.models.ticket import Ticket
from app.models.ticket_status_history import TicketStatusHistory
from app.models.user import User

from app.schemas.ticket_status_history import TicketStatusUpdate


ALLOWED_STATUSES = {
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
    "ON_HOLD",
    "REJECTED",
}


ALLOWED_TRANSITIONS = {
    "OPEN": {
        "ASSIGNED",
        "REJECTED",
    },

    "ASSIGNED": {
        "IN_PROGRESS",
        "ON_HOLD",
        "REJECTED",
    },

    "IN_PROGRESS": {
        "RESOLVED",
        "ON_HOLD",
    },

    "ON_HOLD": {
        "IN_PROGRESS",
        "REJECTED",
    },

    "RESOLVED": {
        "CLOSED",
        "REOPENED",
    },

    "CLOSED": {
        "REOPENED",
    },

    "REOPENED": {
        "ASSIGNED",
        "IN_PROGRESS",
    },

    "REJECTED": {
        "REOPENED",
    },
}


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


def update_ticket_status(
    db: Session,
    ticket_id: int,
    status_data: TicketStatusUpdate,
    current_user: User
):
    ticket = get_ticket_or_404(
        db,
        ticket_id
    )
    if current_user.role == "EMPLOYEE":
        if (
            ticket.created_by != current_user.id
            and ticket.assigned_user_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only change the status of your own or assigned tickets"
            )
    

    new_status = status_data.status.upper()
    old_status = ticket.status

    # Validate status name
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid status. Allowed values: "
                "OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, "
                "CLOSED, REOPENED, ON_HOLD, REJECTED"
            )
        )

    # Same status
    if new_status == old_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is already in this status"
        )

    # Validate transition
    allowed_next_statuses = ALLOWED_TRANSITIONS.get(
        old_status,
        set()
    )

    if new_status not in allowed_next_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot change ticket status "
                f"from {old_status} to {new_status}"
            )
        )

    # Only assigned tickets can move to IN_PROGRESS
    if new_status == "IN_PROGRESS":

        if ticket.assigned_user_id is None and \
           ticket.assigned_team_id is None:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Ticket must be assigned before "
                    "moving to IN_PROGRESS"
                )
            )

    # Update ticket status
    ticket.status = new_status

    # Set resolved time
    if new_status == "RESOLVED":
        ticket.resolved_at = datetime.utcnow()

    # Set closed time
    if new_status == "CLOSED":
        ticket.closed_at = datetime.utcnow()

    # Reopened ticket should not keep closed time
    if new_status == "REOPENED":
        ticket.closed_at = None

    # Create history record
    history = TicketStatusHistory(
        ticket_id=ticket.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=current_user.id,
        comment=status_data.comment,
    )

    db.add(history)

    db.commit()

    db.refresh(ticket)
    db.refresh(history)

        # Notify ticket creator
    notify_user(
        db=db,
        user_id=ticket.created_by,
        title="Ticket Status Updated",
        message=(
            f"Ticket {ticket.ticket_number} status changed "
            f"from {old_status} to {new_status}."
        ),
        notification_type="STATUS_CHANGED",
        ticket_id=ticket.id
    )

    return ticket, history


def get_ticket_status_history(
    db: Session,
    ticket_id: int
):
    get_ticket_or_404(
        db,
        ticket_id
    )

    return db.query(
        TicketStatusHistory
    ).filter(
        TicketStatusHistory.ticket_id == ticket_id
    ).order_by(
        TicketStatusHistory.created_at.asc()
    ).all()