import ApiError from './ApiError';
import { AUTH_ERRORS } from '../constants/errorMessages';

/**
 * Custom error class for authentication-related errors in the Metronomics Platform.
 * Extends the ApiError base class to provide specific error handling for authentication
 * failures, token issues, and unauthorized access attempts.
 */
export default class AuthenticationError extends ApiError {
  /**
   * Creates a new AuthenticationError instance with the specified message and optional details.
   * 
   * @param message The error message
   * @param details Additional error details (defaults to empty object)
   */
  constructor(message: string, details: Record<string, any> = {}) {
    // Call the parent ApiError constructor with the provided message,
    // HTTP status code 401 (Unauthorized), and optional details
    super(message, 401, details);
    this.name = 'AuthenticationError';
  }

  /**
   * Static factory method that creates an AuthenticationError for invalid login credentials.
   * 
   * @param details Additional error details
   * @returns A new AuthenticationError instance for invalid credentials
   */
  static invalidCredentials(details: Record<string, any> = {}) {
    return new AuthenticationError(AUTH_ERRORS.INVALID_CREDENTIALS, details);
  }

  /**
   * Static factory method that creates an AuthenticationError for an expired authentication token.
   * 
   * @param details Additional error details
   * @returns A new AuthenticationError instance for an expired token
   */
  static tokenExpired(details: Record<string, any> = {}) {
    return new AuthenticationError(AUTH_ERRORS.TOKEN_EXPIRED, details);
  }

  /**
   * Static factory method that creates an AuthenticationError for an invalid authentication token.
   * 
   * @param details Additional error details
   * @returns A new AuthenticationError instance for an invalid token
   */
  static invalidToken(details: Record<string, any> = {}) {
    return new AuthenticationError(AUTH_ERRORS.INVALID_TOKEN, details);
  }

  /**
   * Static factory method that creates an AuthenticationError for unauthorized access attempts.
   * 
   * @param details Additional error details
   * @returns A new AuthenticationError instance for unauthorized access
   */
  static unauthorized(details: Record<string, any> = {}) {
    return new AuthenticationError(AUTH_ERRORS.UNAUTHORIZED, details);
  }
}