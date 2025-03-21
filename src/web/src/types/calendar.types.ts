/**
 * TypeScript type definitions for calendar integration in the Metronomics Platform.
 * This file defines interfaces, enums, and types for interacting with external calendar
 * services like Google Calendar and Microsoft Outlook, supporting two-way synchronization.
 */

import { ID } from './common.types';

/**
 * Enum for supported calendar service providers
 */
export enum CalendarProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft'
}

/**
 * Enum for calendar event status values
 */
export enum CalendarEventStatus {
  CONFIRMED = 'confirmed',
  TENTATIVE = 'tentative',
  CANCELLED = 'cancelled'
}

/**
 * Enum for calendar event attendee response status
 */
export enum CalendarAttendeeStatus {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
  NEEDS_ACTION = 'needsAction'
}

/**
 * Enum for calendar synchronization status
 */
export enum CalendarSyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  FAILED = 'failed',
  NOT_SYNCED = 'notSynced'
}

/**
 * Enum for recurring event patterns
 */
export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

/**
 * Interface for calendar event attendees
 */
export interface CalendarAttendee {
  email: string;
  name: string;
  status: CalendarAttendeeStatus;
  optional: boolean;
}

/**
 * Interface for defining recurring event patterns
 */
export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  count: number | null;
  until: Date | null;
  daysOfWeek: string[] | null; // e.g., ['MO', 'WE', 'FR']
  dayOfMonth: number | null;   // e.g., 15 for 15th of the month
  monthOfYear: number | null;  // 1-12 for Jan-Dec
}

/**
 * Interface for calendar events with all necessary properties for external calendar services
 */
export interface CalendarEvent {
  id: string | null;            // Internal ID
  meetingId: string;            // Reference to Metronomics meeting
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date | null;
  attendees: CalendarAttendee[];
  status: CalendarEventStatus;
  isOnlineMeeting: boolean;
  onlineMeetingUrl: string | null;
  recurrence: RecurrenceRule | null;
  provider: CalendarProvider;
  providerEventId: string | null; // ID from external calendar service
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Interface for OAuth authentication tokens for calendar services
 */
export interface CalendarAuthToken {
  accessToken: string;
  refreshToken: string;
  expiryDate: number; // Timestamp in milliseconds
  provider: CalendarProvider;
}

/**
 * Interface for calendar synchronization results
 */
export interface CalendarSyncResult {
  status: CalendarSyncStatus;
  message: string | null;
  providerEventId: string | null;
  timestamp: Date;
}

/**
 * Interface for user's calendar integration status
 */
export interface CalendarIntegrationStatus {
  isGoogleConnected: boolean;
  isMicrosoftConnected: boolean;
  defaultProvider: CalendarProvider | null;
  lastSyncTime: Date | null;
}

/**
 * Interface defining the methods required for calendar service implementations
 */
export interface CalendarServiceInterface {
  getAuthUrl: (state: string) => string;
  getTokenFromCode: (code: string) => Promise<CalendarAuthToken>;
  refreshToken: () => Promise<CalendarAuthToken>;
  createEvent: (event: CalendarEvent) => Promise<CalendarEvent>;
  updateEvent: (event: CalendarEvent) => Promise<CalendarEvent>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  getEvent: (eventId: string) => Promise<CalendarEvent | null>;
}

/**
 * Interface for webhook events received from calendar providers
 */
export interface CalendarWebhookEvent {
  provider: CalendarProvider;
  eventType: 'created' | 'updated' | 'deleted';
  eventId: string;
  userId: string;
  timestamp: Date;
}

/**
 * Interface for calendar synchronization requests
 */
export interface CalendarSyncRequest {
  meetingId: string;
  provider: CalendarProvider;
  action: 'create' | 'update' | 'delete';
}

/**
 * Interface for calendar synchronization responses
 */
export interface CalendarSyncResponse {
  meetingId: string;
  provider: CalendarProvider;
  providerEventId: string | null;
  success: boolean;
  message: string | null;
}

/**
 * Interface for calendar connection requests
 */
export interface CalendarConnectionRequest {
  provider: CalendarProvider;
  code: string;
}

/**
 * Interface for calendar disconnection requests
 */
export interface CalendarDisconnectionRequest {
  provider: CalendarProvider;
}

/**
 * Interface for setting the default calendar provider
 */
export interface SetDefaultCalendarProviderRequest {
  provider: CalendarProvider | null;
}