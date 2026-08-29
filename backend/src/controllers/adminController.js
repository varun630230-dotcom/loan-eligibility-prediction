const { User, Applicant, Prediction, ModelMetric, sequelize } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { Op } = require('sequelize');

exports.getDashboard = asyncHandler(async (req, res) => {
  const totalUsers = await User.count({ where: { role: 'user' } });
  const totalApplications = await Applicant.count();
  const totalPredictions = await Prediction.count();

  const likelyEligibleCount = await Prediction.count({
    where: { prediction: 'Likely Eligible' } // Adjust based on actual model output
  });
  
  const approvalRate = totalPredictions > 0 ? (likelyEligibleCount / totalPredictions) * 100 : 0;
  
  const averageProbResult = await Prediction.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('probability')), 'avgProb']]
  });
  const averageProbability = averageProbResult ? parseFloat(averageProbResult.getDataValue('avgProb')) : 0;

  const recentPredictions = await Prediction.findAll({
    limit: 10,
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, attributes: ['id', 'name', 'email'] },
      { model: Applicant, attributes: ['id', 'loanAmount', 'loanTerm'] }
    ]
  });

  res.json({
    success: true,
    data: { totalUsers, totalApplications, totalPredictions, approvalRate, averageProbability, recentPredictions }
  });
});

exports.getStatistics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const predictionTrends = await Prediction.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      createdAt: { [Op.gte]: thirtyDaysAgo }
    },
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
  });

  const predictionDistribution = await Prediction.findAll({
    attributes: [
      'prediction',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['prediction']
  });

  const modelMetrics = await ModelMetric.findAll({ order: [['trainingDate', 'DESC']] });

  res.json({
    success: true,
    data: { predictionTrends, predictionDistribution, modelMetrics }
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['passwordHash', 'password_hash'] },
    include: [{
      model: Prediction,
      attributes: [],
    }],
    attributes: {
      include: [
        [sequelize.fn('COUNT', sequelize.col('Predictions.id')), 'predictionCount']
      ],
      exclude: ['passwordHash', 'password_hash']
    },
    group: ['User.id'],
    order: [['createdAt', 'DESC']]
  });

  res.json({ success: true, data: users });
});
