"""
Dashboard API Route
"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Conversation, EmotionScore, Goal, GoalStatus, Achievement

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get comprehensive dashboard statistics."""
    user_id = current_user.id
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # Total conversations
    conv_count = await db.scalar(
        select(func.count()).select_from(Conversation).where(Conversation.user_id == user_id)
    )

    # Total messages
    from app.models.models import Message
    msg_count = await db.scalar(
        select(func.count()).select_from(Message).where(Message.user_id == user_id)
    )

    # Active goals
    active_goals = await db.scalar(
        select(func.count()).select_from(Goal).where(
            Goal.user_id == user_id, Goal.status == GoalStatus.ACTIVE
        )
    )
    completed_goals = await db.scalar(
        select(func.count()).select_from(Goal).where(
            Goal.user_id == user_id, Goal.status == GoalStatus.COMPLETED
        )
    )

    # Wellbeing score (last 7 days)
    emotion_result = await db.execute(
        select(EmotionScore)
        .where(EmotionScore.user_id == user_id, EmotionScore.created_at >= week_ago)
        .order_by(desc(EmotionScore.created_at))
        .limit(50)
    )
    recent_emotions = emotion_result.scalars().all()

    avg_wellbeing = (
        sum(e.wellbeing_score for e in recent_emotions) / len(recent_emotions)
        if recent_emotions else 50.0
    )

    # Top emotions (highest average this week)
    if recent_emotions:
        emotion_fields = ["happiness", "stress", "motivation", "loneliness", "anxiety"]
        top_emotions = {
            field: round(sum(getattr(e, field) for e in recent_emotions) / len(recent_emotions), 1)
            for field in emotion_fields
        }
    else:
        top_emotions = {}

    # Trend direction
    wellbeing_trend = "stable"
    if len(recent_emotions) >= 4:
        half = len(recent_emotions) // 2
        first_avg = sum(e.wellbeing_score for e in recent_emotions[half:]) / half
        second_avg = sum(e.wellbeing_score for e in recent_emotions[:half]) / half
        diff = second_avg - first_avg
        wellbeing_trend = "improving" if diff > 5 else ("declining" if diff < -5 else "stable")

    # Recent achievements
    ach_result = await db.execute(
        select(Achievement)
        .where(Achievement.user_id == user_id)
        .order_by(desc(Achievement.earned_at))
        .limit(5)
    )
    achievements = [
        {"title": a.title, "description": a.description, "earned_at": a.earned_at.isoformat()}
        for a in ach_result.scalars().all()
    ]

    # Days active (distinct days with messages)
    from app.models.models import Message as Msg
    days_active = await db.scalar(
        select(func.count(func.distinct(func.date(Msg.created_at)))).where(Msg.user_id == user_id)
    ) or 0

    return {
        "total_conversations": conv_count or 0,
        "total_messages": msg_count or 0,
        "days_active": days_active,
        "avg_wellbeing_score": round(avg_wellbeing, 1),
        "wellbeing_trend": wellbeing_trend,
        "top_emotions": top_emotions,
        "recent_achievements": achievements,
        "active_goals_count": active_goals or 0,
        "completed_goals_count": completed_goals or 0,
        "data_points_this_week": len(recent_emotions),
    }
