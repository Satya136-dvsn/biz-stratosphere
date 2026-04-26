"""
Biz Stratosphere - Output Correctness Checker (v2)
===================================================
Tests:
 1.  Shared library exports
 2.  Observability modules (metrics + tracing)
 3.  ML Inference MODELS_DIR path resolution + model presence
 4.  API Gateway configuration
 5.  Demo dataset logical consistency
 6.  Error response schema (correct API)
 7.  Circuit Breaker state machine logic
 8.  Retry backoff correctness
 9.  Service port binding config
10.  Frontend Supabase configuration
"""
import sys, os, re, asyncio, time
from pathlib import Path

ROOT = Path(__file__).parent.parent           # backend/
sys.path.insert(0, str(ROOT))

results = []

def check(name, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    results.append((status, name, detail))
    line = f"  [{status}] {name}"
    if detail and status == "FAIL":
        line += f"\n         !! {detail}"
    print(line)

print("\n" + "=" * 60)
print("  Biz Stratosphere - Output Correctness Check v2")
print("=" * 60)

# ── 1. Shared Library Exports ──────────────────────────────
print("\n-- 1. Shared Library Exports --")
try:
    from shared import (
        make_health_router, make_exception_handlers, make_breaker,
        CircuitBreakerError, retry_with_backoff, build_error_json,
        ErrorCodes, Timeouts
    )
    check("make_health_router exported", callable(make_health_router))
    check("make_breaker exported", callable(make_breaker))
    check("build_error_json exported", callable(build_error_json))
    # Correct constant names as defined in errors.py
    check("ErrorCodes.UPSTREAM_TIMEOUT exists", hasattr(ErrorCodes, "UPSTREAM_TIMEOUT"))
    check("ErrorCodes.CIRCUIT_OPEN exists",     hasattr(ErrorCodes, "CIRCUIT_OPEN"))
    check("ErrorCodes.INTERNAL_ERROR exists",   hasattr(ErrorCodes, "INTERNAL_ERROR"))
    check("ErrorCodes.MODEL_NOT_LOADED exists", hasattr(ErrorCodes, "MODEL_NOT_LOADED"))
    # Correct timeout name as defined in http_client.py
    check("Timeouts.GATEWAY_DEFAULT exists",    hasattr(Timeouts, "GATEWAY_DEFAULT"))
    check("Timeouts.ANY_TO_OLLAMA exists",      hasattr(Timeouts, "ANY_TO_OLLAMA"))
    check("Timeouts.HEALTH_CHECK exists",       hasattr(Timeouts, "HEALTH_CHECK"))
    check("CircuitBreakerError is Exception",   issubclass(CircuitBreakerError, Exception))
except Exception as e:
    check("Shared library importable", False, str(e))

# ── 2. Observability Modules ───────────────────────────────
print("\n-- 2. Observability Modules --")
try:
    from shared.metrics import get_or_create_metrics, make_metrics_router
    from shared.tracing import init_tracer, make_traces_router
    check("metrics: get_or_create_metrics", callable(get_or_create_metrics))
    check("metrics: make_metrics_router",   callable(make_metrics_router))
    check("tracing: init_tracer",           callable(init_tracer))
    check("tracing: make_traces_router",    callable(make_traces_router))
except Exception as e:
    check("Observability modules importable", False, str(e))

# ── 3. ML Inference MODELS_DIR ────────────────────────────
print("\n-- 3. ML Inference MODELS_DIR --")
ml_main = ROOT / "ml_inference" / "main.py"
try:
    content = ml_main.read_text()
    check("MODELS_DIR uses Path(__file__)", "Path(__file__)" in content)
    check("No hardcoded /app in ml_inference", "/app" not in content)
    models_dir = ROOT.parent / "models"
    check("models/ directory exists", models_dir.exists(),
          f"Expected: {models_dir}")
    if models_dir.exists():
        pkl_files = list(models_dir.glob("*.pkl"))
        check("At least 1 .pkl model present", len(pkl_files) > 0,
              "No .pkl files found – ML predictions will fail")
        if pkl_files:
            print(f"         Found {len(pkl_files)} model(s): {[f.name for f in pkl_files]}")
except Exception as e:
    check("ML inference path analysis", False, str(e))

# ── 4. API Gateway Configuration ──────────────────────────
print("\n-- 4. API Gateway Configuration --")
gw_main = ROOT / "api_gateway" / "main.py"
try:
    content = gw_main.read_text()
    check("No hardcoded /app in api_gateway",   "/app" not in content)
    check("ALLOWED_ORIGINS includes port 5173", "5173" in content)
    check("Circuit breakers defined",           "make_breaker" in content)
    check("JWT / Supabase auth configured",     "SUPABASE" in content)
    check("Chat router imported",               "chat_router" in content or "router as chat_router" in content)
    check("CB failure_threshold set",           "failure_threshold" in content)
    check("CB recovery_timeout set",            "recovery_timeout" in content)
except Exception as e:
    check("API gateway config analysis", False, str(e))

# ── 5. Demo Dataset Logical Consistency ───────────────────
print("\n-- 5. Demo Dataset Logical Consistency --")
try:
    demo_file = ROOT.parent / "src" / "data" / "demoDataset.ts"
    demo_content = demo_file.read_text()

    total_revenue    = int(re.search(r'totalRevenue:\s*([\d_]+)',    demo_content).group(1).replace('_',''))
    active_customers = int(re.search(r'activeCustomers:\s*([\d_]+)', demo_content).group(1).replace('_',''))
    churn_rate       = float(re.search(r'churnRate:\s*([\d.]+)',     demo_content).group(1))
    avg_deal_size    = int(re.search(r'averageDealSize:\s*([\d_]+)', demo_content).group(1).replace('_',''))

    check("totalRevenue > 0",   total_revenue > 0)
    check("activeCustomers > 0", active_customers > 0)
    check("churnRate in realistic SaaS range (1-20%)", 1.0 <= churn_rate <= 20.0,
          f"churnRate={churn_rate}")

    # averageDealSize should be within 50% of revenue/customers
    computed_avg = total_revenue / active_customers
    ratio = avg_deal_size / computed_avg
    check("averageDealSize within 50% of revenue/customers",
          0.5 <= ratio <= 1.5,
          f"averageDealSize={avg_deal_size}, computed={computed_avg:.0f}, ratio={ratio:.2f}")

    chart_entries = len(re.findall(r"\{ month:", demo_content))
    check("Chart data has 12 months", chart_entries == 12, f"Found {chart_entries}")

    months = re.findall(r"revenue:\s*(\d+)", demo_content)
    revenues = [int(m) for m in months]
    check("Revenue shows growth trend (Dec > Jan)", revenues[-1] > revenues[0],
          f"Dec={revenues[-1]}, Jan={revenues[0]}")
except Exception as e:
    check("Demo dataset consistency", False, str(e))

# ── 6. Error Response Schema ──────────────────────────────
print("\n-- 6. Error Response Schema --")
try:
    from shared.errors import build_error_response, build_error_json, ErrorCodes, ErrorResponse
    from fastapi.responses import JSONResponse

    # build_error_response returns an ErrorResponse model
    resp = build_error_response(
        code=ErrorCodes.INTERNAL_ERROR,
        message="test error",
        service="test-svc",
    )
    check("build_error_response returns ErrorResponse", isinstance(resp, ErrorResponse))
    check("error.code is correct",   resp.error.code == ErrorCodes.INTERNAL_ERROR)
    check("error.message is correct", resp.error.message == "test error")
    check("error.service is set",     resp.error.service == "test-svc")
    check("success flag is False",    resp.success is False)

    # build_error_json returns JSONResponse
    json_resp = build_error_json(
        status_code=500,
        code=ErrorCodes.INTERNAL_ERROR,
        message="test",
        service="gw",
    )
    check("build_error_json returns JSONResponse", isinstance(json_resp, JSONResponse))
    check("build_error_json status_code is 500",   json_resp.status_code == 500)
except Exception as e:
    check("Error schema validation", False, str(e))

# ── 7. Circuit Breaker Logic ───────────────────────────────
print("\n-- 7. Circuit Breaker Logic --")
try:
    from shared.resilience import CircuitBreaker, CircuitBreakerError

    async def run_cb_test():
        cb = CircuitBreaker("test-cb", failure_threshold=2, recovery_timeout=60)
        check("CB initial state is CLOSED", cb.state == "CLOSED")

        for _ in range(2):
            try:
                async def fail(): raise ValueError("sim")
                await cb.call(fail)
            except Exception:
                pass

        check("CB opens after 2 failures", cb.state == "OPEN",
              f"Expected OPEN, got {cb.state}")

        try:
            async def success(): return "ok"
            await cb.call(success)
            check("CB rejects calls when OPEN", False, "Expected CircuitBreakerError")
        except CircuitBreakerError:
            check("CB raises CircuitBreakerError when OPEN", True)
        except Exception as e:
            check("CB raises CircuitBreakerError when OPEN", False, str(e))

    asyncio.run(run_cb_test())
except Exception as e:
    check("Circuit breaker logic", False, str(e))

# ── 8. Retry Backoff ──────────────────────────────────────
print("\n-- 8. Retry Backoff --")
try:
    call_times = []

    async def flaky():
        call_times.append(time.monotonic())
        if len(call_times) < 3:
            raise ValueError("transient")
        return "ok"

    result = asyncio.run(retry_with_backoff(flaky, max_attempts=3, base_delay=0.05))
    check("Succeeds on 3rd attempt", result == "ok")
    check("Called exactly 3 times", len(call_times) == 3, f"Called {len(call_times)}x")
    if len(call_times) >= 2:
        d1 = call_times[1] - call_times[0]
        check("First delay > 40ms", d1 > 0.04, f"{d1*1000:.0f}ms")
    if len(call_times) == 3:
        d2 = call_times[2] - call_times[1]
        check("Second delay >= first (exponential)", d2 >= d1 * 0.9,
              f"d2={d2*1000:.0f}ms vs d1={d1*1000:.0f}ms")
except Exception as e:
    check("Retry backoff logic", False, str(e))

# ── 9. Service Port Config ────────────────────────────────
print("\n-- 9. Service Port Config --")
port_checks = [
    ("api_gateway/main.py",    "8000", ["8001", "8002", "8003"]),
    ("ml_inference/main.py",   "8001", []),
    ("llm_orchestrator/main.py","8002", []),
    ("rag_service/main.py",    "8003", []),
    ("embedding_worker/main.py","8004", []),
]
for svc_path, own_port, upstreams in port_checks:
    c = (ROOT / svc_path).read_text()
    check(f"{svc_path} contains port {own_port}", own_port in c)
    for p in upstreams:
        check(f"  -> references upstream {p}", p in c)

# ── 10. Frontend Supabase Config ──────────────────────────
print("\n-- 10. Frontend Supabase Configuration --")
try:
    client_ts = ROOT.parent / "src" / "integrations" / "supabase" / "client.ts"
    check("Supabase client file exists", client_ts.exists(), str(client_ts))
    if client_ts.exists():
        c = client_ts.read_text()
        check("VITE_SUPABASE_URL env var used",      "VITE_SUPABASE_URL" in c)
        check("VITE_SUPABASE_ANON_KEY env var used", "VITE_SUPABASE_ANON_KEY" in c)
        check("No bare supabase.co hardcoded URL",
              "supabase.co" not in c or "import.meta.env" in c)
except Exception as e:
    check("Frontend env config", False, str(e))

# ── Summary ───────────────────────────────────────────────
print("\n" + "=" * 60)
passed = sum(1 for r in results if r[0] == "PASS")
failed = sum(1 for r in results if r[0] == "FAIL")
print(f"  Results: {passed}/{len(results)} passed, {failed} failed")
print("=" * 60)
if failed:
    print("\n  FAILED:")
    for s, n, d in results:
        if s == "FAIL":
            print(f"  x {n}" + (f": {d}" if d else ""))
else:
    print("\n  All output correctness checks passed!")
sys.exit(0 if failed == 0 else 1)
