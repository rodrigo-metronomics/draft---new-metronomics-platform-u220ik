import { Request, Response, NextFunction } from 'express'; // v4.18.2
import { ZodError } from 'zod'; // v3.21.4
import { 
  ApiError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ValidationError 
} from '../../utils/errors';
import { logger } from '../../utils/helpers/logger';
import { env } from '../../config/environment';

/**
 * Helper function to determine the appropriate HTTP status code based on error type.
 * 
 * @param error The error object
 * @returns The HTTP status code appropriate for the error
 */
const getErrorStatusCode = (error: Error): number => {
  // Check for known error types with specific status codes
  if (error instanceof ApiError) {
    return error.statusCode;
  }
  
  // Default for unknown error types
  return 500; // Internal Server Error
};

/**
 * Helper function to format error details into a standardized response structure.
 * 
 * @param error The error object
 * @param includeStack Whether to include stack trace in the response
 * @returns Formatted error response object
 */
const formatErrorResponse = (error: Error, includeStack: boolean): Record<string, any> => {
  // If it's an ApiError, use its toJSON method
  if (error instanceof ApiError) {
    const response = error.toJSON();
    
    // Add stack trace in development mode if available
    if (includeStack && error.stack) {
      response.stack = error.stack;
    }
    
    return response;
  }
  
  // For other error types, create a generic error response
  const response = {
    status: getErrorStatusCode(error),
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date()
  };
  
  // Add stack trace in development mode if available
  if (includeStack && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
};

/**
 * Express middleware for centralized error handling across the Metronomics Platform API.
 * Catches all errors thrown during request processing, transforms them into standardized
 * API responses, and handles logging based on error severity.
 *
 * @param err The error that was thrown
 * @param req The Express request object
 * @param res The Express response object
 * @param next The Express next function
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    let error = err;
    
    // Convert ZodError to ValidationError
    if (err instanceof ZodError) {
      error = ValidationError.fromZodError(err);
    }
    
    // Determine status code
    const statusCode = getErrorStatusCode(error);
    
    // Prepare logging context with request information
    const loggingContext = {
      url: req.originalUrl,
      method: req.method,
      statusCode,
      userId: req.user?.id, // Assuming req.user is set by authentication middleware
      requestId: req.headers['x-request-id'] || '',
      userAgent: req.headers['user-agent'] || ''
    };
    
    // Log the error with appropriate context
    logger.logError(error, loggingContext);
    
    // Format the error response
    const includeStack = env.isDevelopment;
    const errorResponse = formatErrorResponse(error, includeStack);
    
    // Send the response
    res.status(statusCode).json(errorResponse);
  } catch (unexpectedError) {
    // Handle errors that occur during error handling itself
    console.error('Error in error handler:', unexpectedError);
    res.status(500).json({
      status: 500,
      message: 'An unexpected error occurred',
      timestamp: new Date()
    });
  }
};