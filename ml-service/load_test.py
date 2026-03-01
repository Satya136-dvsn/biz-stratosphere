import asyncio
import time
import statistics
import logging
from httpx import AsyncClient, ASGITransport
from main import app
from app.api.deps import get_current_user

# Disable access logs
logging.getLogger("httpx").setLevel(logging.WARNING)

async def mock_auth():
    return {"sub": "load-test-user", "role": "admin"}

app.dependency_overrides[get_current_user] = mock_auth

async def main():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Warmup
        await client.post("/api/v1/ml/predict", json={"model_name": "churn_model", "features": {"age": 30}})
        
        reqs = 50
        print(f"Starting {reqs} concurrent requests...")
        
        start_time = time.time()
        
        async def fetch(i):
            req_start = time.time()
            res = await client.post("/api/v1/ml/predict", json={
                "model_name": "churn_model", 
                "features": {"usage_frequency": 45, "support_tickets": 5, "tenure_months": 12, "monthly_spend": 150, "feature_usage_pct": 60}
            })
            req_end = time.time()
            return req_end - req_start, res.status_code
        
        tasks = [fetch(i) for i in range(reqs)]
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        
        latencies = [r[0] for r in results]
        status_codes = [r[1] for r in results]
        
        print("\n--- Concurrency Test Results ---")
        print(f"Total time for {reqs} requests: {end_time - start_time:.3f} s")
        print(f"Min Latency: {min(latencies):.3f} s")
        print(f"Max Latency: {max(latencies):.3f} s")
        print(f"Mean Latency: {statistics.mean(latencies):.3f} s")
        print(f"Median Latency: {statistics.median(latencies):.3f} s")
        print(f"Status codes: {set(status_codes)}")
        
        # Check threadpool exhaustion
        # If max latency > 2x median, some requests queued heavily
        exhausted = max(latencies) > (2 * statistics.median(latencies)) and reqs > 40
        print(f"Threadpool Exhaustion Detected: {exhausted}")

if __name__ == "__main__":
    asyncio.run(main())
