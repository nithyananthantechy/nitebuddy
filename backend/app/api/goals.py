"""
Goals API Routes
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Goal, GoalStatus
from app.schemas.schemas import GoalCreateRequest, GoalUpdateRequest, GoalResponse
from app.ai.memory_agent import store_memory
from app.models.models import MemoryLayer

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("/", response_model=List[GoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goal)
        .where(Goal.user_id == current_user.id)
        .order_by(desc(Goal.created_at))
    )
    return [GoalResponse.model_validate(g) for g in result.scalars().all()]


@router.post("/", response_model=GoalResponse, status_code=201)
async def create_goal(
    payload: GoalCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goal = Goal(
        user_id=current_user.id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        target_date=payload.target_date,
        milestones=payload.milestones or [],
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)

    # Store as goal memory
    try:
        await store_memory(
            user_id=str(current_user.id),
            memory_id=str(goal.id),
            layer=MemoryLayer.GOAL,
            content=f"Goal ({payload.category.value}): {payload.title}. {payload.description or ''}",
            importance_score=0.8,
        )
    except Exception:
        pass

    return GoalResponse.model_validate(goal)


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    payload: GoalUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goal).where(Goal.id == uuid.UUID(goal_id), Goal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)
    return GoalResponse.model_validate(goal)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Goal).where(Goal.id == uuid.UUID(goal_id), Goal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    await db.delete(goal)
    await db.commit()
