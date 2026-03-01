from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
import httpx

from app.core.config import get_settings
from contextlib import asynccontextmanager
from app.core.logging import setup_logging
from app.core.exceptions import http_exception_handler, global_exception_handler
from app.api.v1.router import api_router
from loguru import logger

settings = get_settings()

# Setup logging
setup_logging(json_format=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (Apply Schema) asynchronously
    try:
        from app.db.init_db import init_db
        await init_db()
        
        # Preload ML models
        from app.services.model_service import model_service
        model_service.preload_models()
    except Exception as e:
        logger.error(f"Failed to initialize on startup: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
import uuid

@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    
    start_time = time.time()
    endpoint = request.url.path
    
    # Try to extract user_id if token exists in header (very basic extraction just for logging context without blocking)
    user_id = "unauthenticated"
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        import jwt
        try:
            # We don't verify here; deps.py handles real validation. This is just for log labeling.
            unverified_payload = jwt.decode(auth_header.split(" ")[1], options={"verify_signature": False})
            user_id = unverified_payload.get("sub", "unknown")
        except Exception:
            pass

    with logger.contextualize(request_id=request_id, endpoint=endpoint, user_id=user_id):
        try:
            response = await call_next(request)
        except Exception as e:
            raise e
        finally:
            execution_time_ms = (time.time() - start_time) * 1000
            
            if 'response' in locals():
                response.headers["X-Request-ID"] = request_id
                response.headers["X-Content-Type-Options"] = "nosniff"
                response.headers["X-Frame-Options"] = "DENY"
                response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
            if endpoint not in ["/health", "/ready", "/", f"{settings.API_V1_STR}/openapi.json"]:
                with logger.contextualize(execution_time_ms=execution_time_ms):
                    if execution_time_ms > 1000:
                        logger.warning(f"{request.method} {endpoint} - SLOW")
                    else:
                        logger.info(f"{request.method} {endpoint} - OK")
    return response

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

@app.get("/version")
async def version():
    """Version and build metadata"""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": "production"
    }

@app.get("/ready")
async def ready_check():
    """Readiness probe specifically for load balancers"""
    from app.services.model_service import model_service
    from sqlalchemy import text
    from app.services.decision_logger import decision_logger
    
    # Check Model Loader
    models = model_service.list_models()
    if not models:
        return StarletteHTTPException(status_code=503, detail="Models not loaded")
        
    # Check DB Connection (Async)
    if decision_logger.engine:
        try:
            async with decision_logger.engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception as e:
            logger.error(f"Readiness probe DB failure: {e}")
            raise StarletteHTTPException(status_code=503, detail="Database connection failed")
            
    return {"status": "ready"}

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
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{settings.OLLAMA_HOST}/api/tags")
            health_status["services"]["ollama"] = {
                "status": "healthy" if response.is_success else "unhealthy",
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
