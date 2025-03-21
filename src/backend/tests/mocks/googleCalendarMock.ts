import { jest } from 'jest'; // v29.5.0
import { MeetingCalendarEvent, ParticipantRole } from '../../src/types/meeting.types';

/**
 * In-memory storage for mock Google Calendar data during tests
 */
export const mockCalendarData: Record<string, any> = {};

/**
 * Helper function to create a mock Google Calendar event
 * 
 * @param event - Meeting calendar event data
 * @returns Mock Google Calendar event object with ID
 */
export function createMockGoogleEvent(event: MeetingCalendarEvent): any {
  // Generate a random event ID
  const eventId = `event_${Math.random().toString(36).substring(2, 15)}`;
  
  // Create Google Calendar event object
  const googleEvent = {
    id: eventId,
    summary: event.title,
    description: event.description || '',
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: (event.endTime || new Date(event.startTime.getTime() + 3600000)).toISOString(),
      timeZone: 'UTC'
    },
    attendees: event.attendees.map(attendee => ({
      email: attendee.email,
      displayName: attendee.name,
      responseStatus: 'needsAction',
      optional: attendee.role === ParticipantRole.OBSERVER
    })),
    location: event.location || '',
    recurrence: event.recurringPattern ? [event.recurringPattern] : undefined,
    status: 'confirmed',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    organizer: {
      email: event.attendees.find(a => a.role === ParticipantRole.MODERATOR)?.email || 'organizer@example.com',
      displayName: event.attendees.find(a => a.role === ParticipantRole.MODERATOR)?.name || 'Organizer'
    },
    htmlLink: `https://calendar.google.com/calendar/event?eid=${eventId}`,
    iCalUID: `${eventId}@google.com`,
    sequence: 0
  };
  
  // Add the event to mockCalendarData
  mockCalendarData[eventId] = googleEvent;
  
  return googleEvent;
}

/**
 * Reset the mock Google Calendar data between tests
 */
export function resetMockCalendarData(): void {
  Object.keys(mockCalendarData).forEach(key => {
    delete mockCalendarData[key];
  });
}

/**
 * Mock OAuth2 client for Google Calendar API testing
 */
export const mockOAuth2Client = {
  generateAuthUrl: jest.fn((options: any) => {
    const { redirect_uri, state } = options;
    return `https://accounts.google.com/o/oauth2/auth?redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state}`;
  }),
  getToken: jest.fn((code: string) => {
    if (code === 'invalid_code') {
      throw new Error('Invalid authorization code');
    }
    return Promise.resolve({
      tokens: {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expiry_date: Date.now() + 3600000, // 1 hour from now
      }
    });
  }),
  setCredentials: jest.fn((credentials: any) => {
    // Mock setting credentials
  }),
  refreshAccessToken: jest.fn(() => {
    return Promise.resolve({
      credentials: {
        access_token: 'new_mock_access_token',
        expiry_date: Date.now() + 3600000, // 1 hour from now
      }
    });
  })
};

/**
 * Mock Calendar client for Google Calendar API testing
 */
export const mockCalendarClient = {
  events: {
    insert: jest.fn((params: any) => {
      const { calendarId, requestBody, auth } = params;
      
      // Check auth
      if (!auth || auth._accessToken !== 'mock_access_token') {
        throw new Error('Unauthorized');
      }
      
      const eventId = `event_${Math.random().toString(36).substring(2, 15)}`;
      const createdEvent = {
        ...requestBody,
        id: eventId
      };
      
      // Store in mock data
      mockCalendarData[eventId] = createdEvent;
      
      return Promise.resolve({ data: createdEvent });
    }),
    update: jest.fn((params: any) => {
      const { calendarId, eventId, requestBody, auth } = params;
      
      // Check auth
      if (!auth || auth._accessToken !== 'mock_access_token') {
        throw new Error('Unauthorized');
      }
      
      // Check if event exists
      if (!mockCalendarData[eventId]) {
        throw new Error('Event not found');
      }
      
      // Update the event
      const updatedEvent = {
        ...mockCalendarData[eventId],
        ...requestBody,
        updated: new Date().toISOString()
      };
      
      mockCalendarData[eventId] = updatedEvent;
      
      return Promise.resolve({ data: updatedEvent });
    }),
    delete: jest.fn((params: any) => {
      const { calendarId, eventId, auth } = params;
      
      // Check auth
      if (!auth || auth._accessToken !== 'mock_access_token') {
        throw new Error('Unauthorized');
      }
      
      // Check if event exists
      if (!mockCalendarData[eventId]) {
        throw new Error('Event not found');
      }
      
      // Delete the event
      delete mockCalendarData[eventId];
      
      return Promise.resolve({ data: {} });
    }),
    get: jest.fn((params: any) => {
      const { calendarId, eventId, auth } = params;
      
      // Check auth
      if (!auth || auth._accessToken !== 'mock_access_token') {
        throw new Error('Unauthorized');
      }
      
      // Check if event exists
      if (!mockCalendarData[eventId]) {
        throw new Error('Event not found');
      }
      
      return Promise.resolve({ data: mockCalendarData[eventId] });
    })
  }
};

/**
 * Mock implementation of Google Calendar service for testing
 */
export class MockGoogleCalendarService {
  oAuth2Client: jest.Mock;
  calendarClient: jest.Mock;
  
  /**
   * Initializes the mock Google Calendar service
   */
  constructor() {
    this.oAuth2Client = jest.fn().mockReturnValue(mockOAuth2Client);
    this.calendarClient = jest.fn().mockReturnValue(mockCalendarClient);
  }
  
  /**
   * Mock implementation of creating a Google Calendar event
   * 
   * @param event - Meeting calendar event data
   * @param accessToken - Google OAuth access token
   * @returns Promise resolving to the created event ID
   */
  async createEvent(event: MeetingCalendarEvent, accessToken: string): Promise<string> {
    // Validate the access token
    if (!accessToken) {
      throw new Error('No access token provided');
    }
    
    // Create a mock Google event
    const googleEvent = createMockGoogleEvent(event);
    
    return googleEvent.id;
  }
  
  /**
   * Mock implementation of updating a Google Calendar event
   * 
   * @param event - Updated meeting calendar event data
   * @param eventId - Google Calendar event ID
   * @param accessToken - Google OAuth access token
   * @returns Promise resolving to boolean indicating success
   */
  async updateEvent(event: MeetingCalendarEvent, eventId: string, accessToken: string): Promise<boolean> {
    // Validate the access token
    if (!accessToken) {
      throw new Error('No access token provided');
    }
    
    // Check if the event exists
    if (!mockCalendarData[eventId]) {
      throw new Error('Event not found');
    }
    
    // Update the event data
    const updatedEvent = {
      ...mockCalendarData[eventId],
      summary: event.title,
      description: event.description || '',
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: (event.endTime || new Date(event.startTime.getTime() + 3600000)).toISOString(),
        timeZone: 'UTC'
      },
      attendees: event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        responseStatus: 'needsAction',
        optional: attendee.role === ParticipantRole.OBSERVER
      })),
      location: event.location || '',
      recurrence: event.recurringPattern ? [event.recurringPattern] : undefined,
      updated: new Date().toISOString()
    };
    
    mockCalendarData[eventId] = updatedEvent;
    
    return true;
  }
  
  /**
   * Mock implementation of deleting a Google Calendar event
   * 
   * @param eventId - Google Calendar event ID
   * @param accessToken - Google OAuth access token
   * @returns Promise resolving to boolean indicating success
   */
  async deleteEvent(eventId: string, accessToken: string): Promise<boolean> {
    // Validate the access token
    if (!accessToken) {
      throw new Error('No access token provided');
    }
    
    // Check if the event exists
    if (!mockCalendarData[eventId]) {
      throw new Error('Event not found');
    }
    
    // Delete the event from mockCalendarData
    delete mockCalendarData[eventId];
    
    return true;
  }
  
  /**
   * Mock implementation of retrieving a Google Calendar event
   * 
   * @param eventId - Google Calendar event ID
   * @param accessToken - Google OAuth access token
   * @returns Promise resolving to the event data
   */
  async getEvent(eventId: string, accessToken: string): Promise<any> {
    // Validate the access token
    if (!accessToken) {
      throw new Error('No access token provided');
    }
    
    // Check if the event exists
    if (!mockCalendarData[eventId]) {
      throw new Error('Event not found');
    }
    
    return mockCalendarData[eventId];
  }
  
  /**
   * Mock implementation of generating a Google OAuth URL
   * 
   * @param userId - User ID for state parameter
   * @param redirectUrl - OAuth redirect URL
   * @returns Promise resolving to the authorization URL
   */
  async getAuthUrl(userId: string, redirectUrl: string): Promise<string> {
    // Generate a mock OAuth URL with userId and redirectUrl as parameters
    return `https://accounts.google.com/o/oauth2/auth?client_id=mock_client_id&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=https://www.googleapis.com/auth/calendar&state=${userId}`;
  }
  
  /**
   * Mock implementation of exchanging an authorization code for tokens
   * 
   * @param code - Authorization code
   * @param redirectUrl - OAuth redirect URL
   * @returns Promise resolving to token information
   */
  async getTokenFromCode(code: string, redirectUrl: string): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> {
    // Validate the authorization code
    if (code === 'invalid_code') {
      throw new Error('Invalid authorization code');
    }
    
    // Generate mock access and refresh tokens
    return {
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiryDate: Date.now() + 3600000 // 1 hour from now
    };
  }
  
  /**
   * Mock implementation of refreshing an OAuth token
   * 
   * @param refreshToken - OAuth refresh token
   * @returns Promise resolving to new token information
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiryDate: number }> {
    // Validate the refresh token
    if (refreshToken !== 'mock_refresh_token') {
      throw new Error('Invalid refresh token');
    }
    
    // Generate a new mock access token
    return {
      accessToken: 'new_mock_access_token',
      expiryDate: Date.now() + 3600000 // 1 hour from now
    };
  }
}