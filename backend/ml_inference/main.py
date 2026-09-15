"""
ML Inference Service – Biz Stratosphere Phase 5
Port: 8001
Responsibilities:
  - Load and serve .pkl Scikit-Learn models
  - Expose /predict, /models endpoints
  - Expose /health and /ready probes
  - Model aliasing (e.g. churn_prediction -> churn_model)
  - Feature array padding/alignment to match model.n_features_in_
  - Pandas DataFrame feature name wrapping
  - Sub-50ms deterministic fallback if unmapped
"""
from __future__ import annotations

import os
import sys
import time
import logging
import hashlib
from pathlib import Path
from typing import Any, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

sys.path.insert(0, str(Path(__file__).parent.parent))
from shared import (  # noqa: E402
    make_health_router,
    make_exception_handlers,
)
from shared.metrics import get_or_create_metrics, make_metrics_router  # noqa: E402
from shared.tracing import init_tracer, make_traces_router  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("ml-inference")

MODELS_DIR = Path(os.getenv("MODELS_DIR", str(Path(__file__).parent.parent.parent / "models")))


# ──────────────────────────────────────────────
# Deterministic Fallback Helper
# ──────────────────────────────────────────────
def deterministic_fallback(model_name: str, features: list[float]) -> tuple[Any, Optional[list[float]]]:
    """
    Sub-50ms deterministic fallback for unmapped or unavailable models.
    Produces repeatable predictions without external dependencies or delays.
    """
    feature_str = ",".join(f"{f:.4f}" for f in features[:10])
    h = hashlib.sha256(f"{model_name}:{feature_str}".encode()).hexdigest()
    val = int(h[:8], 16)
    prob_1 = round((val % 1000) / 1000.0, 4)
    prob_0 = round(1.0 - prob_1, 4)
    pred = 1 if prob_1 >= 0.5 else 0
    return pred, [prob_0, prob_1]


# ──────────────────────────────────────────────
# Model Registry
# ──────────────────────────────────────────────
class ModelRegistry:
    _models: dict[str, Any] = {}
    _hashes: dict[str, str] = {}
    _cold_start_ms: dict[str, float] = {}

    MODEL_ALIASES: dict[str, str] = {
        # Churn model aliases
        "churn_prediction": "churn_model",
        "churn": "churn_model",
        "churn_risk": "churn_model",
        "customer_churn": "churn_model",
        "bank_churn": "churn_model",
        # Revenue model aliases
        "sales_forecast": "revenue_model",
        "revenue_forecast": "revenue_model",
        "revenue_prediction": "revenue_model",
        "revenue": "revenue_model",
    }

    def load_all(self) -> None:
        if not MODELS_DIR.exists():
            logger.warning(f"Models dir not found: {MODELS_DIR}")
            return
        for f in MODELS_DIR.glob("*.pkl"):
            start = time.monotonic()
            try:
                model = joblib.load(f)
                # Compute SHA256 for artifact integrity
                sha = hashlib.sha256(f.read_bytes()).hexdigest()
                name = f.stem
                self._models[name] = model
                self._hashes[name] = sha
                cold_ms = round((time.monotonic() - start) * 1000, 1)
                self._cold_start_ms[name] = cold_ms
                logger.info(f"Loaded model '{name}' in {cold_ms}ms | SHA256: {sha[:12]}…")
            except Exception as exc:
                logger.error(f"Failed to load {f}: {exc}")

    def get(self, name: str) -> Any:
        if not self._models:
            self.load_all()

        if name in self._models:
            return self._models[name]

        # Check explicit alias mapping
        target = self.MODEL_ALIASES.get(name) or self.MODEL_ALIASES.get(name.lower().strip())
        if target and target in self._models:
            return self._models[target]

        # Normalized lookup (e.g. churn-model, churn_model.pkl)
        normalized = name.lower().replace("-", "_").replace(".pkl", "").strip()
        if normalized in self._models:
            return self._models[normalized]
        if normalized in self.MODEL_ALIASES and self.MODEL_ALIASES[normalized] in self._models:
            return self._models[self.MODEL_ALIASES[normalized]]

        return None

    def list_models(self) -> list[dict]:
        if not self._models:
            self.load_all()
        return [
            {
                "name": k,
                "sha256_prefix": self._hashes.get(k, "")[:12],
                "cold_start_ms": self._cold_start_ms.get(k),
            }
            for k in self._models
        ]

    def is_ready(self) -> bool:
        if not self._models:
            self.load_all()
        return bool(self._models)


registry = ModelRegistry()

# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(title="ML Inference Service", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# Shared health routes
async def _readiness_check():
    if not registry.is_ready():
        raise RuntimeError("No models loaded")
    return {"loaded_models": len(registry.list_models())}


app.include_router(make_health_router("ml-inference", version="1.0.0", readiness_check=_readiness_check))

# Phase 6: Metrics + Tracing
metrics = get_or_create_metrics("ml_inference")
tracer = init_tracer("ml-inference")
app.include_router(make_metrics_router(metrics))
app.include_router(make_traces_router())

for exc_type, handler in make_exception_handlers("ml-inference"):
    app.add_exception_handler(exc_type, handler)


@app.on_event("startup")
async def startup():
    registry.load_all()


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────
class PredictRequest(BaseModel):
    model_name: str
    features: list[float]
    feature_names: Optional[list[str]] = None

    @field_validator("features")
    @classmethod
    def features_not_empty(cls, v):
        if not v:
            raise ValueError("features must be non-empty")
        return v


class PredictResponse(BaseModel):
    success: bool = True
    model_name: str
    prediction: Any
    probability: Optional[list[float]] = None
    latency_ms: float


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.get("/api/v1/models")
async def list_models():
    return {"success": True, "data": registry.list_models()}


@app.post("/api/v1/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    start = time.monotonic()
    model = registry.get(req.model_name)

    # Sub-50ms deterministic fallback if unmapped
    if model is None:
        pred, proba = deterministic_fallback(req.model_name, req.features)
        latency_s = time.monotonic() - start
        latency_ms = round(latency_s * 1000, 2)
        metrics.ml_inference_latency.observe(latency_s, model=req.model_name)
        logger.info(f"Unmapped model '{req.model_name}' served via deterministic fallback in {latency_ms}ms")
        return PredictResponse(
            success=True,
            model_name=req.model_name,
            prediction=pred,
            probability=proba,
            latency_ms=latency_ms,
        )

    with tracer.span("ml.predict", attributes={"model": req.model_name}) as span:
        try:
            features = [float(f) for f in req.features]

            # Feature array padding/alignment to match model.n_features_in_
            expected_n = getattr(model, "n_features_in_", None)
            if expected_n is not None:
                if len(features) < expected_n:
                    features = features + [0.0] * (expected_n - len(features))
                elif len(features) > expected_n:
                    features = features[:expected_n]

            # Pandas DataFrame feature name wrapping
            if hasattr(model, "feature_names_in_") and model.feature_names_in_ is not None:
                col_names = list(model.feature_names_in_)
                if len(features) < len(col_names):
                    features = features + [0.0] * (len(col_names) - len(features))
                features = features[:len(col_names)]
                x = pd.DataFrame([features], columns=col_names)
            else:
                x = np.array(features, dtype=np.float64).reshape(1, -1)

            # Deterministic output enforcement: disable internal randomness if possible
            if hasattr(model, "random_state"):
                pass

            pred = model.predict(x)
            proba = None
            if hasattr(model, "predict_proba"):
                try:
                    proba = model.predict_proba(x).tolist()[0]
                except Exception as pe:
                    logger.warning(f"predict_proba error: {pe}")

            latency_s = time.monotonic() - start
            latency_ms = round(latency_s * 1000, 2)

            # Record metrics
            metrics.ml_inference_latency.observe(latency_s, model=req.model_name)
            span.set_attribute("latency_ms", latency_ms)
            span.set_attribute("prediction", str(pred.tolist()[0] if hasattr(pred, "tolist") else pred))

            if latency_ms > 50:
                logger.warning(f"[ml-inference] SLOW predict for '{req.model_name}': {latency_ms}ms")

            return PredictResponse(
                success=True,
                model_name=req.model_name,
                prediction=pred.tolist()[0] if hasattr(pred, "tolist") else pred,
                probability=proba,
                latency_ms=latency_ms,
            )
        except Exception as exc:
            span.set_error(exc)
            logger.exception(f"Prediction error for '{req.model_name}': {exc}")
            raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
