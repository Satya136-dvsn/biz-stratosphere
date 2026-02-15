# Production Readiness Checklist

## 1. Security Verification

- [ ] **Secrets Management**: All API keys/DB passwords moved to Environment Variables (or Vault).
- [ ] **Headers**: `Strict-Transport-Security`, `Content-Security-Policy`, and `X-Frame-Options` configured.
- [ ] **Database**: RLS enabled on **ALL** tables. No public table access.
- [ ] **API**: Rate limiting active on all public endpoints.
- [ ] **Dependencies**: `npm audit` and `pip-audit` run with 0 critical vulnerabilities.

## 2. Database & Data

- [ ] **Backups**: PITR (Point-in-Time Recovery) enabled in Supabase.
- [ ] **Indexes**: Validated `EXPLAIN ANALYZE` for all Dashboard queries.
- [ ] **Encryption**: `pgsodium` enabled for PII columns.
- [ ] **Migrations**: All schema changes applied via CI/CD, not manual SQL.

## 3. Infrastructure & Performance

- [ ] **SSL**: TLS 1.3 enforced on load balancer (Traefik/Cloudflare).
- [ ] **CDN**: Static assets cached via Cloudflare/CDN.
- [ ] **Compression**: Gzip/Brotli enabled for API responses.
- [ ] **Autoscaling**: HPA configured for ML Service (CPU > 70%).

## 4. Observability

- [ ] **Logging**: Structured JSON logs verified in Grafana/CloudWatch.
- [ ] **Alerts**: "High Error Rate" and "Database CPU" alerts routed to Slack/PagerDuty.
- [ ] **Tracing**: Distributed tracing verified for full request path.
- [ ] **Health Checks**: `/health` endpoint monitored by Uptime Robot/Pingdom.

## 5. Compliance & Legal

- [ ] **Terms of Service**: Updated to include AI liability disclaimers.
- [ ] **Privacy Policy**: Updated with data processing details (GDPR/CCPA).
- [ ] **Cookie Consent**: Banner active for EU visitors.
- [ ] **Data Deletion**: "Delete Account" button fully functional (hard delete or anonymization).
