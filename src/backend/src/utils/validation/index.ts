/**
 * Centralized export file for all validation schemas and helper functions used throughout the Metronomics Platform.
 * This file aggregates validation functionality from domain-specific modules to provide a single import point
 * for consistent data validation across the application.
 *
 * @module validation
 */

// Re-export all validation schemas and utilities from goal-related validations
export {
  validateGoalDates,
  validateMilestoneDates,
  createGoalSchema,
  updateGoalSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  goalFiltersSchema
} from './goalValidation';

// Re-export all validation schemas and utilities from KFFM-related validations
export {
  validateNodePosition,
  validateConnection,
  createKFFMSchema,
  updateKFFMSchema,
  createKFFMNodeSchema,
  updateKFFMNodeSchema,
  createKFFMConnectionSchema,
  updateKFFMConnectionSchema,
  kffmFiltersSchema
} from './kffmValidation';

// Re-export all validation schemas and utilities from meeting-related validations
export {
  validateMeetingDates,
  validateStageSequence,
  createMeetingSchema,
  updateMeetingSchema,
  meetingFiltersSchema,
  addParticipantSchema,
  updateParticipantSchema,
  createMeetingStageSchema,
  updateMeetingStageSchema,
  createMeetingNoteSchema
} from './meetingValidation';

// Re-export all validation schemas and utilities from metric-related validations
export {
  validateMetricThresholds,
  validateFormulaForCalculationMethod,
  validateMetricValueRange,
  createMetricSchema,
  updateMetricSchema,
  createMetricValueSchema,
  createMetricThresholdSchema,
  updateMetricThresholdSchema,
  metricFiltersSchema,
  metricValueFiltersSchema
} from './metricValidation';

// Re-export all validation schemas and utilities from organization-related validations
export {
  validateTimezone,
  validateColorFormat,
  brandingSettingsSchema,
  calendarIntegrationSettingsSchema,
  notificationSettingsSchema,
  organizationSettingsSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationSettingsSchema,
  organizationFiltersSchema
} from './organizationValidation';

// Re-export all validation schemas and utilities from user-related validations
export {
  validateEmail,
  validatePassword,
  emailSchema,
  passwordSchema,
  createUserSchema,
  updateUserSchema,
  userInviteSchema,
  updateUserPreferencesSchema,
  userFiltersSchema,
  changePasswordSchema,
  resetPasswordSchema
} from './userValidation';