const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Applicant = require('./Applicant')(sequelize);
const Prediction = require('./Prediction')(sequelize);
const PredictionExplanation = require('./PredictionExplanation')(sequelize);
const ModelMetric = require('./ModelMetric')(sequelize);

User.hasMany(Applicant, { foreignKey: 'user_id' });
Applicant.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Prediction, { foreignKey: 'user_id' });
Prediction.belongsTo(User, { foreignKey: 'user_id' });

Applicant.hasMany(Prediction, { foreignKey: 'applicant_id' });
Prediction.belongsTo(Applicant, { foreignKey: 'applicant_id' });

Prediction.hasMany(PredictionExplanation, { foreignKey: 'prediction_id' });
PredictionExplanation.belongsTo(Prediction, { foreignKey: 'prediction_id' });

module.exports = {
  sequelize,
  User,
  Applicant,
  Prediction,
  PredictionExplanation,
  ModelMetric
};
