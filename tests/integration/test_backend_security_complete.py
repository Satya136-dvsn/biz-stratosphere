#!/usr/bin/env python3
"""
Integration tests for backend function error handling and security
Tests authentication, authorization, input validation, and error responses
"""
import os
import sys
import json
import tempfile
from unittest.mock import Mock, patch, MagicMock

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_data_upload_authentication():
    """Test authentication requirements for data upload"""
    print("🧪 Testing Data Upload Authentication...")

    try:
        # Mock the Deno environment
        mock_env = {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_SERVICE_ROLE_KEY": "test-service-key"
        }

        with patch.dict(os.environ, mock_env):
            from supabase.functions.data_upload.index import serve

            # Test without authorization header
            mock_request = Mock()
            mock_request.method = "POST"
            mock_request.headers = {}

            # Mock response
            response = serve(mock_request)
            assert response.status == 401
            response_data = json.loads(response.body)
            assert "Authorization header missing" in response_data["error"]

            # Test with invalid token
            mock_request.headers = {"Authorization": "Bearer invalid-token"}

            with patch('supabase.functions.data_upload.index.createClient') as mock_create_client:
                mock_supabase = Mock()
                mock_auth = Mock()
                mock_auth.getUser.return_value = {"data": {"user": None}, "error": "Invalid token"}
                mock_supabase.auth = mock_auth
                mock_create_client.return_value = mock_supabase

                response = serve(mock_request)
                assert response.status == 401
                response_data = json.loads(response.body)
                assert "Invalid or expired token" in response_data["error"]

            print("✓ Authentication requirements working correctly")
            return True

    except Exception as e:
        print(f"❌ Authentication test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_data_upload_input_validation():
    """Test input validation for data upload"""
    print("\n🧪 Testing Data Upload Input Validation...")

    try:
        mock_env = {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_SERVICE_ROLE_KEY": "test-service-key"
        }

        with patch.dict(os.environ, mock_env):
            from supabase.functions.data_upload.index import serve

            # Mock authenticated request
            mock_request = Mock()
            mock_request.method = "POST"
            mock_request.headers = {"Authorization": "Bearer valid-token"}

            with patch('supabase.functions.data_upload.index.createClient') as mock_create_client:
                mock_supabase = Mock()
                mock_auth = Mock()
                mock_auth.getUser.return_value = {"data": {"user": {"id": "test-user"}}, "error": None}
                mock_supabase.auth = mock_auth
                mock_create_client.return_value = mock_supabase

                # Test invalid payload format
                mock_request.json.return_value = {"invalid": "payload"}

                response = serve(mock_request)
                assert response.status == 400
                response_data = json.loads(response.body)
                assert "Invalid payload format" in response_data["error"]

                # Test missing arrays
                mock_request.json.return_value = {"datasets": [], "data_points": "not_array"}

                response = serve(mock_request)
                assert response.status == 400
                response_data = json.loads(response.body)
                assert "Invalid payload format" in response_data["error"]

                # Test with valid payload structure
                mock_request.json.return_value = {
                    "datasets": [{"name": "test", "file_name": "test.csv"}],
                    "data_points": [{"metric_name": "test", "metric_value": 1.0}]
                }

                # Mock successful database operations
                mock_table = Mock()
                mock_table.insert.return_value = Mock()
                mock_table.insert.return_value.select.return_value = Mock()
                mock_supabase.from.return_value = mock_table

                response = serve(mock_request)
                assert response.status == 200
                response_data = json.loads(response.body)
                assert "Data uploaded successfully" in response_data["message"]

                print("✓ Input validation working correctly")
                return True

    except Exception as e:
        print(f"❌ Input validation test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_database_error_handling():
    """Test database error handling"""
    print("\n🧪 Testing Database Error Handling...")

    try:
        mock_env = {
            "SUPABASE_URL": "https://test.supabase.co",
            "SUPABASE_SERVICE_ROLE_KEY": "test-service-key"
        }

        with patch.dict(os.environ, mock_env):
            from supabase.functions.data_upload.index import serve

            # Mock authenticated request
            mock_request = Mock()
            mock_request.method = "POST"
            mock_request.headers = {"Authorization": "Bearer valid-token"}

            with patch('supabase.functions.data_upload.index.createClient') as mock_create_client:
                mock_supabase = Mock()
                mock_auth = Mock()
                mock_auth.getUser.return_value = {"data": {"user": {"id": "test-user"}}, "error": None}
                mock_supabase.auth = mock_auth
                mock_create_client.return_value = mock_supabase

                # Mock request data
                mock_request.json.return_value = {
                    "datasets": [{"name": "test", "file_name": "test.csv"}],
                    "data_points": [{"metric_name": "test", "metric_value": 1.0}]
                }

                # Test datasets insert error
                mock_datasets_table = Mock()
                mock_datasets_table.insert.return_value = Mock()
                mock_datasets_table.insert.return_value.select.return_value = Mock()
                mock_datasets_table.insert.return_value.select.return_value = {"error": "Database connection failed"}

                mock_data_points_table = Mock()
                mock_data_points_table.insert.return_value = Mock()
                mock_data_points_table.insert.return_value.select.return_value = Mock()
                mock_data_points_table.insert.return_value.select.return_value = {"error": None}

                def mock_from(table_name):
                    if table_name == "datasets":
                        return mock_datasets_table
                    elif table_name == "data_points":
                        return mock_data_points_table
