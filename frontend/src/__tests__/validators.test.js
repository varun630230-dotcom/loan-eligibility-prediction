import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateLoanApplication } from '../utils/validators';

describe('Frontend Validators', () => {
  it('should validate emails correctly', () => {
    expect(validateEmail('test@loanwise.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should validate passwords correctly', () => {
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('pass')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });

  it('should validate complete loan application', () => {
    const validApp = {
      income: 5000,
      coApplicantIncome: 1000,
      existingMonthlyDebt: 500,
      totalAssetValue: 25000,
      loanAmount: 200000,
      propertyValue: 260000,
      education: 'Graduate',
      propertyArea: 'Urban',
      creditScore: 720
    };
    const { isValid, errors } = validateLoanApplication(validApp);
    expect(isValid).toBe(true);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should catch invalid fields in loan application', () => {
    const invalidApp = {
      income: -50,
      coApplicantIncome: -10,
      loanAmount: 0,
      propertyValue: 0
    };
    const { isValid, errors } = validateLoanApplication(invalidApp);
    expect(isValid).toBe(false);
    expect(errors.income).toBeDefined();
    expect(errors.loanAmount).toBeDefined();
    expect(errors.propertyValue).toBeDefined();
  });
});
