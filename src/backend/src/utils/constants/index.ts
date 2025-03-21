/**
 * Centralized export file for all constants used throughout the Metronomics Platform.
 * 
 * This file aggregates and re-exports constants from specialized constant files 
 * (error messages, meeting stages, metric types, permissions, and roles) to provide 
 * a single import point for all application constants.
 * 
 * Benefits:
 * - Single source of truth for all constant values
 * - Simplified imports across the application
 * - Consistent naming and organization
 * - Easier maintenance and updates
 * 
 * Usage:
 * import { AUTH_ERRORS, MEETING_STAGES, Permission } from 'utils/constants';
 */

// Import all constants from specific domains
import * as errorMessages from './errorMessages';
import * as meetingStages from './meetingStages';
import * as metricTypes from './metricTypes';
import * as permissions from './permissions';
import * as roles from './roles';

// Error Messages
export const {
  AUTH_ERRORS,
  VALIDATION_ERRORS,
  RESOURCE_ERRORS,
  MEETING_ERRORS,
  METRIC_ERRORS,
  ORGANIZATION_ERRORS,
  INTEGRATION_ERRORS,
  SERVER_ERRORS
} = errorMessages;

// Meeting Stages
export const {
  MEETING_STAGES,
  DEFAULT_MEETING_STAGES
} = meetingStages;

// Metric Types
export const {
  METRIC_UNITS,
  METRIC_DISPLAY_FORMATS,
  METRIC_DEFAULT_COLORS,
  METRIC_TREND_ICONS,
  DEFAULT_COMPARISON_PERIODS,
  METRIC_VALUE_LIMITS
} = metricTypes;

// Permissions
export const {
  Permission,
  DEFAULT_PERMISSIONS,
  RESOURCE_PERMISSIONS,
  getPermissionDisplayName
} = permissions;

// Roles
export const {
  UserRole,
  ROLE_HIERARCHY,
  getRoleDisplayName
} = roles;