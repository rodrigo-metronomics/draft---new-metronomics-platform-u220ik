import { ApiError } from './ApiError';
import { RESOURCE_ERRORS } from '../constants/errorMessages';

/**
 * Custom error class for resource not found errors in the Metronomics Platform.
 * This class extends the ApiError base class to provide specific error handling
 * for cases where requested resources cannot be found in the system.
 */
export class NotFoundError extends ApiError {
  /**
   * Creates a new NotFoundError instance with the specified message and optional details.
   * 
   * @param message The error message
   * @param details Additional error details (defaults to empty object)
   */
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }

  /**
   * Static factory method that creates a NotFoundError for a specific resource that was not found.
   * 
   * @param resourceType The type of resource that was not found (e.g., 'User', 'Meeting')
   * @param resourceId The identifier of the resource that was not found
   * @param details Additional error details
   * @returns A new NotFoundError instance for a specific resource not found
   */
  static resourceNotFound(resourceType: string, resourceId: string, details: Record<string, any> = {}): NotFoundError {
    const message = `${resourceType} with id '${resourceId}' was not found.`;
    return new NotFoundError(message, details);
  }

  /**
   * Static factory method that creates a NotFoundError for an empty collection.
   * 
   * @param collectionName The name of the collection that is empty
   * @param details Additional error details
   * @returns A new NotFoundError instance for an empty collection
   */
  static collectionEmpty(collectionName: string, details: Record<string, any> = {}): NotFoundError {
    const message = `No ${collectionName} found.`;
    return new NotFoundError(message, details);
  }

  /**
   * Static factory method that creates a NotFoundError with the generic not found message.
   * 
   * @param details Additional error details
   * @returns A new NotFoundError instance with a generic not found message
   */
  static genericNotFound(details: Record<string, any> = {}): NotFoundError {
    return new NotFoundError(RESOURCE_ERRORS.NOT_FOUND, details);
  }
}