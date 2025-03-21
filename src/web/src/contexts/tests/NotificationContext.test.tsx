import React from 'react'; // react@^18.2.0
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'; // @testing-library/react@^14.0.0
import { renderHook } from '@testing-library/react-hooks'; // @testing-library/react-hooks@^8.0.0
import { vi, jest } from 'jest'; // jest@^29.0.0

import { NotificationContext, NotificationProvider, useNotificationContext } from '../NotificationContext';
import { Notification, NotificationStatus, NotificationType, NotificationPriority, NotificationPreferences } from '../../types/notification.types';
import { notificationApi } from '../../services/api/notificationApi';
import { subscribeToCollection } from '../../services/firebase/firebaseFirestore';
import { onMessageReceived, getMessagingToken, requestNotificationPermission } from '../../services/firebase/firebaseMessaging';
import { renderHookWithProviders, createMockAuthUser } from '../../../tests/testUtils';

/**
 * Creates a mock notification object for testing
 * @param overrides Optional properties to override default values
 * @returns {Notification} A mock notification object
 */
const createMockNotification = (overrides: Partial<Notification> = {}): Notification => {
  // Create a default notification object with id, type, title, content, status, etc.
  const defaultNotification: Notification = {
    id: 'test-notification-id',
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    title: 'Test Notification',
    content: 'This is a test notification',
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    link: null,
    metadata: null,
    userId: 'test-user-id',
    organizationId: 'test-org-id',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    ...overrides, // Apply any overrides provided in the parameters
  };

  return defaultNotification; // Return the mock notification object
};

/**
 * Creates mock notification preferences for testing
 * @param overrides Optional properties to override default values
 * @returns {NotificationPreferences} Mock notification preferences
 */
const createMockNotificationPreferences = (overrides: Partial<NotificationPreferences> = {}): NotificationPreferences => {
  // Create default notification preferences with enabled status, channels, and type preferences
  const defaultPreferences: NotificationPreferences = {
    enabled: true,
    channels: [],
    digestFrequency: 'daily',
    typePreferences: [],
    ...overrides, // Apply any overrides provided in the parameters
  };

  return defaultPreferences; // Return the mock notification preferences object
};

describe('NotificationContext', () => {
  /**
   * Tests for the NotificationContext component
   */
  it('should render NotificationProvider without crashing', () => {
    /**
     * Render the NotificationProvider with a child component
     */
    render(
      <NotificationProvider>
        <div>Test Child</div>
      </NotificationProvider>
    );

    /**
     * Verify the child component is rendered
     */
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should throw an error when useNotificationContext is used outside of NotificationProvider', () => {
    /**
     * Mock console.error to prevent error output during test
     */
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    /**
     * Attempt to render a component that uses useNotificationContext without a provider
     */
    const { result, } = renderHook(() => useNotificationContext());

    /**
     * Verify that an error is thrown with the appropriate message
     */
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe('useNotificationContext must be used within a NotificationProvider');

    /**
     * Restore console.error
     */
    consoleErrorMock.mockRestore();
  });

  it('should fetch notifications when user is authenticated', async () => {
    /**
     * Mock notificationApi.getNotifications to return mock notifications
     */
    const mockNotifications = [createMockNotification()];
    const getNotificationsMock = vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue({
      data: { items: mockNotifications, total: 1, page: 1, pageSize: 1, totalPages: 1 },
      success: true,
      message: null,
    });

    /**
     * Mock notificationApi.getUnreadCount to return mock counts
     */
    const getUnreadCountMock = vi.spyOn(notificationApi, 'getUnreadCount').mockResolvedValue({
      data: { total: 1, unread: 1 },
      success: true,
      message: null,
    });

    /**
     * Mock subscribeToCollection to simulate real-time updates
     */
    const subscribeToCollectionMock = vi.fn().mockReturnValue(() => {});
    vi.spyOn(require('../../services/firebase/firebaseFirestore'), 'subscribeToCollection').mockImplementation(subscribeToCollectionMock);

    /**
     * Render the NotificationProvider with an authenticated user
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: {
          ...createMockAuthState(),
          isAuthenticated: true,
        },
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
    });

    /**
     * Wait for notifications to be loaded
     */
    await waitFor(() => {
      expect(result.current?.notifications).toEqual(mockNotifications);
    });

    /**
     * Verify that the notifications are fetched and stored in context
     */
    expect(getNotificationsMock).toHaveBeenCalledTimes(1);
    expect(getUnreadCountMock).toHaveBeenCalledTimes(1);
    expect(result.current?.notifications).toEqual(mockNotifications);
  });

  it('should fetch notification preferences when user is authenticated', async () => {
    /**
     * Mock notificationApi.getNotificationPreferences to return mock preferences
     */
    const mockPreferences = createMockNotificationPreferences();
    const getNotificationPreferencesMock = vi.spyOn(notificationApi, 'getNotificationPreferences').mockResolvedValue({
      data: mockPreferences,
      success: true,
      message: null,
    });

    /**
     * Render the NotificationProvider with an authenticated user
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: {
          ...createMockAuthState(),
          isAuthenticated: true,
        },
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
    });

    /**
     * Wait for preferences to be loaded
     */
    await waitFor(() => {
      expect(result.current?.preferences).toEqual(mockPreferences);
    });

    /**
     * Verify that the preferences are fetched and stored in context
     */
    expect(getNotificationPreferencesMock).toHaveBeenCalledTimes(1);
    expect(result.current?.preferences).toEqual(mockPreferences);
  });

  it('should mark a notification as read', async () => {
    /**
     * Create mock notifications including an unread notification
     */
    const mockNotification = createMockNotification({ id: '1', status: NotificationStatus.UNREAD });
    const mockNotifications = [mockNotification, createMockNotification({ id: '2', status: NotificationStatus.READ })];

    /**
     * Mock notificationApi.markAsRead to simulate successful API call
     */
    const markAsReadMock = vi.spyOn(notificationApi, 'markAsRead').mockResolvedValue({
      data: { ...mockNotification, status: NotificationStatus.READ },
      success: true,
      message: null,
    });

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: mockNotifications,
        unreadCount: 1,
        loading: false,
        error: null,
        preferences: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Call the markAsRead function from the context
     */
    await act(async () => {
      await result.current?.markAsRead('1');
    });

    /**
     * Verify that notificationApi.markAsRead was called with the correct ID
     */
    expect(markAsReadMock).toHaveBeenCalledWith('1');

    /**
     * Verify that the notification status is updated to READ in the context
     */
    expect(result.current?.notifications[0].status).toBe(NotificationStatus.READ);

    /**
     * Verify that the unread count is decremented
     */
    expect(result.current?.unreadCount).toBe(0);
  });

  it('should mark all notifications as read', async () => {
    /**
     * Create mock notifications including multiple unread notifications
     */
    const mockNotifications = [
      createMockNotification({ id: '1', status: NotificationStatus.UNREAD }),
      createMockNotification({ id: '2', status: NotificationStatus.UNREAD }),
      createMockNotification({ id: '3', status: NotificationStatus.READ }),
    ];

    /**
     * Mock notificationApi.markAllAsRead to simulate successful API call
     */
    const markAllAsReadMock = vi.spyOn(notificationApi, 'markAllAsRead').mockResolvedValue({
      data: { success: true },
      success: true,
      message: null,
    });

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: mockNotifications,
        unreadCount: 2,
        loading: false,
        error: null,
        preferences: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Call the markAllAsRead function from the context
     */
    await act(async () => {
      await result.current?.markAllAsRead();
    });

    /**
     * Verify that notificationApi.markAllAsRead was called
     */
    expect(markAllAsReadMock).toHaveBeenCalledTimes(1);

    /**
     * Verify that all notifications are updated to READ status in the context
     */
    expect(result.current?.notifications.every(n => n.status === NotificationStatus.READ)).toBe(true);

    /**
     * Verify that the unread count is set to 0
     */
    expect(result.current?.unreadCount).toBe(0);
  });

  it('should archive a notification', async () => {
    /**
     * Create mock notifications including a notification to archive
     */
    const mockNotification = createMockNotification({ id: '1', status: NotificationStatus.UNREAD });
    const mockNotifications = [mockNotification, createMockNotification({ id: '2', status: NotificationStatus.READ })];

    /**
     * Mock notificationApi.archiveNotification to simulate successful API call
     */
    const archiveNotificationMock = vi.spyOn(notificationApi, 'archiveNotification').mockResolvedValue({
      data: { ...mockNotification, status: NotificationStatus.ARCHIVED },
      success: true,
      message: null,
    });

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: mockNotifications,
        unreadCount: 1,
        loading: false,
        error: null,
        preferences: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Call the archiveNotification function from the context
     */
    await act(async () => {
      await result.current?.archiveNotification('1');
    });

    /**
     * Verify that notificationApi.archiveNotification was called with the correct ID
     */
    expect(archiveNotificationMock).toHaveBeenCalledWith('1');

    /**
     * Verify that the notification status is updated to ARCHIVED in the context
     */
    expect(result.current?.notifications[0].status).toBe(NotificationStatus.ARCHIVED);

    /**
     * Verify that the unread count is decremented if the notification was unread
     */
    expect(result.current?.unreadCount).toBe(0);
  });

  it('should update notification preferences', async () => {
    /**
     * Create mock notification preferences
     */
    const mockPreferences = createMockNotificationPreferences();
    const updatedPreferences = { ...mockPreferences, enabled: false };

    /**
     * Mock notificationApi.updateNotificationPreferences to simulate successful API call
     */
    const updateNotificationPreferencesMock = vi.spyOn(notificationApi, 'updateNotificationPreferences').mockResolvedValue({
      data: updatedPreferences,
      success: true,
      message: null,
    });

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        preferences: mockPreferences,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Call the updatePreferences function from the context with new preferences
     */
    await act(async () => {
      await result.current?.updatePreferences(updatedPreferences);
    });

    /**
     * Verify that notificationApi.updateNotificationPreferences was called with the new preferences
     */
    expect(updateNotificationPreferencesMock).toHaveBeenCalledWith(updatedPreferences);

    /**
     * Verify that the preferences in the context are updated
     */
    expect(result.current?.preferences).toEqual(updatedPreferences);
  });

  it('should handle push notifications', async () => {
    /**
     * Mock onMessageReceived to capture the callback function
     */
    let messageCallback: ((payload: any) => void) | null = null;
    vi.spyOn(require('../../services/firebase/firebaseMessaging'), 'onMessageReceived').mockImplementation((callback: (payload: any) => void) => {
      messageCallback = callback;
      return vi.fn();
    });

    /**
     * Mock getMessagingToken to return a mock token
     */
    vi.spyOn(require('../../services/firebase/firebaseMessaging'), 'getMessagingToken').mockResolvedValue({});

    /**
     * Mock requestNotificationPermission to return true
     */
    vi.spyOn(require('../../services/firebase/firebaseMessaging'), 'requestNotificationPermission').mockResolvedValue(true);

    /**
     * Render the NotificationProvider with an authenticated user
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        preferences: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Mock showToast to verify it's called
     */
    const showToastMock = vi.fn();
    result.current!.showToast = showToastMock;

    /**
     * Mock fetchNotifications to verify it's called
     */
    const fetchNotificationsMock = vi.fn();
    result.current!.fetchNotifications = fetchNotificationsMock;

    /**
     * Simulate receiving a push notification by calling the captured callback
     */
    const mockPayload = {
      notification: {
        title: 'Push Notification Title',
        body: 'Push Notification Body',
      },
      data: {
        type: 'SYSTEM_ANNOUNCEMENT',
        notificationId: 'push-notification-id',
      },
    };

    if (messageCallback) {
      await act(async () => {
        messageCallback(mockPayload);
      });
    }

    /**
     * Verify that a toast notification is shown with the correct content
     */
    expect(showToastMock).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Push Notification Title',
      detail: 'Push Notification Body',
    });

    /**
     * Verify that notifications are refreshed
     */
    expect(fetchNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when fetching notifications', async () => {
    /**
     * Mock notificationApi.getNotifications to throw an error
     */
    const getNotificationsMock = vi.spyOn(notificationApi, 'getNotifications').mockRejectedValue(new Error('Failed to fetch'));

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
    });

    /**
     * Wait for the error state to be set
     */
    await waitFor(() => {
      expect(result.current?.error).toBeInstanceOf(Error);
    });

    /**
     * Verify that the error state in the context is set
     */
    expect(result.current?.error).toBeInstanceOf(Error);
    expect((result.current?.error as Error).message).toBe('Failed to fetch notifications');

    /**
     * Verify that loading state is set to false
     */
    expect(result.current?.loading).toBe(false);
  });

  it('should handle errors when marking a notification as read', async () => {
    /**
     * Create mock notifications
     */
    const mockNotification = createMockNotification({ id: '1', status: NotificationStatus.UNREAD });
    const mockNotifications = [mockNotification];

    /**
     * Mock notificationApi.markAsRead to throw an error
     */
    const markAsReadMock = vi.spyOn(notificationApi, 'markAsRead').mockRejectedValue(new Error('Failed to mark as read'));

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: mockNotifications,
        unreadCount: 1,
        loading: false,
        error: null,
        preferences: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Call the markAsRead function from the context
     */
    await act(async () => {
      try {
        await result.current?.markAsRead('1');
      } catch (e) {
        // Ignore error, we are testing error handling
      }
    });

    /**
     * Verify that the error state in the context is set
     */
    expect(result.current?.error).toBeInstanceOf(Error);
    expect((result.current?.error as Error).message).toBe('Failed to mark notification as read');
  });

  it('should handle errors when marking all notifications as read', async () => {
    /**
     * Create mock notifications
     */
    const mockNotifications = [createMockNotification({ id: '1', status: NotificationStatus.UNREAD })];

    /**
     * Mock notificationApi.markAllAsRead to throw an error
     */
    const markAllAsReadMock = vi.spyOn(notificationApi, 'markAllAsRead').mockRejectedValue(new Error('Failed to mark all as read'));

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: mockNotifications,
        unreadCount: 1,
        loading: false,
        error: null,
        preferences: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Call the markAllAsRead function from the context
     */
    await act(async () => {
      try {
        await result.current?.markAllAsRead();
      } catch (e) {
        // Ignore error, we are testing error handling
      }
    });

    /**
     * Verify that the error state in the context is set
     */
    expect(result.current?.error).toBeInstanceOf(Error);
    expect((result.current?.error as Error).message).toBe('Failed to mark all notifications as read');
  });

  it('should handle errors when archiving a notification', async () => {
    /**
     * Create mock notifications
     */
    const mockNotification = createMockNotification({ id: '1', status: NotificationStatus.UNREAD });
    const mockNotifications = [mockNotification];

    /**
     * Mock notificationApi.archiveNotification to throw an error
     */
    const archiveNotificationMock = vi.spyOn(notificationApi, 'archiveNotification').mockRejectedValue(new Error('Failed to archive notification'));

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: mockNotifications,
        unreadCount: 1,
        loading: false,
        error: null,
        preferences: null,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Call the archiveNotification function from the context
     */
    await act(async () => {
      try {
        await result.current?.archiveNotification('1');
      } catch (e) {
        // Ignore error, we are testing error handling
      }
    });

    /**
     * Verify that the error state in the context is set
     */
    expect(result.current?.error).toBeInstanceOf(Error);
    expect((result.current?.error as Error).message).toBe('Failed to archive notification');
  });

  it('should handle errors when updating preferences', async () => {
    /**
     * Create mock notification preferences
     */
    const mockPreferences = createMockNotificationPreferences();

    /**
     * Mock notificationApi.updateNotificationPreferences to throw an error
     */
    const updateNotificationPreferencesMock = vi.spyOn(notificationApi, 'updateNotificationPreferences').mockRejectedValue(new Error('Failed to update preferences'));

    /**
     * Render the hook with the NotificationProvider
     */
    const { result } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
      notificationContext: {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        preferences: mockPreferences,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
        archiveNotification: vi.fn(),
        fetchNotifications: vi.fn(),
        updatePreferences: vi.fn(),
        showToast: vi.fn(),
      },
    });

    /**
     * Call the updatePreferences function from the context
     */
    await act(async () => {
      try {
        await result.current?.updatePreferences(mockPreferences);
      } catch (e) {
        // Ignore error, we are testing error handling
      }
    });

    /**
     * Verify that the error state in the context is set
     */
    expect(result.current?.error).toBeInstanceOf(Error);
    expect((result.current?.error as Error).message).toBe('Failed to update notification preferences');
  });

  it('should unsubscribe from Firestore and message listener on unmount', async () => {
    /**
     * Create a mock unsubscribe function
     */
    const unsubscribeMock = vi.fn();

    /**
     * Mock subscribeToCollection to return the mock unsubscribe function
     */
    vi.spyOn(require('../../services/firebase/firebaseFirestore'), 'subscribeToCollection').mockReturnValue(unsubscribeMock);

    /**
     * Mock onMessageReceived to return a mock unsubscribe function
     */
    const unsubscribeMessagingMock = vi.fn();
    vi.spyOn(require('../../services/firebase/firebaseMessaging'), 'onMessageReceived').mockReturnValue(unsubscribeMessagingMock);

    /**
     * Render the NotificationProvider with an authenticated user
     */
    const { result, unmount } = renderHookWithProviders(() => useNotificationContext(), {
      authContext: {
        state: createMockAuthState(),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      },
    });

    /**
     * Unmount the component
     */
    unmount();

    /**
     * Verify that both unsubscribe functions were called
     */
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(unsubscribeMessagingMock).toHaveBeenCalledTimes(1);
  });
});