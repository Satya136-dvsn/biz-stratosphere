import asyncio
import io
import sys
from fastapi.testclient import TestClient
from main import app

def run_tests():
    client = TestClient(app)
    
    # Capture standard out for log inspection
    captured_output = io.StringIO()
    sys.stdout = captured_output
    
    print("--- 1. Testing Valid Request (Observability Middleware) ---", file=sys.stderr)
    res_ready = client.get("/ready", headers={"X-Request-ID": "test-req-123"})
    print("Ready Status:", res_ready.status_code, res_ready.json(), file=sys.stderr)
    print("Headers:", res_ready.headers.get("x-request-id"), res_ready.headers.get("x-content-type-options"), file=sys.stderr)
    
    print("--- 2. Testing Intended Error (Exception Middleware) ---", file=sys.stderr)
    res_err = client.post("/api/v1/ml/predict", json={"invalid": "payload"}, headers={"X-Request-ID": "test-req-456"})
    print("Error Payload:", res_err.status_code, res_err.json(), file=sys.stderr)
    
    sys.stdout = sys.__stdout__
    
    print("\n--- CAPTURED JSON LOGS ---")
    print(captured_output.getvalue().strip())

if __name__ == "__main__":
    run_tests()
