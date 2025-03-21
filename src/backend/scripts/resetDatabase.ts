#!/usr/bin/env node
/**
 * Database Reset Script
 * 
 * This utility script resets the database to a clean state by dropping all
 * tables and recreating the schema using Prisma migrations. It is designed
 * to be used during development and testing to ensure a consistent database
 * state before running tests or seeding development data.
 * 
 * CAUTION: This script will PERMANENTLY DELETE all data in the database!
 * It is restricted to development and test environments only.
 */

import { execSync } from 'child_process'; // N/A
import prompt from 'prompts'; // ^2.4.2
import path from 'path'; // N/A
import { prisma, connectDatabase, disconnectDatabase } from '../src/config/database';
import { env } from '../src/config/environment';
import { logger } from '../src/utils/helpers/logger';

// Define the path to the Prisma schema
const PRISMA_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');

/**
 * Validates that the script is running in an appropriate environment
 * @returns True if environment is valid (development or test), false otherwise
 */
function validateEnvironment(): boolean {
  if (!env.isDevelopment && !env.isTest) {
    logger.warn('This script should only be run in development or test environments');
    console.error('\n⛔ This script can only be run in development or test environments');
    console.error('Current environment:', process.env.NODE_ENV);
    console.error('Aborting database reset\n');
    return false;
  }
  
  logger.info(`Environment validated: ${process.env.NODE_ENV}`);
  return true;
}

/**
 * Prompts the user to confirm database reset
 * @returns Promise resolving to a boolean indicating confirmation
 */
async function confirmDatabaseReset(): Promise<boolean> {
  console.warn('\n⚠️  WARNING: This will permanently delete ALL data in the database!');
  console.warn('All tables will be dropped and recreated.\n');
  
  const response = await prompt({
    type: 'text',
    name: 'confirm',
    message: 'Type "yes" to confirm database reset:',
    validate: value => value.toLowerCase() === 'yes' || value.toLowerCase() === 'no' 
      ? true 
      : 'Please type "yes" to confirm or "no" to abort'
  });

  return response.confirm?.toLowerCase() === 'yes';
}

/**
 * Drops all tables in the database
 * @returns Promise that resolves when all tables are dropped
 */
async function dropAllTables(): Promise<void> {
  logger.info('Dropping all tables');
  try {
    // Execute the Prisma command to drop all tables
    const output = executeCommand(`npx prisma migrate reset --force --skip-seed --schema=${PRISMA_SCHEMA_PATH}`);
    logger.info('All tables dropped successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to drop tables: ${message}`);
    throw new Error(`Failed to drop tables: ${message}`);
  }
}

/**
 * Applies all migrations to recreate the database schema
 * @returns Promise that resolves when migrations are applied
 */
async function applyMigrations(): Promise<void> {
  logger.info('Applying migrations to recreate schema');
  try {
    // Execute the Prisma Migrate deploy command
    const output = executeCommand(`npx prisma migrate deploy --schema=${PRISMA_SCHEMA_PATH}`);
    logger.info('Migrations applied successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to apply migrations: ${message}`);
    throw new Error(`Failed to apply migrations: ${message}`);
  }
}

/**
 * Executes a shell command and logs the output
 * @param command The command to execute
 * @returns The command output as a string
 */
function executeCommand(command: string): string {
  logger.info(`Executing command: ${command}`);
  try {
    // Execute the command and capture output
    const output = execSync(command, { encoding: 'utf8' });
    logger.info(`Command output: ${output.trim()}`);
    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Command execution failed: ${message}`);
    throw error;
  }
}

/**
 * Main function that orchestrates the database reset process
 */
async function main(): Promise<void> {
  console.log('\n🔄 Database Reset Utility\n');
  
  try {
    // Validate that we're in a safe environment
    if (!validateEnvironment()) {
      process.exit(1);
    }
    
    // Get confirmation before proceeding
    const confirmed = await confirmDatabaseReset();
    if (!confirmed) {
      console.log('\nDatabase reset aborted\n');
      process.exit(0);
    }
    
    console.log('\nResetting database...\n');
    
    // Connect to the database
    await connectDatabase();
    
    // Drop all tables and apply migrations
    // Note: prisma migrate reset already applies migrations, so we don't need to call applyMigrations
    await dropAllTables();
    
    // Disconnect from the database
    await disconnectDatabase();
    
    console.log('\n✅ Database reset completed successfully\n');
    logger.info('Database reset completed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ Database reset failed: ${message}\n`);
    logger.error(`Database reset failed: ${message}`);
    process.exit(1);
  }
}

// Execute the main function if this script is run directly
if (require.main === module) {
  main();
}

// Export functions for potential testing or programmatic use
export {
  main,
  validateEnvironment,
  confirmDatabaseReset,
  dropAllTables,
  applyMigrations,
  executeCommand
};