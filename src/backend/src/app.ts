import express from 'express'; // version ^4.18.2
import { setupApi } from './api';
import { initializeConfig, connectDatabase, initializeFirebase, env } from './config';
import { logger } from './utils/helpers/logger';

/**
 * Initializes the application by setting up configuration, connecting to services, and configuring the Express app
 * @returns {Promise<express.Application>} Configured Express application ready to be used by the server
 */
async function initializeApp(): Promise<express.Application> {
  try {
    // LD1: Log the start of application initialization
    logger.info('Starting application initialization...');

    // LD1: Initialize configuration by calling initializeConfig()
    await initializeConfig();

    // LD1: Connect to the database by calling connectDatabase()
    // await connectDatabase();

    // LD1: Initialize Firebase services by calling initializeFirebase()
    // await initializeFirebase();

    // LD1: Set up the Express application by calling setupApi()
    const app = setupApi();

    // LD1: Log successful application initialization
    logger.info('Application initialization complete');

    // LD1: Return the configured Express application
    return app;
  } catch (error: any) {
    // LD1: Handle and log any initialization errors
    logger.error('Application initialization failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Export the initializeApp function as the default export to be used by server.ts
export default initializeApp;