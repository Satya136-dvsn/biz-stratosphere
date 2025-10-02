"""
ML Training Configuration
Defines parameters and settings for the ML training pipeline
"""
import os
from typing import Dict, List, Any

class MLConfig:
    """Configuration class for ML training pipeline"""

    def __init__(self):
        # Supabase configuration
        self.supabase_url = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

        # Model configuration
        self.target_column = "churn"
        self.test_size = 0.2
        self.validation_size = 0.1
        self.random_state = 42

        # Feature configuration
        self.numeric_features = [
            'credit_score', 'age', 'tenure', 'balance', 'products_number',
            'estimated_salary', 'balance_salary_ratio', 'age_tenure_interaction'
        ]

        self.categorical_features = [
            'country_france', 'country_germany', 'country_spain', 'gender_male'
        ]

        self.binary_features = [
            'credit_card', 'active_member'
        ]

        # Model hyperparameters
        self.model_params = {
            'random_forest': {
                'n_estimators': 100,
                'max_depth': 10,
                'min_samples_split': 5,
                'min_samples_leaf': 2,
                'random_state': self.random_state
            },
            'xgboost': {
                'n_estimators': 100,
                'max_depth': 6,
                'learning_rate': 0.1,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'random_state': self.random_state
            },
            'logistic_regression': {
                'C': 1.0,
                'max_iter': 1000,
                'random_state': self.random_state
            }
        }

        # Training configuration
        self.experiment_name = "bank_churn_prediction"
        self.artifact_path = "models"
        self.metrics = [
            'accuracy', 'precision', 'recall', 'f1_score',
            'roc_auc', 'average_precision'
        ]

        # Data quality thresholds
        self.min_data_quality_score = 0.7
        self.min_samples_per_class = 100

    def get_feature_columns(self) -> List[str]:
        """Get all feature columns for training"""
        return (self.numeric_features + self.categorical_features +
                self.binary_features)

    def get_model_config(self, model_type: str) -> Dict[str, Any]:
        """Get configuration for specific model type"""
        return self.model_params.get(model_type, {})

    def validate_config(self) -> List[str]:
        """Validate configuration and return list of issues"""
        issues = []

        if not self.supabase_url:
            issues.append("Supabase URL not configured")

        if not self.supabase_key:
            issues.append("Supabase service role key not configured")

        if self.test_size <= 0 or self.test_size >= 1:
            issues.append("Test size must be between 0 and 1")

        if self.validation_size <= 0 or self.validation_size >= 1:
            issues.append("Validation size must be between 0 and 1")

        if self.test_size + self.validation_size >= 1:
            issues.append("Test size + validation size must be less than 1")

        return issues

# Global configuration instance
config = MLConfig()
