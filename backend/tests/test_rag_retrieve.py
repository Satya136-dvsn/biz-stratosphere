import sys
import os
from pathlib import Path

# Add backend and root directory to sys.path
sys.path.insert(0, str(Path(__file__).parent / "backend"))
sys.path.insert(0, str(Path(__file__).parent))

import asyncio
from backend.rag_service.main import app, retrieve, RetrieveRequest, startup, STANDARD_PLAYBOOKS, _retrieve_in_memory_playbooks, _synthetic_embed

import pytest

@pytest.mark.asyncio
async def test_rag_retrieval_playbooks():
    print("=== Test 1: Standard retrieve endpoint with startup ===")
    await startup()

    req = RetrieveRequest(query="mitigation strategy high churn risk", top_k=5)
    response = await retrieve(req)

    print("Response success:", response.success)
    print("Snippets returned count:", len(response.snippets))

    snippet_ids = [s.id for s in response.snippets]
    print("Returned Snippet IDs:", snippet_ids)
    for idx, s in enumerate(response.snippets):
        print(f"[{idx+1}] ID: {s.id}, Score: {s.score}")
        print(f"    Text: {s.text[:100]}...")

    assert "PB-001" in snippet_ids, "PB-001 must be in returned snippets"
    assert "PB-002" in snippet_ids, "PB-002 must be in returned snippets"
    top_two = snippet_ids[:2]
    assert set(top_two) == {"PB-001", "PB-002"}, f"Top 2 must be PB-001 and PB-002, got: {top_two}"
    print("PASSED: Endpoint returns PB-001 and PB-002 as top 2 results!")

    print("\n=== Test 2: Pure zero-dependency offline synthetic retrieval ===")
    synthetic_snippets = _retrieve_in_memory_playbooks("mitigation strategy high churn risk", query_vec=None, top_k=5)
    synthetic_ids = [s.id for s in synthetic_snippets]
    print("Synthetic fallback Snippet IDs:", synthetic_ids)
    for idx, s in enumerate(synthetic_snippets):
        print(f"[{idx+1}] ID: {s.id}, Score: {s.score}")
    assert set(synthetic_ids[:2]) == {"PB-001", "PB-002"}, f"Synthetic fallback top 2 must be PB-001 and PB-002, got: {synthetic_ids[:2]}"
    print("PASSED: Pure zero-dependency synthetic retrieval returns PB-001 and PB-002!")

    print("\nALL RETRIEVAL TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_test())
