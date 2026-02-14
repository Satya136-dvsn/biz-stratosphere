from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
import requests

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.exceptions import http_exception_handler, global_exception_handler
from app.api.v1.router import api_router

settings = get_settings()

# Setup logging
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from app.services.model_service import model_service

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
        response = requests.get(f"{settings.OLLAMA_HOST}/api/tags", timeout=5)
        health_status["services"]["ollama"] = {
            "status": "healthy" if response.ok else "unhealthy",
            "host": settings.OLLAMA_HOST
        }
    except Exception as e:
        health_status["services"]["ollama"] = {
            "status": "unavailable",
            "error": str(e)
        }

    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
