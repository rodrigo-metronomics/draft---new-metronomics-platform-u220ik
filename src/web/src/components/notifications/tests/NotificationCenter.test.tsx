import React from 'react'; // React v^18.2.0
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { act } from 'react-dom/test-utils'; // version ^18.2.0

import NotificationCenter from '../NotificationCenter';
import { useNotifications } from '../../../hooks/useNotifications';
import { Notification, NotificationStatus, NotificationType, NotificationPriority } from '../../../types/notification.types';
import { renderWithProviders } from '../../../../tests/testUtils';

// Mock the useNotifications hook
jest.mock('../../../hooks/useNotifications', () => ({
  useNotifications: jest.fn()
}));

// Describe the test suite for the NotificationCenter component
describe('NotificationCenter', () => {
  // Helper function to create mock notifications for testing
  const createMockNotifications = (count: number): Notification[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `notification-${i + 1}`,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: `Test Notification ${i + 1}`,
      content: `This is test notification content ${i + 1}.`,
      priority: NotificationPriority.MEDIUM,
      status: NotificationStatus.UNREAD,
      link: null,
      metadata: null,
      userId: 'test-user-id',
      organizationId: 'test-org-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Reset mocks before each test
  beforeEach(() => {
    (useNotifications as jest.Mock).mockClear();

    // Set up a default mock implementation for useNotifications
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      fetchNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      archiveNotification: jest.fn(),
      updatePreferences: jest.fn(),
      showToast: jest.fn(),
      isAuthenticated: true,
      preferences: null,
    });
  });

  it('renders notification bell with badge when there are unread notifications', () => {
    // Mock useNotifications to return unread notifications count
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      unreadCount: 3,
    });

    // Render the NotificationCenter component
    renderWithProviders(<NotificationCenter />);

    // Verify the notification bell icon is rendered
    const bellIcon = screen.getByLabelText('Notifications');
    expect(bellIcon).toBeInTheDocument();

    // Verify the badge with correct unread count is displayed
    const badge = screen.getByText('3');
    expect(badge).toBeInTheDocument();
  });

  it('does not show badge when unread count is zero and hideWhenZero is true', () => {
    // Mock useNotifications to return zero unread notifications
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      unreadCount: 0,
    });

    // Render the NotificationCenter component
    renderWithProviders(<NotificationCenter />);

    // Verify the notification bell icon is rendered
    const bellIcon = screen.getByLabelText('Notifications');
    expect(bellIcon).toBeInTheDocument();

    // Verify the badge is not displayed
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('opens dropdown when bell icon is clicked', async () => {
    // Mock useNotifications with necessary functions
    const fetchNotificationsMock = jest.fn();
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      unreadCount: 1,
      fetchNotifications: fetchNotificationsMock,
    });

    // Render the NotificationCenter component
    renderWithProviders(<NotificationCenter />);

    // Click on the notification bell icon
    const bellIcon = screen.getByLabelText('Notifications');
    await act(() => {
      fireEvent.click(bellIcon);
    });

    // Verify the dropdown is opened
    const dropdown = await screen.findByText('Notifications');
    expect(dropdown).toBeVisible();

    // Verify fetchNotifications was called
    expect(fetchNotificationsMock).toHaveBeenCalled();
  });

  it('displays loading state while fetching notifications', () => {
    // Mock useNotifications to return loading state as true
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      loading: true,
    });

    // Render the NotificationCenter component
    renderWithProviders(<NotificationCenter />);

    // Open the dropdown
    const bellIcon = screen.getByLabelText('Notifications');
    fireEvent.click(bellIcon);

    // Verify loading spinner is displayed
    const loadingSpinner = screen.getByRole('status');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('renders list of notifications when loaded', () => {
    // Create mock notifications
    const mockNotifications = createMockNotifications(3);

    // Mock useNotifications to return notifications and loading as false
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      notifications: mockNotifications,
      loading: false,
    });

    // Render the NotificationCenter component
    renderWithProviders(<NotificationCenter />);

    // Open the dropdown
    const bellIcon = screen.getByLabelText('Notifications');
    fireEvent.click(bellIcon);

    // Verify each notification is rendered with correct content
    mockNotifications.forEach((notification) => {
      const notificationTitle = screen.getByText(notification.title);
      expect(notificationTitle).toBeInTheDocument();

      const notificationContent = screen.getByText(notification.content);
      expect(notificationContent).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no notifications', () => {
    // Mock useNotifications to return empty notifications array and loading as false
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      notifications: [],
      loading: false,
    });

    // Render the NotificationCenter component
    renderWithProviders(<NotificationCenter />);

    // Open the dropdown
    const bellIcon = screen.getByLabelText('Notifications');
    fireEvent.click(bellIcon);

    // Verify empty state message is displayed
    const emptyStateMessage = screen.getByText('No new notifications');
    expect(emptyStateMessage).toBeInTheDocument();
  });

  it('calls markAllAsRead when "Mark all as read" button is clicked', async () => {
    // Mock useNotifications with markAllAsRead function
    const markAllAsReadMock = jest.fn();
    const mockNotifications = createMockNotifications(2);
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      notifications: mockNotifications,
      unreadCount: 2,
      loading: false,
      markAllAsRead: markAllAsReadMock,
    });

    // Render the NotificationCenter component
    renderWithProviders(<NotificationCenter />);

    // Open the dropdown
    const bellIcon = screen.getByLabelText('Notifications');
    fireEvent.click(bellIcon);

    // Click on the 'Mark all as read' button
    const markAllAsReadButton = await screen.findByText('Mark all as read');
    await act(() => {
      fireEvent.click(markAllAsReadButton);
    });

    // Verify markAllAsRead function was called
    expect(markAllAsReadMock).toHaveBeenCalled();
  });

  it('handles notification click correctly', async () => {
    // Create mock notifications
    const mockNotifications = createMockNotifications(1);

    // Mock useNotifications with markAsRead function
    const markAsReadMock = jest.fn();
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      notifications: mockNotifications,
      loading: false,
      markAsRead: markAsReadMock,
    });

    // Render the NotificationCenter component
    renderWithProviders(<NotificationCenter />);

    // Open the dropdown
    const bellIcon = screen.getByLabelText('Notifications');
    fireEvent.click(bellIcon);

    // Click on a notification
    const notificationItem = await screen.findByText(mockNotifications[0].content);
    await act(() => {
      fireEvent.click(notificationItem);
    });

    // Verify markAsRead was called with correct notification ID
    expect(markAsReadMock).toHaveBeenCalledWith(mockNotifications[0].id);
  });

  it('closes dropdown when clicking outside', async () => {
    // Mock useNotifications with necessary functions
    (useNotifications as jest.Mock).mockReturnValue({
      ...((useNotifications as jest.Mock).getMockImplementation()() || {}),
      unreadCount: 1,
    });

    // Render the NotificationCenter component
    const { container } = renderWithProviders(<NotificationCenter />);

    // Open the dropdown
    const bellIcon = screen.getByLabelText('Notifications');
    await act(() => {
      fireEvent.click(bellIcon);
    });

    // Verify the dropdown is opened
    const dropdown = await screen.findByText('Notifications');
    expect(dropdown).toBeVisible();

    // Click outside the dropdown
    await act(() => {
      fireEvent.mouseDown(document.body);
    });

    // Verify the dropdown is closed
    expect(dropdown).not.toBeVisible();
  });
});