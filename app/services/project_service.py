from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math
from app.models.project import Project
from app.models.department import Department
from app.schemas.project import ProjectCreate, ProjectUpdate


ALLOWED_PRIORITIES = {
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
}

ALLOWED_STATUSES = {
    "ACTIVE",
    "INACTIVE",
    "COMPLETED",
    "ON_HOLD",
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


def validate_status(project_status: str):
    project_status = project_status.upper()

    if project_status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid status. Allowed values: "
                "ACTIVE, INACTIVE, COMPLETED, ON_HOLD"
            )
        )

    return project_status


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
            detail="Cannot assign project to an inactive department"
        )

    return department


def create_project(
    db: Session,
    project_data: ProjectCreate
):
    # Validate department
    validate_department(
        db,
        project_data.department_id
    )

    # Validate priority
    priority = validate_priority(
        project_data.priority
    )

    # Validate status
    project_status = validate_status(
        project_data.status
    )

    # Check duplicate project name
    existing_project = db.query(Project).filter(
        Project.name == project_data.name,
        Project.department_id == project_data.department_id
    ).first()

    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project already exists in this department"
        )

    project = Project(
        name=project_data.name,
        description=project_data.description,
        department_id=project_data.department_id,
        priority=priority,
        status=project_status,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


def get_projects(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    department_id: int | None = None,
    priority: str | None = None,
    status: str | None = None,
    is_active: bool | None = None
):
    query = db.query(Project)

    # Search
    if search:
        query = query.filter(
            Project.name.ilike(
                f"%{search}%"
            )
        )

    # Department
    if department_id is not None:
        query = query.filter(
            Project.department_id == department_id
        )

    # Priority
    if priority:
        query = query.filter(
            Project.priority == priority
        )

    # Status
    if status:
        query = query.filter(
            Project.status == status
        )

    # Active / inactive
    if is_active is not None:
        query = query.filter(
            Project.is_active == is_active
        )

    total = query.count()

    total_pages = (
        math.ceil(total / page_size)
        if total > 0
        else 0
    )

    projects = query.order_by(
        Project.created_at.desc()
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
        "projects": projects
    }


def get_project(
    db: Session,
    project_id: int
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return project


def update_project(
    db: Session,
    project_id: int,
    project_data: ProjectUpdate
):
    project = get_project(
        db=db,
        project_id=project_id
    )

    # Determine final values
    new_department_id = (
        project_data.department_id
        if project_data.department_id is not None
        else project.department_id
    )

    new_name = (
        project_data.name
        if project_data.name is not None
        else project.name
    )

    new_priority = (
        project_data.priority
        if project_data.priority is not None
        else project.priority
    )

    new_status = (
        project_data.status
        if project_data.status is not None
        else project.status
    )

    # Validate department
    validate_department(
        db,
        new_department_id
    )

    # Validate priority
    new_priority = validate_priority(
        new_priority
    )

    # Validate status
    new_status = validate_status(
        new_status
    )

    # Check duplicate name inside department
    existing_project = db.query(Project).filter(
        Project.name == new_name,
        Project.department_id == new_department_id,
        Project.id != project_id
    ).first()

    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name already exists in this department"
        )

    # Update fields
    if project_data.name is not None:
        project.name = project_data.name

    if project_data.description is not None:
        project.description = project_data.description

    if project_data.department_id is not None:
        project.department_id = project_data.department_id

    if project_data.priority is not None:
        project.priority = new_priority

    if project_data.status is not None:
        project.status = new_status

    if project_data.is_active is not None:
        project.is_active = project_data.is_active

    db.commit()
    db.refresh(project)

    return project


def delete_project(
    db: Session,
    project_id: int
):
    project = get_project(
        db=db,
        project_id=project_id
    )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }