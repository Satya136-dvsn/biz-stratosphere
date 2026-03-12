"""
Pre-configured async HTTP client with timeout policies.
Biz Stratosphere Phase 5 – All inter-service calls MUST use these clients.
"""
from __future__ import annotations

import httpx
from typing import Optional


# ──────────────────────────────────────────────
# Timeout budget constants (milliseconds → seconds)
# ──────────────────────────────────────────────
class Timeouts:
    # Gateway → any downstream service
    GATEWAY_DEFAULT = httpx.Timeout(connect=3.0, read=15.0, write=5.0, pool=3.0)

    # LLM Orchestrator → RAG (fast retrieval expected)
    ORCHESTRATOR_TO_RAG = httpx.Timeout(connect=2.0, read=3.0, write=2.0, pool=2.0)

    # LLM Orchestrator → ML Inference (model inference)
    ORCHESTRATOR_TO_ML = httpx.Timeout(connect=2.0, read=3.0, write=2.0, pool=2.0)

    # Any service → Ollama (LLM generation is slow)
    ANY_TO_OLLAMA = httpx.Timeout(connect=5.0, read=60.0, write=5.0, pool=5.0)

    # Any service → PostgreSQL / DB proxies
    ANY_TO_DB = httpx.Timeout(connect=2.0, read=5.0, write=3.0, pool=2.0)

    # Health/liveness probes (fast)
    HEALTH_CHECK = httpx.Timeout(connect=1.0, read=3.0, write=1.0, pool=1.0)


# ──────────────────────────────────────────────
# Client factories
# ──────────────────────────────────────────────
def make_gateway_client(base_url: str) -> httpx.AsyncClient:
    """Client for Gateway→Microservice calls."""
    return httpx.AsyncClient(
        base_url=base_url,
        timeout=Timeouts.GATEWAY_DEFAULT,
        headers={"Content-Type": "application/json"},
    )


def make_orchestrator_client(base_url: str, target: str = "generic") -> httpx.AsyncClient:
    """Client for LLM Orchestrator→sibling service calls."""
    timeout = (
        Timeouts.ORCHESTRATOR_TO_RAG
        if target == "rag"
        else Timeouts.ORCHESTRATOR_TO_ML
        if target == "ml"
        else Timeouts.GATEWAY_DEFAULT
    )
    return httpx.AsyncClient(
        base_url=base_url,
        timeout=timeout,
        headers={"Content-Type": "application/json"},
    )


def make_ollama_client(base_url: str) -> httpx.AsyncClient:
    """Client for any service→Ollama calls (high latency budget)."""
    return httpx.AsyncClient(
        base_url=base_url,
        timeout=Timeouts.ANY_TO_OLLAMA,
        headers={"Content-Type": "application/json"},
    )


def make_health_client() -> httpx.AsyncClient:
    """Lightweight client for internal health probes."""
    return httpx.AsyncClient(timeout=Timeouts.HEALTH_CHECK)
