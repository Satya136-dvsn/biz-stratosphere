import asyncio
import os
import sys
import io
import json
from httpx import AsyncClient, ASGITransport

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Set bad environment variables BEFORE importing anything else
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:pass@localhost:54321/db"
os.environ["SUPABASE_URL"] = "http://localhost:54322"
os.environ["OLLAMA_HOST"] = "http://localhost:54323"
os.environ["VITE_GEMINI_API_KEY"] = "mock_key"

from main import app
from app.core.config import get_settings

settings = get_settings()

async def run_tests():
    print(f"Testing with DB: {os.environ.get('DATABASE_URL')}", file=sys.stderr)
    print(f"Testing with Supabase: {settings.SUPABASE_URL}", file=sys.stderr)
    print(f"Testing with Ollama: {settings.OLLAMA_HOST}", file=sys.stderr)
    
    # Capture logs
    captured_logs = io.StringIO()
    sys.stdout = captured_logs
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test 1: Healthcheck
        print("\n--- Testing /health ---", file=sys.stderr)
        res_health = await client.get("/health")
        print(f"Status: {res_health.status_code}", file=sys.stderr)
        print(f"Body: {json.dumps(res_health.json(), indent=2)}", file=sys.stderr)
        
        # Test 2: Ready check
        print("\n--- Testing /ready ---", file=sys.stderr)
        res_ready = await client.get("/ready")
        print(f"Status: {res_ready.status_code}", file=sys.stderr)
        print(f"Body: {json.dumps(res_ready.json(), indent=2)}", file=sys.stderr)
        
        # Test 3: JWKS failure (Protected endpoint)
        print("\n--- Testing Protected Endpoint (JWKS Unreachable) ---", file=sys.stderr)
        # Mocking a structurally valid JWT token
        import jwt
        token = jwt.encode({"sub": "123", "role": "admin"}, "secret", algorithm="HS256", headers={"kid": "fake-kid"})
        res_protected = await client.post("/api/v1/ml/predict", json={"model_name": "churn_model", "features": {"age": 30}}, headers={"Authorization": f"Bearer {token}"})
        print(f"Status: {res_protected.status_code}", file=sys.stderr)
        print(f"Body: {json.dumps(res_protected.json(), indent=2)}", file=sys.stderr)
        
        # Test 4: Ollama Unreachable (Skipping auth via dependency override just to test endpoint logic)
        print("\n--- Testing Ollama Unreachable ---", file=sys.stderr)
        from app.api.deps import get_current_user
        app.dependency_overrides[get_current_user] = lambda: {"sub": "123", "user_role": "admin"}
        
        res_ollama = await client.post("/api/v1/llm/predict", json={"prompt": "Hello", "model": "llama3"})
        print(f"Status: {res_ollama.status_code}", file=sys.stderr)
        print(f"Body: {json.dumps(res_ollama.json(), indent=2)}", file=sys.stderr)

    # Restore stdout
    sys.stdout = sys.__stdout__
    
    with open("c:/biz-stratosphere-main/direct_test_output.txt", "w", encoding="utf-8") as f:
        f.write("--- 1. Testing Valid Request (Observability Middleware) ---\n")
        f.write("--- CAPTURED LOGS ---\n")
        logs = captured_logs.getvalue().strip().split('\n')
        for log in logs:
            if log:
                try:
                    log_data = json.loads(log)
                    msg = log_data.get("text", "")
                    if "error" in msg.lower() or "warning" in msg.lower() or "exception" in msg.lower():
                        f.write(msg.strip() + "\n")
                except:
                    pass
        f.write("\n\n--- RAW OUTPUT DUMP ---\n")
        f.write(captured_logs.getvalue())

if __name__ == "__main__":
    asyncio.run(run_tests())
