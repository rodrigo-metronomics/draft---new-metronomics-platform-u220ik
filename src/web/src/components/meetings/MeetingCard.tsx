import React from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { useNavigate } from 'react-router-dom'; // version ^6.14.0
import { CalendarIcon, ClockIcon, UsersIcon, VideoIcon } from 'primereact/icons/calendar'; // version ^10.0.0
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; // version ^10.0.0

import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import {
  Meeting,
  MeetingType,
  MeetingStatus,
} from '../../types/meeting.types';
import { formatDate, formatTimeRange } from '../../utils/helpers/dateTimeHelper';
import useMeetings from '../../hooks/useMeetings';

/**
 * Interface defining the props for the MeetingCard component
 */
interface MeetingCardProps {
  meeting: Meeting;
  onView?: (meeting: Meeting) => void;
  onJoin?: (meeting: Meeting) => void;
  onCancel?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
  compact?: boolean;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Styled container for the MeetingCard component
 * Adjusts width and min-height based on the `compact` prop
 */
const MeetingCardContainer = styled.div<{ compact?: boolean }>`
  width: ${props => props.compact ? '100%' : '350px'};
  min-height: ${props => props.compact ? '120px' : '200px'};
  transition: all 0.3s ease;
`;

/**
 * Styled container for meeting information details
 */
const MeetingInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

/**
 * Styled span for meeting information icons
 */
const MeetingInfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  color: ${props => props.theme.colors?.neutral[500]};
`;

/**
 * Styled span for meeting information text
 * Handles text overflow with ellipsis
 */
const MeetingInfoText = styled.span`
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * Styled container for meeting action buttons
 */
const MeetingActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

/**
 * Helper function to map meeting status to badge severity
 * @param status MeetingStatus
 * @returns Severity value for the Badge component
 */
const getMeetingStatusSeverity = (status: MeetingStatus): string => {
  switch (status) {
    case MeetingStatus.COMPLETED:
      return 'success';
    case MeetingStatus.SCHEDULED:
      return 'info';
    case MeetingStatus.IN_PROGRESS:
      return 'warning';
    case MeetingStatus.CANCELLED:
      return 'error';
    default:
      return 'info';
  }
};

/**
 * Helper function to get a human-readable label for meeting type
 * @param type MeetingType
 * @returns Human-readable meeting type label
 */
const getMeetingTypeLabel = (type: MeetingType): string => {
  switch (type) {
    case MeetingType.DAILY:
      return 'Daily Huddle';
    case MeetingType.WEEKLY:
      return 'Weekly Review';
    case MeetingType.QUARTERLY:
      return 'Quarterly Planning';
    default:
      return type;
  }
};

/**
 * Component that displays a meeting card with key information and actions
 * @param props MeetingCardProps
 * @returns Rendered meeting card component
 */
const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onView,
  onJoin,
  onCancel,
  onDelete,
  compact = false,
  interactive = true,
  className,
  style,
}) => {
  // Destructure meeting data for easier access
  const {
    id,
    title,
    meetingType,
    startTime,
    endTime,
    location,
    virtualMeetingUrl,
    status,
  } = meeting;

  // Initialize navigation hook
  const navigate = useNavigate();

  // Initialize meeting operations hook
  const { updateMeetingStatus, deleteMeeting } = useMeetings();

  /**
   * Handles click event for the View button
   * Navigates to the meeting detail page
   */
  const handleViewClick = () => {
    if (interactive) {
      navigate(`/meetings/${id}`);
    }
    onView?.(meeting);
  };

  /**
   * Handles click event for the Join button
   * Navigates to the meeting moderator page
   */
  const handleJoinClick = () => {
    navigate(`/meetings/${id}/moderator`);
    onJoin?.(meeting);
  };

  /**
   * Handles click event for the Cancel button
   * Updates the meeting status to CANCELLED
   */
  const handleCancelClick = () => {
    updateMeetingStatus({ id, status: MeetingStatus.CANCELLED });
    onCancel?.(meeting);
  };

  /**
   * Handles click event for the Delete button
   * Deletes the meeting after confirmation
   */
  const handleDeleteClick = () => {
    confirmDialog({
      message: 'Are you sure you want to delete this meeting?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        deleteMeeting(id);
        onDelete?.(meeting);
      },
    });
  };

  // Format meeting date and time using dateTimeHelper functions
  const meetingDate = formatDate(startTime, 'MMMM d, y');
  const meetingTime = formatTimeRange(startTime, endTime);

  // Determine meeting status badge severity using getMeetingStatusSeverity
  const statusSeverity = getMeetingStatusSeverity(status);

  // Determine meeting type label using getMeetingTypeLabel
  const meetingTypeLabel = getMeetingTypeLabel(meetingType);

  return (
    <MeetingCardContainer compact={compact} className={className} style={style}>
      <Card
        title={title}
        actions={
          <>
            <Badge value={status} severity={statusSeverity} />
          </>
        }
        interactive={interactive}
        onClick={handleViewClick}
      >
        <MeetingInfo>
          <MeetingInfoIcon>
            <CalendarIcon />
          </MeetingInfoIcon>
          <MeetingInfoText>{meetingTypeLabel}</MeetingInfoText>
        </MeetingInfo>
        <MeetingInfo>
          <MeetingInfoIcon>
            <ClockIcon />
          </MeetingInfoIcon>
          <MeetingInfoText>{meetingDate}, {meetingTime}</MeetingInfoText>
        </MeetingInfo>
        {location && (
          <MeetingInfo>
            <MeetingInfoIcon>
              <UsersIcon />
            </MeetingInfoIcon>
            <MeetingInfoText>{location}</MeetingInfoText>
          </MeetingInfo>
        )}
        {virtualMeetingUrl && (
          <MeetingInfo>
            <MeetingInfoIcon>
              <VideoIcon />
            </MeetingInfoIcon>
            <MeetingInfoText>{virtualMeetingUrl}</MeetingInfoText>
          </MeetingInfo>
        )}
        <MeetingActions>
          {status === MeetingStatus.SCHEDULED && (
            <>
              <Button label="Join" onClick={handleJoinClick} />
              <Button label="Cancel" severity="warning" outlined onClick={handleCancelClick} />
            </>
          )}
          {status === MeetingStatus.IN_PROGRESS && (
            <Button label="Moderate" onClick={handleJoinClick} />
          )}
          <Button label="Delete" severity="danger" outlined onClick={handleDeleteClick} />
        </MeetingActions>
      </Card>
      <ConfirmDialog />
    </MeetingCardContainer>
  );
};

export default MeetingCard;