import { ID } from './common.types';
import { ApiResponse, PaginatedResponse } from './api.types';

/**
 * Enum defining the different types of notifications in the Metronomics Platform
 */
export enum NotificationType {
  /** Reminder for an upcoming meeting */
  MEETING_REMINDER = 'MEETING_REMINDER',
  /** Notification when an action item is assigned to a user */
  ACTION_ITEM_ASSIGNED = 'ACTION_ITEM_ASSIGNED',
  /** Reminder for action items approaching due date */
  ACTION_ITEM_DUE = 'ACTION_ITEM_DUE',
  /** Alert when a metric crosses a defined threshold */
  METRIC_THRESHOLD_ALERT = 'METRIC_THRESHOLD_ALERT',
  /** Update notification when a strategic goal is modified */
  GOAL_UPDATE = 'GOAL_UPDATE',
  /** Notification when a user is mentioned in comments or notes */
  MENTION = 'MENTION',
  /** System-wide announcements */
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}

/**
 * Enum defining the possible status values for notifications
 */
export enum NotificationStatus {
  /** Notification has not been viewed by the user */
  UNREAD = 'UNREAD',
  /** Notification has been viewed by the user */
  READ = 'READ',
  /** Notification has been archived by the user */
  ARCHIVED = 'ARCHIVED'
}

/**
 * Enum defining the priority levels for notifications
 */
export enum NotificationPriority {
  /** High-priority notifications that require immediate attention */
  HIGH = 'HIGH',
  /** Standard notifications with moderate importance */
  MEDIUM = 'MEDIUM',
  /** Lower priority informational notifications */
  LOW = 'LOW'
}

/**
 * Enum defining the delivery channels for notifications
 */
export enum NotificationChannel {
  /** Notifications delivered within the application interface */
  IN_APP = 'IN_APP',
  /** Notifications delivered via email */
  EMAIL = 'EMAIL',
  /** Notifications delivered as browser push notifications */
  PUSH = 'PUSH'
}

/**
 * Enum defining the possible delivery status values for notification deliveries
 */
export enum NotificationDeliveryStatus {
  /** Notification is queued for delivery */
  PENDING = 'PENDING',
  /** Notification has been sent to the delivery channel */
  SENT = 'SENT',
  /** Notification has been successfully delivered to the user */
  DELIVERED = 'DELIVERED',
  /** Notification delivery failed */
  FAILED = 'FAILED'
}

/**
 * Enum defining the frequency options for notification digest emails
 */
export enum NotificationDigestFrequency {
  /** Digest emails sent once per day */
  DAILY = 'DAILY',
  /** Digest emails sent once per week */
  WEEKLY = 'WEEKLY',
  /** No digest emails are sent */
  NEVER = 'NEVER'
}

/**
 * Interface representing a notification entity in the system
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: ID;
  /** Type of notification */
  type: NotificationType;
  /** Brief notification title */
  title: string;
  /** Detailed notification content */
  content: string;
  /** Priority level of the notification */
  priority: NotificationPriority;
  /** Current status of the notification */
  status: NotificationStatus;
  /** Optional URL to navigate to when clicking the notification */
  link: string | null;
  /** Additional data related to the notification */
  metadata: Record<string, any> | null;
  /** ID of the user who should receive the notification */
  userId: ID;
  /** ID of the organization the notification belongs to */
  organizationId: ID;
  /** Timestamp when the notification was created */
  createdAt: string;
  /** Timestamp when the notification was last updated */
  updatedAt: string;
}

/**
 * Interface representing a notification delivery record
 */
export interface NotificationDelivery {
  /** Unique identifier for the delivery record */
  id: ID;
  /** ID of the notification that was delivered */
  notificationId: ID;
  /** Channel used for delivery */
  channel: NotificationChannel;
  /** Current status of the delivery */
  status: NotificationDeliveryStatus;
  /** Timestamp when the notification was successfully delivered, or null if not delivered */
  deliveredAt: string | null;
  /** Reason for delivery failure, or null if successful */
  failureReason: string | null;
  /** Number of retry attempts for this delivery */
  retryCount: number;
  /** Timestamp when the delivery record was created */
  createdAt: string;
  /** Timestamp when the delivery record was last updated */
  updatedAt: string;
}

/**
 * Interface for notification query parameters used in filtering notifications
 */
export interface NotificationFilters {
  /** Filter by notification status */
  status: NotificationStatus | null;
  /** Filter by notification type */
  type: NotificationType | null;
  /** Filter by notification priority */
  priority: NotificationPriority | null;
  /** Filter for notifications created after this date */
  startDate: string | null;
  /** Filter for notifications created before this date */
  endDate: string | null;
}

/**
 * Interface for notification count response
 */
export interface NotificationCount {
  /** Total number of notifications */
  total: number;
  /** Number of unread notifications */
  unread: number;
}

/**
 * Interface for notification preferences specific to a notification type
 */
export interface NotificationTypePreference {
  /** The notification type this preference applies to */
  type: NotificationType;
  /** Whether notifications of this type are enabled */
  enabled: boolean;
  /** Channels to use for delivering this notification type */
  channels: NotificationChannel[];
}

/**
 * Interface for user notification preferences
 */
export interface NotificationPreferences {
  /** Whether notifications are enabled overall */
  enabled: boolean;
  /** Default delivery channels for all notifications */
  channels: NotificationChannel[];
  /** Frequency setting for email digests */
  digestFrequency: NotificationDigestFrequency;
  /** Specific preferences for each notification type */
  typePreferences: NotificationTypePreference[];
}

/**
 * Interface for requests to update notification status
 */
export interface UpdateNotificationStatusRequest {
  /** The new status to set for the notification */
  status: NotificationStatus;
}

/**
 * Interface for the notification context value provided by NotificationContext
 */
export interface NotificationContextType {
  /** Array of notifications for the current user */
  notifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Whether notifications are currently being loaded */
  loading: boolean;
  /** Error object if fetching notifications failed, or null */
  error: Error | null;
  /** Function to mark a specific notification as read */
  markAsRead: (notificationId: ID) => Promise<void>;
  /** Function to mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Function to archive a notification */
  archiveNotification: (notificationId: ID) => Promise<void>;
  /** Function to fetch notifications with optional filters */
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  /** User's notification preferences, or null if not loaded */
  preferences: NotificationPreferences | null;
  /** Function to update user's notification preferences */
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  /** Function to show a toast notification */
  showToast: (options: NotificationToastOptions) => void;
}

/**
 * Interface for toast notification display options
 */
export interface NotificationToastOptions {
  /** Severity level of the toast (determines color) */
  severity: 'success' | 'info' | 'warn' | 'error';
  /** Brief title/summary for the toast */
  summary: string;
  /** Detailed message for the toast */
  detail: string;
  /** Duration in milliseconds to show the toast */
  life?: number;
  /** Whether the toast should persist until manually closed */
  sticky?: boolean;
}

/**
 * Type alias for paginated notification response from API
 */
export type PaginatedNotificationsResponse = PaginatedResponse<Notification>;

/**
 * Type alias for notification API response
 */
export type NotificationResponse = ApiResponse<Notification>;

/**
 * Type alias for notification count API response
 */
export type NotificationCountResponse = ApiResponse<NotificationCount>;

/**
 * Type alias for notification preferences API response
 */
export type NotificationPreferencesResponse = ApiResponse<NotificationPreferences>;