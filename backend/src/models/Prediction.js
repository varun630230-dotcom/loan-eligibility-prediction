const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Prediction = sequelize.define('Prediction', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    applicantId: { type: DataTypes.INTEGER, field: 'applicant_id' },
    userId: { type: DataTypes.INTEGER, field: 'user_id' },
    prediction: { type: DataTypes.STRING(50) },
    probability: { type: DataTypes.DECIMAL(5, 4) },
    modelName: { type: DataTypes.STRING(100), field: 'model_name' },
    modelVersion: { type: DataTypes.STRING(50), field: 'model_version' }
  }, {
    tableName: 'predictions',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });
  return Prediction;
};
