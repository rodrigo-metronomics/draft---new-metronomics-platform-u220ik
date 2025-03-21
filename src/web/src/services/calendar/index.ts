/**
 * Barrel file for calendar services in the Metronomics Platform
 * 
 * This file exports calendar service implementations and provides a factory function
 * to get the appropriate calendar service based on the provider. It serves as the
 * entry point for calendar integration services.
 * 
 * @module services/calendar
 */

import { GoogleCalendarService } from './googleCalendarService';
import { MicrosoftCalendarService } from './microsoftCalendarService';
import { 
  CalendarServiceInterface,
  CalendarProvider,
  CalendarAuthToken
} from '../../types/calendar.types';

/**
 * Factory function to get the appropriate calendar service implementation based on the provider
 * 
 * @param provider - The calendar provider (Google or Microsoft)
 * @param authToken - Optional authentication token for the calendar service
 * @returns The appropriate calendar service implementation
 * @throws Error if an invalid calendar provider is specified
 */
export function getCalendarService(
  provider: CalendarProvider,
  authToken: CalendarAuthToken | null = null
): CalendarServiceInterface {
  switch (provider) {
    case CalendarProvider.GOOGLE:
      return new GoogleCalendarService(authToken);
    case CalendarProvider.MICROSOFT:
      return new MicrosoftCalendarService(authToken);
    default:
      throw new Error(`Invalid calendar provider: ${provider}`);
  }
}

// Export the calendar service implementations for direct use if needed
export { GoogleCalendarService, MicrosoftCalendarService };