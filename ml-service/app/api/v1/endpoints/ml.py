# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from app.schemas.prediction import MLPredictionRequest
from app.schemas.explanation import MLExplainRequest
from app.services.model_service import model_service
from app.api.deps import get_current_user, RoleChecker
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

# Define role checkers
allow_all = RoleChecker(["admin", "analyst", "viewer"])
allow_analysts = RoleChecker(["admin", "analyst"])

@router.post("/predict")
async def ml_predict(request: MLPredictionRequest, current_user: dict = Depends(allow_all)):
    """
    Make predictions using trained ML models
    """
    try:
        # Prevent blocking the event loop on CPU-bound prediction
        result = await run_in_threadpool(
            model_service.predict, 
            request.model_name, 
            request.features
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-predict")
async def ml_batch_predict(model_name: str, features_list: List[Dict[str, Any]], current_user: dict = Depends(allow_analysts)):
    """
    Make batch predictions - Restricted to analysts and admins
    """
    try:
        results = []
        for features in features_list:
            # Threadpool to prevent event loop blocking
            result = await run_in_threadpool(model_service.predict, model_name, features)
            results.append(result)
        
        return {
            "predictions": results,
            "count": len(results),
            "model": model_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_ml_models(current_user: dict = Depends(allow_all)):
    """
    List all available ML models
    """
    try:
        # Assuming list_models has some disk IO, wrap it to be safe
        models = await run_in_threadpool(model_service.list_models)
        return {
            "models": models,
            "count": len(models)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{model_name}/info")
async def get_model_info(model_name: str, current_user: dict = Depends(allow_all)):
    """
    Get detailed information about a specific model
    """
    try:
        info = await run_in_threadpool(model_service.get_model_info, model_name)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain")
async def ml_explain(request: MLExplainRequest, current_user: dict = Depends(allow_all)):
    """
    Generate SHAP explanations for predictions
    """
    try:
        from app.services.shap_service import shap_service

        # Wrap in threadpool
        def sync_explanation():
            model = model_service.load_model(request.model_name)
            
            feature_names = request.feature_names
            if not feature_names:
                feature_names = list(request.features.keys())
            
            explanation = shap_service.explain_prediction(
                model,
                request.model_name,
                request.features,
                feature_names
            )
            
            prediction_result = model_service.predict(request.model_name, request.features)
            explanation["prediction"] = prediction_result.get("prediction")
            
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

        exploration_res = await run_in_threadpool(sync_explanation)
        return exploration_res
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation error: {str(e)}")

