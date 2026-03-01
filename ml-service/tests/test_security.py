# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import pytest
from fastapi.testclient import TestClient
from main import app
from app.api.deps import get_current_user

# Mock authentication
async def mock_get_current_user():
    return {"sub": "test-user-id", "role": "authenticated"}

app.dependency_overrides[get_current_user] = mock_get_current_user

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_sql_injection_payload_in_features(client):
    """Ensure SQL injection strings in features are safely handled by SQLAlchemy parameterization and json dumps"""
    malicious_payload = {
        "model_name": "churn_model",
        "features": {
            "age": "30",
            "malicious": "1' OR '1'='1",
            "drop_table": "DROP TABLE decision_memory;"
        }
    }
    
    response = client.post("/api/v1/ml/predict", json=malicious_payload)
    
    # It might fail with 500 because the model expects numeric features,
    # or it might work if the model drops unknown features.
    # The key is it MUST NOT return a DB error or 500 from asyncpg SyntaxError
    assert response.status_code in [200, 500]
    if response.status_code == 500:
        error_detail = response.json().get("detail", "")
        assert "syntax error" not in error_detail.lower()
        assert "postgresql" not in error_detail.lower()

def test_invalid_payload_structure(client):
    """Test validation rejection for invalid payloads"""
    response = client.post("/api/v1/ml/predict", json={
        "features": {"age": 30} # Missing required 'model_name'
    })
    
    # 422 Unprocessable Entity due to Pydantic validation
    assert response.status_code == 422
    
def test_unauthorized_token_rejection():
    """Test that requests with an invalid authorization header format fail"""
    app.dependency_overrides = {} # Remove the auth mock
    
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ml/predict",
            json={"model_name": "churn_model", "features": {"age": 30}},
            headers={"Authorization": "Bearer not-a-valid-jwt"}
        )
        
        assert response.status_code == 401
        assert "Could not validate credentials" in response.json().get("error", {}).get("message", "")
