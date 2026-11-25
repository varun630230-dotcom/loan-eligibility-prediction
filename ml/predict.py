"""Inference wrapper for the preserved XGBoost model and preprocessing pipeline."""

import json
from pathlib import Path
import sys
import joblib
import pandas as pd

ML_DIR = Path(__file__).resolve().parent
MODELS_DIR = ML_DIR / "models"
ARTIFACTS_DIR = ML_DIR / "artifacts"

# Ensure preprocessing.preprocessing resolves cleanly during joblib unpickling
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))


class LoanPredictor:
    def __init__(self):
        self.model = joblib.load(MODELS_DIR / "best_model.joblib")
        self.preprocessing_pipeline = joblib.load(MODELS_DIR / "preprocessing_pipeline.joblib")

        metadata_path = MODELS_DIR / "model_metadata.json"
        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.model_metadata = json.load(f)
        else:
            self.model_metadata = {"name": "XGBoost_Tuned"}

    @staticmethod
    def _prepare_input(data: dict) -> pd.DataFrame:
        loan_amt = float(data.get("LoanAmount", 150))
        credit_history = float(data.get("Credit_History", 1.0))
        cleaned = {
            "ApplicantIncome": float(data.get("ApplicantIncome", 5000)),
            "CoapplicantIncome": float(data.get("CoapplicantIncome", 0)),
            "ExistingMonthlyDebt": float(data.get("ExistingMonthlyDebt", 0)),
            "TotalAssetValue": float(data.get("TotalAssetValue", loan_amt * 1.2)),
            "LoanAmount": loan_amt,
            "Loan_Amount_Term": float(data.get("Loan_Amount_Term", 360)),
            "LoanPurpose": str(data.get("LoanPurpose", "Home")),
            "PropertyValue": float(data.get("PropertyValue", loan_amt * 1.25)),
            "CreditScore": float(data.get("CreditScore", 720 if credit_history == 1 else 550)),
            "Credit_History": credit_history,
            "ActiveLoansCount": float(data.get("ActiveLoansCount", 1)),
            "EmploymentType": str(data.get("EmploymentType", "Salaried")),
            "WorkExperienceYears": float(data.get("WorkExperienceYears", 4)),
            "Education": str(data.get("Education", "Graduate")),
            "Dependents": str(data.get("Dependents", "0")),
            "Property_Area": str(data.get("Property_Area", "Urban")),
            "Married": str(data.get("Married", "No")),
        }
        return pd.DataFrame([cleaned])

    @staticmethod
    def compute_underwriting_metrics(data: dict) -> dict:
        app_inc = float(data.get("ApplicantIncome", 0))
        co_inc = float(data.get("CoapplicantIncome", 0))
        tot_inc = app_inc + co_inc
        loan_amt_k = float(data.get("LoanAmount", 0))
        term = float(data.get("Loan_Amount_Term", 360))
        exist_debt = float(data.get("ExistingMonthlyDebt", 0))
        prop_val_k = float(data.get("PropertyValue", loan_amt_k))
        assets_k = float(data.get("TotalAssetValue", 0))

        new_emi = ((loan_amt_k * 1000) / (term + 1e-5)) * 1.15
        total_debt = exist_debt + new_emi

        return {
            "totalMonthlyIncome": round(tot_inc, 2),
            "estimatedNewEMI": round(new_emi, 2),
            "totalMonthlyDebt": round(total_debt, 2),
            "dtiRatio": round((total_debt / (tot_inc + 1e-5)) * 100, 2),
            "ltvRatio": round((loan_amt_k / (prop_val_k + 1e-5)) * 100, 2),
            "assetCoverage": round(assets_k / (loan_amt_k + 1e-5), 2),
            "disposableIncome": round(tot_inc - total_debt, 2),
        }

    def predict(self, data: dict) -> dict:
        df = self._prepare_input(data)
        X_processed = self.preprocessing_pipeline.transform(df)
        prediction = int(self.model.predict(X_processed)[0])
        probability = float(self.model.predict_proba(X_processed)[0][1])

        return {
            "prediction": prediction,
            "probability": probability,
            "model_name": self.model_metadata.get("name", "XGBoost_Tuned"),
            "underwriting": self.compute_underwriting_metrics(data),
        }

    @staticmethod
    def get_recorded_metrics() -> dict:
        with open(ARTIFACTS_DIR / "all_models_metrics.json", "r", encoding="utf-8") as f:
            raw_metrics = json.load(f)

        best_params = {}
        params_path = ARTIFACTS_DIR / "best_params.json"
        if params_path.exists():
            with open(params_path, "r", encoding="utf-8") as f:
                best_params = json.load(f)

        metadata = {}
        meta_path = MODELS_DIR / "model_metadata.json"
        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)

        return {
            "raw_metrics": raw_metrics,
            "best_params": best_params,
            "metadata": metadata,
        }
