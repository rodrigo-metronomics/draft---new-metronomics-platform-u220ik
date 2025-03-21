/**
 * Error message constants for the Metronomics Platform
 * 
 * This file contains centralized error messages used throughout the application
 * to ensure consistent error reporting and facilitate maintenance.
 */

/**
 * Authentication related error messages
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  UNAUTHORIZED: 'You must be logged in to access this resource.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_TOKEN: 'Invalid authentication token.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact an administrator.',
  ACCOUNT_DISABLED: 'Your account has been disabled. Please contact an administrator.'
};

/**
 * Form validation error messages
 * Note: Messages with {0}, {1}, etc. are templates where these placeholders
 * will be replaced with actual values when used
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: "The field '{0}' is required.",
  INVALID_EMAIL: "The email '{0}' is not a valid email address.",
  INVALID_PASSWORD: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_DATE: "The date '{0}' is not a valid date.",
  INVALID_FORMAT: "The field '{0}' has an invalid format. Expected format: {1}.",
  INVALID_VALUE_RANGE: "The value for '{0}' must be between {1} and {2}.",
  MIN_LENGTH: "The field '{0}' must be at least {1} characters long.",
  MAX_LENGTH: "The field '{0}' cannot exceed {1} characters."
};

/**
 * Resource-related error messages
 */
export const RESOURCE_ERRORS = {
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'A resource with this identifier already exists.',
  CONFLICT: 'This operation conflicts with the current state of the resource.'
};

/**
 * Meeting-related error messages
 */
export const MEETING_ERRORS = {
  INVALID_STAGE: 'Invalid meeting stage.',
  ALREADY_STARTED: 'This meeting has already started.',
  ALREADY_COMPLETED: 'This meeting has already been completed.',
  INVALID_PARTICIPANT: 'Invalid meeting participant.',
  CANNOT_JOIN: 'Unable to join the meeting at this time.'
};

/**
 * Goal-related error messages
 */
export const GOAL_ERRORS = {
  INVALID_TYPE: 'Invalid goal type.',
  INVALID_TIMEFRAME: 'Invalid goal timeframe.',
  MILESTONE_CONFLICT: 'Milestone dates conflict with goal timeframe.'
};

/**
 * Metric-related error messages
 */
export const METRIC_ERRORS = {
  INVALID_TYPE: 'Invalid metric type.',
  CALCULATION_FAILED: 'Failed to calculate metric value.',
  THRESHOLD_VIOLATION: 'The provided value violates the defined thresholds.',
  INVALID_COMPARISON: 'Invalid comparison type for this metric.'
};

/**
 * Key Function Flow Map (KFFM) related error messages
 */
export const KFFM_ERRORS = {
  INVALID_NODE: 'Invalid function node.',
  INVALID_CONNECTION: 'Invalid connection between nodes.',
  CIRCULAR_REFERENCE: 'This connection would create a circular reference.'
};

/**
 * Organization-related error messages
 */
export const ORGANIZATION_ERRORS = {
  NOT_MEMBER: 'You are not a member of this organization.',
  INVALID_ROLE: 'Invalid role for this organization.',
  INSUFFICIENT_PERMISSIONS: "You don't have sufficient permissions to perform this action."
};

/**
 * Team-related error messages
 */
export const TEAM_ERRORS = {
  NOT_MEMBER: 'You are not a member of this team.',
  ALREADY_MEMBER: 'User is already a member of this team.'
};

/**
 * Integration-related error messages
 */
export const INTEGRATION_ERRORS = {
  CALENDAR_SYNC_FAILED: 'Failed to synchronize with calendar service.',
  FIREBASE_ERROR: 'Error communicating with Firebase services.',
  EMAIL_DELIVERY_FAILED: 'Failed to deliver email notification.'
};

/**
 * Connection-related error messages
 */
export const CONNECTION_ERRORS = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  SERVER_UNREACHABLE: 'Unable to reach the server. Please try again later.',
  REQUEST_TIMEOUT: 'The request timed out. Please try again.'
};

/**
 * Form submission error messages
 */
export const FORM_SUBMISSION_ERRORS = {
  VALIDATION_FAILED: 'Please correct the errors in the form before submitting.',
  SUBMISSION_FAILED: 'Failed to submit the form. Please try again.',
  DUPLICATE_ENTRY: 'This entry already exists.'
};

/**
 * Generic error messages
 */
export const GENERIC_ERRORS = {
  INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again or contact support.'
};