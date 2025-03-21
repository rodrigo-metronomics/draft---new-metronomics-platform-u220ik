import http from 'http'; // built-in
import initializeApp from './app';
import { env } from './config/environment';
import { logger } from './utils/helpers/logger';

/**
 * Initializes the Express application and starts the HTTP server on the configured port
 * @returns {Promise<http.Server>} HTTP server instance
 */
async function startServer(): Promise<http.Server> {
  try {
    // LD1: Initialize the Express application by calling initializeApp()
    const app = await initializeApp();

    // LD1: Create an HTTP server with the Express app
    const server = http.createServer(app);

    // LD1: Start listening on the configured PORT
    server.listen(env.PORT, () => {
      // LD1: Log server startup information
      logger.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // LD1: Return the HTTP server instance
    return server;
  } catch (error: any) {
    // LD1: Handle and log any startup errors
    logger.error('Server startup failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Sets up event listeners for process signals to handle graceful shutdown
 * @param {http.Server} server
 * @returns {void} No return value
 */
function setupGracefulShutdown(server: http.Server): void {
  // LD1: Set up event listener for SIGTERM signal
  process.on('SIGTERM', () => gracefulShutdown(server, 'SIGTERM'));

  // LD1: Set up event listener for SIGINT signal
  process.on('SIGINT', () => gracefulShutdown(server, 'SIGINT'));
}

/**
 * Handles graceful shutdown of the server and cleanup of resources
 * @param {http.Server} server
 * @param {string} signal
 * @returns {Promise<void>} Promise that resolves when shutdown is complete
 */
async function gracefulShutdown(server: http.Server, signal: string): Promise<void> {
  // LD1: Log the shutdown signal received
  logger.info(`Received ${signal}: Initiating graceful shutdown...`);

  // LD1: Close the HTTP server to stop accepting new connections
  server.close((err) => {
    if (err) {
      logger.error('Error closing server', { error: err.message, stack: err.stack });
      process.exitCode = 1;
    }

    // LD1: Log successful shutdown
    logger.info('Server closed: No longer accepting new connections');

    // LD1: Ensure process exits with appropriate code after cleanup
    process.exit();
  });
}

// Start the server and set up graceful shutdown
startServer()
  .then(server => {
    setupGracefulShutdown(server);
  })
  .catch(error => {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  });