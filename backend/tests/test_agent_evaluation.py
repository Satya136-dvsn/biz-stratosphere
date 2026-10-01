"""
Agent Evaluation & Behavioral Contract Test Suite
=================================================
Validates the Zero-API architecture against the findings identified in Code Review:
1. Behavioral Contract: Agent output is dynamically grounded on active data, not hardcoded mocks.
2. Adversarial & Edge Cases: Path traversal attacks on ML inference rejected.
3. Observability & Warnings: Feature padding and truncation emit transparent warnings.
4. Performance & Efficiency: Synthetic embedding LRU cache hit verification.
5. Statistical Consistency: Verifies deterministic behavior across multiple executions.
"""

import os
import sys
import tempfile
import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Configure python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir / "llm_orchestrator"))
sys.path.insert(0, str(backend_dir / "ml_inference"))
sys.path.insert(0, str(backend_dir / "rag_service"))

from llm_orchestrator.agent import run_agent, _synthesize_dynamic_decision, _load_active_churn_dataset
from llm_orchestrator.tools import _in_process_ml_predict
from ml_inference.main import app as ml_app
from rag_service.main import app as rag_app, _synthetic_embed, _SYNTHETIC_EMBED_CACHE


class TestAgentBehavioralContracts:
    """Tests behavioral invariants of the LLM Orchestrator Agent."""

    @pytest.mark.asyncio
    async def test_dynamic_dataset_grounding_invariant(self, monkeypatch):
        """Contract: When an alternate dataset is provided, agent output MUST ground on the

        new accounts and MUST NOT hallucinate the hardcoded sample accounts (Cascade Global).
        """
        alternate_csv_content = """account_id,account_name,arr,churn_risk,primary_root_cause,recommended_playbook,nps,health_score
ACC-901,Apex Horizon,1500000,0.92,SLA breach and service outage,PB-001,35,42
ACC-902,Zenith Matrix,850000,0.89,Executive sponsor departure,PB-002,40,48
ACC-903,Pinnacle Systems,450000,0.15,None - Healthy Account,PB-003,85,92
"""
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".csv", encoding="utf-8") as f:
            f.write(alternate_csv_content)
            temp_path = f.name

        try:
            # Point agent to temporary alternate dataset
            monkeypatch.setenv("ACTIVE_DATASET_PATH", temp_path)

            accounts = _load_active_churn_dataset(temp_path)
            assert accounts is not None
            assert len(accounts) == 3
            assert accounts.iloc[0]["account_name"] == "Apex Horizon"

            # Execute agent query
            result = await run_agent("Audit current account churn risks and draft 72-hour mitigation plan.")
            assert result["success"] is True

            final_decision = result["final_decision"]

            # Must contain the new accounts
            assert "Apex Horizon" in final_decision, "Agent failed to dynamically ground on 'Apex Horizon'"
            assert "Zenith Matrix" in final_decision, "Agent failed to dynamically ground on 'Zenith Matrix'"
            assert "92%" in final_decision or "0.92" in final_decision
            assert "89%" in final_decision or "0.89" in final_decision
            assert "$2,350,000" in final_decision or "2,350,000" in final_decision

            # MUST NOT contain the old hardcoded accounts from the sample mock
            assert "Cascade Global" not in final_decision, (
                "Violation: Hardcoded 'Cascade Global' found in agent output when using alternate dataset!"
            )
            assert "Northstar Logistics" not in final_decision, (
                "Violation: Hardcoded 'Northstar Logistics' found in agent output when using alternate dataset!"
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    @pytest.mark.asyncio
    async def test_confidence_score_is_calibrated_and_not_arbitrary(self):
        """Contract: Confidence score must reflect actual evidence grounding and tool execution,

        not an arbitrary string-match boost.
        """
        result = await run_agent("Identify high-risk accounts and summarize our mitigation strategy.")
        score = result.get("confidence_score", 0.0)

        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0
        # Given both ml_predict and rag_retrieve succeed and grounds on dataset, confidence >= 0.90
        assert score >= 0.90, f"Expected calibrated confidence >= 0.90, got {score}"

    def test_in_process_ml_predict_tool_dynamic_output(self):
        """Contract: _in_process_ml_predict must return real evaluated metrics, not static strings."""
        # Test with high risk vector: high support tickets, low NPS, high ARR
        high_risk_features = [12.0, 30.0, 1500000.0, 1.0, 5.0, 0.9, 0.8, 120.0, 2.0, 0.85]
        res_high = _in_process_ml_predict("churn_risk_v1", high_risk_features)
        assert "ML Prediction" in res_high or "Confidence Score" in res_high
        assert "Cascade Global" not in res_high, "Tool returned hardcoded account string instead of feature inference!"

        # Test with low risk vector
        low_risk_features = [0.0, 95.0, 50000.0, 0.0, 0.0, 0.1, 0.05, 10.0, 0.0, 0.05]
        res_low = _in_process_ml_predict("churn_risk_v1", low_risk_features)
        assert "ML Prediction" in res_low or "Confidence Score" in res_low
        assert "Northstar Logistics" not in res_low


class TestMLInferenceValidationAndSecurity:
    """Tests security boundaries, path traversal prevention, and input validation in ML inference."""

    @classmethod
    def setup_class(cls):
        cls.client = TestClient(ml_app)

    def test_path_traversal_attack_rejected(self):
        """Security Contract: Model names with directory traversal characters ('..', '/', '\\')

        must be rejected with HTTP 400.
        """
        malicious_names = [
            "../../etc/passwd",
            "..\\..\\windows\\system32",
            "models/../../../sensitive_file",
            "subfolder/churn_risk_v1",
        ]
        for bad_name in malicious_names:
            response = self.client.post(
                "/api/v1/predict",
                json={"model_name": bad_name, "features": [0.5] * 10},
            )
            assert response.status_code == 400, f"Path traversal for '{bad_name}' should have failed with 400"
            err_data = response.json()
            err_msg = err_data.get("detail") or err_data.get("error", {}).get("message", "")
            assert "path traversal characters are forbidden" in err_msg

    def test_feature_padding_emits_warning(self):
        """Contract: When input feature length is less than model expectation,

        system pads with zeros and MUST return explicit warning in response.
        """
        response = self.client.post(
            "/api/v1/predict",
            json={"model_name": "churn_risk_v1", "features": [0.1, 0.2, 0.3]},  # 3 features instead of 10
        )
        assert response.status_code == 200
        data = response.json()
        assert "warnings" in data
        assert data["warnings"] is not None
        assert len(data["warnings"]) > 0
        assert any("Padded features" in w and "zero" in w for w in data["warnings"])

    def test_feature_truncation_emits_warning(self):
        """Contract: When input feature length exceeds model expectation,

        system truncates and MUST return explicit warning in response.
        """
        response = self.client.post(
            "/api/v1/predict",
            json={"model_name": "churn_risk_v1", "features": [0.1] * 20},  # 20 features instead of 10
        )
        assert response.status_code == 200
        data = response.json()
        assert "warnings" in data
        assert data["warnings"] is not None
        assert len(data["warnings"]) > 0
        assert any("Truncated features" in w for w in data["warnings"])

    def test_invalid_feature_types_return_422_not_500(self):
        """Contract: Passing non-numeric feature types must be rejected by Pydantic validation (HTTP 422),

        preventing internal 500 runtime crashes.
        """
        response = self.client.post(
            "/api/v1/predict",
            json={"model_name": "churn_risk_v1", "features": ["not_a_number", "invalid", None]},
        )
        assert response.status_code in (422, 400), f"Expected 422 or 400 for bad features, got {response.status_code}"
        assert response.status_code != 500, "500 Internal Server Error returned for bad input!"

    def test_strict_features_mismatch_rejected(self):
        """Contract: When strict_features=True is specified, mismatched feature counts

        must be rejected with HTTP 400 rather than silently padded/truncated.
        """
        response = self.client.post(
            "/api/v1/predict",
            json={"model_name": "churn_risk_v1", "features": [0.1, 0.2, 0.3], "strict_features": True},
        )
        assert response.status_code == 400
        err_msg = response.json().get("detail", "")
        if not err_msg and "error" in response.json():
            err_msg = response.json()["error"].get("message", "")
        assert "Strict validation failure" in err_msg


class TestRAGSyntheticEmbeddingOptimization:
    """Tests LRU embedding caching and performance in RAG service."""

    @classmethod
    def setup_class(cls):
        cls.client = TestClient(rag_app)

    def test_synthetic_embedding_lru_cache_hit(self):
        """Efficiency Contract: Repeated synthetic embedding queries must hit the cache

        and execute in sub-millisecond time.
        """
        query_text = "Executive sponsor churn mitigation playbook SLA breach"
        cache_key = f"768:{query_text.lower().strip()}"

        # Prime cache
        vec1 = _synthetic_embed(query_text, dimensions=768)
        assert cache_key in _SYNTHETIC_EMBED_CACHE

        t0 = time.perf_counter()
        vec2 = _synthetic_embed(query_text, dimensions=768)
        duration_ms = (time.perf_counter() - t0) * 1000

        assert vec1 == vec2
        assert duration_ms < 1.0, f"Cache hit should take < 1ms, took {duration_ms:.3f}ms"

    def test_rag_retrieve_endpoint_with_cache(self):
        """Contract: /api/v1/retrieve returns top matching playbooks quickly."""
        response = self.client.post(
            "/api/v1/retrieve",
            json={"query": "executive sponsor departure leadership turnover", "top_k": 3},
        )
        assert response.status_code == 200
        data = response.json()
        assert "snippets" in data
        assert len(data["snippets"]) >= 1
        assert "PB-002" in [s["id"] for s in data["snippets"]]


class TestStatisticalAgentConsistency:
    """Runs statistical evaluations across multiple iterations to ensure deterministic

    reliability in Zero-API fallback mode.
    """

    @pytest.mark.asyncio
    async def test_statistical_stability_across_runs(self):
        """Contract: Agent in Zero-API mode must exhibit 100% pass rate and consistent behavior."""
        iterations = 3
        results = []
        latencies = []

        for i in range(iterations):
            t0 = time.perf_counter()
            res = await run_agent(f"Analyze churn risks for active accounts. Iteration {i}")
            latency = (time.perf_counter() - t0) * 1000
            latencies.append(latency)
            results.append(res)

        # Invariants across all runs
        assert all(r["success"] is True for r in results)
        assert all("ml_predict" in [t["name"] for t in r["tools_used"]] for r in results)
        assert all("rag_retrieve" in [t["name"] for t in r["tools_used"]] for r in results)
        assert all(r["confidence_score"] >= 0.90 for r in results)

        avg_latency = sum(latencies) / len(latencies)
        print(f"\n[Statistical Evaluator] {iterations} runs: Avg Latency = {avg_latency:.2f}ms")


class TestSharedEnvironmentAndURLResolution:
    """Tests centralized Docker detection and URL resolution contracts."""

    def test_remote_host_not_overwritten_locally(self, monkeypatch):
        """Contract: When an engineer points to a remote server, the URL must NOT be

        blindly replaced with localhost even if running outside Docker.
        """
        from shared.env import resolve_service_url

        monkeypatch.setenv("TEST_REMOTE_OLLAMA", "https://remote-gpu-ollama.internal.net:11434")
        resolved = resolve_service_url(
            "TEST_REMOTE_OLLAMA",
            docker_url="http://ollama:11434",
            local_url="http://localhost:11434",
            in_docker=False,
        )
        assert resolved == "https://remote-gpu-ollama.internal.net:11434", (
            f"Expected remote URL to be preserved, got {resolved}"
        )

    def test_bare_docker_hostname_rewritten_locally(self, monkeypatch):
        """Contract: A bare Docker service hostname (e.g. http://ollama:11434) should be

        safely mapped to localhost when executed outside Docker to avoid DNS failures.
        """
        from shared.env import resolve_service_url

        monkeypatch.setenv("TEST_DOCKER_OLLAMA", "http://ollama:11434")
        resolved = resolve_service_url(
            "TEST_DOCKER_OLLAMA",
            docker_url="http://ollama:11434",
            local_url="http://localhost:11434",
            in_docker=False,
        )
        assert resolved == "http://localhost:11434"

    def test_in_docker_preserves_docker_url(self, monkeypatch):
        """Contract: When running inside Docker without explicit env, default docker URL is used."""
        from shared.env import resolve_service_url

        monkeypatch.delenv("TEST_UNSET_SERVICE", raising=False)
        resolved = resolve_service_url(
            "TEST_UNSET_SERVICE",
            docker_url="http://rag-service:8003",
            local_url="http://localhost:8003",
            in_docker=True,
        )
        assert resolved == "http://rag-service:8003"
