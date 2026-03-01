# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from jose import jwt

from app.api.deps import get_current_user
from app.core.config import get_settings
from main import app

settings = get_settings()

def test_get_current_user_valid_token():
    # Create a valid token
    payload = {"sub": "user-1234", "role": "authenticated"}
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    # Mock credentials object
    class MockCredentials:
        credentials = token
    
    user = get_current_user(MockCredentials())
    assert user["sub"] == "user-1234"

def test_get_current_user_invalid_token():
    # Create an invalid token (wrong secret)
    payload = {"sub": "user-1234", "role": "authenticated"}
    token = jwt.encode(payload, "wrong-secret", algorithm=settings.JWT_ALGORITHM)
    
    # Mock credentials object
    class MockCredentials:
        credentials = token
    
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(MockCredentials())
    
    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in exc_info.value.detail
