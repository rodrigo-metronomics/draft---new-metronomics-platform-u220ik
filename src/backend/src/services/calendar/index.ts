/**
 * Calendar Service Integration Module
 * 
 * This barrel file exports calendar integration services for the Metronomics Platform,
 * providing a unified interface for Google Calendar and Microsoft Calendar integration.
 * It serves as the entry point for calendar functionality throughout the application.
 */

// Import the calendar service implementations
import { GoogleCalendarService } from './googleCalendarService';
import { MicrosoftCalendarService } from './microsoftCalendarService';

/**
 * Factory class that provides appropriate calendar service based on provider type
 */
class CalendarServiceFactory {
  private googleCalendarService: GoogleCalendarService;
  private microsoftCalendarService: MicrosoftCalendarService;

  /**
   * Initializes the calendar service factory
   */
  constructor() {
    this.googleCalendarService = new GoogleCalendarService();
    this.microsoftCalendarService = new MicrosoftCalendarService();
  }

  /**
   * Returns the appropriate calendar service based on provider type
   * @param providerType The calendar provider type ('google' or 'microsoft')
   * @returns The requested calendar service instance
   * @throws Error if provider type is not supported
   */
  getService(providerType: string): GoogleCalendarService | MicrosoftCalendarService {
    switch (providerType.toLowerCase()) {
      case 'google':
        return this.googleCalendarService;
      case 'microsoft':
        return this.microsoftCalendarService;
      default:
        throw new Error(`Unsupported calendar provider type: ${providerType}`);
    }
  }
}

// Create a singleton instance of the factory
const calendarServiceFactory = new CalendarServiceFactory();

// Export the services and factory
export {
  GoogleCalendarService,
  MicrosoftCalendarService,
  calendarServiceFactory
};