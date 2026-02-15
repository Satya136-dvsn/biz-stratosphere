# Production Deployment Guide

## Prerequisites

1. **GitHub Repository Secrets** (Settings → Secrets and variables → Actions)
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PRODUCTION_HOST=your-server-ip
   PRODUCTION_USER=deploy
   PRODUCTION_SSH_KEY=your-private-ssh-key
   PRODUCTION_DOMAIN=your-app.com
   AIRFLOW_DB_PASSWORD=secure-password
   AIRFLOW_FERNET_KEY=generate-with-python-cryptography
   AIRFLOW_WEBSERVER_SECRET_KEY=random-secret-key
   AIRFLOW_ADMIN_PASSWORD=admin-password
   SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK (optional)
   SENTRY_DSN=https://your-sentry-dsn (optional)
   ```

2. **Production Server Setup**
   - Ubuntu 22.04 LTS or similar
   - Docker & Docker Compose installed
   - SSH access configured
   - SSL certificates (Let's Encrypt recommended)

## Automatic Deployment (Recommended)

### Via GitHub Actions

1. **Push to main branch** triggers automatic deployment:
   ```bash
   git push origin main
   ```

2. **Manual deployment** via GitHub UI:
   - Go to Actions → Deploy to Production → Run workflow

3. **Monitor deployment**:
   - Check Actions tab for real-time logs
   - Slack notifications (if configured)

## Manual Deployment

### Initial Setup on Production Server

```bash
# Clone repository
git clone https://github.com/your-org/churn-prediction-app.git
cd churn-prediction-app

# Create environment file
cp .env.production.example .env.production
nano .env.production  # Fill in all values

# Make scripts executable
chmod +x scripts/*.sh

# Run initial deployment
./scripts/deploy.sh production
```

### Subsequent Deployments

```bash
# Pull latest changes
git pull origin main

# Deploy
./scripts/deploy.sh production
```

## Rollback

If deployment fails or issues are detected:

```bash
# Rollback to previous version
./scripts/rollback.sh previous

# Or rollback to specific tag
./scripts/rollback.sh abc123
```

## Monitoring

### Check Service Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f airflow-scheduler
```

### Health Checks

```bash
# Backend API
curl http://localhost:8000/health

# Airflow UI
curl http://localhost:8080/health

# Frontend
curl http://localhost:80
```

## Airflow Access

- **URL**: `http://your-domain:8080`
- **Username**: Set in `AIRFLOW_ADMIN_USER` (default: `admin`)
- **Password**: Set in `AIRFLOW_ADMIN_PASSWORD`

### Monitor DAGs

1. Log into Airflow UI
2. Check `daily_etl_and_training` DAG status
3. View task logs for debugging

## Database Management

### Backup Supabase Data

```bash
# Using Supabase CLI
npx supabase db dump -f backup.sql

# Or using pg_dump directly
pg_dump $SUPABASE_DB_URL > backup_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
psql $SUPABASE_DB_URL < backup.sql
```

## ML Model Updates

### Deploy New Models

1. Train models locally or in CI:
   ```bash
   python ml/train.py
   ```

2. Copy models to production:
   ```bash
   scp models/*.pkl deploy@production-server:/opt/churn-prediction-app/models/
   ```

3. Restart backend service:
   ```bash
   docker-compose -f docker-compose.prod.yml restart backend
   ```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Verify environment variables
docker-compose -f docker-compose.prod.yml config

# Check disk space
df -h

# Check memory
free -h
```

### Airflow DAG Not Running

1. Check scheduler logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs airflow-scheduler
   ```

2. Verify DAG is not paused in Airflow UI

3. Check DAG syntax:
   ```bash
   docker-compose -f docker-compose.prod.yml exec airflow-scheduler airflow dags list
   ```

### Backend Prediction Errors

1. Verify models are loaded:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend ls -la /app/models/
   ```

2. Check FastAPI logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs backend | grep ERROR
   ```

3. Test prediction endpoint:
   ```bash
   curl -X POST http://localhost:8000/predict \
     -H "Content-Type: application/json" \
     -d '{"features": {"tenure": 12, "monthly_charges": 65.5, "contract_type": "Month-to-month"}, "model_version": "v1"}'
   ```

## Performance Optimization

### Scaling Services

Edit `docker-compose.prod.yml`:

```yaml
services:
  backend:
    deploy:
      replicas: 3  # Run 3 backend instances
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### Enable Caching

Add Redis for model caching:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Security Checklist

- [ ] All secrets stored in GitHub Secrets (not in code)
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured (only necessary ports open)
- [ ] Regular security updates (`apt update && apt upgrade`)
- [ ] Log rotation enabled
- [ ] Backup strategy in place
- [ ] Supabase RLS policies enabled
- [ ] API rate limiting configured

## CI/CD Pipeline

### Workflow Steps

1. **Build**: Docker images built with BuildKit caching
2. **Push**: Images pushed to GitHub Container Registry
3. **Deploy**: SSH into production server, pull images, restart services
4. **Verify**: Health checks confirm successful deployment
5. **Notify**: Slack notification with deployment status

### Customizing the Pipeline

Edit `.github/workflows/deploy-production.yml`:

- Add staging environment
- Add integration tests
- Add performance tests
- Add database migrations

## Cost Estimation (AWS/DigitalOcean)

**Basic Production Setup:**
- 2 vCPU, 4GB RAM: $20-40/month
- Storage (100GB): $10/month
- Backup storage: $5/month
- **Total**: ~$35-55/month

**High Availability Setup:**
- Load balancer: $10-15/month
- 3x instances: $60-120/month
- Database replica: $20-40/month
- **Total**: ~$90-175/month

## Support

- GitHub Issues: https://github.com/your-org/churn-prediction-app/issues
- Documentation: See project README.md
- Supabase Dashboard: https://app.supabase.com
- Airflow UI: http://your-domain:8080
