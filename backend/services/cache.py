from upstash_redis import Redis
import os
import hashlib

_redis = Redis(
    url=os.environ.get("UPSTASH_REDIS_REST_URL", ""),
    token=os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")
)

def _key(lat: float, lon: float, query: str) -> str:
    grid = f"{round(lat*200)/200}:{round(lon*200)/200}"
    qhash = hashlib.md5(query.encode()).hexdigest()[:8]
    return f"rag:{grid}:{qhash}"

def cache_get(lat: float, lon: float, query: str):
    try:
        return _redis.get(_key(lat, lon, query))
    except Exception as e:
        print(f"Redis get failed: {e}")
        return None

def cache_set(lat: float, lon: float, query: str, value: str, ttl: int = 3600):
    try:
        _redis.set(_key(lat, lon, query), value, ex=ttl)
    except Exception as e:
        print(f"Redis set failed: {e}")
