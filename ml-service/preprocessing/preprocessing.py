import pandas as pd
import numpy as np
import joblib
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.base import BaseEstimator, TransformerMixin
import os

class UnderwritingFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Computes standard banking underwriting metrics:
    - Debt-to-Income (DTI) Ratio
    - Loan-to-Value (LTV) Ratio
    - Asset Coverage Ratio
    - Estimated Monthly Installment (EMI)
    - Net Disposable Income
    - Normalized Credit Metric
    """
    def __init__(self):
        self.num_input_cols = [
            'ApplicantIncome', 'CoapplicantIncome', 'ExistingMonthlyDebt',
            'TotalAssetValue', 'LoanAmount', 'Loan_Amount_Term',
            'PropertyValue', 'CreditScore', 'Credit_History',
            'ActiveLoansCount', 'WorkExperienceYears'
        ]

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X_df = pd.DataFrame(X, columns=self.num_input_cols)
        
        # 1. Income aggregation
        total_income = X_df['ApplicantIncome'] + X_df['CoapplicantIncome']
        
        # 2. Estimated monthly payment for requested loan (approximate amortization factor)
        estimated_new_emi = (X_df['LoanAmount'] * 1000) / (X_df['Loan_Amount_Term'] + 1e-5) * 1.15
        
        # 3. Total monthly debt obligations (existing + new)
        total_monthly_debt = X_df['ExistingMonthlyDebt'] + estimated_new_emi
        
        # 4. Debt-to-Income (DTI) ratio
        dti_ratio = total_monthly_debt / (total_income + 1e-5)
        
        # 5. Loan-to-Value (LTV) ratio
        ltv_ratio = X_df['LoanAmount'] / (X_df['PropertyValue'] + 1e-5)
        
        # 6. Asset Coverage ratio
        asset_coverage = X_df['TotalAssetValue'] / (X_df['LoanAmount'] + 1e-5)
        
        # 7. Net Disposable Monthly Income
        disposable_income = total_income - total_monthly_debt
        
        # Output DataFrame with calculated features
        X_out = pd.DataFrame({
            'ApplicantIncome_log': np.log1p(X_df['ApplicantIncome']),
            'TotalIncome_log': np.log1p(total_income),
            'LoanAmount_log': np.log1p(X_df['LoanAmount']),
            'PropertyValue_log': np.log1p(X_df['PropertyValue']),
            'TotalAssetValue_log': np.log1p(X_df['TotalAssetValue']),
            'ExistingMonthlyDebt': X_df['ExistingMonthlyDebt'],
            'Loan_Amount_Term': X_df['Loan_Amount_Term'],
            'CreditScore': X_df['CreditScore'],
            'Credit_History': X_df['Credit_History'],
            'ActiveLoansCount': X_df['ActiveLoansCount'],
            'WorkExperienceYears': X_df['WorkExperienceYears'],
            'DTI_Ratio': dti_ratio,
            'LTV_Ratio': ltv_ratio,
            'AssetCoverageRatio': asset_coverage,
            'DisposableIncome': disposable_income,
            'EstimatedNewEMI': estimated_new_emi
        })
        
        return X_out


class LoanPreprocessor:
    def __init__(self):
        self.num_cols = [
            'ApplicantIncome', 'CoapplicantIncome', 'ExistingMonthlyDebt',
            'TotalAssetValue', 'LoanAmount', 'Loan_Amount_Term',
            'PropertyValue', 'CreditScore', 'Credit_History',
            'ActiveLoansCount', 'WorkExperienceYears'
        ]
        self.ohe_cols = [
            'LoanPurpose', 'EmploymentType', 'Education', 'Property_Area', 'Dependents'
        ]
        self.le_cols = ['Married']
        
        num_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('engineer', UnderwritingFeatureEngineer()),
            ('scaler', StandardScaler())
        ])
        
        ohe_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('ohe', OneHotEncoder(sparse_output=False, handle_unknown='ignore'))
        ])
        
        le_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('le', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1))
        ])
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', num_pipeline, self.num_cols),
                ('ohe', ohe_pipeline, self.ohe_cols),
                ('le', le_pipeline, self.le_cols)
            ], remainder='drop'
        )
        self.feature_names = []

    def fit(self, df):
        self.preprocessor.fit(df)
        
        num_features = [
            'ApplicantIncome_log', 'TotalIncome_log', 'LoanAmount_log',
            'PropertyValue_log', 'TotalAssetValue_log', 'ExistingMonthlyDebt',
            'Loan_Amount_Term', 'CreditScore', 'Credit_History',
            'ActiveLoansCount', 'WorkExperienceYears', 'DTI_Ratio',
            'LTV_Ratio', 'AssetCoverageRatio', 'DisposableIncome', 'EstimatedNewEMI'
        ]
        ohe_features = list(self.preprocessor.named_transformers_['ohe'].named_steps['ohe'].get_feature_names_out(self.ohe_cols))
        le_features = self.le_cols
        
        self.feature_names = num_features + ohe_features + le_features
        return self

    def transform(self, df):
        X_trans = self.preprocessor.transform(df)
        return pd.DataFrame(X_trans, columns=self.feature_names, index=df.index)
        
    def fit_transform(self, df):
        self.fit(df)
        return self.transform(df)

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self, path)

    @staticmethod
    def load(path):
        return joblib.load(path)
