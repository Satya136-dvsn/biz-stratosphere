# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
from ml.train import BankChurnTrainer

@pytest.fixture
def mock_trainer():
    with patch('ml.train.create_client'):
        # Pass mock credentials
        trainer = BankChurnTrainer("http://mock-url", "mock-key")
        return trainer

def test_deterministic_training_output(mock_trainer):
    """Verify that multiple runs with the same random state produce identical models/metrics"""
    mock_trainer.config.random_state = 42
    
    # Generate mock stable dataset
    np.random.seed(42)
    X = np.random.rand(100, 5)
    y = np.random.randint(0, 2, 100)
    
    # Run 1
    model_info_1 = mock_trainer.train_model('random_forest', X, y)
    
    # Run 2
    model_info_2 = mock_trainer.train_model('random_forest', X, y)
    
    # Metrics must be exactly equal for deterministic training
    assert model_info_1['metrics']['accuracy'] == model_info_2['metrics']['accuracy']
    assert model_info_1['metrics']['roc_auc'] == model_info_2['metrics']['roc_auc']
    
def test_empty_dataset_handling(mock_trainer):
    """Test trainer gracefully handles empty dataset retrieval"""
    with patch.object(mock_trainer.supabase.table().select().gte(), 'execute') as mock_execute:
        # Mock empty data return
        mock_execute.return_value = MagicMock(data=[])
        
        df = mock_trainer.get_cleaned_data()
        assert df is None

def test_train_all_models_partial_failure(mock_trainer):
    """Test trainer continues if one model type fails to train"""
    X = np.random.rand(100, 5)
    y = np.random.randint(0, 2, 100)
    
    # Inject a failure for XGBoost only
    original_train = mock_trainer.train_model
    
    def side_effect_train(model_type, X, y):
        if model_type == 'xgboost':
            raise ValueError("Injected XGBoost failure")
        return original_train(model_type, X, y)

    with patch.object(mock_trainer, 'train_model', side_effect=side_effect_train):
        results = mock_trainer.train_all_models(X, y)
        
        # Should still successfully train random_forest and logistic_regression
        assert 'random_forest' in results
        assert 'logistic_regression' in results
        assert 'xgboost' not in results
        
        # Ensure best model can still be selected
        best = mock_trainer.get_best_model()
        assert best is not None
