from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Auth schemas
class GoogleAuthRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    credits: float = 0.0
    free_pages_used: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    google_id: str


# File processing schemas
class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    pages: int
    status: str


class ProcessRequest(BaseModel):
    file_id: str
    pages: list[int]  # Page indices to process
    quality: str = "4K"
    custom_prompt: Optional[str] = None


class ProcessStatusResponse(BaseModel):
    file_id: str
    status: str  # pending, processing, completed, error
    pages_processed: int
    total_pages: int
    current_page: Optional[int] = None


# Payment schemas
class CreditPurchase(BaseModel):
    pages: int
    amount: float


class LemonSqueezyWebhook(BaseModel):
    meta: dict
    data: dict


# Update forward ref
TokenResponse.model_rebuild()
