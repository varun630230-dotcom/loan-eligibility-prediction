import os
import sys
import pytest

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from prediction.predictor import LoanPredictor

@pytest.fixture
def predictor():
    return LoanPredictor()

@pytest.fixture
def valid_application():
    return {
        'ApplicantIncome': 6500,
        'CoapplicantIncome': 2000,
        'ExistingMonthlyDebt': 600,
        'TotalAssetValue': 80,
        'LoanAmount': 250,
        'Loan_Amount_Term': 360,
        'LoanPurpose': 'Home',
        'PropertyValue': 320,
        'CreditScore': 740,
        'Credit_History': 1.0,
        'ActiveLoansCount': 1,
        'EmploymentType': 'Salaried',
        'WorkExperienceYears': 5,
        'Education': 'Graduate',
        'Dependents': '0',
        'Property_Area': 'Urban',
        'Married': 'Yes'
    }

def test_valid_prediction(predictor, valid_application):
    result = predictor.predict(valid_application)
    assert 'prediction' in result
    assert result['prediction'] in [0, 1]
    assert 'probability' in result
    assert 0.0 <= result['probability'] <= 1.0
    assert 'model_name' in result
    assert 'underwriting' in result
    assert 'dtiRatio' in result['underwriting']
    assert 'ltvRatio' in result['underwriting']

def test_explain_prediction(predictor, valid_application):
    result = predictor.explain(valid_application)
    assert 'shap_values' in result
    assert 'positive_contributors' in result
    assert 'negative_contributors' in result
    assert 'base_value' in result
    assert 'prediction' in result
    assert 'probability' in result
    assert len(result['shap_values']) > 0
    assert 'underwriting' in result

def test_model_info(predictor):
    info = predictor.get_model_info()
    assert 'model_name' in info
    assert 'model_version' in info
    assert 'features' in info
    assert len(info['features']) > 0

def test_metrics(predictor):
    metrics = predictor.get_metrics()
    assert 'models' in metrics
    assert 'best_model' in metrics
    assert 'feature_importance' in metrics
