"""
NiteBuddy Memory Agent

Manages vector-based memory retrieval and storage using Qdrant.
Implements 5 memory layers:
- Profile: Personal preferences, interests
- Relationship: Friends, family, important people
- Goal: Career, fitness, learning goals
- Emotional: Emotional events and triggers
- Conversation: Important discussion snippets
"""
import uuid
from typing import Optional
from loguru import logger

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter,
    FieldCondition, MatchValue, SearchRequest,
)
from sentence_transformers import SentenceTransformer

from app.core.config import settings
from app.models.models import MemoryLayer

# Qdrant collection names
COLLECTIONS = {
    MemoryLayer.PROFILE: "profile_memory",
    MemoryLayer.RELATIONSHIP: "relationship_memory",
    MemoryLayer.GOAL: "goal_memory",
    MemoryLayer.EMOTIONAL: "emotional_memory",
    MemoryLayer.CONVERSATION: "conversation_memory",
}

VECTOR_SIZE = 384  # all-MiniLM-L6-v2 output dimension

_qdrant_client: AsyncQdrantClient | None = None
_embedding_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _embedding_model


async def get_qdrant() -> AsyncQdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = AsyncQdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
        )
        logger.info(f"Qdrant client connected: {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
    return _qdrant_client


async def init_collections():
    """Create Qdrant collections if they don't exist."""
    client = await get_qdrant()
    existing = {c.name for c in (await client.get_collections()).collections}

    for layer, collection_name in COLLECTIONS.items():
        if collection_name not in existing:
            await client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
            logger.info(f"✅ Created Qdrant collection: {collection_name}")
        else:
            logger.debug(f"Qdrant collection exists: {collection_name}")


async def store_memory(
    user_id: str,
    memory_id: str,
    layer: MemoryLayer,
    content: str,
    importance_score: float = 0.5,
    metadata: Optional[dict] = None,
) -> str:
    """
    Store a memory in the appropriate Qdrant collection.
    Returns the Qdrant point ID.
    """
    model = get_embedding_model()
    embedding = model.encode(content).tolist()

    client = await get_qdrant()
    collection = COLLECTIONS[layer]

    point_id = str(uuid.uuid4())
    payload = {
        "user_id": user_id,
        "memory_id": memory_id,
        "content": content,
        "importance_score": importance_score,
        "layer": layer.value,
        **(metadata or {}),
    }

    await client.upsert(
        collection_name=collection,
        points=[PointStruct(id=point_id, vector=embedding, payload=payload)],
    )
    logger.debug(f"Memory stored: layer={layer.value}, id={point_id}")
    return point_id


async def retrieve_relevant_memories(
    user_id: str,
    query: str,
    layers: Optional[list[MemoryLayer]] = None,
    top_k: int = 5,
    score_threshold: float = 0.5,
) -> list[dict]:
    """
    Retrieve semantically relevant memories for a given query.
    
    Args:
        user_id: The user's ID
        query: The query to search for (usually the current message)
        layers: Memory layers to search (None = all layers)
        top_k: Number of results per layer
        score_threshold: Minimum cosine similarity score
    
    Returns:
        List of relevant memories sorted by relevance
    """
    model = get_embedding_model()
    query_embedding = model.encode(query).tolist()
    client = await get_qdrant()

    search_layers = layers or list(MemoryLayer)
    all_results = []

    for layer in search_layers:
        collection = COLLECTIONS[layer]
        try:
            results = await client.search(
                collection_name=collection,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                ),
                limit=top_k,
                score_threshold=score_threshold,
                with_payload=True,
            )

            for hit in results:
                all_results.append({
                    "layer": layer.value,
                    "content": hit.payload.get("content", ""),
                    "importance_score": hit.payload.get("importance_score", 0.5),
                    "relevance_score": hit.score,
                    "memory_id": hit.payload.get("memory_id"),
                })
        except Exception as e:
            logger.warning(f"Memory retrieval error for {collection}: {e}")

    # Sort by combined relevance + importance
    all_results.sort(
        key=lambda x: x["relevance_score"] * 0.7 + x["importance_score"] * 0.3,
        reverse=True,
    )
    return all_results[:top_k * 2]  # Return top results across all layers


def format_memories_for_context(memories: list[dict]) -> str:
    """Format retrieved memories into a context string for the AI."""
    if not memories:
        return ""
    
    sections = {
        "profile": [],
        "relationship": [],
        "goal": [],
        "emotional": [],
        "conversation": [],
    }
    
    for mem in memories:
        layer = mem.get("layer", "conversation")
        sections[layer].append(mem["content"])
    
    parts = []
    if sections["profile"]:
        parts.append("ABOUT USER: " + " | ".join(sections["profile"][:2]))
    if sections["relationship"]:
        parts.append("PEOPLE IN THEIR LIFE: " + " | ".join(sections["relationship"][:2]))
    if sections["goal"]:
        parts.append("THEIR GOALS: " + " | ".join(sections["goal"][:2]))
    if sections["emotional"]:
        parts.append("EMOTIONAL HISTORY: " + " | ".join(sections["emotional"][:2]))
    if sections["conversation"]:
        parts.append("PAST CONVERSATIONS: " + " | ".join(sections["conversation"][:3]))
    
    return "\n".join(parts)
