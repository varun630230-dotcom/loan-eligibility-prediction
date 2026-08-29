const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ModelMetric = sequelize.define('ModelMetric', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    modelName: { type: DataTypes.STRING(100), field: 'model_name' },
    accuracy: { type: DataTypes.DECIMAL(5, 4) },
    precisionScore: { type: DataTypes.DECIMAL(5, 4), field: 'precision_score' },
    recallVal: { type: DataTypes.DECIMAL(5, 4), field: 'recall_val' },
    f1Score: { type: DataTypes.DECIMAL(5, 4), field: 'f1_score' },
    rocAuc: { type: DataTypes.DECIMAL(5, 4), field: 'roc_auc' },
    isBestModel: { type: DataTypes.BOOLEAN, field: 'is_best_model', defaultValue: false },
    trainingDate: { type: DataTypes.DATE, field: 'training_date' }
  }, {
    tableName: 'model_metrics',
    timestamps: true,
    updatedAt: false,
    underscored: true
  });
  return ModelMetric;
};
