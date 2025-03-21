/**
 * Base error class for all API-related errors in the Metronomics Platform.
 * Extends the standard Error class with additional properties for HTTP status code,
 * error details, and consistent serialization for API responses.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details: Record<string, any>;
  public readonly timestamp: Date;

  /**
   * Creates a new ApiError instance with the specified message, HTTP status code, and optional details.
   * 
   * @param message The error message
   * @param statusCode The HTTP status code (defaults to 500)
   * @param details Additional error details (defaults to empty object)
   */
  constructor(message: string, statusCode: number = 500, details: Record<string, any> = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    this.timestamp = new Date();
    
    // Capture stack trace if available in the environment
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Serializes the error instance to a JSON-compatible object for API responses.
   * 
   * @returns A JSON representation of the error with status, message, timestamp, and details
   */
  toJSON() {
    return {
      status: this.statusCode,
      message: this.message,
      timestamp: this.timestamp,
      details: this.details
    };
  }

  /**
   * Static factory method that creates an ApiError for internal server errors.
   * 
   * @param message Custom error message (defaults to 'Internal Server Error')
   * @param details Additional error details
   * @returns A new ApiError instance for internal server errors
   */
  static internalServerError(message: string = 'Internal Server Error', details: Record<string, any> = {}) {
    return new ApiError(message, 500, details);
  }

  /**
   * Static factory method that creates an ApiError for bad request errors.
   * 
   * @param message Custom error message (defaults to 'Bad Request')
   * @param details Additional error details
   * @returns A new ApiError instance for bad request errors
   */
  static badRequest(message: string = 'Bad Request', details: Record<string, any> = {}) {
    return new ApiError(message, 400, details);
  }

  /**
   * Static factory method that creates an ApiError for service unavailable errors.
   * 
   * @param message Custom error message (defaults to 'Service Unavailable')
   * @param details Additional error details
   * @returns A new ApiError instance for service unavailable errors
   */
  static serviceUnavailable(message: string = 'Service Unavailable', details: Record<string, any> = {}) {
    return new ApiError(message, 503, details);
  }
}