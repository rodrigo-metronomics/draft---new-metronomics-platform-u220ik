import { useCallback, useMemo } from 'react'; // React v^18.0.0
import { useNotificationContext } from '../contexts/NotificationContext';
import {
  Notification,
  NotificationFilters,
  NotificationPreferences,
  NotificationStatus,
  NotificationType,
  NotificationPriority,
  NotificationToastOptions
} from '../types/notification.types';
import { ID } from '../types/common.types';
import { useAuth } from './useAuth';

/**
 * Custom hook that provides access to notification functionality throughout the application.
 * This hook serves as a convenient wrapper for the NotificationContext, exposing methods
 * for fetching notifications, managing notification status, and handling notification preferences.
 * 
 * @returns An object containing notification state and methods for managing notifications
 */
export const useNotifications = () => {
  // Get notification context
  const {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    fetchNotifications: contextFetchNotifications,
    markAsRead: contextMarkAsRead,
    markAllAsRead: contextMarkAllAsRead,
    archiveNotification: contextArchiveNotification,
    updatePreferences: contextUpdatePreferences,
    showToast: contextShowToast
  } = useNotificationContext();

  // Get authentication state
  const { state: authState } = useAuth();
  const { isAuthenticated } = authState;

  /**
   * Fetches notifications with optional filters
   * 
   * @param filters - Optional filters to apply to the notification list
   * @returns Promise that resolves when notifications are fetched
   */
  const fetchNotifications = useCallback(
    (filters?: NotificationFilters) => {
      return contextFetchNotifications(filters);
    },
    [contextFetchNotifications]
  );

  /**
   * Marks a notification as read
   * 
   * @param notificationId - ID of the notification to mark as read
   * @returns Promise that resolves when the notification is marked as read
   */
  const markAsRead = useCallback(
    (notificationId: ID) => {
      return contextMarkAsRead(notificationId);
    },
    [contextMarkAsRead]
  );

  /**
   * Marks all notifications as read
   * 
   * @returns Promise that resolves when all notifications are marked as read
   */
  const markAllAsRead = useCallback(
    () => {
      return contextMarkAllAsRead();
    },
    [contextMarkAllAsRead]
  );

  /**
   * Archives a notification
   * 
   * @param notificationId - ID of the notification to archive
   * @returns Promise that resolves when the notification is archived
   */
  const archiveNotification = useCallback(
    (notificationId: ID) => {
      return contextArchiveNotification(notificationId);
    },
    [contextArchiveNotification]
  );

  /**
   * Updates notification preferences
   * 
   * @param updatedPreferences - New notification preferences to set
   * @returns Promise that resolves when preferences are updated
   */
  const updatePreferences = useCallback(
    (updatedPreferences: NotificationPreferences) => {
      return contextUpdatePreferences(updatedPreferences);
    },
    [contextUpdatePreferences]
  );

  /**
   * Shows a toast notification
   * 
   * @param options - Toast notification options including severity, summary, and detail
   */
  const showToast = useCallback(
    (options: NotificationToastOptions) => {
      contextShowToast(options);
    },
    [contextShowToast]
  );

  // Return an object containing all notification state and methods
  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    isAuthenticated,
    
    // Methods
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    updatePreferences,
    showToast
  };
};