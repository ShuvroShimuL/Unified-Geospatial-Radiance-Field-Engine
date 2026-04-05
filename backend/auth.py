import os
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt, JWTError
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "default_secret_key")
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/api/auth/login")
async def login(req: LoginRequest):
    test_user = os.environ.get("TEST_USERNAME", "admin")
    test_pass = os.environ.get("TEST_PASSWORD", "changeme")

    if req.username == test_user and req.password == test_pass:
        expiration = datetime.utcnow() + timedelta(hours=24)
        token = jwt.encode({"sub": req.username, "exp": expiration}, SECRET_KEY, algorithm=ALGORITHM)
        return {"token": token}

    raise HTTPException(status_code=401, detail="Invalid credentials")

from fastapi import Request

async def get_current_user(req: Request):
    token = req.headers.get("Authorization", "").removeprefix("Bearer ")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
