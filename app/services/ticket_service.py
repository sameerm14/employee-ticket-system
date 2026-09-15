from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.services.notification_service import notify_user
from app.models.ticket import Ticket
from app.models.department import Department
from app.models.project import Project
from app.models.user import User
from app.schemas.ticket import TicketCreate, TicketUpdate
from sqlalchemy import or_

ALLOWED_PRIORITIES = {
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
}


def validate_priority(priority: str):
    priority = priority.upper()

    if priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid priority. Allowed values: "
                "LOW, MEDIUM, HIGH, CRITICAL"
            )
        )

    return priority


def validate_department(
    db: Session,
    department_id: int
):
    department = db.query(Department).filter(
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
            detail="Cannot create ticket in an inactive department"
        )

    return department


def validate_project(
    db: Session,
    project_id: int | None,
    department_id: int
):
    if project_id is None:
        return None

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create ticket for an inactive project"
        )

    if project.department_id != department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project does not belong to the selected department"
        )

    return project


def generate_ticket_number(db: Session):
    last_ticket = db.query(Ticket).order_by(
        Ticket.id.desc()
    ).first()

    if last_ticket is None:
        next_id = 1
    else:
        next_id = last_ticket.id + 1

    ticket_number = f"TKT-{next_id:06d}"

    # Extra safety check
    while db.query(Ticket).filter(
        Ticket.ticket_number == ticket_number
    ).first():
        next_id += 1
        ticket_number = f"TKT-{next_id:06d}"

    return ticket_number


def create_ticket(
    db: Session,
    ticket_data: TicketCreate,
    current_user: User
):
    # Validate department
    validate_department(
        db,
        ticket_data.department_id
    )

    # Validate project
    validate_project(
        db,
        ticket_data.project_id,
        ticket_data.department_id
    )

    # Validate priority
    priority = validate_priority(
        ticket_data.priority
    )

    ticket_number = generate_ticket_number(db)

    ticket = Ticket(
        ticket_number=ticket_number,
        title=ticket_data.title,
        description=ticket_data.description,
        department_id=ticket_data.department_id,
        project_id=ticket_data.project_id,
        created_by=current_user.id,
        priority=priority,
        status="OPEN",
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Notify ticket creator
    notify_user(
        db=db,
        user_id=current_user.id,
        title="Ticket Created",
        message=(
            f"Your ticket {ticket.ticket_number} "
            f"has been created successfully."
        ),
        notification_type="TICKET_CREATED",
        ticket_id=ticket.id
    )

    return ticket


def get_tickets(
    db: Session,
    current_user: User,
    search: str | None = None,
    department_id: int | None = None,
    project_id: int | None = None,
    status_filter: str | None = None,
    priority: str | None = None,
    assigned_user_id: int | None = None,
    page: int = 1,
    page_size: int = 10
):
    query = db.query(Ticket)

    # EMPLOYEE can only see tickets they create
    if current_user.role == "EMPLOYEE":
        query = query.filter(
            or_(
                Ticket.created_by == current_user.id,
                Ticket.assigned_user_id == current_user.id
            )
        )

    # TEAM_LEAD can see tickets in their department/team
    elif current_user.role == "TEAM_LEAD":
        if current_user.department_id is not None:
            query = query.filter(
                Ticket.department_id == current_user.department_id
            )
        else:
            query = query.filter(
                Ticket.created_by == current_user.id
            )

    # ADMIN can see everything

    # Search
    if search:
        search_value = f"%{search}%"

        query = query.filter(
            (Ticket.ticket_number.like(search_value))
            | (Ticket.title.like(search_value))
        )

    # Department filter
    if department_id is not None:
        query = query.filter(
            Ticket.department_id == department_id
        )

    # Project filter
    if project_id is not None:
        query = query.filter(
            Ticket.project_id == project_id
        )

    # Status filter
    if status_filter is not None:
        query = query.filter(
            Ticket.status == status_filter.upper()
        )

    # Priority filter
    if priority is not None:
        priority = validate_priority(priority)

        query = query.filter(
            Ticket.priority == priority
        )

    # Assigned user filter
    if assigned_user_id is not None:
        query = query.filter(
            Ticket.assigned_user_id == assigned_user_id
        )

    # Total records
    total = query.count()

    # Pagination
    offset = (page - 1) * page_size

    tickets = query.order_by(
        Ticket.created_at.desc()
    ).offset(offset).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (
            (total + page_size - 1) // page_size
            if total > 0
            else 0
        ),
        "tickets": tickets
    }


def get_ticket(
    db: Session,
    ticket_id: int,
    current_user: User
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    # Employee can only view their own ticket
    if current_user.role == "EMPLOYEE":
        if (
            ticket.created_by != current_user.id
            and ticket.assigned_user_id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this ticket"
            )

    # Team lead can only view department tickets
    elif current_user.role == "TEAM_LEAD":
        if ticket.department_id != current_user.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this ticket"
            )

    return ticket


def update_ticket(
    db: Session,
    ticket_id: int,
    ticket_data: TicketUpdate,
    current_user: User
):
    ticket = get_ticket(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user
    )

    # Only ADMIN or ticket creator can update basic ticket information
    if current_user.role not in {"ADMIN", "TEAM_LEAD"}:
        if ticket.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own tickets"
            )

    new_department_id = (
        ticket_data.department_id
        if ticket_data.department_id is not None
        else ticket.department_id
    )

    new_project_id = (
        ticket_data.project_id
        if ticket_data.project_id is not None
        else ticket.project_id
    )

    # Validate department
    validate_department(
        db,
        new_department_id
    )

    # Validate project
    validate_project(
        db,
        new_project_id,
        new_department_id
    )

    # Update title
    if ticket_data.title is not None:
        ticket.title = ticket_data.title

    # Update description
    if ticket_data.description is not None:
        ticket.description = ticket_data.description

    # Update department
    if ticket_data.department_id is not None:
        ticket.department_id = ticket_data.department_id

    # Update project
    if ticket_data.project_id is not None:
        ticket.project_id = ticket_data.project_id

    # Update priority
    if ticket_data.priority is not None:
        ticket.priority = validate_priority(
            ticket_data.priority
        )

    db.commit()
    db.refresh(ticket)

    return ticket


def delete_ticket(
    db: Session,
    ticket_id: int,
    current_user: User
):
    ticket = get_ticket(
        db=db,
        ticket_id=ticket_id,
        current_user=current_user
    )

    # Only ADMIN can delete tickets
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required to delete tickets"
        )

    db.delete(ticket)
    db.commit()

    return {
        "message": "Ticket deleted successfully"
    }