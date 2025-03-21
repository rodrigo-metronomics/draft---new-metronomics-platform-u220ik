import React from 'react'; // React v^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // version ^0.34.0

import NotificationItem from '../NotificationItem';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '../../types/notification.types';
import { renderWithProviders } from '../../../tests/testUtils';

// Mock the useNotifications hook
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({ markAsRead: vi.fn(), archiveNotification: vi.fn() })
}));

// Mock the formatRelativeTime function
vi.mock('../../utils/helpers/dateTimeHelper', () => ({ formatRelativeTime: vi.fn().mockReturnValue('2 hours ago') }));

interface MockNotificationOverrides {
  [key: string]: any;
}

// Function to create a mock notification object with default values that can be overridden
const createMockNotification = (overrides: MockNotificationOverrides = {}): Notification => {
  // Create a default notification object with all required properties
  const defaultNotification: Notification = {
    id: 'test-notification-id',
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    title: 'Test Notification',
    content: 'This is a test notification message.',
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    link: null,
    metadata: null,
    userId: 'test-user-id',
    organizationId: 'test-org-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };

  // Apply any overrides provided in the parameters
  return defaultNotification; // Return the mock notification object
};

describe('NotificationItem', () => {
  it('renders correctly with default props', () => {
    // Create a mock notification with default values
    const mockNotification = createMockNotification();

    // Render the NotificationItem component with the mock notification
    renderWithProviders(<NotificationItem notification={mockNotification} />);

    // Verify that the notification title and content are displayed
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification message.')).toBeInTheDocument();

    // Verify that the relative time is displayed
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('applies correct styling for unread notifications', () => {
    // Create a mock notification with status UNREAD
    const mockNotification = createMockNotification({ status: NotificationStatus.UNREAD });

    // Render the NotificationItem component with the unread notification
    const { container } = renderWithProviders(<NotificationItem notification={mockNotification} />);

    // Verify that the component has the appropriate styling for unread notifications
    expect(container.firstChild).toHaveStyle('background-color: #f9fafb');
    expect(container.firstChild).toHaveStyle('border-left: 3px solid #1890ff');
  });

  it('applies correct styling for read notifications', () => {
    // Create a mock notification with status READ
    const mockNotification = createMockNotification({ status: NotificationStatus.READ });

    // Render the NotificationItem component with the read notification
    const { container } = renderWithProviders(<NotificationItem notification={mockNotification} />);

    // Verify that the component has the appropriate styling for read notifications
    expect(container.firstChild).toHaveStyle('background-color: transparent');
    expect(container.firstChild).not.toHaveStyle('border-left: 3px solid #1890ff');
  });

  it('displays the correct icon based on notification type', () => {
    // Create mock notifications for each notification type
    const notificationTypes = Object.values(NotificationType);
    const mockNotifications = notificationTypes.map(type => createMockNotification({ type }));

    // Render the NotificationItem component for each type
    mockNotifications.forEach(mockNotification => {
      renderWithProviders(<NotificationItem notification={mockNotification} />);

      // Verify that the correct icon is displayed for each notification type
      switch (mockNotification.type) {
        case NotificationType.MEETING_REMINDER:
          expect(screen.getByTestId('BellIcon')).toBeInTheDocument();
          break;
        case NotificationType.ACTION_ITEM_ASSIGNED:
        case NotificationType.ACTION_ITEM_DUE:
          expect(screen.getByTestId('TaskIcon')).toBeInTheDocument();
          break;
        case NotificationType.METRIC_THRESHOLD_ALERT:
          expect(screen.getByTestId('ChartIcon')).toBeInTheDocument();
          break;
        case NotificationType.GOAL_UPDATE:
          expect(screen.getByTestId('GoalIcon')).toBeInTheDocument();
          break;
        case NotificationType.MENTION:
          expect(screen.getByTestId('AlertIcon')).toBeInTheDocument();
          break;
        case NotificationType.SYSTEM_ANNOUNCEMENT:
          expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
          break;
        default:
          expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
          break;
      }
    });
  });

  it('displays the correct severity badge based on priority', () => {
    // Create mock notifications for each priority level
    const priorities = Object.values(NotificationPriority);
    const mockNotifications = priorities.map(priority => createMockNotification({ priority, status: NotificationStatus.UNREAD }));

    // Render the NotificationItem component for each priority
    mockNotifications.forEach(mockNotification => {
      renderWithProviders(<NotificationItem notification={mockNotification} />);

      // Verify that the correct severity badge is displayed for each priority
      let expectedSeverity: string;
      switch (mockNotification.priority) {
        case NotificationPriority.HIGH:
          expectedSeverity = 'error';
          break;
        case NotificationPriority.MEDIUM:
          expectedSeverity = 'warning';
          break;
        case NotificationPriority.LOW:
        default:
          expectedSeverity = 'info';
          break;
      }
      const badge = screen.getByTestId('Badge');
      expect(badge).toHaveClass(`p-badge-${expectedSeverity}`);
    });
  });

  it('calls onClick handler when notification is clicked', async () => {
    // Create a mock notification
    const mockNotification = createMockNotification();

    // Create a mock onClick handler function
    const onClickHandler = vi.fn();

    // Render the NotificationItem component with the mock handler
    renderWithProviders(<NotificationItem notification={mockNotification} onClick={onClickHandler} />);

    // Simulate a click on the notification
    await userEvent.click(screen.getByText('Test Notification'));

    // Verify that the onClick handler was called with the notification
    expect(onClickHandler).toHaveBeenCalledTimes(1);
  });

  it('calls markAsRead when mark as read button is clicked', async () => {
    // Mock the useNotifications hook to provide a mock markAsRead function
    const markAsReadMock = vi.fn();
    vi.mock('../../hooks/useNotifications', () => ({
      useNotifications: () => ({ markAsRead: markAsReadMock, archiveNotification: vi.fn() })
    }));

    // Create a mock notification with status UNREAD
    const mockNotification = createMockNotification({ status: NotificationStatus.UNREAD });

    // Render the NotificationItem component
    renderWithProviders(<NotificationItem notification={mockNotification} />);

    // Simulate a click on the mark as read button
    const markAsReadButton = screen.getByText('Mark as Read');
    await userEvent.click(markAsReadButton);

    // Verify that the markAsRead function was called with the notification ID
    expect(markAsReadMock).toHaveBeenCalledWith('test-notification-id');
  });

  it('calls archiveNotification when archive button is clicked', async () => {
    // Mock the useNotifications hook to provide a mock archiveNotification function
    const archiveNotificationMock = vi.fn();
    vi.mock('../../hooks/useNotifications', () => ({
      useNotifications: () => ({ markAsRead: vi.fn(), archiveNotification: archiveNotificationMock })
    }));

    // Create a mock notification
    const mockNotification = createMockNotification();

    // Render the NotificationItem component
    renderWithProviders(<NotificationItem notification={mockNotification} />);

    // Simulate a click on the archive button
    const archiveButton = screen.getByText('Archive');
    await userEvent.click(archiveButton);

    // Verify that the archiveNotification function was called with the notification ID
    expect(archiveNotificationMock).toHaveBeenCalledWith('test-notification-id');
  });

  it('formats relative time correctly', () => {
    // Mock the formatRelativeTime function to return a predictable value
    vi.mock('../../utils/helpers/dateTimeHelper', () => ({ formatRelativeTime: vi.fn().mockReturnValue('2 hours ago') }));

    // Create a mock notification with a specific createdAt timestamp
    const mockNotification = createMockNotification({ createdAt: '2024-01-01T12:00:00.000Z' });

    // Render the NotificationItem component
    renderWithProviders(<NotificationItem notification={mockNotification} />);

    // Verify that the formatted relative time is displayed correctly
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    // Create a mock notification
    const mockNotification = createMockNotification();

    // Render the NotificationItem component with a custom className
    const { container } = renderWithProviders(<NotificationItem notification={mockNotification} className="custom-class" />);

    // Verify that the custom className is applied to the component
    expect(container.firstChild).toHaveClass('custom-class');
  });
});