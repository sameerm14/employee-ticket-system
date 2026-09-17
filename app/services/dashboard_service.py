from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.ticket import Ticket
from app.models.user import User

from app.models.department import Department
from app.models.team import Team
from app.models.project import Project

def get_employee_dashboard(
    db: Session,
    current_user: User
):
    # ---------------------------------
    # Tickets created by the employee
    # ---------------------------------
    my_tickets_query = db.query(Ticket).filter(
        Ticket.created_by == current_user.id
    )

    total_tickets = my_tickets_query.count()

    open_tickets = my_tickets_query.filter(
        Ticket.status == "OPEN"
    ).count()

    assigned_tickets = my_tickets_query.filter(
        Ticket.status == "ASSIGNED"
    ).count()

    in_progress_tickets = my_tickets_query.filter(
        Ticket.status == "IN_PROGRESS"
    ).count()

    resolved_tickets = my_tickets_query.filter(
        Ticket.status == "RESOLVED"
    ).count()

    closed_tickets = my_tickets_query.filter(
        Ticket.status == "CLOSED"
    ).count()

    on_hold_tickets = my_tickets_query.filter(
        Ticket.status == "ON_HOLD"
    ).count()

    rejected_tickets = my_tickets_query.filter(
        Ticket.status == "REJECTED"
    ).count()

    reopened_tickets = my_tickets_query.filter(
        Ticket.status == "REOPENED"
    ).count()

    # ---------------------------------
    # Priority counts
    # ---------------------------------

    low_priority = my_tickets_query.filter(
        Ticket.priority == "LOW"
    ).count()

    medium_priority = my_tickets_query.filter(
        Ticket.priority == "MEDIUM"
    ).count()

    high_priority = my_tickets_query.filter(
        Ticket.priority == "HIGH"
    ).count()

    critical_priority = my_tickets_query.filter(
        Ticket.priority == "CRITICAL"
    ).count()

    # ---------------------------------
    # Tickets assigned to employee
    # ---------------------------------

    assigned_to_me = db.query(Ticket).filter(
        Ticket.assigned_user_id == current_user.id
    ).count()

    # ---------------------------------
    # Department information
    # ---------------------------------

    # ---------------------------------
# Department information
# ---------------------------------

    department_name = None
    department_tickets = 0

    if current_user.department_id is not None:

        department = db.query(Department).filter(
            Department.id == current_user.department_id
        ).first()

        if department:
            department_name = department.name

        department_tickets = db.query(Ticket).filter(
            Ticket.department_id == current_user.department_id
        ).count()

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "department_id": current_user.department_id,
            "team_id": current_user.team_id
        },

        "ticket_summary": {
            "total": total_tickets,
            "open": open_tickets,
            "in_progress": in_progress_tickets,
            "resolved": resolved_tickets,
            "closed": closed_tickets,
            "on_hold": on_hold_tickets,
            "reopened": reopened_tickets,
            "rejected": rejected_tickets
        },

        "priority_summary": {
            "low": low_priority,
            "medium": medium_priority,
            "high": high_priority,
            "critical": critical_priority
        },

        "assignment_summary": {
            "assigned_to_me": assigned_to_me
        },

        "department_summary": {
            "department_id": current_user.department_id,
            "department_name": department_name,
            "total_department_tickets": department_tickets
        }
    }

def get_admin_dashboard(
    db: Session,
    current_user: User
):
    # ---------------------------------
    # Overview
    # ---------------------------------

    total_users = db.query(User).count()

    active_users = db.query(User).filter(
        User.is_active == True
    ).count()

    inactive_users = db.query(User).filter(
        User.is_active == False
    ).count()

    total_departments = db.query(
        Department
    ).count()

    active_departments = db.query(
        Department
    ).filter(
        Department.is_active == True
    ).count()

    total_teams = db.query(Team).count()

    active_teams = db.query(Team).filter(
        Team.is_active == True
    ).count()

    total_projects = db.query(Project).count()

    active_projects = db.query(Project).filter(
        Project.is_active == True
    ).count()

    total_tickets = db.query(Ticket).count()

    # ---------------------------------
    # Ticket Status
    # ---------------------------------

    open_tickets = db.query(Ticket).filter(
        Ticket.status == "OPEN"
    ).count()

    assigned_tickets = db.query(Ticket).filter(
        Ticket.status == "ASSIGNED"
    ).count()

    in_progress_tickets = db.query(Ticket).filter(
        Ticket.status == "IN_PROGRESS"
    ).count()

    resolved_tickets = db.query(Ticket).filter(
        Ticket.status == "RESOLVED"
    ).count()

    closed_tickets = db.query(Ticket).filter(
        Ticket.status == "CLOSED"
    ).count()

    on_hold_tickets = db.query(Ticket).filter(
        Ticket.status == "ON_HOLD"
    ).count()

    reopened_tickets = db.query(Ticket).filter(
        Ticket.status == "REOPENED"
    ).count()

    rejected_tickets = db.query(Ticket).filter(
        Ticket.status == "REJECTED"
    ).count()

    # ---------------------------------
    # Ticket Priority
    # ---------------------------------

    low_priority = db.query(Ticket).filter(
        Ticket.priority == "LOW"
    ).count()

    medium_priority = db.query(Ticket).filter(
        Ticket.priority == "MEDIUM"
    ).count()

    high_priority = db.query(Ticket).filter(
        Ticket.priority == "HIGH"
    ).count()

    critical_priority = db.query(Ticket).filter(
        Ticket.priority == "CRITICAL"
    ).count()

    # ---------------------------------
    # Tickets by Department
    # ---------------------------------

    department_results = db.query(
        Department.id,
        Department.name,
        func.count(Ticket.id)
    ).outerjoin(
        Ticket,
        Ticket.department_id == Department.id
    ).group_by(
        Department.id,
        Department.name
    ).all()

    tickets_by_department = [
        {
            "department_id": department_id,
            "department_name": department_name,
            "ticket_count": ticket_count
        }
        for department_id, department_name, ticket_count
        in department_results
    ]

    # ---------------------------------
    # Tickets by Project
    # ---------------------------------

    project_results = db.query(
        Project.id,
        Project.name,
        func.count(Ticket.id)
    ).outerjoin(
        Ticket,
        Ticket.project_id == Project.id
    ).group_by(
        Project.id,
        Project.name
    ).all()

    tickets_by_project = [
        {
            "project_id": project_id,
            "project_name": project_name,
            "ticket_count": ticket_count
        }
        for project_id, project_name, ticket_count
        in project_results
    ]

    # ---------------------------------
    # Tickets by Team
    # ---------------------------------

    team_results = db.query(
        Team.id,
        Team.name,
        func.count(Ticket.id)
    ).outerjoin(
        Ticket,
        Ticket.assigned_team_id == Team.id
    ).group_by(
        Team.id,
        Team.name
    ).all()

    tickets_by_team = [
        {
            "team_id": team_id,
            "team_name": team_name,
            "ticket_count": ticket_count
        }
        for team_id, team_name, ticket_count
        in team_results
    ]

    # ---------------------------------
    # Resolution Summary
    # ---------------------------------

    resolved_with_time = db.query(Ticket).filter(
        Ticket.resolved_at.isnot(None),
        Ticket.created_at.isnot(None)
    ).all()

    resolution_times = []

    for ticket in resolved_with_time:
        if ticket.resolved_at and ticket.created_at:
            duration = (
                ticket.resolved_at - ticket.created_at
            ).total_seconds()

            resolution_times.append(duration)

    if resolution_times:
        average_resolution_seconds = (
            sum(resolution_times) /
            len(resolution_times)
        )
    else:
        average_resolution_seconds = 0

    return {
        "overview": {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,

            "total_departments": total_departments,
            "active_departments": active_departments,

            "total_teams": total_teams,
            "active_teams": active_teams,

            "total_projects": total_projects,
            "active_projects": active_projects,

            "total_tickets": total_tickets
        },

        "ticket_status": {
            "open": open_tickets,
            "assigned": assigned_tickets,
            "in_progress": in_progress_tickets,
            "resolved": resolved_tickets,
            "closed": closed_tickets,
            "on_hold": on_hold_tickets,
            "reopened": reopened_tickets,
            "rejected": rejected_tickets
        },

        "ticket_priority": {
            "low": low_priority,
            "medium": medium_priority,
            "high": high_priority,
            "critical": critical_priority
        },

        "tickets_by_department": tickets_by_department,

        "tickets_by_project": tickets_by_project,

        "tickets_by_team": tickets_by_team,

        "resolution_summary": {
            "resolved_tickets": resolved_tickets,
            "average_resolution_seconds": round(
                average_resolution_seconds,
                2
            )
        }
    }

def get_team_lead_dashboard(db: Session, current_user: User):
    if current_user.role != "TEAM_LEAD":
        raise HTTPException(
            status_code=403,
            detail="Team Lead access required"
        )

    query = db.query(Ticket).filter(
        Ticket.department_id == current_user.department_id
    )

    total_tickets = query.count()

    open_tickets = query.filter(
        Ticket.status == "OPEN"
    ).count()

    assigned_tickets = query.filter(
        Ticket.status == "ASSIGNED"
    ).count()

    in_progress_tickets = query.filter(
        Ticket.status == "IN_PROGRESS"
    ).count()

    resolved_tickets = query.filter(
        Ticket.status == "RESOLVED"
    ).count()

    closed_tickets = query.filter(
        Ticket.status == "CLOSED"
    ).count()

    on_hold_tickets = query.filter(
        Ticket.status == "ON_HOLD"
    ).count()

    return {
        "team_lead": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "department_id": current_user.department_id,
            "team_id": current_user.team_id,
        },
        "ticket_summary": {
            "total": total_tickets,
            "open": open_tickets,
            "assigned": assigned_tickets,
            "in_progress": in_progress_tickets,
            "resolved": resolved_tickets,
            "closed": closed_tickets,
            "on_hold": on_hold_tickets,
        },
        "priority_summary": {
            "low": query.filter(Ticket.priority == "LOW").count(),
            "medium": query.filter(Ticket.priority == "MEDIUM").count(),
            "high": query.filter(Ticket.priority == "HIGH").count(),
            "critical": query.filter(Ticket.priority == "CRITICAL").count(),
        },
    }