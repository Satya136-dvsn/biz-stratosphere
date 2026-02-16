# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
import os

# Add project directories to path
sys.path.insert(0, '/opt/airflow/dags')

def run_etl_pipeline():
    """Run Supabase ETL pipeline to process unprocessed datasets"""
    try:
        from etl.supabase_etl import SupabaseETL
        print("Starting ETL pipeline...")
        etl = SupabaseETL()
        etl.process_all_unprocessed_datasets()
        print("ETL pipeline completed successfully")
    except Exception as e:
        print(f"ETL pipeline failed: {str(e)}")
        raise

def train_ml_models():
    """Train ML models on cleaned data from Supabase"""
    try:
        from ml.train import main
        print("Starting ML model training...")
        main()
        print("ML training completed successfully")
    except Exception as e:
        print(f"ML training failed: {str(e)}")
        raise

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5)
}

# Main daily ETL and training DAG
dag = DAG(
    'daily_etl_and_ml_training',
    default_args=default_args,
    description='Daily ETL processing and ML model training pipeline',
    schedule_interval='0 2 * * *',  # Run at 2 AM daily
    catchup=False,
    tags=['etl', 'ml', 'production']
)

# Task 1: Run ETL to clean and process data
etl_task = PythonOperator(
    task_id='run_etl_pipeline',
    python_callable=run_etl_pipeline,
    dag=dag
)

# Task 2: Train ML models on cleaned data
train_task = PythonOperator(
    task_id='train_ml_models',
    python_callable=train_ml_models,
    dag=dag
)

# ETL must complete before training
etl_task >> train_task
