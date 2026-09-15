from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.core.dependencies import (
    get_current_user
)

from app.models.user import User

from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
)

from app.services.notification_service import (
    get_my_notifications,
    get_unread_count,
    mark_notification_as_read,
    mark_all_as_read
)


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)


@router.get(
    "",
    response_model=NotificationListResponse
)
def get_notifications(
    page: int = Query(1, ge=1),

    page_size: int = Query(
        20,
        ge=1,
        le=100
    ),

    is_read: bool | None = None,

    notification_type: str | None = None,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return get_my_notifications(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        is_read=is_read,
        notification_type=notification_type
    )


@router.get(
    "/unread-count"
)
def unread_count(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return get_unread_count(
        db=db,
        current_user=current_user
    )

@router.patch(
    "/read-all"
)
def mark_all_read(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return mark_all_as_read(
        db=db,
        current_user=current_user
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_read(
    notification_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return mark_notification_as_read(
        db=db,
        notification_id=notification_id,
        current_user=current_user
    )


