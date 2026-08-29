const { Applicant, Prediction, PredictionExplanation } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const predictionService = require('../services/predictionService');

exports.create = asyncHandler(async (req, res) => {
  const result = await predictionService.createPrediction(req.body, req.user.id);
  res.status(201).json({ success: true, data: result });
});

exports.getById = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findByPk(req.params.id, {
    include: [
      { model: Applicant },
      { model: PredictionExplanation }
    ]
  });

  if (!prediction) {
    throw ApiError.notFound('Prediction not found');
  }

  if (prediction.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: prediction });
});

exports.getHistory = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const predictions = await Prediction.findAndCountAll({
    where: { userId: req.user.id },
    include: [
      { model: Applicant, attributes: ['income', 'loanAmount', 'loanTerm', 'propertyArea'] }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  res.json({ success: true, data: predictions });
});
