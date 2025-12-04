"""
Model Evaluation Utilities
Comprehensive evaluation and comparison of ML models
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import logging
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, classification_report,
    confusion_matrix, roc_curve, precision_recall_curve
)
from sklearn.model_selection import cross_val_score, learning_curve
import joblib

logger = logging.getLogger(__name__)

class ModelEvaluator:
    """Comprehensive model evaluation and comparison"""

    def __init__(self, output_dir: str = "evaluation_reports"):
        """
        Initialize model evaluator

        Args:
            output_dir: Directory to save evaluation reports
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def evaluate_model(self, model, X_test: np.ndarray, y_test: np.ndarray,
                      model_name: str = "model") -> Dict[str, Any]:
        """
        Comprehensive evaluation of a single model

        Args:
            model: Trained model
            X_test: Test features
            y_test: Test targets
            model_name: Name of the model

        Returns:
            Dictionary with evaluation results
        """
        logger.info(f"Evaluating {model_name}...")

        try:
            # Make predictions
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None

            # Calculate metrics
            metrics = {
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, zero_division=0),
                'recall': recall_score(y_test, y_pred, zero_division=0),
                'f1_score': f1_score(y_test, y_pred, zero_division=0),
            }

            if y_pred_proba is not None:
                metrics['roc_auc'] = roc_auc_score(y_test, y_pred_proba)
                metrics['average_precision'] = average_precision_score(y_test, y_pred_proba)

            # Confusion matrix
            cm = confusion_matrix(y_test, y_pred)
            metrics['confusion_matrix'] = cm.tolist()

            # Classification report
            metrics['classification_report'] = classification_report(
                y_test, y_pred, output_dict=True, zero_division=0
            )

            # Cross-validation scores (if we have enough data)
            try:
                cv_scores = cross_val_score(model, X_test, y_test, cv=3, scoring='roc_auc')
                metrics['cv_scores'] = {
                    'mean': cv_scores.mean(),
                    'std': cv_scores.std(),
                    'scores': cv_scores.tolist()
                }
            except:
                metrics['cv_scores'] = None

            # Model info
            metrics['model_name'] = model_name
            metrics['evaluation_date'] = datetime.now().isoformat()

            logger.info(f"{model_name} evaluation completed. ROC-AUC: {metrics.get('roc_auc', 'N/A')}")

            return metrics

        except Exception as e:
            logger.error(f"Error evaluating {model_name}: {e}")
            return {'error': str(e), 'model_name': model_name}

    def compare_models(self, models: Dict[str, Dict], save_report: bool = True) -> Dict[str, Any]:
        """
        Compare multiple models and generate comparison report

        Args:
            models: Dictionary of model evaluation results
            save_report: Whether to save detailed report

        Returns:
            Comparison summary
        """
        logger.info("Comparing models...")

        comparison = {
            'model_count': len(models),
            'comparison_date': datetime.now().isoformat(),
            'models': models,
            'ranking': {}
        }

        # Extract metrics for comparison
        model_metrics = {}
        for model_name, results in models.items():
            if 'error' not in results:
                model_metrics[model_name] = {
                    'roc_auc': results.get('roc_auc', 0),
                    'accuracy': results.get('accuracy', 0),
                    'precision': results.get('precision', 0),
                    'recall': results.get('recall', 0),
                    'f1_score': results.get('f1_score', 0)
                }

        # Rank models by ROC-AUC
        if model_metrics:
            sorted_models = sorted(
                model_metrics.items(),
                key=lambda x: x[1]['roc_auc'],
                reverse=True
            )

            comparison['ranking'] = {
                'by_roc_auc': sorted_models,
                'best_model': sorted_models[0][0] if sorted_models else None,
                'worst_model': sorted_models[-1][0] if sorted_models else None
            }

        # Generate detailed report
        if save_report:
            self.generate_comparison_report(comparison)

        logger.info(f"Model comparison completed. Best model: {comparison['ranking'].get('best_model', 'N/A')}")
        return comparison

    def generate_comparison_report(self, comparison: Dict[str, Any]) -> str:
        """
        Generate detailed comparison report

        Args:
            comparison: Comparison results

        Returns:
            Path to saved report
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_path = self.output_dir / f"model_comparison_{timestamp}.json"

            # Save detailed report
            with open(report_path, 'w') as f:
                import json
                json.dump(comparison, f, indent=2, default=str)

            logger.info(f"Comparison report saved to {report_path}")
            return str(report_path)

        except Exception as e:
            logger.error(f"Error generating comparison report: {e}")
            return ""

    def plot_roc_curves(self, models: Dict[str, Dict], X_test: np.ndarray,
                       y_test: np.ndarray, save_plots: bool = True) -> Dict[str, Any]:
        """
        Plot ROC curves for multiple models

        Args:
            models: Dictionary of model evaluation results
            X_test: Test features
            y_test: Test targets
            save_plots: Whether to save plots

        Returns:
            Dictionary with plot information
        """
        try:
            plt.figure(figsize=(10, 8))

            plot_data = {}

            for model_name, results in models.items():
                if 'error' in results:
                    continue

                model = results.get('model')
                if model is None:
                    continue

                # Get predictions
                if hasattr(model, 'predict_proba'):
                    y_pred_proba = model.predict_proba(X_test)[:, 1]
                else:
                    y_pred = model.predict(X_test)
                    y_pred_proba = y_pred.astype(float)

                # Calculate ROC curve
                fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
                auc_score = roc_auc_score(y_test, y_pred_proba)

                # Plot ROC curve
                plt.plot(fpr, tpr, label=f'{model_name} (AUC = {auc_score:.3f})')

                plot_data[model_name] = {
                    'fpr': fpr.tolist(),
                    'tpr': tpr.tolist(),
                    'auc': auc_score,
                    'thresholds': thresholds.tolist()
                }

            # Plot diagonal line
            plt.plot([0, 1], [0, 1], 'k--', alpha=0.6)
            plt.xlabel('False Positive Rate')
            plt.ylabel('True Positive Rate')
            plt.title('ROC Curves Comparison')
            plt.legend(loc='lower right')
            plt.grid(True, alpha=0.3)

            if save_plots:
                plot_path = self.output_dir / f"roc_curves_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                plt.savefig(plot_path, dpi=300, bbox_inches='tight')
                logger.info(f"ROC curves plot saved to {plot_path}")

            plt.show()

            return plot_data

        except Exception as e:
            logger.error(f"Error plotting ROC curves: {e}")
            return {}

    def plot_confusion_matrices(self, models: Dict[str, Dict], save_plots: bool = True) -> Dict[str, Any]:
        """
        Plot confusion matrices for multiple models

        Args:
            models: Dictionary of model evaluation results
            save_plots: Whether to save plots

        Returns:
            Dictionary with confusion matrix data
        """
        try:
            n_models = len([m for m in models.values() if 'error' not in m])
            if n_models == 0:
                return {}

            fig, axes = plt.subplots(1, n_models, figsize=(6*n_models, 5))

            if n_models == 1:
                axes = [axes]

            plot_data = {}

            for i, (model_name, results) in enumerate(models.items()):
                if 'error' in results:
                    continue

                if i >= len(axes):
                    break

                cm = np.array(results['confusion_matrix'])

                sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                           xticklabels=['No Churn', 'Churn'],
                           yticklabels=['No Churn', 'Churn'],
                           ax=axes[i])

                axes[i].set_title(f'{model_name}\nConfusion Matrix')
                axes[i].set_xlabel('Predicted')
                axes[i].set_ylabel('Actual')

                plot_data[model_name] = {
                    'confusion_matrix': cm.tolist(),
                    'tn': cm[0,0],
                    'fp': cm[0,1],
                    'fn': cm[1,0],
                    'tp': cm[1,1]
                }

            plt.tight_layout()

            if save_plots:
                plot_path = self.output_dir / f"confusion_matrices_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                plt.savefig(plot_path, dpi=300, bbox_inches='tight')
                logger.info(f"Confusion matrices plot saved to {plot_path}")

            plt.show()

            return plot_data

        except Exception as e:
            logger.error(f"Error plotting confusion matrices: {e}")
            return {}

    def generate_model_cards(self, models: Dict[str, Dict]) -> Dict[str, str]:
        """
        Generate model cards for documentation

        Args:
            models: Dictionary of model evaluation results

        Returns:
            Dictionary with model card file paths
        """
        model_cards = {}

        for model_name, results in models.items():
            if 'error' in results:
                continue

            try:
                card_content = f"""
# Model Card: {model_name}

## Overview
- **Model Type**: {model_name}
- **Evaluation Date**: {results.get('evaluation_date', 'N/A')}
- **Dataset**: Bank Customer Churn Prediction

## Performance Metrics
- **Accuracy**: {results.get('accuracy', 0):.4f
- **Precision**: {results.get('precision', 0):.4f
- **Recall**: {results.get('recall', 0):.4f
- **F1-Score**: {results.get('f1_score', 0):.4f
- **ROC-AUC**: {results.get('roc_auc', 0):.4f

## Confusion Matrix
```
{np.array(results.get('confusion_matrix', [[0,0],[0,0]]))}
```

## Classification Report
```
{pd.DataFrame(results.get('classification_report', {})).T}
```

## Notes
- Model trained on cleaned customer data from Supabase
- Features include customer demographics, account information, and derived metrics
- Performance evaluated using stratified train-test split
"""

                card_path = self.output_dir / f"model_card_{model_name.lower().replace(' ', '_')}.md"
                with open(card_path, 'w') as f:
                    f.write(card_content.strip())

                model_cards[model_name] = str(card_path)
                logger.info(f"Model card saved to {card_path}")

            except Exception as e:
                logger.error(f"Error generating model card for {model_name}: {e}")

        return model_cards

    def save_evaluation_summary(self, models: Dict[str, Dict], comparison: Dict[str, Any]) -> str:
        """
        Save comprehensive evaluation summary

        Args:
            models: Dictionary of model evaluation results
            comparison: Model comparison results

        Returns:
            Path to saved summary
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            summary_path = self.output_dir / f"evaluation_summary_{timestamp}.json"

            summary = {
                'evaluation_summary': {
                    'total_models_evaluated': len(models),
                    'evaluation_date': datetime.now().isoformat(),
                    'models': models,
                    'comparison': comparison
                }
            }

            with open(summary_path, 'w') as f:
                import json
                json.dump(summary, f, indent=2, default=str)

            logger.info(f"Evaluation summary saved to {summary_path}")
            return str(summary_path)

        except Exception as e:
            logger.error(f"Error saving evaluation summary: {e}")
            return ""
