"""
Model service for loading and managing ML models
"""
import joblib
import mlflow
import mlflow.sklearn
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np

class ModelService:
    def __init__(self):
        self.models_dir = Path("models")
        self.models_dir.mkdir(exist_ok=True)
        mlflow.set_tracking_uri("sqlite:///mlflow.db")
        self._loaded_models = {}
        
    def load_model(self, model_name: str):
        """Load model from local file or MLflow"""
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
        
        # Try local file first
        local_path = self.models_dir / f"{model_name}.pkl"
        if local_path.exists():
            model = joblib.load(local_path)
            self._loaded_models[model_name] = model
            return model
        
        # Try MLflow registry
        try:
            model_uri = f"models:/{model_name}/latest"
            model = mlflow.sklearn.load_model(model_uri)
            self._loaded_models[model_name] = model
            return model
        except Exception as e:
            raise ValueError(f"Model '{model_name}' not found: {str(e)}")
    
    def predict(self, model_name: str, features: Dict[str, Any]) -> Dict[str, Any]:
        """Make prediction using specified model"""
        model = self.load_model(model_name)
        
        # Convert features to DataFrame
        df = pd.DataFrame([features])
        
        # Make prediction
        if hasattr(model, 'predict_proba'):
            # Classification model
            prediction = model.predict(df)[0]
            probabilities = model.predict_proba(df)[0]
            
            return {
                "prediction": int(prediction),
                "probability": float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0]),
                "confidence": float(max(probabilities)),
                "model": model_name
            }
        else:
            # Regression model
            prediction = model.predict(df)[0]
            
            return {
                "prediction": float(prediction),
                "model": model_name
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
            client = mlflow.tracking.MlflowClient()
            for rm in client.search_registered_models():
                models.append({
                    "name": rm.name,
                    "source": "mlflow",
                    "latest_version": rm.latest_versions[0].version if rm.latest_versions else None
                })
        except Exception:
            pass
        
        return models

# Global model service instance
model_service = ModelService()
