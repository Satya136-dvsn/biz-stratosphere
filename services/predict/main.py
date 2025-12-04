import joblib
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any

app = FastAPI()

class PredictRequest(BaseModel):
    features: dict
    model_version: str = "v1"

class PredictResponse(BaseModel):
    prediction: Any
    probability: float = None
    model_version: str

# Load model artifacts directory
MODEL_DIR = Path(os.getenv("MODEL_DIR", "models"))

# Cache loaded models
loaded_models = {}

def load_model(version: str):
    if version in loaded_models:
        return loaded_models[version]

    model_path = MODEL_DIR / f"random_forest_{version}.pkl"
    if not model_path.exists():
        raise HTTPException(status_code=404, detail=f"Model version {version} not found")

    model = joblib.load(model_path)
    loaded_models[version] = model
    return model

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    features = req.features
    model_version = req.model_version

    try:
        model = load_model(model_version)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Prepare features for prediction
    # Assuming features dict keys match model training feature names
    feature_values = [features.get(k, 0) for k in model.feature_names_in_]

    pred = model.predict([feature_values])[0]
    prob = None
    if hasattr(model, "predict_proba"):
        prob = float(model.predict_proba([feature_values])[0][1])

    return PredictResponse(prediction=int(pred), probability=prob, model_version=model_version)
