/**
 * Centralized export file for all Express middleware used in the Metronomics Platform API. 
 * This file aggregates and re-exports middleware components for authentication, authorization, 
 * error handling, request validation, rate limiting, and request logging to provide a clean 
 * interface for route configuration.
 */

// Import authentication middleware for verifying JWT tokens
import { authenticate } from './authentication';
// Import authorization middleware for role-based access control
import { 
  authorize, 
  authorizeResource, 
  authorizeOrganizationAccess, 
  authorizeTeamAccess 
} from './authorization';
// Import error handling middleware for centralized error response formatting
import { errorHandler } from './errorHandler';
// Import rate limiting middleware for protecting API endpoints from abuse
import { 
  rateLimiter, 
  createRateLimiter 
} from './rateLimiter';
// Import request logging middleware for logging HTTP requests and responses
import requestLogger from './requestLogger';
// Import request validation middleware for validating request data using Zod schemas
import { 
  validate, 
  validateBody, 
  validateQuery, 
  validateParams 
} from './requestValidator';

// Export authentication middleware
export { authenticate };

// Export authorization middleware
export { authorize };
export { authorizeResource };
export { authorizeOrganizationAccess };
export { authorizeTeamAccess };

// Export error handling middleware
export { errorHandler };

// Export rate limiting middleware
export { rateLimiter };
export { createRateLimiter };

// Export request logging middleware
export { requestLogger };

// Export request validation middleware
export { validate };
export { validateBody };
export { validateQuery };
export { validateParams };