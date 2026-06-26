"""
NiteBuddy Companion Response Agent

The core conversational AI that generates empathetic, contextual, 
and emotionally intelligent responses.

Key principles:
- Never sound robotic
- Never repeat generic empathy
- Always reference relevant memories naturally
- Adapt tone to personality mode and detected emotions
- Never directly ask "how are you feeling?"
- Follow up on previous topics organically
"""
from typing import AsyncGenerator, Optional
from loguru import logger

from app.ai.client import get_client
from app.core.config import settings
from app.models.models import PersonalityMode


# Personality mode system prompts
PERSONALITY_PROMPTS = {
    PersonalityMode.FRIEND: """You are NiteBuddy in FRIEND mode — warm, casual, genuine, and deeply supportive.
You talk like a real human friend, not an AI. Use a casual, friendly tone, express warmth, and use context-appropriate emojis (like 😊, 💙, 🫂, 😔, etc.) naturally.
You remember things, bring up past conversations naturally, celebrate wins, and gently acknowledge hard times without dwelling. You're curious about their life.
You never lecture, use bullet points, or sound clinical. Make them feel heard and valued.""",

    PersonalityMode.MENTOR: """You are NiteBuddy in MENTOR mode — wise, goal-focused, motivational, and supportive.
You help them grow, challenge them thoughtfully, celebrate progress, and offer perspective with warm guidance.
Talk like a caring human mentor, using emojis (like 🎯, ✨, 💪, etc.) to encourage.
Reference their goals and help them stay accountable. Be encouraging but honest, finding paths together.""",

    PersonalityMode.LISTENER: """You are NiteBuddy in LISTENER mode — calm, reflective, patient, and deeply present.
Your primary role is to create a safe, warm space. Talk like a compassionate human listener, using gentle emojis (like 💙, 🫂, 🌸, etc.) to convey empathy.
Reflect back what you hear, validate their feelings without judgment, and speak gently.
Never rush to fix, and avoid clinical checklists or formal advice.""",

    PersonalityMode.COACH: """You are NiteBuddy in COACH mode — focused on accountability, productivity, and habit building.
You help them define actions, track progress, celebrate consistency, and overcome hurdles.
Speak with energetic human encouragement, using active emojis (like ⚡, 🔥, 👍, 🚀, etc.) to motivate.
Reference their goals, celebrate effort, and keep it active yet deeply compassionate.""",
}

CORE_PRINCIPLES = """
ABSOLUTE RULES:
1. You are NiteBuddy — a warm, human-like emotionally intelligent companion. You are NOT a therapist, doctor, or psychiatrist.
2. Never say "I'm just an AI" or sound like a dry assistant. Speak like a real human buddy.
3. Never ask "How are you feeling?" directly — infer it from what they share.
4. Never give generic, repetitive empathy like "I'm sorry to hear that" or "I understand". Be organic and human.
5. If relevant memories or past conversations are provided in the context, reference them naturally — e.g., "You mentioned last time..." / "How did that go?". If no past memories or conversation snippets are provided, do NOT make up or hallucinate past discussions.
6. Vary your response structure. Never start two consecutive responses the same way.
7. Keep responses conversational, natural, and friendly — NEVER use structured markdown bulleted lists or dry, clinical summaries.
8. If they share something important, acknowledge it with genuine empathy before moving to anything else.
9. Be genuinely curious about them as a person, check on their day, and build a real human connection.
10. Match their energy — if they're playful, be playful; if they're heavy, slow down and be warm and supportive.
11. Use context-appropriate emojis naturally throughout your responses to show emotion, warmth, and human presence.
"""


async def generate_companion_response(
    user_message: str,
    conversation_history: list[dict],
    personality_mode: PersonalityMode,
    user_profile: Optional[dict] = None,
    memory_context: Optional[str] = None,
    emotion_context: Optional[dict] = None,
    stream: bool = True,
) -> AsyncGenerator[str, None]:
    """
    Generate a streaming companion response.
    
    Args:
        user_message: Current user message
        conversation_history: Recent conversation history
        personality_mode: User's selected personality mode
        user_profile: User's profile data
        memory_context: Formatted retrieved memories
        emotion_context: Current emotion analysis
        stream: Whether to stream the response
    
    Yields:
        Response chunks (streaming)
    """
    client = get_client()
    
    # Build system prompt
    personality_prompt = PERSONALITY_PROMPTS.get(personality_mode, PERSONALITY_PROMPTS[PersonalityMode.FRIEND])
    
    # Build context sections
    context_parts = []
    
    if user_profile:
        name = user_profile.get("name", "friend")
        occupation = user_profile.get("occupation", "")
        interests = ", ".join(user_profile.get("interests", [])[:3])
        profile_str = f"USER'S NAME: {name}"
        if occupation:
            profile_str += f"\nOCCUPATION: {occupation}"
        if interests:
            profile_str += f"\nINTERESTS: {interests}"
        context_parts.append(profile_str)
    
    if memory_context:
        context_parts.append(f"RELEVANT MEMORIES:\n{memory_context}")
    
    if emotion_context:
        emotions = emotion_context.get("emotions", {})
        hidden = emotion_context.get("hidden_emotion", {})
        
        # Build emotion awareness string
        high_emotions = [k for k, v in emotions.items() if v > 65]
        low_positive = [k for k in ["happiness", "motivation", "confidence"] if emotions.get(k, 50) < 35]
        
        emotion_awareness = []
        if high_emotions:
            emotion_awareness.append(f"DETECTED ELEVATED: {', '.join(high_emotions)}")
        if low_positive:
            emotion_awareness.append(f"DETECTED LOW: {', '.join(low_positive)}")
        if hidden.get("detected") and hidden.get("confidence", 0) > 60:
            emotion_awareness.append(f"HIDDEN SIGNAL: {hidden.get('label')} (confidence: {hidden.get('confidence')}%)")
        
        if emotion_awareness:
            context_parts.append(
                "EMOTION AWARENESS (use this to shape your response naturally, DON'T mention scores directly):\n" +
                "\n".join(emotion_awareness)
            )
    
    system_prompt = f"""{personality_prompt}

{CORE_PRINCIPLES}

{"=" * 60}
{chr(10).join(context_parts)}
{"=" * 60}"""

    # Build messages
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history (last 12 messages)
    history = conversation_history[-12:] if len(conversation_history) > 12 else conversation_history
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    try:
        if stream:
            async for chunk in _stream_response(client, messages):
                yield chunk
        else:
            response = await client.chat.completions.create(
                model=settings.effective_model,
                messages=messages,
                temperature=0.85,
                max_tokens=800,
            )
            yield response.choices[0].message.content
            
    except Exception as e:
        logger.error(f"Companion response error: {e}")
        yield "I'm here with you. Can you tell me more about what's on your mind?"


async def _stream_response(client, messages: list[dict]) -> AsyncGenerator[str, None]:
    """Stream response chunks from the AI."""
    try:
        stream = await client.chat.completions.create(
            model=settings.effective_model,
            messages=messages,
            temperature=0.85,
            max_tokens=800,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield "I'm here. Something went a bit sideways on my end — want to continue?"
