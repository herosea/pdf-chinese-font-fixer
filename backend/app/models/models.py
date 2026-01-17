from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: str = Field(primary_key=True)  # Google ID
    email: str = Field(index=True, unique=True)
    name: str
    picture: Optional[str] = None
    credits: float = Field(default=0.0)
    free_pages_used: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
