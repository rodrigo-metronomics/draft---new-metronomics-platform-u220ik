import z from 'zod'; // v3.22.4
import { VALIDATION_ERRORS, ORGANIZATION_ERRORS } from '../constants/errorMessages';

/**
 * Validates that a string is a valid IANA timezone identifier
 * @param timezone The timezone string to validate
 * @returns True if the timezone is valid, false otherwise
 */
export const validateTimezone = (timezone: string): boolean => {
  // Check if the timezone string is a valid IANA timezone identifier
  const timezoneRegex = /^(Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z_]+(?:\/[A-Za-z_]+)*$|^UTC$|^GMT[+-][0-9]{1,2}$/;
  return timezoneRegex.test(timezone);
};

/**
 * Validates that a string is a valid CSS color format (hex, rgb, rgba)
 * @param color The color string to validate
 * @returns True if the color format is valid, false otherwise
 */
export const validateColorFormat = (color: string): boolean => {
  // Check for hex format (#FFF or #FFFFFF)
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  
  // Check for rgb format (rgb(r,g,b))
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  
  // Check for rgba format (rgba(r,g,b,a))
  const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*(?:\.\d+)?)\s*\)$/;
  
  return hexRegex.test(color) || rgbRegex.test(color) || rgbaRegex.test(color);
};

/**
 * Validation schema for organization branding settings
 */
export const brandingSettingsSchema = z.object({
  logo: z.string().url().optional().nullable(),
  primaryColor: z.string().refine(validateColorFormat, {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'primaryColor').replace('{1}', 'CSS color')
  }).optional(),
  secondaryColor: z.string().refine(validateColorFormat, {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'secondaryColor').replace('{1}', 'CSS color')
  }).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  customCss: z.string().optional().nullable()
});

/**
 * Validation schema for calendar integration settings
 */
export const calendarIntegrationSettingsSchema = z.object({
  defaultMeetingDuration: z.number().int().min(5).max(480).optional(), // In minutes (5 min to 8 hours)
  defaultReminders: z.array(
    z.number().int().min(0).max(10080) // In minutes (up to 1 week)
  ).optional(),
  timezone: z.string().refine(validateTimezone, {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'timezone').replace('{1}', 'IANA timezone identifier')
  }).optional(),
  enableCalendarSync: z.boolean().optional(),
  syncedCalendars: z.array(
    z.object({
      type: z.enum(['google', 'microsoft']), 
      id: z.string()
    })
  ).optional()
});

/**
 * Validation schema for notification settings
 */
export const notificationSettingsSchema = z.object({
  emailNotifications: z.object({
    meetingReminders: z.boolean().optional(),
    actionItems: z.boolean().optional(),
    goalUpdates: z.boolean().optional(),
    metricAlerts: z.boolean().optional(),
    dailyDigest: z.boolean().optional(),
    weeklyDigest: z.boolean().optional()
  }).optional(),
  inAppNotifications: z.object({
    meetingReminders: z.boolean().optional(),
    actionItems: z.boolean().optional(),
    goalUpdates: z.boolean().optional(),
    metricAlerts: z.boolean().optional(),
    mentions: z.boolean().optional()
  }).optional(),
  notificationFrequency: z.enum(['realtime', 'hourly', 'daily']).optional()
});

/**
 * Validation schema for complete organization settings
 */
export const organizationSettingsSchema = z.object({
  branding: brandingSettingsSchema.optional(),
  calendarIntegration: calendarIntegrationSettingsSchema.optional(),
  notifications: notificationSettingsSchema.optional(),
  metricDefaults: z.record(z.string(), z.any()).optional(), // Flexible structure for metric defaults
  meetingDefaults: z.object({
    dailyMeetingTemplate: z.string().optional(),
    weeklyMeetingTemplate: z.string().optional(),
    quarterlyMeetingTemplate: z.string().optional()
  }).optional()
});

/**
 * Validation schema for creating a new organization
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100)
    .refine(val => val.trim().length > 0, {
      message: VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'name')
    }),
  description: z.string().max(500).optional(),
  settings: organizationSettingsSchema.optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional()
});

/**
 * Validation schema for updating an organization
 */
export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: organizationSettingsSchema.optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional()
});

/**
 * Validation schema for updating organization settings
 */
export const updateOrganizationSettingsSchema = organizationSettingsSchema;

/**
 * Validation schema for organization filtering parameters
 */
export const organizationFiltersSchema = z.object({
  search: z.string().optional(),
  userId: z.string().optional(), // Filter by user membership
  coachId: z.string().optional(), // Filter by coach
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});