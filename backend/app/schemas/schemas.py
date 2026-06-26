"""
Pydantic Schemas for NiteBuddy API
Request and response models
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime, date
import uuid

from app.models.models import PersonalityMode, GoalCategory, GoalStatus, MemoryLayer


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    name: str = Field(min_length=1, max_length=100)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    onboarding_complete: bool


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class GoogleAuthRequest(BaseModel):
    code: str


# ── Profile Schemas ───────────────────────────────────────────────────────────

class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=13, le=120)
    gender: Optional[str] = None
    occupation: Optional[str] = None
    interests: Optional[List[str]] = None
    hobbies: Optional[List[str]] = None
    goals_summary: Optional[str] = None
    relationship_status: Optional[str] = None
    daily_routine: Optional[str] = None
    personality_mode: Optional[PersonalityMode] = None
    timezone: Optional[str] = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    interests: Optional[List[str]] = None
    hobbies: Optional[List[str]] = None
    goals_summary: Optional[str] = None
    relationship_status: Optional[str] = None
    personality_mode: PersonalityMode
    onboarding_complete: bool
    timezone: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class OnboardingRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=13, le=120)
    gender: Optional[str] = None
    occupation: Optional[str] = None
    interests: Optional[List[str]] = None
    hobbies: Optional[List[str]] = None
    goals_summary: Optional[str] = None
    relationship_status: Optional[str] = None
    personality_mode: PersonalityMode = PersonalityMode.FRIEND
    timezone: str = "UTC"


# ── Chat Schemas ──────────────────────────────────────────────────────────────

class ChatMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    conversation_id: Optional[str] = None  # None = start new conversation


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    content: str
    emotion_snapshot: Optional[dict] = None
    created_at: datetime


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    started_at: datetime
    message_count: int
    summary: Optional[str] = None
    messages: List[MessageResponse] = []


# ── Emotion Schemas ───────────────────────────────────────────────────────────

class EmotionScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    happiness: float
    sadness: float
    anxiety: float
    stress: float
    frustration: float
    confidence: float
    hope: float
    motivation: float
    loneliness: float
    exhaustion: float
    hidden_emotion_label: Optional[str] = None
    hidden_emotion_confidence: float
    hidden_emotion_reasoning: Optional[str] = None
    wellbeing_score: float
    created_at: datetime


class EmotionTrendPoint(BaseModel):
    date: datetime
    happiness: float
    sadness: float
    stress: float
    motivation: float
    loneliness: float
    wellbeing_score: float


class EmotionTrendsResponse(BaseModel):
    period: str  # "daily" | "weekly" | "monthly"
    data: List[EmotionTrendPoint]
    avg_wellbeing: float
    trend_direction: str  # "improving" | "declining" | "stable"


# ── Memory Schemas ────────────────────────────────────────────────────────────

class MemoryCreateRequest(BaseModel):
    layer_type: MemoryLayer
    content: str = Field(min_length=1, max_length=5000)
    importance_score: float = Field(default=0.5, ge=0.0, le=1.0)


class MemoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    layer_type: MemoryLayer
    content: str
    summary: Optional[str] = None
    importance_score: float
    access_count: int
    created_at: datetime


# ── Journal Schemas ───────────────────────────────────────────────────────────

class JournalEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    entry_date: date
    highlights: Optional[str] = None
    achievements: Optional[str] = None
    emotional_changes: Optional[str] = None
    reflection_notes: Optional[str] = None
    growth_insights: Optional[str] = None
    emotion_summary: Optional[dict] = None
    generated_at: datetime


# ── Goal Schemas ──────────────────────────────────────────────────────────────

class GoalCreateRequest(BaseModel):
    category: GoalCategory
    title: str = Field(min_length=1, max_length=300)
    description: Optional[str] = None
    target_date: Optional[date] = None
    milestones: Optional[List[dict]] = None


class GoalUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    progress_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    status: Optional[GoalStatus] = None
    milestones: Optional[List[dict]] = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: GoalCategory
    title: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    progress_pct: float
    status: GoalStatus
    milestones: Optional[List[dict]] = None
    created_at: datetime
    updated_at: datetime


# ── Dashboard Schemas ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_conversations: int
    total_messages: int
    days_active: int
    current_streak: int
    avg_wellbeing_score: float
    wellbeing_trend: str  # "improving" | "declining" | "stable"
    top_emotions: dict[str, float]
    recent_achievements: List[dict]
    active_goals_count: int
    completed_goals_count: int


# ── Common ────────────────────────────────────────────────────────────────────

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class APIResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
