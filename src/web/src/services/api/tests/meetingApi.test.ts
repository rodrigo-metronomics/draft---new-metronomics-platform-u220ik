import { jest } from 'jest'; // ^29.5.0 Testing framework for running tests and mocking functions
import * as meetingApi from '../meetingApi'; // Import all meeting API functions to be tested
import { get, post, put, patch, delete as del } from '../index'; // Import base API functions to mock in tests
import { MeetingType, MeetingStatus, MeetingStageType, ParticipantRole, AttendanceStatus } from '../../types/meeting.types'; // Import meeting-related enums for test data
import { CalendarProvider } from '../../types/calendar.types'; // Import calendar provider enum for calendar integration tests
import { mockMeeting } from '../../../tests/mocks/apiMocks'; // Import mock meeting data for tests

// Define mock responses for API calls
const mockApiResponse = { success: true, message: null, data: {} };
const mockMeetingResponse = {
  id: 'meeting-123',
  title: 'Daily Standup',
  description: 'Team daily check-in',
  meetingType: 'DAILY',
  status: 'SCHEDULED',
  startTime: '2023-06-15T09:00:00Z',
  endTime: '2023-06-15T09:30:00Z',
  currentStage: null,
  organizationId: 'org-123',
  createdBy: { id: 'user-123', name: 'John Doe' },
  location: 'Conference Room A',
  virtualMeetingUrl: 'https://meet.example.com/123',
  createdAt: '2023-06-10T12:00:00Z',
  completedAt: null
};
const mockMeetingDetailResponse = {
  id: 'meeting-123',
  title: 'Daily Standup',
  description: 'Team daily check-in',
  meetingType: 'DAILY',
  status: 'SCHEDULED',
  startTime: '2023-06-15T09:00:00Z',
  endTime: '2023-06-15T09:30:00Z',
  currentStage: null,
  organizationId: 'org-123',
  createdBy: { id: 'user-123', name: 'John Doe' },
  participants: [{ id: 'participant-123', userId: 'user-123', name: 'John Doe', email: 'john@example.com', photoURL: null, role: 'MODERATOR', attendanceStatus: 'ACCEPTED', isOnline: false, joinedAt: null, leftAt: null }],
  stages: [{ id: 'stage-123', stageType: 'GOOD_NEWS', content: '', sequence: 1, startedAt: null, completedAt: null }],
  actionItems: [],
  recurrenceRule: 'FREQ=DAILY',
  location: 'Conference Room A',
  virtualMeetingUrl: 'https://meet.example.com/123',
  createdAt: '2023-06-10T12:00:00Z',
  completedAt: null
};
const mockMeetingListResponse = {
  items: [{
    id: 'meeting-123',
    title: 'Daily Standup',
    description: 'Team daily check-in',
    meetingType: 'DAILY',
    status: 'SCHEDULED',
    startTime: '2023-06-15T09:00:00Z',
    endTime: '2023-06-15T09:30:00Z',
    currentStage: null,
    organizationId: 'org-123',
    createdBy: { id: 'user-123', name: 'John Doe' },
    location: 'Conference Room A',
    virtualMeetingUrl: 'https://meet.example.com/123',
    createdAt: '2023-06-10T12:00:00Z',
    completedAt: null
  }],
  total: 1,
  page: 1,
  pageSize: 10,
  totalPages: 1
};
const mockParticipantsResponse = [{ id: 'participant-123', userId: 'user-123', name: 'John Doe', email: 'john@example.com', photoURL: null, role: 'MODERATOR', attendanceStatus: 'ACCEPTED', isOnline: false, joinedAt: null, leftAt: null }];
const mockStagesResponse = [{ id: 'stage-123', stageType: 'GOOD_NEWS', content: '', sequence: 1, startedAt: null, completedAt: null }];
const mockNotesResponse = [{ id: 'note-123', meetingId: 'meeting-123', stageType: 'GOOD_NEWS', content: 'Team shared positive updates', createdById: 'user-123', createdBy: { id: 'user-123', name: 'John Doe' }, createdAt: '2023-06-15T09:05:00Z', updatedAt: '2023-06-15T09:05:00Z' }];
const mockStartMeetingResponse = { meeting: { id: 'meeting-123', title: 'Daily Standup', status: 'IN_PROGRESS', currentStage: 'GOOD_NEWS' }, firestorePath: 'meetings/meeting-123' };
const mockMeetingSummaryResponse = {
  id: 'meeting-123',
  title: 'Daily Standup',
  meetingType: 'DAILY',
  date: '2023-06-15',
  duration: 30,
  participantCount: 5,
  keyPoints: ['Team discussed Q2 targets', 'New feature launch scheduled for next week', 'Identified performance bottleneck in API'],
  actionItems: [{ id: 'action-123', description: 'Fix API performance issue', status: 'PENDING', priority: 'HIGH', dueDate: '2023-06-20T00:00:00Z', assigneeId: 'user-456', assigneeName: 'Jane Smith' }]
};
const mockCalendarSyncResponse = { meeting: { id: 'meeting-123', title: 'Daily Standup' }, calendarEvent: { id: 'event-123', provider: 'GOOGLE' } };

// Mock the base API functions
const getMock = jest.fn();
const postMock = jest.fn();
const putMock = jest.fn();
const patchMock = jest.fn();
const deleteMock = jest.fn();

// Function to set up mocks for the API functions before each test
function setupMocks() {
  getMock.mockResolvedValue(mockApiResponse);
  postMock.mockResolvedValue(mockApiResponse);
  putMock.mockResolvedValue(mockApiResponse);
  patchMock.mockResolvedValue(mockApiResponse);
  deleteMock.mockResolvedValue(mockApiResponse);

  (get as jest.Mock) = getMock;
  (post as jest.Mock) = postMock;
  (put as jest.Mock) = putMock;
  (patch as jest.Mock) = patchMock;
  (del as jest.Mock) = deleteMock;
}

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe('meetingApi', () => {
  it('getMeetings should call get with the correct URL and parameters', async () => {
    const params = { page: 1, pageSize: 10 };
    getMock.mockResolvedValue({ ...mockApiResponse, data: mockMeetingListResponse });
    await meetingApi.getMeetings(params);
    expect(getMock).toHaveBeenCalledWith('/meetings', params);
  });

  it('getMeetingById should call get with the correct URL', async () => {
    getMock.mockResolvedValue({ ...mockApiResponse, data: mockMeetingResponse });
    await meetingApi.getMeetingById('meeting-123');
    expect(getMock).toHaveBeenCalledWith('/meetings/meeting-123');
  });

  it('getMeetingDetail should call get with the correct URL and include parameter', async () => {
    getMock.mockResolvedValue({ ...mockApiResponse, data: mockMeetingDetailResponse });
    await meetingApi.getMeetingDetail('meeting-123');
    expect(getMock).toHaveBeenCalledWith('/meetings/meeting-123', { include: 'participants,stages,actionItems' });
  });

  it('getUpcomingMeetings should call get with the correct URL and parameters', async () => {
    getMock.mockResolvedValue({ ...mockApiResponse, data: [mockMeetingResponse] });
    await meetingApi.getUpcomingMeetings({ limit: 5 });
    expect(getMock).toHaveBeenCalledWith('/meetings/upcoming', { limit: 5 });
  });

  it('createMeeting should call post with the correct URL and meeting data', async () => {
    const meetingData = { title: 'New Meeting', description: 'Test' };
    postMock.mockResolvedValue({ ...mockApiResponse, data: mockMeetingResponse });
    await meetingApi.createMeeting(meetingData as any);
    expect(postMock).toHaveBeenCalledWith('/meetings', meetingData);
  });

  it('updateMeeting should call put with the correct URL and meeting data', async () => {
    const meetingData = { title: 'Updated Meeting', description: 'Test' };
    putMock.mockResolvedValue({ ...mockApiResponse, data: mockMeetingResponse });
    await meetingApi.updateMeeting('meeting-123', meetingData as any);
    expect(putMock).toHaveBeenCalledWith('/meetings/meeting-123', meetingData);
  });

  it('deleteMeeting should call delete with the correct URL', async () => {
    deleteMock.mockResolvedValue({ ...mockApiResponse, data: { success: true } });
    await meetingApi.deleteMeeting('meeting-123');
    expect(deleteMock).toHaveBeenCalledWith('/meetings/meeting-123');
  });

  it('getParticipants should call get with the correct URL', async () => {
    getMock.mockResolvedValue({ ...mockApiResponse, data: mockParticipantsResponse });
    await meetingApi.getParticipants('meeting-123');
    expect(getMock).toHaveBeenCalledWith('/meetings/meeting-123/participants');
  });

  it('addParticipants should call post with the correct URL and participants data', async () => {
    const participantsData = { userIds: ['user-456'], role: ParticipantRole.PARTICIPANT };
    postMock.mockResolvedValue({ ...mockApiResponse, data: mockParticipantsResponse });
    await meetingApi.addParticipants('meeting-123', participantsData as any);
    expect(postMock).toHaveBeenCalledWith('/meetings/meeting-123/participants', participantsData);
  });

  it('updateParticipant should call patch with the correct URL and participant data', async () => {
    const participantData = { role: ParticipantRole.OBSERVER, attendanceStatus: AttendanceStatus.TENTATIVE };
    patchMock.mockResolvedValue({ ...mockApiResponse, data: mockParticipantsResponse[0] });
    await meetingApi.updateParticipant('meeting-123', 'user-456', participantData as any);
    expect(patchMock).toHaveBeenCalledWith('/meetings/meeting-123/participants/user-456', participantData);
  });

  it('removeParticipants should call delete with the correct URL and participants data', async () => {
    const participantsData = { userIds: ['user-456'] };
    deleteMock.mockResolvedValue({ ...mockApiResponse, data: { success: true } });
    await meetingApi.removeParticipants('meeting-123', participantsData as any);
    expect(deleteMock).toHaveBeenCalledWith('/meetings/meeting-123/participants', participantsData);
  });

  it('getStages should call get with the correct URL', async () => {
    getMock.mockResolvedValue({ ...mockApiResponse, data: mockStagesResponse });
    await meetingApi.getStages('meeting-123');
    expect(getMock).toHaveBeenCalledWith('/meetings/meeting-123/stages');
  });

  it('getStageById should call get with the correct URL', async () => {
    getMock.mockResolvedValue({ ...mockApiResponse, data: mockStagesResponse[0] });
    await meetingApi.getStageById('stage-123');
    expect(getMock).toHaveBeenCalledWith('/meeting-stages/stage-123');
  });

  it('updateStage should call patch with the correct URL and stage data', async () => {
    const stageData = { content: 'Updated content' };
    patchMock.mockResolvedValue({ ...mockApiResponse, data: mockStagesResponse[0] });
    await meetingApi.updateStage('stage-123', stageData as any);
    expect(patchMock).toHaveBeenCalledWith('/meeting-stages/stage-123', stageData);
  });

  it('getNotes should call get with the correct URL', async () => {
    getMock.mockResolvedValue({ ...mockApiResponse, data: mockNotesResponse });
    await meetingApi.getNotes('meeting-123');
    expect(getMock).toHaveBeenCalledWith('/meetings/meeting-123/notes');
  });

  it('createNote should call post with the correct URL and note data', async () => {
    const noteData = { meetingId: 'meeting-123', content: 'New note' };
    postMock.mockResolvedValue({ ...mockApiResponse, data: mockNotesResponse[0] });
    await meetingApi.createNote(noteData as any);
    expect(postMock).toHaveBeenCalledWith('/meetings/meeting-123/notes', noteData);
  });

  it('deleteNote should call delete with the correct URL', async () => {
    deleteMock.mockResolvedValue({ ...mockApiResponse, data: { success: true } });
    await meetingApi.deleteNote('note-123');
    expect(deleteMock).toHaveBeenCalledWith('/meeting-notes/note-123');
  });

  it('startMeeting should call post with the correct URL', async () => {
    postMock.mockResolvedValue({ ...mockApiResponse, data: mockStartMeetingResponse });
    await meetingApi.startMeeting('meeting-123');
    expect(postMock).toHaveBeenCalledWith('/meetings/meeting-123/start', { meetingId: 'meeting-123' });
  });

  it('endMeeting should call post with the correct URL', async () => {
    postMock.mockResolvedValue({ ...mockApiResponse, data: mockMeetingResponse });
    await meetingApi.endMeeting('meeting-123');
    expect(postMock).toHaveBeenCalledWith('/meetings/meeting-123/end', { meetingId: 'meeting-123', generateSummary: true });
  });

  it('changeStage should call post with the correct URL and stage type', async () => {
    postMock.mockResolvedValue({ ...mockApiResponse, data: mockMeetingResponse });
    await meetingApi.changeStage('meeting-123', MeetingStageType.GOOD_NEWS);
    expect(postMock).toHaveBeenCalledWith('/meetings/meeting-123/change-stage', { meetingId: 'meeting-123', stageType: MeetingStageType.GOOD_NEWS });
  });

  it('syncWithCalendar should call post with the correct URL and provider', async () => {
    postMock.mockResolvedValue({ ...mockApiResponse, data: mockCalendarSyncResponse });
    await meetingApi.syncWithCalendar('meeting-123', CalendarProvider.GOOGLE);
    expect(postMock).toHaveBeenCalledWith('/meetings/meeting-123/sync-calendar', { meetingId: 'meeting-123', provider: CalendarProvider.GOOGLE });
  });

  it('generateMeetingSummary should call get with the correct URL', async () => {
    getMock.mockResolvedValue({ ...mockApiResponse, data: mockMeetingSummaryResponse });
    await meetingApi.generateMeetingSummary('meeting-123');
    expect(getMock).toHaveBeenCalledWith('/meetings/meeting-123/summary');
  });
});