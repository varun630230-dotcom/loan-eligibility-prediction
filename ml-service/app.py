import os
import json
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="LoanWise ML Underwriting Service",
    description="Explainable Machine Learning prediction and underwriting service for loan eligibility",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('ALLOWED_ORIGINS', 'http://localhost:5000,http://localhost:3000').split(','),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Pydantic models
class LoanApplication(BaseModel):
    # Financials
    ApplicantIncome: float = Field(..., gt=0, description="Applicant monthly gross income")
    CoapplicantIncome: float = Field(default=0.0, ge=0, description="Co-applicant monthly gross income")
    ExistingMonthlyDebt: float = Field(default=0.0, ge=0, description="Existing monthly debt and EMI payments")
    TotalAssetValue: float = Field(default=0.0, ge=0, description="Total estimated liquid assets and savings (in thousands)")
    
    # Loan Request & Property
    LoanAmount: float = Field(..., gt=0, description="Requested loan amount (in thousands)")
    Loan_Amount_Term: float = Field(..., gt=0, description="Requested tenure (months)")
    LoanPurpose: str = Field(default="Home", description="Purpose: Home, Debt_Consolidation, Business, Education, Personal")
    PropertyValue: float = Field(..., gt=0, description="Estimated property or collateral market value (in thousands)")
    Property_Area: str = Field(..., description="Urban, Semiurban, or Rural")
    
    # Credit History
    CreditScore: float = Field(default=700, ge=300, le=850, description="FICO/CIBIL Credit score (300-850)")
    Credit_History: float = Field(default=1.0, ge=0, le=1, description="Past credit history (1.0 = No default, 0.0 = Has defaulted)")
    ActiveLoansCount: float = Field(default=0, ge=0, description="Count of currently active loans")
    
    # Employment & Personal
    EmploymentType: str = Field(default="Salaried", description="Salaried, Self_Employed, Business_Owner, Professional")
    WorkExperienceYears: float = Field(default=3, ge=0, description="Years in current profession/job")
    Education: str = Field(default="Graduate", description="Post_Graduate, Graduate, Under_Graduate, High_School")
    Dependents: str = Field(default='0', description="Number of dependents (0, 1, 2, 3+)")
    Married: str = Field(default='No', description="Yes or No")


class UnderwritingMetrics(BaseModel):
    totalMonthlyIncome: float
    estimatedNewEMI: float
    totalMonthlyDebt: float
    dtiRatio: float
    ltvRatio: float
    assetCoverage: float
    disposableIncome: float


class PredictionResponse(BaseModel):
    prediction: str
    probability: float
    model: str
    message: str
    underwriting: Optional[Dict[str, Any]] = None


class ExplanationResponse(BaseModel):
    prediction: str
    probability: float
    shap_values: List[Dict[str, Any]]
    positive_contributors: List[Dict[str, Any]]
    negative_contributors: List[Dict[str, Any]]
    base_value: float
    underwriting: Optional[Dict[str, Any]] = None


class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    training_date: str
    features: List[str]
    description: str


class MetricsResponse(BaseModel):
    models: List[Dict[str, Any]]
    best_model: Dict[str, Any]
    feature_importance: List[Dict[str, Any]]


# Global model objects
predictor = None

@app.on_event('startup')
async def load_models():
    global predictor
    try:
        from prediction.predictor import LoanPredictor
        predictor = LoanPredictor()
        logger.info('Predictor initialized successfully')
    except Exception as e:
        logger.error(f'Startup model loading error: {e}')


@app.get('/health')
async def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'model_loaded': predictor is not None and predictor.model is not None
    }


@app.post('/predict', response_model=PredictionResponse)
async def predict(application: LoanApplication):
    try:
        app_dict = application.model_dump() if hasattr(application, 'model_dump') else application.dict()
        result = predictor.predict(app_dict)
        prediction_label = 'Likely Eligible' if result['prediction'] == 1 else 'Likely Not Eligible'
        probability = float(result['probability'])
        
        message = (
            'The underwriting model estimates a high likelihood of loan approval based on debt-to-income, credit metrics, and collateral coverage.'
            if result['prediction'] == 1
            else 'The underwriting model estimates a low likelihood of loan approval. Elevated debt ratios, credit risk, or collateral constraints may be present.'
        )
        
        return PredictionResponse(
            prediction=prediction_label,
            probability=round(probability, 4),
            model=result['model_name'],
            message=message,
            underwriting=result.get('underwriting')
        )
    except Exception as e:
        logger.error(f'Prediction error: {str(e)}')
        raise HTTPException(status_code=500, detail=f'Prediction failed: {str(e)}')


@app.post('/explain', response_model=ExplanationResponse)
async def explain(application: LoanApplication):
    try:
        app_dict = application.model_dump() if hasattr(application, 'model_dump') else application.dict()
        result = predictor.explain(app_dict)
        prediction_label = 'Likely Eligible' if result['prediction'] == 1 else 'Likely Not Eligible'
        
        return ExplanationResponse(
            prediction=prediction_label,
            probability=round(float(result['probability']), 4),
            shap_values=result['shap_values'],
            positive_contributors=result['positive_contributors'],
            negative_contributors=result['negative_contributors'],
            base_value=round(float(result['base_value']), 6),
            underwriting=result.get('underwriting')
        )
    except Exception as e:
        logger.error(f'Explanation error: {str(e)}')
        raise HTTPException(status_code=500, detail=f'Explanation generation failed: {str(e)}')


@app.get('/model-info', response_model=ModelInfoResponse)
async def model_info():
    try:
        info = predictor.get_model_info()
        return ModelInfoResponse(**info)
    except Exception as e:
        logger.error(f'Model info error: {str(e)}')
        raise HTTPException(status_code=500, detail='Could not retrieve model information.')


@app.get('/metrics', response_model=MetricsResponse)
async def metrics():
    try:
        metrics_data = predictor.get_metrics()
        return MetricsResponse(**metrics_data)
    except Exception as e:
        logger.error(f'Metrics error: {str(e)}')
        raise HTTPException(status_code=500, detail='Could not retrieve metrics.')
