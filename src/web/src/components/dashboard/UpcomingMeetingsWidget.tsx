import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { useNavigate } from 'react-router-dom'; // version ^6.10.0

import Card from '../common/Card';
import MeetingCard from '../meetings/MeetingCard';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import useMeetings from '../../hooks/useMeetings';
import useOrganization from '../../hooks/useOrganization';
import { ROUTES } from '../../utils/constants/routes';

/**
 * Interface defining the props for the UpcomingMeetingsWidget component
 */
interface UpcomingMeetingsWidgetProps {
  /** Optional callback function when View All button is clicked */
  onViewAll?: () => void;
  /** Maximum number of meetings to display (default: 5) */
  limit?: number;
}

/**
 * Styled container for the widget
 */
const WidgetContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

/**
 * Styled container for the list of meetings
 */
const MeetingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

/**
 * Styled container for the empty state message
 */
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #666;
  font-style: italic;
`;

/**
 * Styled container for the error message
 */
const ErrorMessage = styled.div`
  color: #e74c3c;
  padding: 1rem;
  text-align: center;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  background-color: #fdeaea;
`;

/**
 * Styled container for the loading spinner
 */
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

/**
 * A dashboard widget that displays upcoming meetings for the current user
 */
const UpcomingMeetingsWidget: React.FC<UpcomingMeetingsWidgetProps> = ({
  onViewAll,
  limit = 5,
}) => {
  // Get navigation function from useNavigate hook
  const navigate = useNavigate();

  // Get current organization from useOrganization hook
  const { currentOrganization } = useOrganization();

  // Use useMeetings hook to access getUpcomingMeetings function
  const { getUpcomingMeetings, isLoading, isError, error, meetings } = useMeetings();

  // Fetch upcoming meetings data with limit parameter
  useEffect(() => {
    getUpcomingMeetings({ limit });
  }, [getUpcomingMeetings, limit]);

  // Implement handleJoin function to navigate to meeting moderator page
  const handleJoin = useCallback((meetingId: string) => {
    navigate(`${ROUTES.MEETINGS.ROOT}/${meetingId}/moderate`);
  }, [navigate]);

  // Implement handleViewAll function to navigate to meetings list page or call onViewAll callback
  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate(ROUTES.MEETINGS.LIST);
    }
  }, [navigate, onViewAll]);

  return (
    <WidgetContainer>
      <Card
        title="Upcoming Meetings"
        actions={<Button label="View All" onClick={handleViewAll} />}
      >
        {isLoading ? (
          // Display loading spinner when data is being fetched
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        ) : isError ? (
          // Display error message if fetching fails
          <ErrorMessage>{error?.message || 'Failed to load meetings.'}</ErrorMessage>
        ) : meetings && meetings.length === 0 ? (
          // Display 'No upcoming meetings' message if list is empty
          <EmptyState>No upcoming meetings</EmptyState>
        ) : (
          // Map through meetings array to render MeetingCard components
          <MeetingsList>
            {meetings?.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                compact
                onJoin={() => handleJoin(meeting.id)}
              />
            ))}
          </MeetingsList>
        )}
      </Card>
    </WidgetContainer>
  );
};

export default UpcomingMeetingsWidget;