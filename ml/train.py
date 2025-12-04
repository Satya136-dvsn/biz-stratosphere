"""
ML Training Pipeline for Bank Customer Churn Prediction
Trains models using cleaned data from Supabase
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import logging
from datetime import datetime
import joblib
import os
from pathlib import Path

# ML libraries
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, classification_report,
    confusion_matrix
)
import xgboost as xgb

# Supabase integration
from supabase import create_client, Client

# MLflow for experiment tracking
try:
    import mlflow
    import mlflow.sklearn
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
    print("MLflow not available. Install with: pip install mlflow")

from config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BankChurnTrainer:
    """ML Trainer for Bank Customer Churn Prediction"""

    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize the ML trainer

        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase service role key
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.config = config
        self.models = {}
        self.scaler = StandardScaler()

        # Create models directory if it doesn't exist
        Path(self.config.artifact_path).mkdir(parents=True, exist_ok=True)

        # Initialize MLflow if available
        if MLFLOW_AVAILABLE:
            mlflow.set_experiment(self.config.experiment_name)

    def get_cleaned_data(self, min_quality_score: float = None) -> Optional[pd.DataFrame]:
        """
        Retrieve cleaned data from Supabase

        Args:
            min_quality_score: Minimum data quality score threshold

        Returns:
            DataFrame with cleaned data or None if failed
        """
        try:
            logger.info("Retrieving cleaned data from Supabase...")

            # Build query
            query = self.supabase.table('cleaned_data_points').select('*')

            if min_quality_score is None:
                min_quality_score = self.config.min_data_quality_score

            # Apply quality filter
            query = query.gte('data_quality_score', min_quality_score)

            # Execute query
            result = query.execute()

            if not result.data:
                logger.error("No cleaned data found in Supabase")
                return None

            df = pd.DataFrame(result.data)
            logger.info(f"Retrieved {len(df)} cleaned records")

            # Filter out records with missing target
            df = df.dropna(subset=[self.config.target_column])

            if len(df) == 0:
                logger.error("No valid records found after filtering")
                return None

            logger.info(f"Valid records after filtering: {len(df)}")
            return df

        except Exception as e:
            logger.error(f"Error retrieving cleaned data: {e}")
            return None

    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Prepare features and target for training

        Args:
            df: Input DataFrame

        Returns:
            Tuple of (features, target, feature_names)
        """
        logger.info("Preparing features for training...")

        # Get feature columns
        feature_columns = self.config.get_feature_columns()

        # Check for missing features
        missing_features = [col for col in feature_columns if col not in df.columns]
        if missing_features:
            logger.warning(f"Missing features: {missing_features}")

        # Select available features
        available_features = [col for col in feature_columns if col in df.columns]
        logger.info(f"Using {len(available_features)} features: {available_features}")

        # Prepare features
        X = df[available_features].copy()

        # Handle missing values
        X = X.fillna(0)  # Simple imputation for missing values

        # Scale numeric features
        numeric_features = [col for col in available_features
                          if col in self.config.numeric_features]

        if numeric_features:
            X[numeric_features] = self.scaler.fit_transform(X[numeric_features])

        # Prepare target
        y = df[self.config.target_column].values

        # Convert to numpy arrays
        X_array = X.values
        y_array = y.astype(int)

        logger.info(f"Feature matrix shape: {X_array.shape}")
        logger.info(f"Target vector shape: {y_array.shape}")

        return X_array, y_array, available_features

    def train_model(self, model_type: str, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """
        Train a specific model type

        Args:
            model_type: Type of model to train ('random_forest', 'xgboost', 'logistic_regression')
            X: Feature matrix
            y: Target vector

        Returns:
            Dictionary with model info and metrics
        """
        logger.info(f"Training {model_type} model...")

        # Get model configuration
        model_config = self.config.get_model_config(model_type)

        # Initialize model
        if model_type == 'random_forest':
            model = RandomForestClassifier(**model_config)
        elif model_type == 'xgboost':
            model = xgb.XGBClassifier(**model_config)
        elif model_type == 'logistic_regression':
            model = LogisticRegression(**model_config)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.config.test_size,
            random_state=self.config.random_state, stratify=y
        )

        # Train model
        model.fit(X_train, y_train)

        # Make predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, zero_division=0),
            'recall': recall_score(y_test, y_pred, zero_division=0),
            'f1_score': f1_score(y_test, y_pred, zero_division=0),
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'average_precision': average_precision_score(y_test, y_pred_proba)
        }

        # Cross-validation scores
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
        metrics['cv_mean'] = cv_scores.mean()
        metrics['cv_std'] = cv_scores.std()

        # Store model
        model_info = {
            'model': model,
            'model_type': model_type,
            'metrics': metrics,
            'feature_names': self.config.get_feature_columns(),
            'training_date': datetime.now().isoformat(),
            'test_size': self.config.test_size,
            'data_shape': X.shape
        }

        self.models[model_type] = model_info

        logger.info(f"{model_type} training completed. ROC-AUC: {metrics['roc_auc']".4f"}")

        return model_info

    def train_all_models(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Dict[str, Any]]:
        """
        Train all model types

        Args:
            X: Feature matrix
            y: Target vector

        Returns:
            Dictionary with all trained models
        """
        logger.info("Training all model types...")

        model_types = ['random_forest', 'xgboost', 'logistic_regression']
        results = {}

        for model_type in model_types:
            try:
                model_info = self.train_model(model_type, X, y)
                results[model_type] = model_info

                # Log to MLflow if available
                if MLFLOW_AVAILABLE:
                    self.log_to_mlflow(model_info)

            except Exception as e:
                logger.error(f"Failed to train {model_type}: {e}")
                continue

        return results

    def log_to_mlflow(self, model_info: Dict[str, Any]) -> None:
        """Log model and metrics to MLflow"""
        if not MLFLOW_AVAILABLE:
            return

        try:
            model_type = model_info['model_type']
            metrics = model_info['metrics']

            with mlflow.start_run(run_name=f"{model_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
                # Log parameters
                mlflow.log_params(self.config.get_model_config(model_type))

                # Log metrics
                for metric_name, metric_value in metrics.items():
                    mlflow.log_metric(metric_name, metric_value)

                # Log model
                mlflow.sklearn.log_model(
                    model_info['model'],
                    model_type,
                    registered_model_name=f"bank_churn_{model_type}"
                )

                logger.info(f"Logged {model_type} to MLflow")

        except Exception as e:
            logger.error(f"Failed to log to MLflow: {e}")

    def save_models(self) -> None:
        """Save all trained models to disk"""
        logger.info("Saving trained models...")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        for model_type, model_info in self.models.items():
            try:
                # Save model
                model_path = Path(self.config.artifact_path) / f"{model_type}_{timestamp}.pkl"
                joblib.dump(model_info['model'], model_path)

                # Save metadata
                metadata_path = Path(self.config.artifact_path) / f"{model_type}_{timestamp}_metadata.pkl"
                joblib.dump({
                    'model_info': model_info,
                    'config': self.config.__dict__,
                    'feature_names': model_info['feature_names']
                }, metadata_path)

                logger.info(f"Saved {model_type} model to {model_path}")

            except Exception as e:
                logger.error(f"Failed to save {model_type} model: {e}")

    def get_best_model(self) -> Optional[Dict[str, Any]]:
        """
        Get the best performing model based on ROC-AUC

        Returns:
            Best model info or None if no models trained
        """
        if not self.models:
            return None

        best_model_type = max(
            self.models.keys(),
            key=lambda x: self.models[x]['metrics']['roc_auc']
        )

        return self.models[best_model_type]

    def generate_training_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive training report

        Returns:
            Dictionary with training summary
        """
        report = {
            'training_date': datetime.now().isoformat(),
            'config': self.config.__dict__,
            'models_trained': list(self.models.keys()),
            'model_comparison': {}
        }

        if self.models:
            # Compare models
            for model_type, model_info in self.models.items():
                report['model_comparison'][model_type] = {
                    'roc_auc': model_info['metrics']['roc_auc'],
                    'accuracy': model_info['metrics']['accuracy'],
                    'precision': model_info['metrics']['precision'],
                    'recall': model_info['metrics']['recall'],
                    'f1_score': model_info['metrics']['f1_score']
                }

            # Best model
            best_model = self.get_best_model()
            if best_model:
                report['best_model'] = {
                    'type': best_model['model_type'],
                    'roc_auc': best_model['metrics']['roc_auc'],
                    'accuracy': best_model['metrics']['accuracy']
                }

        return report

def main():
    """Main training function"""
    logger.info("Starting ML training pipeline...")

    # Validate configuration
    config_issues = config.validate_config()
    if config_issues:
        logger.error("Configuration issues found:")
        for issue in config_issues:
            logger.error(f"  - {issue}")
        return False

    try:
        # Initialize trainer
        trainer = BankChurnTrainer(config.supabase_url, config.supabase_key)

        # Get cleaned data
        df = trainer.get_cleaned_data()
        if df is None:
            logger.error("Failed to retrieve cleaned data")
            return False

        # Prepare features
        X, y, feature_names = trainer.prepare_features(df)

        # Check data quality
        if len(df) < 1000:
            logger.warning(f"Small dataset size: {len(df)} samples")

        # Check class balance
        churn_rate = y.mean()
        logger.info(f"Churn rate: {churn_rate".3f"}")

        if churn_rate < 0.01 or churn_rate > 0.99:
            logger.warning(f"Highly imbalanced dataset: churn rate = {churn_rate".3f"}")

        # Train all models
        results = trainer.train_all_models(X, y)

        if not results:
            logger.error("No models were successfully trained")
            return False

        # Save models
        trainer.save_models()

        # Generate report
        report = trainer.generate_training_report()

        # Save report
        report_path = Path(config.artifact_path) / f"training_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w') as f:
            import json
            json.dump(report, f, indent=2, default=str)

        logger.info(f"Training report saved to {report_path}")

        # Print summary
        best_model = trainer.get_best_model()
        if best_model:
            logger.info("
=== TRAINING SUMMARY ===")
            logger.info(f"Best Model: {best_model['model_type']}")
            logger.info(f"ROC-AUC: {best_model['metrics']['roc_auc']".4f"}")
            logger.info(f"Accuracy: {best_model['metrics']['accuracy']".4f"}")
            logger.info(f"Precision: {best_model['metrics']['precision']".4f"}")
            logger.info(f"Recall: {best_model['metrics']['recall']".4f"}")
            logger.info(f"F1-Score: {best_model['metrics']['f1_score']".4f"}")

        logger.info("ML training pipeline completed successfully!")
        return True

    except Exception as e:
        logger.error(f"Training pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
