"""
Journal API Routes
- List journal entries
- Generate a journal entry for a given date (from conversations)
"""
import uuid
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, JournalEntry, Message, MessageRole
from app.schemas.schemas import JournalEntryResponse
from app.ai.client import get_client
from app.core.config import settings
from loguru import logger
import json, re

router = APIRouter(prefix="/journal", tags=["journal"])


async def _generate_journal_from_messages(
    messages: list[Message],
    user_name: str,
    client,
) -> dict:
    """Use AI to generate a structured journal entry from day's messages."""
    conversation_text = "\n".join([
        f"{'User' if m.role == MessageRole.USER else 'NiteBuddy'}: {m.content}"
        for m in messages[:40]  # Cap at 40 messages
    ])

    prompt = f"""You are generating a thoughtful, personal journal entry for {user_name} based on their conversation today with NiteBuddy.

CONVERSATION:
{conversation_text}

Generate a structured journal entry in JSON format:
{{
  "highlights": "2-3 sentences about the day's meaningful moments or topics discussed",
  "achievements": "Any accomplishments or positive steps mentioned (or null if none)",
  "emotional_changes": "How the emotional tone shifted during the conversation",
  "reflection_notes": "A thoughtful reflection written in first person as if {user_name} wrote it",
  "growth_insights": "One key insight about personal growth visible in this conversation"
}}

Write in a warm, personal tone. First person for reflection_notes. Return only valid JSON."""

    try:
        response = await client.chat.completions.create(
            model=settings.effective_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=600,
        )
        raw = response.choices[0].message.content.strip()
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.error(f"Journal generation error: {e}")

    return {
        "highlights": "A day of conversation and reflection.",
        "achievements": None,
        "emotional_changes": "Emotions shifted through the day.",
        "reflection_notes": "Today I shared my thoughts and feelings with NiteBuddy.",
        "growth_insights": "Every conversation is a step toward understanding myself better.",
    }


@router.post("/generate")
async def generate_journal_entry(
    target_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a journal entry from today's (or specified date's) conversations."""
    entry_date = date.fromisoformat(target_date) if target_date else date.today()

    # Check if entry already exists
    existing = await db.execute(
        select(JournalEntry).where(
            JournalEntry.user_id == current_user.id,
            JournalEntry.entry_date == entry_date,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Journal entry already exists for this date")

    # Load messages from that day
    day_start = datetime(entry_date.year, entry_date.month, entry_date.day, tzinfo=timezone.utc)
    day_end = datetime(entry_date.year, entry_date.month, entry_date.day, 23, 59, 59, tzinfo=timezone.utc)

    msg_result = await db.execute(
        select(Message)
        .where(
            Message.user_id == current_user.id,
            Message.created_at >= day_start,
            Message.created_at <= day_end,
        )
        .order_by(Message.created_at)
    )
    messages = msg_result.scalars().all()

    if not messages:
        raise HTTPException(status_code=404, detail="No conversations found for this date")

    # Load profile for name
    from app.models.models import Profile
    profile_result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = profile_result.scalar_one_or_none()
    user_name = profile.name if profile else "you"

    # Generate journal content
    client = get_client()
    content = await _generate_journal_from_messages(messages, user_name, client)

    # Build emotion summary from messages
    from app.models.models import EmotionScore
    emotion_result = await db.execute(
        select(EmotionScore)
        .where(
            EmotionScore.user_id == current_user.id,
            EmotionScore.created_at >= day_start,
            EmotionScore.created_at <= day_end,
        )
    )
    day_emotions = emotion_result.scalars().all()
    emotion_summary = None
    if day_emotions:
        avg = lambda f: round(sum(getattr(e, f) for e in day_emotions) / len(day_emotions), 1)
        emotion_summary = {
            "wellbeing_score": avg("wellbeing_score"),
            "happiness": avg("happiness"),
            "stress": avg("stress"),
            "motivation": avg("motivation"),
        }

    # Save entry
    entry = JournalEntry(
        user_id=current_user.id,
        entry_date=entry_date,
        highlights=content.get("highlights"),
        achievements=content.get("achievements"),
        emotional_changes=content.get("emotional_changes"),
        reflection_notes=content.get("reflection_notes"),
        growth_insights=content.get("growth_insights"),
        emotion_summary=emotion_summary,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return JournalEntryResponse.model_validate(entry)


@router.get("/list")
async def list_journal_entries(
    page: int = 1,
    per_page: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List journal entries, most recent first."""
    offset = (page - 1) * per_page
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == current_user.id)
        .order_by(desc(JournalEntry.entry_date))
        .offset(offset)
        .limit(per_page)
    )
    entries = result.scalars().all()

    return {
        "entries": [JournalEntryResponse.model_validate(e) for e in entries],
        "page": page,
    }


@router.get("/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JournalEntry).where(
            JournalEntry.id == uuid.UUID(entry_id),
            JournalEntry.user_id == current_user.id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return JournalEntryResponse.model_validate(entry)
