import { jest } from 'jest';
import { 
  GoogleCalendarService, 
  MicrosoftCalendarService, 
  calendarServiceFactory 
} from '../../../src/services/calendar';
import { MeetingCalendarEvent, ParticipantRole } from '../../../src/types/meeting.types';
import { ApiError } from '../../../src/utils/errors/ApiError';
import { 
  MockGoogleCalendarService, 
  resetMockCalendarData 
} from '../../mocks/googleCalendarMock';
import { 
  MockMicrosoftCalendarService, 
  resetMockGraphData 
} from '../../mocks/microsoftGraphMock';

/**
 * Helper function to create a test meeting event for calendar tests
 * @param overrides Optional properties to override default values
 * @returns A test meeting event with default values and any provided overrides
 */
const createTestMeetingEvent = (overrides = {}): MeetingCalendarEvent => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
  
  return {
    meetingId: 'test-meeting-123',
    title: 'Test Meeting',
    description: 'This is a test meeting',
    startTime: now,
    endTime: oneHourLater,
    attendees: [
      {
        email: 'moderator@example.com',
        name: 'Test Moderator',
        role: ParticipantRole.MODERATOR
      },
      {
        email: 'participant@example.com',
        name: 'Test Participant',
        role: ParticipantRole.PARTICIPANT
      },
      {
        email: 'observer@example.com',
        name: 'Test Observer',
        role: ParticipantRole.OBSERVER
      }
    ],
    recurringPattern: null,
    location: 'Conference Room A',
    ...overrides
  };
};

describe('GoogleCalendarService', () => {
  let googleCalendarService: GoogleCalendarService;
  let mockService: MockGoogleCalendarService;
  
  beforeEach(() => {
    // Reset mock data before each test
    resetMockCalendarData();
    
    // Create instances of the real service and mock implementation
    googleCalendarService = new GoogleCalendarService();
    mockService = new MockGoogleCalendarService();
    
    // Replace methods on the real service with mock implementations
    jest.spyOn(googleCalendarService, 'createEvent').mockImplementation(
      (event, accessToken) => mockService.createEvent(event, accessToken)
    );
    
    jest.spyOn(googleCalendarService, 'updateEvent').mockImplementation(
      (event, eventId, accessToken) => mockService.updateEvent(event, eventId, accessToken)
    );
    
    jest.spyOn(googleCalendarService, 'deleteEvent').mockImplementation(
      (eventId, accessToken) => mockService.deleteEvent(eventId, accessToken)
    );
    
    jest.spyOn(googleCalendarService, 'getEvent').mockImplementation(
      (eventId, accessToken) => mockService.getEvent(eventId, accessToken)
    );
    
    jest.spyOn(googleCalendarService, 'getAuthUrl').mockImplementation(
      (userId, redirectUrl) => mockService.getAuthUrl(userId, redirectUrl)
    );
    
    jest.spyOn(googleCalendarService, 'getTokenFromCode').mockImplementation(
      (code, redirectUrl) => mockService.getTokenFromCode(code, redirectUrl)
    );
    
    jest.spyOn(googleCalendarService, 'refreshToken').mockImplementation(
      (refreshToken) => mockService.refreshToken(refreshToken)
    );
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should create a calendar event', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock_access_token';
    
    const eventId = await googleCalendarService.createEvent(event, accessToken);
    
    expect(eventId).toBeDefined();
    expect(googleCalendarService.createEvent).toHaveBeenCalledWith(event, accessToken);
  });
  
  test('should update a calendar event', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock_access_token';
    
    // First create an event to get an ID
    const eventId = await googleCalendarService.createEvent(event, accessToken);
    
    // Then update the event
    const updatedEvent = createTestMeetingEvent({
      title: 'Updated Test Meeting',
      description: 'This meeting has been updated'
    });
    
    const result = await googleCalendarService.updateEvent(updatedEvent, eventId, accessToken);
    
    expect(result).toBe(true);
    expect(googleCalendarService.updateEvent).toHaveBeenCalledWith(updatedEvent, eventId, accessToken);
  });
  
  test('should delete a calendar event', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock_access_token';
    
    // First create an event to get an ID
    const eventId = await googleCalendarService.createEvent(event, accessToken);
    
    // Then delete the event
    const result = await googleCalendarService.deleteEvent(eventId, accessToken);
    
    expect(result).toBe(true);
    expect(googleCalendarService.deleteEvent).toHaveBeenCalledWith(eventId, accessToken);
  });
  
  test('should get a calendar event', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock_access_token';
    
    // First create an event to get an ID
    const eventId = await googleCalendarService.createEvent(event, accessToken);
    
    // Then get the event
    const retrievedEvent = await googleCalendarService.getEvent(eventId, accessToken);
    
    expect(retrievedEvent).toBeDefined();
    expect(retrievedEvent.id).toBe(eventId);
    expect(retrievedEvent.summary).toBe(event.title);
    expect(googleCalendarService.getEvent).toHaveBeenCalledWith(eventId, accessToken);
  });
  
  test('should generate an auth URL', async () => {
    const userId = 'test-user-123';
    const redirectUrl = 'https://example.com/oauth/callback';
    
    const authUrl = await googleCalendarService.getAuthUrl(userId, redirectUrl);
    
    expect(authUrl).toContain('accounts.google.com');
    expect(authUrl).toContain(encodeURIComponent(redirectUrl));
    expect(googleCalendarService.getAuthUrl).toHaveBeenCalledWith(userId, redirectUrl);
  });
  
  test('should exchange code for tokens', async () => {
    const code = 'valid-auth-code';
    const redirectUrl = 'https://example.com/oauth/callback';
    
    const tokens = await googleCalendarService.getTokenFromCode(code, redirectUrl);
    
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(tokens).toHaveProperty('expiryDate');
    expect(googleCalendarService.getTokenFromCode).toHaveBeenCalledWith(code, redirectUrl);
  });
  
  test('should refresh an expired token', async () => {
    const refreshToken = 'mock_refresh_token';
    
    const tokens = await googleCalendarService.refreshToken(refreshToken);
    
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('expiryDate');
    expect(googleCalendarService.refreshToken).toHaveBeenCalledWith(refreshToken);
  });
  
  test('should handle errors when creating events', async () => {
    const event = createTestMeetingEvent();
    
    // Mock API to throw an error
    jest.spyOn(mockService, 'createEvent').mockImplementation(() => {
      throw new Error('Failed to create event');
    });
    
    await expect(googleCalendarService.createEvent(event, 'mock_access_token')).rejects.toThrow('Failed to create event');
  });
  
  test('should handle errors when updating events', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock_access_token';
    
    // Call updateEvent with non-existent event ID
    await expect(googleCalendarService.updateEvent(event, 'non-existent-id', accessToken)).rejects.toThrow('Event not found');
  });
  
  test('should handle errors when deleting events', async () => {
    const accessToken = 'mock_access_token';
    
    // Call deleteEvent with non-existent event ID
    await expect(googleCalendarService.deleteEvent('non-existent-id', accessToken)).rejects.toThrow('Event not found');
  });
});

describe('MicrosoftCalendarService', () => {
  let microsoftCalendarService: MicrosoftCalendarService;
  let mockService: MockMicrosoftCalendarService;
  
  beforeEach(() => {
    // Reset mock data before each test
    resetMockGraphData();
    
    // Create instances of the real service and mock implementation
    microsoftCalendarService = new MicrosoftCalendarService();
    mockService = new MockMicrosoftCalendarService();
    
    // Replace methods on the real service with mock implementations
    jest.spyOn(microsoftCalendarService, 'createEvent').mockImplementation(
      (event, accessToken) => mockService.createEvent(event, accessToken)
    );
    
    jest.spyOn(microsoftCalendarService, 'updateEvent').mockImplementation(
      (event, eventId, accessToken) => mockService.updateEvent(event, eventId, accessToken)
    );
    
    jest.spyOn(microsoftCalendarService, 'deleteEvent').mockImplementation(
      (eventId, accessToken) => mockService.deleteEvent(eventId, accessToken)
    );
    
    jest.spyOn(microsoftCalendarService, 'getEvent').mockImplementation(
      (eventId, accessToken) => mockService.getEvent(eventId, accessToken)
    );
    
    jest.spyOn(microsoftCalendarService, 'getAuthUrl').mockImplementation(
      (userId, redirectUrl) => mockService.getAuthUrl(userId, redirectUrl)
    );
    
    jest.spyOn(microsoftCalendarService, 'getTokenFromCode').mockImplementation(
      (code, redirectUrl) => mockService.getTokenFromCode(code, redirectUrl)
    );
    
    jest.spyOn(microsoftCalendarService, 'refreshToken').mockImplementation(
      (refreshToken) => mockService.refreshToken(refreshToken)
    );
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should create a calendar event', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock-access-token';
    
    const eventId = await microsoftCalendarService.createEvent(event, accessToken);
    
    expect(eventId).toBeDefined();
    expect(microsoftCalendarService.createEvent).toHaveBeenCalledWith(event, accessToken);
  });
  
  test('should update a calendar event', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock-access-token';
    
    // First create an event to get an ID
    const eventId = await microsoftCalendarService.createEvent(event, accessToken);
    
    // Then update the event
    const updatedEvent = createTestMeetingEvent({
      title: 'Updated Test Meeting',
      description: 'This meeting has been updated'
    });
    
    const result = await microsoftCalendarService.updateEvent(updatedEvent, eventId, accessToken);
    
    expect(result).toBe(true);
    expect(microsoftCalendarService.updateEvent).toHaveBeenCalledWith(updatedEvent, eventId, accessToken);
  });
  
  test('should delete a calendar event', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock-access-token';
    
    // First create an event to get an ID
    const eventId = await microsoftCalendarService.createEvent(event, accessToken);
    
    // Then delete the event
    const result = await microsoftCalendarService.deleteEvent(eventId, accessToken);
    
    expect(result).toBe(true);
    expect(microsoftCalendarService.deleteEvent).toHaveBeenCalledWith(eventId, accessToken);
  });
  
  test('should get a calendar event', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock-access-token';
    
    // First create an event to get an ID
    const eventId = await microsoftCalendarService.createEvent(event, accessToken);
    
    // Then get the event
    const retrievedEvent = await microsoftCalendarService.getEvent(eventId, accessToken);
    
    expect(retrievedEvent).toBeDefined();
    expect(retrievedEvent.id).toBe(eventId);
    expect(retrievedEvent.subject).toBe(event.title);
    expect(microsoftCalendarService.getEvent).toHaveBeenCalledWith(eventId, accessToken);
  });
  
  test('should generate an auth URL', async () => {
    const userId = 'test-user-123';
    const redirectUrl = 'https://example.com/oauth/callback';
    
    const authUrl = await microsoftCalendarService.getAuthUrl(userId, redirectUrl);
    
    expect(authUrl).toContain('login.microsoftonline.com');
    expect(authUrl).toContain(encodeURIComponent(redirectUrl));
    expect(microsoftCalendarService.getAuthUrl).toHaveBeenCalledWith(userId, redirectUrl);
  });
  
  test('should exchange code for tokens', async () => {
    const code = 'valid-auth-code';
    const redirectUrl = 'https://example.com/oauth/callback';
    
    const tokens = await microsoftCalendarService.getTokenFromCode(code, redirectUrl);
    
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(tokens).toHaveProperty('expiryDate');
    expect(microsoftCalendarService.getTokenFromCode).toHaveBeenCalledWith(code, redirectUrl);
  });
  
  test('should refresh an expired token', async () => {
    const refreshToken = 'mock-refresh-token';
    
    const tokens = await microsoftCalendarService.refreshToken(refreshToken);
    
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('expiryDate');
    expect(microsoftCalendarService.refreshToken).toHaveBeenCalledWith(refreshToken);
  });
  
  test('should handle errors when creating events', async () => {
    const event = createTestMeetingEvent();
    
    // Mock API to throw an error
    jest.spyOn(mockService, 'createEvent').mockImplementation(() => {
      throw new Error('Failed to create event');
    });
    
    await expect(microsoftCalendarService.createEvent(event, 'mock-access-token')).rejects.toThrow('Failed to create event');
  });
  
  test('should handle errors when updating events', async () => {
    const event = createTestMeetingEvent();
    const accessToken = 'mock-access-token';
    
    // Call updateEvent with non-existent event ID
    await expect(microsoftCalendarService.updateEvent(event, 'non-existent-id', accessToken)).rejects.toThrow('Event not found');
  });
  
  test('should handle errors when deleting events', async () => {
    const accessToken = 'mock-access-token';
    
    // Call deleteEvent with non-existent event ID
    await expect(microsoftCalendarService.deleteEvent('non-existent-id', accessToken)).rejects.toThrow('Event not found');
  });
});

describe('CalendarServiceFactory', () => {
  test("should return Google Calendar service for 'google' provider", () => {
    const service = calendarServiceFactory.getService('google');
    
    expect(service).toBeInstanceOf(GoogleCalendarService);
  });
  
  test("should return Microsoft Calendar service for 'microsoft' provider", () => {
    const service = calendarServiceFactory.getService('microsoft');
    
    expect(service).toBeInstanceOf(MicrosoftCalendarService);
  });
  
  test('should throw error for invalid provider type', () => {
    expect(() => calendarServiceFactory.getService('invalid')).toThrow('Unsupported calendar provider type: invalid');
  });
});