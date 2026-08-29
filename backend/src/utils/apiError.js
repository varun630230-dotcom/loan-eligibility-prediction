class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  static badRequest(msg) {
    return new ApiError(msg, 400);
  }

  static unauthorized(msg) {
    return new ApiError(msg, 401);
  }

  static forbidden(msg) {
    return new ApiError(msg, 403);
  }

  static notFound(msg) {
    return new ApiError(msg, 404);
  }

  static internal(msg) {
    return new ApiError(msg, 500);
  }
}

module.exports = ApiError;
