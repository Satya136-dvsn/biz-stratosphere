# 🔒 SECURITY REMINDER - API Keys & Sensitive Data

## ⚠️ CRITICAL: Never Commit Sensitive Data

### What to NEVER commit to Git

- ❌ `.env` files (API keys, secrets, passwords)
- ❌ `.env.local`, `.env.production`
- ❌ `config.local.js` or similar
- ❌ API keys in source code
- ❌ Database credentials
- ❌ Private keys (`.pem`, `.key`)
- ❌ Certificates
- ❌ OAuth tokens
- ❌ Password files

### ✅ What IS safe to commit

- ✅ `.env.example` (template without real values)
- ✅ Documentation about what env vars are needed
- ✅ Public configuration files

---

## 🛡️ Current Protection Status

### Verified Safe

1. ✅ `.env` is in `.gitignore`
2. ✅ `.env.local` is in `.gitignore`
3. ✅ No `.env` files in git history
4. ✅ API keys are local only

---

## 📋 Environment Variables Needed

Create a `.env.local` file with:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Services
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: If using OpenAI
# VITE_OPENAI_API_KEY=your_openai_key_here
```

For Supabase Edge Functions (in Supabase dashboard → Edge Functions → Secrets):

```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🔧 How to Get API Keys

### Gemini API Key (FREE)

1. Go to: <https://aistudio.google.com/app/apikey>
2. Click "Get API Key"
3. Copy the key (starts with `AIzaSy...`)

### Supabase

1. Go to: <https://supabase.com/dashboard>
2. Select your project
3. Settings → API
4. Copy URL and anon key

---

## 🚨 If You Accidentally Committed Secrets

### Immediate Actions

1. **Revoke the exposed keys immediately!**
2. Generate new keys
3. Remove from git history:

   ```bash
   # Remove .env from git history
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (DANGER - coordinate with team first!)
   git push origin --force --all
   ```

### Better Approach

1. Revoke old keys
2. Generate new keys
3. Update `.env.local` (never committed)
4. Verify `.gitignore` includes `.env*`

---

## ✅ Best Practices

### 1. Use Environment Variables

```typescript
// ✅ GOOD
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ❌ BAD
const apiKey = "AIzaSy123abc..."; // Never hardcode!
```

### 2. Use .env.example

Create `.env.example` as a template:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
```

### 3. Check Before Commit

```bash
# Always check what you're committing
git status
git diff

# Look for sensitive patterns
git diff | grep -i "api_key\|password\|secret"
```

### 4. Use Git Hooks (Optional)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
if git diff --cached --name-only | grep -q "\.env$"; then
  echo "Error: Attempting to commit .env file!"
  exit 1
fi
```

---

## 📝 Checklist Before Every Commit

- [ ] Check `git status` - no `.env` files?
- [ ] Check `git diff` - no API keys visible?
- [ ] All sensitive data in `.env.local`?
- [ ] `.gitignore` updated?
- [ ] `.env.example` has placeholders only?

---

## 🎯 Repository Status

**Current:** ✅ SECURE

- `.env` files properly ignored
- No sensitive data in commits
- Example files provided

**Remember:** ALWAYS double-check before pushing! 🔒
