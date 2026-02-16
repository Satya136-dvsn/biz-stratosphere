# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import create_engine, text
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class DecisionLogger:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.engine = None
        if self.db_url:
            try:
                self.engine = create_engine(self.db_url, pool_pre_ping=True)
                logger.info("DecisionLogger: Connected to database.")
            except Exception as e:
                logger.error(f"DecisionLogger: Failed to connect to DB: {e}")
        else:
            logger.warning("DecisionLogger: DATABASE_URL not set. Logging disabled.")

    def log_decision(
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
        Logs a decision to the integration database asynchronously (simulated via fire-and-forget logic for now, 
        or simply synchronous if low volume. For high volume, use BackgroundTasks).
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

            # Insert into decision_memory
            # Note: In a real high-throughput scenario, use a bulk insert or message queue.
            # Using raw SQL for speed and simplicity without full ORM overhead for this single table.
            
            insert_query = text("""
                INSERT INTO decision_memory 
                (model_name, model_version, input_features, prediction, prediction_proba, shap_values, metadata)
                VALUES 
                (:model_name, :model_version, :input_features, :prediction, :prediction_proba, :shap_values, :metadata)
            """)

            with self.engine.connect() as conn:
                conn.execute(insert_query, decision_record)
                conn.commit()
                
            logger.debug(f"Logged decision for {model_name}")

        except Exception as e:
            logger.error(f"Failed to log decision: {e}")

# Singleton instance
decision_logger = DecisionLogger()
