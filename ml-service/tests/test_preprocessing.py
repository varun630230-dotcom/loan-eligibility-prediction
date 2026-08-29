import os
import sys
import pytest
import pandas as pd
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from preprocessing.preprocessing import LoanPreprocessor, UnderwritingFeatureEngineer

@pytest.fixture
def sample_raw_data():
    return pd.DataFrame([{
        'ApplicantIncome': 6000,
        'CoapplicantIncome': 1500,
        'ExistingMonthlyDebt': 500,
        'TotalAssetValue': 70,
        'LoanAmount': 200,
        'Loan_Amount_Term': 360,
        'LoanPurpose': 'Home',
        'PropertyValue': 260,
        'CreditScore': 720,
        'Credit_History': 1.0,
        'ActiveLoansCount': 1,
        'EmploymentType': 'Salaried',
        'WorkExperienceYears': 4,
        'Education': 'Graduate',
        'Dependents': '0',
        'Property_Area': 'Urban',
        'Married': 'Yes'
    }])

def test_underwriting_feature_engineer(sample_raw_data):
    fe = UnderwritingFeatureEngineer()
    engineered = fe.transform(sample_raw_data[fe.num_input_cols])
    
    assert 'DTI_Ratio' in engineered.columns
    assert 'LTV_Ratio' in engineered.columns
    assert 'AssetCoverageRatio' in engineered.columns
    assert 'DisposableIncome' in engineered.columns
    assert 'EstimatedNewEMI' in engineered.columns

def test_loan_preprocessor_fit_transform(sample_raw_data):
    preprocessor = LoanPreprocessor()
    transformed = preprocessor.fit_transform(sample_raw_data)
    
    assert isinstance(transformed, pd.DataFrame)
    assert len(transformed) == 1
    assert len(preprocessor.feature_names) > 0
