# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.schemas.prediction import MLPredictionRequest
from app.schemas.explanation import MLExplainRequest
from app.services.model_service import model_service

router = APIRouter()

@router.post("/predict")
async def ml_predict(request: MLPredictionRequest):
    """
    Make predictions using trained ML models
    """
    try:
        result = model_service.predict(request.model_name, request.features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-predict")
async def ml_batch_predict(model_name: str, features_list: List[Dict[str, Any]]):
    """
    Make batch predictions
    """
    try:
        results = []
        for features in features_list:
            result = model_service.predict(model_name, features)
            results.append(result)
        
        return {
            "predictions": results,
            "count": len(results),
            "model": model_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_ml_models():
    """
    List all available ML models
    """
    try:
        models = model_service.list_models()
        return {
            "models": models,
            "count": len(models)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{model_name}/info")
async def get_model_info(model_name: str):
    """
    Get detailed information about a specific model
    """
    try:
        info = model_service.get_model_info(model_name)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain")
async def ml_explain(request: MLExplainRequest):
    """
    Generate SHAP explanations for predictions
    """
    try:
        from app.services.shap_service import shap_service

        # Load model
        model = model_service.load_model(request.model_name)
        
        # Get feature names
        feature_names = request.feature_names
        if not feature_names:
            feature_names = list(request.features.keys())
        
        # Generate explanation
        explanation = shap_service.explain_prediction(
            model,
            request.model_name,
            request.features,
            feature_names
        )
        
        # Make prediction
        prediction_result = model_service.predict(request.model_name, request.features)
        explanation["prediction"] = prediction_result.get("prediction")
        
        # Generate plots if requested
        if request.include_plots:
            waterfall = shap_service.generate_waterfall_plot(
                explanation["shap_values"],
                explanation["base_value"],
                prediction_result.get("prediction", 0)
            )
            summary = shap_service.generate_summary_plot(explanation["shap_values"])
            
            explanation["visualizations"] = {
                "waterfall_plot": waterfall,
                "summary_plot": summary
            }
        
        return explanation
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation error: {str(e)}")

