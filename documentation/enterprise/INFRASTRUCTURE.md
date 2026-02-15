# Infrastructure Blueprint

## 1. Overview

We follow a "Scale-As-You-Grow" infrastructure strategy.

- **Stage 1 (Launch)**: Docker Compose on a single powerful VM (e.g., AWS EC2 t3.2xlarge).
- **Stage 2 (Scale)**: Kubernetes (EKS/GKE) with Horizontal Pod Autoscaling (HPA).

## 2. Docker Compose Architecture (Stage 1)

Optimized for simplicity and ease of deployment.

```yaml
version: '3.8'
services:
  # Load Balancer & SSL Termination
  traefik:
    image: traefik:v2.10
    ports: ["80:80", "443:443"]
    command: --api.insecure=true --providers.docker=true
    volumes: ["/var/run/docker.sock:/var/run/docker.sock"]

  # Frontend (Static + SSR)
  frontend:
    build: .
    labels:
      - "traefik.http.routers.frontend.rule=Host(`app.bizstratosphere.com`)"

  # ML Service (FastAPI)
  ml-service:
    build: ./ml-service
    deploy:
      replicas: 2
    labels:
      - "traefik.http.routers.ml.rule=Host(`api.bizstratosphere.com`)"

  # Background Workers (Airflow)
  airflow-worker:
    image: apache/airflow:2.8.0
    command: airflow celery worker

  # Monitoring (Prometheus/Grafana)
  prometheus:
    image: prom/prometheus
```

## 3. Kubernetes Upgrade Path (Stage 2)

When traffic exceeds single-node capacity, we migrate to K8s.

- **Ingress**: Nginx Ingress Controller.
- **Service Mesh**: Linkerd (lighter than Istio) for MTLS and observability.
- **Autoscaling**:
  - **HPA**: Scale `ml-service` pods based on CPU/RAM.
  - **KEDA**: Event-driven scaling based on RabbitMQ queue depth (for Airflow workers).

## 4. CI/CD Workflow (GitHub Actions)

### 4.1 Pipeline Stages

1. **Test**: Run Unit Tests (`pytest`, `vitest`) and Linting (`ruff`, `eslint`).
2. **Build**: Build Docker images and push to ECR/GHCR.
3. **Scan**: Run `trivy` for vulnerability scanning.
4. **Deploy**:
    - **Dev**: Auto-deploy to `dev.bizstratosphere.com`.
    - **Prod**: Manual approval required -> Deploy to `app.bizstratosphere.com`.

### 4.2 Example Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Production Deployment
on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2
        
      - name: Build and Push
        run: |
          docker build -t $REGISTRY/$REPO:$TAG .
          docker push $REGISTRY/$REPO:$TAG
          
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/ml-service ml-service=$REGISTRY/$REPO:$TAG
```

## 5. Environment Separation

| Environment | URL | Branch | Database |
| :--- | :--- | :--- | :--- |
| **Dev** | dev.bizstratosphere.ai | `develop` | Neon (Dev Branch) |
| **Staging** | staging.bizstratosphere.ai | `release/*` | Neon (Staging, Scrubbed) |
| **Prod** | app.bizstratosphere.ai | `main` | Neon (Production) |
