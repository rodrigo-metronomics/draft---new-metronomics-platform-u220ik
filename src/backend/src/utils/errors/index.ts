/**
 * Barrel file for error classes in the Metronomics Platform.
 * 
 * This file centralizes all custom error exports, providing a single import point
 * for consistent error handling throughout the application. These error classes 
 * are used to create standardized API responses and enable appropriate error handling
 * for different types of errors that may occur.
 */

// Import all error classes
import { ApiError } from './ApiError';
import AuthenticationError from './AuthenticationError';
import { AuthorizationError } from './AuthorizationError';
import { NotFoundError } from './NotFoundError';
import { ValidationError } from './ValidationError';

// Re-export all error classes
export {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError
};