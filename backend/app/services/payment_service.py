import httpx
from typing import Optional
import hashlib
import hmac

from app.config import get_settings

settings = get_settings()


class PaymentException(Exception):
    """Exception raised for payment errors."""
    pass


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify Lemon Squeezy webhook signature.
    
    Args:
        payload: Raw request body
        signature: X-Signature header value
        
    Returns:
        True if signature is valid
    """
    if not settings.lemonsqueezy_webhook_secret:
        return False
    
    expected = hmac.new(
        settings.lemonsqueezy_webhook_secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)


def calculate_credits(pages: int) -> tuple[float, float]:
    """
    Calculate credits and price for a number of pages.
    
    Args:
        pages: Number of pages to purchase
        
    Returns:
        Tuple of (credits, price)
    """
    base_price = settings.price_per_page
    
    # Apply bulk discounts
    if pages >= 200:
        discount = 0.30  # 30% off
    elif pages >= 50:
        discount = 0.20  # 20% off
    elif pages >= 10:
        discount = 0.10  # 10% off
    else:
        discount = 0.0
    
    price_per_page = base_price * (1 - discount)
    total_price = price_per_page * pages
    
    return float(pages), round(total_price, 2)


async def create_checkout_session(
    user_id: str,
    pages: int,
    email: str
) -> dict:
    """
    Create a Lemon Squeezy checkout session.
    
    This is a placeholder - actual implementation would use the Lemon Squeezy API.
    
    Args:
        user_id: User ID
        pages: Number of pages to purchase
        email: User email
        
    Returns:
        Checkout session details including URL
    """
    credits, price = calculate_credits(pages)
    
    # TODO: Implement actual Lemon Squeezy API call
    # This would create a checkout session and return the URL
    
    return {
        "checkout_url": f"https://worktool.lemonsqueezy.com/checkout?pages={pages}",
        "credits": credits,
        "price": price,
        "currency": "USD"
    }
