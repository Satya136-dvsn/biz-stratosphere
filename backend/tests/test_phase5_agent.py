import asyncio
import sys
from pathlib import Path

# Add backend and llm_orchestrator to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir / "llm_orchestrator"))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import pytest
from agent import run_agent

@pytest.mark.asyncio
async def test_phase5_run_agent():
    query = "Identify high-risk accounts and summarize our mitigation strategy."
    res = await run_agent(query)
    
    print("=== Phase 5 Agent Run Results ===")
    print("Success:", res.get("success"))
    print("Query:", res.get("query"))
    tools_used = [t["name"] for t in res.get("tools_used", [])]
    print("Tools Used:", tools_used)
    print("Confidence Score:", res.get("confidence_score"))
    print("Status:", res.get("status"))
    print("\n--- Agent Reasoning Snippet ---")
    print(res.get("agent_reasoning")[:200] + "...")
    print("\n--- Final Decision Snippet ---")
    print(res.get("final_decision")[:300] + "...")

    # Assertions per requirements
    assert res.get("success") is True, "Expected success=True"
    assert "ml_predict" in tools_used, "ml_predict must be in tools_used"
    assert "rag_retrieve" in tools_used, "rag_retrieve must be in tools_used"
    assert res.get("confidence_score") >= 0.95, f"Confidence score must be >= 0.95, got {res.get('confidence_score')}"
    
    final_decision = res.get("final_decision", "")
    assert "Cascade Global" in final_decision, "Cascade Global missing from final decision"
    assert "88%" in final_decision, "88% missing from final decision"
    assert "Northstar Logistics" in final_decision, "Northstar Logistics missing from final decision"
    assert "84%" in final_decision, "84% missing from final decision"
    assert "Vanguard Dynamics" in final_decision, "Vanguard Dynamics missing from final decision"
    assert "81%" in final_decision, "81% missing from final decision"
    assert "PB-001" in final_decision, "PB-001 missing from final decision"
    assert "PB-002" in final_decision, "PB-002 missing from final decision"
    assert "PB-003" in final_decision, "PB-003 missing from final decision"
    assert "72-Hour" in final_decision or "72h" in final_decision.lower() or "72 hour" in final_decision.lower(), "72h action matrix missing"
    
    print("\n>>> ALL PHASE 5 AGENT VERIFICATIONS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    asyncio.run(test_phase5_run_agent())
