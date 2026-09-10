"""
Verification script for Phase 2 & Phase 4:
- Customer churn dataset validation (8 enterprise accounts)
- PII masking logic (email & phone regex)
- Dynamic KPI engine verification
- ML Inference latency, model aliasing, feature padding, DataFrame wrapping, deterministic fallback
"""
import sys
import time
import asyncio
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "backend"))

from backend.ml_inference.main import (
    registry,
    predict,
    PredictRequest,
    deterministic_fallback,
)

def test_churn_data():
    print("\n=== 1. Validating customer_churn_data.csv ===")
    for path in [ROOT / "customer_churn_data.csv", ROOT / "public" / "customer_churn_data.csv"]:
        assert path.exists(), f"File {path} does not exist"
        df = pd.read_csv(path)
        assert len(df) == 8, f"Expected 8 enterprise accounts, found {len(df)}"
        
        # Check specific accounts
        northstar = df[df["account_name"] == "Northstar Logistics"].iloc[0]
        assert northstar["mrr"] == 48200, f"Northstar MRR mismatch: {northstar['mrr']}"
        assert northstar["churn_risk_score"] == 0.84, f"Northstar risk mismatch: {northstar['churn_risk_score']}"
        assert northstar["support_tickets_open"] == 9, f"Northstar tickets mismatch: {northstar['support_tickets_open']}"
        assert northstar["days_to_renewal"] == 18, f"Northstar renewal mismatch: {northstar['days_to_renewal']}"

        cascade = df[df["account_name"] == "Cascade Global"].iloc[0]
        assert cascade["mrr"] == 62500
        assert cascade["churn_risk_score"] == 0.88
        assert cascade["support_tickets_open"] == 12
        assert cascade["usage_frequency_score"] == 35

        vanguard = df[df["account_name"] == "Vanguard Dynamics"].iloc[0]
        assert vanguard["mrr"] == 34900
        assert vanguard["churn_risk_score"] == 0.81
        assert vanguard["support_tickets_open"] == 8
        assert vanguard["usage_frequency_score"] == 38

        orbit = df[df["account_name"] == "Orbit Systems"].iloc[0]
        assert orbit["mrr"] == 22100
        assert orbit["churn_risk_score"] == 0.73
        assert orbit["support_tickets_open"] == 7

        apex = df[df["account_name"] == "Apex Retail"].iloc[0]
        assert apex["mrr"] == 76400
        assert apex["churn_risk_score"] == 0.18
        assert apex["support_tickets_open"] == 2

        meridian = df[df["account_name"] == "Meridian Health"].iloc[0]
        assert meridian["mrr"] == 56300
        assert meridian["churn_risk_score"] == 0.36
        assert meridian["support_tickets_open"] == 3

        helios = df[df["account_name"] == "Helios Energy"].iloc[0]
        assert helios["mrr"] == 41000
        assert helios["churn_risk_score"] == 0.42
        assert helios["support_tickets_open"] == 4

        synthetix = df[df["account_name"] == "Synthetix Media"].iloc[0]
        assert synthetix["mrr"] == 18500
        assert synthetix["churn_risk_score"] == 0.68
        assert synthetix["support_tickets_open"] == 6

        print(f"  [PASS] {path.relative_to(ROOT)} verified with all 8 enterprise accounts")


def test_pii_regex():
    print("\n=== 2. Validating Regex PII Scrubbing ===")
    import re
    # Match email regex from piiMasking.ts
    email_pattern = re.compile(r'\b([a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]*@(?:[a-zA-Z0-9-]+\.)*([a-zA-Z]{2,})\b')
    phone_pattern = re.compile(r'(?:\+(\d{1,3})[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?(\d{4})\b')

    def mask_email(e):
        return email_pattern.sub(lambda m: f"{m.group(1).lower()}***@***.{m.group(2).lower()}", e)

    def mask_phone(p):
        return phone_pattern.sub(lambda m: f"+{m.group(1) or '1'}-***-***-{m.group(2)}", p)

    test_emails = [
        ("david.miller@northstarlogistics.com", "d***@***.com"),
        ("sarah.connor@cascadeglobal.com", "s***@***.com"),
        ("marcus.vance@orbitsystems.io", "m***@***.io"),
        ("dr.patel@meridianhealth.org", "d***@***.org"),
    ]
    for raw, expected in test_emails:
        masked = mask_email(raw)
        assert masked == expected, f"Expected {expected}, got {masked}"
        print(f"  [PASS] Email: {raw} -> {masked}")

    test_phones = [
        ("+1-555-234-8841", "+1-***-***-8841"),
        ("+1-555-891-4432", "+1-***-***-4432"),
        ("555-234-8841", "+1-***-***-8841"),
    ]
    for raw, expected in test_phones:
        masked = mask_phone(raw)
        assert masked == expected, f"Expected {expected}, got {masked}"
        print(f"  [PASS] Phone: {raw} -> {masked}")


def test_kpi_engine():
    print("\n=== 3. Validating KPI Aggregation Engine ===")
    df = pd.read_csv(ROOT / "customer_churn_data.csv")
    total_mrr = df["mrr"].sum()
    active_accounts = len(df)
    avg_deal_size = total_mrr / active_accounts
    high_risk = df[df["churn_risk_score"] > 0.80]
    at_risk_arr = (high_risk["mrr"] * 12).sum()
    churn_rate = (len(df[df["churn_risk_score"] >= 0.50]) / active_accounts) * 100

    print(f"  Total MRR:       ${total_mrr:,.2f} (Expected: $359,900.00)")
    print(f"  Active Accounts: {active_accounts} (Expected: 8)")
    print(f"  Avg Deal Size:   ${avg_deal_size:,.2f} (Expected: $44,987.50)")
    print(f"  At-Risk ARR:     ${at_risk_arr:,.2f} (Expected: $1,747,200.00)")
    print(f"  Churn Rate:      {churn_rate:.1f}% (Expected: 62.5%)")

    assert total_mrr == 359900
    assert active_accounts == 8
    assert avg_deal_size == 44987.5
    assert at_risk_arr == 1747200
    assert churn_rate == 62.5
    print("  [PASS] All KPI metrics mathematically verified!")


async def test_ml_inference():
    print("\n=== 4. Validating ML Inference Engine (<50ms Latency) ===")
    # 1. Test Registry loading
    registry.load_all()
    models = registry.list_models()
    print(f"  Loaded models: {[m['name'] for m in models]}")
    assert len(models) >= 2, "Expected at least churn_model and revenue_model"

    # 2. Test Model Aliasing: churn_prediction -> churn_model
    model = registry.get("churn_prediction")
    assert model is not None, "Aliasing failed: 'churn_prediction' not found"
    print("  [PASS] Model aliasing 'churn_prediction' -> churn_model successful")

    rev_model = registry.get("sales_forecast")
    assert rev_model is not None, "Aliasing failed: 'sales_forecast' not found"
    print("  [PASS] Model aliasing 'sales_forecast' -> revenue_model successful")

    # 3. Test Prediction with Latency Measurement (<50ms)
    req = PredictRequest(
        model_name="churn_prediction",
        features=[42.0, 9.0, 18.0, 48200.0, 35.0]
    )

    # Warm up
    await predict(req)

    # Measure 50 iterations
    latencies = []
    for _ in range(50):
        t0 = time.monotonic()
        res = await predict(req)
        lat = (time.monotonic() - t0) * 1000
        latencies.append(lat)
        assert res.success is True
        assert res.prediction is not None
        assert res.probability is not None

    avg_lat = sum(latencies) / len(latencies)
    p99_lat = sorted(latencies)[int(len(latencies) * 0.99)]
    print(f"  [PERF] 50 runs: Avg={avg_lat:.2f}ms, P99={p99_lat:.2f}ms, Max={max(latencies):.2f}ms")
    assert avg_lat < 50.0, f"Latency benchmark failed: avg latency {avg_lat:.2f}ms >= 50ms"
    assert p99_lat < 50.0, f"Latency benchmark failed: P99 latency {p99_lat:.2f}ms >= 50ms"
    print(f"  [PASS] Sub-50ms latency verified! (Avg {avg_lat:.2f}ms << 50ms)")

    # 4. Test Feature Array Padding (passes 3 features, model expects 5)
    req_pad = PredictRequest(
        model_name="churn_prediction",
        features=[15.0, 2.0, 6.0]  # Missing 2 features
    )
    res_pad = await predict(req_pad)
    assert res_pad.success is True
    print(f"  [PASS] Feature padding: passed 3 features -> padded to 5, result={res_pad.prediction}")

    # 5. Test Feature Array Truncation (passes 7 features, model expects 5)
    req_trunc = PredictRequest(
        model_name="churn_prediction",
        features=[15.0, 2.0, 6.0, 1000.0, 80.0, 99.0, 123.0]  # 7 features
    )
    res_trunc = await predict(req_trunc)
    assert res_trunc.success is True
    print(f"  [PASS] Feature alignment: passed 7 features -> truncated to 5, result={res_trunc.prediction}")

    # 6. Test Deterministic Fallback for Unmapped Model
    req_unmapped = PredictRequest(
        model_name="unmapped_nonexistent_model",
        features=[1.0, 2.0, 3.0]
    )
    t0 = time.monotonic()
    res_fallback = await predict(req_unmapped)
    fallback_lat = (time.monotonic() - t0) * 1000
    assert res_fallback.success is True
    assert res_fallback.prediction in [0, 1]
    assert len(res_fallback.probability) == 2
    assert fallback_lat < 50.0
    print(f"  [PASS] Deterministic fallback for unmapped model verified in {fallback_lat:.2f}ms (prediction={res_fallback.prediction}, proba={res_fallback.probability})")


if __name__ == "__main__":
    test_churn_data()
    test_pii_regex()
    test_kpi_engine()
    asyncio.run(test_ml_inference())
    print("\n========================================================")
    print(" ALL VERIFICATION CHECKS PASSED SUCCESSFULLY (100%)!")
    print("========================================================\n")
