from pydantic import BaseModel
from typing import Dict, Any

class MLPredictionRequest(BaseModel):
    model_name: str
    features: Dict[str, Any]
