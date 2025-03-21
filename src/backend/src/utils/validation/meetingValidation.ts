/**
 * Validation schemas for meeting-related data using Zod.
 * This file provides validation rules for creating, updating, and filtering meetings,
 * as well as managing meeting participants, stages, and notes, ensuring data integrity
 * and consistency for the meeting management features.
 */
import { z } from 'zod'; // v3.x
import {
  MeetingType,
  MeetingStatus,
  MeetingStageType,
  ParticipantRole,
  AttendanceStatus,
} from '../../types/meeting.types';
import { DEFAULT_MEETING_STAGES } from '../constants/meetingStages';
import { 
  VALIDATION_ERRORS,
  MEETING_ERRORS
} from '../constants/errorMessages';

/**
 * Validates that meeting dates are in a valid range
 * 
 * @param startTime - Meeting start time
 * @param endTime - Meeting end time
 * @returns True if dates are valid, error message if invalid
 */
export const validateMeetingDates = (startTime: Date, endTime: Date): boolean | string => {
  // Check if start time is before end time
  if (startTime >= endTime) {
    return 'Meeting end time must be after start time';
  }

  // Calculate meeting duration in minutes
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  // Ensure meeting is not too short (at least 15 minutes)
  if (durationMinutes < 15) {
    return 'Meeting must be at least 15 minutes long';
  }

  // Ensure meeting is not unreasonably long (not more than 24 hours)
  if (durationMinutes > 24 * 60) {
    return 'Meeting cannot be longer than 24 hours';
  }

  return true;
};

/**
 * Validates that a meeting stage transition is valid based on the meeting type and current stage
 * 
 * @param currentStage - Current meeting stage
 * @param newStage - Target meeting stage
 * @param meetingType - Type of meeting
 * @returns True if transition is valid, error message if invalid
 */
export const validateStageSequence = (
  currentStage: MeetingStageType,
  newStage: MeetingStageType,
  meetingType: MeetingType
): boolean | string => {
  // Get the default stage sequence for the given meeting type
  const stageSequence = DEFAULT_MEETING_STAGES[meetingType];
  
  // Find the sequence numbers for the current and new stages
  const currentStageIdx = stageSequence.findIndex(stage => stage.stageType === currentStage);
  const newStageIdx = stageSequence.findIndex(stage => stage.stageType === newStage);
  
  // If either stage is not found in the sequence, it's invalid
  if (currentStageIdx === -1 || newStageIdx === -1) {
    return MEETING_ERRORS.INVALID_STAGE;
  }
  
  // Stage transitions are valid if:
  // 1. Moving to the next stage in sequence
  // 2. Moving to the previous stage
  // 3. Staying on the same stage
  const isNextStage = newStageIdx === currentStageIdx + 1;
  const isPreviousStage = newStageIdx === currentStageIdx - 1;
  const isSameStage = newStageIdx === currentStageIdx;
  
  if (isNextStage || isPreviousStage || isSameStage) {
    return true;
  }
  
  return `Invalid stage transition from ${currentStage} to ${newStage}`;
};

/**
 * Schema for validating meeting creation requests
 */
export const createMeetingSchema = z.object({
  title: z.string()
    .min(3, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'title').replace('{1}', '3').replace('{2}', '100'))
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'title').replace('{1}', '3').replace('{2}', '100')),
  
  description: z.string()
    .max(500, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'description').replace('{1}', '0').replace('{2}', '500'))
    .optional(),
  
  meetingType: z.enum([MeetingType.DAILY, MeetingType.WEEKLY, MeetingType.QUARTERLY], {
    errorMap: () => ({ message: `Meeting type must be one of: ${Object.values(MeetingType).join(', ')}` })
  }),
  
  startTime: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }).refine((date) => !isNaN(date.getTime()), {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'startTime').replace('{1}', 'valid date')
  }),
  
  endTime: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }).refine((date) => !isNaN(date.getTime()), {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'endTime').replace('{1}', 'valid date')
  }),
  
  organizationId: z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'organizationId').replace('{1}', 'UUID')
  }),
  
  participantIds: z.array(z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'participantId').replace('{1}', 'UUID')
  })).default([]),
  
  moderatorIds: z.array(z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'moderatorId').replace('{1}', 'UUID')
  })).default([]),
  
  recurrenceRule: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  virtualMeetingUrl: z.string().url({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'virtualMeetingUrl').replace('{1}', 'valid URL')
  }).optional().nullable(),
  
  syncWithCalendar: z.boolean().default(false)
}).refine(
  (data) => validateMeetingDates(data.startTime, data.endTime) === true,
  {
    message: `Invalid meeting times: ${validateMeetingDates}`,
    path: ['startTime', 'endTime']
  }
);

/**
 * Schema for validating meeting update requests
 */
export const updateMeetingSchema = z.object({
  title: z.string()
    .min(3, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'title').replace('{1}', '3').replace('{2}', '100'))
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'title').replace('{1}', '3').replace('{2}', '100'))
    .optional(),
  
  description: z.string()
    .max(500, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'description').replace('{1}', '0').replace('{2}', '500'))
    .optional(),
  
  startTime: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }).refine((date) => !isNaN(date.getTime()), {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'startTime').replace('{1}', 'valid date')
  }).optional(),
  
  endTime: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }).refine((date) => !isNaN(date.getTime()), {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'endTime').replace('{1}', 'valid date')
  }).optional(),
  
  status: z.enum([
    MeetingStatus.SCHEDULED,
    MeetingStatus.IN_PROGRESS,
    MeetingStatus.COMPLETED,
    MeetingStatus.CANCELLED
  ], {
    errorMap: () => ({ message: `Meeting status must be one of: ${Object.values(MeetingStatus).join(', ')}` })
  }).optional(),
  
  currentStage: z.enum([
    MeetingStageType.SETUP,
    MeetingStageType.GOOD_NEWS,
    MeetingStageType.PREVIOUS_ACTIONS,
    MeetingStageType.METRICS,
    MeetingStageType.PRIORITIES,
    MeetingStageType.BLOCKERS,
    MeetingStageType.NEW_ACTIONS,
    MeetingStageType.SUMMARY
  ], {
    errorMap: () => ({ message: `Meeting stage must be one of: ${Object.values(MeetingStageType).join(', ')}` })
  }).nullable().optional(),
  
  recurrenceRule: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  virtualMeetingUrl: z.string().url({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'virtualMeetingUrl').replace('{1}', 'valid URL')
  }).optional().nullable(),
}).refine(
  (data) => {
    // If both start and end time are provided, validate them
    if (data.startTime && data.endTime) {
      return validateMeetingDates(data.startTime, data.endTime) === true;
    }
    return true;
  },
  {
    message: `Invalid meeting times`,
    path: ['startTime', 'endTime']
  }
);

/**
 * Schema for validating meeting filtering parameters
 */
export const meetingFiltersSchema = z.object({
  organizationId: z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'organizationId').replace('{1}', 'UUID')
  }),
  
  status: z.enum([
    MeetingStatus.SCHEDULED,
    MeetingStatus.IN_PROGRESS,
    MeetingStatus.COMPLETED,
    MeetingStatus.CANCELLED
  ], {
    errorMap: () => ({ message: `Meeting status must be one of: ${Object.values(MeetingStatus).join(', ')}` })
  }).optional(),
  
  meetingType: z.enum([
    MeetingType.DAILY,
    MeetingType.WEEKLY,
    MeetingType.QUARTERLY
  ], {
    errorMap: () => ({ message: `Meeting type must be one of: ${Object.values(MeetingType).join(', ')}` })
  }).optional(),
  
  participantId: z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'participantId').replace('{1}', 'UUID')
  }).optional(),
  
  startDateFrom: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }).refine((date) => !isNaN(date.getTime()), {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'startDateFrom').replace('{1}', 'valid date')
  }).optional(),
  
  startDateTo: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }).refine((date) => !isNaN(date.getTime()), {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'startDateTo').replace('{1}', 'valid date')
  }).optional(),
  
  search: z.string().optional(),
  
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema for validating adding participants to a meeting
 */
export const addParticipantSchema = z.object({
  userIds: z.array(z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'userId').replace('{1}', 'UUID')
  })).min(1, 'At least one user ID must be provided'),
  
  role: z.enum([
    ParticipantRole.MODERATOR,
    ParticipantRole.PARTICIPANT,
    ParticipantRole.OBSERVER
  ], {
    errorMap: () => ({ message: `Role must be one of: ${Object.values(ParticipantRole).join(', ')}` })
  }),
});

/**
 * Schema for validating updating a participant's role or status
 */
export const updateParticipantSchema = z.object({
  role: z.enum([
    ParticipantRole.MODERATOR,
    ParticipantRole.PARTICIPANT,
    ParticipantRole.OBSERVER
  ], {
    errorMap: () => ({ message: `Role must be one of: ${Object.values(ParticipantRole).join(', ')}` })
  }).optional(),
  
  attendanceStatus: z.enum([
    AttendanceStatus.PENDING,
    AttendanceStatus.ACCEPTED,
    AttendanceStatus.DECLINED,
    AttendanceStatus.TENTATIVE
  ], {
    errorMap: () => ({ message: `Attendance status must be one of: ${Object.values(AttendanceStatus).join(', ')}` })
  }).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be specified for update',
    path: []
  }
);

/**
 * Schema for validating meeting stage creation
 */
export const createMeetingStageSchema = z.object({
  meetingId: z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'meetingId').replace('{1}', 'UUID')
  }),
  
  stageType: z.enum([
    MeetingStageType.SETUP,
    MeetingStageType.GOOD_NEWS,
    MeetingStageType.PREVIOUS_ACTIONS,
    MeetingStageType.METRICS,
    MeetingStageType.PRIORITIES,
    MeetingStageType.BLOCKERS,
    MeetingStageType.NEW_ACTIONS,
    MeetingStageType.SUMMARY
  ], {
    errorMap: () => ({ message: `Stage type must be one of: ${Object.values(MeetingStageType).join(', ')}` })
  }),
  
  content: z.string().default(''),
  sequence: z.number().int().nonnegative().optional(),
});

/**
 * Schema for validating meeting stage updates
 */
export const updateMeetingStageSchema = z.object({
  content: z.string().optional(),
  
  completedAt: z.string().or(z.date()).transform((val) => {
    return typeof val === 'string' ? new Date(val) : val;
  }).refine((date) => !isNaN(date.getTime()), {
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'completedAt').replace('{1}', 'valid date')
  }).nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be specified for update',
    path: []
  }
);

/**
 * Schema for validating meeting note creation
 */
export const createMeetingNoteSchema = z.object({
  meetingId: z.string().uuid({
    message: VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'meetingId').replace('{1}', 'UUID')
  }),
  
  stageType: z.enum([
    MeetingStageType.SETUP,
    MeetingStageType.GOOD_NEWS,
    MeetingStageType.PREVIOUS_ACTIONS,
    MeetingStageType.METRICS,
    MeetingStageType.PRIORITIES,
    MeetingStageType.BLOCKERS,
    MeetingStageType.NEW_ACTIONS,
    MeetingStageType.SUMMARY
  ], {
    errorMap: () => ({ message: `Stage type must be one of: ${Object.values(MeetingStageType).join(', ')}` })
  }).nullable().optional(),
  
  content: z.string().min(1, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'content').replace('{1}', '1').replace('{2}', '2000'))
    .max(2000, VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'content').replace('{1}', '1').replace('{2}', '2000')),
});