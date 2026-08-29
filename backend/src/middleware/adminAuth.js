const ApiError = require('../utils/apiError');

const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Access denied: Admins only'));
  }
  next();
};

module.exports = adminAuth;
