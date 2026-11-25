"""Minimal FastAPI backend connecting the frontend to the preserved XGBoost model."""

from contextlib import asynccontextmanager
from pathlib import Path
import sys
from typing import Any, Dict, List, Literal

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parent.parent
ML_DIR = ROOT_DIR / "ml"
FRONTEND_DIR = ROOT_DIR / "frontend"

if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from predict import LoanPredictor  # noqa: E402

predictor: LoanPredictor | None = None

MODEL_DISPLAY_NAMES = {
    "LogisticRegression": "Logistic Regression",
    "DecisionTree": "Decision Tree",
    "RandomForest": "Random Forest",
    "GradientBoosting": "Gradient Boosting",
    "XGBoost": "XGBoost",
}


def get_predictor() -> LoanPredictor:
    global predictor
    if predictor is None:
        predictor = LoanPredictor()
    return predictor


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global predictor
    predictor = LoanPredictor()
    yield


app = FastAPI(
    title="Loan Eligibility Prediction API",
    version="1.0.0",
    lifespan=lifespan,
)


class LoanApplication(BaseModel):
    ApplicantIncome: float = Field(..., gt=0)
    CoapplicantIncome: float = Field(default=0.0, ge=0)
    ExistingMonthlyDebt: float = Field(default=0.0, ge=0)
    TotalAssetValue: float = Field(default=0.0, ge=0)
    LoanAmount: float = Field(..., gt=0)
    Loan_Amount_Term: float = Field(..., gt=0)
    LoanPurpose: Literal["Home", "Debt_Consolidation", "Business", "Education", "Personal"] = "Home"
    PropertyValue: float = Field(..., gt=0)
    Property_Area: Literal["Urban", "Semiurban", "Rural"]
    CreditScore: float = Field(default=700, ge=300, le=850)
    Credit_History: float = Field(default=1.0, ge=0, le=1)
    ActiveLoansCount: float = Field(default=0, ge=0)
    EmploymentType: Literal["Salaried", "Self_Employed", "Business_Owner", "Professional"] = "Salaried"
    WorkExperienceYears: float = Field(default=3, ge=0, le=60)
    Education: Literal["Post_Graduate", "Graduate", "Under_Graduate", "High_School"] = "Graduate"
    Dependents: Literal["0", "1", "2", "3+"] = "0"
    Married: Literal["Yes", "No"] = "No"


def _build_explanation(raw_pred: int, probability: float, payload: Dict[str, Any], uw: Dict[str, Any]) -> str:
    dti = uw.get("dtiRatio", 0)
    ltv = uw.get("ltvRatio", 0)
    score = int(payload.get("CreditScore", 700))
    clean_history = float(payload.get("Credit_History", 1.0)) >= 1.0

    notes: List[str] = []
    if clean_history and score >= 700:
        notes.append(f"solid credit profile (score {score}, clean repayment history)")
    elif not clean_history or score < 620:
        notes.append(f"credit risk indicators (score {score}, {'no defaults' if clean_history else 'past defaults'})")
    if dti <= 36:
        notes.append(f"healthy debt-to-income ratio ({dti:.1f}%)")
    elif dti > 45:
        notes.append(f"elevated debt-to-income ratio ({dti:.1f}%)")
    if ltv <= 80:
        notes.append(f"strong collateral coverage (LTV {ltv:.1f}%)")
    elif ltv > 90:
        notes.append(f"high loan-to-value ratio ({ltv:.1f}%)")

    detail = f" Key factors include {', '.join(notes)}." if notes else ""
    pct = probability * 100
    status_text = "Eligible" if raw_pred == 1 else "Not Eligible"
    label = "approval confidence" if raw_pred == 1 else "estimated approval probability"
    return f"The XGBoost model predicts {status_text} with {pct:.2f}% {label}.{detail}"


@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    active = get_predictor()
    return {
        "status": "healthy" if (active.model is not None and active.preprocessing_pipeline is not None) else "degraded",
        "model_loaded": active.model is not None,
        "pipeline_loaded": active.preprocessing_pipeline is not None,
        "model_name": active.model_metadata.get("name", "XGBoost_Tuned"),
    }


@app.post("/api/predict")
async def predict(application: LoanApplication) -> Dict[str, Any]:
    try:
        active = get_predictor()
        payload = application.model_dump()
        result = active.predict(payload)
        raw_pred = int(result["prediction"])
        probability = float(result["probability"])
        uw = result.get("underwriting") or {}
        return {
            "eligible": raw_pred == 1,
            "prediction": "Eligible" if raw_pred == 1 else "Not Eligible",
            "raw_prediction": raw_pred,
            "probability": probability,
            "model": result["model_name"],
            "explanation": _build_explanation(raw_pred, probability, payload, uw),
            "underwriting": uw,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


@app.get("/api/metrics")
async def get_metrics() -> Dict[str, Any]:
    recorded = LoanPredictor.get_recorded_metrics()
    raw_metrics = recorded["raw_metrics"]
    models = [
        {
            "id": key,
            "model_name": MODEL_DISPLAY_NAMES.get(key, key),
            "is_selected": key == "XGBoost",
            **values,
        }
        for key, values in raw_metrics.items()
    ]
    return {
        "models": models,
        "selected_model": {
            "id": "XGBoost",
            "model_name": "XGBoost",
            "artifact_name": recorded["metadata"].get("name", "XGBoost_Tuned"),
            "hyperparameters": recorded["best_params"],
            "metrics": raw_metrics.get("XGBoost", {}),
        },
    }


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
