/**
 * TypeScript type definitions for meeting-related entities in the Metronomics Platform.
 * This file defines interfaces, enums, and DTOs for meeting management, types, stages,
 * and participant information.
 */

import { User } from './user.types';

/**
 * Enum defining the possible types of meetings in the Metronomics framework
 */
export enum MeetingType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  QUARTERLY = 'QUARTERLY'
}

/**
 * Enum defining the possible statuses of a meeting
 */
export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Enum defining the possible stages of a meeting in the Metronomics framework
 */
export enum MeetingStageType {
  SETUP = 'SETUP',
  GOOD_NEWS = 'GOOD_NEWS',
  PREVIOUS_ACTIONS = 'PREVIOUS_ACTIONS',
  METRICS = 'METRICS',
  PRIORITIES = 'PRIORITIES',
  BLOCKERS = 'BLOCKERS',
  NEW_ACTIONS = 'NEW_ACTIONS',
  SUMMARY = 'SUMMARY'
}

/**
 * Enum defining the possible statuses for an action item
 * (locally defined to avoid circular dependency)
 */
export enum ActionItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED'
}

/**
 * Enum defining the possible priority levels for an action item
 * (locally defined to avoid circular dependency)
 */
export enum ActionItemPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Simplified reference to an action item
 * (locally defined to avoid circular dependency)
 */
export interface ActionItemReference {
  id: string;
  description: string;
  assigneeId: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  dueDate: Date | null;
  meetingId: string;
}

/**
 * Enum defining the possible roles of meeting participants
 */
export enum ParticipantRole {
  MODERATOR = 'MODERATOR',
  PARTICIPANT = 'PARTICIPANT',
  OBSERVER = 'OBSERVER'
}

/**
 * Enum defining the possible attendance statuses for meeting participants
 */
export enum AttendanceStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  TENTATIVE = 'TENTATIVE'
}

/**
 * Core meeting entity interface
 */
export interface Meeting {
  id: string;
  title: string;
  description: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  startTime: Date;
  endTime: Date;
  currentStage: MeetingStageType | null;
  organizationId: string;
  createdById: string;
  createdBy: User;
  recurrenceRule: string | null;
  calendarEventId: string | null;
  calendarProvider: string | null;
  location: string | null;
  virtualMeetingUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

/**
 * Extended meeting interface that includes related entities
 */
export interface MeetingWithRelations extends Meeting {
  participants: MeetingParticipant[];
  stages: MeetingStage[];
  actionItems: ActionItemReference[];
}

/**
 * Interface for meeting participant entity
 */
export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  user: User;
  role: ParticipantRole;
  attendanceStatus: AttendanceStatus;
  joinedAt: Date | null;
  leftAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for meeting stage entity
 */
export interface MeetingStage {
  id: string;
  meetingId: string;
  stageType: MeetingStageType;
  content: string;
  sequence: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for meeting note entity
 */
export interface MeetingNote {
  id: string;
  meetingId: string;
  stageType: MeetingStageType | null;
  content: string;
  createdById: string;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data transfer object for creating a new meeting
 */
export interface CreateMeetingDto {
  title: string;
  description: string;
  meetingType: MeetingType;
  startTime: Date;
  endTime: Date;
  organizationId: string;
  participantIds: string[];
  moderatorIds: string[];
  recurrenceRule: string | null;
  location: string | null;
  virtualMeetingUrl: string | null;
  syncWithCalendar: boolean;
}

/**
 * Data transfer object for updating an existing meeting
 */
export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  status?: MeetingStatus;
  currentStage?: MeetingStageType | null;
  recurrenceRule?: string | null;
  location?: string | null;
  virtualMeetingUrl?: string | null;
}

/**
 * Data transfer object for updating a meeting stage
 */
export interface UpdateMeetingStageDto {
  content: string;
  completedAt: Date | null;
}

/**
 * Data transfer object for creating a meeting note
 */
export interface CreateMeetingNoteDto {
  meetingId: string;
  stageType: MeetingStageType | null;
  content: string;
}

/**
 * Data transfer object for updating a meeting participant
 */
export interface UpdateMeetingParticipantDto {
  role?: ParticipantRole;
  attendanceStatus?: AttendanceStatus;
}

/**
 * Data transfer object for adding participants to a meeting
 */
export interface AddParticipantsDto {
  userIds: string[];
  role: ParticipantRole;
}

/**
 * Data transfer object for removing participants from a meeting
 */
export interface RemoveParticipantsDto {
  userIds: string[];
}

/**
 * Interface for filtering meetings by various criteria
 */
export interface MeetingFilters {
  organizationId: string;
  status?: MeetingStatus;
  meetingType?: MeetingType;
  participantId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  search?: string;
}

/**
 * Response format for meeting data in API responses
 */
export interface MeetingResponse {
  id: string;
  title: string;
  description: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  startTime: string;
  endTime: string;
  currentStage: MeetingStageType | null;
  organizationId: string;
  createdBy: { id: string; name: string };
  location: string | null;
  virtualMeetingUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Detailed response format for meeting data including relations
 */
export interface MeetingDetailResponse {
  id: string;
  title: string;
  description: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  startTime: string;
  endTime: string;
  currentStage: MeetingStageType | null;
  organizationId: string;
  createdBy: { id: string; name: string };
  participants: MeetingParticipantResponse[];
  stages: MeetingStageResponse[];
  actionItems: ActionItemReference[];
  recurrenceRule: string | null;
  location: string | null;
  virtualMeetingUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Response format for meeting participant data
 */
export interface MeetingParticipantResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: ParticipantRole;
  attendanceStatus: AttendanceStatus;
  joinedAt: string | null;
  leftAt: string | null;
}

/**
 * Response format for meeting stage data
 */
export interface MeetingStageResponse {
  id: string;
  stageType: MeetingStageType;
  content: string;
  sequence: number;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Response format for paginated meeting list
 */
export interface MeetingListResponse {
  meetings: MeetingResponse[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Response format for meeting summary data
 */
export interface MeetingSummaryResponse {
  id: string;
  title: string;
  meetingType: MeetingType;
  date: string;
  duration: number;
  participantCount: number;
  keyPoints: string[];
  actionItems: ActionItemReference[];
}

/**
 * Simplified reference to a meeting to prevent circular dependencies
 */
export interface MeetingReference {
  id: string;
  title: string;
  meetingType: MeetingType;
  startTime: Date;
  status: MeetingStatus;
}