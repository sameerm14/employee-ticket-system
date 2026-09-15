from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math
from app.models.department import Department
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
)


def create_department(
    db: Session,
    department_data: DepartmentCreate
):
    existing_department = db.query(Department).filter(
        Department.name == department_data.name
    ).first()

    if existing_department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department already exists"
        )

    department = Department(
        name=department_data.name,
        description=department_data.description,
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    return department


def get_departments(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
    is_active: bool | None = None
):
    query = db.query(Department)

    # Search by department name
    if search:
        query = query.filter(
            Department.name.ilike(
                f"%{search}%"
            )
        )

    # Active / inactive filter
    if is_active is not None:
        query = query.filter(
            Department.is_active == is_active
        )

    total = query.count()

    total_pages = (
        math.ceil(total / page_size)
        if total > 0
        else 0
    )

    departments = query.order_by(
        Department.created_at.desc()
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
        "departments": departments
    }


def get_department(
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

    return department


def update_department(
    db: Session,
    department_id: int,
    department_data: DepartmentUpdate
):
    department = get_department(
        db,
        department_id
    )

    if department_data.name is not None:
        existing_department = db.query(Department).filter(
            Department.name == department_data.name,
            Department.id != department_id
        ).first()

        if existing_department:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department name already exists"
            )

        department.name = department_data.name

    if department_data.description is not None:
        department.description = department_data.description

    if department_data.is_active is not None:
        department.is_active = department_data.is_active

    db.commit()
    db.refresh(department)

    return department


def delete_department(
    db: Session,
    department_id: int
):
    department = get_department(
        db,
        department_id
    )

    db.delete(department)
    db.commit()

    return {
        "message": "Department deleted successfully"
    }