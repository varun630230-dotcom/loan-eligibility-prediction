export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateLoanApplication = (data) => {
  const errors = {};
  
  // Income validations
  if (data.income === undefined || data.income === '' || Number(data.income) <= 0) {
    errors.income = 'Applicant monthly gross income is required and must be greater than 0';
  }
  if (data.coApplicantIncome !== undefined && Number(data.coApplicantIncome) < 0) {
    errors.coApplicantIncome = 'Co-Applicant income cannot be negative';
  }
  if (data.existingMonthlyDebt !== undefined && Number(data.existingMonthlyDebt) < 0) {
    errors.existingMonthlyDebt = 'Existing monthly debt cannot be negative';
  }
  if (data.totalAssetValue !== undefined && Number(data.totalAssetValue) < 0) {
    errors.totalAssetValue = 'Total assets value cannot be negative';
  }

  // Loan & Property validations
  if (!data.loanAmount || Number(data.loanAmount) <= 0) {
    errors.loanAmount = 'Requested loan amount must be greater than 0';
  }
  if (!data.propertyValue || Number(data.propertyValue) <= 0) {
    errors.propertyValue = 'Property / Collateral market valuation is required';
  }
  if (!data.propertyArea) {
    errors.propertyArea = 'Property location area is required';
  }

  // Credit validations
  if (data.creditScore !== undefined && (Number(data.creditScore) < 300 || Number(data.creditScore) > 850)) {
    errors.creditScore = 'Credit score must be between 300 and 850';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
