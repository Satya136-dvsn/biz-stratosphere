# © 2026 VenkataSatyanarayana Duba
# Biz Stratosphere - Proprietary Software
# Unauthorized copying or distribution prohibited.

"""
Enhanced ETL Pipeline with Supabase Integration
Handles automated data cleaning and processing for uploaded datasets
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging
from supabase import create_client, Client
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseETL:
    """ETL pipeline that integrates with Supabase for data processing"""

    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize Supabase ETL client

        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase service role key or anon key
        """
        self.supabase_url = supabase_url or os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase URL and Key must be provided either as args or environment variables.")
            
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.logger = logger

    def get_dataset_data(self, dataset_id: str) -> Optional[pd.DataFrame]:
        """
        Retrieve dataset and associated data points from Supabase

        Args:
            dataset_id: UUID of the dataset to retrieve

        Returns:
            DataFrame with dataset information and data points
        """
        try:
            # Get dataset info
            dataset_result = self.supabase.table('datasets').select('*').eq('id', dataset_id).execute()
            if not dataset_result.data:
                self.logger.error(f"Dataset {dataset_id} not found")
                return None

            dataset = dataset_result.data[0]

            # Get associated data points
            data_points_result = self.supabase.table('data_points').select('*').eq('dataset_id', dataset_id).execute()

            if not data_points_result.data:
                self.logger.warning(f"No data points found for dataset {dataset_id}")
                return None

            # Convert to DataFrame
            df = pd.DataFrame(data_points_result.data)

            # Add dataset metadata
            df['dataset_name'] = dataset['name']
            df['dataset_file_name'] = dataset['file_name']
            df['dataset_created_at'] = dataset['created_at']

            self.logger.info(f"Retrieved {len(df)} data points for dataset {dataset_id}")
            return df

        except Exception as e:
            self.logger.error(f"Error retrieving dataset data: {e}")
            return None

    def clean_bank_churn_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Specialized cleaning for bank customer churn dataset

        Args:
            df: Raw data DataFrame

        Returns:
            Cleaned DataFrame
        """
        self.logger.info("Starting bank churn data cleaning...")

        # Create a copy to avoid modifying original
        cleaned_df = df.copy()

        # 1. Handle missing values
        numeric_columns = ['credit_score', 'age', 'tenure', 'balance', 'products_number', 'estimated_salary']
        categorical_columns = ['country', 'gender']

        # Fill numeric columns with median
        for col in numeric_columns:
            if col in cleaned_df.columns:
                cleaned_df[col] = cleaned_df[col].fillna(cleaned_df[col].median())

        # Fill categorical columns with mode
        for col in categorical_columns:
            if col in cleaned_df.columns:
                cleaned_df[col] = cleaned_df[col].fillna(cleaned_df[col].mode().iloc[0] if not cleaned_df[col].mode().empty else 'Unknown')

        # 2. Data type validation and conversion
        if 'age' in cleaned_df.columns:
            cleaned_df['age'] = pd.to_numeric(cleaned_df['age'], errors='coerce').astype('Int64')

        if 'credit_score' in cleaned_df.columns:
            cleaned_df['credit_score'] = pd.to_numeric(cleaned_df['credit_score'], errors='coerce').astype('Int64')

        if 'balance' in cleaned_df.columns:
            cleaned_df['balance'] = pd.to_numeric(cleaned_df['balance'], errors='coerce').astype(float)

        if 'estimated_salary' in cleaned_df.columns:
            cleaned_df['estimated_salary'] = pd.to_numeric(cleaned_df['estimated_salary'], errors='coerce').astype(float)

        # 3. Create derived features
        if 'balance' in cleaned_df.columns and 'estimated_salary' in cleaned_df.columns:
            cleaned_df['balance_salary_ratio'] = cleaned_df['balance'] / (cleaned_df['estimated_salary'] + 1)

        if 'age' in cleaned_df.columns and 'tenure' in cleaned_df.columns:
            cleaned_df['age_tenure_interaction'] = cleaned_df['age'] * cleaned_df['tenure']

        # 4. Binary encoding for categorical variables
        if 'gender' in cleaned_df.columns:
            cleaned_df['gender_male'] = (cleaned_df['gender'] == 'Male').astype(int)

        if 'country' in cleaned_df.columns:
            # One-hot encoding for country
            country_dummies = pd.get_dummies(cleaned_df['country'], prefix='country')
            cleaned_df = pd.concat([cleaned_df, country_dummies], axis=1)

        # 5. Remove outliers (using IQR method)
        if 'age' in cleaned_df.columns:
            Q1 = cleaned_df['age'].quantile(0.25)
            Q3 = cleaned_df['age'].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            cleaned_df = cleaned_df[(cleaned_df['age'] >= lower_bound) & (cleaned_df['age'] <= upper_bound)]

        if 'credit_score' in cleaned_df.columns:
            Q1 = cleaned_df['credit_score'].quantile(0.25)
            Q3 = cleaned_df['credit_score'].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            cleaned_df = cleaned_df[(cleaned_df['credit_score'] >= lower_bound) & (cleaned_df['credit_score'] <= upper_bound)]

        # 6. Add data quality metadata
        cleaned_df['data_quality_score'] = self._calculate_data_quality_score(cleaned_df)
        cleaned_df['cleaned_at'] = datetime.now().isoformat()

        self.logger.info(f"Data cleaning completed. Final shape: {cleaned_df.shape}")
        return cleaned_df

    def _calculate_data_quality_score(self, df: pd.DataFrame) -> pd.Series:
        """
        Calculate data quality score for each row

        Args:
            df: DataFrame to score

        Returns:
            Series with quality scores
        """
        scores = pd.Series(1.0, index=df.index)  # Start with perfect score

        # Penalize missing values
        missing_count = df.isnull().sum(axis=1)
        scores = scores - (missing_count * 0.1)

        # Penalize outliers (simplified)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if col in df.columns:
                z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                scores = scores - (z_scores > 3).astype(float) * 0.2

        # Ensure score is between 0 and 1
        scores = np.clip(scores, 0, 1)

        return scores

    def save_cleaned_data(self, df: pd.DataFrame, dataset_id: str, table_name: str = 'cleaned_data_points') -> bool:
        """
        Save cleaned data back to Supabase

        Args:
            df: Cleaned DataFrame
            dataset_id: Original dataset ID
            table_name: Target table name

        Returns:
            Success status
        """
        try:
            # Convert DataFrame to records
            records = df.to_dict('records')

            # Add metadata
            for record in records:
                record['original_dataset_id'] = dataset_id
                record['created_at'] = datetime.now().isoformat()

            # Insert into Supabase
            result = self.supabase.table(table_name).insert(records).execute()

            self.logger.info(f"Successfully saved {len(records)} cleaned records to {table_name}")
            return True

        except Exception as e:
            self.logger.error(f"Error saving cleaned data: {e}")
            return False

    def process_dataset(self, dataset_id: str) -> Dict:
        """
        Complete ETL pipeline for a dataset

        Args:
            dataset_id: Dataset to process

        Returns:
            Processing results
        """
        self.logger.info(f"Starting ETL processing for dataset {dataset_id}")

        try:
            # 1. Retrieve data
            raw_df = self.get_dataset_data(dataset_id)
            if raw_df is None:
                return {'success': False, 'error': 'Failed to retrieve dataset data'}

            # 2. Clean data
            cleaned_df = self.clean_bank_churn_data(raw_df)

            # 3. Save cleaned data
            save_success = self.save_cleaned_data(cleaned_df, dataset_id)

            # 4. Update dataset status
            update_success = self.update_dataset_status(dataset_id, 'processed')

            return {
                'success': save_success and update_success,
                'original_rows': len(raw_df),
                'cleaned_rows': len(cleaned_df),
                'data_quality_score': cleaned_df['data_quality_score'].mean() if 'data_quality_score' in cleaned_df.columns else None
            }

        except Exception as e:
            self.logger.error(f"ETL processing failed: {e}")
            self.update_dataset_status(dataset_id, 'failed')
            return {'success': False, 'error': str(e)}

    def update_dataset_status(self, dataset_id: str, status: str) -> bool:
        """
        Update dataset processing status

        Args:
            dataset_id: Dataset ID
            status: New status

        Returns:
            Success status
        """
        try:
            result = self.supabase.table('datasets').update({
                'status': status,
                'updated_at': datetime.now().isoformat()
            }).eq('id', dataset_id).execute()

            self.logger.info(f"Updated dataset {dataset_id} status to {status}")
            return True

        except Exception as e:
            self.logger.error(f"Error updating dataset status: {e}")
            return False

    def get_processing_stats(self, dataset_id: str) -> Dict:
        """
        Get processing statistics for a dataset

        Args:
            dataset_id: Dataset ID

        Returns:
            Statistics dictionary
        """
        try:
            # Get original data points count
            original_result = self.supabase.table('data_points').select('id', count='exact').eq('dataset_id', dataset_id).execute()

            # Get cleaned data points count
            cleaned_result = self.supabase.table('cleaned_data_points').select('id', count='exact').eq('original_dataset_id', dataset_id).execute()

            # Get dataset info
            dataset_result = self.supabase.table('datasets').select('*').eq('id', dataset_id).execute()

            return {
                'dataset_id': dataset_id,
                'original_count': original_result.count,
                'cleaned_count': cleaned_result.count,
                'dataset_info': dataset_result.data[0] if dataset_result.data else None
            }

        except Exception as e:
            self.logger.error(f"Error getting processing stats: {e}")
            return {'error': str(e)}

    def process_all_unprocessed_datasets(self) -> Dict[str, Any]:
        """
        Process all datasets that are in 'pending' or 'uploaded' status
        """
        self.logger.info("Fetching unprocessed datasets...")
        try:
            # Fetch all datasets with pending status
            result = self.supabase.table('datasets').select('*').in_('status', ['pending', 'uploaded']).execute()
            
            datasets = result.data
            if not datasets:
                self.logger.info("No unprocessed datasets found.")
                return {'processed': 0, 'successful': 0, 'failed': 0}
                
            self.logger.info(f"Found {len(datasets)} datasets to process.")
            
            stats = {'processed': len(datasets), 'successful': 0, 'failed': 0}
            
            for ds in datasets:
                ds_id = ds['id']
                self.logger.info(f"Processing dataset: {ds['name']} (ID: {ds_id})")
                
                # Retry logic for processing (simple 3 retries)
                success = False
                for attempt in range(3):
                    try:
                        res = self.process_dataset(ds_id)
                        if res.get('success'):
                            stats['successful'] += 1
                            success = True
                            break
                        self.logger.warning(f"Attempt {attempt+1} failed for {ds_id}. Error: {res.get('error')}")
                    except Exception as e:
                        self.logger.warning(f"Attempt {attempt+1} exception for {ds_id}: {e}")
                
                if not success:
                    stats['failed'] += 1
                    
            return stats
            
        except Exception as e:
            self.logger.error(f"Error processing all datasets: {e}")
            raise
