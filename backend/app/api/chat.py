"""
Chat API Routes
- Send a message and receive a streaming AI response
- Retrieve conversation history
- List user's conversations
"""
import uuid
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from loguru import logger

from app.core.database import get_db
from app.core.redis import get_redis
from app.api.auth import get_current_user
from app.models.models import (
    User, Profile, Conversation, Message, MessageRole,
    EmotionScore, BehaviorMetric, Memory, MemoryLayer,
)
from app.schemas.schemas import ChatMessageRequest, ConversationResponse, MessageResponse
from app.ai.emotion_agent import analyze_emotion, calculate_wellbeing_score
from app.ai.safety_agent import check_crisis_signals
from app.ai.memory_agent import retrieve_relevant_memories, format_memories_for_context, store_memory
from app.ai.companion_agent import generate_companion_response

router = APIRouter(prefix="/chat", tags=["chat"])

CONTEXT_CACHE_TTL = 60 * 60 * 2  # 2 hours


async def _get_or_create_conversation(
    user_id: uuid.UUID,
    conversation_id: Optional[str],
    db: AsyncSession,
) -> Conversation:
    """Get existing conversation or create a new one."""
    if conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == uuid.UUID(conversation_id),
                Conversation.user_id == user_id,
            )
        )
        conv = result.scalar_one_or_none()
        if conv:
            return conv

    # Create new conversation
    conv = Conversation(user_id=user_id)
    db.add(conv)
    await db.flush()
    return conv


async def _get_conversation_history_cached(
    conversation_id: str,
    db: AsyncSession,
) -> list[dict]:
    """Get conversation history from Redis cache or DB."""
    redis = await get_redis()
    cache_key = f"conv_history:{conversation_id}"
    
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # Load from DB
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == uuid.UUID(conversation_id))
        .order_by(Message.created_at)
        .limit(30)
    )
    messages = result.scalars().all()
    
    history = [{"role": m.role.value, "content": m.content} for m in messages]
    
    # Cache it
    await redis.setex(cache_key, CONTEXT_CACHE_TTL, json.dumps(history))
    return history


async def _update_history_cache(conversation_id: str, role: str, content: str):
    """Append a message to the cached history."""
    redis = await get_redis()
    cache_key = f"conv_history:{conversation_id}"
    
    cached = await redis.get(cache_key)
    history = json.loads(cached) if cached else []
    history.append({"role": role, "content": content})
    
    # Keep last 30 messages
    if len(history) > 30:
        history = history[-30:]
    
    await redis.setex(cache_key, CONTEXT_CACHE_TTL, json.dumps(history))


@router.post("/message")
async def send_message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message and receive a streaming AI response.
    Returns Server-Sent Events stream.
    """
    user_id = current_user.id

    # Load profile
    profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    
    if not profile or not profile.onboarding_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your profile setup first"
        )

    # Get or create conversation
    conv = await _get_or_create_conversation(user_id, payload.conversation_id, db)
    conv_id_str = str(conv.id)

    # Get conversation history
    history = await _get_conversation_history_cached(conv_id_str, db)

    # Load behavioral baseline (avg message length)
    behavior_result = await db.execute(
        select(BehaviorMetric)
        .where(BehaviorMetric.user_id == user_id)
        .order_by(desc(BehaviorMetric.date))
        .limit(7)
    )
    recent_metrics = behavior_result.scalars().all()
    avg_msg_length = (
        sum(m.avg_message_length for m in recent_metrics) / len(recent_metrics)
        if recent_metrics else None
    )

    # Get emotion baseline
    emotion_result = await db.execute(
        select(EmotionScore)
        .where(EmotionScore.user_id == user_id)
        .order_by(desc(EmotionScore.created_at))
        .limit(5)
    )
    recent_emotions = emotion_result.scalars().all()
    baseline_emotions = None
    if recent_emotions:
        avg = lambda field: sum(getattr(e, field) for e in recent_emotions) / len(recent_emotions)
        baseline_emotions = {
            "happiness": avg("happiness"), "sadness": avg("sadness"),
            "stress": avg("stress"), "motivation": avg("motivation"),
            "loneliness": avg("loneliness"),
        }

    # Run emotion detection
    emotion_analysis = await analyze_emotion(
        user_message=payload.content,
        conversation_history=history,
        baseline_emotions=baseline_emotions,
        avg_message_length=avg_msg_length,
    )

    # Run safety check
    crisis_check = check_crisis_signals(payload.content, emotion_analysis)

    # Retrieve relevant memories
    memories = await retrieve_relevant_memories(
        user_id=str(user_id),
        query=payload.content,
        top_k=5,
    )
    memory_context = format_memories_for_context(memories)

    # Build profile dict for context
    profile_dict = {
        "name": profile.name,
        "occupation": profile.occupation,
        "interests": profile.interests or [],
        "hobbies": profile.hobbies or [],
    }

    async def event_stream():
        full_response = ""
        conversation_id_sent = False

        try:
            # Send conversation ID first
            yield f"data: {json.dumps({'type': 'conversation_id', 'conversation_id': conv_id_str})}\n\n"

            # If crisis detected, use crisis response
            if crisis_check["crisis_detected"] and crisis_check.get("response"):
                crisis_response = crisis_check["response"]
                yield f"data: {json.dumps({'type': 'token', 'content': crisis_response})}\n\n"
                full_response = crisis_response
            else:
                # Stream companion response
                async for token in generate_companion_response(
                    user_message=payload.content,
                    conversation_history=history,
                    personality_mode=profile.personality_mode,
                    user_profile=profile_dict,
                    memory_context=memory_context,
                    emotion_context=emotion_analysis,
                    stream=True,
                ):
                    full_response += token
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            # Save user message to DB
            user_msg = Message(
                conversation_id=conv.id,
                user_id=user_id,
                role=MessageRole.USER,
                content=payload.content,
                emotion_snapshot=emotion_analysis.get("emotions"),
            )
            db.add(user_msg)
            await db.flush()

            # Save assistant message to DB
            ai_msg = Message(
                conversation_id=conv.id,
                user_id=user_id,
                role=MessageRole.ASSISTANT,
                content=full_response,
            )
            db.add(ai_msg)

            # Save emotion score
            emotions = emotion_analysis.get("emotions", {})
            hidden = emotion_analysis.get("hidden_emotion", {})
            wellbeing = calculate_wellbeing_score(emotions)
            
            emotion_score = EmotionScore(
                user_id=user_id,
                message_id=user_msg.id,
                happiness=emotions.get("happiness", 50),
                sadness=emotions.get("sadness", 0),
                anxiety=emotions.get("anxiety", 0),
                stress=emotions.get("stress", 0),
                frustration=emotions.get("frustration", 0),
                confidence=emotions.get("confidence", 50),
                hope=emotions.get("hope", 50),
                motivation=emotions.get("motivation", 50),
                loneliness=emotions.get("loneliness", 0),
                exhaustion=emotions.get("exhaustion", 0),
                hidden_emotion_label=hidden.get("label"),
                hidden_emotion_confidence=hidden.get("confidence", 0),
                hidden_emotion_reasoning=hidden.get("reasoning"),
                wellbeing_score=wellbeing,
            )
            db.add(emotion_score)

            # Update conversation count
            conv.message_count += 2
            
            await db.commit()

            # Update history cache
            await _update_history_cache(conv_id_str, "user", payload.content)
            await _update_history_cache(conv_id_str, "assistant", full_response)

            # Auto-store important conversation memory
            if len(payload.content) > 50:  # Substantial message worth remembering
                try:
                    await store_memory(
                        user_id=str(user_id),
                        memory_id=str(user_msg.id),
                        layer=MemoryLayer.CONVERSATION,
                        content=payload.content,
                        importance_score=min(1.0, len(payload.content) / 500),
                    )
                except Exception as mem_err:
                    logger.warning(f"Memory storage error (non-fatal): {mem_err}")

            yield f"data: {json.dumps({'type': 'done', 'emotion_snapshot': emotion_analysis.get('emotions'), 'wellbeing_score': wellbeing, 'crisis_detected': crisis_check['crisis_detected']})}\n\n"

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': 'Something went wrong'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history/{conversation_id}", response_model=ConversationResponse)
async def get_conversation_history(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full conversation history."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == uuid.UUID(conversation_id),
            Conversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at)
    )
    messages = msg_result.scalars().all()
    conv.messages = messages

    return ConversationResponse.model_validate(conv)


@router.get("/conversations")
async def list_conversations(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's conversations, most recent first."""
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.started_at))
        .offset(offset)
        .limit(per_page)
    )
    conversations = result.scalars().all()
    
    return {
        "conversations": [
            {
                "id": str(c.id),
                "started_at": c.started_at.isoformat(),
                "message_count": c.message_count,
                "summary": c.summary,
            }
            for c in conversations
        ],
        "page": page,
    }
