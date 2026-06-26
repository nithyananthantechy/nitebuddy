"""
Auth API Routes
- Register with email/password
- Login → JWT access + refresh tokens
- Refresh token
- Get current user
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
import uuid

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token
)
from app.core.redis import get_redis
from app.models.models import User, Profile, PersonalityMode
from app.schemas.schemas import (
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    RefreshTokenRequest, ProfileResponse
)

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency to get the authenticated user from JWT."""
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists"
        )

    # Create user
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    await db.flush()  # Get the user ID

    # Create initial profile
    profile = Profile(
        user_id=user.id,
        name=payload.name,
        personality_mode=PersonalityMode.FRIEND,
        onboarding_complete=False,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    logger.info(f"New user registered: {payload.email}")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Store refresh token in Redis
    redis = await get_redis()
    await redis.setex(f"refresh:{str(user.id)}", 60 * 60 * 24 * 30, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        name=payload.name,
        onboarding_complete=False,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    # Load profile for onboarding status
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = profile_result.scalar_one_or_none()
    onboarding_complete = profile.onboarding_complete if profile else False
    name = profile.name if profile else "there"

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    redis = await get_redis()
    await redis.setex(f"refresh:{str(user.id)}", 60 * 60 * 24 * 30, refresh_token)

    logger.info(f"User logged in: {payload.email}")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        name=name,
        onboarding_complete=onboarding_complete,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token."""
    token_data = decode_token(payload.refresh_token)

    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = token_data.get("sub")

    # Verify token in Redis
    redis = await get_redis()
    stored_token = await redis.get(f"refresh:{user_id}")
    if stored_token != payload.refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    profile_result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = profile_result.scalar_one_or_none()

    new_access_token = create_access_token({"sub": user_id})
    new_refresh_token = create_refresh_token({"sub": user_id})

    await redis.setex(f"refresh:{user_id}", 60 * 60 * 24 * 30, new_refresh_token)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user_id=user_id,
        name=profile.name if profile else "there",
        onboarding_complete=profile.onboarding_complete if profile else False,
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
):
    """Logout — invalidate refresh token."""
    redis = await get_redis()
    await redis.delete(f"refresh:{str(current_user.id)}")
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current authenticated user info."""
    profile_result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()
    
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role.value,
        "profile": ProfileResponse.model_validate(profile) if profile else None,
    }
