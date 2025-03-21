import { ApiResponse, PaginatedResponse } from '../../types/api.types';
import { 
  Notification, 
  NotificationFilters, 
  NotificationPreferences, 
  NotificationStatus,
  NotificationCount,
  UpdateNotificationStatusRequest
} from '../../types/notification.types';
import { ID } from '../../types/common.types';
import { get, post, put } from './index';

// API endpoints for notification-related operations
const NOTIFICATION_ENDPOINTS = {
  GET_NOTIFICATIONS: '/notifications',
  GET_UNREAD_COUNT: '/notifications/unread-count',
  MARK_AS_READ: '/notifications/:id/read',
  MARK_ALL_AS_READ: '/notifications/read-all',
  ARCHIVE_NOTIFICATION: '/notifications/:id/archive',
  GET_PREFERENCES: '/notifications/preferences',
  UPDATE_PREFERENCES: '/notifications/preferences'
};

/**
 * Retrieves notifications for the current user with optional filtering
 * @param filters - Optional filters to apply to the notification list
 * @returns Promise that resolves to paginated notification data
 */
export const getNotifications = async (
  filters?: NotificationFilters
): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
  try {
    return await get(NOTIFICATION_ENDPOINTS.GET_NOTIFICATIONS, filters || {});
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Retrieves the count of unread notifications for the current user
 * @returns Promise that resolves to notification count data
 */
export const getUnreadCount = async (): Promise<ApiResponse<NotificationCount>> => {
  try {
    return await get(NOTIFICATION_ENDPOINTS.GET_UNREAD_COUNT);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Marks a specific notification as read
 * @param notificationId - ID of the notification to mark as read
 * @returns Promise that resolves to the updated notification
 */
export const markAsRead = async (notificationId: ID): Promise<ApiResponse<Notification>> => {
  try {
    const request: UpdateNotificationStatusRequest = {
      status: NotificationStatus.READ
    };
    const url = NOTIFICATION_ENDPOINTS.MARK_AS_READ.replace(':id', notificationId.toString());
    return await put(url, request);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Marks all unread notifications as read for the current user
 * @returns Promise that resolves to a success response
 */
export const markAllAsRead = async (): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    return await post(NOTIFICATION_ENDPOINTS.MARK_ALL_AS_READ);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Archives a specific notification
 * @param notificationId - ID of the notification to archive
 * @returns Promise that resolves to the updated notification
 */
export const archiveNotification = async (notificationId: ID): Promise<ApiResponse<Notification>> => {
  try {
    const url = NOTIFICATION_ENDPOINTS.ARCHIVE_NOTIFICATION.replace(':id', notificationId.toString());
    return await put(url);
  } catch (error) {
    console.error('Error archiving notification:', error);
    throw error;
  }
};

/**
 * Retrieves notification preferences for the current user
 * @returns Promise that resolves to notification preferences data
 */
export const getNotificationPreferences = async (): Promise<ApiResponse<NotificationPreferences>> => {
  try {
    return await get(NOTIFICATION_ENDPOINTS.GET_PREFERENCES);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
};

/**
 * Updates notification preferences for the current user
 * @param preferences - New notification preferences to set
 * @returns Promise that resolves to the updated notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<ApiResponse<NotificationPreferences>> => {
  try {
    return await put(NOTIFICATION_ENDPOINTS.UPDATE_PREFERENCES, preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};