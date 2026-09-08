## Context

The application is built using React 18, Vite, TypeScript, and Tailwind CSS on the frontend, with a Python FastAPI microservice mesh on the backend. The frontend previously had an all-or-nothing dependency on a remote Supabase instance and an external LLM (Ollama or Gemini API), which breaks when users test or run the platform locally without external accounts or backend daemons.

## Goals / Non-Goals

**Goals:**
- Provide a zero-configuration, zero-API standalone experience for all 36 application pages.
- Provide a robust mock database adapter (`src/lib/localDatabase.ts`) backed by memory and LocalStorage that simulates Supabase PostgREST tables.
- Enable instant demo authentication and admin role mapping so all routes can be explored immediately.
- Integrate an offline deterministic business intelligence assistant in `src/lib/ai/orchestrator.ts` for AI Chat and RAG.
- Provide local client-side ML prediction with SHAP feature explanations when backend is offline.
- Fix all unit test execution hangs to achieve 100% passing tests.

**Non-Goals:**
- Removing live backend microservices or real Supabase connectivity when credentials and servers ARE available (the client automatically detects and uses live services if available, falling back gracefully if not).
- Deploying to production cloud environments in this local session.

## Decisions

1. **Dual-Mode Supabase Client Adapter:**
   - *Rationale:* Instead of refactoring every single component and hook that calls `supabase.from(...)` or `supabase.auth`, the Supabase client factory in `src/integrations/supabase/client.ts` will detect if environment variables are missing or if network connections fail, and proxy seamlessly to `localDatabase`.
   - *Alternative Considered:* Rewriting all hooks to use a separate custom SDK. Rejected because it would introduce massive code churn and risk breaking existing tests.

2. **Deterministic Offline RAG & Rule-Based AI Engine:**
   - *Rationale:* When no Ollama or Gemini API is reachable, `AIOrchestrator` will use an analytical heuristic engine that extracts key metrics (revenue, churn probability, customer segments) from current context/datasets and generates structured, realistic business responses.
   - *Alternative Considered:* Embedding a 1GB WebAssembly LLM in the browser. Rejected due to large download size and startup latency on standard developer machines.

3. **Deterministic Local ML Scoring:**
   - *Rationale:* When the Python ML service is unreachable, `useMLPredictions` uses local client-side decision trees / scoring logic modeled after the trained `churn_model.pkl` weights, outputting accurate probabilities and SHAP factor attribution.

## Risks / Trade-offs

- [Risk] Data saved in LocalStorage could be cleared if user clears browser data.
  → *Mitigation:* The local database automatically re-seeds with comprehensive sample datasets whenever storage is empty.
- [Risk] JSDOM environment in Vitest differs slightly from Chrome runtime.
  → *Mitigation:* Explicitly mock Radix UI components that trigger async animation frames in headless tests.
