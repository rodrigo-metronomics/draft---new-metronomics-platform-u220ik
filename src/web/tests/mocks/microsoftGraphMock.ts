import { 
  CalendarProvider, 
  CalendarEventStatus, 
  CalendarAttendeeStatus, 
  CalendarEvent, 
  CalendarAuthToken,
  RecurrenceType
} from '../../src/types/calendar.types';
import axios from 'axios'; // axios v1.4.0
import MockAdapter from 'axios-mock-adapter'; // axios-mock-adapter v1.21.4
import { vi } from 'vitest'; // vitest v0.34.0

// Create a mock adapter for axios
export const mockAxios = new MockAdapter(axios);

// Global constants for Microsoft Graph API endpoints
export const MICROSOFT_GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';
export const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

/**
 * Creates a mock CalendarEvent object for testing
 * @param overrides Optional properties to override default values
 * @returns A mock calendar event with default values that can be overridden
 */
export function createMockCalendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const defaultEvent: CalendarEvent = {
    id: 'mock-calendar-event-id',
    meetingId: 'mock-meeting-id',
    title: 'Mock Calendar Event',
    description: 'This is a mock calendar event for testing',
    location: 'Conference Room A',
    startTime: tomorrow,
    endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour later
    attendees: [
      {
        email: 'test@example.com',
        name: 'Test User',
        status: CalendarAttendeeStatus.ACCEPTED,
        optional: false
      },
      {
        email: 'optional@example.com',
        name: 'Optional User',
        status: CalendarAttendeeStatus.TENTATIVE,
        optional: true
      }
    ],
    status: CalendarEventStatus.CONFIRMED,
    isOnlineMeeting: true,
    onlineMeetingUrl: 'https://teams.microsoft.com/l/meetup-join/mock-url',
    recurrence: null,
    provider: CalendarProvider.MICROSOFT,
    providerEventId: 'mock-microsoft-event-id',
    createdAt: now,
    updatedAt: now
  };

  return { ...defaultEvent, ...overrides };
}

/**
 * Creates a mock CalendarAuthToken object for testing
 * @param overrides Optional properties to override default values
 * @returns A mock auth token with default values that can be overridden
 */
export function createMockAuthToken(overrides: Partial<CalendarAuthToken> = {}): CalendarAuthToken {
  const now = new Date();
  const expiryDate = now.getTime() + 3600 * 1000; // 1 hour from now
  
  const defaultToken: CalendarAuthToken = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiryDate: expiryDate,
    provider: CalendarProvider.MICROSOFT
  };

  return { ...defaultToken, ...overrides };
}

/**
 * Creates a mock Microsoft Graph event object in the format returned by the Microsoft Graph API
 * @param overrides Optional properties to override default values
 * @returns A mock Microsoft Graph event object
 */
export function createMockMicrosoftEvent(overrides: Record<string, any> = {}): Record<string, any> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 1 hour later
  
  const defaultMicrosoftEvent = {
    id: 'mock-microsoft-event-id',
    subject: 'Mock Microsoft Event',
    body: {
      contentType: 'html',
      content: '<p>This is a mock Microsoft event for testing</p>'
    },
    start: {
      dateTime: tomorrow.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: tomorrowEnd.toISOString(),
      timeZone: 'UTC'
    },
    location: {
      displayName: 'Conference Room A'
    },
    attendees: [
      {
        emailAddress: {
          address: 'test@example.com',
          name: 'Test User'
        },
        status: {
          response: 'accepted',
          time: now.toISOString()
        },
        type: 'required'
      },
      {
        emailAddress: {
          address: 'optional@example.com',
          name: 'Optional User'
        },
        status: {
          response: 'tentative',
          time: now.toISOString()
        },
        type: 'optional'
      }
    ],
    isOnlineMeeting: true,
    onlineMeeting: {
      joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock-url'
    },
    createdDateTime: now.toISOString(),
    lastModifiedDateTime: now.toISOString()
  };

  return { ...defaultMicrosoftEvent, ...overrides };
}

/**
 * Creates a mock OAuth token response in the format returned by Microsoft's token endpoint
 * @param overrides Optional properties to override default values
 * @returns A mock Microsoft OAuth token response
 */
export function createMockMicrosoftTokenResponse(overrides: Record<string, any> = {}): Record<string, any> {
  const defaultTokenResponse = {
    token_type: 'Bearer',
    scope: 'Calendars.ReadWrite User.Read',
    expires_in: 3600,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    id_token: 'mock-id-token'
  };

  return { ...defaultTokenResponse, ...overrides };
}

/**
 * Sets up the mock axios adapter for Microsoft Graph API tests
 */
export function setupMicrosoftGraphMock(): void {
  // Reset the mock
  mockAxios.reset();
  
  // Set default handlers
  mockMicrosoftAuthCodeExchange();
  mockMicrosoftTokenRefresh();
  
  // Configure to pass through any unhandled requests
  mockAxios.onAny().passThrough();
}

/**
 * Mocks the OAuth code exchange endpoint to return a successful token response
 * @param response Optional custom response object
 */
export function mockMicrosoftAuthCodeExchange(response: Record<string, any> = {}): void {
  mockAxios.onPost(MICROSOFT_TOKEN_URL)
    .reply((config) => {
      // Verify this is a code exchange request (not a refresh token request)
      const data = new URLSearchParams(config.data);
      if (data.get('grant_type') === 'authorization_code' && data.get('code')) {
        return [200, createMockMicrosoftTokenResponse(response)];
      }
      // Pass through if it's not a code exchange request
      return [404, { error: 'Not Found' }];
    });
}

/**
 * Mocks the OAuth token refresh endpoint to return a successful token response
 * @param response Optional custom response object
 */
export function mockMicrosoftTokenRefresh(response: Record<string, any> = {}): void {
  mockAxios.onPost(MICROSOFT_TOKEN_URL)
    .reply((config) => {
      // Verify this is a refresh token request
      const data = new URLSearchParams(config.data);
      if (data.get('grant_type') === 'refresh_token' && data.get('refresh_token')) {
        return [200, createMockMicrosoftTokenResponse({
          ...response,
          refresh_token: 'new-mock-refresh-token' // Simulate a new refresh token
        })];
      }
      // Pass through if it's not a refresh token request
      return [404, { error: 'Not Found' }];
    });
}

/**
 * Mocks the Microsoft Graph API endpoint for creating events
 * @param response Optional custom response object
 */
export function mockMicrosoftEventCreation(response: Record<string, any> = {}): void {
  const eventEndpoint = `${MICROSOFT_GRAPH_API_URL}/me/events`;
  
  mockAxios.onPost(eventEndpoint)
    .reply((config) => {
      // Store the request body for verification in tests
      const requestBody = JSON.parse(config.data);
      // Return the response with the request body merged in (to simulate the created event)
      return [201, createMockMicrosoftEvent({
        ...requestBody,
        ...response,
        id: 'new-mock-event-id' // Simulate a new event ID created by Microsoft
      })];
    });
}

/**
 * Mocks the Microsoft Graph API endpoint for updating events
 * @param eventId ID of the event to update
 * @param response Optional custom response object
 */
export function mockMicrosoftEventUpdate(eventId: string, response: Record<string, any> = {}): void {
  const eventEndpoint = `${MICROSOFT_GRAPH_API_URL}/me/events/${eventId}`;
  
  mockAxios.onPatch(eventEndpoint)
    .reply((config) => {
      // Store the request body for verification in tests
      const requestBody = JSON.parse(config.data);
      // Return the response with the request body merged in (to simulate the updated event)
      return [200, createMockMicrosoftEvent({
        ...requestBody,
        ...response,
        id: eventId,
        lastModifiedDateTime: new Date().toISOString() // Update modification time
      })];
    });
}

/**
 * Mocks the Microsoft Graph API endpoint for deleting events
 * @param eventId ID of the event to delete
 * @param success Whether the deletion should succeed
 */
export function mockMicrosoftEventDeletion(eventId: string, success: boolean = true): void {
  const eventEndpoint = `${MICROSOFT_GRAPH_API_URL}/me/events/${eventId}`;
  
  mockAxios.onDelete(eventEndpoint)
    .reply(() => {
      if (success) {
        return [204]; // No content = success
      } else {
        return [404, { error: { message: 'Event not found' } }];
      }
    });
}

/**
 * Mocks the Microsoft Graph API endpoint for retrieving a specific event
 * @param eventId ID of the event to retrieve
 * @param response Optional custom response object
 */
export function mockMicrosoftEventRetrieval(eventId: string, response: Record<string, any> = {}): void {
  const eventEndpoint = `${MICROSOFT_GRAPH_API_URL}/me/events/${eventId}`;
  
  mockAxios.onGet(eventEndpoint)
    .reply(() => {
      return [200, createMockMicrosoftEvent({
        id: eventId,
        ...response
      })];
    });
}

/**
 * Mocks the Microsoft Graph API endpoint to return a not found response for an event
 * @param eventId ID of the event that is not found
 */
export function mockMicrosoftEventNotFound(eventId: string): void {
  const eventEndpoint = `${MICROSOFT_GRAPH_API_URL}/me/events/${eventId}`;
  
  mockAxios.onGet(eventEndpoint)
    .reply(() => {
      return [404, {
        error: {
          code: 'ErrorItemNotFound',
          message: `Event with ID '${eventId}' was not found.`
        }
      }];
    });
}

/**
 * Resets all Microsoft Graph API mocks
 */
export function resetMicrosoftGraphMock(): void {
  mockAxios.reset();
  // Clear any vi.mocks if used in tests
  vi.clearAllMocks();
  // Configure to pass through any unhandled requests
  mockAxios.onAny().passThrough();
}