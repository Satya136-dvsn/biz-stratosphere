# GitHub Actions Setup

## Required Secrets

To make CI/CD workflows pass, you need to add these secrets in GitHub:

**GitHub → Your Repo → Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets

```
VITE_SUPABASE_URL
Value: https://kfkllxfwyvocmnkowbyw.supabase.co

VITE_SUPABASE_ANON_KEY  
Value: Your Supabase anon key (from Supabase dashboard)

VITE_GEMINI_API_KEY
Value: Your NEW Gemini API key (the one you just generated)
```

### Optional (for Vercel deployment)

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

---

## Current Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:** Push to main/develop, Pull requests  
**What it does:**

- ✅ Install dependencies
- ✅ Lint code (if configured)
- ✅ Build project
- ⏸️ Tests (disabled until E2E suite fully configured)

### 2. Deploy Workflow (`deploy-production.yml`)

**Triggers:** Push to main, Manual trigger  
**What it does:**

- ✅ Install dependencies
- ✅ Build with production env vars
- ⏸️ Deploy (commented out - configure for your host)

---

## How to Add Secrets

1. Go to GitHub repository
2. Click **Settings**
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://kfkllxfwyvocmnkowbyw.supabase.co`
   - Click **Add secret**
6. Repeat for other secrets

---

## Testing Locally

```bash
# Test build with your local .env
npm run build

# Should work without errors
```

---

## Troubleshooting

**Build fails with "Missing environment variables":**

- Add all required secrets to GitHub Actions

**Deploy workflow fails:**

- Check if Vercel secrets are configured
- Or comment out Vercel deployment step

**Tests fail:**

- Tests are currently disabled in CI
- Will enable once Playwright E2E suite is fully set up

---

## Next Steps

1. ✅ Add secrets to GitHub Actions
2. ✅ Push changes to trigger CI
3. ✅ Verify workflows pass
4. Optional: Set up Vercel/Netlify deployment

**After adding secrets, workflows should pass! ✅**
