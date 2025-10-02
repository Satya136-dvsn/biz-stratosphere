#!/usr/bin/env python3
"""
Integration tests for the complete data upload flow
Tests file processing, validation, and database operations
"""
import os
import sys
import tempfile
import pandas as pd
import numpy as np
import json
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_csv_upload_flow():
    """Test complete CSV upload flow with real data"""
    print("🧪 Testing CSV Upload Flow...")

    try:
        # Create realistic test data similar to Bank Customer Churn dataset
        test_data = pd.DataFrame({
            'customer_id': range(1, 101),
            'credit_score': np.random.randint(300, 850, 100),
            'country': np.random.choice(['France', 'Spain', 'Germany'], 100),
            'gender': np.random.choice(['Male', 'Female'], 100),
            'age': np.random.randint(18, 80, 100),
            'tenure': np.random.randint(0, 10, 100),
            'balance': np.random.uniform(0, 200000, 100),
            'products_number': np.random.randint(1, 4, 100),
            'credit_card': np.random.randint(0, 2, 100),
            'active_member': np.random.randint(0, 2, 100),
            'estimated_salary': np.random.uniform(30000, 150000, 100),
            'churn': np.random.randint(0, 2, 100)
        })

        # Save test data to temporary CSV file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            test_data.to_csv(f.name, index=False)
            csv_file_path = f.name

        try:
            # Test file processing
            from src.hooks.useDataUpload import useDataUpload

            # Mock the React hooks environment
            class MockToast:
                def __init__(self):
                    self.calls = []

                def __call__(self, params):
                    self.calls.append(params)

            class MockAuth:
                def __init__(self):
                    self.user = Mock()
                    self.user.id = 'test-user-123'

            class MockCompany:
                def __init__(self):
                    self.company = Mock()
                    self.company.id = 'test-company-123'

            # Mock the hooks
            with patch('src.hooks.useDataUpload.useToast', return_value=MockToast()):
                with patch('src.hooks.useDataUpload.useAuth', return_value=MockAuth()):
                    with patch('src.hooks.useDataUpload.useCompany', return_value=MockCompany()):

                        # Test file processing
                        upload_hook = useDataUpload()

                        # Mock file object
                        mock_file = Mock()
                        mock_file.name = 'test_data.csv'
                        mock_file.type = 'text/csv'
                        mock_file.size = os.path.getsize(csv_file_path)

                        # Test processFile function
                        data_points = upload_hook.processFile(mock_file)

                        # Verify data transformation
                        assert len(data_points) > 0
                        assert all('metric_name' in dp for dp in data_points)
                        assert all('metric_value' in dp for dp in data_points)
                        assert all('metric_type' in dp for dp in data_points)

                        print("✓ CSV upload flow processing successful")
                        return True

        finally:
            # Clean up temporary file
            os.unlink(csv_file_path)

    except Exception as e:
        print(f"❌ CSV upload flow test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_excel_upload_flow():
    """Test Excel file upload flow"""
    print("\n🧪 Testing Excel Upload Flow...")

    try:
        # Create test data
        test_data = pd.DataFrame({
            'customer_id': range(1, 51),
            'credit_score': np.random.randint(300, 850, 50),
            'age': np.random.randint(18, 80, 50),
            'balance': np.random.uniform(0, 100000, 50),
            'churn': np.random.randint(0, 2, 50)
        })

        # Save as Excel file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as f:
            test_data.to_excel(f.name, index=False)
            excel_file_path = f.name

        try:
            # Mock file processing for Excel
            from src.hooks.useDataUpload import useDataUpload

            class MockToast:
                def __init__(self):
                    self.calls = []

                def __call__(self, params):
                    self.calls.append(params)

            class MockAuth:
                def __init__(self):
                    self.user = Mock()
                    self.user.id = 'test-user-456'

            class MockCompany:
                def __init__(self):
                    self.company = Mock()
                    self.company.id = 'test-company-456'

            with patch('src.hooks.useDataUpload.useToast', return_value=MockToast()):
                with patch('src.hooks.useDataUpload.useAuth', return_value=MockAuth()):
                    with patch('src.hooks.useDataUpload.useCompany', return_value=MockCompany()):

                        upload_hook = useDataUpload()

                        # Mock Excel file
                        mock_file = Mock()
                        mock_file.name = 'test_data.xlsx'
                        mock_file.type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        mock_file.size = os.path.getsize(excel_file_path)

                        # Test Excel processing
                        data_points = upload_hook.processFile(mock_file)

                        assert len(data_points) > 0
                        assert all(dp['metric_name'] in ['credit_score', 'age', 'balance', 'churn'] for dp in data_points)

                        print("✓ Excel upload flow processing successful")
                        return True

        finally:
            os.unlink(excel_file_path)

    except Exception as e:
        print(f"❌ Excel upload flow test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_invalid_file_formats():
    """Test handling of invalid file formats"""
    print("\n🧪 Testing Invalid File Format Handling...")

    try:
        from src.hooks.useDataUpload import useDataUpload

        class MockToast:
            def __init__(self):
                self.calls = []

                def __call__(self, params):
                    self.calls.append(params)

            class MockAuth:
                def __init__(self):
                    self.user = Mock()
                    self.user.id = 'test-user-789'

            class MockCompany:
                def __init__(self):
                    self.company = Mock()
                    self.company.id = 'test-company-789'

            with patch('src.hooks.useDataUpload.useToast', return_value=MockToast()):
                with patch('src.hooks.useDataUpload.useAuth', return_value=MockAuth()):
                    with patch('src.hooks.useDataUpload.useCompany', return_value=MockCompany()):

                        upload_hook = useDataUpload()

                        # Test invalid file format
                        mock_file = Mock()
                        mock_file.name = 'test_data.txt'
                        mock_file.type = 'text/plain'
                        mock_file.size = 1000

                        try:
                            data_points = upload_hook.processFile(mock_file)
                            assert False, "Should have raised an error for invalid file format"
                        except Exception as e:
                            assert "Unsupported file format" in str(e)

                        print("✓ Invalid file format handling working correctly")
                        return True

    except Exception as e:
        print(f"❌ Invalid file format test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_large_file_handling():
    """Test handling of large files"""
    print("\n🧪 Testing Large File Handling...")

    try:
        # Create a large dataset
        large_data = pd.DataFrame({
            'customer_id': range(1, 10001),  # 10k rows
            'feature_1': np.random.randn(10000),
            'feature_2': np.random.randn(10000),
            'feature_3': np.random.randn(10000),
            'target': np.random.randint(0, 2, 10000)
        })

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            large_data.to_csv(f.name, index=False)
            large_file_path = f.name

        try:
            from src.hooks.useDataUpload import useDataUpload

            class MockToast:
                def __init__(self):
                    self.calls = []

                def __call__(self, params):
                    self.calls.append(params)

            class MockAuth:
                def __init__(self):
                    self.user = Mock()
                    self.user.id = 'test-user-large'

            class MockCompany:
                def __init__(self):
                    self.company = Mock()
                    self.company.id = 'test-company-large'

            with patch('src.hooks.useDataUpload.useToast', return_value=MockToast()):
                with patch('src.hooks.useDataUpload.useAuth', return_value=MockAuth()):
                    with patch('src.hooks.useDataUpload.useCompany', return_value=MockCompany()):

                        upload_hook = useDataUpload()

                        mock_file = Mock()
                        mock_file.name = 'large_test_data.csv'
                        mock_file.type = 'text/csv'
                        mock_file.size = os.path.getsize(large_file_path)

                        # Test processing large file
                        data_points = upload_hook.processFile(mock_file)

                        assert len(data_points) == 10000
                        assert all('metric_name' in dp for dp in data_points)

                        print("✓ Large file handling working correctly")
                        return True

        finally:
            os.unlink(large_file_path)

    except Exception as e:
        print(f"❌ Large file handling test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all data upload flow tests"""
    print("🚀 Starting Data Upload Flow Integration Tests")
    print("=" * 60)

    tests = [
        test_csv_upload_flow,
        test_excel_upload_flow,
        test_invalid_file_formats,
        test_large_file_handling
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1

    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("✅ All data upload flow tests PASSED!")
        return True
    else:
        print("❌ Some data upload flow tests FAILED.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
