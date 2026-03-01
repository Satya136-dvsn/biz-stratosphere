# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from fastapi import APIRouter, HTTPException, Depends
import httpx
from loguru import logger
from app.core.config import get_settings
from app.schemas.llm import OllamaPredictionRequest
from app.api.deps import get_current_user, RoleChecker

router = APIRouter()
settings = get_settings()

allow_all = RoleChecker(["admin", "analyst", "viewer"])
allow_analysts = RoleChecker(["admin", "analyst"])

@router.post("/predict")
async def llm_predict(request: OllamaPredictionRequest, current_user: dict = Depends(allow_all)):
    """
    Make predictions using Ollama models
    """
    try:
        async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/generate",
                json={
                    "model": request.model,
                    "prompt": request.prompt,
                    "stream": False,
                    "options": {
                        "temperature": request.temperature,
                        "num_predict": request.max_tokens
                    }
                }
            )
            
            if not response.is_success:
                raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
            
            result = response.json()
            return {
                "response": result.get("response", ""),
                "model": request.model,
                "done": result.get("done", False),
                "total_duration": result.get("total_duration", 0),
                "eval_count": result.get("eval_count", 0)
            }
    
    except httpx.ReadTimeout:
        raise HTTPException(status_code=504, detail="Ollama request timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Ollama connection error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in llm_predict: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/chat")
async def llm_chat(request: OllamaPredictionRequest, current_user: dict = Depends(allow_all)):
    """
    Chat completion endpoint
    """
    try:
        async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/chat",
                json={
                    "model": request.model,
                    "messages": [
                        {"role": "user", "content": request.prompt}
                    ],
                   "stream": False
                }
            )
            
            if not response.is_success:
                # Fallback to generate endpoint if chat fails
                return await llm_predict(request, current_user)
            
            result = response.json()
            message = result.get("message", {})
            
            return {
                "response": message.get("content", ""),
                "model": request.model,
                "role": message.get("role", "assistant")
            }
    
    except Exception as e:
        logger.warning(f"Error in chat endpoint, falling back to generate: {e}")
        # Fallback
        return await llm_predict(request, current_user)

@router.get("/models")
async def list_llm_models(current_user: dict = Depends(allow_all)):
    """
    List available Ollama models
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{settings.OLLAMA_HOST}/api/tags")
            
            if not response.is_success:
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
        logger.error(f"Failed to list Ollama models: {e}")
        return {"models": [], "error": "Service unavailable"}
