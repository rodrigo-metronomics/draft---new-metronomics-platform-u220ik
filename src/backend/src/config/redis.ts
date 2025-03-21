/**
 * Redis Configuration Module
 * 
 * Initializes and provides access to the Redis client for caching, session management,
 * and rate limiting in the Metronomics Platform backend. This module handles connection
 * setup, error handling, and exposes a configured Redis client instance.
 */
import Redis from 'ioredis'; // v5.3.2
import { env } from './environment';
import { secrets } from './secrets';
import { logger } from '../utils/helpers/logger';

/**
 * Redis configuration object with default settings
 * These may be overridden by values from the Redis URL
 */
export const redisConfig = {
  host: 'localhost',
  port: 6379,
  keyPrefix: 'metronomics:',
  connectTimeout: 10000,
  maxRetriesPerRequest: 5,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false,
  connectionOptions: {
    // Additional connection options
    family: 4, // IPv4
    keepAlive: 10000,
    db: 0
  }
};

/**
 * Parses a Redis connection URL into connection options
 * @param url Redis connection URL
 * @returns Redis connection options object
 */
function parseRedisUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const port = parseInt(parsedUrl.port, 10) || 6379;
    
    // Extract password from auth part
    let password = null;
    if (parsedUrl.password) {
      password = parsedUrl.password;
    } else if (parsedUrl.username) {
      password = parsedUrl.username; // Some Redis URLs use username as password
    }
    
    // Check for database number in the path
    let db = 0;
    if (parsedUrl.pathname && parsedUrl.pathname.length > 1) {
      const dbMatch = parsedUrl.pathname.match(/\/(\d+)/);
      if (dbMatch) {
        db = parseInt(dbMatch[1], 10);
      }
    }
    
    return {
      host,
      port,
      password: password || undefined,
      db
    };
  } catch (err) {
    logger.error(`Failed to parse Redis URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
    throw new Error('Invalid Redis URL format');
  }
}

/**
 * Creates and configures a Redis client instance
 * @param options Connection options
 * @returns Configured Redis client instance
 */
function createRedisClient(options: object): Redis {
  try {
    // Create Redis client with provided options
    const client = new Redis({
      ...redisConfig,
      ...options,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.info(`Redis connection retry attempt ${times} after ${delay}ms`);
        return delay;
      }
    });
    
    // Set up event listeners
    client.on('connect', () => {
      logger.info(`Redis client connected to ${options['host']}:${options['port']}`);
    });
    
    client.on('ready', () => {
      logger.info('Redis client ready for use');
    });
    
    client.on('error', (err) => {
      logger.error(`Redis client error: ${err.message}`);
    });
    
    client.on('close', () => {
      logger.warn('Redis client connection closed');
    });
    
    client.on('reconnecting', (time) => {
      logger.info(`Redis client reconnecting in ${time}ms`);
    });
    
    // Add an event listener for end event
    client.on('end', () => {
      logger.warn('Redis client connection ended');
    });
    
    return client;
  } catch (err) {
    logger.error(`Failed to create Redis client: ${err instanceof Error ? err.message : 'Unknown error'}`);
    throw err;
  }
}

/**
 * Initializes the Redis client with appropriate configuration based on environment
 * @returns Initialized Redis client
 */
function initializeRedisClient(): Redis {
  // In test environment, we can use a mock Redis client if needed
  if (env.isTest) {
    logger.info('Initializing Redis client in test environment');
    
    // For tests, we can either use a real Redis with test-specific config
    // or implement a mock Redis client for isolated testing
    if (secrets.REDIS_URL) {
      const options = parseRedisUrl(secrets.REDIS_URL);
      return createRedisClient({
        ...options,
        keyPrefix: 'metronomics:test:',
        db: options.db || 1 // Use a different DB number for tests
      });
    }
    
    // Fallback to local Redis for tests
    return createRedisClient({ 
      host: 'localhost', 
      port: 6379,
      keyPrefix: 'metronomics:test:',
      db: 1
    });
  }
  
  try {
    logger.info('Initializing Redis client');
    
    // Parse the Redis URL from secrets
    const redisUrl = secrets.REDIS_URL;
    if (!redisUrl) {
      throw new Error('Redis URL not provided in configuration');
    }
    
    const options = parseRedisUrl(redisUrl);
    logger.info(`Redis connection configured for ${options.host}:${options.port}`);
    
    // Create and return the Redis client
    return createRedisClient(options);
  } catch (err) {
    logger.error(`Failed to initialize Redis client: ${err instanceof Error ? err.message : 'Unknown error'}`);
    
    // In development, provide a more graceful fallback
    if (env.isDevelopment) {
      logger.warn('Falling back to local Redis in development mode');
      return createRedisClient({ host: 'localhost', port: 6379 });
    }
    
    // In production, rethrow the error to fail fast
    throw err;
  }
}

// Initialize and export the Redis client
export const redisClient = initializeRedisClient();