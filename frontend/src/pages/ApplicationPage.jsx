import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import {
  LOAN_TERMS,
  LOAN_PURPOSES,
  EMPLOYMENT_TYPES,
  EDUCATION_OPTIONS,
  DEPENDENTS_OPTIONS,
  PROPERTY_AREAS
} from '../utils/constants';
import { validateLoanApplication } from '../utils/validators';

const ApplicationPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Employment & Personal
    employmentType: 'Salaried',
    workExperienceYears: '4',
    education: 'Graduate',
    dependents: '0',
    married: 'No',

    // Incomes & Debt
    income: '',
    coApplicantIncome: '0',
    existingMonthlyDebt: '0',
    totalAssetValue: '',

    // Loan & Property
    loanPurpose: 'Home',
    loanAmount: '',
    loanTerm: '360',
    propertyValue: '',
    propertyArea: 'Urban',

    // Credit History
    creditScore: '740',
    creditHistory: '1',
    activeLoansCount: '1'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      income: Number(formData.income),
      coApplicantIncome: Number(formData.coApplicantIncome || 0),
      existingMonthlyDebt: Number(formData.existingMonthlyDebt || 0),
      totalAssetValue: Number(formData.totalAssetValue || 0),
      loanAmount: Number(formData.loanAmount),
      loanTerm: Number(formData.loanTerm),
      propertyValue: Number(formData.propertyValue || formData.loanAmount),
      creditScore: Number(formData.creditScore || 700),
      creditHistory: Number(formData.creditHistory),
      activeLoansCount: Number(formData.activeLoansCount || 0),
      workExperienceYears: Number(formData.workExperienceYears || 0)
    };

    const { isValid, errors: validationErrors } = validateLoanApplication(dataToSubmit);
    if (!isValid) {
      setErrors(validationErrors);
      toast.error('Please review and fill all required financial fields.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const response = await api.predictions.create(dataToSubmit);
      const predictionId = response.data?.data?.id || response.data?.id;
      toast.success('Underwriting decision & SHAP explainability generated!');
      navigate(`/prediction/${predictionId}`);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to generate prediction';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-md">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span>🏦</span> Comprehensive Loan Underwriting Form
        </h1>
        <p className="mt-2 text-primary-100 text-sm max-w-2xl leading-relaxed">
          Fill in your applicant financial profile, collateral asset valuation, and credit track record. 
          Our explainable machine learning model analyzes debt-to-income (DTI), loan-to-value (LTV), and credit history to estimate eligibility.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Section 1: Employment & Professional Profile */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">1. Employment & Applicant Profile</h2>
              <p className="text-xs text-gray-500">Employment stability and background</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employment Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Employment Category</label>
              <p className="text-xs text-gray-500 mb-1.5">Select your primary source of regular income.</p>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {EMPLOYMENT_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Work Experience */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Years of Work Experience</label>
              <p className="text-xs text-gray-500 mb-1.5">Total years in your current job or business profession.</p>
              <input
                type="number"
                name="workExperienceYears"
                min="0"
                max="50"
                value={formData.workExperienceYears}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. 5"
              />
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Highest Education Level</label>
              <p className="text-xs text-gray-500 mb-1.5">Highest completed academic qualification.</p>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {EDUCATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Dependents & Marital */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800">Dependents</label>
                <p className="text-xs text-gray-500 mb-1.5">Family members dependent on you.</p>
                <select
                  name="dependents"
                  value={formData.dependents}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {DEPENDENTS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt} {opt === '0' ? 'None' : opt === '3+' ? 'or more' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800">Marital Status</label>
                <p className="text-xs text-gray-500 mb-1.5">Marital status.</p>
                <select
                  name="married"
                  value={formData.married}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="No">Single / Unmarried</option>
                  <option value="Yes">Married</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Income & Existing Debts */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <span className="text-2xl">💰</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">2. Incomes & Financial Obligations</h2>
              <p className="text-xs text-gray-500">Used to evaluate Debt-to-Income (DTI) and net cash flow</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Applicant Income */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Applicant Monthly Income ($) <span className="text-danger-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-1.5">Your gross monthly salary or regular income before deductions.</p>
              <input
                type="number"
                name="income"
                required
                min="1"
                value={formData.income}
                onChange={handleChange}
                placeholder="e.g. 6500"
                className={`w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 ${errors.income ? 'border-danger-500 bg-danger-50' : 'border-gray-300'}`}
              />
              {errors.income && <p className="text-danger-600 text-xs mt-1">{errors.income}</p>}
            </div>

            {/* Co-Applicant Income */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Co-Applicant Monthly Income ($)</label>
              <p className="text-xs text-gray-500 mb-1.5">Monthly income of spouse/guarantor (enter 0 if none).</p>
              <input
                type="number"
                name="coApplicantIncome"
                min="0"
                value={formData.coApplicantIncome}
                onChange={handleChange}
                placeholder="e.g. 2500"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Existing Monthly Debt */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Existing Monthly Debt Payments ($)</label>
              <p className="text-xs text-gray-500 mb-1.5">Total current monthly EMIs (car, personal loans, cards).</p>
              <input
                type="number"
                name="existingMonthlyDebt"
                min="0"
                value={formData.existingMonthlyDebt}
                onChange={handleChange}
                placeholder="e.g. 800"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Assets & Net Worth */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <span className="text-2xl">🏦</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">3. Assets & Financial Reserves</h2>
              <p className="text-xs text-gray-500">Assesses asset coverage ratio and emergency reserves</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800">Total Liquid Assets & Savings ($)</label>
              <p className="text-xs text-gray-500 mb-1.5">
                Total sum of bank accounts, fixed deposits, stocks, mutual funds, and investments.
              </p>
              <input
                type="number"
                name="totalAssetValue"
                min="0"
                value={formData.totalAssetValue}
                onChange={handleChange}
                placeholder="e.g. 75000"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
              <span className="text-blue-500 text-xl mt-0.5">💡</span>
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Why assets matter:</strong> Lenders look for an <em>Asset Coverage Ratio</em> $\ge 1.0\times$ to ensure applicants have sufficient reserves to service loans during unexpected economic events.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Requested Loan & Property Collateral */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <span className="text-2xl">🏠</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">4. Requested Loan & Property Details</h2>
              <p className="text-xs text-gray-500">Evaluates loan amount, tenure, and Loan-to-Value (LTV) ratio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Loan Purpose */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Loan Purpose</label>
              <p className="text-xs text-gray-500 mb-1.5">Intended application of borrowed funds.</p>
              <select
                name="loanPurpose"
                value={formData.loanPurpose}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              >
                {LOAN_PURPOSES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Requested Loan Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Requested Loan Amount ($) <span className="text-danger-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-1.5">Total principal amount to be borrowed.</p>
              <input
                type="number"
                name="loanAmount"
                required
                min="1000"
                value={formData.loanAmount}
                onChange={handleChange}
                placeholder="e.g. 250000"
                className={`w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 ${errors.loanAmount ? 'border-danger-500 bg-danger-50' : 'border-gray-300'}`}
              />
              {errors.loanAmount && <p className="text-danger-600 text-xs mt-1">{errors.loanAmount}</p>}
            </div>

            {/* Loan Term */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Loan Repayment Tenure</label>
              <p className="text-xs text-gray-500 mb-1.5">Number of months to pay back the loan.</p>
              <select
                name="loanTerm"
                value={formData.loanTerm}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              >
                {LOAN_TERMS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Property Estimated Value */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Property / Collateral Value ($) <span className="text-danger-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-1.5">Estimated market valuation of the property/collateral.</p>
              <input
                type="number"
                name="propertyValue"
                required
                min="1000"
                value={formData.propertyValue}
                onChange={handleChange}
                placeholder="e.g. 320000"
                className={`w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 ${errors.propertyValue ? 'border-danger-500 bg-danger-50' : 'border-gray-300'}`}
              />
              {errors.propertyValue && <p className="text-danger-600 text-xs mt-1">{errors.propertyValue}</p>}
            </div>

            {/* Property Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Property Area / Jurisdiction</label>
              <p className="text-xs text-gray-500 mb-1.5">Location zone of the collateral property.</p>
              <select
                name="propertyArea"
                value={formData.propertyArea}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              >
                {PROPERTY_AREAS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Credit Score & Historical Track Record */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <span className="text-2xl">📜</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">5. Credit Profile & Past Borrowing History</h2>
              <p className="text-xs text-gray-500">Bureau score, past repayment track record, and existing debt load</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Credit Score */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">
                Credit Score (FICO / CIBIL: 300 - 850)
              </label>
              <p className="text-xs text-gray-500 mb-1.5">Your official bureau credit score rating.</p>
              <input
                type="number"
                name="creditScore"
                min="300"
                max="850"
                value={formData.creditScore}
                onChange={handleChange}
                placeholder="e.g. 740"
                className={`w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-primary-500 ${errors.creditScore ? 'border-danger-500 bg-danger-50' : 'border-gray-300'}`}
              />
              {errors.creditScore && <p className="text-danger-600 text-xs mt-1">{errors.creditScore}</p>}
            </div>

            {/* Past Credit History / Defaults */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Past Repayment Record</label>
              <p className="text-xs text-gray-500 mb-1.5">Any history of 60+ day late payments or defaults?</p>
              <select
                name="creditHistory"
                value={formData.creditHistory}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="1">✅ Good Track Record (No defaults in last 3 yrs)</option>
                <option value="0">⚠️ Has Past Delinquencies / Defaults</option>
              </select>
            </div>

            {/* Active Loans Count */}
            <div>
              <label className="block text-sm font-semibold text-gray-800">Active Open Loans Count</label>
              <p className="text-xs text-gray-500 mb-1.5">How many active loan accounts are currently running?</p>
              <select
                name="activeLoansCount"
                value={formData.activeLoansCount}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="0">0 (No active loans)</option>
                <option value="1">1 active loan</option>
                <option value="2">2 active loans</option>
                <option value="3">3 active loans</option>
                <option value="4">4 or more active loans</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl text-white font-bold text-base bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Evaluating Financial Underwriting Metrics & SHAP Attributions...
              </span>
            ) : (
              <span>🚀 Evaluate Loan Eligibility & Generate SHAP Explanation</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationPage;
