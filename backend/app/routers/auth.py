from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from sqlmodel import Session, select

from app.models.schemas import GoogleAuthRequest, TokenResponse, UserResponse
from app.models.models import User
from app.services.oauth_service import get_google_user_from_code, GoogleOAuthException
from app.utils.security import create_access_token, get_current_user
from app.config import get_settings
from app.database import get_session

router = APIRouter()
settings = get_settings()


from typing import Optional
from app.utils.security import verify_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_optional = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    session: Session = Depends(get_session)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = verify_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return session.get(User, user_id)
    except:
        return None


@router.post("/google", response_model=TokenResponse)
async def google_login(
    request: GoogleAuthRequest, 
    session: Session = Depends(get_session)
):
    """
    Authenticate user with Google OAuth authorization code.
    
    - Exchanges code for tokens
    - Verifies Google user
    - Creates or updates user record in DB
    - Returns JWT access token
    """
    try:
        # Verify Google code and get user info
        google_user = await get_google_user_from_code(request.code)
        
        user_id = google_user["google_id"]
        
        # Check if user exists
        user = session.get(User, user_id)
        
        if user:
            # Update existing user
            user.name = google_user["name"]
            user.picture = google_user.get("picture")
        else:
            # Create new user
            user = User(
                id=user_id,
                email=google_user["email"],
                name=google_user["name"],
                picture=google_user.get("picture"),
                credits=0.0,
                free_pages_used=0,
                created_at=datetime.now(timezone.utc)
            )
            session.add(user)
        
        session.commit()
        session.refresh(user)
        
        # Create JWT token
        access_token = create_access_token(
            data={
                "sub": user.id,
                "email": user.email,
                "name": user.name,
            },
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                picture=user.picture,
                credits=user.credits,
                free_pages_used=user.free_pages_used,
                created_at=user.created_at,
            )
        )
        
    except GoogleOAuthException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current authenticated user information."""
    user_id = current_user.get("sub")
    
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        picture=user.picture,
        credits=user.credits,
        free_pages_used=user.free_pages_used,
        created_at=user.created_at,
    )
