import time
import logging
from typing import Dict, List, Any
from collections import deque
from shared.metrics import Counter, Histogram

logger = logging.getLogger("llm-orchestrator.memory")

# Standalone metrics for Memory
agent_memory_reads_total = Counter("agent_memory_reads_total", "Total number of memory reads", labels=["status"])
agent_memory_writes_total = Counter("agent_memory_writes_total", "Total number of memory writes", labels=["status"])
agent_memory_context_size = Histogram("agent_memory_context_size", "Size of memory context in messages", labels=[])

class AgentMemoryManager:
    """
    Manages short-term conversational memory for Agent sessions.
    Uses an in-memory dictionary with deque for bounded window.
    """
    def __init__(self, max_history: int = 10):
        self.max_history = max_history
        # session_id -> deque of interactions
        self._sessions: Dict[str, deque] = {}

    def get_context(self, session_id: str) -> List[Dict[str, Any]]:
        """Retrieve recent interactions for a session."""
        if not session_id or session_id not in self._sessions:
            agent_memory_reads_total.inc(status="miss")
            return []
        
        history = list(self._sessions[session_id])
        agent_memory_reads_total.inc(status="hit")
        agent_memory_context_size.observe(len(history))
        return history

    def add_interaction(
        self, 
        session_id: str, 
        user_query: str, 
        agent_reasoning: str, 
        tools_used: List[Dict], 
        final_decision: str
    ):
        """Store a new interaction in the session history."""
        if not session_id:
            return

        if session_id not in self._sessions:
            self._sessions[session_id] = deque(maxlen=self.max_history)
        
        interaction = {
            "role": "assistant",
            "content": f"Previous Query: {user_query}\nReasoning: {agent_reasoning}\nTools Used: {tools_used}\nDecision: {final_decision}",
            "metadata": {
                "user_query": user_query,
                "agent_reasoning": agent_reasoning,
                "tools_used": tools_used,
                "final_decision": final_decision,
                "timestamp": time.time()
            }
        }
        
        self._sessions[session_id].append(interaction)
        agent_memory_writes_total.inc(status="success")
        
        # Log for debugging
        logger.debug(f"Memory updated for session {session_id}. History size: {len(self._sessions[session_id])}")

    def clear_session(self, session_id: str):
        """Manually clear a session's memory."""
        if session_id in self._sessions:
            del self._sessions[session_id]

# Singleton instance
memory_manager = AgentMemoryManager(max_history=8)
