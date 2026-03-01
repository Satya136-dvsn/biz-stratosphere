# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

"""
Model service for loading and managing ML models
"""
import joblib
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
import hashlib
import time
from loguru import logger


class ModelService:
    def __init__(self):
        self.models_dir = Path("models")
        self.models_dir.mkdir(exist_ok=True)
        self._loaded_models = {}
        self._model_hashes = {}
        self._tracking_initialized = False
        
        # Hardcoded schema enforcement for Part 2 requirements
        self._feature_schemas = {
            "churn_model": ["age", "tenure", "usage_frequency", "support_tickets", "last_purchase_days", "subscription_tier", "contract_length", "payment_delay"],
            "revenue_model": ["marketing_spend", "seasonality_index", "new_users", "active_users", "churn_rate", "avg_revenue_per_user", "economic_indicator"]
        }

    def _init_tracking(self):
        """Lazily initialize MLflow tracking"""
        if not self._tracking_initialized:
            try:
                import mlflow
                mlflow.set_tracking_uri("sqlite:///mlflow.db")
                self._tracking_initialized = True
            except ImportError:
                pass

    def load_model(self, model_name: str):
        """Load model from local file or MLflow"""
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]

        # Try local file first
        local_path = self.models_dir / f"{model_name}.pkl"
        if local_path.exists():
            start_time = time.time()
            
            # Hash validation
            with open(local_path, "rb") as f:
                model_hash = hashlib.sha256(f.read()).hexdigest()
                
            model = joblib.load(local_path)
            self._loaded_models[model_name] = model
            self._model_hashes[model_name] = model_hash
            
            load_time_ms = (time.time() - start_time) * 1000
            logger.info(f"Loaded {model_name} [Local] in {load_time_ms:.2f}ms. SHA256: {model_hash[:8]}")
            
            return model

        # Try MLflow registry
        try:
            start_time = time.time()
            import mlflow
            import mlflow.sklearn
            self._init_tracking()
            model_uri = f"models:/{model_name}/latest"
            model = mlflow.sklearn.load_model(model_uri)
            self._loaded_models[model_name] = model
            
            load_time_ms = (time.time() - start_time) * 1000
            logger.info(f"Loaded {model_name} [MLflow] in {load_time_ms:.2f}ms.")
            
            return model
        except ImportError:
            logger.error(f"Model '{model_name}' not found locally and mlflow is not installed")
            raise ValueError(f"Model '{model_name}' not found locally. Graceful fallback failed.")
        except Exception as e:
            logger.error(f"Model '{model_name}' load failed: {str(e)}")
            raise ValueError(f"Model '{model_name}' not found. Graceful fallback failed: {str(e)}")

    def predict(self, model_name: str, features: Dict[str, Any]) -> Dict[str, Any]:
        """Make prediction using specified model with schema enforcement & deterministic output"""
        
        # 1. Graceful load
        model = self.load_model(model_name)
        
        # 2. Strict Feature Schema Enforcement
        required_features = self._feature_schemas.get(model_name)
        if required_features:
            missing_features = [f for f in required_features if f not in features]
            if missing_features:
                 raise ValueError(f"Schema Validation Failed. Missing required features: {missing_features}")
                 
            # Ensure deterministic ordering matching the schema exactly
            ordered_features = {f: features[f] for f in required_features}
            df = pd.DataFrame([ordered_features])
        else:
            # Fallback if unmapped
            df = pd.DataFrame([features])
            
        # Re-index to ensure feature column mapping aligns deterministically with whatever the model trained on
        if hasattr(model, 'feature_names_in_'):
             # If sklearn captured feature names, align to them rigidly
             df = df.reindex(columns=model.feature_names_in_, fill_value=0)

        # Default values for metadata
        version = self._model_hashes.get(model_name, "1.0.0")[:8] if model_name in self._model_hashes else "1.0.0"
        shap_values = None

        # Make prediction
        if hasattr(model, 'predict_proba'):
            # Classification model
            prediction = model.predict(df)[0]
            probabilities = model.predict_proba(df)[0]

            prediction_value = int(prediction)
            probability = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])
            confidence = float(max(probabilities))

        else:
            # Regression model
            prediction = model.predict(df)[0]
            prediction_value = float(prediction)
            probability = 1.0 # Default for regression
            confidence = 1.0 # Default for regression

        # Log decision to Decision Memory
        try:
            from app.services.decision_logger import decision_logger
            decision_logger.log_decision(
                model_name=model_name,
                model_version=version,
                features=features,
                prediction=prediction_value,
                probability=probability,
                shap_values=shap_values
            )
        except Exception as e:
            # Don't fail the request if logging fails
            from loguru import logger
            logger.warning(f"Failed to log decision: {e}")

        return {
            "prediction": prediction_value,
            "probability": probability,
            "confidence": confidence,
            "model_name": model_name,
            "model_version": version,
            "shap_values": shap_values,
            "decision_id": None # effectively auto-generated by DB, could return if we waited
        }

    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get information about a model"""
        model = self.load_model(model_name)

        info = {
            "name": model_name,
            "type": type(model).__name__,
            "loaded": True
        }

        # Add feature importance if available
        if hasattr(model, 'feature_importances_'):
            info["has_feature_importance"] = True

        # Add number of features
        if hasattr(model, 'n_features_in_'):
            info["n_features"] = model.n_features_in_

        return info

    def list_models(self) -> list:
        """List all available models"""
        models = []

        # Local models
        for model_file in self.models_dir.glob("*.pkl"):
            models.append({
                "name": model_file.stem,
                "source": "local",
                "path": str(model_file)
            })

        # MLflow models
        try:
            import mlflow
            self._init_tracking()
            client = mlflow.tracking.MlflowClient()
            for rm in client.search_registered_models():
                models.append({
                    "name": rm.name,
                    "source": "mlflow",
                    "latest_version": rm.latest_versions[0].version if rm.latest_versions else None
                })
        except (ImportError, Exception):
            pass

        return models

    def preload_models(self):
        """Load all available models into memory safely on startup"""
        try:
            models = self.list_models()
            for m in models:
                if m["source"] == "local":
                    self.load_model(m["name"])
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to preload models: {e}")


def get_model_service():
    """Get the global model service instance (lazy initialization)"""
    if not hasattr(get_model_service, '_instance'):
        get_model_service._instance = ModelService()
    return get_model_service._instance


# For backward compatibility - lazy property
class _ModelServiceProxy:
    """Proxy that lazily initializes ModelService on first access"""
    def __getattr__(self, name):
        return getattr(get_model_service(), name)


model_service = _ModelServiceProxy()
