from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional
import secrets


class Settings(BaseSettings):
    # App
    APP_NAME: str = "NiteBuddy"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://nitebuddy:nitebuddy_secret@localhost:5432/nitebuddy_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333

    # AI Provider
    AI_PROVIDER: str = "ollama"  # "ollama" | "openai" | "compatible"
    AI_MODEL: str = "qwen3:8b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    COMPATIBLE_API_URL: Optional[str] = None
    COMPATIBLE_API_KEY: Optional[str] = None

    # Embeddings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/google/callback"

    # Frontend
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://nitebuddy.ai",
    ]

    # Safety Engine
    CRISIS_RESPONSE_ENABLED: bool = True

    # Sentry
    SENTRY_DSN: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def enforce_async_db_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: any) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}

    @property
    def openai_base_url(self) -> str:
        """Get the OpenAI-compatible base URL based on provider."""
        if self.AI_PROVIDER == "ollama":
            return f"{self.OLLAMA_BASE_URL}/v1"
        elif self.AI_PROVIDER == "compatible" and self.COMPATIBLE_API_URL:
            return self.COMPATIBLE_API_URL
        return "https://api.openai.com/v1"

    @property
    def effective_api_key(self) -> str:
        """Get the effective API key based on provider."""
        if self.AI_PROVIDER == "ollama":
            return "ollama"  # Ollama accepts any key
        elif self.AI_PROVIDER == "compatible" and self.COMPATIBLE_API_KEY:
            return self.COMPATIBLE_API_KEY
        return self.OPENAI_API_KEY or "not-set"

    @property
    def effective_model(self) -> str:
        if self.AI_PROVIDER == "openai":
            return self.OPENAI_MODEL
        return self.AI_MODEL


settings = Settings()
