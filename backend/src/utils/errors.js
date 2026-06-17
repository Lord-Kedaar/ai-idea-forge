/**
 * AI Idea Forge — Errors utility
 * Custom error classes for API errors.
 */

export class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || `HTTP_${status}`;
    this.name = 'AppError';
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new AppError(400, message, code);
  }

  static notFound(message, code = 'NOT_FOUND') {
    return new AppError(404, message, code);
  }

  static internal(message, code = 'INTERNAL_ERROR') {
    return new AppError(500, message, code);
  }
}
