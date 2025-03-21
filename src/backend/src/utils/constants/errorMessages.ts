/**
 * Centralized collection of error message constants used throughout the Metronomics Platform.
 * These are standardized error messages for various error categories including authentication,
 * authorization, validation, and resource-related errors to ensure consistent error reporting
 * across the application.
 */

/**
 * Authentication and authorization related error messages
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  UNAUTHORIZED: 'You must be logged in to access this resource.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_TOKEN: 'Invalid authentication token.',
  FORBIDDEN: 'You do not have permission to access this resource.'
};

/**
 * Validation error messages with placeholders for dynamic content
 * Placeholders are in the format {0}, {1}, etc. and should be replaced
 * when using these messages
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: "The field '{0}' is required.",
  INVALID_EMAIL: "The email '{0}' is not a valid email address.",
  INVALID_FORMAT: "The field '{0}' has an invalid format. Expected format: {1}.",
  INVALID_VALUE_RANGE: "The value for '{0}' must be between {1} and {2}."
};

/**
 * Resource-related error messages for CRUD operations
 */
export const RESOURCE_ERRORS = {
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'A resource with this identifier already exists.',
  CONFLICT: 'This operation conflicts with the current state of the resource.'
};

/**
 * Meeting-specific error messages
 */
export const MEETING_ERRORS = {
  INVALID_STAGE: 'Invalid meeting stage.',
  ALREADY_STARTED: 'This meeting has already started.',
  ALREADY_COMPLETED: 'This meeting has already been completed.',
  INVALID_PARTICIPANT: 'Invalid meeting participant.'
};

/**
 * Metric-related error messages
 */
export const METRIC_ERRORS = {
  INVALID_TYPE: 'Invalid metric type.',
  CALCULATION_FAILED: 'Failed to calculate metric value.',
  THRESHOLD_VIOLATION: 'The provided value violates the defined thresholds.'
};

/**
 * Organization-related error messages
 */
export const ORGANIZATION_ERRORS = {
  NOT_MEMBER: 'You are not a member of this organization.',
  INVALID_ROLE: 'Invalid role for this organization.'
};

/**
 * External integration error messages
 */
export const INTEGRATION_ERRORS = {
  CALENDAR_SYNC_FAILED: 'Failed to synchronize with calendar service.',
  FIREBASE_ERROR: 'Error communicating with Firebase services.',
  EMAIL_DELIVERY_FAILED: 'Failed to deliver email notification.'
};

/**
 * Server-side error messages
 */
export const SERVER_ERRORS = {
  INTERNAL_ERROR: 'An internal server error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  DATABASE_ERROR: 'A database error occurred while processing your request.'
};