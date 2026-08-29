const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Applicant = sequelize.define('Applicant', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, field: 'user_id' },
    
    // Financials
    income: { type: DataTypes.DECIMAL(12, 2) },
    coApplicantIncome: { type: DataTypes.DECIMAL(12, 2), field: 'co_applicant_income', defaultValue: 0 },
    existingMonthlyDebt: { type: DataTypes.DECIMAL(12, 2), field: 'existing_monthly_debt', defaultValue: 0 },
    totalAssetValue: { type: DataTypes.DECIMAL(14, 2), field: 'total_asset_value', defaultValue: 0 },
    
    // Loan Request & Property
    loanAmount: { type: DataTypes.DECIMAL(12, 2), field: 'loan_amount' },
    loanTerm: { type: DataTypes.INTEGER, field: 'loan_term' },
    loanPurpose: { type: DataTypes.STRING(50), field: 'loan_purpose', defaultValue: 'Home' },
    propertyValue: { type: DataTypes.DECIMAL(14, 2), field: 'property_value' },
    propertyArea: { type: DataTypes.STRING(50), field: 'property_area' },
    
    // Credit & Loans History
    creditScore: { type: DataTypes.INTEGER, field: 'credit_score', defaultValue: 700 },
    creditHistory: { type: DataTypes.TINYINT, field: 'credit_history', defaultValue: 1 },
    activeLoansCount: { type: DataTypes.INTEGER, field: 'active_loans_count', defaultValue: 0 },
    
    // Employment & Personal
    employmentType: { type: DataTypes.STRING(50), field: 'employment_type', defaultValue: 'Salaried' },
    workExperienceYears: { type: DataTypes.INTEGER, field: 'work_experience_years', defaultValue: 3 },
    education: { type: DataTypes.STRING(50) },
    employmentStatus: { type: DataTypes.STRING(50), field: 'employment_status', defaultValue: 'No' },
    dependents: { type: DataTypes.STRING(10), defaultValue: '0' },
    married: { type: DataTypes.STRING(10), defaultValue: 'No' }
  }, {
    tableName: 'applicants',
    underscored: true,
    timestamps: true
  });
  return Applicant;
};
