from pydantic import BaseModel
from typing import Dict, Any, Optional, List

class MLPredictionRequest(BaseModel):
    model_name: str
    features: Dict[str, Any]

class MLPredictionResponse(BaseModel):
    prediction: float
    probability: Optional[float] = None
    confidence: Optional[float] = None
    model_name: str
    model_version: str
    shap_values: Optional[Dict[str, float]] = None
    decision_id: Optional[str] = None
