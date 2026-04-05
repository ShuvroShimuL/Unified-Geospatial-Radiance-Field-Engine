import asyncpg
import os
import json

async def get_pool():
    if os.environ.get("OPENAI_API_KEY") == "dummy_key_for_testing":
        return None
    return await asyncpg.create_pool(os.environ["DATABASE_URL"], min_size=1, max_size=5)

async def get_splats_in_bbox(pool, min_lon, min_lat, max_lon, max_lat):
    bbox_wkt = f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"
    return await pool.fetch(
        """SELECT id, ST_AsGeoJSON(centroid) as centroid, lods, metadata, centroid_ecef
           FROM splats
           WHERE ST_Intersects(bbox, ST_SetSRID(ST_GeomFromText($1), 4326))""",
        bbox_wkt
    )

async def run_spatial_rag(pool, embedding: list, bbox_wkt: str, top_k: int = 5):
    return await pool.fetch(
        "SELECT * FROM query_spatial_rag($1::vector, ST_SetSRID(ST_GeomFromText($2),4326), $3)",
        embedding, bbox_wkt, top_k
    )
