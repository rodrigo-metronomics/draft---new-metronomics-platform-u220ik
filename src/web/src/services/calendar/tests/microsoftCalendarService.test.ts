import { MicrosoftCalendarService } from '../microsoftCalendarService';
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
  createMockMicrosoftEvent,
  createMockMicrosoftTokenResponse,
  setupMicrosoftGraphMock,
  mockMicrosoftAuthCodeExchange,
  mockMicrosoftTokenRefresh,
  mockMicrosoftEventCreation,
  mockMicrosoftEventUpdate,
  mockMicrosoftEventDeletion,
  mockMicrosoftEventRetrieval,
  mockMicrosoftEventNotFound,
  resetMicrosoftGraphMock
} from '../../../../tests/mocks/microsoftGraphMock';
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { vi } from 'vitest';

// Create a mock adapter instance
const mockAdapter = new AxiosMockAdapter(axios);

describe('MicrosoftCalendarService', () => {
  // Setup before each test
  beforeEach(() => {
    setupMicrosoftGraphMock();
  });

  // Cleanup after each test
  afterEach(() => {
    resetMicrosoftGraphMock();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with null auth token when not provided', () => {
      const service = new MicrosoftCalendarService();
      // @ts-expect-error Accessing private property for testing
      expect(service.authToken).toBeNull();
    });

    it('should initialize with provided auth token', () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      // @ts-expect-error Accessing private property for testing
      expect(service.authToken).toEqual(mockToken);
    });
  });

  describe('getAuthUrl', () => {
    it('should generate correct authorization URL with state parameter', () => {
      const service = new MicrosoftCalendarService();
      const state = 'test-state';
      const authUrl = service.getAuthUrl(state);

      // Check if URL contains the Microsoft auth URL
      expect(authUrl).toContain('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      
      // Check if URL contains required parameters
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain(`state=${state}`);
    });
  });

  describe('getTokenFromCode', () => {
    it('should exchange authorization code for token', async () => {
      const service = new MicrosoftCalendarService();
      const authCode = 'test-auth-code';
      
      // Mock the token exchange response
      mockMicrosoftAuthCodeExchange();
      
      const token = await service.getTokenFromCode(authCode);
      
      expect(token.accessToken).toBe('mock-access-token');
      expect(token.refreshToken).toBe('mock-refresh-token');
      expect(token.expiryDate).toBeGreaterThan(Date.now());
      expect(token.provider).toBe(CalendarProvider.MICROSOFT);
    });
  });

  describe('refreshToken', () => {
    it('should refresh expired token', async () => {
      // Create an expired token
      const expiredToken = createMockAuthToken({
        expiryDate: Date.now() - 1000, // Expired 1 second ago
      });
      
      const service = new MicrosoftCalendarService(expiredToken);
      
      // Mock the token refresh response
      mockMicrosoftTokenRefresh();
      
      const refreshedToken = await service.refreshToken();
      
      expect(refreshedToken.accessToken).toBe('mock-access-token');
      expect(refreshedToken.refreshToken).toBe('new-mock-refresh-token');
      expect(refreshedToken.expiryDate).toBeGreaterThan(Date.now());
    });

    it('should not refresh valid token', async () => {
      // Create a valid token (not expired)
      const validToken = createMockAuthToken({
        expiryDate: Date.now() + 3600 * 1000, // Valid for 1 hour
      });
      
      const service = new MicrosoftCalendarService(validToken);
      
      // Spy on axios.post to verify it's not called
      const axiosPostSpy = vi.spyOn(axios, 'post');
      
      const resultToken = await service.refreshToken();
      
      expect(resultToken).toEqual(validToken);
      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it('should throw error when no token exists', async () => {
      const service = new MicrosoftCalendarService();
      
      await expect(service.refreshToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('createEvent', () => {
    it('should create a new event in Microsoft Calendar', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      const mockEvent = createMockCalendarEvent({
        providerEventId: null, // New event, no provider ID yet
      });
      
      // Mock the event creation response
      mockMicrosoftEventCreation();
      
      const createdEvent = await service.createEvent(mockEvent);
      
      expect(createdEvent.provider).toBe(CalendarProvider.MICROSOFT);
      expect(createdEvent.providerEventId).toBe('new-mock-event-id');
      expect(createdEvent.meetingId).toBe(mockEvent.meetingId);
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event in Microsoft Calendar', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      const eventId = 'existing-event-id';
      const mockEvent = createMockCalendarEvent({
        providerEventId: eventId,
        title: 'Updated Event Title',
      });
      
      // Mock the event update response
      mockMicrosoftEventUpdate(eventId);
      
      const updatedEvent = await service.updateEvent(mockEvent);
      
      expect(updatedEvent.title).toBe('Updated Event Title');
      expect(updatedEvent.providerEventId).toBe(eventId);
      expect(updatedEvent.meetingId).toBe(mockEvent.meetingId);
    });

    it('should throw error when updating event without providerEventId', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      const mockEvent = createMockCalendarEvent({
        providerEventId: null, // Missing provider ID
      });
      
      await expect(service.updateEvent(mockEvent)).rejects.toThrow('Cannot update event: No provider event ID');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event from Microsoft Calendar', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      const eventId = 'event-to-delete';
      
      // Mock the event deletion response
      mockMicrosoftEventDeletion(eventId);
      
      const result = await service.deleteEvent(eventId);
      
      expect(result).toBe(true);
    });
  });

  describe('getEvent', () => {
    it('should retrieve an event from Microsoft Calendar', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      const eventId = 'event-to-retrieve';
      
      // Mock the event retrieval response with specific properties
      mockMicrosoftEventRetrieval(eventId, {
        subject: 'Test Retrieved Event',
        bodyPreview: 'Test description',
        location: { displayName: 'Test Location' },
        attendees: [
          {
            emailAddress: { address: 'user1@example.com', name: 'User One' },
            type: 'required',
            status: { response: 'accepted' }
          }
        ]
      });
      
      const retrievedEvent = await service.getEvent(eventId);
      
      expect(retrievedEvent).not.toBeNull();
      expect(retrievedEvent?.title).toBe('Test Retrieved Event');
      expect(retrievedEvent?.description).toBe('Test description');
      expect(retrievedEvent?.location).toBe('Test Location');
      expect(retrievedEvent?.attendees).toHaveLength(1);
      expect(retrievedEvent?.attendees[0].email).toBe('user1@example.com');
      expect(retrievedEvent?.attendees[0].status).toBe(CalendarAttendeeStatus.ACCEPTED);
      expect(retrievedEvent?.provider).toBe(CalendarProvider.MICROSOFT);
    });

    it('should return null for non-existent event', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      const eventId = 'non-existent-event';
      
      // Mock the event not found response
      mockMicrosoftEventNotFound(eventId);
      
      const retrievedEvent = await service.getEvent(eventId);
      
      expect(retrievedEvent).toBeNull();
    });
  });

  describe('getAuthHeaders', () => {
    it('should generate correct authorization headers', async () => {
      const mockToken = createMockAuthToken({
        accessToken: 'test-access-token',
      });
      
      const service = new MicrosoftCalendarService(mockToken);
      
      // We need to test this indirectly through a public method
      // Use a spy to intercept the axios request and check its headers
      const axiosGetSpy = vi.spyOn(axios, 'get');
      
      // Mock event retrieval to avoid actual API call
      mockMicrosoftEventRetrieval('test-id');
      
      // Calling getEvent will use getAuthHeaders internally
      await service.getEvent('test-id');
      
      expect(axiosGetSpy).toHaveBeenCalled();
      const requestConfig = axiosGetSpy.mock.calls[0][1];
      expect(requestConfig?.headers?.Authorization).toBe('Bearer test-access-token');
      expect(requestConfig?.headers?.['Content-Type']).toBe('application/json');
    });

    it('should throw error when no token exists', async () => {
      const service = new MicrosoftCalendarService();
      
      await expect(service.getEvent('test-id')).rejects.toThrow('No authentication token available');
    });
  });

  describe('mapMicrosoftEventToCalendarEvent', () => {
    it('should correctly map Microsoft event to CalendarEvent', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      const eventId = 'microsoft-event-id';
      
      // Create a mock Microsoft event with all properties we want to test
      const microsoftEvent = {
        id: eventId,
        subject: 'Mapped Event Title',
        bodyPreview: 'Event description',
        location: { displayName: 'Test Location' },
        start: { dateTime: '2023-04-15T10:00:00', timeZone: 'UTC' },
        end: { dateTime: '2023-04-15T11:00:00', timeZone: 'UTC' },
        isOnlineMeeting: true,
        onlineMeeting: { joinUrl: 'https://teams.example.com/join' },
        attendees: [
          {
            emailAddress: { address: 'user1@example.com', name: 'User One' },
            type: 'required',
            status: { response: 'accepted' }
          },
          {
            emailAddress: { address: 'user2@example.com', name: 'User Two' },
            type: 'optional',
            status: { response: 'tentativelyAccepted' }
          }
        ],
        isCancelled: false,
        showAs: 'busy',
        recurrence: {
          pattern: {
            type: 'weekly',
            interval: 2,
            daysOfWeek: ['monday', 'wednesday']
          },
          range: {
            type: 'numbered',
            numberOfOccurrences: 10,
            startDate: '2023-04-15'
          }
        },
        createdDateTime: '2023-04-01T10:00:00Z',
        lastModifiedDateTime: '2023-04-01T10:30:00Z'
      };
      
      // Mock the event retrieval to return our custom event
      mockMicrosoftEventRetrieval(eventId, microsoftEvent);
      
      // Call getEvent which will use mapMicrosoftEventToCalendarEvent internally
      const mappedEvent = await service.getEvent(eventId);
      
      // Assertions to verify the mapping
      expect(mappedEvent).not.toBeNull();
      expect(mappedEvent?.title).toBe('Mapped Event Title');
      expect(mappedEvent?.description).toBe('Event description');
      expect(mappedEvent?.location).toBe('Test Location');
      expect(mappedEvent?.isOnlineMeeting).toBe(true);
      expect(mappedEvent?.onlineMeetingUrl).toBe('https://teams.example.com/join');
      
      // Verify attendees
      expect(mappedEvent?.attendees).toHaveLength(2);
      expect(mappedEvent?.attendees[0].email).toBe('user1@example.com');
      expect(mappedEvent?.attendees[0].status).toBe(CalendarAttendeeStatus.ACCEPTED);
      expect(mappedEvent?.attendees[0].optional).toBe(false);
      expect(mappedEvent?.attendees[1].email).toBe('user2@example.com');
      expect(mappedEvent?.attendees[1].status).toBe(CalendarAttendeeStatus.TENTATIVE);
      expect(mappedEvent?.attendees[1].optional).toBe(true);
      
      // Verify status
      expect(mappedEvent?.status).toBe(CalendarEventStatus.CONFIRMED);
      
      // Verify recurrence
      expect(mappedEvent?.recurrence).not.toBeNull();
      expect(mappedEvent?.recurrence?.type).toBe(RecurrenceType.WEEKLY);
      expect(mappedEvent?.recurrence?.interval).toBe(2);
      expect(mappedEvent?.recurrence?.count).toBe(10);
      
      // Verify provider and ID
      expect(mappedEvent?.provider).toBe(CalendarProvider.MICROSOFT);
      expect(mappedEvent?.providerEventId).toBe(eventId);
    });
  });

  describe('mapCalendarEventToMicrosoftEvent', () => {
    it('should correctly map CalendarEvent to Microsoft event format', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      // Create a spy to capture the request data sent to Microsoft
      const axiosPostSpy = vi.spyOn(axios, 'post');
      
      // Create a calendar event with specific properties to test the mapping
      const calendarEvent = createMockCalendarEvent({
        title: 'Test Mapping Event',
        description: 'Test description for mapping',
        location: 'Test Location',
        startTime: new Date('2023-04-15T10:00:00Z'),
        endTime: new Date('2023-04-15T11:00:00Z'),
        isOnlineMeeting: true,
        attendees: [
          {
            email: 'user1@example.com',
            name: 'User One',
            status: CalendarAttendeeStatus.ACCEPTED,
            optional: false
          },
          {
            email: 'user2@example.com',
            name: 'User Two',
            status: CalendarAttendeeStatus.TENTATIVE,
            optional: true
          }
        ],
        status: CalendarEventStatus.CONFIRMED,
        recurrence: null
      });
      
      // Mock the event creation
      mockMicrosoftEventCreation();
      
      // Call createEvent which will use mapCalendarEventToMicrosoftEvent internally
      await service.createEvent(calendarEvent);
      
      // Get the request data from the axios mock
      expect(axiosPostSpy).toHaveBeenCalled();
      const requestData = JSON.parse(axiosPostSpy.mock.calls[0][1]);
      
      // Assertions to verify the mapping
      expect(requestData.subject).toBe('Test Mapping Event');
      expect(requestData.body.content).toBe('Test description for mapping');
      expect(requestData.location.displayName).toBe('Test Location');
      
      // Verify start and end times
      expect(requestData.start.dateTime).toBeDefined();
      expect(requestData.end.dateTime).toBeDefined();
      
      // Verify attendees
      expect(requestData.attendees).toHaveLength(2);
      expect(requestData.attendees[0].emailAddress.address).toBe('user1@example.com');
      expect(requestData.attendees[0].emailAddress.name).toBe('User One');
      expect(requestData.attendees[0].type).toBe('required');
      expect(requestData.attendees[0].status.response).toBe('accepted');
      expect(requestData.attendees[1].type).toBe('optional');
      expect(requestData.attendees[1].status.response).toBe('tentativelyAccepted');
      
      // Verify online meeting
      expect(requestData.isOnlineMeeting).toBe(true);
      expect(requestData.onlineMeetingProvider).toBe('teamsForBusiness');
      
      // Verify status
      expect(requestData.showAs).toBe('busy');
    });
  });

  describe('mapRecurrenceRuleToMicrosoftPattern', () => {
    it('should correctly map recurrence rule to Microsoft pattern', async () => {
      const mockToken = createMockAuthToken();
      const service = new MicrosoftCalendarService(mockToken);
      
      // Spy on axios to capture the request data
      const axiosPostSpy = vi.spyOn(axios, 'post');
      
      // Test daily recurrence
      const dailyEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.DAILY,
          interval: 1,
          count: null,
          until: new Date('2023-12-31'),
          daysOfWeek: null,
          dayOfMonth: null,
          monthOfYear: null
        }
      });
      
      mockMicrosoftEventCreation();
      await service.createEvent(dailyEvent);
      
      const dailyRequestData = JSON.parse(axiosPostSpy.mock.calls[0][1]);
      expect(dailyRequestData.recurrence.pattern.type).toBe('daily');
      expect(dailyRequestData.recurrence.range.type).toBe('endDate');
      expect(dailyRequestData.recurrence.range.endDate).toContain('2023-12-31');
      
      // Reset the spy
      axiosPostSpy.mockClear();
      
      // Test weekly recurrence
      const weeklyEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.WEEKLY,
          interval: 2,
          count: 10,
          until: null,
          daysOfWeek: ['monday', 'wednesday'],
          dayOfMonth: null,
          monthOfYear: null
        }
      });
      
      mockMicrosoftEventCreation();
      await service.createEvent(weeklyEvent);
      
      const weeklyRequestData = JSON.parse(axiosPostSpy.mock.calls[0][1]);
      expect(weeklyRequestData.recurrence.pattern.type).toBe('weekly');
      expect(weeklyRequestData.recurrence.pattern.interval).toBe(2);
      expect(weeklyRequestData.recurrence.pattern.daysOfWeek).toEqual(['monday', 'wednesday']);
      expect(weeklyRequestData.recurrence.range.type).toBe('numbered');
      expect(weeklyRequestData.recurrence.range.numberOfOccurrences).toBe(10);
      
      // Reset the spy
      axiosPostSpy.mockClear();
      
      // Test monthly recurrence
      const monthlyEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.MONTHLY,
          interval: 1,
          count: null,
          until: null,
          daysOfWeek: null,
          dayOfMonth: 15,
          monthOfYear: null
        }
      });
      
      mockMicrosoftEventCreation();
      await service.createEvent(monthlyEvent);
      
      const monthlyRequestData = JSON.parse(axiosPostSpy.mock.calls[0][1]);
      expect(monthlyRequestData.recurrence.pattern.type).toBe('monthly');
      expect(monthlyRequestData.recurrence.pattern.dayOfMonth).toBe(15);
      expect(monthlyRequestData.recurrence.range.type).toBe('noEnd');
      
      // Reset the spy
      axiosPostSpy.mockClear();
      
      // Test yearly recurrence
      const yearlyEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.YEARLY,
          interval: 1,
          count: null,
          until: null,
          daysOfWeek: null,
          dayOfMonth: 1,
          monthOfYear: 1
        }
      });
      
      mockMicrosoftEventCreation();
      await service.createEvent(yearlyEvent);
      
      const yearlyRequestData = JSON.parse(axiosPostSpy.mock.calls[0][1]);
      expect(yearlyRequestData.recurrence.pattern.type).toBe('yearly');
      expect(yearlyRequestData.recurrence.pattern.month).toBe(1);
      expect(yearlyRequestData.recurrence.pattern.dayOfMonth).toBe(1);
      
      // Reset the spy
      axiosPostSpy.mockClear();
      
      // Test recurrence with count limit
      const countLimitEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.DAILY,
          interval: 1,
          count: 5,
          until: null,
          daysOfWeek: null,
          dayOfMonth: null,
          monthOfYear: null
        }
      });
      
      mockMicrosoftEventCreation();
      await service.createEvent(countLimitEvent);
      
      const countLimitRequestData = JSON.parse(axiosPostSpy.mock.calls[0][1]);
      expect(countLimitRequestData.recurrence.range.type).toBe('numbered');
      expect(countLimitRequestData.recurrence.range.numberOfOccurrences).toBe(5);
      
      // Reset the spy
      axiosPostSpy.mockClear();
      
      // Test recurrence with until date
      const untilDateEvent = createMockCalendarEvent({
        recurrence: {
          type: RecurrenceType.DAILY,
          interval: 1,
          count: null,
          until: new Date('2023-06-30'),
          daysOfWeek: null,
          dayOfMonth: null,
          monthOfYear: null
        }
      });
      
      mockMicrosoftEventCreation();
      await service.createEvent(untilDateEvent);
      
      const untilDateRequestData = JSON.parse(axiosPostSpy.mock.calls[0][1]);
      expect(untilDateRequestData.recurrence.range.type).toBe('endDate');
      expect(untilDateRequestData.recurrence.range.endDate).toContain('2023-06-30');
    });
  });
});