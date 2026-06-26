"""
Profile API Routes
- Get & update user profile
- Complete onboarding
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Profile
from app.schemas.schemas import ProfileResponse, ProfileUpdate, OnboardingRequest
from app.ai.memory_agent import store_memory
from app.models.models import MemoryLayer

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse.model_validate(profile)


@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return ProfileResponse.model_validate(profile)


@router.post("/onboarding", response_model=ProfileResponse)
async def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Complete the multi-step onboarding process."""
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    # Update all onboarding fields
    profile.name = payload.name
    profile.age = payload.age
    profile.gender = payload.gender
    profile.occupation = payload.occupation
    profile.interests = payload.interests or []
    profile.hobbies = payload.hobbies or []
    profile.goals_summary = payload.goals_summary
    profile.relationship_status = payload.relationship_status
    profile.personality_mode = payload.personality_mode
    profile.timezone = payload.timezone
    profile.onboarding_complete = True

    await db.commit()
    await db.refresh(profile)

    # Store profile facts as profile memories for vector retrieval
    try:
        profile_facts = []
        if payload.occupation:
            profile_facts.append(f"{payload.name} works as {payload.occupation}")
        if payload.interests:
            profile_facts.append(f"{payload.name}'s interests include: {', '.join(payload.interests)}")
        if payload.hobbies:
            profile_facts.append(f"{payload.name}'s hobbies: {', '.join(payload.hobbies)}")
        if payload.goals_summary:
            profile_facts.append(f"{payload.name}'s goals: {payload.goals_summary}")

        for fact in profile_facts:
            await store_memory(
                user_id=str(current_user.id),
                memory_id=str(uuid.uuid4()),
                layer=MemoryLayer.PROFILE,
                content=fact,
                importance_score=0.9,
            )
    except Exception as e:
        # Non-fatal: memory storage failure shouldn't block onboarding
        pass

    return ProfileResponse.model_validate(profile)
