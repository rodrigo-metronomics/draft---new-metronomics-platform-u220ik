/**
 * Central Configuration Module
 * 
 * This module aggregates and exports all configuration components for the Metronomics Platform backend.
 * It provides a single entry point for accessing application configuration, environment variables,
 * secrets, database connections, Firebase services, logging, and Redis caching.
 * 
 * The exported `initializeConfig` function should be called at application startup to ensure
 * all services are properly initialized before the application begins accepting requests.
 * 
 * @module config
 */

// Import environment configuration
import { env } from './environment';

// Import secrets management
import { secrets } from './secrets';

// Import database configuration
import { prisma, connectDatabase, disconnectDatabase } from './database';

// Import Firebase configuration
import { auth, firestore, messaging, initializeFirebase } from './firebase';

// Import logging configuration
import { loggingConfig, honeycombConfig } from './logging';

// Import Redis configuration
import { redisClient, redisConfig } from './redis';

// Import logger for initialization logging
import { logger } from '../utils/helpers/logger';

/**
 * Initializes all configuration components in the correct order
 * Should be called during application startup
 * 
 * @returns Promise that resolves when all configurations are initialized
 * @throws Error if initialization fails
 */
async function initializeConfig(): Promise<void> {
  try {
    logger.info('Initializing application configuration...');

    // Initialize Firebase services
    await initializeFirebase();
    
    // Connect to the database
    await connectDatabase();
    
    // Verify Redis connection is working
    await redisClient.ping().then(() => {
      logger.info('Redis connection verified successfully');
    }).catch((err) => {
      logger.error(`Redis connection verification failed: ${err.message}`);
      throw err;
    });
    
    logger.info('Application configuration initialized successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to initialize configuration: ${errorMessage}`);
    throw error;
  }
}

// Export all configuration components
export {
  // Environment configuration
  env,
  
  // Secrets management
  secrets,
  
  // Database configuration
  prisma,
  connectDatabase,
  disconnectDatabase,
  
  // Firebase configuration
  auth,
  firestore,
  messaging,
  initializeFirebase,
  
  // Logging configuration
  loggingConfig,
  honeycombConfig,
  
  // Redis configuration
  redisClient,
  redisConfig,
  
  // Configuration initialization
  initializeConfig
};