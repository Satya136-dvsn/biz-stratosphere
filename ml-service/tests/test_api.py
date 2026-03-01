# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import pytest
from fastapi.testclient import TestClient
from main import app
from app.api.deps import get_current_user

# Mock authentication
async def mock_get_current_user():
    return {"sub": "test-user-id"}

app.dependency_overrides[get_current_user] = mock_get_current_user

@pytest.fixture
def client():
    # Use context manager to trigger lifespan events
    with TestClient(app) as c:
        yield c

def test_protected_ml_endpoint_without_auth():
    # Clear overrides to test protection
    app.dependency_overrides = {}
    
    with TestClient(app) as c:
        response = c.post("/api/v1/ml/predict", json={
            "model_name": "churn_model",
            "features": {"age": 30}
        })
        
    assert response.status_code == 403 # HTTPBearer returns 403 if missing completely
    
    # Restore overrides
    app.dependency_overrides[get_current_user] = mock_get_current_user

def test_protected_ml_endpoint_with_auth(client):
    # This should fail from the model_service logic but pass auth (400 or 500 layer, not 401/403)
    response = client.post("/api/v1/ml/predict", json={
        "model_name": "invalid_model",
        "features": {"age": 30}
    })
    
    # Meaning auth succeeded, model validation failed
    assert response.status_code == 500 
    assert "not found" in response.json()["detail"].lower()

def test_ml_batch_predict_auth(client):
    response = client.post("/api/v1/ml/batch-predict", json=[{"age": 30}])
    # Missing query param model_name
    assert response.status_code == 422
    
def test_list_models_auth(client):
    response = client.get("/api/v1/ml/models")
    assert response.status_code == 200
    assert "models" in response.json()
