import { Client } from '@microsoft/microsoft-graph-client';
import * as msal from '@azure/msal-node';
import { MeetingCalendarEvent, ParticipantRole } from '../../src/types/meeting.types';

// In-memory storage for mock Microsoft Graph data
export let mockGraphData: Record<string, any> = {};

/**
 * Helper function to create a mock Microsoft Graph event with ID and data
 * @param event MeetingCalendarEvent data to convert to Microsoft format
 * @returns Mock Microsoft Graph event with ID and data
 */
export const createMockMicrosoftEvent = (event: MeetingCalendarEvent): any => {
  // Generate a random event ID
  const eventId = `event_${Math.random().toString(36).substring(2, 15)}`;

  // Create Microsoft Graph event structure
  const microsoftEvent = {
    id: eventId,
    subject: event.title,
    body: {
      contentType: 'text',
      content: event.description || '',
    },
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: (event.endTime || new Date(event.startTime.getTime() + 3600000)).toISOString(),
      timeZone: 'UTC',
    },
    attendees: event.attendees.map(attendee => ({
      emailAddress: {
        address: attendee.email,
        name: attendee.name,
      },
      type: attendee.role === ParticipantRole.MODERATOR ? 'required' : 
            attendee.role === ParticipantRole.PARTICIPANT ? 'required' : 'optional',
      status: {
        response: 'none',
        time: new Date().toISOString(),
      }
    })),
    location: event.location ? {
      displayName: event.location,
    } : null,
    // Handle recurrence pattern if provided
    recurrence: event.recurringPattern ? {
      pattern: {
        type: 'daily', // This is simplified - would need parsing logic for actual pattern
        interval: 1,
      },
      range: {
        type: 'noEnd',
        startDate: event.startTime.toISOString().split('T')[0],
      },
    } : null,
    // Include the original meeting ID for reference
    extensions: [
      {
        id: 'metronomics-meeting-id',
        value: event.meetingId,
      }
    ]
  };

  // Store in mock data
  mockGraphData[eventId] = microsoftEvent;

  return microsoftEvent;
};

/**
 * Reset the mock Microsoft Graph data between tests
 */
export const resetMockGraphData = (): void => {
  mockGraphData = {};
};

/**
 * Mock implementation of the Microsoft MSAL client
 */
export const mockMsalClient = {
  getAuthCodeUrl: jest.fn().mockImplementation(async (params) => {
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock-client-id&response_type=code&redirect_uri=${encodeURIComponent(params.redirectUri)}&state=${params.state}&scope=Calendars.ReadWrite`;
  }),
  acquireTokenByCode: jest.fn().mockImplementation(async (params) => {
    // Verify the code
    if (params.code !== 'valid-auth-code' && !params.code.startsWith('mock-auth-code')) {
      throw new Error('Invalid authorization code');
    }

    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresOn: new Date(Date.now() + 3600000), // Expires in 1 hour
    };
  }),
  acquireTokenByRefreshToken: jest.fn().mockImplementation(async (params) => {
    // Verify the refresh token
    if (params.refreshToken !== 'mock-refresh-token' && !params.refreshToken.startsWith('mock-refresh-token')) {
      throw new Error('Invalid refresh token');
    }

    return {
      accessToken: 'mock-access-token-refreshed',
      expiresOn: new Date(Date.now() + 3600000), // Expires in 1 hour
    };
  }),
};

/**
 * Mock implementation of the Microsoft Graph client
 */
export const mockGraphClient = {
  api: jest.fn().mockImplementation((path) => {
    return {
      get: jest.fn().mockImplementation(async () => {
        // Extract ID from path like /me/events/{id}
        const matches = path.match(/\/events\/([^/]+)/);
        const eventId = matches ? matches[1] : null;

        if (eventId && mockGraphData[eventId]) {
          return mockGraphData[eventId];
        }

        if (path === '/me/events') {
          return {
            value: Object.values(mockGraphData),
          };
        }

        throw new Error(`Event not found: ${path}`);
      }),
      post: jest.fn().mockImplementation(async (data) => {
        const event = createMockMicrosoftEvent(data);
        return event;
      }),
      patch: jest.fn().mockImplementation(async (data) => {
        // Extract ID from path like /me/events/{id}
        const matches = path.match(/\/events\/([^/]+)/);
        const eventId = matches ? matches[1] : null;

        if (eventId && mockGraphData[eventId]) {
          mockGraphData[eventId] = {
            ...mockGraphData[eventId],
            ...data,
          };
          return mockGraphData[eventId];
        }

        throw new Error(`Event not found for update: ${path}`);
      }),
      delete: jest.fn().mockImplementation(async () => {
        // Extract ID from path like /me/events/{id}
        const matches = path.match(/\/events\/([^/]+)/);
        const eventId = matches ? matches[1] : null;

        if (eventId && mockGraphData[eventId]) {
          delete mockGraphData[eventId];
          return;
        }

        throw new Error(`Event not found for deletion: ${path}`);
      }),
    };
  }),
};

/**
 * Mock implementation of Microsoft Calendar service for testing
 */
export class MockMicrosoftCalendarService {
  msalClient: jest.Mock;
  graphClient: jest.Mock;

  /**
   * Initializes the mock Microsoft Calendar service
   */
  constructor() {
    this.msalClient = jest.fn().mockImplementation(() => mockMsalClient);
    this.graphClient = jest.fn().mockImplementation(() => mockGraphClient);
  }

  /**
   * Mock implementation of creating a Microsoft Calendar event
   * @param event Meeting calendar event data
   * @param accessToken Microsoft Graph access token
   * @returns Promise resolving to the created event ID
   */
  async createEvent(event: MeetingCalendarEvent, accessToken: string): Promise<string> {
    // Validate access token
    if (!accessToken || !accessToken.startsWith('mock-access-token')) {
      throw new Error('Invalid access token');
    }

    // Create a mock Microsoft event
    const microsoftEvent = createMockMicrosoftEvent(event);
    
    return microsoftEvent.id;
  }

  /**
   * Mock implementation of updating a Microsoft Calendar event
   * @param event Updated meeting calendar event data
   * @param eventId Microsoft event ID to update
   * @param accessToken Microsoft Graph access token
   * @returns Promise resolving to true if update was successful
   */
  async updateEvent(event: MeetingCalendarEvent, eventId: string, accessToken: string): Promise<boolean> {
    // Validate access token
    if (!accessToken || !accessToken.startsWith('mock-access-token')) {
      throw new Error('Invalid access token');
    }

    // Check if event exists
    if (!mockGraphData[eventId]) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Update the event
    const updatedEvent = {
      ...mockGraphData[eventId],
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || '',
      },
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: (event.endTime || new Date(event.startTime.getTime() + 3600000)).toISOString(),
        timeZone: 'UTC',
      },
      attendees: event.attendees.map(attendee => ({
        emailAddress: {
          address: attendee.email,
          name: attendee.name,
        },
        type: attendee.role === ParticipantRole.MODERATOR ? 'required' : 
              attendee.role === ParticipantRole.PARTICIPANT ? 'required' : 'optional',
        status: {
          response: 'none',
          time: new Date().toISOString(),
        }
      })),
      location: event.location ? {
        displayName: event.location,
      } : null,
      recurrence: event.recurringPattern ? {
        pattern: {
          type: 'daily', // Simplified pattern
          interval: 1,
        },
        range: {
          type: 'noEnd',
          startDate: event.startTime.toISOString().split('T')[0],
        },
      } : null,
    };

    mockGraphData[eventId] = updatedEvent;
    
    return true;
  }

  /**
   * Mock implementation of deleting a Microsoft Calendar event
   * @param eventId Microsoft event ID to delete
   * @param accessToken Microsoft Graph access token
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteEvent(eventId: string, accessToken: string): Promise<boolean> {
    // Validate access token
    if (!accessToken || !accessToken.startsWith('mock-access-token')) {
      throw new Error('Invalid access token');
    }

    // Check if event exists
    if (!mockGraphData[eventId]) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Delete the event
    delete mockGraphData[eventId];
    
    return true;
  }

  /**
   * Mock implementation of retrieving a Microsoft Calendar event
   * @param eventId Microsoft event ID to retrieve
   * @param accessToken Microsoft Graph access token
   * @returns Promise resolving to the event data
   */
  async getEvent(eventId: string, accessToken: string): Promise<any> {
    // Validate access token
    if (!accessToken || !accessToken.startsWith('mock-access-token')) {
      throw new Error('Invalid access token');
    }

    // Check if event exists
    if (!mockGraphData[eventId]) {
      throw new Error(`Event not found: ${eventId}`);
    }

    return mockGraphData[eventId];
  }

  /**
   * Mock implementation of generating a Microsoft OAuth URL
   * @param userId User ID for state parameter
   * @param redirectUrl Redirect URL after authentication
   * @returns Promise resolving to auth URL
   */
  async getAuthUrl(userId: string, redirectUrl: string): Promise<string> {
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock-client-id&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}&state=${userId}&scope=Calendars.ReadWrite`;
  }

  /**
   * Mock implementation of exchanging an authorization code for tokens
   * @param code Authorization code from OAuth flow
   * @param redirectUrl Redirect URL used in the auth request
   * @returns Promise resolving to token information
   */
  async getTokenFromCode(code: string, redirectUrl: string): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> {
    // Validate the code
    if (code !== 'valid-auth-code' && !code.startsWith('mock-auth-code')) {
      throw new Error('Invalid authorization code');
    }

    // Return mock tokens
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiryDate: Date.now() + 3600000, // Expires in 1 hour
    };
  }

  /**
   * Mock implementation of refreshing an OAuth token
   * @param refreshToken Refresh token
   * @returns Promise resolving to new token information
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiryDate: number }> {
    // Validate the refresh token
    if (refreshToken !== 'mock-refresh-token' && !refreshToken.startsWith('mock-refresh-token')) {
      throw new Error('Invalid refresh token');
    }

    // Return new mock access token
    return {
      accessToken: 'mock-access-token-refreshed',
      expiryDate: Date.now() + 3600000, // Expires in 1 hour
    };
  }
}