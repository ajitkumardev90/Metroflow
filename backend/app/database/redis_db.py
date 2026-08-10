import os
import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

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
    print(f"[WARNING] Redis Connection Failed (degrading gracefully): {e}")
    redis_client = None


def get_redis():
    return redis_client


def cache_set(key: str, value: str, expire_seconds: int = 300):
    """
    Sets a value in the cache if Redis is available.
    """
    if redis_client:
        try:
            redis_client.set(key, value, ex=expire_seconds)
        except Exception as e:
            print(f"Redis cache write error: {e}")


def cache_get(key: str):
    """
    Gets a value from the cache if Redis is available.
    """
    if redis_client:
        try:
            return redis_client.get(key)
        except Exception as e:
            print(f"Redis cache read error: {e}")
    return None
