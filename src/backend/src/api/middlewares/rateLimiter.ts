/**
 * Express middleware for implementing rate limiting to protect API endpoints from abuse.
 * This middleware uses Redis to track and limit request rates based on configurable parameters,
 * supporting both default and custom rate limiting strategies.
 */
import { Request, Response, NextFunction } from 'express'; // express ^4.18.2
import { redisClient } from '../../config/redis';
import { env } from '../../config/environment';
import { logger } from '../../utils/helpers/logger';
import { ApiError } from '../../utils/errors';

/**
 * Interface for rate limiter options
 */
interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Whether to skip rate limiting in development/test environments */
  skipInDevelopment?: boolean;
  /** Message to return when rate limit is exceeded */
  message?: string;
  /** Function to determine the rate limiting key based on the request */
  keyGenerator?: (req: Request) => string;
  /** Strategy when Redis is unavailable ('allow' or 'block') */
  redisUnavailableStrategy?: 'allow' | 'block';
  /** Key prefix for Redis */
  keyPrefix?: string;
  /** Whether to include rate limit headers in responses */
  headers?: boolean;
}

/**
 * Creates a customizable rate limiter middleware with specified options
 *
 * @param options - Configuration options for the rate limiter
 * @returns Express middleware function that implements rate limiting
 */
export const createRateLimiter = (options: RateLimiterOptions) => {
  const {
    max = 100,
    windowMs = 60 * 1000, // Default: 1 minute
    skipInDevelopment = true,
    message = 'Too many requests, please try again later.',
    keyPrefix = 'metronomics:rate-limit:',
    keyGenerator = (req: Request) => {
      // Try to get user ID from various common authentication patterns
      const userId = 
        (req.user as any)?.id || 
        (req.user as any)?.userId ||
        (req.auth as any)?.userId ||
        (req as any).userId;
      
      return userId ? `${keyPrefix}user:${userId}` : `${keyPrefix}ip:${req.ip || req.connection.remoteAddress || '0.0.0.0'}`;
    },
    redisUnavailableStrategy = 'allow', // Default to allowing requests if Redis is down
    headers = true // Whether to send rate limit headers
  } = options;

  // Convert windowMs from milliseconds to seconds for Redis TTL
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip rate limiting in development or test if configured to do so
      if (skipInDevelopment && (env.isDevelopment || env.isTest)) {
        return next();
      }

      // Generate key based on the request
      const key = keyGenerator(req);

      // Increment the counter in Redis
      let count: number;
      try {
        count = await redisClient.incr(key);
        
        // If this is a new key, set expiration
        if (count === 1) {
          await redisClient.expire(key, windowSec);
        }
      } catch (redisError) {
        logger.error('Redis error during rate limiting', {
          error: redisError instanceof Error ? redisError.message : String(redisError),
          key
        });
        
        if (redisUnavailableStrategy === 'block') {
          return next(ApiError.serviceUnavailable('Rate limiting service unavailable', {
            suggestion: 'Please try again later'
          }));
        }
        
        // If strategy is 'allow', let the request proceed
        return next();
      }
      
      // Get the TTL for reset time calculation
      let ttl = windowSec;
      try {
        ttl = await redisClient.ttl(key);
        if (ttl < 0) {
          // If TTL is negative, the key doesn't exist or has no expiry
          ttl = windowSec;
        }
      } catch (ttlError) {
        logger.error('Redis error getting TTL', {
          error: ttlError instanceof Error ? ttlError.message : String(ttlError),
          key
        });
        // Use the default TTL
        ttl = windowSec;
      }
      
      const resetTime = Math.floor(Date.now() / 1000) + ttl;
      const remaining = Math.max(0, max - count);
      
      // Set rate limit headers if enabled
      if (headers) {
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(remaining));
        res.setHeader('X-RateLimit-Reset', String(resetTime));
      }
      
      // If the count exceeds the maximum, return error
      if (count > max) {
        logger.warn(`Rate limit exceeded for ${key}`, {
          ip: req.ip || req.connection.remoteAddress,
          path: req.path,
          method: req.method,
          count,
          max,
          ttl
        });
        
        // Set the Retry-After header (in seconds)
        if (headers) {
          res.setHeader('Retry-After', String(ttl));
        }
        
        return next(ApiError.serviceUnavailable(message, { 
          limit: max, 
          current: count,
          remaining: 0,
          resetTime: resetTime * 1000
        }));
      }
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Catch any other unexpected errors
      logger.error('Unexpected error in rate limiter', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ip: req.ip || req.connection.remoteAddress,
        path: req.path,
        method: req.method
      });
      
      // In case of unexpected errors, allow the request to proceed
      next();
    }
  };
};

// Create the default rate limiter once with standard configuration
const defaultRateLimiter = createRateLimiter({
  max: 100, 
  windowMs: 60 * 1000, // 1 minute
  message: 'Rate limit exceeded. Please try again later.'
});

/**
 * Default rate limiter middleware with standard configuration.
 * Limits requests to 100 per minute.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  defaultRateLimiter(req, res, next);
};