from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    
    # Gemini AI
    gemini_api_key: str = ""
    
    # JWT
    jwt_secret_key: str = "your_super_secret_jwt_key_change_this_in_production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    
    # Lemon Squeezy
    lemonsqueezy_api_key: str = ""
    lemonsqueezy_webhook_secret: str = ""
    
    # CORS
    frontend_url: str = "http://localhost:5173"
    
    # Pricing
    price_per_page: float = 0.50
    free_pages: int = 1
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
