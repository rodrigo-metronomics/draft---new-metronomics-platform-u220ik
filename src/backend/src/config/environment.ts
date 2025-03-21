/**
 * Environment Configuration Module
 * 
 * Loads and validates environment variables for the Metronomics Platform.
 * This module provides a centralized interface for accessing environment-specific settings
 * and determines runtime behavior based on the current environment (development, test, production).
 */
import dotenv from 'dotenv'; // v16.0.3
import { z } from 'zod'; // v3.21.4
import { logger } from '../utils/helpers/logger';

/**
 * Loads environment variables from .env files based on the current NODE_ENV
 * @returns Validated environment configuration object
 */
export function loadEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  logger.info(`Loading environment for ${nodeEnv}`);
  
  try {
    // Attempt to load .env file (common variables)
    const commonEnvResult = dotenv.config({ path: '.env', override: false });
    
    // Attempt to load environment-specific .env file
    const envPath = `.env.${nodeEnv}`;
    const specificEnvResult = dotenv.config({ path: envPath, override: false });
    
    // Log which files were successfully loaded
    if (!commonEnvResult.error) {
      logger.info('Loaded common .env file');
    }
    
    if (!specificEnvResult.error) {
      logger.info(`Loaded ${envPath} file`);
    }
    
    // Validate environment variables
    const validatedEnv = validateEnvironment(process.env);
    
    // Add derived environment properties
    const enrichedEnv = {
      ...validatedEnv,
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production',
      isTest: nodeEnv === 'test',
    };
    
    logger.info(`Environment loaded successfully for ${nodeEnv}`);
    return enrichedEnv;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to load environment: ${errorMessage}`);
    throw err;
  }
}

/**
 * Validates that all required environment variables are present and correctly typed
 * @param envObject Object containing environment variables to validate
 * @returns Validated environment object
 */
function validateEnvironment(envObject: Record<string, any>) {
  // Create a URL validation schema that also accepts localhost URLs
  const urlSchema = z.string().url().or(z.string().regex(/^http:\/\/localhost(:\d+)?/));
  
  // Define validation schema using zod
  const envSchema = z.object({
    // Required environment variables with defaults
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    API_VERSION: z.string().default('v1'),
    API_PREFIX: z.string().default('/api'),
    
    // Required environment variables without defaults
    CLIENT_URL: urlSchema,
    SERVER_URL: urlSchema,
    
    // Transformed environment variables
    CORS_ORIGINS: z.string()
      .transform(val => val.split(',').map(origin => origin.trim())),
    
    // Enum environment variables with defaults
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  });
  
  try {
    return envSchema.parse(envObject);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      const formattedErrors = validationError.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      logger.error('Environment validation failed', { errors: formattedErrors });
      
      console.error('\n❌ Invalid environment configuration:');
      formattedErrors.forEach(err => {
        console.error(`  • ${err.path}: ${err.message}`);
      });
      console.error('\nPlease check your .env files and ensure all required variables are set correctly.\n');
    } else {
      logger.error('Unexpected error during environment validation', { error: validationError });
      console.error('\n❌ Unexpected error during environment validation\n');
    }
    
    process.exit(1);
  }
}

// Load and validate environment on module import
export const env = loadEnvironment();