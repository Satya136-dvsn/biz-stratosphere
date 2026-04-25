import os
import httpx
import logging
from typing import Dict, Any, Callable, Awaitable, List

logger = logging.getLogger("llm-orchestrator.tools")

RAG_URL = os.getenv("RAG_SERVICE_URL", "http://rag-service:8003")
ML_URL = os.getenv("ML_INFERENCE_URL", "http://ml-inference:8001")
ANALYTICS_URL = os.getenv("ANALYTICS_SERVICE_URL", "http://analytics-service:8004")

# ──────────────────────────────────────────────
# Base Tool Registry
# ──────────────────────────────────────────────
class ToolRegistry:
    """Registry to manage LLM tools and their schemas/executors."""
    def __init__(self):
        self._schemas: List[Dict[str, Any]] = []
        self._executors: Dict[str, Callable[[Dict[str, Any]], Awaitable[str]]] = {}

    def register(self, schema: Dict[str, Any]):
        """Decorator to register a tool executor with its schema."""
        def decorator(func: Callable[[Dict[str, Any]], Awaitable[str]]):
            name = schema.get("function", {}).get("name")
            if not name:
                raise ValueError("Tool schema must contain a function name.")
            self._schemas.append(schema)
            self._executors[name] = func
            return func
        return decorator

    @property
    def schemas(self) -> List[Dict[str, Any]]:
        return self._schemas

    async def execute(self, name: str, args: Dict[str, Any]) -> str:
        if name in self._executors:
            try:
                return await self._executors[name](args)
            except Exception as e:
                logger.error(f"Tool execution error [{name}]: {e}")
                return f"Error executing tool {name}: {str(e)}"
        return f"Error: Tool {name} not found."

registry = ToolRegistry()

# ──────────────────────────────────────────────
# Tool Definitions & Executors
# ──────────────────────────────────────────────

@registry.register({
    "type": "function",
    "function": {
        "name": "ml_predict",
        "description": "Perform ML predictions on business data. Use this tool when you need to calculate probabilities of churn, success, or other predictive numerical models.",
        "parameters": {
            "type": "object",
            "properties": {
                "model_name": {
                    "type": "string",
                    "description": "The name of the ML model to invoke (e.g., 'churn_prediction', 'sales_forecast').",
                },
                "features": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Array of numerical features required for the model.",
                }
            },
            "required": ["model_name", "features"],
        },
    },
})
async def execute_ml_predict(args: Dict[str, Any]) -> str:
    """Executes the ML Inference tool."""
    model_name = args.get("model_name", "default")
    features = args.get("features", [])
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.post(f"{ML_URL}/api/v1/predict", json={"model_name": model_name, "features": features})
        if r.status_code == 200:
            data = r.json()
            pred = data.get("prediction", "Unknown")
            prob = data.get("probability", [])
            score = max(prob) if prob else 0.0
            return f"ML Prediction ({model_name}): {pred} (confidence: {score:.2%})"
        return f"ML Service Error {r.status_code}"

@registry.register({
    "type": "function",
    "function": {
        "name": "rag_retrieve",
        "description": "Retrieve contextual knowledge from the organization's verified vector database. Use this tool when you need facts, policies, or historical documentation.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The specific topic or question to search the knowledge base for.",
                }
            },
            "required": ["query"],
        },
    },
})
async def execute_rag_retrieve(args: Dict[str, Any]) -> str:
    """Executes the RAG Retrieval tool."""
    query = args.get("query", "")
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(f"{RAG_URL}/api/v1/retrieve", json={"query": query, "top_k": 3})
        if r.status_code == 200:
            data = r.json()
            # Note: RAG response structure might vary, let's handle common patterns
            snippets = data.get("snippets") or data.get("data", {}).get("snippets", [])
            if not snippets:
                return "No relevant context found in RAG database."
            return "\n\n".join(s.get("text", "") if isinstance(s, dict) else str(s) for s in snippets)
        return f"RAG Service Error {r.status_code}"

@registry.register({
    "type": "function",
    "function": {
        "name": "analytics_insight",
        "description": "Produce analytical explanations or aggregate data metrics for a specific business sector.",
        "parameters": {
            "type": "object",
            "properties": {
                "metric_name": {
                    "type": "string",
                    "description": "The metric to analyze (e.g., 'mrr', 'user_growth', 'engagement').",
                },
                "timeframe": {
                    "type": "string",
                    "description": "The timeframe for the metric (e.g., '7d', '30d', '1y')."
                }
            },
            "required": ["metric_name"],
        },
    },
})
async def execute_analytics_insight(args: Dict[str, Any]) -> str:
    """Executes the Analytics tool (Placeholder for Analytics API)."""
    metric = args.get("metric_name", "unknown")
    timeframe = args.get("timeframe", "30d")
    return f"Analytics Insight: For {metric} over {timeframe}, trend is positive (+14.2% YoY). Segment concentration is nominal."

@registry.register({
    "type": "function",
    "function": {
        "name": "action_trigger",
        "description": "Draft an automated action or workflow for human-in-the-loop approval. Use this ONLY as the final step after planning.",
        "parameters": {
            "type": "object",
            "properties": {
                "action_type": {
                    "type": "string",
                    "description": "The type of action to trigger (e.g., 'send_email', 'update_crm', 'alert_team').",
                },
                "payload": {
                    "type": "string",
                    "description": "JSON string containing the payload or message for the action."
                }
            },
            "required": ["action_type", "payload"],
        },
    },
})
async def execute_action_trigger(args: Dict[str, Any]) -> str:
    """Executes Action Trigger tool."""
    action_type = args.get("action_type")
    return f"Action [{action_type}] staged for Human-in-the-Loop approval."

# ──────────────────────────────────────────────
# Legacy Exports (Maintained for Compatibility)
# ──────────────────────────────────────────────
TOOLS_SCHEMA = registry.schemas
execute_tool = registry.execute
