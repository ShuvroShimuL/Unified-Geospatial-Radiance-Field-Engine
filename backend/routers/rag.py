import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from auth import get_current_user
from db.queries import get_pool, run_spatial_rag
from services.cache import cache_get, cache_set
from services.embeddings import embed
from services.rag_pipeline import run_rag

router = APIRouter()

class RagRequest(BaseModel):
    lat: float
    lon: float
    query: str

@router.post("/api/rag")
async def rag_query(body: RagRequest, user=Depends(get_current_user), pool=Depends(get_pool)):
    # 1. Check cache
    cached = cache_get(body.lat, body.lon, body.query)
    if cached:
        return {"response": cached, "cached": True}

    # 2. Build search bbox (≈500m radius in degrees)
    delta = 0.0045
    bbox_wkt = (f"POLYGON(({body.lon-delta} {body.lat-delta},"
                f"{body.lon+delta} {body.lat-delta},"
                f"{body.lon+delta} {body.lat+delta},"
                f"{body.lon-delta} {body.lat+delta},"
                f"{body.lon-delta} {body.lat-delta}))")

    # 3. Embed query
    embedding = await embed(body.query)

    # 4. Spatial + semantic search
    async with pool.acquire() as conn:
        rows = await run_spatial_rag(conn, embedding, bbox_wkt)

    chunks = [r["chunk_text"] for r in rows]

    # 5. LLM generation
    response = await run_rag(body.lat, body.lon, body.query, chunks)

    # 6. Cache result
    cache_set(body.lat, body.lon, body.query, response)

    return {"response": response, "cached": False}
