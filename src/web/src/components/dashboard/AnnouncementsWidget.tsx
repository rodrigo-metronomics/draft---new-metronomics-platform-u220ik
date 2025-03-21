import React, { useState, useEffect, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10

// Internal imports
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { NotificationType, NotificationPriority, Notification } from '../../types/notification.types';
import { formatRelativeTime } from '../../utils/helpers/dateTimeHelper';

// Props interface for the AnnouncementsWidget component
export interface AnnouncementsWidgetProps {
  maxAnnouncements?: number; // Maximum number of announcements to display (default: 5)
  onViewAllClick?: () => void; // Callback function for the "View All" button click
  onAnnouncementClick?: (notificationId: string) => void; // Callback function for announcement click
  className?: string; // Optional CSS class name for styling
}

// Styled Components
const WidgetContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
`;

const AnnouncementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  max-height: 350px;
`;

const AnnouncementItem = styled.div<{ unread?: boolean; interactive?: boolean }>`
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${props => props.unread ? 'rgba(0, 123, 255, 0.05)' : 'transparent'};
  border-left: 3px solid ${props => props.unread ? 'var(--primary-color)' : 'transparent'};
  cursor: ${props => props.interactive ? 'pointer' : 'default'};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${props => props.interactive ? 'rgba(0, 123, 255, 0.1)' : 'inherit'};
  }
`;

const AnnouncementHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const AnnouncementTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  flex: 1;
`;

const AnnouncementContent = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const AnnouncementFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--error-color);
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

// A dashboard widget that displays system announcements and important notifications
export const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({
  maxAnnouncements = 5,
  onViewAllClick,
  onAnnouncementClick,
  className
}) => {
  // Access notifications data and methods from the NotificationContext
  const { notifications, loading, error, markAsRead } = useNotificationContext();

  // Filter notifications to only show SYSTEM_ANNOUNCEMENT and other important notification types
  const announcements = useMemo(() => {
    if (!notifications) return [];

    return notifications.filter(notification =>
      notification.type === NotificationType.SYSTEM_ANNOUNCEMENT
    );
  }, [notifications]);

  // Sort announcements by createdAt date (newest first) and priority (highest first)
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      const priorityA = Object.values(NotificationPriority).indexOf(a.priority);
      const priorityB = Object.values(NotificationPriority).indexOf(b.priority);

      if (dateB !== dateA) {
        return dateB - dateA; // Newest first
      } else {
        return priorityB - priorityA; // Highest priority first
      }
    });
  }, [announcements]);

  // Limit the number of displayed announcements based on maxAnnouncements prop
  const displayedAnnouncements = useMemo(() => {
    return sortedAnnouncements.slice(0, maxAnnouncements);
  }, [sortedAnnouncements, maxAnnouncements]);

  // Handle announcement click and mark as read
  const handleAnnouncementClick = async (notificationId: string) => {
    if (onAnnouncementClick) {
      onAnnouncementClick(notificationId);
    }
    await markAsRead(notificationId);
  };

  return (
    <Card
      title="Team Announcements"
      actions={onViewAllClick && (
        <Button label="View All" onClick={onViewAllClick} />
      )}
      className={className}
    >
      <WidgetContainer>
        {loading ? (
          // Show a skeleton loader while data is loading
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        ) : error ? (
          // Show an error message with a retry button if there's an error
          <ErrorState>
            <p>Error loading announcements.</p>
            <Button label="Retry"  />
          </ErrorState>
        ) : displayedAnnouncements.length === 0 ? (
          // Show an empty state when no announcements are available
          <EmptyState>
            <p>No announcements yet.</p>
          </EmptyState>
        ) : (
          // Render the list of announcements
          <AnnouncementsList>
            {displayedAnnouncements.map(announcement => (
              <AnnouncementItem
                key={announcement.id}
                unread={announcement.status === 'unread'}
                interactive={true}
                onClick={() => handleAnnouncementClick(announcement.id)}
              >
                <AnnouncementHeader>
                  <AnnouncementTitle>{announcement.title}</AnnouncementTitle>
                  <Badge value={announcement.priority} />
                </AnnouncementHeader>
                <AnnouncementContent>{announcement.content}</AnnouncementContent>
                <AnnouncementFooter>
                  <span>{formatRelativeTime(announcement.createdAt)}</span>
                </AnnouncementFooter>
              </AnnouncementItem>
            ))}
          </AnnouncementsList>
        )}
      </WidgetContainer>
    </Card>
  );
};