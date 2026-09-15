from fastapi import (
    APIRouter,
    Depends,
    status
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.core.dependencies import (
    get_current_user
)

from app.models.user import User

from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentResponse
)

from app.services.comment_service import (
    create_comment,
    get_ticket_comments,
    update_comment,
    delete_comment
)


router = APIRouter(
    prefix="/api/comments",
    tags=["Comments"]
)


@router.post(
    "/tickets/{ticket_id}",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED
)
def add_comment(
    ticket_id: int,

    comment_data: CommentCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return create_comment(
        db=db,
        ticket_id=ticket_id,
        comment_data=comment_data,
        current_user=current_user
    )


@router.get(
    "/tickets/{ticket_id}",
    response_model=list[CommentResponse]
)
def get_comments(
    ticket_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return get_ticket_comments(
        db=db,
        ticket_id=ticket_id
    )


@router.put(
    "/{comment_id}",
    response_model=CommentResponse
)
def edit_comment(
    comment_id: int,

    comment_data: CommentUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return update_comment(
        db=db,
        comment_id=comment_id,
        comment_data=comment_data,
        current_user=current_user
    )


@router.delete(
    "/{comment_id}"
)
def remove_comment(
    comment_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return delete_comment(
        db=db,
        comment_id=comment_id,
        current_user=current_user
    )