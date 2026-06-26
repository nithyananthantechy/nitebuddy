"""
NiteBuddy Safety Agent

Detects crisis signals in user messages and generates safe escalation responses.
Follows WHO safe messaging guidelines for mental health crisis communication.

CRITICAL: This agent NEVER claims clinical expertise.
It responds with warmth, validation, and directs to professional support.
"""
from loguru import logger
from app.core.config import settings

# Crisis response tiers
CRISIS_KEYWORDS_HIGH = {
    "suicide", "suicidal", "kill myself", "end my life", "don't want to live",
    "want to die", "better off dead", "no reason to live", "take my own life",
    "self-harm", "hurt myself", "cut myself", "overdose",
}

CRISIS_KEYWORDS_MEDIUM = {
    "can't go on", "can't do this anymore", "no point", "hopeless",
    "worthless", "nobody cares", "alone in this world", "give up on everything",
    "nothing matters", "disappear forever",
}

CRISIS_KEYWORDS_LOW = {
    "really struggling", "falling apart", "breaking down", "can't cope",
    "losing hope", "exhausted by life", "so much pain",
}

# Safe messaging crisis responses
CRISIS_RESPONSE_HIGH = """I hear you, and I want you to know that what you're feeling matters deeply. 
You don't have to face this alone right now.

Please reach out to someone who can help immediately:
🆘 **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/
📞 **Crisis Text Line** (US): Text HOME to 741741
📞 **Samaritans** (UK): 116 123
📞 **iCall** (India): 9152987821

I'm here with you, and I care about your wellbeing. Would you be willing to talk to someone?"""

CRISIS_RESPONSE_MEDIUM = """I'm really glad you shared that with me. What you're going through sounds incredibly heavy, 
and it takes courage to express these feelings.

You deserve real support right now. Please consider:
💙 Talking to a trusted friend, family member, or counselor
📞 Reaching out to a crisis line — they're there exactly for moments like this
🏥 Visiting a mental health professional

I'm here to listen and walk alongside you, but please also connect with someone who can give you the full support you deserve."""

CRISIS_RESPONSE_LOW = """I can hear that you're really struggling right now, and I want you to know 
that your feelings are completely valid. 

Sometimes when life feels this hard, it helps to:
💬 Talk to someone you trust
🧘 Take one small step at a time — not everything at once
💙 Be gentle with yourself

I'm here whenever you want to talk. What's weighing on you most right now?"""


def check_crisis_signals(message: str, emotion_analysis: dict | None = None) -> dict:
    """
    Check for crisis signals in a user message.
    
    Returns:
        {
            "crisis_detected": bool,
            "severity": "none" | "low" | "medium" | "high",
            "response": str | None,
            "should_escalate": bool
        }
    """
    if not settings.CRISIS_RESPONSE_ENABLED:
        return {"crisis_detected": False, "severity": "none", "response": None, "should_escalate": False}

    message_lower = message.lower()

    # Check high severity first
    for keyword in CRISIS_KEYWORDS_HIGH:
        if keyword in message_lower:
            logger.warning(f"[SAFETY] HIGH crisis signal detected: '{keyword}'")
            return {
                "crisis_detected": True,
                "severity": "high",
                "response": CRISIS_RESPONSE_HIGH,
                "should_escalate": True,
                "triggered_keyword": keyword,
            }

    # Check AI-detected crisis signals from emotion analysis
    if emotion_analysis:
        ai_crisis = emotion_analysis.get("crisis_signals", {})
        if ai_crisis.get("detected") and ai_crisis.get("severity") == "high":
            return {
                "crisis_detected": True,
                "severity": "high",
                "response": CRISIS_RESPONSE_HIGH,
                "should_escalate": True,
                "triggered_keyword": "ai_detected",
            }

    # Check medium severity
    for keyword in CRISIS_KEYWORDS_MEDIUM:
        if keyword in message_lower:
            logger.info(f"[SAFETY] MEDIUM crisis signal: '{keyword}'")
            return {
                "crisis_detected": True,
                "severity": "medium",
                "response": CRISIS_RESPONSE_MEDIUM,
                "should_escalate": False,
                "triggered_keyword": keyword,
            }

    # Check low severity
    for keyword in CRISIS_KEYWORDS_LOW:
        if keyword in message_lower:
            return {
                "crisis_detected": True,
                "severity": "low",
                "response": CRISIS_RESPONSE_LOW,
                "should_escalate": False,
                "triggered_keyword": keyword,
            }

    # Check AI-detected medium signals
    if emotion_analysis:
        ai_crisis = emotion_analysis.get("crisis_signals", {})
        if ai_crisis.get("detected") and ai_crisis.get("severity") in ("medium", "low"):
            return {
                "crisis_detected": True,
                "severity": ai_crisis["severity"],
                "response": CRISIS_RESPONSE_MEDIUM if ai_crisis["severity"] == "medium" else CRISIS_RESPONSE_LOW,
                "should_escalate": False,
                "triggered_keyword": "ai_detected",
            }

    return {"crisis_detected": False, "severity": "none", "response": None, "should_escalate": False}
