# Sprint 1: Foundation & Safety (MVP Bootstrap)

**Goal:** Bootstrap repo, auth, infrastructure, CI, observability, and safe local development

**Duration:** 4-10 dev days  
**Priority:** P0 (Must-Have for MVP)  
**Team:** Full-stack developer(s)

---

## Sprint 1 Tasks

### 1. Repo + Next.js Skeleton
**Owner:** [Assign]  
**Estimate:** 2 hours  
**Priority:** Blocker

- [ ] Create Next.js 14+ project with App Router
- [ ] Configure TypeScript with strict mode enabled
- [ ] Set up src/ folder structure (app, components, lib)
- [ ] Install Tailwind CSS and PostCSS
- [ ] Install and configure Shadcn UI components
- [ ] Create basic layout page

**DoD:** `npm run dev` shows basic layout page; TypeScript build passes without errors

---

### 2. ESLint/Prettier/Husky
**Owner:** [Assign]  
**Estimate:** 1 hour  
**Priority:** High

- [ ] Configure ESLint with Next.js and TypeScript rules
- [ ] Configure Prettier with consistent formatting
- [ ] Add Husky pre-commit hook for lint + format
- [ ] Add lint-staged for faster pre-commit checks

**DoD:** Commit blocked when lint fails locally; all files auto-format on commit

---

### 3. Supabase Project & Client
**Owner:** [Assign]  
**Estimate:** 3 hours  
**Priority:** Blocker  
**Dependency:** Task 1

- [ ] Create Supabase staging project
- [ ] Obtain API keys and project URL
- [ ] Create `.env.example` with all required placeholders
- [ ] Add `src/lib/supabaseClient.ts` with client initialization
- [ ] Create auth middleware `src/middleware.ts`
- [ ] Create `/api/health` endpoint with DB connectivity check

**DoD:** App can hit `/api/health` and return `{ status: "healthy", db: "ok" }` against staging DB

---

### 4. Initial DB Migrations
**Owner:** [Assign]  
**Estimate:** 2 hours  
**Priority:** Blocker  
**Dependency:** Task 3

- [ ] Enable uuid-ossp extension
- [ ] Create `workspaces` table migration with RLS policies
- [ ] Create `workspace_members` table with role enum
- [ ] Create `audit_logs` table
- [ ] Add updated_at triggers
- [ ] Test migrations with `supabase db reset`

**DoD:** `supabase db reset` applies migrations successfully; all tables exist with correct schema

---

### 5. Auth API & UI (Basic)
**Owner:** [Assign]  
**Estimate:** 4 hours  
**Priority:** Blocker  
**Dependency:** Task 4

- [ ] Implement `/api/auth/signup` route (proxy to Supabase Auth)
- [ ] Implement `/api/auth/login` route
- [ ] Implement `/api/auth/logout` route
- [ ] Build minimal login page (`/app/login/page.tsx`)
- [ ] Build minimal signup page (`/app/signup/page.tsx`)
- [ ] Add client-side Zod validation for forms
- [ ] Add JWT token validation in middleware

**DoD:** User can sign up, log in, and access protected route; JWT session validated correctly

---

### 6. CI Pipeline (GitHub Actions)
**Owner:** [Assign]  
**Estimate:** 3 hours  
**Priority:** High  
**Dependency:** Task 2

- [ ] Create `.github/workflows/ci.yml`
- [ ] Add lint step (ESLint)
- [ ] Add type checking step (tsc --noEmit)
- [ ] Add unit test runner (Jest)
- [ ] Add secrets scanning step (detect leaked keys)
- [ ] Create `.github/workflows/deploy.yml` stub for Vercel

**DoD:** PR triggers CI; failed lint/typecheck/tests cause CI failure; secrets scan runs

---

### 7. Sentry + Health Check + Logger
**Owner:** [Assign]  
**Estimate:** 2 hours  
**Priority:** High  
**Dependency:** Task 3

- [ ] Install and configure Sentry SDK
- [ ] Add Sentry initialization (staging toggled by env)
- [ ] Enhance `/api/health` with detailed checks (DB, Redis)
- [ ] Create `src/lib/logger.ts` with structured logging
- [ ] Add error boundaries in React components
- [ ] Test Sentry with intentional error

**DoD:** Sentry records test error in staging; health endpoint returns detailed status; logger outputs structured JSON

---

### 8. Mock OpenAI + Local Dev
**Owner:** [Assign]  
**Estimate:** 2 hours  
**Priority:** High

- [ ] Create `src/lib/mocks/openai.ts` with mock responses
- [ ] Add environment variable to toggle mock mode
- [ ] Wire mock service into AI query routes
- [ ] Add realistic mock responses for common queries
- [ ] Document mock mode in README

**DoD:** Developers can run AI queries locally without real OpenAI keys; mock returns realistic responses

---

### 9. Rate Limiting Middleware (Basic)
**Owner:** [Assign]  
**Estimate:** 3 hours  
**Priority:** High  
**Dependency:** Task 3

- [ ] Set up Upstash Redis account
- [ ] Add Redis credentials to `.env.example`
- [ ] Create `src/middleware/rateLimit.ts`
- [ ] Implement per-user rate limiting (100 req/min)
- [ ] Add rate limit headers to responses
- [ ] Apply middleware to `/api/ai/*` routes
- [ ] Add 429 error response with retry-after

**DoD:** Middleware returns 429 when limit exceeded; rate limit headers present; tested with load script

---

### 10. README + Onboarding
**Owner:** [Assign]  
**Estimate:** 2 hours  
**Priority:** High  
**Dependency:** All above

- [ ] Document local setup steps
- [ ] List all required environment variables
- [ ] Document how to run migrations
- [ ] Document how to run tests
- [ ] Add troubleshooting section
- [ ] Document mock OpenAI mode
- [ ] Add architecture diagram

**DoD:** New developer follows README and successfully spins up app with mock OpenAI in <30 minutes

---

## Sprint 1 Success Criteria

✅ **Local Development:** Any developer can clone repo and run locally with mock services  
✅ **CI/CD:** GitHub Actions runs on every PR and catches issues  
✅ **Authentication:** Users can sign up and log in  
✅ **Database:** Migrations apply cleanly and RLS policies exist  
✅ **Observability:** Sentry captures errors, health checks work  
✅ **Security:** Rate limiting functional, secrets scanning in CI  
✅ **Documentation:** README enables new developer onboarding

---

## Environment Variables Required (Sprint 1)

Create `.env.local` with these values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry (optional for local)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Upstash Redis
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# OpenAI (not needed for local with mock mode)
OPENAI_API_KEY=sk-... # Only for staging/production

# Feature Flags
USE_MOCK_OPENAI=true # Set to false in production
NODE_ENV=development
```

---

## Post-Sprint 1 Smoke Test Checklist

Run these tests before considering Sprint 1 complete:

- [ ] `npm run dev` starts without errors
- [ ] Navigate to `/login` and sign up new user
- [ ] Log in with created user
- [ ] Access protected route (should work)
- [ ] Log out and try to access protected route (should redirect)
- [ ] Hit `/api/health` - returns `{ status: "healthy", db: "ok" }`
- [ ] Trigger intentional error - appears in Sentry
- [ ] Make 101 requests to AI endpoint - 101st returns 429
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - builds successfully
- [ ] Push to GitHub - CI runs and passes

---

## Notes

- **Blockers:** Tasks marked "Blocker" must be completed before dependent tasks
- **Estimates:** Adjust based on team experience and familiarity with stack
- **Parallel Work:** Tasks 2, 7, 8 can be done in parallel with main flow
- **Testing:** Add unit tests as you build each component
- **Documentation:** Update README as you complete each task

---

## Next Sprint Preview

**Sprint 2** will focus on:
- Workspace management system
- File upload infrastructure
- Dataset storage and validation
- OpenAPI specification generation

This builds on the solid foundation from Sprint 1.
