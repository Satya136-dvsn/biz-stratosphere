# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import pytest
from unittest.mock import patch, MagicMock
from etl.supabase_etl import SupabaseETL
import pandas as pd
import numpy as np

@pytest.fixture
def mock_supabase_env(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "http://mock-url")
    monkeypatch.setenv("SUPABASE_KEY", "mock-key")

def test_supabase_etl_initialization(mock_supabase_env):
    # Should initialize without args since env vars are set
    etl = SupabaseETL()
    assert etl.supabase_url == "http://mock-url"

@patch('etl.supabase_etl.create_client')
def test_process_all_unprocessed_datasets_idempotency(mock_create_client, mock_supabase_env):
    """Test that it correctly skips processing if no pending datasets exist"""
    # Setup mock
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    
    # Mock the chain: table().select().in_().execute() returning empty data
    mock_client.table().select().in_().execute.return_value = MagicMock(data=[])
    
    etl = SupabaseETL()
    stats = etl.process_all_unprocessed_datasets()
    
    assert stats['processed'] == 0
    assert stats['successful'] == 0

def test_clean_bank_churn_data_handling():
    # Test pandas DataFrame cleaning logic handling missing values and scaling
    etl = SupabaseETL("http://mock-url", "mock-key")
    
    # Create sample dirty data
    df = pd.DataFrame({
        "credit_score": [600, np.nan, 700],
        "age": [30, 40, np.nan],
        "tenure": [2, 5, 8],
        "balance": [0.0, 1500.50, np.nan],
        "products_number": [1, 2, 1],
        "estimated_salary": [50000, np.nan, 120000],
        "country": ["France", "Germany", np.nan],
        "gender": ["Male", np.nan, "Female"]
    })
    
    cleaned_df = etl.clean_bank_churn_data(df)
    
    # Assert missing values handled
    assert not cleaned_df['credit_score'].isnull().any()
    assert not cleaned_df['age'].isnull().any()
    assert not cleaned_df['balance'].isnull().any()
    
    # Assert expected columns created
    assert 'data_quality_score' in cleaned_df.columns
    assert 'gender_male' in cleaned_df.columns
    assert 'cleaned_at' in cleaned_df.columns

@patch('etl.supabase_etl.SupabaseETL.process_dataset')
@patch('etl.supabase_etl.create_client')
def test_partial_failure_handling(mock_create_client, mock_process_dataset, mock_supabase_env):
    """Test that failure in one dataset does not stop processing of others"""
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    
    # Mock finding 2 datasets
    mock_client.table().select().in_().execute.return_value = MagicMock(data=[
        {'id': 'ds1', 'name': 'Dataset 1'},
        {'id': 'ds2', 'name': 'Dataset 2'}
    ])
    
    # First fails, second succeeds
    mock_process_dataset.side_effect = [{'success': False, 'error': 'fail'}, {'success': True}]
    
    etl = SupabaseETL()
    stats = etl.process_all_unprocessed_datasets()
    
    assert stats['processed'] == 2
    assert stats['successful'] == 1
    assert stats['failed'] == 1
