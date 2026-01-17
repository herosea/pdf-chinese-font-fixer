from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class ContactMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    subject: str
    message: str
    user_id: Optional[str] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.now)
