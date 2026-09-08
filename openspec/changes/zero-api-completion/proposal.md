## Why

The project is an enterprise business intelligence and AI analytics platform that currently requires external cloud services (Supabase, Google Gemini API, live backend microservices), causing runtime crashes and network failures when run in an isolated or offline environment. Furthermore, previous edits had temporarily downgraded `App.tsx` into a minimal stub. This change restores the complete 30+ page application architecture and adds a 100% Zero-API / Standalone Mode so all features function reliably with zero external API dependencies.

## What Changes

- Restore full application routing in `src/App.tsx` and `src/main.tsx` for all 36 pages (Dashboard, Advanced Charts, Reports, ML Predictions, AI Chat, Automation Rules, Decision Memory, Admin Suite, Workspaces, Settings).
- Add an in-memory/LocalStorage client-side data store (`src/lib/localDatabase.ts`) providing full CRUD and rich seed datasets for offline operation.
- Update `src/integrations/supabase/client.ts` to seamlessly fall back to the local data store when Supabase credentials are missing or unreachable, eliminating fatal startup errors.
- Update `src/hooks/useAuth.ts` and `src/pages/Auth.tsx` to provide instant Demo Login with full admin permissions in Zero-API mode.
- Update `src/lib/ai/orchestrator.ts` and `src/hooks/useEmbeddings.ts` to provide an offline deterministic business intelligence assistant and synthetic embedding generation for local RAG queries.
- Update `src/hooks/useMLPredictions.ts` and `src/components/dashboard/MLInsights.tsx` to use local client-side prediction scoring and SHAP explanations when the backend service is offline.
- Fix test execution hang in `src/pages/admin/__tests__/UserManagement.test.tsx` by properly mocking Radix UI Dialog/Tooltip primitives in JSDOM.

## Capabilities

### New Capabilities
- `zero-api-mode`: Client-side standalone execution mode enabling full application functionality without external cloud APIs or backend daemons.
- `local-data-store`: Reactive in-memory and LocalStorage persistence layer for mock Supabase PostgREST tables.
- `offline-ai-rag`: Deterministic offline business intelligence assistant and local semantic retrieval engine.

### Modified Capabilities
<!-- No prior formal OpenSpec capabilities existed in this project -->

## Impact

- Frontend: `src/App.tsx`, `src/main.tsx`, `src/integrations/supabase/client.ts`, `src/lib/localDatabase.ts`, `src/lib/ai/orchestrator.ts`, `src/hooks/useAuth.ts`, `src/hooks/useMLPredictions.ts`, `src/hooks/useEmbeddings.ts`, `src/pages/Auth.tsx`, `src/pages/admin/__tests__/UserManagement.test.tsx`.
- APIs & Dependencies: Zero external API calls required for demo and offline use cases; existing cloud integrations remain optional when configured.
