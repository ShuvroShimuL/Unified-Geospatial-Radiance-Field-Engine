import os
from fastapi import APIRouter, Depends, Query, HTTPException
from auth import get_current_user
from db.queries import get_pool, get_splats_in_bbox
import json

router = APIRouter()

@router.get("/api/splats")
async def list_splats(bbox: str = Query(...), user=Depends(get_current_user)):
    try:
        min_lon, min_lat, max_lon, max_lat = map(float, bbox.split(","))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bbox format. Use min_lon,min_lat,max_lon,max_lat")

    pool = await get_pool()
    async with pool.acquire() as conn:
        records = await get_splats_in_bbox(conn, min_lon, min_lat, max_lon, max_lat)

    results = []
    for r in records:
        results.append({
            "id": r["id"],
            "centroid": json.loads(r["centroid"]),
            "lods": json.loads(r["lods"]),
            "metadata": json.loads(r["metadata"]),
            "centroid_ecef": r["centroid_ecef"]
        })
    return results

@router.get("/api/splat-url")
async def get_splat_url(id: str, user=Depends(get_current_user)):
    # PLACEHOLDER: R2 storage not configured yet.
    # Real pre-signed URL generation added when drone data exists.
    return {"url": f"https://placeholder.example.com/splats/{id}/high.spz"}
