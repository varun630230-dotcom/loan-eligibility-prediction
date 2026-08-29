const Joi = require('joi');

const applicantSchema = Joi.object({
  // Income & Debts
  income: Joi.number().min(0).required(),
  coApplicantIncome: Joi.number().min(0).default(0),
  existingMonthlyDebt: Joi.number().min(0).default(0),
  totalAssetValue: Joi.number().min(0).default(0),

  // Loan & Property
  loanAmount: Joi.number().min(1).required(),
  loanTerm: Joi.number().valid(12, 24, 36, 60, 84, 120, 180, 240, 300, 360, 480).required(),
  loanPurpose: Joi.string().valid('Home', 'Debt_Consolidation', 'Business', 'Education', 'Personal').default('Home'),
  propertyValue: Joi.number().min(1).required(),
  propertyArea: Joi.string().valid('Urban', 'Semiurban', 'Rural').required(),

  // Credit & History
  creditScore: Joi.number().min(300).max(850).default(700),
  creditHistory: Joi.number().valid(0, 1).default(1),
  activeLoansCount: Joi.number().min(0).max(20).default(0),

  // Employment & Personal
  employmentType: Joi.string().valid('Salaried', 'Self_Employed', 'Business_Owner', 'Professional').default('Salaried'),
  workExperienceYears: Joi.number().min(0).max(60).default(3),
  education: Joi.string().valid('Post_Graduate', 'Graduate', 'Under_Graduate', 'High_School').required(),
  employmentStatus: Joi.string().valid('No', 'Yes').default('No'),
  dependents: Joi.string().valid('0', '1', '2', '3+').default('0'),
  married: Joi.string().valid('Yes', 'No').default('No')
});

module.exports = { applicantSchema };
