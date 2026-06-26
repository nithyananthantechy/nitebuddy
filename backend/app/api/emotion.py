"""
Emotion API Routes
- Get current emotion state
- Get emotional trends (daily/weekly/monthly)
"""
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, EmotionScore
from app.schemas.schemas import EmotionScoreResponse, EmotionTrendsResponse, EmotionTrendPoint

router = APIRouter(prefix="/emotion", tags=["emotion"])


@router.get("/current", response_model=EmotionScoreResponse)
async def get_current_emotion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's most recent emotion score."""
    result = await db.execute(
        select(EmotionScore)
        .where(EmotionScore.user_id == current_user.id)
        .order_by(desc(EmotionScore.created_at))
        .limit(1)
    )
    score = result.scalar_one_or_none()
    
    if not score:
        # Return neutral baseline if no data yet
        return EmotionScoreResponse(
            id=uuid.uuid4(),
            happiness=50, sadness=0, anxiety=0, stress=0,
            frustration=0, confidence=50, hope=50,
            motivation=50, loneliness=0, exhaustion=0,
            hidden_emotion_confidence=0, wellbeing_score=50,
            created_at=datetime.now(timezone.utc),
        )
    
    return EmotionScoreResponse.model_validate(score)


@router.get("/trends", response_model=EmotionTrendsResponse)
async def get_emotion_trends(
    period: str = Query(default="weekly", pattern="^(daily|weekly|monthly)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get emotional trend data over time."""
    now = datetime.now(timezone.utc)
    
    if period == "daily":
        since = now - timedelta(hours=24)
    elif period == "weekly":
        since = now - timedelta(days=7)
    else:  # monthly
        since = now - timedelta(days=30)

    result = await db.execute(
        select(EmotionScore)
        .where(
            EmotionScore.user_id == current_user.id,
            EmotionScore.created_at >= since,
        )
        .order_by(EmotionScore.created_at)
    )
    scores = result.scalars().all()

    data = [
        EmotionTrendPoint(
            date=s.created_at,
            happiness=s.happiness,
            sadness=s.sadness,
            stress=s.stress,
            motivation=s.motivation,
            loneliness=s.loneliness,
            wellbeing_score=s.wellbeing_score,
        )
        for s in scores
    ]

    # Calculate trend direction
    avg_wellbeing = sum(d.wellbeing_score for d in data) / len(data) if data else 50.0
    
    trend_direction = "stable"
    if len(data) >= 4:
        first_half = data[:len(data)//2]
        second_half = data[len(data)//2:]
        first_avg = sum(d.wellbeing_score for d in first_half) / len(first_half)
        second_avg = sum(d.wellbeing_score for d in second_half) / len(second_half)
        diff = second_avg - first_avg
        if diff > 5:
            trend_direction = "improving"
        elif diff < -5:
            trend_direction = "declining"

    return EmotionTrendsResponse(
        period=period,
        data=data,
        avg_wellbeing=round(avg_wellbeing, 1),
        trend_direction=trend_direction,
    )


@router.get("/summary")
async def get_emotion_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a quick emotion summary for the dashboard widget."""
    since = datetime.now(timezone.utc) - timedelta(days=7)
    
    result = await db.execute(
        select(EmotionScore)
        .where(
            EmotionScore.user_id == current_user.id,
            EmotionScore.created_at >= since,
        )
        .order_by(desc(EmotionScore.created_at))
        .limit(50)
    )
    scores = result.scalars().all()
    
    if not scores:
        return {"message": "No emotion data yet", "wellbeing_score": 50}
    
    avg = lambda field: round(sum(getattr(s, field) for s in scores) / len(scores), 1)
    
    return {
        "wellbeing_score": avg("wellbeing_score"),
        "happiness": avg("happiness"),
        "stress": avg("stress"),
        "motivation": avg("motivation"),
        "loneliness": avg("loneliness"),
        "data_points": len(scores),
        "period": "last 7 days",
    }
