from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Union

async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Global HTTP exception handler
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

async def global_exception_handler(request: Request, exc: Exception):
    """
    Global unhandled exception handler
    """
    # Log the error here (in a real app)
    print(f"Global error: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )
