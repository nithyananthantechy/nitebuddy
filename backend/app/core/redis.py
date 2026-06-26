import redis.asyncio as aioredis
from app.core.config import settings
from loguru import logger

_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Get the shared Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return _redis_client


async def close_redis():
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("Redis connection closed")
