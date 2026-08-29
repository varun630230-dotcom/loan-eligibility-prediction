const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PredictionExplanation = sequelize.define('PredictionExplanation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    predictionId: { type: DataTypes.INTEGER, field: 'prediction_id' },
    featureName: { type: DataTypes.STRING(100), field: 'feature_name' },
    featureValue: { type: DataTypes.STRING(255), field: 'feature_value' },
    shapValue: { type: DataTypes.DECIMAL(10, 6), field: 'shap_value' },
    contributionType: { type: DataTypes.ENUM('positive', 'negative'), field: 'contribution_type' }
  }, {
    tableName: 'prediction_explanations',
    timestamps: false
  });
  return PredictionExplanation;
};
