from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import time
import threading

from app.database.postgres import get_db
from app.middleware.auth import require_roles
from app.services.grok_service import ask_gemini_copilot
from app.database.redis_db import get_redis

router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)

# Rate limiting settings: 10 requests per minute
RATE_LIMIT_LIMIT = 10
RATE_LIMIT_WINDOW = 60

local_rate_limit_lock = threading.Lock()
local_rate_limit_db = {}  # {user_id: {"window_start": float, "count": int}}


def check_rate_limit(user_id: str) -> bool:
    """
    Checks if a user is within their rate limit.
    Returns True if within limit, False if exceeded.
    """
    now = time.time()
    redis_client = get_redis()
    
    if redis_client:
        try:
            key = f"rate_limit:chat:{user_id}"
            count = redis_client.get(key)
            if count and int(count) >= RATE_LIMIT_LIMIT:
                return False
            
            pipe = redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, RATE_LIMIT_WINDOW, nx=True)
            pipe.execute()
            return True
        except Exception as e:
            print(f"Redis rate limiter failed: {e}. Falling back to in-memory.")
            
    # In-memory fallback (fixed window)
    with local_rate_limit_lock:
        user_data = local_rate_limit_db.get(user_id)
        if user_data is None or now - user_data["window_start"] >= RATE_LIMIT_WINDOW:
            local_rate_limit_db[user_id] = {
                "window_start": now,
                "count": 1
            }
            return True
        else:
            if user_data["count"] >= RATE_LIMIT_LIMIT:
                return False
            user_data["count"] += 1
            return True


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    request: ChatRequest,
    current_user=Depends(require_roles(["admin", "manager", "user"])),
    db: Session = Depends(get_db)
):
    """
    Role-aware grounded assistant copilot chat with Google Gemini.
    """
    user_id = current_user.get("id", "unknown_user")
    if not check_rate_limit(user_id):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )

    user_role = current_user.get("role", "user")
    user_name = current_user.get("fullName", "Metro Employee")
    
    try:
        reply = ask_gemini_copilot(
            db=db,
            message=request.message,
            role=user_role,
            user_name=user_name,
            history=request.history
        )
        return ChatResponse(response=reply)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI Assistant Error: {str(e)}"
        )
