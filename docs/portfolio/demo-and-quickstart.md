# Demo Scenario & Quick Start Guide

## 🎬 End-to-End Demo Workflow

To demonstrate the full power of the Biz Stratosphere platform, follow this workflow:

### Step 1: The ML Prediction
1. Navigate to the **Customer Intelligence** dashboard.
2. Select a sample user (e.g., "User 819 - Enterprise Tier").
3. The dashboard makes an instantaneous call. The ML Inference service calculates a **92% Churn Probability** based on recent usage metrics.

### Step 2: The Actionable RAG AI
1. In the context-aware AI chat window, type: *"What should our Customer Success team do about User 819's churn risk?"*
2. **Behind the scenes:**
   - The RAG service retrieves standard operating procedures for "Enterprise Tier High Churn Risk."
   - The LLM orchestrator merges the 92% ML prediction with the retrieved SOPs.
3. The AI streams a response: *"User 819 has a 92% churn risk. According to the Enterprise Playbook, you should immediately schedule an Executive Business Review and offer a 10% renewal discount."*

### Step 3: Triggering Chaos (Resilience Demo)
To prove the architecture's robustness:
1. Hard-kill the RAG service container: `docker kill rag-service`
2. Ask the AI another question.
3. **Result:** The system does not crash. The API Gateway circuit breaker trips, isolating the dead service. The AI responds using its base knowledge and the ML data, stating: *"I cannot access the playbook currently, but given the 92% risk, immediate outreach is recommended."*

---

## 🚀 Quick Start Guide

You can run the full microservice mesh locally on a single machine or deploy it to a Kubernetes cluster.

### Option A: Local Development (Docker Compose)

The easiest way to experience the platform locally.

**Prerequisites:**
- Docker & Docker Compose
- Minimum 16GB RAM (32GB recommended for running local LLMs smoothly).

**Steps:**
1. Clone the repository and navigate to the root directory.
2. Ensure you have the required models initialized:
   ```bash
   ollama pull llama3
   ```
3. Start the entire application stack:
   ```bash
   docker compose up -d
   ```
4. Access the platform:
   - **Frontend UI:** `http://localhost:5173`
   - **Grafana Dashboards:** `http://localhost:3000` (User: `admin`, Pass: `admin`)
   - **Jaeger Traces:** `http://localhost:16686`

### Option B: Kubernetes Deployment

For testing the production-grade horizontal scaling and isolation features.

**Prerequisites:**
- A local K8s cluster (Minikube, kind, or Docker Desktop).
- `kubectl` configured.

**Steps:**
1. Navigate to the `k8s/` directory.
2. Apply the full infrastructure stack using Kustomize:
   ```bash
   kubectl apply -k .
   ```
3. Monitor the deployment spin-up:
   ```bash
   kubectl get pods -n biz-stratosphere -w
   ```
4. Access via Ingress (requires updating your `/etc/hosts` to point to the Ingress controller IP):
   - `http://api.biz-stratosphere.local`
   - `http://grafana.biz-stratosphere.local`
