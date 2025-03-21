/**
 * Mock implementation for Google Calendar API used in unit tests.
 * This file provides utility functions to create mock data and mock API responses
 * for testing the GoogleCalendarService without making actual API calls.
 */

import { 
  CalendarProvider, 
  CalendarEventStatus, 
  CalendarAttendeeStatus, 
  CalendarEvent, 
  CalendarAuthToken,
  RecurrenceType
} from '../../src/types/calendar.types';
import axios from 'axios'; // axios version ^1.4.0
import MockAdapter from 'axios-mock-adapter'; // axios-mock-adapter version ^1.21.4
import { vi } from 'vitest'; // vitest version ^0.34.0

// Create a mock adapter instance for axios
export const mockAxios = new MockAdapter(axios);

// Google API endpoints
const GOOGLE_API_BASE_URL = 'https://www.googleapis.com';
const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Creates a mock CalendarEvent object for testing
 * 
 * @param overrides - Optional properties to override default values
 * @returns A mock calendar event with default values that can be overridden
 */
export function createMockCalendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  const now = new Date();
  const startTime = new Date(now.getTime() + 3600000); // 1 hour from now
  const endTime = new Date(now.getTime() + 7200000);   // 2 hours from now

  const defaultEvent: CalendarEvent = {
    id: 'mock-calendar-event-id',
    meetingId: 'mock-meeting-id',
    title: 'Mock Calendar Event',
    description: 'This is a mock calendar event for testing purposes.',
    location: 'Virtual Meeting',
    startTime,
    endTime,
    attendees: [
      {
        email: 'test@example.com',
        name: 'Test User',
        status: CalendarAttendeeStatus.ACCEPTED,
        optional: false
      },
      {
        email: 'organizer@example.com',
        name: 'Organizer User',
        status: CalendarAttendeeStatus.ACCEPTED,
        optional: false
      }
    ],
    status: CalendarEventStatus.CONFIRMED,
    isOnlineMeeting: true,
    onlineMeetingUrl: 'https://meet.example.com/mock-meeting-id',
    recurrence: null,
    provider: CalendarProvider.GOOGLE,
    providerEventId: 'google-event-123456789',
    createdAt: now,
    updatedAt: now,
  };

  return { ...defaultEvent, ...overrides };
}

/**
 * Creates a mock CalendarAuthToken object for testing
 * 
 * @param overrides - Optional properties to override default values
 * @returns A mock auth token with default values that can be overridden
 */
export function createMockAuthToken(overrides: Partial<CalendarAuthToken> = {}): CalendarAuthToken {
  const now = Date.now();
  
  const defaultToken: CalendarAuthToken = {
    accessToken: 'mock-access-token-google-calendar-api',
    refreshToken: 'mock-refresh-token-google-calendar-api',
    expiryDate: now + 3600000, // 1 hour from now
    provider: CalendarProvider.GOOGLE
  };

  return { ...defaultToken, ...overrides };
}

/**
 * Creates a mock Google Calendar event object in the format returned by the Google Calendar API
 * 
 * @param overrides - Optional properties to override default values
 * @returns A mock Google Calendar event object
 */
export function createMockGoogleEvent(overrides: Record<string, any> = {}): Record<string, any> {
  const now = new Date();
  const startTime = new Date(now.getTime() + 3600000); // 1 hour from now
  const endTime = new Date(now.getTime() + 7200000);   // 2 hours from now

  const defaultGoogleEvent = {
    kind: 'calendar#event',
    etag: '"3375087598384000"',
    id: 'google-event-123456789',
    status: 'confirmed',
    htmlLink: 'https://www.google.com/calendar/event?eid=mock-eid',
    created: now.toISOString(),
    updated: now.toISOString(),
    summary: 'Mock Calendar Event',
    description: 'This is a mock calendar event for testing purposes.',
    location: 'Virtual Meeting',
    creator: {
      email: 'organizer@example.com',
      displayName: 'Organizer User',
      self: true
    },
    organizer: {
      email: 'organizer@example.com',
      displayName: 'Organizer User',
      self: true
    },
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC'
    },
    recurrence: null,
    attendees: [
      {
        email: 'test@example.com',
        displayName: 'Test User',
        responseStatus: 'accepted',
        optional: false
      },
      {
        email: 'organizer@example.com',
        displayName: 'Organizer User',
        responseStatus: 'accepted',
        optional: false,
        organizer: true,
        self: true
      }
    ],
    hangoutLink: 'https://meet.example.com/mock-meeting-id',
    conferenceData: {
      conferenceId: 'mock-conference-id',
      conferenceSolution: {
        key: {
          type: 'hangoutsMeet'
        },
        name: 'Google Meet',
        iconUri: 'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png'
      },
      entryPoints: [
        {
          entryPointType: 'video',
          uri: 'https://meet.example.com/mock-meeting-id',
          label: 'meet.google.com/mock-meeting-id'
        }
      ]
    },
    reminders: {
      useDefault: true
    }
  };

  return { ...defaultGoogleEvent, ...overrides };
}

/**
 * Creates a mock OAuth token response in the format returned by Google's token endpoint
 * 
 * @param overrides - Optional properties to override default values
 * @returns A mock Google OAuth token response
 */
export function createMockGoogleTokenResponse(overrides: Record<string, any> = {}): Record<string, any> {
  const defaultTokenResponse = {
    access_token: 'mock-access-token-google-calendar-api',
    refresh_token: 'mock-refresh-token-google-calendar-api',
    expires_in: 3600, // 1 hour
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    id_token: 'mock-id-token.with.three.parts'
  };

  return { ...defaultTokenResponse, ...overrides };
}

/**
 * Sets up the mock axios adapter for Google Calendar API tests
 */
export function setupGoogleCalendarMock(): void {
  // Reset any existing mocks
  mockAxios.reset();
  
  // Set default handlers for common endpoints
  // This can be overridden by specific test cases

  // Mock for token endpoint (both code exchange and refresh)
  mockAxios.onPost(GOOGLE_TOKEN_URL).reply(200, createMockGoogleTokenResponse());
  
  // Set up to pass through any unhandled requests
  mockAxios.onAny().passThrough();
}

/**
 * Mocks the OAuth code exchange endpoint to return a successful token response
 * 
 * @param response - Optional custom response to return
 */
export function mockGoogleAuthCodeExchange(response: Record<string, any> = {}): void {
  mockAxios.onPost(GOOGLE_TOKEN_URL).reply(config => {
    // Verify that the request body contains the expected parameters
    const params = new URLSearchParams(config.data);
    if (params.get('grant_type') === 'authorization_code' && params.has('code')) {
      return [200, createMockGoogleTokenResponse(response)];
    }
    return [400, { error: 'invalid_request', error_description: 'Missing required parameter: code' }];
  });
}

/**
 * Mocks the OAuth token refresh endpoint to return a successful token response
 * 
 * @param response - Optional custom response to return
 */
export function mockGoogleTokenRefresh(response: Record<string, any> = {}): void {
  mockAxios.onPost(GOOGLE_TOKEN_URL).reply(config => {
    // Verify that the request body contains the expected parameters
    const params = new URLSearchParams(config.data);
    if (params.get('grant_type') === 'refresh_token' && params.has('refresh_token')) {
      // For refresh, we typically don't return a new refresh token
      const refreshResponse = createMockGoogleTokenResponse({
        ...response,
        access_token: 'new-mock-access-token-after-refresh'
      });
      
      // Remove refresh_token from response unless explicitly provided in overrides
      if (!response.refresh_token) {
        delete refreshResponse.refresh_token;
      }
      
      return [200, refreshResponse];
    }
    return [400, { error: 'invalid_request', error_description: 'Missing required parameter: refresh_token' }];
  });
}

/**
 * Mocks the Google Calendar API endpoint for creating events
 * 
 * @param response - Optional custom response to return
 */
export function mockGoogleEventCreation(response: Record<string, any> = {}): void {
  const eventsEndpoint = `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events`;
  
  mockAxios.onPost(eventsEndpoint).reply(config => {
    // Note: In a real test, you can access the request body using 
    // mockAxios.history.post[0].data if needed for verification
    return [200, createMockGoogleEvent(response)];
  });
}

/**
 * Mocks the Google Calendar API endpoint for updating events
 * 
 * @param eventId - The ID of the event to update
 * @param response - Optional custom response to return
 */
export function mockGoogleEventUpdate(eventId: string, response: Record<string, any> = {}): void {
  const updateEndpoint = `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`;
  
  mockAxios.onPut(updateEndpoint).reply(config => {
    // Note: In a real test, you can access the request body using 
    // mockAxios.history.put[0].data if needed for verification
    return [200, createMockGoogleEvent({ id: eventId, ...response })];
  });
}

/**
 * Mocks the Google Calendar API endpoint for deleting events
 * 
 * @param eventId - The ID of the event to delete
 * @param success - Whether the deletion should succeed (true) or fail (false)
 */
export function mockGoogleEventDeletion(eventId: string, success: boolean = true): void {
  const deleteEndpoint = `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`;
  
  if (success) {
    mockAxios.onDelete(deleteEndpoint).reply(204);
  } else {
    // Simulate a failed deletion
    mockAxios.onDelete(deleteEndpoint).reply(404, {
      error: {
        code: 404,
        message: 'Not Found',
        errors: [
          {
            domain: 'global',
            reason: 'notFound',
            message: 'Not Found'
          }
        ]
      }
    });
  }
}

/**
 * Mocks the Google Calendar API endpoint for retrieving a specific event
 * 
 * @param eventId - The ID of the event to retrieve
 * @param response - Optional custom response to return
 */
export function mockGoogleEventRetrieval(eventId: string, response: Record<string, any> = {}): void {
  const getEndpoint = `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`;
  
  mockAxios.onGet(getEndpoint).reply(200, createMockGoogleEvent({ id: eventId, ...response }));
}

/**
 * Mocks the Google Calendar API endpoint to return a not found response for an event
 * 
 * @param eventId - The ID of the event to report as not found
 */
export function mockGoogleEventNotFound(eventId: string): void {
  const getEndpoint = `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`;
  
  mockAxios.onGet(getEndpoint).reply(404, {
    error: {
      code: 404,
      message: 'Not Found',
      errors: [
        {
          domain: 'global',
          reason: 'notFound',
          message: 'Not Found'
        }
      ]
    }
  });
}

/**
 * Resets all Google Calendar API mocks
 */
export function resetGoogleCalendarMock(): void {
  mockAxios.reset();
  mockAxios.onAny().passThrough();
}