"""
Shared Environment & Service Resolution Utility
Biz Stratosphere Platform
Centralizes Docker detection and smart URL resolution across all microservices.
"""

import os
import urllib.parse
from typing import Optional, Set

# Known bare Docker Compose service hostnames that only resolve inside container networks
DOCKER_SERVICE_HOSTS: Set[str] = {
    "ollama",
    "rag-service",
    "ml-inference",
    "analytics-service",
    "llm-orchestrator",
    "postgres",
    "gateway",
}


def is_in_docker() -> bool:
    """
    Detect if running inside a Docker or Kubernetes container.
    Checks:
    1. /.dockerenv file presence
    2. /proc/1/cgroup containing 'docker', 'kubepods', or 'containerd'
    3. IS_DOCKER or CONTAINER environment variable flag
    """
    if os.path.exists("/.dockerenv"):
        return True

    try:
        with open("/proc/1/cgroup", "rt", encoding="utf-8") as f:
            content = f.read()
            if any(marker in content for marker in ("docker", "kubepods", "containerd")):
                return True
    except Exception:
        pass

    env_flag = os.getenv("IS_DOCKER", "").lower().strip()
    if env_flag in ("true", "1", "yes", "on"):
        return True

    container_flag = os.getenv("CONTAINER", "").lower().strip()
    if container_flag in ("docker", "podman", "true", "1"):
        return True

    return False


def resolve_service_url(
    env_var: str,
    docker_url: str,
    local_url: str,
    in_docker: Optional[bool] = None,
) -> str:
    """
    Resolve service connection URL with environment precedence and smart fallback.

    Rules:
    1. If `env_var` is set:
       - If running outside Docker AND the URL uses a bare Docker Compose hostname
         (e.g., 'http://ollama:11434' or 'http://rag-service:8003'), it falls back
         to `local_url` (preserving port if present) to avoid DNS failure on local machines.
       - If the URL points to a remote domain, FQDN, or IP (e.g. 'https://ollama.corp.internal:11434'),
         it is RESPECTED and NEVER overridden with localhost.
    2. If `env_var` is not set:
       - Uses `docker_url` when in Docker, otherwise `local_url`.
    """
    if in_docker is None:
        in_docker = is_in_docker()

    val = os.getenv(env_var)
    if not val:
        return docker_url if in_docker else local_url

    val = val.strip()

    # If running outside Docker, check if the configured URL points to an unresolvable Docker service name
    if not in_docker:
        try:
            parsed = urllib.parse.urlparse(val)
            hostname = (parsed.hostname or "").lower()
            if hostname in DOCKER_SERVICE_HOSTS:
                # Replace with localhost while preserving port/path/scheme
                port = f":{parsed.port}" if parsed.port else ""
                path = parsed.path or ""
                scheme = parsed.scheme or "http"
                return f"{scheme}://localhost{port}{path}"
        except Exception:
            pass

    return val
