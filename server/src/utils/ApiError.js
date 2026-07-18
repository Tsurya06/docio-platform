export class ApiError extends Error {
  constructor({ statusCode, code, message, details } = {}) {
    super(message ?? code ?? 'ApiError');
    this.name = 'ApiError';
    this.statusCode = statusCode ?? 500;
    this.code = code ?? 'INTERNAL_ERROR';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code, message, details) {
    return new ApiError({ statusCode: 400, code, message, details });
  }

  static unauthorized(code = 'UNAUTHORIZED', message = 'Authentication required') {
    return new ApiError({ statusCode: 401, code, message });
  }

  static forbidden(code = 'FORBIDDEN', message = 'Insufficient permissions') {
    return new ApiError({ statusCode: 403, code, message });
  }

  static notFound(code = 'NOT_FOUND', message = 'Resource not found') {
    return new ApiError({ statusCode: 404, code, message });
  }

  static conflict(code, message, details) {
    return new ApiError({ statusCode: 409, code, message, details });
  }

  static unprocessable(code, message, details) {
    return new ApiError({ statusCode: 422, code, message, details });
  }
}
