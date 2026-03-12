"""
Global JSON Error Schema – Biz Stratosphere Phase 5
All inter-service calls MUST return one of these shapes.
"""
from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, Field
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Canonical error payload
# ──────────────────────────────────────────────
class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code, e.g. 'MODEL_NOT_LOADED'")
    message: str = Field(..., description="Human-readable description")
    service: Optional[str] = Field(None, description="Originating service name")
    details: Optional[Any] = Field(None, description="Extra context (stack trace stripped in prod)")


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    request_id: Optional[str] = None


class SuccessResponse(BaseModel):
    success: bool = True
    data: Any
    request_id: Optional[str] = None


# ──────────────────────────────────────────────
# Standard error codes
# ──────────────────────────────────────────────
class ErrorCodes:
    # Client errors
    VALIDATION_ERROR = "VALIDATION_ERROR"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"

    # Service-level errors
    UPSTREAM_TIMEOUT = "UPSTREAM_TIMEOUT"
    CIRCUIT_OPEN = "CIRCUIT_OPEN"
    MODEL_NOT_LOADED = "MODEL_NOT_LOADED"
    DB_UNAVAILABLE = "DB_UNAVAILABLE"
    OLLAMA_UNAVAILABLE = "OLLAMA_UNAVAILABLE"
    EMBEDDING_FAILED = "EMBEDDING_FAILED"
    RETRIEVAL_FAILED = "RETRIEVAL_FAILED"
    GENERATION_FAILED = "GENERATION_FAILED"

    # System errors
    INTERNAL_ERROR = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"


def build_error_response(
    code: str,
    message: str,
    service: Optional[str] = None,
    details: Optional[Any] = None,
    request_id: Optional[str] = None,
) -> ErrorResponse:
    return ErrorResponse(
        success=False,
        error=ErrorDetail(code=code, message=message, service=service, details=details),
        request_id=request_id,
    )


def build_error_json(
    status_code: int,
    code: str,
    message: str,
    service: Optional[str] = None,
    request_id: Optional[str] = None,
) -> JSONResponse:
    body = build_error_response(
        code=code, message=message, service=service, request_id=request_id
    )
    return JSONResponse(status_code=status_code, content=body.model_dump())


# ──────────────────────────────────────────────
# FastAPI exception handlers
# ──────────────────────────────────────────────
def make_exception_handlers(service_name: str):
    """Return (exception_type, handler) tuples to register on a FastAPI app."""
    from fastapi import HTTPException
    from fastapi.exceptions import RequestValidationError

    async def http_exception_handler(request: Request, exc: HTTPException):
        request_id = getattr(request.state, "request_id", None)
        return build_error_json(
            status_code=exc.status_code,
            code=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
            service=service_name,
            request_id=request_id,
        )

    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, "request_id", None)
        return build_error_json(
            status_code=422,
            code=ErrorCodes.VALIDATION_ERROR,
            message="Request validation failed",
            service=service_name,
            request_id=request_id,
        )

    async def global_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", None)
        logger.exception(f"[{service_name}] Unhandled error on {request.url.path}: {exc}")
        return build_error_json(
            status_code=500,
            code=ErrorCodes.INTERNAL_ERROR,
            message="An unexpected error occurred",
            service=service_name,
            request_id=request_id,
        )

    return [
        (HTTPException, http_exception_handler),
        (RequestValidationError, validation_exception_handler),
        (Exception, global_exception_handler),
    ]
