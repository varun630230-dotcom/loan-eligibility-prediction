import pandas as pd
import numpy as np
import os

def generate_data(num_records=6000):
    np.random.seed(42)
    
    # 1. Identifiers
    loan_id = [f"LP00{i:04d}" for i in range(1, num_records + 1)]
    
    # 2. Incomes & Financial Obligations
    applicant_income = np.random.lognormal(mean=8.6, sigma=0.7, size=num_records)
    applicant_income = np.clip(applicant_income, 1800, 95000).astype(int)
    
    coapplicant_income = np.random.lognormal(mean=7.6, sigma=0.9, size=num_records)
    coapplicant_income[np.random.rand(num_records) < 0.45] = 0
    coapplicant_income = np.clip(coapplicant_income, 0, 45000).astype(int)
    
    total_income = applicant_income + coapplicant_income
    
    # Existing monthly debt payments (EMIs, credit card minimums)
    debt_ratio = np.random.beta(a=2, b=6, size=num_records) # centered ~0.25
    existing_monthly_debt = (total_income * debt_ratio).astype(int)
    existing_monthly_debt[np.random.rand(num_records) < 0.2] = 0
    existing_monthly_debt = np.clip(existing_monthly_debt, 0, 20000)
    
    # 3. Loan & Property Requirements
    loan_purpose = np.random.choice(
        ["Home", "Debt_Consolidation", "Business", "Education", "Personal"],
        size=num_records,
        p=[0.45, 0.20, 0.15, 0.10, 0.10]
    )
    
    loan_amount = np.random.normal(loc=220, scale=120, size=num_records)
    loan_amount = np.clip(loan_amount, 25, 1200).astype(float)
    
    loan_amount_term = np.random.choice(
        [360, 240, 180, 120, 60, 36],
        size=num_records,
        p=[0.55, 0.20, 0.12, 0.08, 0.03, 0.02]
    )
    
    property_area = np.random.choice(["Urban", "Semiurban", "Rural"], size=num_records, p=[0.38, 0.37, 0.25])
    
    # Property / Collateral estimated value (in thousands)
    ltv_factor = np.random.uniform(0.55, 1.25, size=num_records)
    property_value = np.round(loan_amount / ltv_factor, 1)
    property_value = np.clip(property_value, 35, 2500)
    
    # Total Assets Value (Bank savings + Stocks + Vehicles + Other Real Estate) in thousands
    asset_multiplier = np.random.uniform(0.4, 4.0, size=num_records)
    total_asset_value = np.round((total_income * 12 / 1000) * asset_multiplier + (property_value * 0.4), 1)
    total_asset_value = np.clip(total_asset_value, 10, 5000)
    
    # 4. Credit & Past Loan History
    credit_score = np.random.normal(loc=710, scale=85, size=num_records)
    credit_score = np.clip(credit_score, 300, 850).astype(int)
    
    # Credit history indicator: 1 = Good history/no defaults, 0 = Previous defaults/late marks
    credit_history_prob = np.where(credit_score >= 670, 0.95, np.where(credit_score >= 580, 0.65, 0.15))
    credit_history = np.where(np.random.rand(num_records) < credit_history_prob, 1.0, 0.0)
    
    active_loans_count = np.random.choice([0, 1, 2, 3, 4], size=num_records, p=[0.25, 0.40, 0.20, 0.10, 0.05])
    
    # 5. Employment & Personal Profile
    employment_type = np.random.choice(
        ["Salaried", "Self_Employed", "Business_Owner", "Professional"],
        size=num_records,
        p=[0.60, 0.18, 0.14, 0.08]
    )
    
    work_exp_years = np.random.exponential(scale=6, size=num_records).astype(int)
    work_exp_years = np.clip(work_exp_years, 0, 35)
    
    education = np.random.choice(
        ["Post_Graduate", "Graduate", "Under_Graduate", "High_School"],
        size=num_records,
        p=[0.25, 0.55, 0.12, 0.08]
    )
    
    dependents = np.random.choice(["0", "1", "2", "3+"], size=num_records, p=[0.45, 0.25, 0.20, 0.10])
    married = np.random.choice(["Yes", "No"], size=num_records, p=[0.65, 0.35])
    
    # 6. Realistic Bank Underwriting Formula
    # DTI: Debt to Income ratio
    monthly_new_emi = (loan_amount * 1000) / (loan_amount_term + 1e-5) * 1.15
    total_monthly_obligations = existing_monthly_debt + monthly_new_emi
    dti = total_monthly_obligations / (total_income + 1e-5)
    
    # LTV: Loan to Value
    ltv = loan_amount / (property_value + 1e-5)
    
    # Asset Coverage Ratio
    asset_coverage = total_asset_value / (loan_amount + 1e-5)
    
    # Composite Credit & Financial Underwriting Score
    score = np.zeros(num_records)
    
    # Credit Score & History Component
    score += (credit_score - 650) / 45.0  # +4.4 to -7.7
    score += np.where(credit_history == 1.0, 1.8, -3.2)
    
    # DTI Component
    score += np.where(dti <= 0.36, 1.6, np.where(dti <= 0.45, 0.4, np.where(dti <= 0.55, -1.5, -4.0)))
    
    # LTV Component
    score += np.where(ltv <= 0.75, 1.4, np.where(ltv <= 0.85, 0.5, np.where(ltv <= 0.95, -0.8, -2.5)))
    
    # Asset Coverage Component
    score += np.where(asset_coverage >= 2.0, 1.2, np.where(asset_coverage >= 1.0, 0.5, -0.8))
    
    # Work experience & employment stability
    score += np.where(work_exp_years >= 3, 0.6, np.where(work_exp_years >= 1, 0.2, -0.5))
    score += np.where(active_loans_count <= 2, 0.4, -1.0)
    
    # Add natural variation / unobserved factors
    noise = np.random.normal(loc=0, scale=0.8, size=num_records)
    score += noise
    
    prob = 1.0 / (1.0 + np.exp(-score))
    loan_status = np.where(prob >= 0.50, 'Y', 'N')
    
    # Create DataFrame
    df = pd.DataFrame({
        'Loan_ID': loan_id,
        'ApplicantIncome': applicant_income,
        'CoapplicantIncome': coapplicant_income,
        'ExistingMonthlyDebt': existing_monthly_debt,
        'TotalAssetValue': total_asset_value,
        'LoanAmount': loan_amount,
        'Loan_Amount_Term': loan_amount_term,
        'LoanPurpose': loan_purpose,
        'PropertyValue': property_value,
        'CreditScore': credit_score,
        'Credit_History': credit_history,
        'ActiveLoansCount': active_loans_count,
        'EmploymentType': employment_type,
        'WorkExperienceYears': work_exp_years,
        'Education': education,
        'Dependents': dependents,
        'Property_Area': property_area,
        'Married': married,
        'Loan_Status': loan_status
    })
    
    # Introduce small realistic missingness (3-5%) on non-critical self-reported features
    missing_candidates = ['CoapplicantIncome', 'ExistingMonthlyDebt', 'WorkExperienceYears', 'Dependents']
    for col in missing_candidates:
        mask = np.random.rand(num_records) < 0.03
        df.loc[mask, col] = np.nan
        
    os.makedirs('ml-service/data', exist_ok=True)
    df.to_csv('ml-service/data/loan_data.csv', index=False)
    print(f"Generated realistic loan_data.csv with {num_records} records. Approval rate: {(df['Loan_Status'] == 'Y').mean():.2%}")

if __name__ == "__main__":
    generate_data()
