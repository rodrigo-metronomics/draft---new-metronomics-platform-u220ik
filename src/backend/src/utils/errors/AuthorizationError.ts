import { ApiError } from './ApiError';
import { AUTH_ERRORS } from '../constants/errorMessages';

/**
 * Custom error class for authorization-related errors in the Metronomics Platform.
 * Extends the ApiError base class to provide specific error handling for permission issues,
 * access control violations, and resource access denials.
 */
export class AuthorizationError extends ApiError {
  /**
   * Creates a new AuthorizationError instance with the specified message and optional details.
   * 
   * @param message The error message
   * @param details Additional error details (defaults to empty object)
   */
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 403, details);
    this.name = 'AuthorizationError';
  }

  /**
   * Static factory method that creates an AuthorizationError for general forbidden access.
   * 
   * @param details Additional error details
   * @returns A new AuthorizationError instance for forbidden access
   */
  static forbidden(details: Record<string, any> = {}): AuthorizationError {
    return new AuthorizationError(AUTH_ERRORS.FORBIDDEN, details);
  }

  /**
   * Static factory method that creates an AuthorizationError for insufficient permissions to perform an action.
   * 
   * @param action The action that was attempted
   * @param details Additional error details
   * @returns A new AuthorizationError instance for insufficient permissions
   */
  static insufficientPermissions(action: string, details: Record<string, any> = {}): AuthorizationError {
    return new AuthorizationError(`Insufficient permissions to perform action: ${action}`, details);
  }

  /**
   * Static factory method that creates an AuthorizationError for denied access to a specific resource.
   * 
   * @param resourceType The type of resource being accessed
   * @param resourceId The ID of the resource being accessed
   * @param details Additional error details
   * @returns A new AuthorizationError instance for resource access denial
   */
  static resourceAccessDenied(resourceType: string, resourceId: string, details: Record<string, any> = {}): AuthorizationError {
    return new AuthorizationError(
      `Access denied to resource of type ${resourceType} with ID ${resourceId}`,
      details
    );
  }
}