# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger

async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Global HTTP exception handler
    """
    request_id = getattr(request.state, "request_id", None)
    
    if exc.status_code >= 500:
        logger.error(f"HTTP Exception: {exc.detail}")
        
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "request_id": request_id
            }
        },
    )

async def global_exception_handler(request: Request, exc: Exception):
    """
    Global unhandled exception handler
    """
    request_id = getattr(request.state, "request_id", None)
    
    # Extract code name or fallback
    error_code = "INTERNAL_SERVER_ERROR"
    if hasattr(exc, "code"):
        error_code = exc.code
        
    logger.exception(f"Global unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": "Internal Server Error",
                "request_id": request_id
            }
        },
    )
