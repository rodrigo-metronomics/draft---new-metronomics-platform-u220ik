/**
 * Google Calendar Service Implementation for Metronomics Platform
 * 
 * This service provides functionality to interact with the Google Calendar API,
 * including OAuth authentication, event creation, updating, deletion, and retrieval.
 * 
 * @module services/calendar/googleCalendarService
 */

import {
  CalendarServiceInterface,
  CalendarEvent,
  CalendarAuthToken,
  CalendarProvider,
  CalendarAttendeeStatus,
  CalendarEventStatus,
  RecurrenceType
} from '../../types/calendar.types';
import axios from 'axios'; // ^1.4.0

// Google API Constants
const GOOGLE_API_BASE_URL = 'https://www.googleapis.com';
const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback/google';
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Maps a Google Calendar event to the application's CalendarEvent format
 * 
 * @param googleEvent - Google Calendar event object
 * @returns Mapped calendar event in the application format
 */
function mapGoogleEventToCalendarEvent(googleEvent: any): CalendarEvent {
  // Extract basic event information
  const id = null; // Internal ID will be assigned by the application
  const eventId = googleEvent.id;
  const summary = googleEvent.summary || '';
  const description = googleEvent.description || null;
  const location = googleEvent.location || null;
  
  // Parse dates
  const startTime = googleEvent.start?.dateTime 
    ? new Date(googleEvent.start.dateTime) 
    : googleEvent.start?.date 
      ? new Date(googleEvent.start.date)
      : new Date();
      
  const endTime = googleEvent.end?.dateTime 
    ? new Date(googleEvent.end.dateTime) 
    : googleEvent.end?.date 
      ? new Date(googleEvent.end.date)
      : null;
  
  // Map attendees
  const attendees = googleEvent.attendees?.map((attendee: any) => {
    let status = CalendarAttendeeStatus.NEEDS_ACTION;
    
    switch(attendee.responseStatus) {
      case 'accepted':
        status = CalendarAttendeeStatus.ACCEPTED;
        break;
      case 'declined':
        status = CalendarAttendeeStatus.DECLINED;
        break;
      case 'tentative':
        status = CalendarAttendeeStatus.TENTATIVE;
        break;
      default:
        status = CalendarAttendeeStatus.NEEDS_ACTION;
    }
    
    return {
      email: attendee.email,
      name: attendee.displayName || attendee.email,
      status,
      optional: attendee.optional || false
    };
  }) || [];
  
  // Map event status
  let eventStatus = CalendarEventStatus.CONFIRMED;
  switch(googleEvent.status) {
    case 'confirmed':
      eventStatus = CalendarEventStatus.CONFIRMED;
      break;
    case 'tentative':
      eventStatus = CalendarEventStatus.TENTATIVE;
      break;
    case 'cancelled':
      eventStatus = CalendarEventStatus.CANCELLED;
      break;
    default:
      eventStatus = CalendarEventStatus.CONFIRMED;
  }
  
  // Extract online meeting information
  const isOnlineMeeting = !!googleEvent.conferenceData;
  const onlineMeetingUrl = googleEvent.conferenceData?.entryPoints?.[0]?.uri || null;
  
  // Extract recurrence information
  let recurrence = null;
  if (googleEvent.recurrence && googleEvent.recurrence.length > 0) {
    // This is a simplified parsing of RRULE - a more robust parser might be needed
    const rrule = googleEvent.recurrence[0].replace('RRULE:', '');
    const rruleParts = rrule.split(';');
    const recurrenceObj: any = {};
    
    rruleParts.forEach((part: string) => {
      const [key, value] = part.split('=');
      recurrenceObj[key] = value;
    });
    
    let recurrenceType = RecurrenceType.DAILY;
    switch(recurrenceObj.FREQ) {
      case 'DAILY':
        recurrenceType = RecurrenceType.DAILY;
        break;
      case 'WEEKLY':
        recurrenceType = RecurrenceType.WEEKLY;
        break;
      case 'MONTHLY':
        recurrenceType = RecurrenceType.MONTHLY;
        break;
      case 'YEARLY':
        recurrenceType = RecurrenceType.YEARLY;
        break;
    }
    
    recurrence = {
      type: recurrenceType,
      interval: parseInt(recurrenceObj.INTERVAL || '1', 10),
      count: recurrenceObj.COUNT ? parseInt(recurrenceObj.COUNT, 10) : null,
      until: recurrenceObj.UNTIL ? new Date(recurrenceObj.UNTIL) : null,
      daysOfWeek: recurrenceObj.BYDAY ? recurrenceObj.BYDAY.split(',') : null,
      dayOfMonth: recurrenceObj.BYMONTHDAY ? parseInt(recurrenceObj.BYMONTHDAY, 10) : null,
      monthOfYear: recurrenceObj.BYMONTH ? parseInt(recurrenceObj.BYMONTH, 10) : null
    };
  }
  
  // Create the CalendarEvent object
  return {
    id,
    meetingId: googleEvent.extendedProperties?.private?.meetingId || '',
    title: summary,
    description,
    location,
    startTime,
    endTime,
    attendees,
    status: eventStatus,
    isOnlineMeeting,
    onlineMeetingUrl,
    recurrence,
    provider: CalendarProvider.GOOGLE,
    providerEventId: eventId,
    createdAt: googleEvent.created ? new Date(googleEvent.created) : null,
    updatedAt: googleEvent.updated ? new Date(googleEvent.updated) : null
  };
}

/**
 * Maps the application's CalendarEvent to Google Calendar event format
 * 
 * @param event - Calendar event in application format
 * @returns Google Calendar event object ready for API submission
 */
function mapCalendarEventToGoogleEvent(event: CalendarEvent): object {
  // Create basic event structure
  const googleEvent: any = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
  };
  
  // Add start and end times
  googleEvent.start = {
    dateTime: event.startTime.toISOString(),
    timeZone: 'UTC'
  };
  
  if (event.endTime) {
    googleEvent.end = {
      dateTime: event.endTime.toISOString(),
      timeZone: 'UTC'
    };
  } else {
    // Default to 1 hour duration if no end time is provided
    const endTime = new Date(event.startTime);
    endTime.setHours(endTime.getHours() + 1);
    googleEvent.end = {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC'
    };
  }
  
  // Add attendees if any
  if (event.attendees && event.attendees.length > 0) {
    googleEvent.attendees = event.attendees.map(attendee => {
      let responseStatus = 'needsAction';
      
      switch(attendee.status) {
        case CalendarAttendeeStatus.ACCEPTED:
          responseStatus = 'accepted';
          break;
        case CalendarAttendeeStatus.DECLINED:
          responseStatus = 'declined';
          break;
        case CalendarAttendeeStatus.TENTATIVE:
          responseStatus = 'tentative';
          break;
        default:
          responseStatus = 'needsAction';
      }
      
      return {
        email: attendee.email,
        displayName: attendee.name,
        responseStatus,
        optional: attendee.optional
      };
    });
  }
  
  // Set status
  switch(event.status) {
    case CalendarEventStatus.CONFIRMED:
      googleEvent.status = 'confirmed';
      break;
    case CalendarEventStatus.TENTATIVE:
      googleEvent.status = 'tentative';
      break;
    case CalendarEventStatus.CANCELLED:
      googleEvent.status = 'cancelled';
      break;
    default:
      googleEvent.status = 'confirmed';
  }
  
  // Add conference data if it's an online meeting
  if (event.isOnlineMeeting) {
    googleEvent.conferenceData = {
      createRequest: {
        requestId: `metronomics-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    };
  }
  
  // Add recurrence if defined
  if (event.recurrence) {
    googleEvent.recurrence = [
      mapRecurrenceRuleToRRULE(event.recurrence)
    ];
  }
  
  // Add meeting ID in extended properties
  googleEvent.extendedProperties = {
    private: {
      meetingId: event.meetingId
    }
  };
  
  return googleEvent;
}

/**
 * Converts a RecurrenceRule to RRULE string format for Google Calendar
 * 
 * @param recurrence - Recurrence rule to convert
 * @returns RRULE string for Google Calendar recurrence
 */
function mapRecurrenceRuleToRRULE(recurrence: any): string {
  let rrule = 'RRULE:';
  
  // Add frequency
  switch(recurrence.type) {
    case RecurrenceType.DAILY:
      rrule += 'FREQ=DAILY';
      break;
    case RecurrenceType.WEEKLY:
      rrule += 'FREQ=WEEKLY';
      break;
    case RecurrenceType.MONTHLY:
      rrule += 'FREQ=MONTHLY';
      break;
    case RecurrenceType.YEARLY:
      rrule += 'FREQ=YEARLY';
      break;
    default:
      rrule += 'FREQ=DAILY';
  }
  
  // Add interval
  if (recurrence.interval && recurrence.interval > 1) {
    rrule += `;INTERVAL=${recurrence.interval}`;
  }
  
  // Add count or until (not both)
  if (recurrence.count) {
    rrule += `;COUNT=${recurrence.count}`;
  } else if (recurrence.until) {
    // Format date as YYYYMMDDTHHMMSSZ
    const untilDate = recurrence.until.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    rrule += `;UNTIL=${untilDate}`;
  }
  
  // Add BYDAY for weekly recurrence
  if (recurrence.type === RecurrenceType.WEEKLY && recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
    rrule += `;BYDAY=${recurrence.daysOfWeek.join(',')}`;
  }
  
  // Add BYMONTHDAY for monthly recurrence
  if (recurrence.type === RecurrenceType.MONTHLY && recurrence.dayOfMonth) {
    rrule += `;BYMONTHDAY=${recurrence.dayOfMonth}`;
  }
  
  // Add BYMONTH for yearly recurrence
  if (recurrence.type === RecurrenceType.YEARLY && recurrence.monthOfYear) {
    rrule += `;BYMONTH=${recurrence.monthOfYear}`;
  }
  
  return rrule;
}

/**
 * Refreshes an expired Google OAuth access token
 * 
 * @param refreshToken - The refresh token to use for obtaining a new access token
 * @returns Promise resolving to the new auth token
 */
async function refreshAccessToken(refreshToken: string): Promise<CalendarAuthToken> {
  const response = await axios.post(GOOGLE_TOKEN_URL, {
    refresh_token: refreshToken,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });
  
  const { access_token, refresh_token, expires_in } = response.data;
  
  // Calculate expiry date (current time + expires_in seconds)
  const expiryDate = Date.now() + (expires_in * 1000);
  
  return {
    accessToken: access_token,
    refreshToken: refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the existing one
    expiryDate,
    provider: CalendarProvider.GOOGLE
  };
}

/**
 * Service for interacting with Google Calendar via Google Calendar API
 * Implements the CalendarServiceInterface for consistent integration
 */
export class GoogleCalendarService implements CalendarServiceInterface {
  private authToken: CalendarAuthToken | null;
  
  /**
   * Initializes the Google Calendar service
   * 
   * @param initialToken - Optional initial auth token to use
   */
  constructor(initialToken: CalendarAuthToken | null = null) {
    this.authToken = initialToken;
  }
  
  /**
   * Generates the OAuth authorization URL for Google Calendar
   * 
   * @param state - State parameter for OAuth flow
   * @returns Authorization URL for redirecting the user
   */
  getAuthUrl(state: string): string {
    const params = {
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: GOOGLE_CALENDAR_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state
    };
    
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    return `${GOOGLE_AUTH_URL}?${queryString}`;
  }
  
  /**
   * Exchanges an authorization code for an OAuth token
   * 
   * @param code - Authorization code from OAuth redirect
   * @returns Promise resolving to the auth token
   */
  async getTokenFromCode(code: string): Promise<CalendarAuthToken> {
    const response = await axios.post(GOOGLE_TOKEN_URL, {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    
    const { access_token, refresh_token, expires_in } = response.data;
    
    // Calculate expiry date (current time + expires_in seconds)
    const expiryDate = Date.now() + (expires_in * 1000);
    
    this.authToken = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiryDate,
      provider: CalendarProvider.GOOGLE
    };
    
    return this.authToken;
  }
  
  /**
   * Refreshes the current access token if expired
   * 
   * @returns Promise resolving to the refreshed auth token
   */
  async refreshToken(): Promise<CalendarAuthToken> {
    if (!this.authToken || !this.authToken.refreshToken) {
      throw new Error('No refresh token available. Please authenticate with Google Calendar first.');
    }
    
    // Check if token is expired
    if (this.authToken.expiryDate <= Date.now()) {
      this.authToken = await refreshAccessToken(this.authToken.refreshToken);
    }
    
    return this.authToken;
  }
  
  /**
   * Creates a new event in Google Calendar
   * 
   * @param event - Calendar event to create
   * @returns Promise resolving to the created calendar event
   */
  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    await this.refreshToken();
    
    const googleEvent = mapCalendarEventToGoogleEvent(event);
    
    const response = await axios.post(
      `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events`,
      googleEvent,
      {
        headers: this.getAuthHeaders(),
        params: {
          conferenceDataVersion: event.isOnlineMeeting ? 1 : 0
        }
      }
    );
    
    const createdEvent = mapGoogleEventToCalendarEvent(response.data);
    createdEvent.provider = CalendarProvider.GOOGLE;
    createdEvent.meetingId = event.meetingId;
    
    return createdEvent;
  }
  
  /**
   * Updates an existing event in Google Calendar
   * 
   * @param event - Calendar event to update
   * @returns Promise resolving to the updated calendar event
   */
  async updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
    await this.refreshToken();
    
    if (!event.providerEventId) {
      throw new Error('Cannot update event: missing provider event ID');
    }
    
    const googleEvent = mapCalendarEventToGoogleEvent(event);
    
    const response = await axios.put(
      `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${event.providerEventId}`,
      googleEvent,
      {
        headers: this.getAuthHeaders(),
        params: {
          conferenceDataVersion: event.isOnlineMeeting ? 1 : 0
        }
      }
    );
    
    return mapGoogleEventToCalendarEvent(response.data);
  }
  
  /**
   * Deletes an event from Google Calendar
   * 
   * @param eventId - ID of the event to delete
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await this.refreshToken();
      
      await axios.delete(
        `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`,
        {
          headers: this.getAuthHeaders()
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      return false;
    }
  }
  
  /**
   * Retrieves an event from Google Calendar by ID
   * 
   * @param eventId - ID of the event to retrieve
   * @returns Promise resolving to the calendar event or null if not found
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      await this.refreshToken();
      
      const response = await axios.get(
        `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`,
        {
          headers: this.getAuthHeaders()
        }
      );
      
      return mapGoogleEventToCalendarEvent(response.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      
      throw error;
    }
  }
  
  /**
   * Generates authorization headers for Google Calendar API requests
   * 
   * @returns Headers object with authorization
   */
  private getAuthHeaders(): Record<string, string> {
    if (!this.authToken) {
      throw new Error('No authentication token available');
    }
    
    return {
      'Authorization': `Bearer ${this.authToken.accessToken}`,
      'Content-Type': 'application/json'
    };
  }
}