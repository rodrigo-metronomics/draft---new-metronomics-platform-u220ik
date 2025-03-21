import { Client } from '@microsoft/microsoft-graph-client'; // v3.0.5
import * as msal from '@azure/msal-node'; // v1.17.0
import { MeetingCalendarEvent, ParticipantRole } from '../../types/meeting.types';
import { logger } from '../../utils/helpers/logger';
import { ApiError } from '../../utils/errors/ApiError';
import { secrets } from '../../config/secrets';
import { env } from '../../config/environment';

/**
 * Service class for Microsoft Calendar integration
 * Provides methods for creating, updating, and deleting calendar events
 * as well as handling Microsoft OAuth authentication
 */
export class MicrosoftCalendarService {
  private msalClient: msal.ConfidentialClientApplication;

  /**
   * Initializes the Microsoft Calendar service with MSAL client
   */
  constructor() {
    this.msalClient = new msal.ConfidentialClientApplication({
      auth: {
        clientId: secrets.MICROSOFT_CLIENT_ID,
        clientSecret: secrets.MICROSOFT_CLIENT_SECRET,
        authority: 'https://login.microsoftonline.com/common',
      }
    });
  }

  /**
   * Creates a new event in Microsoft Calendar
   * 
   * @param event The event details to create
   * @param accessToken Microsoft access token
   * @returns The Microsoft Calendar event ID
   */
  async createEvent(event: MeetingCalendarEvent, accessToken: string): Promise<string> {
    return createMicrosoftCalendarEvent(event, accessToken);
  }

  /**
   * Updates an existing event in Microsoft Calendar
   * 
   * @param event The updated event details
   * @param eventId The Microsoft event ID
   * @param accessToken Microsoft access token
   * @returns True if update was successful
   */
  async updateEvent(event: MeetingCalendarEvent, eventId: string, accessToken: string): Promise<boolean> {
    return updateMicrosoftCalendarEvent(event, eventId, accessToken);
  }

  /**
   * Deletes an event from Microsoft Calendar
   * 
   * @param eventId The Microsoft event ID
   * @param accessToken Microsoft access token
   * @returns True if deletion was successful
   */
  async deleteEvent(eventId: string, accessToken: string): Promise<boolean> {
    return deleteMicrosoftCalendarEvent(eventId, accessToken);
  }

  /**
   * Retrieves an event from Microsoft Calendar
   * 
   * @param eventId The Microsoft event ID
   * @param accessToken Microsoft access token
   * @returns The Microsoft Calendar event data
   */
  async getEvent(eventId: string, accessToken: string): Promise<any> {
    return getMicrosoftCalendarEvent(eventId, accessToken);
  }

  /**
   * Generates a URL for Microsoft OAuth authentication
   * 
   * @param userId User ID for state parameter
   * @param redirectUrl Redirect URL after authentication
   * @returns Microsoft OAuth authorization URL
   */
  async getAuthUrl(userId: string, redirectUrl: string): Promise<string> {
    return getMicrosoftAuthUrl(userId, redirectUrl);
  }

  /**
   * Exchanges an authorization code for Microsoft OAuth tokens
   * 
   * @param code Authorization code from OAuth redirect
   * @param redirectUrl Redirect URL used in the OAuth flow
   * @returns Object containing access token, refresh token, and expiry date
   */
  async getTokenFromCode(code: string, redirectUrl: string): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> {
    return getMicrosoftTokenFromCode(code, redirectUrl);
  }

  /**
   * Refreshes an expired Microsoft OAuth access token
   * 
   * @param refreshToken Refresh token to use
   * @returns Object containing new access token and expiry date
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiryDate: number }> {
    return refreshMicrosoftToken(refreshToken);
  }
}

/**
 * Transforms a MeetingCalendarEvent to Microsoft Graph event format
 * 
 * @param event The internal event object
 * @returns Microsoft Graph formatted event object
 */
function transformToMicrosoftEvent(event: MeetingCalendarEvent): any {
  // Create basic event structure
  const microsoftEvent = {
    subject: event.title,
    body: {
      contentType: 'HTML',
      content: event.description || ''
    },
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: (event.endTime || new Date(event.startTime.getTime() + 3600000)).toISOString(),
      timeZone: 'UTC'
    },
    location: event.location ? { displayName: event.location } : null,
    attendees: event.attendees?.map(attendee => ({
      emailAddress: {
        address: attendee.email,
        name: attendee.name
      },
      type: 'required',
      // Set response status based on role
      status: {
        response: attendee.role === ParticipantRole.MODERATOR ? 'organizer' : 'none',
        time: new Date().toISOString()
      }
    })) || [],
    isOnlineMeeting: !event.location || event.location.includes('virtual') || event.location.includes('online'),
    onlineMeetingProvider: 'teamsForBusiness',
    allowNewTimeProposals: true
  };

  // Add recurrence rule if provided
  if (event.recurringPattern) {
    try {
      // Basic recurrence implementation, can be expanded for more complex patterns
      const recurrencePattern = event.recurringPattern.toLowerCase();
      if (recurrencePattern.includes('daily')) {
        microsoftEvent.recurrence = {
          pattern: {
            type: 'daily',
            interval: 1
          },
          range: {
            type: 'noEnd',
            startDate: new Date(event.startTime).toISOString().split('T')[0]
          }
        };
      } else if (recurrencePattern.includes('weekly')) {
        microsoftEvent.recurrence = {
          pattern: {
            type: 'weekly',
            interval: 1,
            daysOfWeek: [event.startTime.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()]
          },
          range: {
            type: 'noEnd',
            startDate: new Date(event.startTime).toISOString().split('T')[0]
          }
        };
      } else if (recurrencePattern.includes('monthly')) {
        microsoftEvent.recurrence = {
          pattern: {
            type: 'monthly',
            interval: 1,
            dayOfMonth: event.startTime.getDate()
          },
          range: {
            type: 'noEnd',
            startDate: new Date(event.startTime).toISOString().split('T')[0]
          }
        };
      }
    } catch (error) {
      logger.error('Error parsing recurrence pattern', { error, pattern: event.recurringPattern });
    }
  }

  // Filter out null properties
  Object.keys(microsoftEvent).forEach(key => {
    if (microsoftEvent[key] === null) {
      delete microsoftEvent[key];
    }
  });

  return microsoftEvent;
}

/**
 * Creates a new event in Microsoft Calendar
 * 
 * @param event The event details to create
 * @param accessToken Microsoft access token
 * @returns The Microsoft Calendar event ID
 */
async function createMicrosoftCalendarEvent(event: MeetingCalendarEvent, accessToken: string): Promise<string> {
  try {
    // Initialize the Microsoft Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    // Transform our event to Microsoft Graph format
    const microsoftEvent = transformToMicrosoftEvent(event);

    // Create the event
    logger.info('Creating Microsoft Calendar event', { meetingId: event.meetingId });
    const response = await client.api('/me/events').post(microsoftEvent);
    
    logger.info('Microsoft Calendar event created successfully', { meetingId: event.meetingId, eventId: response.id });
    return response.id;
  } catch (error) {
    handleMicrosoftCalendarError(error, 'create event');
  }
}

/**
 * Updates an existing event in Microsoft Calendar
 * 
 * @param event The updated event details
 * @param eventId The Microsoft event ID
 * @param accessToken Microsoft access token
 * @returns True if update was successful
 */
async function updateMicrosoftCalendarEvent(event: MeetingCalendarEvent, eventId: string, accessToken: string): Promise<boolean> {
  try {
    // Initialize the Microsoft Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    // Transform our event to Microsoft Graph format
    const microsoftEvent = transformToMicrosoftEvent(event);

    // Update the event
    logger.info('Updating Microsoft Calendar event', { meetingId: event.meetingId, eventId });
    await client.api(`/me/events/${eventId}`).update(microsoftEvent);
    
    logger.info('Microsoft Calendar event updated successfully', { meetingId: event.meetingId, eventId });
    return true;
  } catch (error) {
    handleMicrosoftCalendarError(error, 'update event');
  }
}

/**
 * Deletes an event from Microsoft Calendar
 * 
 * @param eventId The Microsoft event ID
 * @param accessToken Microsoft access token
 * @returns True if deletion was successful
 */
async function deleteMicrosoftCalendarEvent(eventId: string, accessToken: string): Promise<boolean> {
  try {
    // Initialize the Microsoft Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    // Delete the event
    logger.info('Deleting Microsoft Calendar event', { eventId });
    await client.api(`/me/events/${eventId}`).delete();
    
    logger.info('Microsoft Calendar event deleted successfully', { eventId });
    return true;
  } catch (error) {
    handleMicrosoftCalendarError(error, 'delete event');
  }
}

/**
 * Retrieves an event from Microsoft Calendar
 * 
 * @param eventId The Microsoft event ID
 * @param accessToken Microsoft access token
 * @returns The Microsoft Calendar event data
 */
async function getMicrosoftCalendarEvent(eventId: string, accessToken: string): Promise<any> {
  try {
    // Initialize the Microsoft Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    // Get the event
    logger.info('Retrieving Microsoft Calendar event', { eventId });
    const event = await client.api(`/me/events/${eventId}`).get();
    
    logger.debug('Microsoft Calendar event retrieved successfully', { eventId });
    return event;
  } catch (error) {
    handleMicrosoftCalendarError(error, 'get event');
  }
}

/**
 * Generates a URL for Microsoft OAuth authentication
 * 
 * @param userId User ID for state parameter
 * @param redirectUrl Redirect URL after authentication
 * @returns Microsoft OAuth authorization URL
 */
async function getMicrosoftAuthUrl(userId: string, redirectUrl: string): Promise<string> {
  try {
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
    
    // Define the authentication parameters
    const authUrlParameters = {
      scopes: ['user.read', 'calendars.readwrite'],
      redirectUri: redirectUrl,
      state
    };

    // Generate the authorization URL
    const url = await (await new msal.ConfidentialClientApplication({
      auth: {
        clientId: secrets.MICROSOFT_CLIENT_ID,
        clientSecret: secrets.MICROSOFT_CLIENT_SECRET,
        authority: 'https://login.microsoftonline.com/common'
      }
    }).getAuthCodeUrl(authUrlParameters));

    logger.info('Generated Microsoft OAuth URL', { userId });
    return url;
  } catch (error) {
    logger.error('Error generating Microsoft OAuth URL', { error, userId });
    throw new ApiError('Failed to generate Microsoft authentication URL', 500, { error: error.message });
  }
}

/**
 * Exchanges an authorization code for Microsoft OAuth tokens
 * 
 * @param code Authorization code from OAuth redirect
 * @param redirectUrl Redirect URL used in the OAuth flow
 * @returns Object containing access token, refresh token, and expiry date
 */
async function getMicrosoftTokenFromCode(code: string, redirectUrl: string): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> {
  try {
    // Initialize the MSAL client
    const msalClient = new msal.ConfidentialClientApplication({
      auth: {
        clientId: secrets.MICROSOFT_CLIENT_ID,
        clientSecret: secrets.MICROSOFT_CLIENT_SECRET,
        authority: 'https://login.microsoftonline.com/common'
      }
    });

    // Exchange the authorization code for tokens
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: ['user.read', 'calendars.readwrite'],
      redirectUri: redirectUrl
    });

    if (!tokenResponse?.accessToken) {
      throw new Error('No access token returned from Microsoft');
    }

    logger.info('Successfully acquired Microsoft token from code');
    
    // Calculate expiry date
    const expiresInSeconds = tokenResponse.expiresOn.getTime() - new Date().getTime();
    const expiryDate = Date.now() + expiresInSeconds;

    return {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken || '',
      expiryDate
    };
  } catch (error) {
    logger.error('Error getting Microsoft token from code', { error });
    throw new ApiError('Failed to exchange authorization code for token', 500, { error: error.message });
  }
}

/**
 * Refreshes an expired Microsoft OAuth access token
 * 
 * @param refreshToken Refresh token to use
 * @returns Object containing new access token and expiry date
 */
async function refreshMicrosoftToken(refreshToken: string): Promise<{ accessToken: string; expiryDate: number }> {
  try {
    // Initialize the MSAL client
    const msalClient = new msal.ConfidentialClientApplication({
      auth: {
        clientId: secrets.MICROSOFT_CLIENT_ID,
        clientSecret: secrets.MICROSOFT_CLIENT_SECRET,
        authority: 'https://login.microsoftonline.com/common'
      }
    });

    // Refresh the token
    const tokenResponse = await msalClient.acquireTokenByRefreshToken({
      refreshToken,
      scopes: ['user.read', 'calendars.readwrite']
    });

    if (!tokenResponse?.accessToken) {
      throw new Error('No access token returned from Microsoft');
    }

    logger.info('Successfully refreshed Microsoft token');
    
    // Calculate expiry date
    const expiresInSeconds = tokenResponse.expiresOn.getTime() - new Date().getTime();
    const expiryDate = Date.now() + expiresInSeconds;

    return {
      accessToken: tokenResponse.accessToken,
      expiryDate
    };
  } catch (error) {
    logger.error('Error refreshing Microsoft token', { error });
    throw new ApiError('Failed to refresh Microsoft token', 500, { error: error.message });
  }
}

/**
 * Handles errors from Microsoft Graph API
 * 
 * @param error The error from Microsoft Graph
 * @param operation The operation being performed when the error occurred
 * @throws ApiError with appropriate message
 */
function handleMicrosoftCalendarError(error: Error, operation: string): never {
  logger.error(`Error during Microsoft Calendar ${operation}`, { error });

  // Extract error details if available
  const microsoftError = error.message || 'Unknown error';
  const errorBody = (error as any).body || {};
  const statusCode = (error as any).statusCode || 500;

  // Handle common Microsoft Graph error scenarios
  if (microsoftError.includes('invalid_token') || microsoftError.includes('unauthorized') || statusCode === 401) {
    throw new ApiError(`Microsoft Calendar authentication failed: ${microsoftError}`, 401, { origin: 'microsoft' });
  }

  if (microsoftError.includes('throttled') || statusCode === 429) {
    throw new ApiError('Microsoft Calendar API rate limit exceeded, please try again later', 429, { origin: 'microsoft' });
  }

  if (statusCode === 404) {
    throw new ApiError(`Microsoft Calendar event not found`, 404, { origin: 'microsoft' });
  }

  if (statusCode >= 400 && statusCode < 500) {
    throw new ApiError(`Invalid request to Microsoft Calendar: ${microsoftError}`, 400, { origin: 'microsoft', details: errorBody });
  }

  // Default error case
  throw new ApiError(`Failed to ${operation} in Microsoft Calendar: ${microsoftError}`, 500, { origin: 'microsoft' });
}