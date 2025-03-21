import React, { useCallback } from 'react'; // React v^18.2.0
import styled, { css } from 'styled-components'; // version ^5.3.10
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '../../types/notification.types';
import Card from '../common/Card';
import Badge from '../common/Badge';
import IconButton from '../common/IconButton';
import {
  CheckIcon,
  ArchiveIcon,
  BellIcon,
  AlertIcon,
  InfoIcon,
  TaskIcon,
  ChartIcon,
  GoalIcon,
} from 'primereact/icons'; // version ^10.0.0
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/helpers/dateTimeHelper';

// Define the props for the NotificationItem component
interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  className?: string;
}

// Styled components for the NotificationItem
const NotificationCard = styled(Card)<{ isUnread?: boolean }>`
  margin: 0.5rem 0;
  padding: 0.75rem;
  border-left: 3px solid transparent;
  background-color: ${({ theme, isUnread }) =>
    isUnread ? theme.colors?.background?.secondary : 'transparent'};
  transition: background-color 0.2s ease;

  ${(props) =>
    props.isUnread &&
    css`
      border-left: 3px solid ${props.theme.colors?.primary[500]};
    `}
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
`;

const TextContainer = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const NotificationTitle = styled.h4`
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NotificationMessage = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors?.text.secondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
  min-width: 4rem;
`;

const TimeStamp = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors?.text.secondary};
  white-space: nowrap;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.25rem;
`;

// Function to return the appropriate icon based on notification type
const getNotificationIcon = (notificationType: NotificationType): JSX.Element => {
  switch (notificationType) {
    case NotificationType.MEETING_REMINDER:
      return <BellIcon />;
    case NotificationType.ACTION_ITEM_ASSIGNED:
    case NotificationType.ACTION_ITEM_DUE:
      return <TaskIcon />;
    case NotificationType.METRIC_THRESHOLD_ALERT:
      return <ChartIcon />;
    case NotificationType.GOAL_UPDATE:
      return <GoalIcon />;
    case NotificationType.MENTION:
      return <AlertIcon />;
    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return <InfoIcon />;
    default:
      return <InfoIcon />;
  }
};

// Function to map notification priority to appropriate severity for Badge component
const getNotificationSeverity = (priority: NotificationPriority): string => {
  switch (priority) {
    case NotificationPriority.HIGH:
      return 'error';
    case NotificationPriority.MEDIUM:
      return 'warning';
    case NotificationPriority.LOW:
      return 'info';
    default:
      return 'info';
  }
};

// Main NotificationItem component
const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  className,
}) => {
  // Destructure notification object
  const { id, type, title, content, priority, status, createdAt } = notification;

  // Access notification management functions from useNotifications hook
  const { markAsRead, archiveNotification } = useNotifications();

  // Create callback to mark notification as read
  const handleMarkAsRead = useCallback(() => {
    markAsRead(id);
  }, [markAsRead, id]);

  // Create callback to archive notification
  const handleArchive = useCallback(() => {
    archiveNotification(id);
  }, [archiveNotification, id]);

  // Create callback to handle notification click
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
    if (status === NotificationStatus.UNREAD) {
      handleMarkAsRead();
    }
  }, [onClick, status, handleMarkAsRead]);

  // Get appropriate icon based on notification type
  const notificationIcon = getNotificationIcon(type);

  // Get appropriate severity based on notification priority
  const severity = getNotificationSeverity(priority);

  // Format relative time from notification createdAt timestamp
  const relativeTime = formatRelativeTime(createdAt);

  // Determine if notification is unread based on status
  const isUnread = status === NotificationStatus.UNREAD;

  return (
    <NotificationCard
      className={className}
      onClick={handleClick}
      interactive
      isUnread={isUnread}
    >
      <NotificationContent>
        <IconContainer>
          {notificationIcon}
          {isUnread && <Badge severity={severity} dot />}
        </IconContainer>
        <TextContainer>
          <NotificationTitle>{title}</NotificationTitle>
          <NotificationMessage>{content}</NotificationMessage>
        </TextContainer>
        <MetaContainer>
          <TimeStamp>{relativeTime}</TimeStamp>
          <ActionButtons>
            {isUnread && (
              <IconButton
                icon={<CheckIcon />}
                tooltip="Mark as Read"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleMarkAsRead();
                }}
              />
            )}
            <IconButton
              icon={<ArchiveIcon />}
              tooltip="Archive"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                handleArchive();
              }}
            />
          </ActionButtons>
        </MetaContainer>
      </NotificationContent>
    </NotificationCard>
  );
};

export default NotificationItem;