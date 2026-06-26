"""
NiteBuddy SQLAlchemy ORM Models
All database table definitions
"""
import uuid
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    String, Text, Integer, Float, Boolean, DateTime, Date,
    ForeignKey, JSON, Enum as SAEnum, func, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import enum
from app.core.database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class PersonalityMode(str, enum.Enum):
    FRIEND = "friend"
    MENTOR = "mentor"
    LISTENER = "listener"
    COACH = "coach"


class MemoryLayer(str, enum.Enum):
    PROFILE = "profile"
    RELATIONSHIP = "relationship"
    GOAL = "goal"
    EMOTIONAL = "emotional"
    CONVERSATION = "conversation"


class GoalCategory(str, enum.Enum):
    CAREER = "career"
    FITNESS = "fitness"
    LEARNING = "learning"
    RELATIONSHIP = "relationship"
    PERSONAL = "personal"
    FINANCIAL = "financial"
    HEALTH = "health"


class GoalStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    ABANDONED = "abandoned"


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# ── Users ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.USER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_active: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    profile: Mapped[Optional["Profile"]] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories: Mapped[List["Memory"]] = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    emotion_scores: Mapped[List["EmotionScore"]] = relationship("EmotionScore", back_populates="user", cascade="all, delete-orphan")
    behavior_metrics: Mapped[List["BehaviorMetric"]] = relationship("BehaviorMetric", back_populates="user", cascade="all, delete-orphan")
    journal_entries: Mapped[List["JournalEntry"]] = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[List["Goal"]] = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    achievements: Mapped[List["Achievement"]] = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")


# ── Profile ───────────────────────────────────────────────────────────────────

class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    interests: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    hobbies: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    goals_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    relationship_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    daily_routine: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    communication_style: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="balanced")
    personality_mode: Mapped[PersonalityMode] = mapped_column(SAEnum(PersonalityMode), default=PersonalityMode.FRIEND)
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="profile")


# ── Conversations & Messages ──────────────────────────────────────────────────

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_emotion_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[MessageRole] = mapped_column(SAEnum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    emotion_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")


# ── Emotion Scores ────────────────────────────────────────────────────────────

class EmotionScore(Base):
    __tablename__ = "emotion_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    # Core emotions (0-100)
    happiness: Mapped[float] = mapped_column(Float, default=50.0)
    sadness: Mapped[float] = mapped_column(Float, default=0.0)
    anxiety: Mapped[float] = mapped_column(Float, default=0.0)
    stress: Mapped[float] = mapped_column(Float, default=0.0)
    frustration: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=50.0)
    hope: Mapped[float] = mapped_column(Float, default=50.0)
    motivation: Mapped[float] = mapped_column(Float, default=50.0)
    loneliness: Mapped[float] = mapped_column(Float, default=0.0)
    exhaustion: Mapped[float] = mapped_column(Float, default=0.0)
    # Hidden emotion inference
    hidden_emotion_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hidden_emotion_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    hidden_emotion_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Overall score
    wellbeing_score: Mapped[float] = mapped_column(Float, default=50.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    user: Mapped["User"] = relationship("User", back_populates="emotion_scores")

    __table_args__ = (
        Index("ix_emotion_scores_user_created", "user_id", "created_at"),
    )


# ── Behavior Metrics ──────────────────────────────────────────────────────────

class BehaviorMetric(Base):
    __tablename__ = "behavior_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    avg_message_length: Mapped[float] = mapped_column(Float, default=0.0)
    daily_message_count: Mapped[int] = mapped_column(Integer, default=0)
    active_hours: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    response_delay_avg: Mapped[float] = mapped_column(Float, default=0.0)
    topics_discussed: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    emotional_drift_score: Mapped[float] = mapped_column(Float, default=0.0)
    withdrawal_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="behavior_metrics")

    __table_args__ = (
        Index("ix_behavior_metrics_user_date", "user_id", "date", unique=True),
    )


# ── Memories ──────────────────────────────────────────────────────────────────

class Memory(Base):
    __tablename__ = "memories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    layer_type: Mapped[MemoryLayer] = mapped_column(SAEnum(MemoryLayer), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    importance_score: Mapped[float] = mapped_column(Float, default=0.5)
    qdrant_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Qdrant point ID
    last_accessed: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    access_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="memories")


# ── Journal Entries ───────────────────────────────────────────────────────────

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    highlights: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    achievements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emotional_changes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reflection_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    growth_insights: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emotion_summary: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="journal_entries")


# ── Goals ─────────────────────────────────────────────────────────────────────

class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[GoalCategory] = mapped_column(SAEnum(GoalCategory), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    progress_pct: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[GoalStatus] = mapped_column(SAEnum(GoalStatus), default=GoalStatus.ACTIVE)
    milestones: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="goals")
    achievements: Mapped[List["Achievement"]] = relationship("Achievement", back_populates="goal", cascade="all, delete-orphan")


# ── Achievements ──────────────────────────────────────────────────────────────

class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    goal_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    badge_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="achievements")
    goal: Mapped[Optional["Goal"]] = relationship("Goal", back_populates="achievements")
