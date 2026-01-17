from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.models.contact import ContactMessage
from app.models.schemas import ContactMessageCreate, ContactMessageResponse
from app.routers.auth import get_current_user_optional
from app.models.models import User

router = APIRouter()


@router.post("/", response_model=ContactMessageResponse)
async def submit_contact_message(
    message: ContactMessageCreate,
    session: Session = Depends(get_session),
    user: User | None = Depends(get_current_user_optional),
):
    """
    Submit a contact message.
    """
    db_message = ContactMessage(
        email=message.email,
        subject=message.subject,
        message=message.message,
        user_id=user.id if user else None,
    )
    session.add(db_message)
    session.commit()
    session.refresh(db_message)
    return db_message
