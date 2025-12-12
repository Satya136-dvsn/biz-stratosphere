# Biz Stratosphere ML Service

Machine Learning prediction and explainability service with MLflow and SHAP integration.

## Features

- **ML Predictions**: Serve trained ML models (churn prediction, revenue forecasting)
- **SHAP Explainability**: Generate feature importance explanations with visualizations
- **MLflow Integration**: Model registry and experiment tracking
- **Ollama LLM**: Local LLM inference (optional)

## Setup

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Train Models

```bash
python train_models.py
```

This will:

- Generate synthetic training data
- Train churn prediction model (RandomForest)
- Train revenue forecasting model (GradientBoosting)
- Log models to MLflow
- Save models locally to `models/` directory

### 3. Start Service

```bash
python main.py
```

Or use uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### ML Predictions

**POST /ml/predict**

```json
{
  "model_name": "churn_model",
  "features": {
    "usage_frequency": 45,
    "support_tickets": 5,
    "tenure_months": 12,
    "monthly_spend": 150.50,
    "feature_usage_pct": 60.0
  }
}
```

**Response:**

```json
{
  "prediction": 0,
  "probability": 0.23,
  "confidence": 0.77,
  "model": "churn_model"
}
```

### SHAP Explanations

**POST /ml/explain**

```json
{
  "model_name": "churn_model",
  "features": {...},
  "include_plots": true
}
```

**Response:**

```json
{
  "shap_values": {
    "feature1": 0.15,
    "feature2": -0.08,
    ...
  },
  "base_value": 0.3,
  "top_features": ["feature1", "feature2", ...],
  "prediction": 0,
  "visualizations": {
    "waterfall_plot": "data:image/png;base64,...",
    "summary_plot": "data:image/png;base64,..."
  }
}
```

### Model Management

**GET /ml/models** - List all available models
**GET /ml/models/{model_name}/info** - Get model details

### Health Check

**GET /health** - Service health status

## Models

### Churn Predictor (`churn_model`)

Predicts customer churn probability.

**Features:**

- `usage_frequency` (int): How often customer uses the product (1-100)
- `support_tickets` (int): Number of support tickets (0-20)
- `tenure_months` (int): How long they've been a customer (1-60)
- `monthly_spend` (float): Monthly spending ($10-$500)
- `feature_usage_pct` (float): Percentage of features used (0-100)

**Output:** Binary classification (0 = stays, 1 = churns) + probability

### Revenue Forecaster (`revenue_model`)

Forecasts monthly revenue.

**Features:**

- `num_customers` (int): Number of customers (10-1000)
- `avg_deal_size` (float): Average deal value ($100-$10000)
- `marketing_spend` (float): Marketing budget ($1000-$50000)
- `sales_team_size` (int): Number of sales people (1-50)
- `market_growth_pct` (float): Market growth rate (-10% to 30%)

**Output:** Predicted revenue (continuous value)

## MLflow UI

View experiment tracking and model registry:

```bash
mlflow ui --backend-store-uri sqlite:///mlflow.db
```

Then open <http://localhost:5000>

## Docker Deployment

```bash
docker-compose up ml-service
```

## Development

### Adding New Models

1. Create training script in `train_models.py`
2. Log model to MLflow with `mlflow.sklearn.log_model()`
3. Model will be auto-discovered by ModelService

### Testing

```bash
# Test prediction
curl -X POST http://localhost:8000/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"model_name":"churn_model","features":{"usage_frequency":45,...}}'

# Test explanation
curl -X POST http://localhost:8000/ml/explain \
  -H "Content-Type: application/json" \
  -d '{"model_name":"churn_model","features":{...},"include_plots":true}'
```

## Architecture

```
FastAPI App (main.py)
    ├─ ModelService (model_service.py)
    │   ├─ Load from MLflow
    │   ├─ Load from local files
    │   └─ Make predictions
    └─ SHAPService (shap_service.py)
        ├─ Generate explanations
        └─ Create visualizations
```

## Requirements

- Python 3.9+
- scikit-learn
- MLflow
- SHAP
- FastAPI
- pandas/numpy
