const asyncHandler = require('../utils/asyncHandler');
const { ModelMetric } = require('../models');
const mlService = require('../services/mlService');

exports.getInfo = asyncHandler(async (req, res) => {
  const info = await mlService.getModelInfo();
  res.json({ success: true, data: info });
});

exports.getMetrics = asyncHandler(async (req, res) => {
  const metrics = await ModelMetric.findAll({ order: [['trainingDate', 'DESC']] });
  res.json({ success: true, data: metrics });
});

exports.getFeatures = asyncHandler(async (req, res) => {
  const info = await mlService.getModelInfo();
  res.json({ success: true, data: info.features || [] });
});
