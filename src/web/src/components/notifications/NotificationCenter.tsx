import React, { useState, useEffect, useCallback, useRef } from 'react'; // React v^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import {
  BellIcon,
  CheckIcon,
  SettingsIcon,
} from 'primereact/icons'; // version ^10.0.0
import { useClickOutside } from 'primereact/hooks'; // version ^10.0.0

import NotificationItem from './NotificationItem';
import NotificationBadge from './NotificationBadge';
import { useNotifications } from '../../hooks/useNotifications';
import {
  Notification,
  NotificationStatus,
} from '../../types/notification.types';
import IconButton from '../common/IconButton';
import Dropdown from '../common/Dropdown';
import Spinner from '../common/Spinner';
import Button from '../common/Button';

// Define the props for the NotificationCenter component
interface NotificationCenterProps {
  className?: string;
}

// Styled components for the NotificationCenter
const NotificationCenterContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const NotificationDropdown = styled.div`
  width: 350px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const NotificationTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

const NotificationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

const NotificationFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: text.secondary;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * Component that displays a dropdown notification center with a list of notifications
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  // Initialize state for dropdown open/closed status
  const [isOpen, setIsOpen] = useState(false);

  // Get notifications, unreadCount, loading, and notification management functions from useNotifications hook
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead,
  } = useNotifications();

  // Create ref for the dropdown container
  const dropdownRef = useRef(null);

  // Set up click outside handler to close the dropdown
  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
  });

  // Create toggleDropdown function to open/close the dropdown
  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Create handleMarkAllAsRead function to mark all notifications as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
    setIsOpen(false); // Close the dropdown after marking all as read
  }, [markAllAsRead]);

  // Create handleNotificationClick function to handle notification item clicks
  const handleNotificationClick = useCallback(() => {
    setIsOpen(false); // Close the dropdown after a notification is clicked
  }, []);

  // Fetch notifications when the dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Render the notification bell icon with badge as the dropdown trigger
  const trigger = (
    <IconButton
      icon={<BellIcon />}
      aria-label="Notifications"
      onClick={toggleDropdown}
    >
      <NotificationBadge
        count={unreadCount}
        position="top-right"
        hideWhenZero
      />
    </IconButton>
  );

  // Render the dropdown with notification list, loading state, and action buttons
  return (
    <NotificationCenterContainer className={className}>
      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} trigger={trigger}>
        <NotificationDropdown ref={dropdownRef}>
          <NotificationHeader>
            <NotificationTitle>Notifications</NotificationTitle>
            <IconButton icon={<SettingsIcon />} aria-label="Notification Settings" />
          </NotificationHeader>
          <NotificationList>
            {loading ? (
              <LoadingContainer>
                <Spinner size="medium" />
              </LoadingContainer>
            ) : notifications.length === 0 ? (
              <EmptyState>
                <p>No new notifications</p>
              </EmptyState>
            ) : (
              notifications.map((notification: Notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </NotificationList>
          <NotificationFooter>
            <ActionButtons>
              <Button
                variant="secondary"
                size="small"
                onClick={handleMarkAllAsRead}
                disabled={notifications.filter(n => n.status === NotificationStatus.UNREAD).length === 0}
              >
                <CheckIcon className="mr-1" />
                Mark all as read
              </Button>
            </ActionButtons>
          </NotificationFooter>
        </NotificationDropdown>
      </Dropdown>
    </NotificationCenterContainer>
  );
};

export default NotificationCenter;