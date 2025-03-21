import winston from 'winston'; // v3.8.2
import { HoneycombSDK } from '@honeycombio/opentelemetry-node'; // v0.4.0
import { loggingConfig, honeycombConfig } from '../../config/logging';

/**
 * Determines if the current environment is development
 * @returns True if in development environment
 */
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Determines if the current environment is test
 * @returns True if in test environment
 */
const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

// Create the base Winston logger
const winstonLogger = winston.createLogger(loggingConfig);

/**
 * Enriches log entries with additional context information
 * @param context Additional context to add to log entries
 * @returns Winston format function that adds context to log entries
 */
const enrichContext = (context: Record<string, any>) => {
  return winston.format((info) => {
    // Merge the context with existing metadata
    return { ...info, ...context };
  })();
};

/**
 * Sanitizes sensitive information from log data to prevent security issues
 * @param data Data to sanitize
 * @returns Sanitized data object with sensitive information removed or masked
 */
const sanitizeLogData = (data: Record<string, any>): Record<string, any> => {
  if (!data) return {};
  
  try {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // List of sensitive field names (case-insensitive)
    const sensitiveFields = [
      'password', 'token', 'auth', 'key', 'secret', 'credential',
      'authorization', 'apiKey', 'api_key', 'access_token', 'refresh_token'
    ];
    
    // Recursive function to sanitize objects
    const sanitizeObject = (obj: Record<string, any>): void => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Check if this key matches any sensitive field name pattern
          const isMatch = sensitiveFields.some(field => 
            key.toLowerCase().includes(field.toLowerCase())
          );
          
          if (isMatch) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively sanitize nested objects and arrays
            sanitizeObject(obj[key]);
          }
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  } catch (error) {
    // If sanitization fails, return a safe object
    return { sanitizationError: 'Failed to sanitize log data' };
  }
};

// Initialize the Honeycomb SDK if enabled
let honeycomb: HoneycombSDK | null = null;
if (honeycombConfig.enabled) {
  honeycomb = new HoneycombSDK({
    serviceName: 'metronomics-platform',
    apiKey: process.env.HONEYCOMB_API_KEY || '',
    dataset: process.env.HONEYCOMB_DATASET || 'metronomics',
    environment: process.env.NODE_ENV || 'development',
  });
}

/**
 * Specialized function for logging errors with appropriate context and stack traces
 * @param error Error object to log
 * @param context Additional context for the error
 * @param message Optional message to include
 */
const logError = (
  error: Error,
  context: Record<string, any> = {},
  message?: string
): void => {
  // Extract error details
  const errorDetails = {
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack
  };
  
  // Determine log level based on error type and status code
  let level = 'error';
  if (
    context.statusCode &&
    context.statusCode >= 400 &&
    context.statusCode < 500
  ) {
    // Client errors (4xx) as warnings unless otherwise specified
    level = 'warn';
  }
  
  // Combine context with error details and sanitize sensitive data
  const combinedContext = sanitizeLogData({
    ...context,
    ...errorDetails
  });
  
  // Log the error with the determined level
  winstonLogger.log({
    level,
    message: message || error.message,
    ...combinedContext
  });
  
  // Send to Honeycomb if enabled
  if (honeycomb && honeycombConfig.enabled) {
    try {
      honeycomb.recordException({
        exception: error,
        attributes: combinedContext
      });
    } catch (honeycombError) {
      // Don't let Honeycomb errors prevent normal logging
      winstonLogger.warn('Failed to send error to Honeycomb', { 
        error: (honeycombError as Error).message 
      });
    }
  }
};

/**
 * Creates a specialized logger for HTTP requests with request-specific context
 * @param requestContext Context from the HTTP request
 * @returns Logger instance with request context pre-configured
 */
const createRequestLogger = (
  requestContext: Record<string, any>
): winston.Logger => {
  // Sanitize the request context to remove sensitive information
  const sanitizedContext = sanitizeLogData(requestContext);
  
  // Create a child logger with the sanitized request context
  return winstonLogger.child(sanitizedContext);
};

/**
 * Centralized logger for the Metronomics Platform with additional utility functions
 * for structured logging, error handling, and observability integration.
 */
export const logger = {
  // Standard Winston logger methods
  error: winstonLogger.error.bind(winstonLogger),
  warn: winstonLogger.warn.bind(winstonLogger),
  info: winstonLogger.info.bind(winstonLogger),
  debug: winstonLogger.debug.bind(winstonLogger),
  
  // Additional utility functions
  logError,
  enrichContext,
  createRequestLogger,
  sanitizeLogData
};