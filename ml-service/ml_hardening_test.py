import time
import os
import psutil
from main import app
from app.services.model_service import model_service

def get_memory_mb():
    process = psutil.Process()
    # RSS: Resident Set Size - memory occupied in RAM
    return process.memory_info().rss / 1024 / 1024

def run_leak_test():
    print(f"--- ML Runtime Hardening: Memory & Determinism Test ---")
    
    # Baseline
    mem_base = get_memory_mb()
    print(f"Baseline Memory: {mem_base:.2f} MB")
    
    # 1. Test Cold Start
    print("\n[Test 1] Loading models...")
    model_service.preload_models()
    mem_loaded = get_memory_mb()
    print(f"Post-Load Memory: {mem_loaded:.2f} MB (+{mem_loaded - mem_base:.2f} MB)")
    
    # 2. Schema Enforcement
    print("\n[Test 2] Schema Enforcement...")
    valid_features = {"age": 30, "tenure": 5, "usage_frequency": 10, "support_tickets": 0, "last_purchase_days": 1, "subscription_tier": 2, "contract_length": 12, "payment_delay": 0}
    
    try:
        model_service.predict("churn_model", {"age": 30}) # Missing required schema fields
        print("FAIL: Schema missing fields bypassed validation!")
    except ValueError as e:
        print(f"PASS: Schema validation blocked missing features ({str(e)[:50]}...)")
        
    # 3. Determinism & Memory Leak Check
    print("\n[Test 3] Repeated Inference Leak Check (1000 iterations)...")
    import random
    
    start_time = time.time()
    responses = set()
    
    for i in range(1000):
        # Slightly jitter values to ensure we aren't caching, but testing actual engine determinism for the same inputs
        f = dict(valid_features)
        
        # Test exact determinism on identical requests
        resp = model_service.predict("churn_model", f)
        responses.add(resp["prediction"])
        
    end_time = time.time()
    mem_final = get_memory_mb()
    
    print(f"Final Memory: {mem_final:.2f} MB")
    diff = mem_final - mem_loaded
    print(f"Memory Drift after 1000 predictions: {diff:.2f} MB")
    print(f"Time taken: {(end_time - start_time):.2f}s ({(end_time - start_time) * 1000 / 1000:.2f}ms/op)")
    print(f"Unique outputs for identical payload: {len(responses)} (Expected: 1 = Deterministic)")
    
    if diff > 10:
        print("\nWARNING: Possible memory leak detected during inference (>10MB drift).")
    else:
        print("\nPASS: No severe memory leak detected.")

    
if __name__ == "__main__":
    run_leak_test()
