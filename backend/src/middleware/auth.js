const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authentication token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, env.jwtSecret);
    
    req.user = decoded;
    next();
  } catch (error) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

module.exports = auth;
