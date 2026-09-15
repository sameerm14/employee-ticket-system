from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile
)

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.core.dependencies import (
    get_current_user
)

from app.models.user import User

from app.schemas.attachment import (
    AttachmentResponse
)

from app.services.attachment_service import (
    upload_attachment,
    get_ticket_attachments,
    get_attachment_file,
    delete_attachment
)


router = APIRouter(
    prefix="/api/attachments",
    tags=["Attachments"]
)


@router.post(
    "/tickets/{ticket_id}",
    response_model=AttachmentResponse
)
def upload_file(
    ticket_id: int,

    file: UploadFile = File(...),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return upload_attachment(
        db=db,
        ticket_id=ticket_id,
        file=file,
        current_user=current_user
    )


@router.get(
    "/tickets/{ticket_id}",
    response_model=list[AttachmentResponse]
)
def get_attachments(
    ticket_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return get_ticket_attachments(
        db=db,
        ticket_id=ticket_id
    )


@router.get(
    "/{attachment_id}/download"
)
def download_file(
    attachment_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    attachment = get_attachment_file(
        db=db,
        attachment_id=attachment_id
    )

    return FileResponse(
        path=attachment.file_path,
        filename=attachment.original_filename,
        media_type=attachment.content_type
    )


@router.delete(
    "/{attachment_id}"
)
def remove_attachment(
    attachment_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):
    return delete_attachment(
        db=db,
        attachment_id=attachment_id,
        current_user=current_user
    )