#!/bin/bash
set -e

# Rollback Script
# Usage: ./scripts/rollback.sh [tag]

TAG=${1:-previous}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "⏪ Rolling back deployment to tag: $TAG"

# Load environment
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    source "$PROJECT_ROOT/.env.production"
else
    echo "❌ Error: .env.production file not found"
    exit 1
fi

# Extract base image names
BACKEND_BASE=$(echo $BACKEND_IMAGE | cut -d':' -f1)
FRONTEND_BASE=$(echo $FRONTEND_IMAGE | cut -d':' -f1)

# Set rollback images
export BACKEND_IMAGE="$BACKEND_BASE:$TAG"
export FRONTEND_IMAGE="$FRONTEND_BASE:$TAG"

echo "📦 Rolling back to images:"
echo "  Backend: $BACKEND_IMAGE"
echo "  Frontend: $FRONTEND_IMAGE"

# Pull rollback images
docker pull $BACKEND_IMAGE
docker pull $FRONTEND_IMAGE

# Deploy rollback
echo "🔄 Deploying rollback..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Wait and verify
sleep 10
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Rollback completed successfully"
else
    echo "❌ Rollback health check failed"
    exit 1
fi
