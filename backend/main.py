import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env before importing routers that use it
load_dotenv()

from auth import router as auth_router
from routers.splats import router as splats_router
from routers.rag import router as rag_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(splats_router)
app.include_router(rag_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
