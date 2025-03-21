/**
 * Prisma Migration Generator Script
 * 
 * This script automates the creation of Prisma migrations with consistent naming and validation.
 * It ensures that migrations are properly named, documented, and only generated when needed.
 * 
 * Usage: npm run generate-migration
 */
import { execSync } from 'child_process'; // N/A
import prompt from 'prompts'; // ^2.4.2
import path from 'path'; // N/A
import fs from 'fs'; // N/A
import { env } from '../src/config/environment';
import { logger } from '../src/utils/helpers/logger';

// Path to the Prisma schema file
const PRISMA_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');

/**
 * Main function to orchestrate the migration generation process
 */
async function main(): Promise<void> {
  try {
    // Check if running in a supported environment
    if (!validateEnvironment()) {
      return;
    }

    // Verify schema file exists
    if (!fs.existsSync(PRISMA_SCHEMA_PATH)) {
      logger.error(`Schema file not found at ${PRISMA_SCHEMA_PATH}`);
      process.exit(1);
    }

    // Get the migration name from the user
    const migrationName = await getMigrationName();

    // Check if there are any schema changes that require migration
    const hasChanges = await checkForSchemaChanges();
    if (!hasChanges) {
      logger.info('No schema changes detected. Migration not needed.');
      process.exit(0);
    }

    // Confirm before generating migration
    const confirmed = await confirmMigration();
    if (!confirmed) {
      logger.info('Migration generation cancelled by user.');
      process.exit(0);
    }

    // Generate the migration
    await generateMigration(migrationName);
    
    logger.info(`Migration "${migrationName}" successfully created.`);
  } catch (error) {
    logger.error(`Failed to generate migration: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Validates that the script is running in an appropriate environment
 * @returns True if environment is valid, false otherwise
 */
function validateEnvironment(): boolean {
  if (!env.isDevelopment && !env.isTest) {
    logger.warn('Migration generation should only be run in development or test environments.');
    logger.warn('Current environment appears to be production or staging.');
    logger.warn('Exiting to prevent accidental production migrations.');
    return false;
  }
  return true;
}

/**
 * Prompts the user for a migration name and validates it
 * @returns Validated migration name
 */
async function getMigrationName(): Promise<string> {
  const { value } = await prompt({
    type: 'text',
    name: 'value',
    message: 'Enter a descriptive name for the migration (e.g., add-user-profile-fields):',
    validate: (value) => {
      if (!value) {
        return 'Migration name is required';
      }
      if (value.length < 3) {
        return 'Migration name must be at least 3 characters';
      }
      if (!/^[a-z0-9\s\-_]+$/i.test(value)) {
        return 'Migration name must contain only letters, numbers, spaces, hyphens, and underscores';
      }
      return true;
    }
  });

  // Format the migration name: convert to lowercase, replace spaces with hyphens
  const formattedName = value.toLowerCase().replace(/\s+/g, '-');
  
  return formattedName;
}

/**
 * Checks if there are any pending schema changes that require a migration
 * @returns True if changes exist, false otherwise
 */
async function checkForSchemaChanges(): Promise<boolean> {
  logger.info('Checking for schema changes...');
  
  try {
    // This command will output information about pending changes
    const output = executeCommand('npx prisma migrate status');
    
    // Check if the output indicates that the database is up to date
    const noChangesIndication = output.includes('Database schema is up to date');
    
    if (noChangesIndication) {
      logger.info('No schema changes detected.');
      return false;
    } else {
      logger.info('Schema changes detected.');
      return true;
    }
  } catch (error) {
    // If the command fails, assume changes exist to be safe
    logger.warn(`Error checking for schema changes: ${error instanceof Error ? error.message : String(error)}`);
    logger.info('Proceeding assuming changes exist.');
    return true;
  }
}

/**
 * Prompts the user to confirm migration generation
 * @returns User confirmation result
 */
async function confirmMigration(): Promise<boolean> {
  const { confirmed } = await prompt({
    type: 'confirm',
    name: 'confirmed',
    message: 'Generate migration with the provided name?',
    initial: true
  });

  return confirmed;
}

/**
 * Generates a new Prisma migration with the provided name
 * @param migrationName Name for the migration
 */
async function generateMigration(migrationName: string): Promise<void> {
  logger.info(`Generating migration "${migrationName}"...`);
  
  try {
    // Execute prisma migrate dev to create the migration
    executeCommand(`npx prisma migrate dev --name ${migrationName} --create-only`);
    
    logger.info('Migration files generated successfully.');
  } catch (error) {
    logger.error(`Failed to generate migration: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error('Migration generation failed');
  }
}

/**
 * Executes a shell command and logs the output
 * @param command Command to execute
 * @returns Command output
 */
function executeCommand(command: string): string {
  try {
    logger.info(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    logger.info(output);
    return output;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      // This is likely an ExecSyncError with a status code
      logger.error(`Command failed with status ${(error as any).status}: ${error.message}`);
      throw error;
    }
    
    logger.error(`Command execution failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  main().catch((error) => {
    logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}

// Export functions for testing or programmatic use
export { main, validateEnvironment, getMigrationName, checkForSchemaChanges, confirmMigration, generateMigration, executeCommand };