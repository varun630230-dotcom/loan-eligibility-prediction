import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SHAPChart from '../components/prediction/SHAPChart';
import ContributionBar from '../components/prediction/ContributionBar';
import { formatPercentage, formatCurrency } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const PredictionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await api.predictions.getById(id);
        setData(response.data?.data || response.data);
      } catch (error) {
        toast.error('Failed to load prediction details');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, [id, navigate]);

  if (loading) return <LoadingSpinner text="Loading Underwriting Report & SHAP Breakdown..." />;
  if (!data) return null;

  const isEligible = data.prediction === 'Likely Eligible';
  const probability = parseFloat(data.probability) || 0;
  const applicant = data.Applicant || {};

  // Compute or extract key financial underwriting metrics
  const monthlyIncome = parseFloat(applicant.income || 0) + parseFloat(applicant.coApplicantIncome || 0);
  const loanAmount = parseFloat(applicant.loanAmount || 0);
  const loanTerm = parseFloat(applicant.loanTerm || 360);
  const existingDebt = parseFloat(applicant.existingMonthlyDebt || 0);
  const propertyVal = parseFloat(applicant.propertyValue || (loanAmount * 1.25));
  const assetsVal = parseFloat(applicant.totalAssetValue || 0);
  const creditScore = parseInt(applicant.creditScore || 700, 10);

  const estimatedEMI = (loanAmount / (loanTerm + 1e-5)) * 1.15;
  const totalDebt = existingDebt + estimatedEMI;
  const dti = monthlyIncome > 0 ? (totalDebt / monthlyIncome) * 100 : 0;
  const ltv = propertyVal > 0 ? (loanAmount / propertyVal) * 100 : 0;
  const assetCoverage = loanAmount > 0 ? (assetsVal / loanAmount) : 0;
  const disposable = monthlyIncome - totalDebt;

  // Extract SHAP explanations
  const explanations = data.PredictionExplanations || [];
  const positiveFactors = explanations
    .filter(e => e.contributionType === 'positive' && parseFloat(e.shapValue) > 0)
    .sort((a, b) => Math.abs(parseFloat(b.shapValue)) - Math.abs(parseFloat(a.shapValue)))
    .slice(0, 8);

  const negativeFactors = explanations
    .filter(e => e.contributionType === 'negative' && parseFloat(e.shapValue) < 0)
    .sort((a, b) => Math.abs(parseFloat(b.shapValue)) - Math.abs(parseFloat(a.shapValue)))
    .slice(0, 8);

  const shapData = explanations
    .map(e => ({
      feature: e.featureName,
      value: parseFloat(e.shapValue),
      originalValue: e.featureValue
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 15);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back Button & Title */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/history')}
          className="text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-lg border shadow-sm"
        >
          &larr; Back to History
        </button>
        <span className="text-xs text-gray-400">Application Reference #{data.id}</span>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`p-8 text-center ${isEligible ? 'bg-gradient-to-b from-success-50 via-white to-white' : 'bg-gradient-to-b from-danger-50 via-white to-white'}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Automated Underwriting Decision</p>
          <div className="mb-4">
            <span className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xl font-bold ${isEligible ? 'bg-success-500 text-white shadow-success-200' : 'bg-danger-500 text-white shadow-danger-200'} shadow-md`}>
              <span>{isEligible ? '✅' : '❌'}</span>
              {data.prediction}
            </span>
          </div>
          <div className="text-6xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {formatPercentage(probability)}
          </div>
          <p className="text-sm font-medium text-gray-600 max-w-lg mx-auto">
            {data.message || (isEligible 
              ? 'High estimated probability of approval based on credit rating, debt service capacity, and collateral valuation.' 
              : 'Low estimated probability of approval due to financial constraints, elevated debt ratio, or credit history.')}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-400">
            <span>Model: {data.modelName || 'XGBoost_Tuned'}</span>
            <span>•</span>
            <span>Decision Version: 2.0</span>
          </div>
        </div>

        {/* Financial Underwriting Ratios Grid */}
        <div className="p-6 bg-gray-50 border-t border-b border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Core Underwriting Financial Ratios</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* DTI */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
              <div className="text-xs font-medium text-gray-500">Debt-to-Income (DTI)</div>
              <div className={`text-xl font-bold mt-1 ${dti <= 36 ? 'text-success-600' : dti <= 45 ? 'text-warning-600' : 'text-danger-600'}`}>
                {dti.toFixed(1)}%
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{dti <= 40 ? 'Healthy (<=40%)' : 'High Risk (>40%)'}</p>
            </div>

            {/* LTV */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
              <div className="text-xs font-medium text-gray-500">Loan-to-Value (LTV)</div>
              <div className={`text-xl font-bold mt-1 ${ltv <= 80 ? 'text-success-600' : ltv <= 90 ? 'text-warning-600' : 'text-danger-600'}`}>
                {ltv.toFixed(1)}%
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{ltv <= 85 ? 'Adequate Collateral' : 'Low Equity Buffer'}</p>
            </div>

            {/* Credit Score */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
              <div className="text-xs font-medium text-gray-500">Bureau Credit Score</div>
              <div className={`text-xl font-bold mt-1 ${creditScore >= 740 ? 'text-success-600' : creditScore >= 650 ? 'text-primary-600' : 'text-danger-600'}`}>
                {creditScore}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{creditScore >= 740 ? 'Excellent' : creditScore >= 650 ? 'Fair / Good' : 'Subprime'}</p>
            </div>

            {/* Net Disposable Income */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200">
              <div className="text-xs font-medium text-gray-500">Net Disposable / Mo</div>
              <div className={`text-xl font-bold mt-1 ${disposable > 0 ? 'text-gray-900' : 'text-danger-600'}`}>
                {formatCurrency(Math.max(disposable, 0))}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Surplus Cashflow</p>
            </div>
          </div>
        </div>

        {/* Positive & Negative Factors Columns */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-base font-bold mb-3 text-success-700 flex items-center gap-2">
              <span>📈</span> Key Factors Driving Approval (SHAP +)
            </h3>
            <div className="bg-success-50/70 p-4 rounded-xl border border-success-100 space-y-2.5">
              {positiveFactors.length > 0 ? positiveFactors.map((factor, idx) => (
                <ContributionBar
                  key={idx}
                  feature={factor.featureName}
                  value={parseFloat(factor.shapValue)}
                  originalValue={factor.featureValue}
                  isPositive={true}
                />
              )) : <p className="text-sm text-gray-500">No strong positive drivers detected.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold mb-3 text-danger-700 flex items-center gap-2">
              <span>📉</span> Key Risk Factors / Headwinds (SHAP -)
            </h3>
            <div className="bg-danger-50/70 p-4 rounded-xl border border-danger-100 space-y-2.5">
              {negativeFactors.length > 0 ? negativeFactors.map((factor, idx) => (
                <ContributionBar
                  key={idx}
                  feature={factor.featureName}
                  value={parseFloat(factor.shapValue)}
                  originalValue={factor.featureValue}
                  isPositive={false}
                />
              )) : <p className="text-sm text-gray-500">No major negative risk penalties detected.</p>}
            </div>
          </div>
        </div>

        {/* SHAP Waterfall Chart */}
        {shapData.length > 0 && (
          <div className="p-8 border-t border-gray-100">
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900">Feature Contribution Breakdown (SHAP Feature Force Values)</h3>
              <p className="text-xs text-gray-500">Green bars indicate features that increased eligibility; red bars indicate features that reduced eligibility.</p>
            </div>
            <SHAPChart data={shapData} />
          </div>
        )}

        {/* Comprehensive Application Details */}
        <div className="p-8 border-t bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900 mb-4">Complete Application & Collateral Record</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Monthly Gross Income</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(applicant.income || 0)}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Co-Applicant Income</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(applicant.coApplicantIncome || 0)}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Existing Monthly Debt</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(applicant.existingMonthlyDebt || 0)}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Total Liquid Assets</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(applicant.totalAssetValue || 0)}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Requested Loan</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(applicant.loanAmount || 0)}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Loan Purpose</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{applicant.loanPurpose || 'Home'}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Loan Tenure</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{applicant.loanTerm} Months</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Property Valuation</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(applicant.propertyValue || 0)}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Property Jurisdiction</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{applicant.propertyArea}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Employment Type</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{applicant.employmentType || 'Salaried'}</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Work Experience</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{applicant.workExperienceYears || 0} Years</dd>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <dt className="text-xs text-gray-400 uppercase font-medium">Credit History Status</dt>
              <dd className="text-sm font-bold text-gray-900 mt-1">{applicant.creditHistory === 1 ? 'Good Record' : 'Past Defaults'}</dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;
