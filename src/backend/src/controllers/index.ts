import authController from './auth.controller';
import { GoalController } from './goal.controller';
import { KFFMController } from './kffm.controller';
import { MeetingController } from './meeting.controller';
import { MetricController } from './metric.controller';
import { OrganizationController } from './organization.controller';
import { UserController } from './user.controller';

/**
 * Centralized export file for all controllers in the Metronomics Platform. 
 * This file aggregates and re-exports all controller classes to provide a single import point for route configuration.
 */

// Export authentication controller for route configuration
export { authController };

// Export goal controller for route configuration
export { GoalController };

// Export KFFM controller for route configuration
export { KFFMController };

// Export meeting controller for route configuration
export { MeetingController };

// Export metric controller for route configuration
export { MetricController };

// Export organization controller for route configuration
export { OrganizationController };

// Export user controller for route configuration
export { UserController };