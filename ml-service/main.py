from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

# Import our ML services
from model_service import model_service
from shap_service import shap_service

app = FastAPI(
    title="Biz Stratosphere ML Service",
    description="ML predictions and explanations API with MLflow and SHAP",
    version="2.0.0"
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

# Request Models
class MLPredictionRequest(BaseModel):
    model_name: str
    features: Dict[str, Any]

class MLExplainRequest(BaseModel):
    model_name: str
    features: Dict[str, Any]
    feature_names: Optional[List[str]] = None
    include_plots: bool = True

class OllamaPredictionRequest(BaseModel):
    prompt: str
    model: str = "llama3.1"
    temperature: float = 0.7
    max_tokens: int = 1000

@app.get("/")
async def root():
    return {
        "service": "Biz Stratosphere ML API v2.0",
        "status": "running",
        "features": ["ML Predictions", "SHAP Explainability", "MLflow Integration", "Ollama LLM"],
        "endpoints": {
            "ml": ["/ml/predict", "/ml/explain", "/ml/models"],
            "llm": ["/llm/predict", "/llm/chat", "/llm/models"],
            "health": ["/health"]
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Check ML models
    try:
        models = model_service.list_models()
        health_status["services"]["ml_models"] = {
            "status": "healthy",
            "count": len(models)
        }
    except Exception as e:
        health_status["services"]["ml_models"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Check Ollama
    try:
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        health_status["services"]["ollama"] = {
            "status": "healthy" if response.ok else "unhealthy",
            "host": OLLAMA_HOST
        }
    except Exception as e:
        health_status["services"]["ollama"] = {
            "status": "unavailable",
            "error": str(e)
        }
    
    return health_status

# ============================================================================
# ML PREDICTION ENDPOINTS
# ============================================================================

@app.post("/ml/predict")
async def ml_predict(request: MLPredictionRequest):
    """
    Make predictions using trained ML models
    
    Example request:
    {
        "model_name": "churn_model",
        "features": {
            "usage_frequency": 45,
            "support_tickets": 5,
            "tenure_months": 12,
            "monthly_spend": 150.50,
            "feature_usage_pct": 60.0
        }
    }
    """
    try:
        result = model_service.predict(request.model_name, request.features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/batch-predict")
async def ml_batch_predict(model_name: str, features_list: List[Dict[str, Any]]):
    """Make batch predictions"""
    try:
        results = []
        for features in features_list:
            result = model_service.predict(model_name, features)
            results.append(result)
        
        return {
            "predictions": results,
            "count": len(results),
            "model": model_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ml/models")
async def list_ml_models():
    """List all available ML models"""
    try:
        models = model_service.list_models()
        return {
            "models": models,
            "count": len(models)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ml/models/{model_name}/info")
async def get_model_info(model_name: str):
    """Get detailed information about a specific model"""
    try:
        info = model_service.get_model_info(model_name)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SHAP EXPLAINABILITY ENDPOINTS
# ============================================================================

@app.post("/ml/explain")
async def ml_explain(request: MLExplainRequest):
    """
    Generate SHAP explanations for predictions
    
    Example request:
    {
        "model_name": "churn_model",
        "features": {...},
        "feature_names": ["usage_frequency", "support_tickets", ...],
        "include_plots": true
    }
    """
    try:
        # Load model
        model = model_service.load_model(request.model_name)
        
        # Get feature names
        feature_names = request.feature_names
        if not feature_names:
            feature_names = list(request.features.keys())
        
        # Generate explanation
        explanation = shap_service.explain_prediction(
            model,
            request.model_name,
            request.features,
            feature_names
        )
        
        # Make prediction
        prediction_result = model_service.predict(request.model_name, request.features)
        explanation["prediction"] = prediction_result.get("prediction")
        
        # Generate plots if requested
        if request.include_plots:
            waterfall = shap_service.generate_waterfall_plot(
                explanation["shap_values"],
                explanation["base_value"],
                prediction_result.get("prediction", 0)
            )
            summary = shap_service.generate_summary_plot(explanation["shap_values"])
            
            explanation["visualizations"] = {
                "waterfall_plot": waterfall,
                "summary_plot": summary
            }
        
        return explanation
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation error: {str(e)}")

# ============================================================================
# OLLAMA LLM ENDPOINTS (Keep existing functionality)
# ============================================================================

@app.post("/llm/predict")
async def llm_predict(request: OllamaPredictionRequest):
    """Make predictions using Ollama models"""
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

@app.post("/llm/chat")
async def llm_chat(request: OllamaPredictionRequest):
    """Chat completion endpoint"""
    try:
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
            return await llm_predict(request)
        
        result = response.json()
        message = result.get("message", {})
        
        return {
            "response": message.get("content", ""),
            "model": request.model,
            "role": message.get("role", "assistant")
        }
    
    except Exception:
        return await llm_predict(request)

@app.get("/llm/models")
async def list_llm_models():
    """List available Ollama models"""
    try:
        response = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=10)
        
        if not response.ok:
            return {"models": [], "error": "Could not fetch models from Ollama"}
        
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
        return {"models": [], "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("="*60)
    print("Starting Biz Stratosphere ML Service v2.0")
    print("="*60)
    print("Features:")
    print("  ✓ ML Predictions (MLflow)")
    print("  ✓ SHAP Explainability")
    print("  ✓ Ollama LLM Integration")
    print("="*60)
    uvicorn.run(app, host="0.0.0.0", port=8000)
