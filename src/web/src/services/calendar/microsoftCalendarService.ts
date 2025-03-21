import { 
  CalendarServiceInterface, 
  CalendarEvent, 
  CalendarAuthToken, 
  CalendarProvider, 
  CalendarAttendeeStatus, 
  CalendarEventStatus, 
  RecurrenceType 
} from '../../types/calendar.types';
import axios from 'axios'; // axios version ^1.4.0

// Microsoft Graph API configuration constants
const MICROSOFT_GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MICROSOFT_CLIENT_ID = process.env.VITE_MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.VITE_MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_REDIRECT_URI = process.env.VITE_MICROSOFT_REDIRECT_URI || 'http://localhost:5173/auth/callback/microsoft';
const MICROSOFT_SCOPES = ['Calendars.ReadWrite', 'offline_access'];

/**
 * Maps a Microsoft Graph event to the application's CalendarEvent format
 * @param microsoftEvent The event object from Microsoft Graph API
 * @returns Mapped calendar event in the application format
 */
function mapMicrosoftEventToCalendarEvent(microsoftEvent: any): CalendarEvent {
  // Extract basic properties
  const id = microsoftEvent.id || null;
  const title = microsoftEvent.subject || '';
  const description = microsoftEvent.bodyPreview || microsoftEvent.body?.content || null;
  const location = microsoftEvent.location?.displayName || null;
  
  // Convert dates - ensure proper timezone handling with 'Z' suffix for UTC
  const startTime = microsoftEvent.start ? new Date(microsoftEvent.start.dateTime + 'Z') : new Date();
  const endTime = microsoftEvent.end ? new Date(microsoftEvent.end.dateTime + 'Z') : null;
  
  // Map attendees from Microsoft format to our format
  const attendees = (microsoftEvent.attendees || []).map((attendee: any) => {
    let status = CalendarAttendeeStatus.NEEDS_ACTION;
    
    switch (attendee.status?.response) {
      case 'accepted':
        status = CalendarAttendeeStatus.ACCEPTED;
        break;
      case 'declined':
        status = CalendarAttendeeStatus.DECLINED;
        break;
      case 'tentativelyAccepted':
        status = CalendarAttendeeStatus.TENTATIVE;
        break;
      default:
        status = CalendarAttendeeStatus.NEEDS_ACTION;
    }
    
    return {
      email: attendee.emailAddress.address,
      name: attendee.emailAddress.name || '',
      status,
      optional: attendee.type === 'optional'
    };
  });
  
  // Map event status
  let status = CalendarEventStatus.CONFIRMED;
  if (microsoftEvent.isCancelled) {
    status = CalendarEventStatus.CANCELLED;
  } else if (microsoftEvent.showAs === 'tentative') {
    status = CalendarEventStatus.TENTATIVE;
  }
  
  // Extract online meeting information
  const isOnlineMeeting = !!microsoftEvent.isOnlineMeeting;
  const onlineMeetingUrl = microsoftEvent.onlineMeeting?.joinUrl || null;
  
  // Extract recurrence pattern if present
  let recurrence = null;
  if (microsoftEvent.recurrence) {
    const pattern = microsoftEvent.recurrence.pattern;
    const range = microsoftEvent.recurrence.range;
    
    let type: RecurrenceType;
    switch (pattern.type) {
      case 'daily':
        type = RecurrenceType.DAILY;
        break;
      case 'weekly':
        type = RecurrenceType.WEEKLY;
        break;
      case 'monthly':
        type = RecurrenceType.MONTHLY;
        break;
      case 'yearly':
        type = RecurrenceType.YEARLY;
        break;
      default:
        type = RecurrenceType.DAILY;
    }
    
    recurrence = {
      type,
      interval: pattern.interval || 1,
      count: range.numberOfOccurrences || null,
      until: range.endDate ? new Date(range.endDate) : null,
      daysOfWeek: pattern.daysOfWeek || null,
      dayOfMonth: pattern.dayOfMonth || null,
      monthOfYear: pattern.month || null
    };
  }
  
  // Build and return the mapped CalendarEvent
  return {
    id,
    meetingId: '', // This will need to be set by the caller
    title,
    description,
    location,
    startTime,
    endTime,
    attendees,
    status,
    isOnlineMeeting,
    onlineMeetingUrl,
    recurrence,
    provider: CalendarProvider.MICROSOFT,
    providerEventId: id,
    createdAt: microsoftEvent.createdDateTime ? new Date(microsoftEvent.createdDateTime) : null,
    updatedAt: microsoftEvent.lastModifiedDateTime ? new Date(microsoftEvent.lastModifiedDateTime) : null
  };
}

/**
 * Maps the application's CalendarEvent to Microsoft Graph event format
 * @param event The calendar event in application format
 * @returns Microsoft Graph event object ready for API submission
 */
function mapCalendarEventToMicrosoftEvent(event: CalendarEvent): object {
  // Create the basic Microsoft event object
  const microsoftEvent: any = {
    subject: event.title,
    body: {
      contentType: 'text',
      content: event.description || ''
    }
  };
  
  // Add location if available
  if (event.location) {
    microsoftEvent.location = {
      displayName: event.location
    };
  }
  
  // Format start and end times - Microsoft requires specific format
  const startDateTime = event.startTime.toISOString().slice(0, 19);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  microsoftEvent.start = {
    dateTime: startDateTime,
    timeZone
  };
  
  if (event.endTime) {
    const endDateTime = event.endTime.toISOString().slice(0, 19);
    microsoftEvent.end = {
      dateTime: endDateTime,
      timeZone
    };
  } else {
    // Default to 1 hour if no end time is specified
    const endTime = new Date(event.startTime);
    endTime.setHours(endTime.getHours() + 1);
    microsoftEvent.end = {
      dateTime: endTime.toISOString().slice(0, 19),
      timeZone
    };
  }
  
  // Add attendees if any
  if (event.attendees && event.attendees.length > 0) {
    microsoftEvent.attendees = event.attendees.map(attendee => {
      let responseStatus;
      
      switch (attendee.status) {
        case CalendarAttendeeStatus.ACCEPTED:
          responseStatus = 'accepted';
          break;
        case CalendarAttendeeStatus.DECLINED:
          responseStatus = 'declined';
          break;
        case CalendarAttendeeStatus.TENTATIVE:
          responseStatus = 'tentativelyAccepted';
          break;
        default:
          responseStatus = 'notResponded';
      }
      
      return {
        emailAddress: {
          address: attendee.email,
          name: attendee.name
        },
        type: attendee.optional ? 'optional' : 'required',
        status: {
          response: responseStatus
        }
      };
    });
  }
  
  // Set event status
  switch (event.status) {
    case CalendarEventStatus.CONFIRMED:
      microsoftEvent.showAs = 'busy';
      break;
    case CalendarEventStatus.TENTATIVE:
      microsoftEvent.showAs = 'tentative';
      break;
    case CalendarEventStatus.CANCELLED:
      microsoftEvent.isCancelled = true;
      break;
  }
  
  // Handle online meeting settings
  if (event.isOnlineMeeting) {
    microsoftEvent.isOnlineMeeting = true;
    microsoftEvent.onlineMeetingProvider = 'teamsForBusiness';
  }
  
  // Add recurrence if defined
  if (event.recurrence) {
    microsoftEvent.recurrence = mapRecurrenceRuleToMicrosoftPattern(event.recurrence);
  }
  
  return microsoftEvent;
}

/**
 * Converts a RecurrenceRule to Microsoft Graph recurrence pattern format
 * @param recurrence The recurrence rule in application format
 * @returns Microsoft Graph recurrence pattern object
 */
function mapRecurrenceRuleToMicrosoftPattern(recurrence: any): object {
  const pattern: any = {
    type: recurrence.type.toLowerCase(),
    interval: recurrence.interval || 1
  };
  
  const range: any = {};
  
  // Set count or end date for recurrence
  if (recurrence.count) {
    range.type = 'numbered';
    range.numberOfOccurrences = recurrence.count;
  } else if (recurrence.until) {
    range.type = 'endDate';
    range.endDate = recurrence.until.toISOString().split('T')[0]; // Get YYYY-MM-DD
  } else {
    range.type = 'noEnd';
  }
  
  // Add pattern-specific properties based on recurrence type
  switch (recurrence.type) {
    case RecurrenceType.WEEKLY:
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        pattern.daysOfWeek = recurrence.daysOfWeek;
      }
      break;
    case RecurrenceType.MONTHLY:
      if (recurrence.dayOfMonth) {
        pattern.dayOfMonth = recurrence.dayOfMonth;
      }
      break;
    case RecurrenceType.YEARLY:
      if (recurrence.monthOfYear) {
        pattern.month = recurrence.monthOfYear;
      }
      if (recurrence.dayOfMonth) {
        pattern.dayOfMonth = recurrence.dayOfMonth;
      }
      break;
  }
  
  return {
    pattern,
    range
  };
}

/**
 * Refreshes an expired Microsoft OAuth access token
 * @param refreshToken The refresh token to use
 * @returns Promise resolving to the new auth token
 */
async function refreshAccessToken(refreshToken: string): Promise<CalendarAuthToken> {
  const data = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });
  
  try {
    const response = await axios.post(MICROSOFT_TOKEN_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;
    
    // Calculate expiry date based on expires_in (seconds)
    const expiryDate = Date.now() + (expires_in * 1000);
    
    return {
      accessToken: access_token,
      refreshToken: new_refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
      expiryDate,
      provider: CalendarProvider.MICROSOFT
    };
  } catch (error) {
    console.error('Error refreshing Microsoft access token:', error);
    throw new Error('Failed to refresh Microsoft access token');
  }
}

/**
 * Service for interacting with Microsoft Outlook Calendar via Microsoft Graph API
 * Implements the CalendarServiceInterface for consistent integration with the platform
 */
export class MicrosoftCalendarService implements CalendarServiceInterface {
  private authToken: CalendarAuthToken | null;

  /**
   * Initializes the Microsoft Calendar service
   * @param initialToken Optional initial auth token
   */
  constructor(initialToken: CalendarAuthToken | null = null) {
    this.authToken = initialToken;
  }

  /**
   * Generates the OAuth authorization URL for Microsoft Graph
   * @param state State parameter for OAuth security
   * @returns Authorization URL for redirecting the user
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      response_type: 'code',
      scope: MICROSOFT_SCOPES.join(' '),
      state
    });
    
    return `${MICROSOFT_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for an OAuth token
   * @param code The authorization code received from OAuth redirect
   * @returns Promise resolving to the auth token
   */
  async getTokenFromCode(code: string): Promise<CalendarAuthToken> {
    const data = new URLSearchParams({
      code,
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    
    try {
      const response = await axios.post(MICROSOFT_TOKEN_URL, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      // Calculate expiry date
      const expiryDate = Date.now() + (expires_in * 1000);
      
      this.authToken = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiryDate,
        provider: CalendarProvider.MICROSOFT
      };
      
      return this.authToken;
    } catch (error) {
      console.error('Error getting Microsoft token:', error);
      throw new Error('Failed to obtain Microsoft OAuth token');
    }
  }

  /**
   * Refreshes the current access token if expired
   * @returns Promise resolving to the refreshed auth token
   */
  async refreshToken(): Promise<CalendarAuthToken> {
    // Check if we have a valid token already
    if (this.authToken && this.authToken.refreshToken) {
      // Check if token is expired
      if (Date.now() >= this.authToken.expiryDate) {
        // Token expired, refresh it
        const newToken = await refreshAccessToken(this.authToken.refreshToken);
        this.authToken = newToken;
      }
    } else {
      throw new Error('No refresh token available');
    }
    
    return this.authToken;
  }

  /**
   * Creates a new event in Microsoft Outlook Calendar
   * @param event The calendar event to create
   * @returns Promise resolving to the created calendar event
   */
  async createEvent(event: CalendarEvent): Promise<CalendarEvent> {
    // Ensure we have a valid token
    await this.refreshToken();
    
    // Convert event to Microsoft Graph format
    const microsoftEvent = mapCalendarEventToMicrosoftEvent(event);
    
    try {
      const response = await axios.post(
        `${MICROSOFT_GRAPH_API_URL}/me/events`,
        microsoftEvent,
        {
          headers: this.getAuthHeaders()
        }
      );
      
      // Map the response back to our format
      const createdEvent = mapMicrosoftEventToCalendarEvent(response.data);
      
      // Ensure meetingId is preserved
      createdEvent.meetingId = event.meetingId;
      
      return createdEvent;
    } catch (error) {
      console.error('Error creating Microsoft calendar event:', error);
      throw new Error('Failed to create event in Microsoft calendar');
    }
  }

  /**
   * Updates an existing event in Microsoft Outlook Calendar
   * @param event The calendar event to update
   * @returns Promise resolving to the updated calendar event
   */
  async updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
    // Ensure we have a valid token
    await this.refreshToken();
    
    // Check if we have a provider event ID
    if (!event.providerEventId) {
      throw new Error('Cannot update event: No provider event ID');
    }
    
    // Convert event to Microsoft Graph format
    const microsoftEvent = mapCalendarEventToMicrosoftEvent(event);
    
    try {
      const response = await axios.patch(
        `${MICROSOFT_GRAPH_API_URL}/me/events/${event.providerEventId}`,
        microsoftEvent,
        {
          headers: this.getAuthHeaders()
        }
      );
      
      // Map the response back to our format
      const updatedEvent = mapMicrosoftEventToCalendarEvent(response.data);
      
      // Ensure meetingId is preserved
      updatedEvent.meetingId = event.meetingId;
      
      return updatedEvent;
    } catch (error) {
      console.error('Error updating Microsoft calendar event:', error);
      throw new Error('Failed to update event in Microsoft calendar');
    }
  }

  /**
   * Deletes an event from Microsoft Outlook Calendar
   * @param eventId The ID of the event to delete
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    // Ensure we have a valid token
    await this.refreshToken();
    
    try {
      await axios.delete(
        `${MICROSOFT_GRAPH_API_URL}/me/events/${eventId}`,
        {
          headers: this.getAuthHeaders()
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting Microsoft calendar event:', error);
      
      // If the event doesn't exist, consider it successfully deleted
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return true;
      }
      
      return false;
    }
  }

  /**
   * Retrieves an event from Microsoft Outlook Calendar by ID
   * @param eventId The ID of the event to retrieve
   * @returns Promise resolving to the calendar event or null if not found
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    // Ensure we have a valid token
    await this.refreshToken();
    
    try {
      const response = await axios.get(
        `${MICROSOFT_GRAPH_API_URL}/me/events/${eventId}`,
        {
          headers: this.getAuthHeaders()
        }
      );
      
      // Map the response to our format
      return mapMicrosoftEventToCalendarEvent(response.data);
    } catch (error) {
      console.error('Error getting Microsoft calendar event:', error);
      
      // If the event doesn't exist, return null
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      
      throw new Error('Failed to get event from Microsoft calendar');
    }
  }

  /**
   * Generates authorization headers for Microsoft Graph API requests
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