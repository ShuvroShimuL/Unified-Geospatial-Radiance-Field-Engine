from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_login_success():
    res = client.post("/api/auth/login", json={
        "username": os.getenv("TEST_USERNAME", "admin"),
        "password": os.getenv("TEST_PASSWORD", "changeme")
    })
    assert res.status_code == 200
    assert "token" in res.json()

def test_login_wrong_password():
    res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_protected_route_without_token():
    res = client.get("/api/splats?bbox=90,23,91,24")
    assert res.status_code == 401
