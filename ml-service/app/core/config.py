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
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Ollama
    OLLAMA_HOST: str = "http://ollama:11434"
    OLLAMA_TIMEOUT: int = 60
    
    # MLflow
    MLFLOW_TRACKING_URI: str = "sqlite:///mlflow.db"
    MODEL_DIR: str = "models"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
