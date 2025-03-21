import { google, OAuth2Client } from 'googleapis'; // v118.0.0
import { MeetingCalendarEvent, ParticipantRole } from '../../types/meeting.types';
import { logger } from '../../utils/helpers/logger';
import { ApiError } from '../../utils/errors/ApiError';
import { secrets } from '../../config/secrets';
import { env } from '../../config/environment';

/**
 * Transforms a MeetingCalendarEvent to Google Calendar event format
 * @param event The meeting event to transform
 * @returns Google Calendar event object
 */
const transformToGoogleEvent = (event: MeetingCalendarEvent): any => {
  // Create the base event object
  const googleEvent: any = {
    summary: event.title,
    description: event.description || '',
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.endTime ? event.endTime.toISOString() : 
        new Date(event.startTime.getTime() + 60 * 60 * 1000).toISOString(), // Default to 1 hour if no end time
      timeZone: 'UTC',
    },
  };

  // Add location if provided
  if (event.location) {
    googleEvent.location = event.location;
  }

  // Add attendees
  if (event.attendees && event.attendees.length > 0) {
    googleEvent.attendees = event.attendees.map(attendee => ({
      email: attendee.email,
      displayName: attendee.name,
      responseStatus: attendee.role === ParticipantRole.MODERATOR ? 'accepted' : 'needsAction',
    }));
  }

  // Add conference data if no physical location
  if (!event.location) {
    googleEvent.conferenceData = {
      createRequest: {
        requestId: event.meetingId,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    };
  }

  // Add recurrence if specified
  if (event.recurringPattern) {
    googleEvent.recurrence = [event.recurringPattern];
  }

  return googleEvent;
};

/**
 * Handles errors from Google Calendar API
 * @param error Error object from Google API
 * @param operation Description of the operation that failed
 * @throws ApiError with appropriate message and status code
 */
const handleGoogleCalendarError = (error: Error, operation: string): never => {
  logger.error(`Google Calendar ${operation} error`, { error });

  // Check if error is due to invalid credentials
  if (error.message.includes('invalid_token') || 
      error.message.includes('invalid_grant') || 
      error.message.includes('token expired')) {
    throw ApiError.badRequest(`Google Calendar authentication failed: ${error.message}`, { 
      cause: 'token_error',
      operation
    });
  }

  // Check if error is due to rate limiting
  if (error.message.includes('rate limit') || error.message.includes('quota')) {
    throw ApiError.serviceUnavailable(`Google Calendar API rate limit exceeded: ${error.message}`, {
      cause: 'rate_limit',
      operation
    });
  }

  // Check if error is due to invalid request
  if (error.message.includes('invalid request') || error.message.includes('validation')) {
    throw ApiError.badRequest(`Invalid Google Calendar request: ${error.message}`, {
      cause: 'invalid_request',
      operation
    });
  }

  // Default case for other errors
  throw ApiError.internalServerError(`Error during Google Calendar ${operation}: ${error.message}`, {
    cause: 'google_api_error',
    operation
  });
};

/**
 * Creates a new event in Google Calendar based on meeting details
 * @param event The meeting event to create
 * @param accessToken Google OAuth access token
 * @returns The Google Calendar event ID
 */
const createGoogleCalendarEvent = async (
  event: MeetingCalendarEvent,
  accessToken: string
): Promise<string> => {
  try {
    // Initialize the Google Calendar API client
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth });

    // Transform the event to Google Calendar format
    const googleEvent = transformToGoogleEvent(event);

    logger.debug('Creating Google Calendar event', { eventTitle: event.title });
    
    // Make the API request to create the event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: googleEvent,
    });

    if (!response.data.id) {
      throw new Error('Failed to create event: No event ID returned');
    }

    logger.info('Successfully created Google Calendar event', { 
      eventId: response.data.id,
      eventTitle: event.title
    });

    return response.data.id;
  } catch (error) {
    return handleGoogleCalendarError(error as Error, 'event creation');
  }
};

/**
 * Updates an existing event in Google Calendar
 * @param event The meeting event with updated details
 * @param eventId The Google Calendar event ID
 * @param accessToken Google OAuth access token
 * @returns True if update was successful
 */
const updateGoogleCalendarEvent = async (
  event: MeetingCalendarEvent,
  eventId: string,
  accessToken: string
): Promise<boolean> => {
  try {
    // Initialize the Google Calendar API client
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth });

    // Transform the event to Google Calendar format
    const googleEvent = transformToGoogleEvent(event);

    logger.debug('Updating Google Calendar event', { eventId, eventTitle: event.title });
    
    // Make the API request to update the event
    await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: googleEvent,
    });

    logger.info('Successfully updated Google Calendar event', { 
      eventId,
      eventTitle: event.title
    });

    return true;
  } catch (error) {
    return handleGoogleCalendarError(error as Error, 'event update');
  }
};

/**
 * Deletes an event from Google Calendar
 * @param eventId The Google Calendar event ID
 * @param accessToken Google OAuth access token
 * @returns True if deletion was successful
 */
const deleteGoogleCalendarEvent = async (
  eventId: string,
  accessToken: string
): Promise<boolean> => {
  try {
    // Initialize the Google Calendar API client
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth });

    logger.debug('Deleting Google Calendar event', { eventId });
    
    // Make the API request to delete the event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });

    logger.info('Successfully deleted Google Calendar event', { eventId });

    return true;
  } catch (error) {
    return handleGoogleCalendarError(error as Error, 'event deletion');
  }
};

/**
 * Retrieves an event from Google Calendar by ID
 * @param eventId The Google Calendar event ID
 * @param accessToken Google OAuth access token
 * @returns The Google Calendar event data
 */
const getGoogleCalendarEvent = async (
  eventId: string,
  accessToken: string
): Promise<any> => {
  try {
    // Initialize the Google Calendar API client
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth });

    logger.debug('Getting Google Calendar event', { eventId });
    
    // Make the API request to get the event
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    return response.data;
  } catch (error) {
    return handleGoogleCalendarError(error as Error, 'event retrieval');
  }
};

/**
 * Generates a URL for Google OAuth authentication
 * @param userId User ID to include in state parameter
 * @param redirectUrl Redirect URL after authentication
 * @returns The Google OAuth authorization URL
 */
const getGoogleAuthUrl = async (
  userId: string,
  redirectUrl: string
): Promise<string> => {
  try {
    // Initialize the OAuth client
    const oauth2Client = new OAuth2Client(
      secrets.GOOGLE_CLIENT_ID,
      secrets.GOOGLE_CLIENT_SECRET,
      redirectUrl
    );

    // Generate a state parameter that includes the user ID for security
    const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

    // Define the scopes needed for calendar access
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent', // Force consent screen to get refresh token
    });

    logger.debug('Generated Google OAuth URL', { userId });

    return authUrl;
  } catch (error) {
    logger.error('Failed to generate Google OAuth URL', { error, userId });
    throw ApiError.internalServerError('Failed to generate Google authentication URL', {
      cause: 'oauth_url_generation',
      error: (error as Error).message
    });
  }
};

/**
 * Exchanges an authorization code for Google OAuth tokens
 * @param code Authorization code from OAuth redirect
 * @param redirectUrl Redirect URL used in the initial request
 * @returns Object containing access token, refresh token, and expiry date
 */
const getGoogleTokenFromCode = async (
  code: string,
  redirectUrl: string
): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> => {
  try {
    // Initialize the OAuth client
    const oauth2Client = new OAuth2Client(
      secrets.GOOGLE_CLIENT_ID,
      secrets.GOOGLE_CLIENT_SECRET,
      redirectUrl
    );

    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Ensure we have the required tokens
    if (!tokens.access_token) {
      throw new Error('No access token returned');
    }

    logger.debug('Received Google OAuth tokens');

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiryDate: tokens.expiry_date || Date.now() + 3600 * 1000, // Default to 1 hour if not provided
    };
  } catch (error) {
    logger.error('Failed to exchange Google auth code for tokens', { error });
    throw ApiError.badRequest('Failed to authenticate with Google', {
      cause: 'token_exchange',
      error: (error as Error).message
    });
  }
};

/**
 * Refreshes an expired Google OAuth access token
 * @param refreshToken Google OAuth refresh token
 * @returns Object containing new access token and expiry date
 */
const refreshGoogleToken = async (
  refreshToken: string
): Promise<{ accessToken: string; expiryDate: number }> => {
  try {
    // Initialize the OAuth client
    const oauth2Client = new OAuth2Client(
      secrets.GOOGLE_CLIENT_ID,
      secrets.GOOGLE_CLIENT_SECRET
    );

    // Set the refresh token on the client
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Request a new access token using the refresh token
    const response = await oauth2Client.refreshAccessToken();
    const tokens = response.credentials;

    if (!tokens.access_token) {
      throw new Error('No access token returned during refresh');
    }

    logger.debug('Refreshed Google OAuth token');

    return {
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date || Date.now() + 3600 * 1000, // Default to 1 hour if not provided
    };
  } catch (error) {
    logger.error('Failed to refresh Google token', { error });
    throw ApiError.badRequest('Failed to refresh Google authentication', {
      cause: 'token_refresh',
      error: (error as Error).message
    });
  }
};

/**
 * Service class for Google Calendar integration
 */
export class GoogleCalendarService {
  private oAuth2Client: OAuth2Client;

  /**
   * Initializes the Google Calendar service
   */
  constructor() {
    this.oAuth2Client = new OAuth2Client(
      secrets.GOOGLE_CLIENT_ID,
      secrets.GOOGLE_CLIENT_SECRET
    );
  }

  /**
   * Creates a new event in Google Calendar
   * @param event The meeting event to create
   * @param accessToken Google OAuth access token
   * @returns The Google Calendar event ID
   */
  async createEvent(event: MeetingCalendarEvent, accessToken: string): Promise<string> {
    return createGoogleCalendarEvent(event, accessToken);
  }

  /**
   * Updates an existing event in Google Calendar
   * @param event The meeting event with updated details
   * @param eventId The Google Calendar event ID
   * @param accessToken Google OAuth access token
   * @returns True if update was successful
   */
  async updateEvent(
    event: MeetingCalendarEvent,
    eventId: string,
    accessToken: string
  ): Promise<boolean> {
    return updateGoogleCalendarEvent(event, eventId, accessToken);
  }

  /**
   * Deletes an event from Google Calendar
   * @param eventId The Google Calendar event ID
   * @param accessToken Google OAuth access token
   * @returns True if deletion was successful
   */
  async deleteEvent(eventId: string, accessToken: string): Promise<boolean> {
    return deleteGoogleCalendarEvent(eventId, accessToken);
  }

  /**
   * Retrieves an event from Google Calendar
   * @param eventId The Google Calendar event ID
   * @param accessToken Google OAuth access token
   * @returns The Google Calendar event data
   */
  async getEvent(eventId: string, accessToken: string): Promise<any> {
    return getGoogleCalendarEvent(eventId, accessToken);
  }

  /**
   * Generates a URL for Google OAuth authentication
   * @param userId User ID to include in state parameter
   * @param redirectUrl Redirect URL after authentication
   * @returns The Google OAuth authorization URL
   */
  async getAuthUrl(userId: string, redirectUrl: string): Promise<string> {
    return getGoogleAuthUrl(userId, redirectUrl);
  }

  /**
   * Exchanges an authorization code for Google OAuth tokens
   * @param code Authorization code from OAuth redirect
   * @param redirectUrl Redirect URL used in the initial request
   * @returns Object containing access token, refresh token, and expiry date
   */
  async getTokenFromCode(
    code: string,
    redirectUrl: string
  ): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> {
    return getGoogleTokenFromCode(code, redirectUrl);
  }

  /**
   * Refreshes an expired Google OAuth access token
   * @param refreshToken Google OAuth refresh token
   * @returns Object containing new access token and expiry date
   */
  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; expiryDate: number }> {
    return refreshGoogleToken(refreshToken);
  }
}