from fastapi import (
    APIRouter,
    Depends,
    Query,
    status
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    TicketListResponse,
)
from app.services.ticket_service import (
    create_ticket,
    get_tickets,
    get_ticket,
    update_ticket,
    delete_ticket,
)


router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"]
)


@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED
)
def create(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_ticket(
        db=db,
        ticket_data=ticket_data,
        current_user=current_user
    )


@router.get(
    "",
    response_model=TicketListResponse
)
def get_all(
    search: str | None = Query(
        default=None,
        description="Search by ticket number or title"
    ),

    department_id: int | None = Query(
        default=None
    ),

    project_id: int | None = Query(
        default=None
    ),

    status_filter: str | None = Query(
        default=None,
        alias="status"
    ),

    priority: str | None = Query(
        default=None
    ),

    assigned_user_id: int | None = Query(
        default=None
    ),

    page: int = Query(
        default=1,
        ge=1
    ),

    page_size: int = Query(
        default=10,
        ge=1,
        le=100
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    return get_tickets(
        db=db,
        current_user=current_user,
        search=search,
        department_id=department_id,
        project_id=project_id,
        status_filter=status_filter,
        priority=priority,
        assigned_user_id=assigned_user_id,
        page=page,
        page_size=page_size
    )


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse
)
def get_one(
    ticket_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    return get_ticket(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user
    )


@router.put(
    "/{ticket_id}",
    response_model=TicketResponse
)
def update(
    ticket_id: int,

    ticket_data: TicketUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    return update_ticket(
        db=db,
        ticket_id=ticket_id,
        ticket_data=ticket_data,
        current_user=current_user
    )


@router.delete(
    "/{ticket_id}"
)
def delete(
    ticket_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    return delete_ticket(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user
    )