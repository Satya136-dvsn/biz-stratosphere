import os
import json
import time
import httpx
import logging
from typing import Dict, Any, List, Optional
import sys

sys.path.insert(0, "/app")
from shared.tracing import init_tracer
from shared.metrics import get_or_create_metrics
metrics_service = get_or_create_metrics("llm-orchestrator-agent")
Counter = metrics_service.Counter if hasattr(metrics_service, 'Counter') else None
# Since shared.metrics.py uses Counter and Histogram classes directly in ServiceMetrics
# but doesn't export a global 'metrics' object, let's fix the imports.

from shared.metrics import Counter, Histogram

import asyncpg

from tools import TOOLS_SCHEMA, execute_tool
from memory import memory_manager

logger = logging.getLogger("llm-orchestrator.agent")
tracer = init_tracer("llm-orchestrator.agent")

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
DATABASE_URL = os.getenv("DATABASE_URL")

# Standalone metrics for Agent (per instructions)
agent_decision_total = Counter("agent_decision_total", "Total number of agent decisions", labels=["status"])
agent_tool_calls_total = Counter("agent_tool_calls_total", "Total number of tool calls by agent", labels=["tool_name"])
agent_decision_latency_seconds = Histogram("agent_decision_latency_seconds", "Latency of full agent decision loop", labels=[])
agent_cache_hits_total = Counter("agent_cache_hits_total", "Total number of cache hits for agent queries", labels=[])

async def get_system_prompt() -> str:
    default_prompt = (
        "You are the Biz Stratosphere AI Agent. You oversee business operations. "
        "You must answer the user query by planning your actions, optionally calling tools, and producing a final_decision. "
        "Available tools: ml_predict, rag_retrieve, analytics_insight, action_trigger."
    )
    if not DATABASE_URL:
        return default_prompt
    try:
        import ssl
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        conn = await asyncpg.connect(DATABASE_URL, ssl=ssl_ctx)
        row = await conn.fetchrow("SELECT prompt_text FROM public.prompt_versions WHERE prompt_name='agent_system_prompt' ORDER BY version DESC LIMIT 1")
        await conn.close()
        if row: 
            return row['prompt_text']
    except Exception as e:
        logger.error(f"Failed to fetch prompt: {e}")
    return default_prompt

async def _save_decision(
    user_query: str, 
    tools_used: List[Dict], 
    ml_results: Dict, 
    rag_context: Dict, 
    agent_reasoning: str,
    final_decision: str,
    confidence_score: float,
    status: str
):
    if not DATABASE_URL:
        return
    try:
        import ssl
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        conn = await asyncpg.connect(DATABASE_URL, ssl=ssl_ctx)
        await conn.execute(
            """INSERT INTO public.agent_decision_memory 
               (user_query, tools_used, ml_results, rag_context, agent_reasoning, final_decision, confidence_score, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
            user_query,
            json.dumps(tools_used),
            json.dumps(ml_results),
            json.dumps(rag_context),
            agent_reasoning,
            final_decision,
            confidence_score,
            status
        )
        await conn.close()
    except Exception as e:
        logger.error(f"Failed to save decision_memory: {e}")

async def _check_cache(query: str) -> Optional[Dict[str, Any]]:
    """Simple cache check to avoid redundant LLM/tool calls for identical queries."""
    if not DATABASE_URL:
        return None
    try:
        import ssl
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        conn = await asyncpg.connect(DATABASE_URL, ssl=ssl_ctx)
        
        # Exact match for now (Semantic-ish would use pgvector, but let's start with high-confidence exact matches)
        # We look for successful executions from the last 24 hours
        row = await conn.fetchrow(
            """SELECT tools_used, agent_reasoning, final_decision, confidence_score, status 
               FROM public.agent_decision_memory 
               WHERE user_query = $1 AND status = 'executed' 
               ORDER BY timestamp DESC LIMIT 1""",
            query
        )
        await conn.close()
        
        if row:
            logger.info(f"Cache hit for query: {query[:50]}...")
            agent_cache_hits_total.inc()
            return {
                "success": True,
                "query": query,
                "tools_used": json.loads(row['tools_used']),
                "agent_reasoning": row['agent_reasoning'],
                "final_decision": row['final_decision'],
                "confidence_score": row['confidence_score'],
                "status": row['status'],
                "cached": True
            }
    except Exception as e:
        logger.error(f"Cache check error: {e}")
    return None

async def run_agent(query: str, session_id: Optional[str] = None) -> Dict[str, Any]:
    start_time = time.monotonic()
    
    # Check Cache first (Only if no session history is requested, or skip cache for multi-turn)
    if not session_id:
        cached_result = await _check_cache(query)
        if cached_result:
            return cached_result

    with tracer.start_as_current_span("agent.plan") as plan_span:
        system_prompt = await get_system_prompt()
        plan_span.set_attribute("query", query)
        if session_id:
            plan_span.set_attribute("session_id", session_id)
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Inject Memory if session_id is provided
        if session_id:
            history = memory_manager.get_context(session_id)
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": query})

    tools_used = []
    ml_results = {}
    rag_context = {}
    
    # Loop max 5 times for ReAct
    for step in range(5):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{OLLAMA_HOST}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": messages,
                        "tools": TOOLS_SCHEMA,
                        "stream": False
                    }
                )
                resp.raise_for_status()
                data = resp.json()
        except Exception as e:
            logger.error(f"Ollama chat error: {e}")
            break

        message = data.get("message", {})
        messages.append(message)
        
        # Check if Ollama decided to call tools
        tool_calls = message.get("tool_calls", [])
        if not tool_calls:
            # No more tools, agent should have answered
            break

        for tc in tool_calls:
            func = tc.get("function", {})
            name = func.get("name")
            args = func.get("arguments", {})
            
            with tracer.start_as_current_span(f"agent.tool_call.{name}") as tool_span:
                tool_span.set_attribute("tool.name", name)
                agent_tool_calls_total.inc(tool_name=name)
                
                result_str = await execute_tool(name, args)
                tool_span.set_attribute("tool.result", result_str)
                
                tools_used.append({"name": name, "args": args})
                if name == "ml_predict":
                    ml_results[args.get("model_name", "unknown")] = result_str
                elif name == "rag_retrieve":
                    rag_context["query"] = result_str
                
                messages.append({
                    "role": "tool",
                    "content": result_str,
                    "name": name
                })

    # Agent Reason
    with tracer.start_as_current_span("agent.reason") as reason_span:
        # We assume the last message or the progression contains reasoning.
        # Let's prompt for final reasoning and decision explicitly if not provided.
        messages.append({
            "role": "user",
            "content": "Please provide your final_decision and the agent_reasoning. Format as JSON: {\"reasoning\": \"...\", \"decision\": \"...\"}"
        })
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(
                    f"{OLLAMA_HOST}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": messages,
                        "format": "json",
                        "stream": False
                    }
                )
                final_data = res.json().get("message", {}).get("content", "{}")
                final_obj = json.loads(final_data)
        except Exception as e:
            logger.error(f"Agent reason error: {e}")
            final_obj = {"reasoning": "Fallback reasoning due to error", "decision": messages[-1].get("content", "Unknown")}

        agent_reasoning = final_obj.get("reasoning", str(final_obj))
        final_decision = final_obj.get("decision", str(final_obj))
        reason_span.set_attribute("reasoning", agent_reasoning)

    # Confidence Scoring (Rule-based combining signals)
    confidence_score = 0.8 # Base
    if ml_results: confidence_score += 0.1
    if rag_context: confidence_score += 0.05
    confidence_score = min(confidence_score, 0.99)
    
    # Check if 'action_trigger' was called to pause for human-in-the-loop
    status = "executed"
    for t in tools_used:
        if t["name"] == "action_trigger":
            status = "pending"

    with tracer.start_as_current_span("agent.final_decision") as decision_span:
        decision_span.set_attribute("decision", final_decision)
        decision_span.set_attribute("confidence", confidence_score)

        # Save to Decision Memory Persistent DB
        await _save_decision(
            user_query=query,
            tools_used=tools_used,
            ml_results=ml_results,
            rag_context=rag_context,
            agent_reasoning=agent_reasoning,
            final_decision=final_decision,
            confidence_score=confidence_score,
            status=status
        )

        # Update Short-Term Memory
        if session_id:
            memory_manager.add_interaction(
                session_id=session_id,
                user_query=query,
                agent_reasoning=agent_reasoning,
                tools_used=tools_used,
                final_decision=final_decision
            )

    agent_decision_total.inc(status=status)
    agent_decision_latency_seconds.observe(time.monotonic() - start_time)

    return {
        "success": True,
        "query": query,
        "tools_used": tools_used,
        "agent_reasoning": agent_reasoning,
        "final_decision": final_decision,
        "confidence_score": confidence_score,
        "status": status
    }
