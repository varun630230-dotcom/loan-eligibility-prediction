import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

client = TestClient(app)

valid_payload = {
    "ApplicantIncome": 6000,
    "CoapplicantIncome": 1500,
    "ExistingMonthlyDebt": 500,
    "TotalAssetValue": 80,
    "LoanAmount": 200,
    "Loan_Amount_Term": 360,
    "LoanPurpose": "Home",
    "PropertyValue": 280,
    "Property_Area": "Urban",
    "CreditScore": 740,
    "Credit_History": 1.0,
    "ActiveLoansCount": 1,
    "EmploymentType": "Salaried",
    "WorkExperienceYears": 5,
    "Education": "Graduate",
    "Dependents": "0",
    "Married": "Yes"
}

@pytest.fixture
def mock_predictor():
    with patch('app.predictor') as mock:
        yield mock

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_predict_valid_input(mock_predictor):
    mock_predictor.predict.return_value = {
        'prediction': 1,
        'probability': 0.89,
        'model_name': 'XGBoost_Tuned',
        'underwriting': {'dtiRatio': 31.0, 'ltvRatio': 71.4}
    }
    
    response = client.post("/predict", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "Likely Eligible"
    assert data["probability"] == 0.89
    assert data["model"] == "XGBoost_Tuned"
    assert "underwriting" in data

def test_predict_invalid_input():
    invalid_payload = valid_payload.copy()
    invalid_payload["ApplicantIncome"] = -100 # Invalid
    
    response = client.post("/predict", json=invalid_payload)
    assert response.status_code == 422 # Validation error

def test_explain_valid_input(mock_predictor):
    mock_predictor.explain.return_value = {
        'prediction': 1,
        'probability': 0.89,
        'shap_values': [{'feature': 'CreditScore', 'value': 740, 'shap_value': 0.4}],
        'positive_contributors': [{'feature': 'CreditScore', 'value': 740, 'shap_value': 0.4}],
        'negative_contributors': [],
        'base_value': 0.5,
        'underwriting': {'dtiRatio': 31.0}
    }
    
    response = client.post("/explain", json=valid_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "Likely Eligible"
    assert data["probability"] == 0.89
    assert "shap_values" in data
    assert "positive_contributors" in data
    assert "negative_contributors" in data
    assert "base_value" in data
    assert "underwriting" in data

def test_model_info(mock_predictor):
    mock_predictor.get_model_info.return_value = {
        'model_name': 'XGBoost_Tuned',
        'model_version': '2.0',
        'training_date': '2026-08-23',
        'features': ['ApplicantIncome_log', 'DTI_Ratio'],
        'description': 'Underwriting ML model'
    }
    
    response = client.get("/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "XGBoost_Tuned"

def test_metrics(mock_predictor):
    mock_predictor.get_metrics.return_value = {
        'models': [{'model_name': 'XGBoost_Tuned', 'test_f1': 0.96}],
        'best_model': {'model_name': 'XGBoost_Tuned', 'test_f1': 0.96},
        'feature_importance': [{'feature': 'CreditScore', 'importance': 0.35}]
    }
    
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "best_model" in data
    assert "feature_importance" in data
