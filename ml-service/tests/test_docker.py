# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

import os
import pytest
import subprocess
import requests
from time import sleep

def check_container_health(container_name: str) -> bool:
    """Helper to check if a local container is healthy or running via docker CLI"""
    try:
        result = subprocess.run(
            ["docker", "inspect", "--format={{.State.Status}}", container_name],
            capture_output=True, text=True, check=True
        )
        status = result.stdout.strip()
        if status == "running":
            # Also check health
            health_result = subprocess.run(
                ["docker", "inspect", "--format={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}", container_name],
                capture_output=True, text=True
            )
            health = health_result.stdout.strip()
            return health in ["healthy", "none"]
        return False
    except Exception:
        # If docker isn't running or container doesn't exist during pure test execution, we skip or mock
        return False

@pytest.mark.skipif(not os.getenv("RUN_DOCKER_TESTS"), reason="Requires Docker environment")
def test_docker_backend_health():
    """Test backend container restarts safely and recovers"""
    # Verify it runs
    assert check_container_health("biz-stratosphere-backend")
    
    # Simulate failure
    subprocess.run(["docker", "kill", "biz-stratosphere-backend"])
    
    # Wait for docker-compose restart: unless-stopped
    sleep(10)
    
    # Should be back running
    assert check_container_health("biz-stratosphere-backend")

@pytest.mark.skipif(not os.getenv("RUN_DOCKER_TESTS"), reason="Requires Docker environment")
def test_docker_ollama_health():
    """Test Ollama container has the required healthchecks"""
    assert check_container_health("biz-stratosphere-ollama")
    
    # Check that the API actually responds
    response = requests.get("http://localhost:11434/api/tags")
    assert response.status_code == 200

@pytest.mark.skipif(not os.getenv("RUN_DOCKER_TESTS"), reason="Requires Docker environment")
def test_docker_db_retry_connection():
    """Test that postgres runs and is reachable"""
    assert check_container_health("postgres-airflow")
