from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import math
from app.models.notification import Notification
from app.models.user import User


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    ticket_id: int | None = None
):
    notification = Notification(
        user_id=user_id,
        ticket_id=ticket_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def get_my_notifications(
    db: Session,
    current_user: User,
    page: int = 1,
    page_size: int = 20,
    is_read: bool | None = None,
    notification_type: str | None = None
):
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )

    # Read / unread filter
    if is_read is not None:
        query = query.filter(
            Notification.is_read == is_read
        )

    # Notification type filter
    if notification_type:
        query = query.filter(
            Notification.notification_type
            == notification_type
        )

    total = query.count()

    total_pages = (
        math.ceil(total / page_size)
        if total > 0
        else 0
    )

    notifications = query.order_by(
        Notification.created_at.desc()
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
        "notifications": notifications
    }


def get_unread_count(
    db: Session,
    current_user: User
):
    count = db.query(
        Notification
    ).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return {
        "unread_count": count
    }


def mark_notification_as_read(
    db: Session,
    notification_id: int,
    current_user: User
):
    notification = db.query(
        Notification
    ).filter(
        Notification.id == notification_id
    ).first()

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this notification"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


def mark_all_as_read(
    db: Session,
    current_user: User
):
    db.query(
        Notification
    ).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update(
        {
            Notification.is_read: True
        }
    )

    db.commit()

    return {
        "message": "All notifications marked as read"
    }

def notify_user(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    ticket_id: int | None = None
):
    return create_notification(
        db=db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        ticket_id=ticket_id
    )