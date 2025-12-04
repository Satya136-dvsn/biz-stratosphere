#!/bin/bash
set -e

# Production Deployment Script
# Usage: ./scripts/deploy.sh [environment]

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
    source "$PROJECT_ROOT/.env.$ENVIRONMENT"
    echo "✓ Loaded environment variables from .env.$ENVIRONMENT"
else
    echo "❌ Error: .env.$ENVIRONMENT file not found"
    exit 1
fi

# Check required environment variables
required_vars=(
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "BACKEND_IMAGE"
    "FRONTEND_IMAGE"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

echo "✓ Environment variables validated"

# Pull latest Docker images
echo "📦 Pulling latest Docker images..."
docker pull $BACKEND_IMAGE
docker pull $FRONTEND_IMAGE

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start new containers
echo "▶️  Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Health check
echo "🏥 Running health checks..."
max_retries=30
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✓ Backend is healthy"
        break
    fi
    
    retry_count=$((retry_count + 1))
    echo "  Waiting for backend... ($retry_count/$max_retries)"
    sleep 2
done

if [ $retry_count -eq $max_retries ]; then
    echo "❌ Backend health check failed"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -af --filter "until=48h"

# Show running containers
echo "📊 Running containers:"
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment to $ENVIRONMENT completed successfully!"
echo ""
echo "📝 Next steps:"
echo "  - Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Check status: docker-compose -f docker-compose.prod.yml ps"
echo "  - Access Airflow: http://localhost:8080"
echo "  - Access Backend: http://localhost:8000"
