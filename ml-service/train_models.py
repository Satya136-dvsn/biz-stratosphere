"""
Train sample ML models and register them with MLflow
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error, classification_report
import mlflow
import mlflow.sklearn
import joblib
import os

# Set MLflow tracking URI
mlflow.set_tracking_uri("sqlite:///mlflow.db")
mlflow.set_experiment("biz-stratosphere-models")

def generate_churn_data(n_samples=1000):
    """Generate synthetic customer churn data"""
    np.random.seed(42)
    
    data = {
        'usage_frequency': np.random.randint(1, 100, n_samples),
        'support_tickets': np.random.randint(0, 20, n_samples),
        'tenure_months': np.random.randint(1, 60, n_samples),
        'monthly_spend': np.random.uniform(10, 500, n_samples),
        'feature_usage_pct': np.random.uniform(0, 100, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Generate churn based on features (higher tickets, lower usage = higher churn)
    churn_prob = (
        (100 - df['usage_frequency']) * 0.3 +
        df['support_tickets'] * 2 +
        (60 - df['tenure_months']) * 0.5 +
        (100 - df['feature_usage_pct']) * 0.2
    ) / 100
    
    df['churn'] = (np.random.random(n_samples) < (churn_prob / churn_prob.max())).astype(int)
    
    return df

def generate_revenue_data(n_samples=1000):
    """Generate synthetic revenue prediction data"""
    np.random.seed(42)
    
    data = {
        'num_customers': np.random.randint(10, 1000, n_samples),
        'avg_deal_size': np.random.uniform(100, 10000, n_samples),
        'marketing_spend': np.random.uniform(1000, 50000, n_samples),
        'sales_team_size': np.random.randint(1, 50, n_samples),
        'market_growth_pct': np.random.uniform(-10, 30, n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Generate revenue based on features
    df['revenue'] = (
        df['num_customers'] * df['avg_deal_size'] * 0.7 +
        df['marketing_spend'] * 5 +
        df['sales_team_size'] * 10000 +
        df['market_growth_pct'] * 1000 +
        np.random.normal(0, 50000, n_samples)
    )
    
    return df

def train_churn_model():
    """Train and register churn prediction model"""
    print("Training Churn Prediction Model...")
    
    # Generate data
    df = generate_churn_data(2000)
    X = df.drop('churn', axis=1)
    y = df['churn']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Start MLflow run
    with mlflow.start_run(run_name="churn_predictor"):
        # Train model
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Log parameters
        mlflow.log_param("model_type", "RandomForest")
        mlflow.log_param("n_estimators", 100)
        mlflow.log_param("max_depth", 10)
        mlflow.log_param("features", list(X.columns))
        
        # Log metrics
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("test_samples", len(y_test))
        
        # Log model
        mlflow.sklearn.log_model(
            model,
            "model",
            registered_model_name="churn_predictor"
        )
        
        # Save model locally
        os.makedirs("models", exist_ok=True)
        joblib.dump(model, "models/churn_model.pkl")
        
        print(f"✓ Churn Model trained - Accuracy: {accuracy:.3f}")
        print(classification_report(y_test, y_pred))
        
    return model

def train_revenue_model():
    """Train and register revenue forecasting model"""
    print("\nTraining Revenue Forecasting Model...")
    
    # Generate data
    df = generate_revenue_data(2000)
    X = df.drop('revenue', axis=1)
    y = df['revenue']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Start MLflow run
    with mlflow.start_run(run_name="revenue_forecaster"):
        # Train model
        model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        
        # Log parameters
        mlflow.log_param("model_type", "GradientBoosting")
        mlflow.log_param("n_estimators", 100)
        mlflow.log_param("max_depth", 5)
        mlflow.log_param("learning_rate", 0.1)
        mlflow.log_param("features", list(X.columns))
        
        # Log metrics
        mlflow.log_metric("mse", mse)
        mlflow.log_metric("rmse", rmse)
        mlflow.log_metric("test_samples", len(y_test))
        
        # Log model
        mlflow.sklearn.log_model(
            model,
            "model",
            registered_model_name="revenue_forecaster"
        )
        
        # Save model locally
        os.makedirs("models", exist_ok=True)
        joblib.dump(model, "models/revenue_model.pkl")
        
        print(f"✓ Revenue Model trained - RMSE: {rmse:,.2f}")
        
    return model

if __name__ == "__main__":
    print("="*60)
    print("Training ML Models for Biz Stratosphere")
    print("="*60)
    
    # Train models
    churn_model = train_churn_model()
    revenue_model = train_revenue_model()
    
    print("\n" + "="*60)
    print("✓ All models trained and registered successfully!")
    print("="*60)
    print("\nModels saved to:")
    print("  - models/churn_model.pkl")
    print("  - models/revenue_model.pkl")
    print("\nMLflow tracking: sqlite:///mlflow.db")
    print("\nTo view MLflow UI:")
    print("  mlflow ui --backend-store-uri sqlite:///mlflow.db")
