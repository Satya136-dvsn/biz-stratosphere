#!/usr/bin/env python3
"""
Test script for ML Training Pipeline
Tests the complete ML workflow with mock data
"""
import sys
import os
import tempfile
import pandas as pd
import numpy as np
import json
from datetime import datetime
from pathlib import Path

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_ml_config():
    """Test ML configuration"""
    print("🧪 Testing ML Configuration...")

    try:
        from ml.config import config, MLConfig

        # Test configuration loading
        assert config.target_column == "churn"
        assert config.test_size == 0.2
        assert len(config.numeric_features) > 0
        assert len(config.categorical_features) > 0

        # Test feature columns
        feature_columns = config.get_feature_columns()
        assert len(feature_columns) > 0
        assert all(isinstance(col, str) for col in feature_columns)

        # Test model config
        rf_config = config.get_model_config('random_forest')
        assert isinstance(rf_config, dict)
        assert 'n_estimators' in rf_config

        print("✓ ML configuration loaded successfully")
        return True

    except Exception as e:
        print(f"❌ ML configuration test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_data_loader():
    """Test data loading functionality"""
    print("\n🧪 Testing Data Loader...")

    try:
        # Create mock data
        mock_data = pd.DataFrame({
            'customer_id': range(1, 101),
            'credit_score': np.random.randint(300, 850, 100),
            'age': np.random.randint(18, 80, 100),
            'tenure': np.random.randint(0, 10, 100),
            'balance': np.random.uniform(0, 200000, 100),
            'products_number': np.random.randint(1, 4, 100),
            'credit_card': np.random.randint(0, 2, 100),
            'active_member': np.random.randint(0, 2, 100),
            'estimated_salary': np.random.uniform(30000, 150000, 100),
            'churn': np.random.randint(0, 2, 100),

            # Derived features
            'balance_salary_ratio': np.random.uniform(0, 5, 100),
            'age_tenure_interaction': np.random.randint(0, 500, 100),
            'gender_male': np.random.randint(0, 2, 100),
            'country_france': np.random.randint(0, 2, 100),
            'country_germany': np.random.randint(0, 2, 100),
            'country_spain': np.random.randint(0, 2, 100),

            # Quality scores
            'data_quality_score': np.random.uniform(0.7, 1.0, 100),
            'cleaned_at': [datetime.now().isoformat()] * 100
        })

        # Test data validation
        from ml.data_loader import SupabaseDataLoader

        # Mock the Supabase client to avoid connection issues
        class MockSupabaseClient:
            def table(self, table_name):
                return MockTable()

        class MockTable:
            def select(self, *args, **kwargs):
                return self

            def gte(self, *args, **kwargs):
                return self

            def eq(self, *args, **kwargs):
                return self

            def order(self, *args, **kwargs):
                return self

            def execute(self):
                return MockResult(mock_data.to_dict('records'))

        class MockResult:
            def __init__(self, data):
                self.data = data
                self.count = len(data)

        # Test with mock client
        loader = SupabaseDataLoader("mock_url", "mock_key")
        loader.supabase = MockSupabaseClient()

        # Test data retrieval
        df = loader.get_latest_cleaned_data()
        assert df is not None
        assert len(df) == 100
        assert 'churn' in df.columns

        # Test data validation
        quality_report = loader.validate_data_quality(df)
        assert 'total_rows' in quality_report
        assert quality_report['total_rows'] == 100

        # Test class balancing
        balanced_df = loader.balance_classes(df, 'churn')
        assert len(balanced_df) > 0

        print("✓ Data loader functionality working correctly")
        return True

    except Exception as e:
        print(f"❌ Data loader test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_ml_training():
    """Test ML training functionality"""
    print("\n🧪 Testing ML Training...")

    try:
        # Create test data
        np.random.seed(42)
        n_samples = 1000

        test_data = pd.DataFrame({
            'credit_score': np.random.randint(300, 850, n_samples),
            'age': np.random.randint(18, 80, n_samples),
            'tenure': np.random.randint(0, 10, n_samples),
            'balance': np.random.uniform(0, 200000, n_samples),
            'products_number': np.random.randint(1, 4, n_samples),
            'estimated_salary': np.random.uniform(30000, 150000, n_samples),
            'balance_salary_ratio': np.random.uniform(0, 5, n_samples),
            'age_tenure_interaction': np.random.randint(0, 500, n_samples),
            'gender_male': np.random.randint(0, 2, n_samples),
            'country_france': np.random.randint(0, 2, n_samples),
            'country_germany': np.random.randint(0, 2, n_samples),
            'country_spain': np.random.randint(0, 2, n_samples),
            'credit_card': np.random.randint(0, 2, n_samples),
            'active_member': np.random.randint(0, 2, n_samples),
            'churn': np.random.randint(0, 2, n_samples)
        })

        # Test training pipeline
        from ml.train import BankChurnTrainer

        # Mock Supabase client
        class MockSupabaseClient:
            def table(self, table_name):
                return MockTable()

            def auth(self):
                return MockAuth()

        class MockAuth:
            def getUser(self, token):
                return MockUserResult()

        class MockUserResult:
            def __init__(self):
                self.data = {'user': {'id': 'test-user'}}
                self.error = None

        class MockTable:
            def select(self, *args, **kwargs):
                return self

            def gte(self, *args, **kwargs):
                return self

            def eq(self, *args, **kwargs):
                return self

            def execute(self):
                return MockResult(test_data.to_dict('records'))

        class MockResult:
            def __init__(self, data):
                self.data = data
                self.count = len(data)

        # Test with mock client
        trainer = BankChurnTrainer("mock_url", "mock_key")
        trainer.supabase = MockSupabaseClient()

        # Test data preparation
        X, y, feature_names = trainer.prepare_features(test_data)
        assert X.shape[0] == n_samples
        assert X.shape[1] == len(feature_names)
        assert len(y) == n_samples

        # Test model training
        model_info = trainer.train_model('random_forest', X, y)
        assert 'model' in model_info
        assert 'metrics' in model_info
        assert 'roc_auc' in model_info['metrics']

        # Test multiple models
        results = trainer.train_all_models(X, y)
        assert len(results) > 0
        assert 'random_forest' in results

        # Test best model selection
        best_model = trainer.get_best_model()
        assert best_model is not None

        # Test report generation
        report = trainer.generate_training_report()
        assert 'training_date' in report
        assert 'models_trained' in report

        print("✓ ML training functionality working correctly")
        return True

    except Exception as e:
        print(f"❌ ML training test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_model_evaluation():
    """Test model evaluation functionality"""
    print("\n🧪 Testing Model Evaluation...")

    try:
        # Create test data and model
        np.random.seed(42)
        n_samples = 500

        X_test = np.random.randn(n_samples, 10)
        y_test = np.random.randint(0, 2, n_samples)

        # Create a simple mock model
        class MockModel:
            def predict(self, X):
                return np.random.randint(0, 2, len(X))

            def predict_proba(self, X):
                proba = np.random.rand(len(X), 2)
                return proba / proba.sum(axis=1, keepdims=True)

        mock_model = MockModel()

        # Test evaluation
        from ml.evaluate import ModelEvaluator

        evaluator = ModelEvaluator()

        # Test single model evaluation
        results = evaluator.evaluate_model(mock_model, X_test, y_test, "test_model")
        assert 'accuracy' in results
        assert 'precision' in results
        assert 'confusion_matrix' in results

        # Test model comparison
        models = {
            'model_1': results,
            'model_2': results.copy()
        }

        comparison = evaluator.compare_models(models)
        assert 'model_count' in comparison
        assert 'ranking' in comparison

        # Test report generation
        report_path = evaluator.generate_comparison_report(comparison)
        assert len(report_path) > 0

        print("✓ Model evaluation functionality working correctly")
        return True

    except Exception as e:
        print(f"❌ Model evaluation test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_mlflow_integration():
    """Test MLflow integration (if available)"""
    print("\n🧪 Testing MLflow Integration...")

    try:
        import mlflow
        import mlflow.sklearn

        # Test MLflow setup
        experiment_name = "test_experiment"
        mlflow.set_experiment(experiment_name)

        # Test experiment creation
        with mlflow.start_run():
            mlflow.log_param("test_param", "test_value")
            mlflow.log_metric("test_metric", 0.95)

        print("✓ MLflow integration working correctly")
        return True

    except ImportError:
        print("⚠️  MLflow not available (optional dependency)")
        return True
    except Exception as e:
        print(f"❌ MLflow integration test FAILED: {e}")
        return False

def main():
    """Run all ML pipeline tests"""
    print("🚀 Starting ML Training Pipeline Tests")
    print("=" * 60)

    tests = [
        test_ml_config,
        test_data_loader,
        test_ml_training,
        test_model_evaluation,
        test_mlflow_integration
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1

    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("✅ All ML pipeline tests PASSED!")
        print("🎯 The ML training pipeline is ready for production use.")
        return True
    else:
        print("❌ Some ML pipeline tests FAILED.")
        print("🔧 Please review the issues above and fix them.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
