from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta

from app.models.schemas import GoogleAuthRequest, TokenResponse, UserResponse
from app.services.oauth_service import verify_google_token, GoogleOAuthException
from app.utils.security import create_access_token, get_current_user
from app.config import get_settings

router = APIRouter()
settings = get_settings()

# In-memory user store (replace with database in production)
users_db: dict[str, dict] = {}


@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleAuthRequest):
    """
    Authenticate user with Google OAuth token.
    
    - Verifies the Google ID token
    - Creates or updates user record
    - Returns JWT access token
    """
    try:
        # Verify Google token
        google_user = await verify_google_token(request.token)
        
        # Check if user exists or create new
        user_id = google_user["google_id"]
        
        if user_id in users_db:
            # Update existing user
            user = users_db[user_id]
            user["name"] = google_user["name"]
            user["picture"] = google_user.get("picture")
        else:
            # Create new user with free trial
            user = {
                "id": user_id,
                "email": google_user["email"],
                "name": google_user["name"],
                "picture": google_user.get("picture"),
                "credits": 0.0,
                "free_pages_used": 0,
                "created_at": datetime.now(timezone.utc),
            }
            users_db[user_id] = user
        
        # Create JWT token
        access_token = create_access_token(
            data={
                "sub": user_id,
                "email": user["email"],
                "name": user["name"],
            },
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                picture=user.get("picture"),
                credits=user["credits"],
                free_pages_used=user["free_pages_used"],
                created_at=user["created_at"],
            )
        )
        
    except GoogleOAuthException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information."""
    user_id = current_user.get("sub")
    
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = users_db[user_id]
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        credits=user["credits"],
        free_pages_used=user["free_pages_used"],
        created_at=user["created_at"],
    )
