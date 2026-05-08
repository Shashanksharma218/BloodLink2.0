class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details = null) {
    return new ApiError(400, 'VALIDATION_FAILED', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'AUTH_REQUIRED', message);
  }

  static forbidden(message = 'Access denied') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }

  static invalidState(message) {
    return new ApiError(422, 'INVALID_STATE', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL', message);
  }
}

module.exports = ApiError;
