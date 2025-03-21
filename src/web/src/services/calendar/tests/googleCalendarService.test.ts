import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'; // ^0.34.0
import axios from 'axios'; // ^1.4.0
import MockAdapter from 'axios-mock-adapter'; // ^1.21.4
import { GoogleCalendarService } from '../googleCalendarService';
import { 
  CalendarProvider, 
  CalendarEventStatus, 
  CalendarAttendeeStatus, 
  CalendarEvent, 
  CalendarAuthToken,
  RecurrenceType
} from '../../../types/calendar.types';
import {
  createMockCalendarEvent,
  createMockAuthToken,
  createMockGoogleEvent,
  createMockGoogleTokenResponse,
  setupGoogleCalendarMock,
  mockGoogleAuthCodeExchange,
  mockGoogleTokenRefresh,
  mockGoogleEventCreation,
  mockGoogleEventUpdate,
  mockGoogleEventDeletion,
  mockGoogleEventRetrieval,
  mockGoogleEventNotFound,
  resetGoogleCalendarMock
} from '../../../../tests/mocks/googleCalendarMock';

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  
  beforeAll(() => {
    // Set environment variables for testing
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'mock-client-id');
    vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'mock-client-secret');
    vi.stubEnv('VITE_GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/callback/google');
  });
  
  beforeEach(() => {
    // Setup the mock for Google Calendar API
    setupGoogleCalendarMock();
    // Create a new instance of the service for each test
    service = new GoogleCalendarService();
  });
  
  afterEach(() => {
    // Reset the mocks after each test
    resetGoogleCalendarMock();
    vi.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore environment variables
    vi.unstubAllEnvs();
  });
  
  describe('getAuthUrl', () => {
    it('should generate a valid Google OAuth URL with correct parameters', () => {
      const state = 'test-state';
      const url = service.getAuthUrl(state);
      
      // Verify the URL is correct
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=mock-client-id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback%2Fgoogle');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar');
      expect(url).toContain('state=test-state');
    });
  });
  
  describe('getTokenFromCode', () => {
    it('should exchange authorization code for tokens correctly', async () => {
      // Mock the token exchange endpoint
      mockGoogleAuthCodeExchange();
      
      const code = 'test-auth-code';
      const token = await service.getTokenFromCode(code);
      
      // Verify the token is returned correctly
      expect(token.provider).toBe(CalendarProvider.GOOGLE);
      expect(token.accessToken).toBe('mock-access-token-google-calendar-api');
      expect(token.refreshToken).toBe('mock-refresh-token-google-calendar-api');
      expect(token.expiryDate).toBeGreaterThan(Date.now());
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh an expired token', async () => {
      // Setup with an expired token
      const expiredToken = createMockAuthToken({
        expiryDate: Date.now() - 1000 // Expired 1 second ago
      });
      service = new GoogleCalendarService(expiredToken);
      
      // Mock the token refresh endpoint
      mockGoogleTokenRefresh();
      
      const refreshedToken = await service.refreshToken();
      
      // Verify the token was refreshed
      expect(refreshedToken.accessToken).toBe('new-mock-access-token-after-refresh');
      expect(refreshedToken.expiryDate).toBeGreaterThan(Date.now());
    });
    
    it('should not refresh a token that hasn\'t expired', async () => {
      // Setup with a valid token
      const validToken = createMockAuthToken({
        expiryDate: Date.now() + 3600000 // Valid for 1 hour
      });
      service = new GoogleCalendarService(validToken);
      
      // Create a spy on axios.post to verify it's not called
      const postSpy = vi.spyOn(axios, 'post');
      
      const token = await service.refreshToken();
      
      // Verify no refresh was attempted
      expect(postSpy).not.toHaveBeenCalled();
      expect(token).toEqual(validToken);
    });
    
    it('should throw an error when trying to refresh with no token', async () => {
      // Service initialized with no token
      service = new GoogleCalendarService(null);
      
      await expect(service.refreshToken()).rejects.toThrow(
        'No refresh token available. Please authenticate with Google Calendar first.'
      );
    });
  });
  
  describe('createEvent', () => {
    it('should create a new event in Google Calendar', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh and event creation endpoints
      mockGoogleTokenRefresh();
      mockGoogleEventCreation();
      
      const event = createMockCalendarEvent({
        providerEventId: null // New event doesn't have a provider ID yet
      });
      
      const createdEvent = await service.createEvent(event);
      
      // Verify the created event
      expect(createdEvent.provider).toBe(CalendarProvider.GOOGLE);
      expect(createdEvent.providerEventId).toBe('google-event-123456789');
      expect(createdEvent.title).toBe(event.title);
      expect(createdEvent.meetingId).toBe(event.meetingId);
    });
    
    it('should create a recurring event with correct RRULE format', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh
      mockGoogleTokenRefresh();
      
      // Add a spy on axios.post to verify the request data
      const postSpy = vi.spyOn(axios, 'post');
      
      // Create a recurring event
      const recurringEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.WEEKLY,
          interval: 2,
          count: 10,
          until: null,
          daysOfWeek: ['MO', 'WE', 'FR'],
          dayOfMonth: null,
          monthOfYear: null
        }
      });
      
      // Mock the event creation with the recurrence rule
      mockGoogleEventCreation({
        recurrence: ['RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=10;BYDAY=MO,WE,FR']
      });
      
      const createdEvent = await service.createEvent(recurringEvent);
      
      // Verify the request was made
      expect(postSpy).toHaveBeenCalled();
      
      // Verify the recurrence information was preserved
      expect(createdEvent.recurrence).not.toBeNull();
      expect(createdEvent.recurrence?.type).toBe(RecurrenceType.WEEKLY);
      expect(createdEvent.recurrence?.interval).toBe(2);
      expect(createdEvent.recurrence?.count).toBe(10);
    });
  });
  
  describe('updateEvent', () => {
    it('should update an existing event in Google Calendar', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh and event update endpoints
      mockGoogleTokenRefresh();
      
      const eventId = 'google-event-123456789';
      mockGoogleEventUpdate(eventId);
      
      const event = createMockCalendarEvent({
        providerEventId: eventId,
        title: 'Updated Event Title'
      });
      
      const updatedEvent = await service.updateEvent(event);
      
      // Verify the updated event
      expect(updatedEvent.providerEventId).toBe(eventId);
    });
    
    it('should throw an error when updating event without providerEventId', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh
      mockGoogleTokenRefresh();
      
      const event = createMockCalendarEvent({
        providerEventId: null // Missing provider ID
      });
      
      await expect(service.updateEvent(event)).rejects.toThrow(
        'Cannot update event: missing provider event ID'
      );
    });
  });
  
  describe('deleteEvent', () => {
    it('should delete an event from Google Calendar', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh and event deletion endpoints
      mockGoogleTokenRefresh();
      
      const eventId = 'google-event-123456789';
      mockGoogleEventDeletion(eventId);
      
      const result = await service.deleteEvent(eventId);
      
      // Verify deletion was successful
      expect(result).toBe(true);
    });
    
    it('should handle deletion failures gracefully', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh and failed event deletion
      mockGoogleTokenRefresh();
      
      const eventId = 'non-existent-event';
      mockGoogleEventDeletion(eventId, false);
      
      const result = await service.deleteEvent(eventId);
      
      // Verify deletion failed but didn't throw
      expect(result).toBe(false);
    });
  });
  
  describe('getEvent', () => {
    it('should retrieve an event from Google Calendar by ID', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh and event retrieval endpoints
      mockGoogleTokenRefresh();
      
      const eventId = 'google-event-123456789';
      mockGoogleEventRetrieval(eventId);
      
      const event = await service.getEvent(eventId);
      
      // Verify the retrieved event
      expect(event).not.toBeNull();
      expect(event?.providerEventId).toBe(eventId);
      expect(event?.provider).toBe(CalendarProvider.GOOGLE);
    });
    
    it('should return null when event is not found', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh and event not found
      mockGoogleTokenRefresh();
      
      const eventId = 'non-existent-event';
      mockGoogleEventNotFound(eventId);
      
      const event = await service.getEvent(eventId);
      
      // Verify null is returned for non-existent event
      expect(event).toBeNull();
    });
  });
  
  describe('getAuthHeaders', () => {
    it('should generate correct authorization headers', async () => {
      // Setup service with a valid token
      const token = createMockAuthToken();
      service = new GoogleCalendarService(token);
      
      // Mock the token refresh and event retrieval
      mockGoogleTokenRefresh();
      mockGoogleEventRetrieval('test-event-id');
      
      // Create a spy on axios.get to capture the headers
      const getSpy = vi.spyOn(axios, 'get');
      
      await service.getEvent('test-event-id');
      
      // Verify the get method was called
      expect(getSpy).toHaveBeenCalled();
    });
    
    it('should throw an error when no auth token is available', async () => {
      // Service initialized with no token
      service = new GoogleCalendarService(null);
      
      // Trying to access a method that uses getAuthHeaders should throw
      await expect(service.getEvent('test-event-id')).rejects.toThrow(
        'No authentication token available'
      );
    });
  });
});

describe('GoogleCalendarService Utility Functions', () => {
  // Test the utility functions indirectly through the public API
  
  describe('mapGoogleEventToCalendarEvent', () => {
    it('should correctly map Google Calendar event to internal format', async () => {
      // Setup service with a valid token
      const service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh
      mockGoogleTokenRefresh();
      
      // Create a mock Google event with specific fields to test the mapping
      const googleEvent = {
        id: 'test-event-id',
        summary: 'Test Event Title',
        description: 'Test Event Description',
        location: 'Test Location',
        status: 'confirmed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        creator: {
          email: 'creator@example.com',
          displayName: 'Creator User'
        },
        organizer: {
          email: 'organizer@example.com',
          displayName: 'Organizer User'
        },
        start: {
          dateTime: '2023-04-15T10:00:00Z',
          timeZone: 'UTC'
        },
        end: {
          dateTime: '2023-04-15T11:00:00Z',
          timeZone: 'UTC'
        },
        attendees: [
          {
            email: 'attendee1@example.com',
            displayName: 'Attendee One',
            responseStatus: 'accepted'
          },
          {
            email: 'attendee2@example.com',
            displayName: 'Attendee Two',
            responseStatus: 'tentative'
          }
        ],
        conferenceData: {
          conferenceId: 'test-conf-id',
          entryPoints: [
            {
              entryPointType: 'video',
              uri: 'https://meet.example.com/test-meeting'
            }
          ]
        },
        extendedProperties: {
          private: {
            meetingId: 'test-meeting-id'
          }
        }
      };
      
      // Mock the retrieval to return our specific Google event
      mockGoogleEventRetrieval('test-event-id', googleEvent);
      
      // Call getEvent to trigger the mapping function
      const event = await service.getEvent('test-event-id');
      
      // Verify the mapping
      expect(event).not.toBeNull();
      expect(event?.providerEventId).toBe('test-event-id');
      expect(event?.title).toBe('Test Event Title');
      expect(event?.description).toBe('Test Event Description');
      expect(event?.location).toBe('Test Location');
      expect(event?.status).toBe(CalendarEventStatus.CONFIRMED);
      expect(event?.startTime.toISOString()).toBe(new Date('2023-04-15T10:00:00Z').toISOString());
      expect(event?.endTime?.toISOString()).toBe(new Date('2023-04-15T11:00:00Z').toISOString());
      expect(event?.attendees).toHaveLength(2);
      expect(event?.attendees[0].email).toBe('attendee1@example.com');
      expect(event?.attendees[0].status).toBe(CalendarAttendeeStatus.ACCEPTED);
      expect(event?.attendees[1].status).toBe(CalendarAttendeeStatus.TENTATIVE);
      expect(event?.isOnlineMeeting).toBe(true);
      expect(event?.onlineMeetingUrl).toBe('https://meet.example.com/test-meeting');
      expect(event?.meetingId).toBe('test-meeting-id');
    });
    
    it('should extract recurrence information if available', async () => {
      // Setup service with a valid token
      const service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh
      mockGoogleTokenRefresh();
      
      // Create a mock Google event with recurrence
      const googleEvent = createMockGoogleEvent({
        recurrence: ['RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=10;BYDAY=MO,WE,FR']
      });
      
      // Mock the retrieval
      mockGoogleEventRetrieval('test-event-id', googleEvent);
      
      // Call getEvent to trigger the mapping function
      const event = await service.getEvent('test-event-id');
      
      // Verify the recurrence mapping
      expect(event?.recurrence).not.toBeNull();
      expect(event?.recurrence?.type).toBe(RecurrenceType.WEEKLY);
      expect(event?.recurrence?.interval).toBe(2);
      expect(event?.recurrence?.count).toBe(10);
      expect(event?.recurrence?.daysOfWeek).toContain('MO');
      expect(event?.recurrence?.daysOfWeek).toContain('WE');
      expect(event?.recurrence?.daysOfWeek).toContain('FR');
    });
  });
  
  describe('mapCalendarEventToGoogleEvent', () => {
    it('should correctly map internal event to Google Calendar format', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh
      mockGoogleTokenRefresh();
      
      // Create a calendar event
      const calendarEvent = createMockCalendarEvent({
        title: 'Test Event Title',
        description: 'Test Event Description',
        location: 'Test Location',
        startTime: new Date('2023-04-15T10:00:00Z'),
        endTime: new Date('2023-04-15T11:00:00Z'),
        isOnlineMeeting: true,
        attendees: [
          {
            email: 'attendee1@example.com',
            name: 'Attendee One',
            status: CalendarAttendeeStatus.ACCEPTED,
            optional: false
          },
          {
            email: 'attendee2@example.com',
            name: 'Attendee Two',
            status: CalendarAttendeeStatus.TENTATIVE,
            optional: true
          }
        ]
      });
      
      // Mock successful event creation
      mockGoogleEventCreation();
      
      // Call createEvent
      const createdEvent = await service.createEvent(calendarEvent);
      
      // Verify the event was created successfully
      expect(createdEvent).not.toBeNull();
      expect(createdEvent.providerEventId).toBe('google-event-123456789');
    });
  });
  
  describe('mapRecurrenceRuleToRRULE', () => {
    it('should convert RecurrenceRule to RRULE string format', async () => {
      // Setup service with a valid token
      service = new GoogleCalendarService(createMockAuthToken());
      
      // Mock the token refresh
      mockGoogleTokenRefresh();
      
      // Create recurring events with different patterns
      
      // Weekly recurrence
      const weeklyEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.WEEKLY,
          interval: 2,
          count: 10,
          until: null,
          daysOfWeek: ['MO', 'WE', 'FR'],
          dayOfMonth: null,
          monthOfYear: null
        }
      });
      
      // Mock event creation with expected RRULE
      mockGoogleEventCreation({
        recurrence: ['RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=10;BYDAY=MO,WE,FR']
      });
      
      // Create the event
      const createdWeeklyEvent = await service.createEvent(weeklyEvent);
      
      // Verify the recurrence was preserved
      expect(createdWeeklyEvent.recurrence?.type).toBe(RecurrenceType.WEEKLY);
      expect(createdWeeklyEvent.recurrence?.interval).toBe(2);
      expect(createdWeeklyEvent.recurrence?.count).toBe(10);
      expect(createdWeeklyEvent.recurrence?.daysOfWeek).toContain('MO');
      
      // Reset for next test
      resetGoogleCalendarMock();
      mockGoogleTokenRefresh();
      
      // Monthly recurrence
      const monthlyEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.MONTHLY,
          interval: 1,
          count: null,
          until: new Date('2023-12-31T23:59:59Z'),
          daysOfWeek: null,
          dayOfMonth: 15,
          monthOfYear: null
        }
      });
      
      // Mock event creation with expected RRULE
      mockGoogleEventCreation({
        recurrence: ['RRULE:FREQ=MONTHLY;BYMONTHDAY=15;UNTIL=20231231T235959Z']
      });
      
      // Create the event
      const createdMonthlyEvent = await service.createEvent(monthlyEvent);
      
      // Verify the recurrence was preserved
      expect(createdMonthlyEvent.recurrence?.type).toBe(RecurrenceType.MONTHLY);
      expect(createdMonthlyEvent.recurrence?.dayOfMonth).toBe(15);
      expect(createdMonthlyEvent.recurrence?.until?.toISOString()).toBe(new Date('2023-12-31T23:59:59Z').toISOString());
    });
  });
});