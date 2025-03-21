/**
 * Secrets Management Module
 * 
 * Securely loads, validates, and provides access to sensitive configuration values
 * such as API keys, database credentials, and service account information for the
 * Metronomics Platform backend.
 */
import { z } from 'zod'; // v3.21.4
import AWS from 'aws-sdk'; // v2.1386.0
import { logger } from '../utils/helpers/logger';
import { env } from './environment';

// Define the schema for secrets validation
const secretsSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string(),
  
  // Firebase
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_DATABASE_URL: z.string().url(),
  
  // OAuth providers
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  MICROSOFT_CLIENT_ID: z.string(),
  MICROSOFT_CLIENT_SECRET: z.string(),
  
  // Email service
  SENDGRID_API_KEY: z.string(),
  SENDGRID_FROM_EMAIL: z.string().email(),
  
  // AWS
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  
  // Monitoring
  HONEYCOMB_API_KEY: z.string()
});

// TypeScript type derived from the Zod schema
type Secrets = z.infer<typeof secretsSchema>;

/**
 * Retrieves secrets from AWS Secrets Manager in production environment
 * @returns Promise<object> Secrets retrieved from AWS Secrets Manager
 */
async function getAwsSecrets(): Promise<Record<string, any>> {
  try {
    logger.info('Loading secrets from AWS Secrets Manager');
    
    // Initialize AWS Secrets Manager client
    const secretsManager = new AWS.SecretsManager({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      } : {})
    });
    
    // Get the appropriate secret name based on environment
    const secretName = `metronomics/${env.NODE_ENV}/app`;
    
    // Retrieve the secret
    const response = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    
    // Parse the secret string into an object
    let secretData: Record<string, any> = {};
    if (response.SecretString) {
      secretData = JSON.parse(response.SecretString);
    } else if (response.SecretBinary) {
      const buff = Buffer.from(response.SecretBinary as any, 'base64');
      secretData = JSON.parse(buff.toString('utf8'));
    }
    
    logger.info('Successfully loaded secrets from AWS Secrets Manager');
    return secretData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to load secrets from AWS Secrets Manager: ${errorMessage}`);
    throw new Error(`Failed to load secrets from AWS: ${errorMessage}`);
  }
}

/**
 * Retrieves secrets from environment variables in development and test environments
 * @returns object Secrets retrieved from environment variables
 */
function getLocalSecrets(): Record<string, any> {
  logger.info('Loading secrets from environment variables');
  
  try {
    // Extract required secrets from environment variables
    const secrets: Record<string, any> = {
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
      HONEYCOMB_API_KEY: process.env.HONEYCOMB_API_KEY
    };
    
    // In test environment, we might want to use mock values for certain secrets
    if (env.isTest) {
      logger.info('Using mock values for certain secrets in test environment');
      
      // Set mock values for specific secrets in test environment if not provided
      secrets.JWT_SECRET = secrets.JWT_SECRET || 'test-jwt-secret-at-least-32-characters-long';
      secrets.DATABASE_URL = secrets.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/metronomics_test';
      secrets.REDIS_URL = secrets.REDIS_URL || 'redis://localhost:6379';
    }
    
    logger.info('Successfully loaded secrets from environment variables');
    return secrets;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to load secrets from environment variables: ${errorMessage}`);
    throw new Error(`Failed to load secrets from environment: ${errorMessage}`);
  }
}

/**
 * Validates that all required secrets are present and correctly typed
 * @param secretsObject Object containing secrets to validate
 * @returns Validated secrets object
 */
function validateSecrets(secretsObject: Record<string, any>): Secrets {
  try {
    logger.info('Validating secrets');
    
    // Parse the secrets object against the schema
    const validatedSecrets = secretsSchema.parse(secretsObject);
    
    logger.info('Secrets validation successful');
    return validatedSecrets;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      logger.error('Secrets validation failed', { errors: formattedErrors });
      
      console.error('\n❌ Invalid secrets configuration:');
      formattedErrors.forEach(err => {
        console.error(`  • ${err.path}: ${err.message}`);
      });
      console.error('\nPlease check your environment variables or AWS Secrets Manager.\n');
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Unexpected error during secrets validation: ${errorMessage}`);
      console.error('\n❌ Unexpected error during secrets validation\n');
    }
    
    // Exit process on validation failure in production
    // In development, throw an error to allow for debugging
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      throw error;
    }
  }
}

/**
 * Loads secrets from appropriate sources based on the current environment
 * This can be called explicitly at application startup to load secrets from AWS in production
 * @returns Promise<Secrets> Validated secrets object
 */
export async function loadSecrets(): Promise<Secrets> {
  try {
    // Determine where to load secrets from based on environment
    let secretsObject: Record<string, any>;
    
    if (env.NODE_ENV === 'production' && !env.isDevelopment && !env.isTest) {
      // In production, load from AWS Secrets Manager
      secretsObject = await getAwsSecrets();
    } else {
      // In development or test, load from environment variables
      secretsObject = getLocalSecrets();
    }
    
    // Validate the secrets
    const validatedSecrets = validateSecrets(secretsObject);
    
    // Update the exported secrets object with the newly loaded values
    Object.keys(validatedSecrets).forEach((key) => {
      (secrets as any)[key] = (validatedSecrets as any)[key];
    });
    
    logger.info('Secrets loaded successfully');
    return validatedSecrets;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to load secrets: ${errorMessage}`);
    
    // In production, exit the process on secrets loading failure
    if (env.NODE_ENV === 'production') {
      console.error('Cannot start application without valid secrets. Exiting process.');
      process.exit(1);
    }
    
    throw error;
  }
}

// Initialize secrets from environment variables on module load
let secrets: Secrets;

try {
  // Load initial secrets from environment variables
  const localSecrets = getLocalSecrets();
  secrets = validateSecrets(localSecrets);
  
  // In production, log a warning that this should be replaced with AWS Secrets Manager values
  if (env.NODE_ENV === 'production' && !env.isDevelopment && !env.isTest) {
    logger.warn('Using environment variables for secrets in production - call loadSecrets() before your application starts to load secrets from AWS Secrets Manager');
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error(`Failed to initialize secrets: ${errorMessage}`);
  
  // Provide a default export that will throw an error when accessed
  secrets = new Proxy({} as Secrets, {
    get: (target, prop) => {
      throw new Error(`Cannot access secrets - initialization failed: ${errorMessage}`);
    }
  });
  
  // In production, we want to exit immediately if secrets initialization fails
  if (env.NODE_ENV === 'production' && !env.isDevelopment && !env.isTest) {
    process.exit(1);
  }
}

// Export the secrets object and the loadSecrets function
export { secrets };