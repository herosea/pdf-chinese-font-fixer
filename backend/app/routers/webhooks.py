from fastapi import APIRouter, Request, HTTPException, status

from app.services.payment_service import verify_webhook_signature

router = APIRouter()


@router.post("/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request):
    """
    Handle Lemon Squeezy payment webhooks.
    
    Events handled:
    - order_created: New purchase completed
    - subscription_created: New subscription started
    - subscription_updated: Subscription updated
    - subscription_cancelled: Subscription cancelled
    """
    # Get raw body for signature verification
    body = await request.body()
    signature = request.headers.get("X-Signature", "")
    
    # Verify signature
    if not verify_webhook_signature(body, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Parse webhook data
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON"
        )
    
    event_name = data.get("meta", {}).get("event_name", "")
    
    if event_name == "order_created":
        # Handle new order
        order_data = data.get("data", {})
        custom_data = data.get("meta", {}).get("custom_data", {})
        
        user_id = custom_data.get("user_id")
        pages = custom_data.get("pages", 0)
        
        if user_id:
            # TODO: Add credits to user account
            # This would update the database with new credits
            pass
        
        return {"status": "processed", "event": event_name}
    
    elif event_name == "subscription_created":
        # Handle subscription
        return {"status": "processed", "event": event_name}
    
    elif event_name == "subscription_cancelled":
        # Handle cancellation
        return {"status": "processed", "event": event_name}
    
    elif event_name == "refund_created":
        # Handle refund
        order_data = data.get("data", {})
        custom_data = data.get("meta", {}).get("custom_data", {})
        
        user_id = custom_data.get("user_id")
        
        if user_id:
            # TODO: Remove credits from user account
            pass
        
        return {"status": "processed", "event": event_name}
    
    # Unknown event - still return 200 to acknowledge receipt
    return {"status": "ignored", "event": event_name}
