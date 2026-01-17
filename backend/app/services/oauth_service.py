from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Optional

from app.config import get_settings

settings = get_settings()


class GoogleOAuthException(Exception):
    """Exception raised for Google OAuth errors."""
    pass


async def verify_google_token(token: str) -> dict:
    """
    Verify a Google OAuth ID token and return user information.
    
    Args:
        token: The ID token from Google Sign-In
        
    Returns:
        dict containing user info: email, name, picture, google_id
        
    Raises:
        GoogleOAuthException: If token verification fails
    """
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.google_client_id
        )
        
        # Verify issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise GoogleOAuthException("Invalid token issuer")
        
        # Extract user information
        return {
            "google_id": idinfo['sub'],
            "email": idinfo['email'],
            "name": idinfo.get('name', idinfo['email'].split('@')[0]),
            "picture": idinfo.get('picture'),
            "email_verified": idinfo.get('email_verified', False),
        }
        
    except ValueError as e:
        raise GoogleOAuthException(f"Token verification failed: {str(e)}")
