# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import os
import json
from datetime import datetime
from typing import Dict, Any, Optional
from loguru import logger
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import get_settings

settings = get_settings()

class DecisionLogger:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.engine = None
        if self.db_url:
            # Convert URL for asyncpg
            if self.db_url.startswith("postgres://"):
                self.db_url = self.db_url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif self.db_url.startswith("postgresql://") and "asyncpg" not in self.db_url:
                self.db_url = self.db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
                
            try:
                self.engine = create_async_engine(self.db_url, pool_pre_ping=True)
                logger.info("DecisionLogger: Configured async database engine.")
            except Exception as e:
                logger.error(f"DecisionLogger: Failed to configure DB: {e}")
        else:
            logger.warning("DecisionLogger: DATABASE_URL not set. Logging disabled.")

    async def log_decision(
        self,
        model_name: str,
        model_version: str,
        features: Dict[str, Any],
        prediction: float,
        shap_values: Optional[Dict[str, float]] = None,
        probability: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Logs a decision to the integration database asynchronously.
        """
        if not self.engine:
            return

        try:
            # Construct the record
            decision_record = {
                "model_name": model_name,
                "model_version": model_version,
                "input_features": json.dumps(features),
                "prediction": prediction,
                "prediction_proba": probability,
                "shap_values": json.dumps(shap_values) if shap_values else None,
                "metadata": json.dumps(metadata) if metadata else None,
                "created_at": datetime.utcnow().isoformat()
            }

            insert_query = text("""
                INSERT INTO decision_memory 
                (model_name, model_version, input_features, prediction, prediction_proba, shap_values, metadata)
                VALUES 
                (:model_name, :model_version, :input_features, :prediction, :prediction_proba, :shap_values, :metadata)
            """)

            async with self.engine.begin() as conn:
                await conn.execute(insert_query, decision_record)
                
            logger.debug(f"Logged decision for {model_name}")

        except Exception as e:
            logger.error(f"Failed to log decision: {e}")

# Singleton instance
decision_logger = DecisionLogger()
