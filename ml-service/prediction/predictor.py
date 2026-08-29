import os
import json
import logging
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / 'models'
ARTIFACTS_DIR = BASE_DIR / 'artifacts'

class LoanPredictor:
    def __init__(self):
        self.model = None
        self.preprocessing_pipeline = None
        self.feature_names = None
        self.model_metadata = None
        self.explainer = None
        self._load_artifacts()
    
    def _load_artifacts(self):
        """Load model, preprocessing pipeline, and metadata."""
        # Load best model
        model_path = MODELS_DIR / 'best_model.joblib'
        if not model_path.exists():
            logger.warning(f'Model not found at {model_path}')
        else:
            self.model = joblib.load(model_path)
            logger.info(f'Loaded model from {model_path}')
        
        # Load preprocessing pipeline
        pipeline_path = MODELS_DIR / 'preprocessing_pipeline.joblib'
        if not pipeline_path.exists():
            logger.warning(f'Pipeline not found at {pipeline_path}')
        else:
            self.preprocessing_pipeline = joblib.load(pipeline_path)
            logger.info(f'Loaded preprocessing pipeline')
        
        # Load feature names
        features_path = MODELS_DIR / 'feature_names.json'
        if features_path.exists():
            with open(features_path, 'r') as f:
                self.feature_names = json.load(f)
        
        # Load model metadata
        metadata_path = MODELS_DIR / 'model_metadata.json'
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                self.model_metadata = json.load(f)
        else:
            self.model_metadata = {
                'model_name': 'XGBoost_Tuned',
                'model_version': '2.0',
                'training_date': 'Unknown',
                'description': 'Advanced Banking Underwriting ML Model'
            }
        
        # Initialize SHAP explainer if model exists
        if self.model:
            try:
                from explainability.shap_explainer import LoanExplainer
                self.explainer = LoanExplainer(self.model, self.feature_names)
                logger.info('SHAP explainer initialized')
            except Exception as e:
                logger.warning(f'SHAP explainer initialization error: {e}')
    
    def _prepare_input(self, data: dict) -> pd.DataFrame:
        """Convert input dict to DataFrame with underwriting fields."""
        # Normalize and set defaults
        cleaned = {
            'ApplicantIncome': float(data.get('ApplicantIncome', 5000)),
            'CoapplicantIncome': float(data.get('CoapplicantIncome', 0)),
            'ExistingMonthlyDebt': float(data.get('ExistingMonthlyDebt', 0)),
            'TotalAssetValue': float(data.get('TotalAssetValue', data.get('LoanAmount', 150) * 1.2)),
            'LoanAmount': float(data.get('LoanAmount', 150)),
            'Loan_Amount_Term': float(data.get('Loan_Amount_Term', 360)),
            'LoanPurpose': str(data.get('LoanPurpose', 'Home')),
            'PropertyValue': float(data.get('PropertyValue', data.get('LoanAmount', 150) * 1.25)),
            'CreditScore': float(data.get('CreditScore', 720 if float(data.get('Credit_History', 1)) == 1 else 550)),
            'Credit_History': float(data.get('Credit_History', 1.0)),
            'ActiveLoansCount': float(data.get('ActiveLoansCount', 1)),
            'EmploymentType': str(data.get('EmploymentType', 'Salaried')),
            'WorkExperienceYears': float(data.get('WorkExperienceYears', 4)),
            'Education': str(data.get('Education', 'Graduate')),
            'Dependents': str(data.get('Dependents', '0')),
            'Property_Area': str(data.get('Property_Area', 'Urban')),
            'Married': str(data.get('Married', 'No'))
        }
        
        df = pd.DataFrame([cleaned])
        return df
    
    def compute_underwriting_metrics(self, data: dict) -> dict:
        """Calculate standard financial ratios for transparent decision support."""
        app_inc = float(data.get('ApplicantIncome', 0))
        co_inc = float(data.get('CoapplicantIncome', 0))
        tot_inc = app_inc + co_inc
        loan_amt_k = float(data.get('LoanAmount', 0)) # in thousands
        term = float(data.get('Loan_Amount_Term', 360))
        exist_debt = float(data.get('ExistingMonthlyDebt', 0))
        prop_val_k = float(data.get('PropertyValue', loan_amt_k))
        assets_k = float(data.get('TotalAssetValue', 0))
        
        # Monthly EMI calculation (amortization factor ~1.15)
        new_emi = ((loan_amt_k * 1000) / (term + 1e-5)) * 1.15
        total_monthly_obligations = exist_debt + new_emi
        
        dti = (total_monthly_obligations / (tot_inc + 1e-5)) * 100
        ltv = (loan_amt_k / (prop_val_k + 1e-5)) * 100
        asset_coverage = (assets_k / (loan_amt_k + 1e-5))
        disposable_income = tot_inc - total_monthly_obligations
        
        return {
            'totalMonthlyIncome': round(tot_inc, 2),
            'estimatedNewEMI': round(new_emi, 2),
            'totalMonthlyDebt': round(total_monthly_obligations, 2),
            'dtiRatio': round(dti, 2),
            'ltvRatio': round(ltv, 2),
            'assetCoverage': round(asset_coverage, 2),
            'disposableIncome': round(disposable_income, 2)
        }

    def predict(self, data: dict) -> dict:
        """Make a prediction for a loan application."""
        if not self.model or not self.preprocessing_pipeline:
            raise RuntimeError("Model or pipeline not loaded")
            
        df = self._prepare_input(data)
        X_processed = self.preprocessing_pipeline.transform(df)
        
        prediction = int(self.model.predict(X_processed)[0])
        probability = float(self.model.predict_proba(X_processed)[0][1])
        underwriting = self.compute_underwriting_metrics(data)
        
        return {
            'prediction': prediction,
            'probability': probability,
            'model_name': self.model_metadata.get('model_name', 'XGBoost_Tuned'),
            'underwriting': underwriting
        }
    
    def explain(self, data: dict) -> dict:
        """Get SHAP explanation for a prediction."""
        if not self.model or not self.preprocessing_pipeline or not self.explainer:
            raise RuntimeError("Model, pipeline, or explainer not loaded")
            
        df = self._prepare_input(data)
        X_processed = self.preprocessing_pipeline.transform(df)
        
        prediction = int(self.model.predict(X_processed)[0])
        probability = float(self.model.predict_proba(X_processed)[0][1])
        
        explanation = self.explainer.explain_prediction(X_processed, data)
        explanation['prediction'] = prediction
        explanation['probability'] = probability
        explanation['underwriting'] = self.compute_underwriting_metrics(data)
        
        return explanation
    
    def get_model_info(self) -> dict:
        """Return model metadata."""
        return {
            'model_name': self.model_metadata.get('model_name', 'XGBoost_Tuned'),
            'model_version': self.model_metadata.get('model_version', '2.0'),
            'training_date': self.model_metadata.get('training_date', 'Unknown'),
            'features': self.feature_names or [],
            'description': self.model_metadata.get('description', 
                'Comprehensive Tabular Underwriting ML Model with SHAP explainability')
        }
    
    def get_metrics(self) -> dict:
        """Return model metrics."""
        metrics_path = ARTIFACTS_DIR / 'all_models_metrics.json'
        all_metrics_list = []
        best_model = {}
        
        if metrics_path.exists():
            with open(metrics_path, 'r') as f:
                raw_metrics = json.load(f)
            
            if isinstance(raw_metrics, dict):
                best_f1 = 0
                for model_name, metrics in raw_metrics.items():
                    entry = {'model_name': model_name, **metrics}
                    all_metrics_list.append(entry)
                    if metrics.get('test_f1', 0) > best_f1:
                        best_f1 = metrics['test_f1']
                        best_model = entry
            elif isinstance(raw_metrics, list):
                all_metrics_list = raw_metrics
                for m in all_metrics_list:
                    if m.get('is_best', False):
                        best_model = m
                        break
        
        importance = self.explainer.global_importance() if self.explainer else []
        
        return {
            'models': all_metrics_list,
            'best_model': best_model,
            'feature_importance': importance
        }
