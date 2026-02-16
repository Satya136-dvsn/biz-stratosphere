# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from fastapi import APIRouter
from app.api.v1.endpoints import ml, llm

api_router = APIRouter()
api_router.include_router(ml.router, prefix="/ml", tags=["ml"])
api_router.include_router(llm.router, prefix="/llm", tags=["llm"])
