import { UserService } from './userService';
import { roleService } from './roleService';

/**
 * Index file that exports the user service and role service implementations for the Metronomics Platform.
 * This file serves as the entry point for user management functionality, providing access to user operations and role management through singleton service instances.
 */

// Create a singleton instance of the UserService class for user management operations
const userService = new UserService();

// Export the singleton instance of the UserService class
export { userService };

// Re-export the roleService singleton for role management operations
export { roleService };

// Export the UserService class for potential extension or custom instantiation
export { UserService };