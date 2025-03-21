import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import onFinished from 'on-finished'; // ^2.4.1
import { logger, sanitizeLogData } from '../../utils/helpers/logger';

/**
 * Calculates the duration of a request in milliseconds
 * @param startTime The high-resolution time tuple from process.hrtime()
 * @returns Duration in milliseconds
 */
const getRequestDuration = (startTime: [number, number]): number => {
  const diff = process.hrtime(startTime);
  // Convert to milliseconds (first item in tuple is seconds, second is nanoseconds)
  return (diff[0] * 1000) + (diff[1] / 1000000);
};

/**
 * Extracts relevant metadata from the request object for logging
 * @param req Express request object
 * @returns Object containing sanitized request metadata
 */
const getRequestMetadata = (req: Request): Record<string, any> => {
  const metadata: Record<string, any> = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent') || 'unknown',
  };

  // Add user information if available
  if (req.user) {
    metadata.userId = req.user.id;
  }

  // Add organization ID if available
  if (req.headers['x-organization-id']) {
    metadata.organizationId = req.headers['x-organization-id'];
  } else if (req.query.organizationId) {
    metadata.organizationId = req.query.organizationId;
  }

  // Add query parameters if present
  if (Object.keys(req.query).length > 0) {
    metadata.query = sanitizeLogData(req.query);
  }

  // Add request body if present and not a file upload
  if (req.body && 
      (!req.is('multipart/form-data') || 
       !req.is('application/octet-stream'))) {
    metadata.body = sanitizeLogData(req.body);
  }

  // Add request headers (sanitized)
  metadata.headers = sanitizeLogData(req.headers);

  return metadata;
};

/**
 * Express middleware that logs information about incoming requests and their responses
 * 
 * This middleware captures request metadata, timing information, and response details
 * to provide comprehensive logging for API traffic. Sensitive information is automatically
 * sanitized before logging.
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Next function in the middleware chain
 */
const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Record the start time using high-resolution timer
  const startTime = process.hrtime();
  
  // Generate or use request ID
  const requestId = req.headers['x-request-id'] || 
                    req.headers['x-correlation-id'] || 
                    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to response headers for correlation
  res.setHeader('x-request-id', requestId);
  
  // Extract metadata from request
  const requestMetadata = getRequestMetadata(req);
  
  // Create request-specific logger with context
  const requestLogger = logger.createRequestLogger({
    requestId,
    ...requestMetadata
  });

  // Log the incoming request
  requestLogger.info(`Incoming request: ${req.method} ${req.originalUrl || req.url}`);

  // Register callback for when response is finished
  onFinished(res, (err, res) => {
    // Calculate request duration
    const duration = getRequestDuration(startTime);
    
    // Create response metadata
    const responseMetadata = {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.getHeader('content-length'),
      contentType: res.getHeader('content-type'),
    };

    // Determine log level based on status code
    const isError = res.statusCode >= 400;
    const logLevel = res.statusCode >= 500 ? 'error' : (isError ? 'warn' : 'info');
    
    // Build log message
    const message = `Completed ${req.method} ${req.originalUrl || req.url} with status ${res.statusCode} in ${duration.toFixed(2)}ms`;
    
    // Log the completed request with appropriate level
    requestLogger.log({
      level: logLevel,
      message,
      ...responseMetadata
    });
    
    // If there was an error in the response handling, log it
    if (err) {
      requestLogger.error('Error occurred during request processing', {
        error: err.message,
        stack: err.stack
      });
    }
  });

  // Continue to the next middleware
  next();
};

export default requestLogger;