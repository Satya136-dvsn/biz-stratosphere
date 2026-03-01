import pytest
from fastapi import HTTPException
from unittest.mock import patch, AsyncMock
from app.api.deps import get_current_user

class MockCredentials:
    def __init__(self, token):
        self.credentials = token

@pytest.mark.asyncio
async def test_get_current_user_valid_token():
    with patch("app.api.deps.jwt.get_unverified_header") as mock_header, \
         patch("app.api.deps.get_jwks", new_callable=AsyncMock) as mock_get_jwks, \
         patch("app.api.deps.jwt.decode") as mock_decode:
            
        mock_header.return_value = {"alg": "RS256", "kid": "test-kid"}
        mock_get_jwks.return_value = {"keys": [{"kid": "test-kid", "kty": "RSA"}]}
        mock_decode.return_value = {"sub": "user-1234", "role": "authenticated"}
        
        creds = MockCredentials("fake-valid-token")
        
        user = await get_current_user(creds)
        assert user["sub"] == "user-1234"

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    with patch("app.api.deps.jwt.get_unverified_header") as mock_header:
        # Simulate a token constructed with wrong algo
        mock_header.return_value = {"alg": "HS256", "kid": "test-kid"}
        
        creds = MockCredentials("fake-invalid-token")
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(creds)
            
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in exc_info.value.detail
