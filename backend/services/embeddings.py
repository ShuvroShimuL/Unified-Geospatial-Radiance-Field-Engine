import os
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def embed(text: str) -> list[float]:
    r = await client.embeddings.create(model="text-embedding-3-small", input=text)
    return r.data[0].embedding
