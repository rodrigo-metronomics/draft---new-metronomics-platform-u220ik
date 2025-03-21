import ApiError from './ApiError';
import { VALIDATION_ERRORS } from '../constants/errorMessages';
import { ZodError } from 'zod'; // zod v3.x

/**
 * Custom error class for validation errors in the Metronomics Platform.
 * Extends the ApiError base class to provide specific error handling for data validation failures
 * with appropriate HTTP status codes and detailed error information.
 */
export class ValidationError extends ApiError {
  /**
   * Creates a new ValidationError instance with the specified message and optional details.
   * 
   * @param message The error message
   * @param details Additional error details (defaults to empty object)
   */
  constructor(message: string, details: Record<string, any> = {}) {
    super(message, 422, details); // 422 is the status code for Unprocessable Entity
    this.name = 'ValidationError';
  }

  /**
   * Helper function to format strings with placeholders.
   * Replaces {0}, {1}, etc. with the provided arguments.
   * 
   * @param template String with placeholders {0}, {1}, etc.
   * @param args Values to replace placeholders
   * @returns Formatted string
   */
  private static formatMessage(template: string, ...args: any[]): string {
    return template.replace(/{(\d+)}/g, (match, index) => {
      return typeof args[index] !== 'undefined' ? args[index] : match;
    });
  }

  /**
   * Static factory method that creates a ValidationError for a missing required field.
   * 
   * @param fieldName The name of the required field
   * @param details Additional error details
   * @returns A new ValidationError instance for a missing required field
   */
  static requiredField(fieldName: string, details: Record<string, any> = {}): ValidationError {
    const message = this.formatMessage(VALIDATION_ERRORS.REQUIRED_FIELD, fieldName);
    return new ValidationError(message, details);
  }

  /**
   * Static factory method that creates a ValidationError for an invalid email address.
   * 
   * @param email The invalid email address
   * @param details Additional error details
   * @returns A new ValidationError instance for an invalid email address
   */
  static invalidEmail(email: string, details: Record<string, any> = {}): ValidationError {
    const message = this.formatMessage(VALIDATION_ERRORS.INVALID_EMAIL, email);
    return new ValidationError(message, details);
  }

  /**
   * Static factory method that creates a ValidationError for a field with an invalid format.
   * 
   * @param fieldName The name of the field with invalid format
   * @param expectedFormat The expected format description
   * @param details Additional error details
   * @returns A new ValidationError instance for a field with an invalid format
   */
  static invalidFormat(fieldName: string, expectedFormat: string, details: Record<string, any> = {}): ValidationError {
    const message = this.formatMessage(VALIDATION_ERRORS.INVALID_FORMAT, fieldName, expectedFormat);
    return new ValidationError(message, details);
  }

  /**
   * Static factory method that creates a ValidationError for a value outside the allowed range.
   * 
   * @param fieldName The name of the field with the value outside range
   * @param min The minimum allowed value
   * @param max The maximum allowed value
   * @param details Additional error details
   * @returns A new ValidationError instance for a value outside the allowed range
   */
  static invalidValueRange(fieldName: string, min: number, max: number, details: Record<string, any> = {}): ValidationError {
    const message = this.formatMessage(VALIDATION_ERRORS.INVALID_VALUE_RANGE, fieldName, min, max);
    return new ValidationError(message, details);
  }

  /**
   * Static factory method that converts a Zod validation error into a ValidationError instance.
   * This method extracts detailed error information from the Zod error object and
   * transforms it into a consistent format used by the Metronomics Platform.
   * 
   * @param error The Zod validation error
   * @returns A new ValidationError instance with details from the Zod error
   */
  static fromZodError(error: ZodError): ValidationError {
    const details = error.errors.reduce((acc, err) => {
      const path = err.path.join('.');
      if (!acc[path]) {
        acc[path] = [];
      }
      acc[path].push(err.message);
      return acc;
    }, {} as Record<string, string[]>);

    return new ValidationError('Validation failed', { errors: details });
  }
}