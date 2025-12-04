"""
Data Loading Utilities for ML Training
Handles data retrieval and preprocessing for ML pipelines
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import logging
from datetime import datetime, timedelta
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class SupabaseDataLoader:
    """Data loader for retrieving training data from Supabase"""

    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize Supabase data loader

        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase service role key
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)

    def get_latest_cleaned_data(self, hours_back: int = 24) -> Optional[pd.DataFrame]:
        """
        Get the most recent cleaned data

        Args:
            hours_back: Look back this many hours for recent data

        Returns:
            DataFrame with recent cleaned data
        """
        try:
            since_time = datetime.now() - timedelta(hours=hours_back)

            query = self.supabase.table('cleaned_data_points').select('*').gte(
                'cleaned_at', since_time.isoformat()
            ).order('cleaned_at', desc=True)

            result = query.execute()

            if not result.data:
                logger.warning(f"No cleaned data found in the last {hours_back} hours")
                return None

            df = pd.DataFrame(result.data)
            logger.info(f"Retrieved {len(df)} recent cleaned records")
            return df

        except Exception as e:
            logger.error(f"Error retrieving recent cleaned data: {e}")
            return None

    def get_data_by_dataset(self, dataset_id: str) -> Optional[pd.DataFrame]:
        """
        Get cleaned data for a specific dataset

        Args:
            dataset_id: Dataset ID to retrieve

        Returns:
            DataFrame with dataset's cleaned data
        """
        try:
            query = self.supabase.table('cleaned_data_points').select('*').eq(
                'original_dataset_id', dataset_id
            )

            result = query.execute()

            if not result.data:
                logger.warning(f"No cleaned data found for dataset {dataset_id}")
                return None

            df = pd.DataFrame(result.data)
            logger.info(f"Retrieved {len(df)} cleaned records for dataset {dataset_id}")
            return df

        except Exception as e:
            logger.error(f"Error retrieving dataset data: {e}")
            return None

    def get_training_data(self,
                         min_quality_score: float = 0.7,
                         min_samples: int = 1000,
                         balance_classes: bool = True) -> Optional[Tuple[pd.DataFrame, pd.Series]]:
        """
        Get training data with quality filtering and optional balancing

        Args:
            min_quality_score: Minimum data quality score
            min_samples: Minimum number of samples required
            balance_classes: Whether to balance classes using undersampling

        Returns:
            Tuple of (features DataFrame, target Series) or None if insufficient data
        """
        try:
            # Get all cleaned data
            df = self.get_latest_cleaned_data()
            if df is None:
                return None

            # Apply quality filter
            df = df[df['data_quality_score'] >= min_quality_score]

            if len(df) < min_samples:
                logger.warning(f"Insufficient data after quality filtering: {len(df)} samples")
                return None

            # Check for target column
            target_column = 'churn'
            if target_column not in df.columns:
                logger.error(f"Target column '{target_column}' not found")
                return None

            # Remove rows with missing target
            df = df.dropna(subset=[target_column])

            if len(df) < min_samples:
                logger.warning(f"Insufficient data after target filtering: {len(df)} samples")
                return None

            # Balance classes if requested
            if balance_classes:
                df = self.balance_classes(df, target_column)

            logger.info(f"Prepared training data: {len(df)} samples")
            return df, df[target_column]

        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            return None

    def balance_classes(self, df: pd.DataFrame, target_column: str) -> pd.DataFrame:
        """
        Balance classes using undersampling

        Args:
            df: Input DataFrame
            target_column: Name of target column

        Returns:
            Balanced DataFrame
        """
        try:
            # Get class counts
            class_counts = df[target_column].value_counts()

            if len(class_counts) != 2:
                logger.warning("Balancing only supported for binary classification")
                return df

            minority_class = class_counts.idxmin()
            majority_class = class_counts.idxmax()
            minority_count = class_counts.min()
            majority_count = class_counts.max()

            logger.info(f"Class distribution before balancing: {class_counts.to_dict()}")

            # Undersample majority class
            majority_df = df[df[target_column] == majority_class]
            minority_df = df[df[target_column] == minority_class]

            majority_undersampled = majority_df.sample(
                n=minority_count, random_state=42, replace=False
            )

            balanced_df = pd.concat([majority_undersampled, minority_df], axis=0)
            balanced_df = balanced_df.sample(frac=1, random_state=42).reset_index(drop=True)

            logger.info(f"Balanced dataset size: {len(balanced_df)}")
            return balanced_df

        except Exception as e:
            logger.error(f"Error balancing classes: {e}")
            return df

    def get_data_stats(self) -> Dict[str, Any]:
        """
        Get statistics about available training data

        Returns:
            Dictionary with data statistics
        """
        try:
            # Get total count
            total_result = self.supabase.table('cleaned_data_points').select(
                'id', count='exact'
            ).execute()

            # Get quality distribution
            quality_result = self.supabase.table('cleaned_data_points').select(
                'data_quality_score'
            ).execute()

            # Get recent data (last 24 hours)
            recent_time = datetime.now() - timedelta(hours=24)
            recent_result = self.supabase.table('cleaned_data_points').select(
                'id', count='exact'
            ).gte('cleaned_at', recent_time.isoformat()).execute()

            # Get churn distribution
            churn_result = self.supabase.table('cleaned_data_points').select(
                'churn'
            ).not_.is_('churn', None).execute()

            stats = {
                'total_records': total_result.count,
                'recent_records': recent_result.count,
                'avg_quality_score': None,
                'churn_distribution': None
            }

            if quality_result.data:
                quality_scores = [r['data_quality_score'] for r in quality_result.data if r['data_quality_score']]
                stats['avg_quality_score'] = np.mean(quality_scores) if quality_scores else None

            if churn_result.data:
                churn_values = [r['churn'] for r in churn_result.data if r['churn'] is not None]
                if churn_values:
                    churn_series = pd.Series(churn_values)
                    stats['churn_distribution'] = churn_series.value_counts().to_dict()

            return stats

        except Exception as e:
            logger.error(f"Error getting data stats: {e}")
            return {}

    def validate_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate data quality for ML training

        Args:
            df: DataFrame to validate

        Returns:
            Dictionary with quality metrics
        """
        try:
            quality_report = {
                'total_rows': len(df),
                'missing_values': {},
                'data_types': {},
                'quality_scores': {}
            }

            # Check missing values
            missing = df.isnull().sum()
            quality_report['missing_values'] = missing[missing > 0].to_dict()

            # Check data types
            quality_report['data_types'] = df.dtypes.to_dict()

            # Calculate quality scores if available
            if 'data_quality_score' in df.columns:
                quality_scores = df['data_quality_score']
                quality_report['quality_scores'] = {
                    'mean': quality_scores.mean(),
                    'median': quality_scores.median(),
                    'min': quality_scores.min(),
                    'max': quality_scores.max()
                }

            # Check for potential issues
            issues = []

            if len(quality_report['missing_values']) > 0:
                issues.append(f"Missing values in {len(quality_report['missing_values'])} columns")

            if 'data_quality_score' in df.columns:
                low_quality_count = (df['data_quality_score'] < 0.5).sum()
                if low_quality_count > 0:
                    issues.append(f"{low_quality_count} records with low quality score (< 0.5)")

            quality_report['issues'] = issues
            quality_report['is_suitable_for_training'] = len(issues) == 0

            return quality_report

        except Exception as e:
            logger.error(f"Error validating data quality: {e}")
            return {'error': str(e)}
