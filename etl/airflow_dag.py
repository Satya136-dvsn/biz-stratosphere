from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
import pandas as pd
from etl.clean import clean_data

def etl_task():
    # Example: run cleaning on a sample file
    input_path = '/data/sample.csv'
    output_path = '/data/cleaned_sample.csv'
    clean_data(input_path, output_path)

default_args = {
    'owner': 'airflow',
    'start_date': datetime(2025, 1, 1),
    'retries': 1
}

dag = DAG(
    'sample_etl',
    default_args=default_args,
    schedule_interval='@daily',
    catchup=False
)

run_etl = PythonOperator(
    task_id='run_etl_cleaning',
    python_callable=etl_task,
    dag=dag
)
