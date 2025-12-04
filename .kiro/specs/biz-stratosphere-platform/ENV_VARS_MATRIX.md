# Environment Variables Matrix

## Overview
This document lists all required environment variables for each environment (local, staging, production) and their required scopes.

## Local Development

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-local-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry (Optional - can be disabled)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Upstash Redis (Optional - can use in-memory fallback)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# OpenAI (Not needed - mock mode enabled)
OPENAI_API_KEY=
USE_MOCK_OPENAI=true

# Feature Flags
NODE_ENV=development
ENABLE_DEBUG_LOGS=true
```

## Staging Environment

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-role-key

# Sentry (Required)
NEXT_PUBLIC_SENTRY_DSN=https://your-staging-dsn@sentry.io/project
SENTRY_AUTH_TOKEN=staging-auth-token
SENTRY_ENVIRONMENT=staging

# Upstash Redis (Required)
UPSTASH_REDIS_REST_URL=https://staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=staging-token

# OpenAI (Required - use separate key from production)
OPENAI_API_KEY=sk-staging-key
USE_MOCK_OPENAI=false
OPENAI_COST_ALERT_THRESHOLD_DAILY=50
OPENAI_COST_ALERT_THRESHOLD_MONTHLY=1000

# Email Service (Required for alerts)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=staging-sendgrid-key
FROM_EMAIL=noreply-staging@bizstratosphere.com

# Slack (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/staging-webhook

# Feature Flags
NODE_ENV=production
ENABLE_DEBUG_LOGS=true
ENABLE_PERFORMANCE_MONITORING=true
```

## Production Environment

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key

# Sentry (Required)
NEXT_PUBLIC_SENTRY_DSN=https://your-prod-dsn@sentry.io/project
SENTRY_AUTH_TOKEN=prod-auth-token
SENTRY_ENVIRONMENT=production

# Upstash Redis (Required)
UPSTASH_REDIS_REST_URL=https://prod-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=prod-token

# OpenAI (Required - production key with higher limits)
OPENAI_API_KEY=sk-prod-key
USE_MOCK_OPENAI=false
OPENAI_COST_ALERT_THRESHOLD_DAILY=200
OPENAI_COST_ALERT_THRESHOLD_MONTHLY=5000

# Email Service (Required)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=prod-sendgrid-key
FROM_EMAIL=noreply@bizstratosphere.com

# Slack (Required for production alerts)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/prod-webhook

# Feature Flags
NODE_ENV=production
ENABLE_DEBUG_LOGS=false
ENABLE_PERFORMANCE_MONITORING=true

# Security
ALLOWED_ORIGINS=https://bizstratosphere.com,https://www.bizstratosphere.com
RATE_LIMIT_ENABLED=true
```

## Required Scopes by Service

### Supabase
- **Anon Key:** Public client access (read-only with RLS)
- **Service Role Key:** Server-side operations, bypasses RLS (keep secret!)
- **Required Permissions:** Database access, Storage access, Auth management

### OpenAI
- **API Key Scopes:** GPT-4 access, Embeddings API access
- **Rate Limits:** Tier 3+ recommended for production
- **Cost Monitoring:** Set up billing alerts in OpenAI dashboard

### Upstash Redis
- **REST API Access:** Required for rate limiting
- **Recommended Plan:** Pay-as-you-go or Pro for production
- **Max Connections:** Configure based on expected traffic

### Sentry
- **DSN:** Public key for error reporting
- **Auth Token:** For source map uploads and releases
- **Required Features:** Error tracking, Performance monitoring

### SendGrid (Email)
- **API Key Scopes:** Mail Send permission
- **Sender Authentication:** Verify domain for production
- **Templates:** Create templates for alerts and notifications

### Slack
- **Webhook URL:** Incoming webhook for channel notifications
- **Permissions:** Post messages to designated channel

## Secret Rotation Schedule

| Secret | Rotation Frequency | Owner | Last Rotated |
|--------|-------------------|-------|--------------|
| Supabase Service Role Key | 90 days | DevOps | - |
| OpenAI API Key | 90 days | Backend Lead | - |
| Upstash Redis Token | 90 days | DevOps | - |
| Sentry Auth Token | 180 days | DevOps | - |
| SendGrid API Key | 90 days | Backend Lead | - |
| Slack Webhook URL | As needed | DevOps | - |

## Validation Script

Add this to your CI pipeline to validate environment variables:

```typescript
// scripts/validate-env.ts
const requiredEnvVars = {
  local: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  staging: ['NEXT_PUBLIC_SUPABASE_URL', 'OPENAI_API_KEY', 'UPSTASH_REDIS_REST_URL'],
  production: ['NEXT_PUBLIC_SUPABASE_URL', 'OPENAI_API_KEY', 'UPSTASH_REDIS_REST_URL', 'SENTRY_DSN']
};

function validateEnv(environment: string) {
  const required = requiredEnvVars[environment] || [];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables for ${environment}:`, missing);
    process.exit(1);
  }
  
  console.log(`✅ All required environment variables present for ${environment}`);
}
```

## Security Notes

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use Vercel/GitHub Secrets** - Store production secrets securely
3. **Rotate keys regularly** - Follow the rotation schedule above
4. **Audit access** - Review who has access to production secrets quarterly
5. **Use different keys per environment** - Never reuse production keys in staging
