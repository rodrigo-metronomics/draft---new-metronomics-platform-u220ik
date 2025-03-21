import { Prisma } from '@prisma/client'; // ^4.15.0

/**
 * Enum defining the different types of notifications in the system
 */
export enum NotificationType {
  MEETING_REMINDER = 'MEETING_REMINDER',
  ACTION_ITEM_ASSIGNED = 'ACTION_ITEM_ASSIGNED',
  ACTION_ITEM_DUE = 'ACTION_ITEM_DUE',
  METRIC_THRESHOLD_ALERT = 'METRIC_THRESHOLD_ALERT',
  GOAL_UPDATE = 'GOAL_UPDATE',
  MENTION = 'MENTION',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}

/**
 * Enum defining the possible status values for notifications
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Enum defining the priority levels for notifications
 */
export enum NotificationPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Enum defining the delivery channels for notifications
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH'
}

/**
 * Enum defining the possible delivery status values for notification deliveries
 */
export enum NotificationDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
}

/**
 * Enum defining the frequency options for notification digest emails
 */
export enum NotificationDigestFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  NEVER = 'NEVER'
}

/**
 * Interface representing a notification entity in the system
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  link?: string;
  metadata?: Prisma.JsonValue;
  userId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deliveries?: NotificationDelivery[];
}

/**
 * Interface representing a notification delivery record
 */
export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  notification?: Notification;
}

/**
 * Data transfer object for creating a new notification
 */
export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  content: string;
  priority: NotificationPriority;
  link?: string;
  metadata?: Prisma.JsonValue;
  userId: string;
  organizationId: string;
  channels: NotificationChannel[];
}

/**
 * Interface for notification query parameters used in filtering notifications
 */
export interface NotificationQueryParams {
  userId?: string;
  organizationId?: string;
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Interface for notification count response
 */
export interface NotificationCount {
  total: number;
  unread: number;
}

/**
 * Interface for user notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  channels: NotificationChannel[];
  digestFrequency: NotificationDigestFrequency;
  typePreferences: NotificationTypePreference[];
}

/**
 * Interface for notification preferences specific to a notification type
 */
export interface NotificationTypePreference {
  type: NotificationType;
  enabled: boolean;
  channels: NotificationChannel[];
}

/**
 * Interface for notification delivery processing results
 */
export interface NotificationDeliveryResult {
  processed: number;
  successful: number;
  failed: number;
}