import { z } from 'zod'; // zod 3.x
import { GoalType, GoalStatus, MilestoneStatus } from '../../types/goal.types';
import { VALIDATION_ERRORS } from '../constants/errorMessages';

/**
 * Validates that goal dates are in a valid range based on goal type
 * 
 * @param startDate The goal start date
 * @param endDate The goal end date
 * @param goalType The type of goal (BHAG, THREE_HAG, ONE_HAG, QUARTERLY)
 * @returns True if dates are valid, error message if invalid
 */
export const validateGoalDates = (
  startDate: Date,
  endDate: Date,
  goalType: GoalType
): boolean | string => {
  if (startDate >= endDate) {
    return "Start date must be before end date";
  }

  // Calculate duration in milliseconds
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = durationMs / (1000 * 60 * 60 * 24);
  
  switch (goalType) {
    case GoalType.BHAG:
      // BHAG should be at least 5 years (1825 days)
      if (durationDays < 1825) {
        return "BHAG must have a duration of at least 5 years";
      }
      break;
    case GoalType.THREE_HAG:
      // THREE_HAG should be between 2-4 years (730 to 1460 days)
      if (durationDays < 730 || durationDays > 1460) {
        return "3HAG must have a duration between 2 and 4 years";
      }
      break;
    case GoalType.ONE_HAG:
      // ONE_HAG should be between 9-15 months (roughly 270 to 456 days)
      if (durationDays < 270 || durationDays > 456) {
        return "1HAG must have a duration between 9 and 15 months";
      }
      break;
    case GoalType.QUARTERLY:
      // QUARTERLY should be between 2-4 months (roughly 60 to 122 days)
      if (durationDays < 60 || durationDays > 122) {
        return "Quarterly goal must have a duration between 2 and 4 months";
      }
      break;
    default:
      return "Invalid goal type";
  }

  return true;
};

/**
 * Validates that milestone dates are within the parent goal's date range
 * 
 * @param dueDate The milestone due date
 * @param goalStartDate The parent goal start date
 * @param goalEndDate The parent goal end date
 * @returns True if date is valid, error message if invalid
 */
export const validateMilestoneDates = (
  dueDate: Date,
  goalStartDate: Date,
  goalEndDate: Date
): boolean | string => {
  if (dueDate < goalStartDate) {
    return "Milestone due date cannot be before the goal start date";
  }
  
  if (dueDate > goalEndDate) {
    return "Milestone due date cannot be after the goal end date";
  }
  
  return true;
};

/**
 * Schema for validating goal creation requests
 */
export const createGoalSchema = z.object({
  type: z.nativeEnum(GoalType, {
    errorMap: () => ({ message: VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'type') })
  }),
  title: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'title'))
    .max(200, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'title').replace('{1}', '1').replace('{2}', '200')),
  description: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'description')),
  startDate: z.coerce.date({
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'startDate').replace('{1}', 'valid date') })
  }),
  endDate: z.coerce.date({
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'endDate').replace('{1}', 'valid date') })
  }),
  organizationId: z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'organizationId').replace('{1}', 'UUID')
  }),
  metricIds: z.array(z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'metricIds').replace('{1}', 'UUID')
  })).optional(),
}).refine(
  (data) => {
    const validation = validateGoalDates(data.startDate, data.endDate, data.type);
    return validation === true;
  },
  {
    message: (data) => {
      const validation = validateGoalDates(data.startDate, data.endDate, data.type);
      return typeof validation === 'string' ? validation : "Invalid date range for the goal type";
    },
    path: ["endDate"]
  }
);

/**
 * Schema for validating goal update requests
 */
export const updateGoalSchema = z.object({
  title: z.string().min(1)
    .max(200, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'title').replace('{1}', '1').replace('{2}', '200'))
    .optional(),
  description: z.string().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  progress: z.number()
    .min(0, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'progress').replace('{1}', '0').replace('{2}', '100'))
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'progress').replace('{1}', '0').replace('{2}', '100'))
    .optional(),
  metricIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    // If both dates are provided, validate that start date is before end date
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"]
  }
);

/**
 * Schema for validating milestone creation requests
 */
export const createMilestoneSchema = z.object({
  title: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'title'))
    .max(200, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'title').replace('{1}', '1').replace('{2}', '200')),
  description: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'description')),
  dueDate: z.coerce.date({
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'dueDate').replace('{1}', 'valid date') })
  }),
  goalId: z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'goalId').replace('{1}', 'UUID')
  }),
});

/**
 * Schema for validating milestone update requests
 */
export const updateMilestoneSchema = z.object({
  title: z.string().min(1)
    .max(200, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'title').replace('{1}', '1').replace('{2}', '200'))
    .optional(),
  description: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  status: z.nativeEnum(MilestoneStatus).optional(),
});

/**
 * Schema for validating goal filtering parameters
 */
export const goalFiltersSchema = z.object({
  type: z.nativeEnum(GoalType).optional(),
  status: z.nativeEnum(GoalStatus).optional(),
  organizationId: z.string().uuid().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  endDateFrom: z.coerce.date().optional(),
  endDateTo: z.coerce.date().optional(),
}).refine(
  (data) => {
    // If both startDate range bounds are provided, validate the range
    if (data.startDateFrom && data.startDateTo) {
      return data.startDateFrom <= data.startDateTo;
    }
    return true;
  },
  {
    message: "startDateFrom must be before or equal to startDateTo",
    path: ["startDateTo"]
  }
).refine(
  (data) => {
    // If both endDate range bounds are provided, validate the range
    if (data.endDateFrom && data.endDateTo) {
      return data.endDateFrom <= data.endDateTo;
    }
    return true;
  },
  {
    message: "endDateFrom must be before or equal to endDateTo",
    path: ["endDateTo"]
  }
);