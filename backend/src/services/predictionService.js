const { sequelize, Applicant, Prediction, PredictionExplanation } = require('../models');
const mlService = require('./mlService');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Orchestrates the full underwriting prediction workflow:
 * 1. Save applicant financial & property data to DB
 * 2. Call Python ML service for prediction and underwriting ratios
 * 3. Call Python ML service for SHAP explanation
 * 4. Save prediction + explanations to DB
 * 5. Return complete result
 */
exports.createPrediction = async (applicantData, userId) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Save applicant record
    const applicant = await Applicant.create({
      userId,
      income: parseFloat(applicantData.income),
      coApplicantIncome: parseFloat(applicantData.coApplicantIncome || 0),
      existingMonthlyDebt: parseFloat(applicantData.existingMonthlyDebt || 0),
      totalAssetValue: parseFloat(applicantData.totalAssetValue || 0),
      loanAmount: parseFloat(applicantData.loanAmount),
      loanTerm: parseInt(applicantData.loanTerm, 10),
      loanPurpose: applicantData.loanPurpose || 'Home',
      propertyValue: parseFloat(applicantData.propertyValue || applicantData.loanAmount * 1.25),
      propertyArea: applicantData.propertyArea,
      creditScore: parseInt(applicantData.creditScore || 700, 10),
      creditHistory: parseInt(applicantData.creditHistory !== undefined ? applicantData.creditHistory : 1, 10),
      activeLoansCount: parseInt(applicantData.activeLoansCount || 0, 10),
      employmentType: applicantData.employmentType || 'Salaried',
      workExperienceYears: parseInt(applicantData.workExperienceYears || 3, 10),
      education: applicantData.education,
      employmentStatus: applicantData.employmentStatus || (applicantData.employmentType === 'Self_Employed' ? 'Yes' : 'No'),
      dependents: String(applicantData.dependents || '0'),
      married: applicantData.married || 'No'
    }, { transaction });

    // 2. Build ML service payload
    // Note: ML service expects LoanAmount, PropertyValue, TotalAssetValue in thousands
    const mlPayload = {
      ApplicantIncome: parseFloat(applicantData.income),
      CoapplicantIncome: parseFloat(applicantData.coApplicantIncome || 0),
      ExistingMonthlyDebt: parseFloat(applicantData.existingMonthlyDebt || 0),
      TotalAssetValue: parseFloat(applicantData.totalAssetValue || 0) / 1000,
      LoanAmount: parseFloat(applicantData.loanAmount) / 1000,
      Loan_Amount_Term: parseFloat(applicantData.loanTerm),
      LoanPurpose: applicantData.loanPurpose || 'Home',
      PropertyValue: parseFloat(applicantData.propertyValue || applicantData.loanAmount * 1.25) / 1000,
      Property_Area: applicantData.propertyArea,
      CreditScore: parseFloat(applicantData.creditScore || 700),
      Credit_History: parseFloat(applicantData.creditHistory !== undefined ? applicantData.creditHistory : 1.0),
      ActiveLoansCount: parseFloat(applicantData.activeLoansCount || 0),
      EmploymentType: applicantData.employmentType || 'Salaried',
      WorkExperienceYears: parseFloat(applicantData.workExperienceYears || 3),
      Education: applicantData.education,
      Dependents: String(applicantData.dependents || '0'),
      Married: applicantData.married || 'No'
    };

    // 3. Call ML service for prediction
    const mlResult = await mlService.predict(mlPayload);
    logger.info(`ML prediction result: ${mlResult.prediction} (${mlResult.probability})`);

    // 4. Call ML service for SHAP explanation
    let explainResult = null;
    try {
      explainResult = await mlService.explain(mlPayload);
    } catch (explainError) {
      logger.warn('SHAP explanation failed, continuing without explanation:', explainError.message);
    }

    // 5. Save prediction record
    const prediction = await Prediction.create({
      applicantId: applicant.id,
      userId,
      prediction: mlResult.prediction,
      probability: mlResult.probability,
      modelName: mlResult.model || 'XGBoost_Tuned',
      modelVersion: '2.0'
    }, { transaction });

    // 6. Save SHAP explanation values
    if (explainResult && explainResult.shap_values && explainResult.shap_values.length > 0) {
      const explanations = explainResult.shap_values.map(exp => ({
        predictionId: prediction.id,
        featureName: exp.feature,
        featureValue: String(exp.value),
        shapValue: exp.shap_value,
        contributionType: exp.shap_value >= 0 ? 'positive' : 'negative'
      }));

      await PredictionExplanation.bulkCreate(explanations, { transaction });
    }

    await transaction.commit();

    // 7. Return complete prediction with associations
    const fullPrediction = await Prediction.findByPk(prediction.id, {
      include: [
        { model: Applicant },
        { model: PredictionExplanation }
      ]
    });

    const result = fullPrediction.toJSON();
    result.message = mlResult.message || '';
    result.underwriting = mlResult.underwriting || explainResult?.underwriting || {};
    if (explainResult) {
      result.positiveContributors = explainResult.positive_contributors || [];
      result.negativeContributors = explainResult.negative_contributors || [];
      result.baseValue = explainResult.base_value;
    }

    return result;

  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) throw error;
    logger.error('Prediction workflow failed:', error.message);
    throw ApiError.internal('Prediction workflow failed. Please try again later.');
  }
};
