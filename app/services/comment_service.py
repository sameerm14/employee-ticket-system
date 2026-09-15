from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.services.notification_service import notify_user
from app.models.comment import Comment
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate
)


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


def get_comment_or_404(
    db: Session,
    comment_id: int
):
    comment = db.query(Comment).filter(
        Comment.id == comment_id
    ).first()

    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    return comment


def create_comment(
    db: Session,
    ticket_id: int,
    comment_data: CommentCreate,
    current_user: User
):
    ticket = get_ticket_or_404(
        db,
        ticket_id
    )

    if not comment_data.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment cannot be empty"
        )

    comment = Comment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        content=comment_data.content.strip()
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Notify ticket creator
    if ticket.created_by != current_user.id:
        notify_user(
            db=db,
            user_id=ticket.created_by,
            title="New Comment",
            message=(
                f"New comment added to ticket "
                f"{ticket.ticket_number}."
            ),
            notification_type="COMMENT_ADDED",
            ticket_id=ticket.id
        )

    # Notify assigned employee
    if (
        ticket.assigned_user_id is not None
        and ticket.assigned_user_id != current_user.id
        and ticket.assigned_user_id != ticket.created_by
    ):
        notify_user(
            db=db,
            user_id=ticket.assigned_user_id,
            title="New Comment",
            message=(
                f"New comment added to ticket "
                f"{ticket.ticket_number}."
            ),
            notification_type="COMMENT_ADDED",
            ticket_id=ticket.id
        )

    return comment


def get_ticket_comments(
    db: Session,
    ticket_id: int
):
    get_ticket_or_404(
        db,
        ticket_id
    )

    return db.query(Comment).filter(
        Comment.ticket_id == ticket_id
    ).order_by(
        Comment.created_at.asc()
    ).all()


def update_comment(
    db: Session,
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User
):
    comment = get_comment_or_404(
        db,
        comment_id
    )

    # Only comment owner or ADMIN can edit
    if (
        comment.user_id != current_user.id
        and current_user.role != "ADMIN"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to edit this comment"
        )

    if (
        comment_data.content is None
        or not comment_data.content.strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment cannot be empty"
        )

    comment.content = comment_data.content.strip()

    db.commit()
    db.refresh(comment)

    return comment


def delete_comment(
    db: Session,
    comment_id: int,
    current_user: User
):
    comment = get_comment_or_404(
        db,
        comment_id
    )

    # Only comment owner or ADMIN can delete
    if (
        comment.user_id != current_user.id
        and current_user.role != "ADMIN"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this comment"
        )

    db.delete(comment)
    db.commit()

    return {
        "message": "Comment deleted successfully"
    }