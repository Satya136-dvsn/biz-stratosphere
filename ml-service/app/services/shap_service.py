"""
SHAP explainability service
"""
import shap
import pandas as pd
import numpy as np
from typing import Dict, Any, List
import base64
from io import BytesIO
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend

class SHAPService:
    def __init__(self):
        self.explainers = {}
    
    def get_explainer(self, model, model_name: str):
        """Get or create SHAP explainer for model"""
        if model_name in self.explainers:
            return self.explainers[model_name]
        
        # Try TreeExplainer first (for tree-based models)
        try:
            explainer = shap.TreeExplainer(model)
            self.explainers[model_name] = explainer
            return explainer
        except Exception:
            pass
        
        # Fallback to KernelExplainer (works for any model, but slower)
        try:
            # Use a background dataset (simplified)
            background = shap.sample(pd.DataFrame(np.random.randn(100, model.n_features_in_)), 10)
            explainer = shap.KernelExplainer(model.predict, background)
            self.explainers[model_name] = explainer
            return explainer
        except Exception as e:
            raise ValueError(f"Could not create SHAP explainer: {str(e)}")
    
    def explain_prediction(
        self,
        model,
        model_name: str,
        features: Dict[str, Any],
        feature_names: List[str]
    ) -> Dict[str, Any]:
        """Generate SHAP explanation for a single prediction"""
        explainer = self.get_explainer(model, model_name)
        
        # Convert features to DataFrame
        df = pd.DataFrame([features])
        df = df[feature_names]  # Ensure correct order
        
        # Calculate SHAP values
        shap_values = explainer.shap_values(df)
        
        # Handle multi-output models (classification)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # Use first class for binary classification
        
        # Create feature importance dictionary
        feature_importance = {}
        for i, feature in enumerate(feature_names):
            if isinstance(shap_values, np.ndarray):
                if shap_values.ndim == 2:
                    value = float(shap_values[0, i])
                else:
                    value = float(shap_values[i])
            else:
                value = float(shap_values)
            feature_importance[feature] = value
        
        # Sort by absolute importance
        sorted_features = dict(sorted(
            feature_importance.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        ))
        
        # Get base value
        base_value = explainer.expected_value
        if isinstance(base_value, np.ndarray):
            base_value = float(base_value[0])
        else:
            base_value = float(base_value)
        
        return {
            "shap_values": sorted_features,
            "base_value": base_value,
            "feature_names": feature_names,
            "top_features": list(sorted_features.keys())[:5]
        }
    
    def generate_waterfall_plot(
        self,
        shap_values: Dict[str, float],
        base_value: float,
        prediction: float
    ) -> str:
        """Generate waterfall plot and return as base64 image"""
        try:
            # Create figure
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Prepare data
            features = list(shap_values.keys())[:10]  # Top 10 features
            values = [shap_values[f] for f in features]
            
            # Calculate cumulative values for waterfall
            cumulative = [base_value]
            for val in values:
                cumulative.append(cumulative[-1] + val)
            
            # Create waterfall bars
            colors = ['red' if v < 0 else 'green' for v in values]
            
            # Plot
            for i, (feature, value) in enumerate(zip(features, values)):
                ax.barh(i, value, left=cumulative[i], color=colors[i], alpha=0.7)
                ax.text(cumulative[i] + value/2, i, f'{value:.3f}', 
                       ha='center', va='center', fontweight='bold')
            
            # Add base value and prediction lines
            ax.axvline(base_value, color='blue', linestyle='--', label='Base Value')
            ax.axvline(prediction, color='purple', linestyle='--', label='Prediction')
            
            ax.set_yticks(range(len(features)))
            ax.set_yticklabels(features)
            ax.set_xlabel('Model Output')
            ax.set_title('SHAP Waterfall Plot - Feature Contributions')
            ax.legend()
            ax.grid(True, alpha=0.3)
            
            # Convert to base64
            buffer = BytesIO()
            plt.tight_layout()
            plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.read()).decode()
            plt.close()
            
            return f"data:image/png;base64,{image_base64}"
        
        except Exception as e:
            print(f"Error generating waterfall plot: {e}")
            return None
    
    def generate_summary_plot(
        self,
        shap_values: Dict[str, float]
    ) -> str:
        """Generate summary plot showing feature importance"""
        try:
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Get top features
            features = list(shap_values.keys())[:15]
            values = [abs(shap_values[f]) for f in features]
            colors = ['red' if shap_values[f] < 0 else 'green' for f in features]
            
            # Create horizontal bar chart
            y_pos = np.arange(len(features))
            ax.barh(y_pos, values, color=colors, alpha=0.7)
            
            ax.set_yticks(y_pos)
            ax.set_yticklabels(features)
            ax.set_xlabel('Absolute SHAP Value (Impact on Prediction)')
            ax.set_title('Feature Importance - SHAP Values')
            ax.grid(True, alpha=0.3, axis='x')
            
            # Convert to base64
            buffer = BytesIO()
            plt.tight_layout()
            plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.read()).decode()
            plt.close()
            
            return f"data:image/png;base64,{image_base64}"
        
        except Exception as e:
            print(f"Error generating summary plot: {e}")
            return None

# Global SHAP service instance
shap_service = SHAPService()
