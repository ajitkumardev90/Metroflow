import os
import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

import time
import threading

redis_client = None
try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=REDIS_PASSWORD,
        decode_responses=True,
        socket_timeout=2.0
    )
    # Ping to check if connection is active
    redis_client.ping()
    print("[SUCCESS] Redis Connected Successfully")
except Exception as e:
    print(f"[WARNING] Redis Connection Failed (degrading gracefully to in-memory fallback): {e}")
    redis_client = None


# Thread-safe local in-memory cache database fallback
local_cache_lock = threading.Lock()
local_cache_db = {} # {key: {"value": str, "expires_at": float}}


def get_redis():
    return redis_client


def cache_set(key: str, value: str, expire_seconds: int = 300):
    """
    Sets a value in the cache. Fallbacks to thread-safe in-memory cache if Redis is unavailable.
    """
    if redis_client:
        try:
            redis_client.set(key, value, ex=expire_seconds)
            return
        except Exception as e:
            print(f"Redis cache write error: {e}. Writing to in-memory cache.")
    
    with local_cache_lock:
        local_cache_db[key] = {
            "value": value,
            "expires_at": time.time() + expire_seconds
        }


def cache_get(key: str):
    """
    Gets a value from the cache. Fallbacks to thread-safe in-memory cache if Redis is unavailable.
    """
    if redis_client:
        try:
            val = redis_client.get(key)
            if val is not None:
                return val
        except Exception as e:
            print(f"Redis cache read error: {e}. Reading from in-memory cache.")
            
    with local_cache_lock:
        item = local_cache_db.get(key)
        if item:
            if time.time() < item["expires_at"]:
                return item["value"]
            else:
                del local_cache_db[key]
    return None
