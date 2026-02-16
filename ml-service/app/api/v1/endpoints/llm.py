# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from fastapi import APIRouter, HTTPException
import requests
from app.core.config import get_settings
from app.schemas.llm import OllamaPredictionRequest

router = APIRouter()
settings = get_settings()

@router.post("/predict")
async def llm_predict(request: OllamaPredictionRequest):
    """
    Make predictions using Ollama models
    """
    try:
        response = requests.post(
            f"{settings.OLLAMA_HOST}/api/generate",
            json={
                "model": request.model,
                "prompt": request.prompt,
                "stream": False,
                "options": {
                    "temperature": request.temperature,
                    "num_predict": request.max_tokens
                }
            },
            timeout=settings.OLLAMA_TIMEOUT
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

@router.post("/chat")
async def llm_chat(request: OllamaPredictionRequest):
    """
    Chat completion endpoint
    """
    try:
        response = requests.post(
            f"{settings.OLLAMA_HOST}/api/chat",
            json={
                "model": request.model,
                "messages": [
                    {"role": "user", "content": request.prompt}
                ],
               "stream": False
            },
            timeout=settings.OLLAMA_TIMEOUT
        )
        
        if not response.ok:
            # Fallback to generate endpoint if chat fails
            return await llm_predict(request)
        
        result = response.json()
        message = result.get("message", {})
        
        return {
            "response": message.get("content", ""),
            "model": request.model,
            "role": message.get("role", "assistant")
        }
    
    except Exception:
        # Fallback
        return await llm_predict(request)

@router.get("/models")
async def list_llm_models():
    """
    List available Ollama models
    """
    try:
        response = requests.get(f"{settings.OLLAMA_HOST}/api/tags", timeout=10)
        
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
