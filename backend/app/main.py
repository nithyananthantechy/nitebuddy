"""
NiteBuddy FastAPI Application Entry Point
"""
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.database import init_db
from app.core.redis import get_redis, close_redis
from app.api import auth, chat, profile, emotion, goals, dashboard, journal
from app.ai.memory_agent import init_collections


# Configure logger
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> — <level>{message}</level>",
    level="DEBUG" if settings.DEBUG else "INFO",
    colorize=True,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("🌙 NiteBuddy starting up...")

    # Initialize database tables
    await init_db()

    # Initialize Qdrant collections
    try:
        await init_collections()
    except Exception as e:
        logger.warning(f"Qdrant init warning (non-fatal): {e}")

    # Warm up Redis
    try:
        redis = await get_redis()
        await redis.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.warning(f"Redis warning: {e}")

    logger.info("✅ NiteBuddy is ready!")
    yield

    # Shutdown
    logger.info("NiteBuddy shutting down...")
    await close_redis()


app = FastAPI(
    title="NiteBuddy API",
    description="Emotionally Intelligent AI Companion Backend",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(profile.router, prefix="/api/v1")
app.include_router(emotion.router, prefix="/api/v1")
app.include_router(goals.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(journal.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"name": "NiteBuddy API", "version": settings.APP_VERSION, "status": "operational"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
