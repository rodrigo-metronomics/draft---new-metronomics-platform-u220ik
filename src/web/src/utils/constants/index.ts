/**
 * Constants Index
 * 
 * This file centralizes and re-exports all constants used throughout the Metronomics Platform.
 * It serves as a single import point for all application constants, ensuring consistency
 * and maintainability across the application.
 * 
 * By importing from this file instead of individual constant files, the application maintains
 * a cleaner import structure and simplifies refactoring and updates to constants.
 * 
 * Areas covered by these constants:
 * - Error messages for consistent error handling across the application
 * - Meeting stages and flows supporting the dynamic meeting moderator feature
 * - Metric types, units and calculations for the metrics dashboard
 * - Permissions for implementing role-based access control
 * - User roles and role hierarchy for authorization
 * - Application routes for consistent navigation throughout the platform
 */

// Error message constants
export * from './errorMessages';

// Meeting stage constants
export * from './meetingStages';

// Metric type constants
export * from './metricTypes';

// Permission constants
export * from './permissions';

// Role constants
export * from './roles';

// Route constants
export * from './routes';