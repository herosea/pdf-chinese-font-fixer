from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Dict, Any
import httpx

from app.config import get_settings

settings = get_settings()


class GoogleOAuthException(Exception):
    """Exception raised for Google OAuth errors."""
    pass


async def get_google_user_from_code(code: str) -> Dict[str, Any]:
    """
    Exchange authorization code for tokens and get user info.
    
    Args:
        code: The authorization code from Google Sign-In
        
    Returns:
        dict containing user info
        
    Raises:
        GoogleOAuthException: If code exchange or verification fails
    """
    try:
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.frontend_url, # Or postmessage
            "grant_type": "authorization_code",
        }
        
        # When using the new Google Identity Services (GIS) for Web, 
        # if the flow is 'auth-code' triggered by the JS client, 
        # the redirect_uri should often be 'postmessage'.
        # We might need to adjust this based on the frontend implementation.
        # Check if we are using the popup flow or redirect flow.
        # Assuming 'postmessage' for SPA popup flow.
        if "localhost" in settings.frontend_url or "worktool.dev" in settings.frontend_url:
             data["redirect_uri"] = "postmessage"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            
            if response.status_code != 200:
                raise GoogleOAuthException(f"Failed to exchange code: {response.text}")
                
            token_data = response.json()
            id_token_str = token_data.get("id_token")
            
            if not id_token_str:
                 # Attempt to get user info with access token if id_token not present (unlikely for openid scope)
                 access_token = token_data.get("access_token")
                 user_info_resp = await client.get(
                     "https://www.googleapis.com/oauth2/v2/userinfo", 
                     headers={"Authorization": f"Bearer {access_token}"}
                 )
                 if user_info_resp.status_code != 200:
                     raise GoogleOAuthException("Failed to get user info")
                 return user_info_resp.json()

            # Verify the ID token
            idinfo = id_token.verify_oauth2_token(
                id_token_str, 
                requests.Request(), 
                settings.google_client_id
            )
            
            # Verify issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise GoogleOAuthException("Invalid token issuer")
            
            return {
                "google_id": idinfo['sub'],
                "email": idinfo['email'],
                "name": idinfo.get('name', idinfo['email'].split('@')[0]),
                "picture": idinfo.get('picture'),
                "email_verified": idinfo.get('email_verified', False),
            }
            
    except Exception as e:
        raise GoogleOAuthException(f"Authentication failed: {str(e)}")
