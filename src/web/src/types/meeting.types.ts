/**
 * TypeScript type definitions for meeting-related entities in the Metronomics Platform frontend.
 * This file defines interfaces, enums, and types for meetings, meeting stages, participants,
 * and related data structures used throughout the application.
 */

import { ID, Timestamp, PaginatedResult, PaginationParams } from './common.types';
import { User } from './user.types';
import { CalendarProvider, CalendarEvent } from './calendar.types';

/**
 * Enum for action item status in the Metronomics Platform.
 * Represents the current state of an action item.
 */
export enum ActionItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled'
}

/**
 * Enum for action item priority levels in the Metronomics Platform.
 * Used to indicate the importance and urgency of action items.
 */
export enum ActionItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interface for action item references in meetings to prevent circular dependencies.
 * Contains essential information about action items for display in meeting contexts.
 */
export interface ActionItemReference {
  id: ID;
  description: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  dueDate: Timestamp | null;
  assigneeId: ID;
  assigneeName: string;
}

/**
 * Enum for meeting types in the Metronomics framework.
 * Defines the different types of meetings supported by the platform.
 */
export enum MeetingType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  QUARTERLY = 'quarterly'
}

/**
 * Enum for meeting status values.
 * Represents the current state of a meeting in its lifecycle.
 */
export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Enum for meeting stage types in the Metronomics framework.
 * Defines the different stages a meeting progresses through.
 */
export enum MeetingStageType {
  SETUP = 'setup',
  GOOD_NEWS = 'goodNews',
  PREVIOUS_ACTIONS = 'previousActions',
  METRICS = 'metrics',
  PRIORITIES = 'priorities',
  BLOCKERS = 'blockers',
  NEW_ACTIONS = 'newActions',
  SUMMARY = 'summary'
}

/**
 * Enum for participant roles in meetings.
 * Defines the different roles users can have in a meeting.
 */
export enum ParticipantRole {
  MODERATOR = 'moderator',
  PARTICIPANT = 'participant',
  OBSERVER = 'observer'
}

/**
 * Enum for attendance status values.
 * Indicates a participant's response to a meeting invitation.
 */
export enum AttendanceStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative'
}

/**
 * Interface for a meeting entity.
 * Represents the core data structure for meetings in the system.
 */
export interface Meeting {
  id: ID;
  title: string;
  description: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  startTime: Timestamp;
  endTime: Timestamp;
  currentStage: MeetingStageType | null;
  organizationId: ID;
  createdById: ID;
  createdBy: User | null;
  recurrenceRule: string | null;
  calendarEventId: string | null;
  calendarProvider: CalendarProvider | null;
  location: string | null;
  virtualMeetingUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

/**
 * Extended meeting interface that includes related entities.
 * Includes participants, stages, and action items for a comprehensive view.
 */
export interface MeetingWithRelations extends Meeting {
  participants: MeetingParticipant[];
  stages: MeetingStage[];
  actionItems: ActionItemReference[];
}

/**
 * Interface for a meeting participant entity.
 * Represents a user's participation in a specific meeting.
 */
export interface MeetingParticipant {
  id: ID;
  meetingId: ID;
  userId: ID;
  user: User | null;
  role: ParticipantRole;
  attendanceStatus: AttendanceStatus;
  joinedAt: Timestamp | null;
  leftAt: Timestamp | null;
  isOnline: boolean;
  lastActivity: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Interface for a meeting stage entity.
 * Represents a specific stage within a meeting with its content and status.
 */
export interface MeetingStage {
  id: ID;
  meetingId: ID;
  stageType: MeetingStageType;
  content: string;
  sequence: number;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Interface for a meeting note entity.
 * Represents textual notes taken during a meeting.
 */
export interface MeetingNote {
  id: ID;
  meetingId: ID;
  stageType: MeetingStageType | null;
  content: string;
  createdById: ID;
  createdBy: User | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Data transfer object for creating a new meeting.
 * Contains all required fields to create a meeting in the system.
 */
export interface CreateMeetingDto {
  title: string;
  description: string;
  meetingType: MeetingType;
  startTime: Timestamp;
  endTime: Timestamp;
  organizationId: ID;
  participantIds: ID[];
  moderatorIds: ID[];
  recurrenceRule: string | null;
  location: string | null;
  virtualMeetingUrl: string | null;
  syncWithCalendar: boolean;
}

/**
 * Data transfer object for updating an existing meeting.
 * Contains fields that can be updated for a meeting.
 */
export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  startTime?: Timestamp;
  endTime?: Timestamp;
  status?: MeetingStatus;
  currentStage?: MeetingStageType | null;
  recurrenceRule?: string | null;
  location?: string | null;
  virtualMeetingUrl?: string | null;
  syncWithCalendar?: boolean;
}

/**
 * Data transfer object for updating a meeting stage.
 * Contains fields that can be updated for a meeting stage.
 */
export interface UpdateMeetingStageDto {
  content: string;
  completedAt: Timestamp | null;
}

/**
 * Data transfer object for creating a meeting note.
 * Contains fields required to create a note in a meeting.
 */
export interface CreateMeetingNoteDto {
  meetingId: ID;
  stageType: MeetingStageType | null;
  content: string;
}

/**
 * Data transfer object for updating a meeting participant.
 * Contains fields that can be updated for a participant.
 */
export interface UpdateMeetingParticipantDto {
  role?: ParticipantRole;
  attendanceStatus?: AttendanceStatus;
}

/**
 * Data transfer object for adding participants to a meeting.
 * Contains user IDs to add and their role in the meeting.
 */
export interface AddParticipantsDto {
  userIds: ID[];
  role: ParticipantRole;
}

/**
 * Data transfer object for removing participants from a meeting.
 * Contains user IDs to remove from the meeting.
 */
export interface RemoveParticipantsDto {
  userIds: ID[];
}

/**
 * Interface for filtering meetings by various criteria.
 * Used to search and filter meetings in list views.
 */
export interface MeetingFilters {
  organizationId: ID;
  status?: MeetingStatus;
  meetingType?: MeetingType;
  participantId?: ID;
  startDateFrom?: Timestamp;
  startDateTo?: Timestamp;
  search?: string;
}

/**
 * Enum for meeting sort field options.
 * Defines the possible fields to sort meeting lists by.
 */
export enum MeetingSort {
  START_TIME = 'startTime',
  TITLE = 'title',
  STATUS = 'status',
  MEETING_TYPE = 'meetingType',
  CREATED_AT = 'createdAt'
}

/**
 * Parameters for paginated meeting lists with filtering and sorting.
 * Extends both meeting filters and pagination parameters.
 */
export interface MeetingListParams extends MeetingFilters, PaginationParams {
  sortBy: MeetingSort;
}

/**
 * Response format for meeting data in API responses.
 * Contains formatted data ready for frontend consumption.
 */
export interface MeetingResponse {
  id: ID;
  title: string;
  description: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  startTime: string;
  endTime: string;
  currentStage: MeetingStageType | null;
  organizationId: ID;
  createdBy: { id: ID; name: string };
  location: string | null;
  virtualMeetingUrl: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Detailed response format for meeting data including relations.
 * Contains complete meeting data with related entities.
 */
export interface MeetingDetailResponse {
  id: ID;
  title: string;
  description: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  startTime: string;
  endTime: string;
  currentStage: MeetingStageType | null;
  organizationId: ID;
  createdBy: { id: ID; name: string };
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
 * Response format for meeting participant data.
 * Contains formatted participant data for API responses.
 */
export interface MeetingParticipantResponse {
  id: ID;
  userId: ID;
  name: string;
  email: string;
  photoURL: string | null;
  role: ParticipantRole;
  attendanceStatus: AttendanceStatus;
  isOnline: boolean;
  joinedAt: string | null;
  leftAt: string | null;
}

/**
 * Response format for meeting stage data.
 * Contains formatted stage data for API responses.
 */
export interface MeetingStageResponse {
  id: ID;
  stageType: MeetingStageType;
  content: string;
  sequence: number;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Response format for paginated meeting list.
 * Extends the generic paginated result with meeting response type.
 */
export interface MeetingListResponse extends PaginatedResult<MeetingResponse> {}

/**
 * Response format for meeting summary data.
 * Contains a summarized view of a completed meeting.
 */
export interface MeetingSummaryResponse {
  id: ID;
  title: string;
  meetingType: MeetingType;
  date: string;
  duration: number;
  participantCount: number;
  keyPoints: string[];
  actionItems: ActionItemReference[];
}

/**
 * Simplified reference to a meeting to prevent circular dependencies.
 * Contains minimal meeting information for display in related contexts.
 */
export interface MeetingReference {
  id: ID;
  title: string;
  meetingType: MeetingType;
  startTime: Timestamp;
  status: MeetingStatus;
}

/**
 * Statistics about meetings for dashboards and reporting.
 * Contains aggregated metrics about meetings in the system.
 */
export interface MeetingStats {
  total: number;
  completed: number;
  upcoming: number;
  inProgress: number;
  byType: { type: MeetingType; count: number }[];
  averageDuration: number;
}

/**
 * Real-time update for participant presence in a meeting.
 * Used to track who is currently active in a meeting.
 */
export interface MeetingPresenceUpdate {
  meetingId: ID;
  userId: ID;
  isOnline: boolean;
  lastActivity: Timestamp;
}

/**
 * Real-time update for meeting stage content changes.
 * Used to synchronize stage content between participants.
 */
export interface MeetingStageUpdate {
  meetingId: ID;
  stageId: ID;
  content: string;
  updatedBy: ID;
  timestamp: Timestamp;
}

/**
 * Data transfer object for starting a meeting.
 * Contains the meeting ID to start.
 */
export interface StartMeetingDto {
  meetingId: ID;
}

/**
 * Data transfer object for ending a meeting.
 * Contains the meeting ID and whether to generate a summary.
 */
export interface EndMeetingDto {
  meetingId: ID;
  generateSummary: boolean;
}

/**
 * Data transfer object for changing the current meeting stage.
 * Contains the meeting ID and the stage to change to.
 */
export interface ChangeMeetingStageDto {
  meetingId: ID;
  stageType: MeetingStageType;
}

/**
 * Data transfer object for syncing a meeting with a calendar provider.
 * Contains the meeting ID and the calendar provider to sync with.
 */
export interface MeetingCalendarSyncDto {
  meetingId: ID;
  provider: CalendarProvider;
}