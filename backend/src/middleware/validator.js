const ApiError = require('../utils/apiError');

const validator = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      const apiErr = ApiError.badRequest('Validation failed');
      apiErr.errors = errorMessages;
      return next(apiErr);
    }
    next();
  };
};

module.exports = validator;
