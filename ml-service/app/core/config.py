# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Biz Stratosphere ML Service"
    VERSION: str = "2.0.0"
    
    # CORS — NEVER use "*" in production
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:8080",
        "http://localhost:5173",
        "https://biz-stratosphere.vercel.app",
    ]
    
    # Ollama
    OLLAMA_HOST: str = "http://ollama:11434"
    OLLAMA_TIMEOUT: int = 60
    
    # Auth
    SUPABASE_URL: str = "https://your-supabase.supabase.co"
    SUPABASE_JWT_SECRET: str = "your-supabase-jwt-secret-here" # Override in .env
    JWT_ALGORITHM: str = "RS256"
    
    # MLflow
    MLFLOW_TRACKING_URI: str = "sqlite:///mlflow.db"
    MODEL_DIR: str = "models"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
