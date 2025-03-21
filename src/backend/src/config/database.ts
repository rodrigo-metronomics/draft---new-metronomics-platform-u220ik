/**
 * Database Configuration Module
 * 
 * Initializes and manages the Prisma ORM client for the Metronomics Platform.
 * Provides a centralized interface for database connections, connection pooling,
 * and query logging.
 */
import { PrismaClient } from '@prisma/client'; // ^4.14.0
import { env } from './environment';
import { secrets } from './secrets';
import { logger } from '../utils/helpers/logger';

/**
 * Creates and configures a Prisma client instance with appropriate logging
 * and connection settings based on the current environment.
 * 
 * @returns Configured Prisma client instance
 */
function createPrismaClient(): PrismaClient {
  logger.info('Initializing Prisma client');
  
  try {
    // Determine log levels based on environment
    const logLevels = env.isDevelopment
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'];

    // Create the client with environment-specific configuration
    const prisma = new PrismaClient({
      log: logLevels.map((level) => ({
        emit: 'event',
        level,
      })),
    });

    // Set up logging events for real-time query monitoring
    if (env.isDevelopment) {
      prisma.$on('query', (e) => {
        logger.debug('Prisma Query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });
    }

    prisma.$on('info', (e) => {
      logger.info('Prisma Info', { message: e.message });
    });

    prisma.$on('warn', (e) => {
      logger.warn('Prisma Warning', { message: e.message });
    });

    prisma.$on('error', (e) => {
      logger.error('Prisma Error', { message: e.message });
    });

    logger.info('Prisma client initialized successfully');
    return prisma;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to initialize Prisma client: ${message}`, { error: err });
    throw new Error(`Database initialization failed: ${message}`);
  }
}

// Create a singleton instance of the Prisma client
const prisma = createPrismaClient();

/**
 * Establishes a connection to the database and verifies connectivity.
 * This should be called during application startup.
 * 
 * @returns Promise that resolves when connection is established
 * @throws Error if connection fails
 */
async function connectDatabase(): Promise<void> {
  try {
    logger.info('Connecting to database...');
    
    // Connect to the database
    await prisma.$connect();
    
    // Verify connectivity with a simple query
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    
    const connectionInfo = await getConnectionInfo();
    logger.info('Database connection established successfully', { connectionInfo });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to connect to database: ${message}`, { error: err });
    throw new Error(`Database connection failed: ${message}`);
  }
}

/**
 * Gracefully disconnects from the database.
 * This should be called during application shutdown.
 * 
 * @returns Promise that resolves when disconnection is complete
 * @throws Error if disconnection fails
 */
async function disconnectDatabase(): Promise<void> {
  try {
    logger.info('Disconnecting from database...');
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Error disconnecting from database: ${message}`, { error: err });
    throw new Error(`Database disconnection failed: ${message}`);
  }
}

/**
 * Retrieves information about the current database connection.
 * Useful for monitoring and debugging.
 * 
 * @returns Object containing connection information
 */
async function getConnectionInfo(): Promise<object> {
  try {
    // Query database for connection information
    const connectionInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as database_user,
        current_setting('server_version') as version,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
    `;

    // Parse the result (should be a single row)
    const info = Array.isArray(connectionInfo) && connectionInfo.length > 0
      ? connectionInfo[0]
      : { 
          database_name: 'unknown', 
          database_user: 'unknown', 
          version: 'unknown', 
          active_connections: 0,
          max_connections: 0
        };

    // Get pool size from connection parameters if available
    const poolSize = getPoolSizeFromConnectionString(secrets.DATABASE_URL);

    // Add environment information
    const result = {
      ...info,
      pool_size: poolSize,
      database_type: 'postgresql',
      connection_string: maskConnectionString(secrets.DATABASE_URL),
      environment: env.isDevelopment ? 'development' : env.isTest ? 'test' : 'production',
    };

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Error getting database connection info: ${message}`, { error: err });
    return {
      error: message,
      connection_string: maskConnectionString(secrets.DATABASE_URL),
      database_type: 'postgresql',
      environment: env.isDevelopment ? 'development' : env.isTest ? 'test' : 'production',
    };
  }
}

/**
 * Extracts pool size from connection string if specified
 * @param connectionString The database connection string
 * @returns The pool size if specified, otherwise default values based on environment
 */
function getPoolSizeFromConnectionString(connectionString: string): number {
  try {
    const url = new URL(connectionString);
    const poolSize = url.searchParams.get('pool_size') || 
                      url.searchParams.get('connection_limit');
    
    if (poolSize) {
      return parseInt(poolSize, 10);
    }
    
    // Default pool sizes based on environment
    return env.isDevelopment ? 5 : env.isTest ? 1 : 10;
  } catch {
    // If parsing fails, return default pool size
    return env.isDevelopment ? 5 : env.isTest ? 1 : 10;
  }
}

/**
 * Masks sensitive information in database connection string
 * @param connectionString The database connection string to mask
 * @returns Masked connection string
 */
function maskConnectionString(connectionString: string): string {
  try {
    // Create a URL object from the connection string
    const url = new URL(connectionString);
    
    // Mask the password if present
    if (url.password) {
      url.password = '********';
    }
    
    return url.toString();
  } catch {
    // If parsing fails, return a more aggressively masked string
    return connectionString.replace(/:\/\/[^@]+@/, '://*****@');
  }
}

// Export the Prisma client instance and utility functions
export {
  prisma,
  connectDatabase,
  disconnectDatabase,
  getConnectionInfo,
};