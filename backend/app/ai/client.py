"""
NiteBuddy AI Client
Unified OpenAI-compatible client for Ollama, OpenAI, and compatible APIs
"""
from openai import AsyncOpenAI
from app.core.config import settings
from loguru import logger


def get_ai_client() -> AsyncOpenAI:
    """
    Returns an AsyncOpenAI client configured for the selected AI provider.
    Works with Ollama (local), OpenAI API, or any OpenAI-compatible endpoint.
    """
    client = AsyncOpenAI(
        base_url=settings.openai_base_url,
        api_key=settings.effective_api_key,
        timeout=120.0,
        max_retries=2,
    )
    logger.debug(f"AI client initialized: provider={settings.AI_PROVIDER}, model={settings.effective_model}")
    return client


# Singleton client
_ai_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _ai_client
    if _ai_client is None:
        _ai_client = get_ai_client()
    return _ai_client
