import { get, post, put, patch, delete as deleteRequest } from './index';
import { ApiResponse } from '../../types/api.types';
import {
  Meeting,
  MeetingType,
  MeetingStatus,
  MeetingStageType,
  MeetingParticipant,
  ParticipantRole,
  AttendanceStatus,
  MeetingStage,
  MeetingNote,
  MeetingWithRelations,
  MeetingFilters,
  MeetingListParams,
  MeetingResponse,
  MeetingDetailResponse,
  MeetingListResponse,
  MeetingSummaryResponse,
  CreateMeetingDto,
  UpdateMeetingDto,
  UpdateMeetingStageDto,
  CreateMeetingNoteDto,
  UpdateMeetingParticipantDto,
  AddParticipantsDto,
  RemoveParticipantsDto,
  MeetingCalendarSyncDto,
  StartMeetingDto,
  EndMeetingDto,
  ChangeMeetingStageDto
} from '../../types/meeting.types';
import { CalendarProvider } from '../../types/calendar.types';

/**
 * Constants defining the meeting-related API endpoints
 */
const MEETING_ENDPOINTS = {
  GET_MEETINGS: '/meetings',
  GET_MEETING: '/meetings/:id',
  GET_UPCOMING_MEETINGS: '/meetings/upcoming',
  CREATE_MEETING: '/meetings',
  UPDATE_MEETING: '/meetings/:id',
  DELETE_MEETING: '/meetings/:id',
  GET_PARTICIPANTS: '/meetings/:id/participants',
  ADD_PARTICIPANTS: '/meetings/:id/participants',
  UPDATE_PARTICIPANT: '/meetings/:id/participants/:userId',
  REMOVE_PARTICIPANTS: '/meetings/:id/participants',
  GET_STAGES: '/meetings/:id/stages',
  GET_STAGE: '/meeting-stages/:id',
  CREATE_STAGE: '/meetings/:id/stages',
  UPDATE_STAGE: '/meeting-stages/:id',
  DELETE_STAGE: '/meeting-stages/:id',
  GET_NOTES: '/meetings/:id/notes',
  CREATE_NOTE: '/meetings/:id/notes',
  DELETE_NOTE: '/meeting-notes/:id',
  START_MEETING: '/meetings/:id/start',
  END_MEETING: '/meetings/:id/end',
  CHANGE_STAGE: '/meetings/:id/change-stage',
  SYNC_CALENDAR: '/meetings/:id/sync-calendar',
  GENERATE_SUMMARY: '/meetings/:id/summary'
};

/**
 * Fetches a paginated list of meetings with optional filtering and sorting
 * @param params - Filtering, pagination, and sorting parameters
 * @returns Promise resolving to a paginated list of meetings
 */
export const getMeetings = (
  params: MeetingListParams
): Promise<ApiResponse<MeetingListResponse>> => {
  return get<MeetingListResponse>(MEETING_ENDPOINTS.GET_MEETINGS, params);
};

/**
 * Fetches a single meeting by its ID
 * @param id - Meeting ID
 * @returns Promise resolving to the meeting data
 */
export const getMeetingById = (
  id: string
): Promise<ApiResponse<MeetingResponse>> => {
  const url = MEETING_ENDPOINTS.GET_MEETING.replace(':id', id);
  return get<MeetingResponse>(url);
};

/**
 * Fetches detailed meeting information including participants, stages, and action items
 * @param id - Meeting ID
 * @returns Promise resolving to the detailed meeting data
 */
export const getMeetingDetail = (
  id: string
): Promise<ApiResponse<MeetingDetailResponse>> => {
  const url = MEETING_ENDPOINTS.GET_MEETING.replace(':id', id);
  return get<MeetingDetailResponse>(url, { include: 'participants,stages,actionItems' });
};

/**
 * Fetches upcoming meetings for the current user
 * @param params - Optional limit and organization filter
 * @returns Promise resolving to a list of upcoming meetings
 */
export const getUpcomingMeetings = (
  params: { limit?: number, organizationId?: string } = {}
): Promise<ApiResponse<MeetingResponse[]>> => {
  return get<MeetingResponse[]>(MEETING_ENDPOINTS.GET_UPCOMING_MEETINGS, params);
};

/**
 * Creates a new meeting
 * @param meetingData - Meeting creation data
 * @returns Promise resolving to the created meeting data
 */
export const createMeeting = (
  meetingData: CreateMeetingDto
): Promise<ApiResponse<MeetingResponse>> => {
  return post<MeetingResponse>(MEETING_ENDPOINTS.CREATE_MEETING, meetingData);
};

/**
 * Updates an existing meeting
 * @param id - Meeting ID
 * @param meetingData - Meeting update data
 * @returns Promise resolving to the updated meeting data
 */
export const updateMeeting = (
  id: string,
  meetingData: UpdateMeetingDto
): Promise<ApiResponse<MeetingResponse>> => {
  const url = MEETING_ENDPOINTS.UPDATE_MEETING.replace(':id', id);
  return put<MeetingResponse>(url, meetingData);
};

/**
 * Deletes a meeting
 * @param id - Meeting ID
 * @returns Promise resolving to a success indicator
 */
export const deleteMeeting = (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = MEETING_ENDPOINTS.DELETE_MEETING.replace(':id', id);
  return deleteRequest<{ success: boolean }>(url);
};

/**
 * Fetches participants for a specific meeting
 * @param meetingId - Meeting ID
 * @returns Promise resolving to a list of meeting participants
 */
export const getParticipants = (
  meetingId: string
): Promise<ApiResponse<MeetingParticipant[]>> => {
  const url = MEETING_ENDPOINTS.GET_PARTICIPANTS.replace(':id', meetingId);
  return get<MeetingParticipant[]>(url);
};

/**
 * Adds multiple participants to a meeting
 * @param meetingId - Meeting ID
 * @param participantsData - Participants to add with their role
 * @returns Promise resolving to the updated list of participants
 */
export const addParticipants = (
  meetingId: string,
  participantsData: AddParticipantsDto
): Promise<ApiResponse<MeetingParticipant[]>> => {
  const url = MEETING_ENDPOINTS.ADD_PARTICIPANTS.replace(':id', meetingId);
  return post<MeetingParticipant[]>(url, participantsData);
};

/**
 * Updates a participant's role or attendance status
 * @param meetingId - Meeting ID
 * @param userId - User ID of the participant
 * @param participantData - Updated participant data
 * @returns Promise resolving to the updated participant data
 */
export const updateParticipant = (
  meetingId: string,
  userId: string,
  participantData: UpdateMeetingParticipantDto
): Promise<ApiResponse<MeetingParticipant>> => {
  const url = MEETING_ENDPOINTS.UPDATE_PARTICIPANT
    .replace(':id', meetingId)
    .replace(':userId', userId);
  return patch<MeetingParticipant>(url, participantData);
};

/**
 * Removes multiple participants from a meeting
 * @param meetingId - Meeting ID
 * @param participantsData - Participants to remove
 * @returns Promise resolving to a success indicator
 */
export const removeParticipants = (
  meetingId: string,
  participantsData: RemoveParticipantsDto
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = MEETING_ENDPOINTS.REMOVE_PARTICIPANTS.replace(':id', meetingId);
  return deleteRequest<{ success: boolean }>(url, participantsData);
};

/**
 * Fetches stages for a specific meeting
 * @param meetingId - Meeting ID
 * @returns Promise resolving to a list of meeting stages
 */
export const getStages = (
  meetingId: string
): Promise<ApiResponse<MeetingStage[]>> => {
  const url = MEETING_ENDPOINTS.GET_STAGES.replace(':id', meetingId);
  return get<MeetingStage[]>(url);
};

/**
 * Fetches a single meeting stage by its ID
 * @param stageId - Stage ID
 * @returns Promise resolving to the stage data
 */
export const getStageById = (
  stageId: string
): Promise<ApiResponse<MeetingStage>> => {
  const url = MEETING_ENDPOINTS.GET_STAGE.replace(':id', stageId);
  return get<MeetingStage>(url);
};

/**
 * Updates a meeting stage's content or completion status
 * @param stageId - Stage ID
 * @param stageData - Updated stage data
 * @returns Promise resolving to the updated stage data
 */
export const updateStage = (
  stageId: string,
  stageData: UpdateMeetingStageDto
): Promise<ApiResponse<MeetingStage>> => {
  const url = MEETING_ENDPOINTS.UPDATE_STAGE.replace(':id', stageId);
  return patch<MeetingStage>(url, stageData);
};

/**
 * Fetches notes for a specific meeting
 * @param meetingId - Meeting ID
 * @returns Promise resolving to a list of meeting notes
 */
export const getNotes = (
  meetingId: string
): Promise<ApiResponse<MeetingNote[]>> => {
  const url = MEETING_ENDPOINTS.GET_NOTES.replace(':id', meetingId);
  return get<MeetingNote[]>(url);
};

/**
 * Creates a new note for a meeting
 * @param noteData - Note creation data
 * @returns Promise resolving to the created note data
 */
export const createNote = (
  noteData: CreateMeetingNoteDto
): Promise<ApiResponse<MeetingNote>> => {
  const url = MEETING_ENDPOINTS.CREATE_NOTE.replace(':id', noteData.meetingId);
  return post<MeetingNote>(url, noteData);
};

/**
 * Deletes a meeting note
 * @param noteId - Note ID
 * @returns Promise resolving to a success indicator
 */
export const deleteNote = (
  noteId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = MEETING_ENDPOINTS.DELETE_NOTE.replace(':id', noteId);
  return deleteRequest<{ success: boolean }>(url);
};

/**
 * Starts a meeting and initializes real-time collaboration
 * @param meetingId - Meeting ID
 * @returns Promise resolving to the started meeting data and Firestore path for real-time collaboration
 */
export const startMeeting = (
  meetingId: string
): Promise<ApiResponse<{ meeting: MeetingResponse, firestorePath: string }>> => {
  const url = MEETING_ENDPOINTS.START_MEETING.replace(':id', meetingId);
  const startMeetingDto: StartMeetingDto = { meetingId };
  return post<{ meeting: MeetingResponse, firestorePath: string }>(url, startMeetingDto);
};

/**
 * Ends a meeting and optionally generates a summary
 * @param meetingId - Meeting ID
 * @param generateSummary - Whether to generate a meeting summary
 * @returns Promise resolving to the ended meeting data
 */
export const endMeeting = (
  meetingId: string,
  generateSummary: boolean = true
): Promise<ApiResponse<MeetingResponse>> => {
  const url = MEETING_ENDPOINTS.END_MEETING.replace(':id', meetingId);
  const endMeetingDto: EndMeetingDto = { meetingId, generateSummary };
  return post<MeetingResponse>(url, endMeetingDto);
};

/**
 * Changes the current stage of an active meeting
 * @param meetingId - Meeting ID
 * @param stageType - New stage type
 * @returns Promise resolving to the updated meeting data
 */
export const changeStage = (
  meetingId: string,
  stageType: MeetingStageType
): Promise<ApiResponse<MeetingResponse>> => {
  const url = MEETING_ENDPOINTS.CHANGE_STAGE.replace(':id', meetingId);
  const changeMeetingStageDto: ChangeMeetingStageDto = { meetingId, stageType };
  return post<MeetingResponse>(url, changeMeetingStageDto);
};

/**
 * Synchronizes a meeting with a calendar provider
 * @param meetingId - Meeting ID
 * @param provider - Calendar provider (Google or Microsoft)
 * @returns Promise resolving to the meeting data and calendar event details
 */
export const syncWithCalendar = (
  meetingId: string,
  provider: CalendarProvider
): Promise<ApiResponse<{ meeting: MeetingResponse, calendarEvent: { id: string, provider: CalendarProvider } }>> => {
  const url = MEETING_ENDPOINTS.SYNC_CALENDAR.replace(':id', meetingId);
  const syncDto: MeetingCalendarSyncDto = { meetingId, provider };
  return post<{ meeting: MeetingResponse, calendarEvent: { id: string, provider: CalendarProvider } }>(url, syncDto);
};

/**
 * Generates a summary for a completed meeting
 * @param meetingId - Meeting ID
 * @returns Promise resolving to the meeting summary data
 */
export const generateMeetingSummary = (
  meetingId: string
): Promise<ApiResponse<MeetingSummaryResponse>> => {
  const url = MEETING_ENDPOINTS.GENERATE_SUMMARY.replace(':id', meetingId);
  return get<MeetingSummaryResponse>(url);
};