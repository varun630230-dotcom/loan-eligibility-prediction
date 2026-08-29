"""
SHAP-based explainability for loan eligibility predictions.
Provides both global feature importance and individual prediction explanations.
"""
import shap
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


class LoanExplainer:
    """Generate SHAP explanations for loan eligibility predictions."""

    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = feature_names or []
        # Use TreeExplainer for tree-based models, generic Explainer otherwise
        tree_models = [
            'XGBClassifier', 'RandomForestClassifier',
            'DecisionTreeClassifier', 'GradientBoostingClassifier'
        ]
        model_type = type(self.model).__name__
        if model_type in tree_models:
            self.explainer = shap.TreeExplainer(self.model)
            logger.info(f'Initialized TreeExplainer for {model_type}')
        else:
            self.explainer = shap.Explainer(self.model)
            logger.info(f'Initialized generic Explainer for {model_type}')

    def explain_prediction(self, X_processed, original_data=None):
        """
        Generate SHAP explanation for a single prediction.
        
        Args:
            X_processed: Preprocessed feature array/DataFrame (1 row)
            original_data: Optional dict of original (human-readable) input values
            
        Returns:
            dict with shap_values, positive/negative contributors, base_value
        """
        # Convert to numpy array if DataFrame
        if isinstance(X_processed, pd.DataFrame):
            X_array = X_processed.values
        else:
            X_array = np.array(X_processed)

        if len(X_array.shape) == 1:
            X_array = X_array.reshape(1, -1)

        shap_values = self.explainer(X_array)

        # For binary classification, TreeExplainer may return values for both classes
        # We want the positive class (index 1) SHAP values
        sv = shap_values.values[0]
        if len(sv.shape) > 1:
            # Multi-output: take positive class
            sv = sv[:, 1]

        base_val = shap_values.base_values[0]
        if isinstance(base_val, np.ndarray):
            base_val = float(base_val[1])
        else:
            base_val = float(base_val)

        pred_val = float(base_val + sv.sum())

        # Build contributions list
        # Use feature_names for display, with processed values
        feature_values = X_array[0]
        contributions = []
        for i, (fname, sval) in enumerate(zip(self.feature_names, sv)):
            processed_val = float(feature_values[i]) if i < len(feature_values) else 0.0
            contributions.append({
                'feature': fname,
                'value': round(processed_val, 4),
                'shap_value': round(float(sval), 6)
            })

        positive_contributors = sorted(
            [c for c in contributions if c['shap_value'] > 0],
            key=lambda x: x['shap_value'], reverse=True
        )
        negative_contributors = sorted(
            [c for c in contributions if c['shap_value'] < 0],
            key=lambda x: abs(x['shap_value']), reverse=True
        )

        return {
            'shap_values': contributions,
            'positive_contributors': positive_contributors[:10],
            'negative_contributors': negative_contributors[:10],
            'base_value': round(base_val, 6),
            'prediction_value': round(pred_val, 6)
        }

    def global_importance(self):
        """
        Return global feature importance based on the model's built-in 
        feature importance (faster than computing SHAP on full dataset).
        """
        try:
            # Try model's native feature importance first
            if hasattr(self.model, 'feature_importances_'):
                importances = self.model.feature_importances_
                ranking = [
                    {'feature': f, 'importance': round(float(imp), 6)}
                    for f, imp in zip(self.feature_names, importances)
                ]
                return sorted(ranking, key=lambda x: x['importance'], reverse=True)
        except Exception as e:
            logger.warning(f'Could not get native feature importance: {e}')

        # Fallback: return empty
        return [{'feature': f, 'importance': 0.0} for f in self.feature_names]
