import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useQuery, useMutation } from 'react-query';
import { Toast } from 'primereact/toast';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';

// Types
import {
  Notification,
  NotificationContextType,
  NotificationFilters,
  NotificationPreferences,
  NotificationStatus,
  NotificationType,
  NotificationPriority,
  NotificationToastOptions
} from '../types/notification.types';

// Hooks
import { useAuthContext } from './AuthContext';

// Services
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../services/api/notificationApi';
import { subscribeToCollection } from '../services/firebase/firebaseFirestore';
import {
  onMessageReceived,
  getMessagingToken,
  requestNotificationPermission
} from '../services/firebase/firebaseMessaging';

// Constants for Firestore collections
const NOTIFICATIONS_COLLECTION = "notifications";
const USER_PREFERENCES_COLLECTION = "userPreferences";

/**
 * Context for notification state and methods
 */
const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * Provider component that manages notification state and methods
 */
const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get auth state
  const authState = useAuthContext().state;
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  
  // Toast reference for showing notifications
  const toast = useRef<Toast>(null);

  /**
   * React Query hook for fetching notification preferences
   */
  const { data: preferencesData } = useQuery(
    ['notificationPreferences'],
    getNotificationPreferences,
    {
      enabled: authState.isAuthenticated,
      onSuccess: (response) => {
        setPreferences(response.data);
      },
      onError: (err: Error) => {
        setError(err);
      }
    }
  );

  /**
   * Mutation for marking a notification as read
   */
  const markAsReadMutation = useMutation(markAsRead, {
    onError: (err: Error) => {
      setError(err);
    }
  });

  /**
   * Mutation for marking all notifications as read
   */
  const markAllAsReadMutation = useMutation(markAllAsRead, {
    onError: (err: Error) => {
      setError(err);
    }
  });

  /**
   * Mutation for archiving a notification
   */
  const archiveNotificationMutation = useMutation(archiveNotification, {
    onError: (err: Error) => {
      setError(err);
    }
  });

  /**
   * Mutation for updating notification preferences
   */
  const updatePreferencesMutation = useMutation(updateNotificationPreferences, {
    onError: (err: Error) => {
      setError(err);
    }
  });

  /**
   * Marks a notification as read
   * @param notificationId - ID of the notification to mark as read
   */
  const handleMarkAsRead = async (notificationId: string): Promise<void> => {
    try {
      // Find the notification in our local state
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Call the API to mark the notification as read
      await markAsReadMutation.mutateAsync(notificationId);

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notificationId
            ? { ...n, status: NotificationStatus.READ }
            : n
        )
      );

      // Update the unread count if the notification was previously unread
      if (notification.status === NotificationStatus.UNREAD) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
    }
  };

  /**
   * Marks all notifications as read
   */
  const handleMarkAllAsRead = async (): Promise<void> => {
    try {
      // Call the API to mark all notifications as read
      await markAllAsReadMutation.mutateAsync();

      // Update all notifications in local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          status: NotificationStatus.READ
        }))
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err : new Error('Failed to mark all notifications as read'));
    }
  };

  /**
   * Archives a notification
   * @param notificationId - ID of the notification to archive
   */
  const handleArchiveNotification = async (notificationId: string): Promise<void> => {
    try {
      // Find the notification in our local state
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Call the API to archive the notification
      await archiveNotificationMutation.mutateAsync(notificationId);

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notificationId
            ? { ...n, status: NotificationStatus.ARCHIVED }
            : n
        )
      );

      // Update the unread count if the notification was previously unread
      if (notification.status === NotificationStatus.UNREAD) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error archiving notification:', err);
      setError(err instanceof Error ? err : new Error('Failed to archive notification'));
    }
  };

  /**
   * Fetches notifications with optional filters
   * @param filters - Optional filters to apply
   */
  const fetchNotifications = async (filters?: NotificationFilters): Promise<void> => {
    try {
      setLoading(true);
      const response = await getNotifications(filters);
      setNotifications(response.data.items);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      setLoading(false);
    }
  };

  /**
   * Updates notification preferences
   * @param newPreferences - New notification preferences
   */
  const handleUpdatePreferences = async (newPreferences: NotificationPreferences): Promise<void> => {
    try {
      const response = await updatePreferencesMutation.mutateAsync(newPreferences);
      setPreferences(response.data);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError(err instanceof Error ? err : new Error('Failed to update notification preferences'));
    }
  };

  /**
   * Shows a toast notification
   * @param options - Toast notification options
   */
  const showToast = (options: NotificationToastOptions): void => {
    try {
      if (toast.current) {
        toast.current.show({
          severity: options.severity,
          summary: options.summary,
          detail: options.detail,
          life: options.life || 3000,
          sticky: options.sticky || false
        });
      }
    } catch (err) {
      console.error('Error showing toast notification:', err);
    }
  };

  /**
   * Handles push notification messages
   * @param payload - Push notification payload
   */
  const handlePushNotification = useCallback((payload: any): void => {
    // Extract notification data from payload
    const notificationData = {
      title: payload.notification.title,
      content: payload.notification.body,
      type: payload.data?.type || 'SYSTEM_ANNOUNCEMENT',
      id: payload.data?.notificationId
    };

    // Show a toast notification
    showToast({
      severity: 'info',
      summary: notificationData.title,
      detail: notificationData.content
    });

    // Refresh notifications list to include the new notification
    fetchNotifications();

    // Update unread count
    setUnreadCount(prev => prev + 1);
  }, []);

  /**
   * Sets up push notification handling
   */
  const setupPushNotifications = async (): Promise<void> => {
    try {
      // Request notification permission
      const hasPermission = await requestNotificationPermission();
      
      if (hasPermission) {
        // Get messaging token
        await getMessagingToken();
        
        // Set up message listener
        const unsubscribe = onMessageReceived(handlePushNotification);
        
        // Store unsubscribe function for cleanup
        return () => {
          unsubscribe();
        };
      }
    } catch (err) {
      console.error('Error setting up push notifications:', err);
    }
  };

  /**
   * Effect for handling real-time notification updates
   */
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let unsubscribeMessaging: (() => void) | null = null;

    // Set up real-time notification subscription when user is authenticated
    if (authState.isAuthenticated && authState.user) {
      // Subscribe to Firestore notifications collection
      unsubscribeFirestore = subscribeToCollection(
        NOTIFICATIONS_COLLECTION,
        [
          { field: 'userId', operator: '==', value: authState.user.id },
          { field: 'status', operator: '!=', value: NotificationStatus.ARCHIVED }
        ],
        (notificationsData) => {
          // Update notifications state with the fetched data
          setNotifications(notificationsData as Notification[]);
          
          // Update unread count
          const unreadNotifications = notificationsData.filter(
            (notification: any) => notification.status === NotificationStatus.UNREAD
          );
          setUnreadCount(unreadNotifications.length);
        },
        (err) => {
          console.error('Error in notifications subscription:', err);
          setError(err);
        },
        {
          orderBy: { field: 'createdAt', direction: 'desc' },
          limit: 50
        }
      );

      // Set up push notification handling
      setupPushNotifications().then((cleanup) => {
        if (cleanup) {
          unsubscribeMessaging = cleanup;
        }
      });
    }

    // Clean up subscriptions when component unmounts or auth state changes
    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      if (unsubscribeMessaging) {
        unsubscribeMessaging();
      }
    };
  }, [authState.isAuthenticated, authState.user, handlePushNotification]);

  /**
   * Effect for fetching notification preferences
   */
  useEffect(() => {
    // Fetch notification preferences when user is authenticated
    if (authState.isAuthenticated) {
      getNotificationPreferences()
        .then((response) => {
          setPreferences(response.data);
        })
        .catch((err) => {
          console.error('Error fetching notification preferences:', err);
        });
    }
  }, [authState.isAuthenticated]);

  // Create context value object with current notification state and all notification methods
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    archiveNotification: handleArchiveNotification,
    fetchNotifications,
    updatePreferences: handleUpdatePreferences,
    showToast
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {/* Toast component for displaying notifications */}
      <Toast ref={toast} />
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook that provides access to the notification context
 * @returns Notification context value containing state and methods
 * @throws Error if used outside of a NotificationProvider
 */
const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export { NotificationContext, NotificationProvider, useNotificationContext };