const { Applicant, Prediction } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

exports.create = asyncHandler(async (req, res) => {
  const applicant = await Applicant.create({
    ...req.body,
    userId: req.user.id
  });
  res.status(201).json({ success: true, data: applicant });
});

exports.getById = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findByPk(req.params.id, {
    include: [{ model: Prediction }]
  });

  if (!applicant) {
    throw ApiError.notFound('Applicant not found');
  }

  if (applicant.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: applicant });
});

exports.getAll = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const applicants = await Applicant.findAndCountAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  res.json({ success: true, data: applicants });
});
