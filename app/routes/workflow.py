from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.core.dependencies import (
    get_current_user
)

from app.models.user import User

from app.schemas.ticket import TicketResponse

from app.schemas.ticket_status_history import (
    TicketStatusUpdate,
    TicketStatusHistoryResponse
)

from app.services.workflow_service import (
    update_ticket_status,
    get_ticket_status_history
)


router = APIRouter(
    prefix="/api/workflow",
    tags=["Workflow"]
)


@router.patch(
    "/tickets/{ticket_id}/status",
    response_model=TicketResponse
)
def change_status(
    ticket_id: int,
    status_data: TicketStatusUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    ticket, history = update_ticket_status(
        db=db,
        ticket_id=ticket_id,
        status_data=status_data,
        current_user=current_user
    )

    return ticket


@router.get(
    "/tickets/{ticket_id}/history",
    response_model=list[
        TicketStatusHistoryResponse
    ]
)
def get_history(
    ticket_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return get_ticket_status_history(
        db=db,
        ticket_id=ticket_id
    )