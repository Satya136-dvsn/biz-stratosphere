"""
RAG Retrieval Service – Biz Stratosphere Phase 5 & Phase 3 Zero-Database Enhancement
Port: 8003
Responsibilities:
  - Query pgvector for semantic similarity search
  - Fall back to zero-database in-memory cosine similarity retrieval over STANDARD_PLAYBOOKS
  - Provide deterministic 768-dim synthetic embeddings when Ollama/paid APIs are absent
  - Return ranked document snippets to callers
  - Expose /health and /ready probes
"""
from __future__ import annotations

import os
import sys
import logging
import time
import json
import math
import re
import hashlib
from typing import Optional

import asyncpg
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from shared import (  # noqa: E402
    make_health_router,
    make_exception_handlers,
    make_ollama_client,
    retry_with_backoff,
)
from shared.metrics import get_or_create_metrics, make_metrics_router  # noqa: E402
from shared.tracing import init_tracer, make_traces_router  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("rag-service")


def _is_in_docker() -> bool:
    """Detect if running inside a Docker container."""
    if os.path.exists("/.dockerenv"):
        return True
    try:
        with open("/proc/1/cgroup", "rt") as f:
            content = f.read()
            return "docker" in content or "kubepods" in content
    except Exception:
        pass
    return False


DATABASE_URL = os.getenv("DATABASE_URL", "")
# Set default OLLAMA_HOST to 'http://localhost:11434' if not in docker
_DEFAULT_OLLAMA_HOST = "http://ollama:11434" if _is_in_docker() else "http://localhost:11434"
OLLAMA_HOST = os.getenv("OLLAMA_HOST", _DEFAULT_OLLAMA_HOST)
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

# ──────────────────────────────────────────────
# Standard Retention Playbooks (Pre-seeded)
# ──────────────────────────────────────────────
STANDARD_PLAYBOOKS: list[dict] = [
    {
        "id": "PB-001",
        "title": "PB-001 Executive Escalation Protocol",
        "triggers": [
            "Account churn probability exceeds 75% in predictive risk model",
            "Key executive sponsor or primary champion departed customer organization",
            "Unresolved high-priority commercial dispute or pending cancellation notice",
            "Executive Business Review (EBR) missed or declined for two consecutive quarters",
        ],
        "action_checklist": [
            "Trigger immediate C-suite escalation and designate executive sponsor within 24 hours",
            "Conduct internal account briefing covering contract ARR, usage trends, and root cause analysis",
            "Deliver high-touch Executive Business Review (EBR) with customer leadership within 5 business days",
            "Formulate tailored value realization roadmap demonstrating measurable business impact",
            "Establish bi-weekly executive checkpoint meetings through contract renewal",
        ],
        "keywords": [
            "mitigation strategy",
            "high churn risk",
            "executive escalation",
            "churn risk",
            "c-level outreach",
            "executive sponsor",
            "retention",
            "ebr",
            "qbr",
            "account recovery",
        ],
        "text": (
            "PB-001 Executive Escalation Protocol is the primary mitigation strategy for high churn risk "
            "enterprise accounts exceeding 75% churn probability or experiencing executive champion departure. "
            "When triggered, the protocol initiates immediate executive sponsor assignment, root cause diagnosis "
            "across product and commercial touchpoints, and delivery of an expedited Executive Business Review (EBR) "
            "within five business days. The executive sponsor partners with customer stakeholders to establish measurable "
            "ROI milestones, resolve high-friction blockers, and secure contract retention commitments."
        ),
        "source": "retention_playbooks",
        "metadata": {
            "playbook_id": "PB-001",
            "category": "executive_retention",
            "severity": "critical",
            "source": "retention_playbooks",
        },
    },
    {
        "id": "PB-002",
        "title": "PB-002 Technical SLA Swarm Protocol",
        "triggers": [
            "Multiple Sev-1/Sev-2 technical incidents or SLA breaches within a rolling 30-day window",
            "Repeated API timeouts, latency spikes, or unmitigated system instability impacting production workflows",
            "Support ticket backlog exceeding 5 unresolved critical issues for enterprise tier",
            "Customer engineering leadership raises formal technical escalation",
        ],
        "action_checklist": [
            "Convene Technical SLA Swarm team comprising Principal Engineer, Solutions Architect, and VP Support within 4 hours",
            "Perform comprehensive root-cause analysis (RCA) and publish formal incident remediation post-mortem within 24 hours",
            "Deploy targeted hotfixes or provision isolated dedicated compute capacity to eliminate latency/timeout bottlenecks",
            "Establish daily engineering standups with customer technical leads until zero Sev-1/2 defects remain",
            "Deliver 30-day SLA stability guarantee with automated observability dashboards and credit relief",
        ],
        "keywords": [
            "mitigation strategy",
            "high churn risk",
            "technical sla",
            "sla breach",
            "technical swarm",
            "api timeout",
            "latency",
            "system outage",
            "engineering escalation",
            "ticket backlog",
            "infrastructure reliability",
            "root cause analysis",
        ],
        "text": (
            "PB-002 Technical SLA Swarm Protocol provides rapid mitigation strategy for high churn risk stemming from "
            "technical performance deficiencies, recurring SLA violations, and API latency timeouts. Upon activation, "
            "an elite cross-functional engineering swarm takes ownership of incident triage, conducts deep-dive root "
            "cause analysis (RCA), and deploys targeted infrastructure remediation. Daily technical standups and dedicated "
            "observability dashboards ensure transparent communication with customer engineering leadership until SLA benchmarks "
            "are completely restored."
        ),
        "source": "retention_playbooks",
        "metadata": {
            "playbook_id": "PB-002",
            "category": "technical_retention",
            "severity": "high",
            "source": "retention_playbooks",
        },
    },
    {
        "id": "PB-003",
        "title": "PB-003 Commercial Restructuring & Contract Realignment",
        "triggers": [
            "Customer requests contract renegotiation, downsell, or cancellation due to budget constraints",
            "Active license seat utilization falls below 50% approaching renewal cycle",
            "Competitor price undercutting or procurement mandate for cost reduction",
            "Consolidation of vendor tools impacting software budget allocation",
        ],
        "action_checklist": [
            "Audit seat utilization and workflow telemetry to identify underutilized product modules",
            "Model flexible commercial alternatives including tiered usage pricing, extended multi-year terms, or payment cadence adjustments",
            "Offer customized renewal concessions (e.g. 10-15% upfront incentive or complimentary premium add-ons) in exchange for multi-year commitment",
            "Collaborate with customer procurement to structure ROI-justified vendor consolidation agreement",
            "Finalize revised MSA amendment preserving ARR retention with structured ramp schedules",
        ],
        "keywords": [
            "commercial restructuring",
            "contract realignment",
            "pricing discount",
            "renewal concessions",
            "seat utilization",
            "downsell mitigation",
            "budget cuts",
            "procurement negotiation",
            "licensing terms",
            "billing flexibility",
        ],
        "text": (
            "PB-003 Commercial Restructuring and Contract Realignment is formulated to combat churn driven by economic "
            "headwinds, budget freezes, and seat underutilization. The playbook empowers account executives and commercial "
            "managers to restructure licensing terms, introduce usage-based elasticity, and provide structured multi-year "
            "renewal incentives. By realigning contract scope to actual customer consumption and providing tailored billing "
            "flexibilities, accounts facing commercial friction are safeguarded against total churn."
        ),
        "source": "retention_playbooks",
        "metadata": {
            "playbook_id": "PB-003",
            "category": "commercial_retention",
            "severity": "medium",
            "source": "retention_playbooks",
        },
    },
    {
        "id": "PB-004",
        "title": "PB-004 Feature Re-adoption & Enablement Sprint",
        "triggers": [
            "Daily Active Users (DAU) or Monthly Active Users (MAU) decline by more than 30% over 60 days",
            "Core platform features and high-value workflows unutilized following initial onboarding",
            "Customer reorganization or key user turnover leading to institutional knowledge loss",
            "Low feature engagement scores recorded across primary department personas",
        ],
        "action_checklist": [
            "Conduct comprehensive product telemetry audit to pinpoint dropped workflows and inactive user cohorts",
            "Design tailored 14-day Feature Re-adoption Sprint with hands-on enablement workshops",
            "Deliver role-based interactive cheat sheets, video walkthroughs, and automated in-app guided tours",
            "Assign dedicated Customer Success Specialist to run weekly coaching clinics with team leads",
            "Track weekly re-activation metrics (WAC) with 30, 60, and 90-day usage milestones",
        ],
        "keywords": [
            "feature re-adoption",
            "enablement sprint",
            "user engagement",
            "product adoption",
            "onboarding",
            "training workshops",
            "telemetry audit",
            "usage drop",
            "dau mau decline",
            "workflow reactivation",
        ],
        "text": (
            "PB-004 Feature Re-adoption & Enablement Sprint addresses retention vulnerabilities caused by lagging product "
            "engagement, underutilized platform features, and user workflow abandonment. Customer Success initiates a targeted "
            "re-enablement program featuring interactive role-based workshops, personalized onboarding refreshes, and "
            "telemetry-guided workflow reactivation. By re-engaging end-users and showcasing immediate productivity gains, "
            "the account builds sustainable operational dependencies that prevent renewal churn."
        ),
        "source": "retention_playbooks",
        "metadata": {
            "playbook_id": "PB-004",
            "category": "adoption_retention",
            "severity": "medium",
            "source": "retention_playbooks",
        },
    },
]


# ──────────────────────────────────────────────
# Deterministic Synthetic Embeddings & Vector Math
# ──────────────────────────────────────────────
def _synthetic_embed(text: str, dimensions: int = 768) -> list[float]:
    """
    Deterministic zero-dependency 768-dimensional synthetic embedding generator.
    Produces semantically aligned unit-normalized vectors using token hashing,
    n-gram projection, domain boosting, and L2 normalization.
    """
    if not text or not text.strip():
        return [0.0] * dimensions

    vec = [0.0] * dimensions
    cleaned = text.lower().strip()

    tokens = re.findall(r"\b[a-zA-Z0-9_\-\./]+\b", cleaned)
    if not tokens:
        tokens = [cleaned]

    # Domain vocabulary weighting for retention and mitigation playbooks
    boost_terms = {
        "churn": 2.5,
        "risk": 2.2,
        "mitigation": 2.5,
        "strategy": 2.0,
        "escalation": 2.0,
        "executive": 2.0,
        "retention": 2.0,
        "technical": 2.0,
        "sla": 2.2,
        "swarm": 2.0,
        "timeout": 1.8,
        "latency": 1.8,
        "commercial": 2.0,
        "restructuring": 2.0,
        "renewal": 1.8,
        "pricing": 1.8,
        "discount": 1.8,
        "adoption": 2.0,
        "onboarding": 1.8,
        "engagement": 1.8,
        "ebr": 2.0,
        "qbr": 2.0,
    }

    # Bigrams for compound phrases
    all_terms = list(tokens)
    for i in range(len(tokens) - 1):
        all_terms.append(f"{tokens[i]}_{tokens[i+1]}")

    for term in all_terms:
        base_weight = 1.0
        for b_term, mult in boost_terms.items():
            if b_term in term:
                base_weight = max(base_weight, mult)

        term_bytes = term.encode("utf-8")
        h1 = int(hashlib.md5(term_bytes).hexdigest(), 16)
        h2 = int(hashlib.sha256(term_bytes).hexdigest(), 16)

        # Distribute energy across dimension slots
        for step in range(8):
            idx = ((h1 >> (step * 8)) ^ (h2 >> (step * 4))) % dimensions
            sign = 1.0 if ((h1 >> step) & 1) else -1.0
            vec[idx] += sign * base_weight

    # Character-level harmonic smoothing
    for i, ch in enumerate(cleaned[:256]):
        code = ord(ch)
        idx1 = (code * 31 + i * 7) % dimensions
        idx2 = (code * 97 + i * 13) % dimensions
        vec[idx1] += math.sin(code + i) * 0.05
        vec[idx2] += math.cos(code + i) * 0.05

    # L2 Unit Normalization
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        return [v / norm for v in vec]
    return vec


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if len(vec_a) != len(vec_b) or not vec_a or not vec_b:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ──────────────────────────────────────────────
# DB Connection Pool
# ──────────────────────────────────────────────
_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=5.0,  # Timeout budget: DB = 5s
        )
    return _pool


# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(title="RAG Retrieval Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


async def _readiness_check():
    if not DATABASE_URL:
        # Zero-database operation mode
        return {"database": "in_memory_playbooks", "degraded": False}
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"database": "connected"}
    except Exception as exc:
        logger.warning(f"Readiness DB check failed (non-fatal): {exc}")
        # Return degraded but don't raise – container stays healthy
        return {"database": "unreachable", "degraded": True}


app.include_router(make_health_router("rag-service", version="1.0.0", readiness_check=_readiness_check))

# Phase 6: Metrics + Tracing
metrics = get_or_create_metrics("rag_service")
tracer = init_tracer("rag-service")
app.include_router(make_metrics_router(metrics))
app.include_router(make_traces_router())

for exc_type, handler in make_exception_handlers("rag-service"):
    app.add_exception_handler(exc_type, handler)


@app.on_event("startup")
async def startup():
    # Pre-seed synthetic embeddings for in-memory playbooks
    for pb in STANDARD_PLAYBOOKS:
        searchable_text = f"{pb['id']} {pb['title']}. {pb['text']} {' '.join(pb['keywords'])} {' '.join(pb['triggers'])}"
        pb["_synthetic_embedding"] = _synthetic_embed(searchable_text, dimensions=768)
        pb["_embedding"] = pb["_synthetic_embedding"]
        try:
            pb["_ollama_embedding"] = await _embed(searchable_text)
        except Exception:
            pb["_ollama_embedding"] = None
    logger.info("Pre-seeded STANDARD_PLAYBOOKS with 768-dim synthetic and Ollama embeddings.")

    if DATABASE_URL:
        try:
            await get_pool()
            logger.info("Database pool initialised successfully.")
        except Exception as exc:
            logger.warning(f"Could not initialise DB pool on startup (will retry on first request): {exc}")


@app.on_event("shutdown")
async def shutdown():
    if _pool:
        await _pool.close()


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────
class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5
    min_score: float = 0.0


class Snippet(BaseModel):
    id: str
    text: str
    score: float
    source: Optional[str] = None


class RetrieveResponse(BaseModel):
    success: bool = True
    query: str
    snippets: list[Snippet]
    latency_ms: float


# ──────────────────────────────────────────────
# Embedding helper
# ──────────────────────────────────────────────
async def _embed(text: str) -> list[float]:
    """Generate an embedding vector via Ollama with retry backoff, falling back to synthetic embedding."""
    try:
        async def _call():
            async with make_ollama_client(OLLAMA_HOST) as client:
                r = await client.post("/api/embeddings", json={"model": EMBED_MODEL, "prompt": text}, timeout=3.0)
                r.raise_for_status()
                return r.json()["embedding"]

        return await retry_with_backoff(
            _call,
            max_attempts=2,
            base_delay=0.3,
            retryable_exceptions=(httpx.TimeoutException, httpx.ConnectError),
        )
    except Exception as exc:
        logger.info(f"Ollama embedding unavailable or offline ({exc}), using deterministic 768-dim synthetic embedding.")
        return _synthetic_embed(text, dimensions=768)


def _retrieve_in_memory_playbooks(query_text: str, query_vec: Optional[list[float]] = None, top_k: int = 5, min_score: float = 0.0) -> list[Snippet]:
    """Retrieve top-k standard playbooks via in-memory cosine similarity."""
    synthetic_query_vec = _synthetic_embed(query_text, dimensions=768)
    scored: list[tuple[float, Snippet]] = []
    for pb in STANDARD_PLAYBOOKS:
        if not pb.get("_synthetic_embedding"):
            searchable_text = f"{pb['id']} {pb['title']}. {pb['text']} {' '.join(pb['keywords'])} {' '.join(pb['triggers'])}"
            pb["_synthetic_embedding"] = _synthetic_embed(searchable_text, dimensions=768)
            pb["_embedding"] = pb["_synthetic_embedding"]

        score_synthetic = _cosine_similarity(synthetic_query_vec, pb["_synthetic_embedding"])
        score_ollama = 0.0
        if query_vec and pb.get("_ollama_embedding"):
            score_ollama = _cosine_similarity(query_vec, pb["_ollama_embedding"])

        score = max(score_synthetic, score_ollama)
        if score >= min_score:
            scored.append((
                score,
                Snippet(
                    id=pb["id"],
                    text=pb["text"],
                    score=round(float(score), 4),
                    source=pb.get("source", "retention_playbooks"),
                ),
            ))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:top_k]]


# ──────────────────────────────────────────────
# Cache helpers
# ──────────────────────────────────────────────
async def _check_embedding_cache(query_vec: list[float]) -> Optional[list[Snippet]]:
    """Check for similar queries in the embedding cache (cosine similarity >= 0.90)."""
    start = time.monotonic()
    try:
        vec_literal = f"[{','.join(str(v) for v in query_vec)}]"
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT retrieved_context, id
                FROM embedding_cache
                WHERE 1 - (embedding_vector <=> $1::vector) >= 0.90
                AND last_used_at >= NOW() - INTERVAL '24 hours'
                ORDER BY embedding_vector <=> $1::vector
                LIMIT 1
                """,
                vec_literal,
            )
            if row:
                await conn.execute(
                    "UPDATE embedding_cache SET usage_count = usage_count + 1, last_used_at = NOW() WHERE id = $1",
                    row["id"],
                )
                metrics.cache_hit_total.inc(cache_type="embedding")
                metrics.cache_latency_seconds.observe(time.monotonic() - start, cache_type="embedding")
                cached_data = json.loads(row["retrieved_context"])
                return [Snippet(**s) for s in cached_data]
    except Exception as exc:
        logger.debug(f"Cache lookup skipped or failed: {exc}")

    metrics.cache_miss_total.inc(cache_type="embedding")
    return None


async def _store_embedding_cache(query_text: str, query_vec: list[float], snippets: list[Snippet]):
    """Store the retrieval result in the embedding cache."""
    try:
        vec_literal = f"[{','.join(str(v) for v in query_vec)}]"
        snippets_json = json.dumps([s.dict() for s in snippets])
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO embedding_cache (query_text, embedding_vector, retrieved_context)
                VALUES ($1, $2::vector, $3)
                """,
                query_text,
                vec_literal,
                snippets_json,
            )
    except Exception as exc:
        logger.debug(f"Cache storage skipped: {exc}")


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.post("/api/v1/retrieve", response_model=RetrieveResponse)
async def retrieve(req: RetrieveRequest):
    start = time.monotonic()
    with tracer.start_as_current_span("rag.retrieve", attributes={"query_len": len(req.query), "top_k": req.top_k}) as root_span:
        try:
            with tracer.start_as_current_span("rag.embed_query", attributes={"model": EMBED_MODEL}):
                query_vec = await _embed(req.query)
        except Exception as exc:
            logger.warning(f"Embedding error ({exc}), falling back to synthetic embedding.")
            query_vec = _synthetic_embed(req.query, dimensions=768)

        snippets: list[Snippet] = []

        # Zero-database operation fallback
        if not DATABASE_URL:
            snippets = _retrieve_in_memory_playbooks(req.query, query_vec=query_vec, top_k=req.top_k, min_score=req.min_score)
        else:
            # Semantic Cache Check
            try:
                cached_snippets = await _check_embedding_cache(query_vec)
                if cached_snippets:
                    latency_ms = round((time.monotonic() - start) * 1000, 1)
                    return RetrieveResponse(query=req.query, snippets=cached_snippets, latency_ms=latency_ms)
            except Exception as cache_err:
                logger.debug(f"Cache check skipped: {cache_err}")

            vec_literal = f"[{','.join(str(v) for v in query_vec)}]"

            try:
                with tracer.start_as_current_span("rag.pgvector_query") as db_span:
                    pool = await get_pool()
                    async with pool.acquire() as conn:
                        rows = await conn.fetch(
                            """
                            SELECT id::text, content, metadata,
                                   1 - (embedding <=> $1::vector) AS score
                            FROM documents
                            WHERE 1 - (embedding <=> $1::vector) >= $2
                            ORDER BY embedding <=> $1::vector
                            LIMIT $3
                            """,
                            vec_literal,
                            req.min_score,
                            req.top_k,
                        )
                    db_span.set_attribute("rows_returned", len(rows))

                snippets = [
                    Snippet(
                        id=row["id"],
                        text=row["content"],
                        score=round(float(row["score"]), 4),
                        source=row["metadata"].get("source") if row["metadata"] else None,
                    )
                    for row in rows
                ]
            except Exception as exc:
                logger.warning(f"DB query failed ({exc}), falling back to in-memory cosine similarity.")
                snippets = _retrieve_in_memory_playbooks(req.query, query_vec=query_vec, top_k=req.top_k, min_score=req.min_score)

            # If DB returned 0 results, fall back to in-memory playbooks
            if not snippets:
                snippets = _retrieve_in_memory_playbooks(req.query, query_vec=query_vec, top_k=req.top_k, min_score=req.min_score)

            # Store in cache if DB available
            if snippets:
                try:
                    await _store_embedding_cache(req.query, query_vec, snippets)
                except Exception as c_store_err:
                    logger.debug(f"Cache write skipped: {c_store_err}")

        latency_s = time.monotonic() - start
        latency_ms = round(latency_s * 1000, 1)
        metrics.rag_retrieval_latency.observe(latency_s, query_type="semantic")
        root_span.set_attribute("latency_ms", latency_ms)
        root_span.set_attribute("snippet_count", len(snippets))

        if latency_ms > 3000:
            logger.warning(f"[rag-service] Retrieval slow: {latency_ms}ms")

        return RetrieveResponse(query=req.query, snippets=snippets, latency_ms=latency_ms)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
