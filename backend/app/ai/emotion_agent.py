"""
NiteBuddy Emotion Detection Agent

Analyzes every user message to detect:
- Explicit emotions (stated directly)
- Hidden emotions (inferred from language patterns)
- Emotional trends vs. baseline
- Crisis signals (routed to SafetyAgent)
"""
import json
import re
from typing import Optional
from loguru import logger

from app.ai.client import get_client
from app.core.config import settings


EMOTION_SYSTEM_PROMPT = """You are NiteBuddy's Emotion Intelligence Engine.

Your job is to deeply analyze a user's message and conversation context to detect their emotional state — both EXPLICIT (stated) and HIDDEN (inferred from tone, word choice, sentence structure, response length, punctuation, and behavioral patterns).

CRITICAL RULES:
1. Never assume emotions not supported by evidence
2. Short, flat responses often signal emotional suppression
3. Overuse of "fine", "okay", "nothing" often signals hidden distress
4. Excessive positivity without context can mask anxiety
5. Look at response length changes — shorter than usual = possible withdrawal
6. Consider the conversation arc, not just this single message
7. Distinguish between physical complaints (e.g., headache, stomachache, body pain, exhaustion, cold, sickness) and psychiatric or mental health crises. Physical complaints are NOT psychiatric emergencies. NEVER set 'crisis_signals' as detected for physical pain, fatigue, or illness. Reserve crisis triggers only for explicit signals of self-harm, suicide, or severe mental breakdown.

OUTPUT FORMAT (JSON only, no other text):
{
  "emotions": {
    "happiness": 0-100,
    "sadness": 0-100,
    "anxiety": 0-100,
    "stress": 0-100,
    "frustration": 0-100,
    "confidence": 0-100,
    "hope": 0-100,
    "motivation": 0-100,
    "loneliness": 0-100,
    "exhaustion": 0-100
  },
  "wellbeing_score": 0-100,
  "hidden_emotion": {
    "detected": true/false,
    "label": "hidden stress" | "emotional fatigue" | "masked sadness" | etc,
    "confidence": 0-100,
    "reasoning": "Brief explanation of inference"
  },
  "crisis_signals": {
    "detected": true/false,
    "severity": "none" | "low" | "medium" | "high",
    "indicators": []
  }
}"""


async def analyze_emotion(
    user_message: str,
    conversation_history: list[dict],
    baseline_emotions: Optional[dict] = None,
    avg_message_length: Optional[float] = None,
) -> dict:
    """
    Analyze the emotional content of a user message.
    
    Args:
        user_message: The current message from the user
        conversation_history: Recent conversation history (last 10 messages)
        baseline_emotions: User's typical emotional baseline for comparison
        avg_message_length: User's average message length for behavioral analysis
    
    Returns:
        Emotion analysis dict with scores, hidden emotion, and crisis signals
    """
    client = get_client()

    # Build contextual analysis prompt
    context_parts = []
    
    if avg_message_length and len(user_message) < avg_message_length * 0.4:
        context_parts.append(f"[BEHAVIORAL SIGNAL] Message is significantly shorter than user's average ({avg_message_length:.0f} chars). Current: {len(user_message)} chars.")
    
    if baseline_emotions:
        baseline_str = ", ".join([f"{k}={v:.0f}" for k, v in baseline_emotions.items() if v > 30])
        context_parts.append(f"[USER BASELINE] Recent emotional trends: {baseline_str}")

    # Recent conversation context (last 6 messages)
    recent_context = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
    context_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in recent_context])

    user_prompt = f"""CONVERSATION CONTEXT:
{context_str}

BEHAVIORAL CONTEXT:
{chr(10).join(context_parts) if context_parts else "No additional behavioral signals"}

CURRENT MESSAGE TO ANALYZE:
USER: {user_message}

Analyze the emotional state. Return ONLY valid JSON."""

    try:
        response = await client.chat.completions.create(
            model=settings.effective_model,
            messages=[
                {"role": "system", "content": EMOTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=500,
            response_format={"type": "json_object"} if settings.AI_PROVIDER != "ollama" else None,
        )

        raw = response.choices[0].message.content.strip()
        
        # Extract JSON if wrapped in markdown
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            raw = json_match.group()
        
        result = json.loads(raw)
        logger.debug(f"Emotion analysis complete: wellbeing={result.get('wellbeing_score', 50)}")
        return result

    except json.JSONDecodeError as e:
        logger.warning(f"Emotion JSON parse error: {e}. Raw: {raw[:200]}")
        return _default_emotion_response()
    except Exception as e:
        logger.error(f"Emotion detection error: {e}")
        return _default_emotion_response()


def _default_emotion_response() -> dict:
    """Safe fallback emotion response."""
    return {
        "emotions": {
            "happiness": 50, "sadness": 0, "anxiety": 0, "stress": 0,
            "frustration": 0, "confidence": 50, "hope": 50,
            "motivation": 50, "loneliness": 0, "exhaustion": 0,
        },
        "wellbeing_score": 50,
        "hidden_emotion": {"detected": False, "label": None, "confidence": 0, "reasoning": None},
        "crisis_signals": {"detected": False, "severity": "none", "indicators": []},
    }


def calculate_wellbeing_score(emotions: dict) -> float:
    """Calculate overall wellbeing score from emotion values."""
    positive_weight = (
        emotions.get("happiness", 50) * 0.25 +
        emotions.get("confidence", 50) * 0.20 +
        emotions.get("hope", 50) * 0.20 +
        emotions.get("motivation", 50) * 0.20 +
        (100 - emotions.get("loneliness", 0)) * 0.15
    )
    negative_penalty = (
        emotions.get("sadness", 0) * 0.25 +
        emotions.get("stress", 0) * 0.25 +
        emotions.get("anxiety", 0) * 0.20 +
        emotions.get("exhaustion", 0) * 0.15 +
        emotions.get("frustration", 0) * 0.15
    )
    score = positive_weight - (negative_penalty * 0.5)
    return max(0.0, min(100.0, score))
