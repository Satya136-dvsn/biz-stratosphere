from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

app = FastAPI(
    title="Biz Stratosphere ML Service",
    description="ML predictions and explanations API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")

class PredictionRequest(BaseModel):
    prompt: str
    model: str = "llama3.1"
    temperature: float = 0.7
    max_tokens: int = 1000

class ExplainRequest(BaseModel):
    features: Dict[str, Any]
    model_type: str = "revenue"

@app.get("/")
async def root():
    return {
        "service": "Biz Stratosphere ML API",
        "status": "running",
        "endpoints": [
            "/predict",
            "/explain",
            "/models",
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Ollama connection
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        ollama_status = "healthy" if response.ok else "unhealthy"
    except Exception as e:
        ollama_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "ollama": ollama_status,
        "ollama_host": OLLAMA_HOST
    }

@app.post("/predict")
async def predict(request: PredictionRequest):
    """
    Make predictions using Ollama models
    """
    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": request.model,
                "prompt": request.prompt,
                "stream": False,
                "options": {
                    "temperature": request.temperature,
                    "num_predict": request.max_tokens
                }
            },
            timeout=60
        )
        
        if not response.ok:
            raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
        
        result = response.json()
        return {
            "response": result.get("response", ""),
            "model": request.model,
            "done": result.get("done", False),
            "total_duration": result.get("total_duration", 0),
            "eval_count": result.get("eval_count", 0)
        }
    
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Ollama request timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
async def explain_prediction(request: ExplainRequest):
    """
    Generate SHAP-style explanations for predictions
    """
    try:
        features = request.features
        
        # Simulate SHAP values based on business logic
        # In real implementation, this would use actual ML model
        feature_importance = {}
        
        if request.model_type == "revenue":
            # Revenue prediction explanation
            feature_importance = {
                "customers": min(abs(hash(str(features.get("customers", 0))) % 100) / 100, 1.0),
                "avg_deal_size": min(abs(hash(str(features.get("avg_deal_size", 0))) % 100) / 100, 1.0),
                "churn_rate": min(abs(hash(str(features.get("churn_rate", 0))) % 100) / 100, 1.0),
                "market_conditions": min(abs(hash(str(features.get("market", "stable"))) % 100) / 100, 1.0)
            }
        elif request.model_type == "churn":
            # Churn prediction explanation
            feature_importance = {
                "usage_frequency": min(abs(hash(str(features.get("usage", 0))) % 100) / 100, 1.0),
                "support_tickets": min(abs(hash(str(features.get("tickets", 0))) % 100) / 100, 1.0),
                "payment_issues": min(abs(hash(str(features.get("payment", 0))) % 100) / 100, 1.0),
                "tenure": min(abs(hash(str(features.get("tenure", 0))) % 100) / 100, 1.0)
            }
        else:
            # Generic explanation
            feature_importance = {
                key: min(abs(hash(str(value)) % 100) / 100, 1.0)
                for key, value in features.items()
            }
        
        # Sort by importance
        sorted_features = dict(sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        ))
        
        return {
            "model_type": request.model_type,
            "feature_importance": sorted_features,
            "explanation": f"The most important factors for {request.model_type} prediction are: " + 
                          ", ".join(list(sorted_features.keys())[:3]),
            "confidence": sum(sorted_features.values()) / len(sorted_features)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    """
    List available Ollama models
    """
    try:
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=10)
        
        if not response.ok:
            return {
                "models": [],
                "error": "Could not fetch models from Ollama"
            }
        
        data = response.json()
        models = data.get("models", [])
        
        return {
            "models": [
                {
                    "name": model.get("name"),
                    "size": model.get("size", 0),
                    "modified_at": model.get("modified_at"),
                }
                for model in models
            ],
            "count": len(models)
        }
    
    except Exception as e:
        return {
            "models": [],
            "error": str(e)
        }

@app.post("/chat")
async def chat_completion(request: PredictionRequest):
    """
    Chat completion endpoint compatible with OpenAI format
    """
    try:
        # Use Ollama for chat
        response = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": request.model,
                "messages": [
                    {"role": "user", "content": request.prompt}
                ],
               "stream": False
            },
            timeout=60
        )
        
        if not response.ok:
            # Fallback to generate endpoint
            return await predict(request)
        
        result = response.json()
        message = result.get("message", {})
        
        return {
            "response": message.get("content", ""),
            "model": request.model,
            "role": message.get("role", "assistant")
        }
    
    except Exception as e:
        # Fallback to generate endpoint
        return await predict(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
