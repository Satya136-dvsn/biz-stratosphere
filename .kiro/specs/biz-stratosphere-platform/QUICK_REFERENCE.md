# Biz Stratosphere 2.0 - Quick Reference Card

## 🚀 Getting Started (5 Minutes)

```bash
# 1. Clone and install
git clone <repo-url>
cd biz-stratosphere
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Start Supabase locally (optional)
npx supabase start

# 4. Run migrations
npx supabase db reset

# 5. Start dev server
npm run dev
```

**Default URL:** http://localhost:3000  
**Mock Mode:** OpenAI queries use mock responses (no API key needed)

---

## 📁 Project Structure

```
biz-stratosphere/
├── src/
│   ├── app/              # Next.js pages (App Router)
│   ├── components/       # React components
│   │   ├── layout/      # Layout components
│   │   ├── ui/          # Shadcn UI components
│   │   └── features/    # Feature-specific components
│   ├── lib/             # Utilities and clients
│   │   ├── supabaseClient.ts
│   │   ├── logger.ts
│   │   └── mocks/       # Mock services
│   └── middleware/      # API middleware
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge Functions
├── .github/workflows/   # CI/CD pipelines
└── tests/              # Test files
```

---

## 🔑 Key File Size Limits

| Limit | Value | Behavior |
|-------|-------|----------|
| Max file size | 100 MB | Hard reject with error message |
| Streaming threshold | 20 MB | Files >20 MB use streaming |
| Max rows | 1 million | Reject with clear error |
| Storage per workspace | 100 GB | Configurable quota |

---

## 🎯 API Endpoints Quick Reference

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Datasets
- `POST /api/datasets/upload` - Upload CSV/Excel
- `GET /api/datasets` - List datasets
- `GET /api/datasets/:id` - Get dataset details
- `DELETE /api/datasets/:id` - Soft delete dataset

### AI Queries
- `POST /api/ai/query` - Natural language query
- `POST /api/ai/chat` - Chatbot conversation
- `POST /api/ai/explain` - Get SHAP explanations

### Dashboards
- `GET /api/dashboards/:datasetId` - Get dashboard data
- `POST /api/dashboards/:datasetId/export` - Export to PDF

### Automation
- `POST /api/automation/rules` - Create rule
- `GET /api/automation/rules` - List rules
- `GET /api/automation/alerts` - Get alert history

### Health & Monitoring
- `GET /api/health` - Health check
- `GET /api/openapi.json` - OpenAPI spec
- `GET /api/docs` - Swagger UI

---

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- path/to/test.ts

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run accessibility tests
npm run test:a11y
```

---

## 🔒 Rate Limits

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `/api/ai/query` | 100 req/min | Per user |
| `/api/ai/chat` | 100 req/min | Per user |
| `/api/models/predict` | 1000 req/day | Per workspace |
| Dataset uploads | 10 per day | Per user |
| All other APIs | 1000 req/hour | Per user |

**Rate limit headers:**
- `X-RateLimit-Limit` - Total allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

---

## 🐛 Debugging

### Enable Debug Logs
```bash
# In .env.local
ENABLE_DEBUG_LOGS=true
```

### View Logs
```bash
# Application logs
npm run logs

# Supabase logs
npx supabase functions logs etl-processor

# Database logs
npx supabase db logs
```

### Common Issues

**Issue:** "Database connection failed"  
**Fix:** Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

**Issue:** "Rate limit exceeded"  
**Fix:** Wait for rate limit reset or increase limits in Redis config

**Issue:** "OpenAI API error"  
**Fix:** Ensure `USE_MOCK_OPENAI=true` for local dev, or check API key

**Issue:** "File upload fails"  
**Fix:** Check file size (<100 MB) and format (CSV/XLSX only)

---

## 📊 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | <2s | Lighthouse |
| API response (non-AI) | <500ms | p95 latency |
| AI query response | <8s | p95 latency |
| Dashboard render | <2s | First contentful paint |
| ETL processing | 10k rows/sec | Staging tests |

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] All secrets in environment variables (not hardcoded)
- [ ] RLS policies tested and enforced
- [ ] Rate limiting active on all AI endpoints
- [ ] HTTPS enforced (HSTS enabled)
- [ ] CORS configured correctly
- [ ] Input validation on all API routes
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized inputs)
- [ ] Secrets scanning passed in CI
- [ ] Accessibility tests passed (90+ score)

---

## 📞 Support & Resources

- **Documentation:** `/docs` folder
- **API Docs:** http://localhost:3000/api/docs (Swagger UI)
- **Supabase Dashboard:** https://app.supabase.com
- **Sentry Dashboard:** https://sentry.io
- **OpenAI Usage:** https://platform.openai.com/usage

---

## 🎨 Design System

**Colors:**
- Primary: Deep Blue (#1E40AF)
- Secondary: Violet (#7C3AED)
- Gradient: `bg-gradient-to-r from-blue-600 to-violet-600`

**Typography:**
- Font: Inter (system font stack)
- Headings: font-bold
- Body: font-normal

**Components:**
- Use Shadcn UI components from `src/components/ui/`
- Follow Tailwind CSS utility-first approach
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

---

## 🚢 Deployment

### Staging
```bash
git push origin develop
# Auto-deploys to staging.bizstratosphere.com
```

### Production
```bash
git push origin main
# Triggers deployment workflow
# Runs smoke tests before traffic routing
```

### Rollback
```bash
# Via Vercel dashboard or CLI
vercel rollback <deployment-url>
```

---

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add feature description"

# Push and create PR
git push origin feature/your-feature-name

# After PR approval, merge to develop
# Staging auto-deploys

# After staging validation, merge to main
# Production deploys after smoke tests pass
```

**Commit Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `chore:` Maintenance

---

## 💡 Pro Tips

1. **Use mock mode locally** - Set `USE_MOCK_OPENAI=true` to avoid API costs
2. **Check health endpoint** - `/api/health` shows system status
3. **Monitor Sentry** - Errors auto-report to Sentry dashboard
4. **Use TypeScript** - Leverage type safety for fewer bugs
5. **Test RLS policies** - Run `npm run test:rls` before deploying
6. **Cache aggressively** - 5-min TTL on dashboards and AI queries
7. **Stream large files** - Files >20 MB automatically use streaming
8. **Check quotas** - View usage in workspace settings

---

**Last Updated:** [Date]  
**Version:** 1.0.0  
**Maintainer:** [Team Name]
