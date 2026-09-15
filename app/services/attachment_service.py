import os
import uuid

from fastapi import (
    HTTPException,
    UploadFile,
    status
)

from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.models.ticket import Ticket
from app.models.user import User


UPLOAD_DIR = "uploads/tickets"

MAX_FILE_SIZE = 10 * 1024 * 1024


ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
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


def get_attachment_or_404(
    db: Session,
    attachment_id: int
):
    attachment = db.query(
        Attachment
    ).filter(
        Attachment.id == attachment_id
    ).first()

    if attachment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )

    return attachment


def validate_file(
    file: UploadFile
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required"
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type is not allowed"
        )


def upload_attachment(
    db: Session,
    ticket_id: int,
    file: UploadFile,
    current_user: User
):
    get_ticket_or_404(
        db,
        ticket_id
    )

    validate_file(file)

    # Read file
    file_data = file.file.read()

    # Check size
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size cannot exceed 10 MB"
        )

    # Create upload directory
    os.makedirs(
        UPLOAD_DIR,
        exist_ok=True
    )

    # Get extension
    original_filename = file.filename

    extension = os.path.splitext(
        original_filename
    )[1].lower()

    # Generate secure random filename
    stored_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        stored_filename
    )

    # Save file
    with open(
        file_path,
        "wb"
    ) as output_file:
        output_file.write(file_data)

    attachment = Attachment(
        ticket_id=ticket_id,
        uploaded_by=current_user.id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        content_type=file.content_type,
        file_size=len(file_data)
    )

    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment


def get_ticket_attachments(
    db: Session,
    ticket_id: int
):
    get_ticket_or_404(
        db,
        ticket_id
    )

    return db.query(
        Attachment
    ).filter(
        Attachment.ticket_id == ticket_id
    ).order_by(
        Attachment.created_at.asc()
    ).all()


def get_attachment_file(
    db: Session,
    attachment_id: int
):
    attachment = get_attachment_or_404(
        db,
        attachment_id
    )

    if not os.path.exists(
        attachment.file_path
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment file not found"
        )

    return attachment


def delete_attachment(
    db: Session,
    attachment_id: int,
    current_user: User
):
    attachment = get_attachment_or_404(
        db,
        attachment_id
    )

    # Owner or ADMIN can delete
    if (
        attachment.uploaded_by != current_user.id
        and current_user.role != "ADMIN"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this attachment"
        )

    if os.path.exists(
        attachment.file_path
    ):
        os.remove(
            attachment.file_path
        )

    db.delete(attachment)
    db.commit()

    return {
        "message": "Attachment deleted successfully"
    }