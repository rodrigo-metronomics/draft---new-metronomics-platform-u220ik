import React, { useState, useEffect, useCallback } from 'react'; // React library for component creation // v18.2.0
import { useNavigate, useSearchParams } from 'react-router-dom'; // Hooks for navigation and URL query parameter management // v6.14.0
import styled from 'styled-components'; // Styling the component with CSS-in-JS // v5.3.10
import { PlusIcon } from 'primereact/icons'; // Icon for the create new meeting button // v10.0.0

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout component that provides the dashboard structure with navigation
import MeetingList from '../../components/meetings/MeetingList'; // Component for displaying and filtering the list of meetings
import Button from '../../components/common/Button'; // Button component for creating new meetings
import useMeetings from '../../hooks/useMeetings'; // Hook for fetching and managing meetings data
import useOrganization from '../../hooks/useOrganization'; // Hook to access current organization context
import { MeetingFilters, MeetingStatus } from '../../types/meeting.types'; // Type definitions for meetings and filtering options
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation

// Styled components for the MeetingListPage
const PageContainer = styled.div`
  padding: 24px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

/**
 * Page component that displays a list of meetings with filtering and management capabilities
 * @returns Rendered meeting list page
 */
const MeetingListPage: React.FC = () => {
  // Initialize navigation with useNavigate hook
  const navigate = useNavigate();

  // Initialize URL search params with useSearchParams hook
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current organization from useOrganization hook
  const { currentOrganization } = useOrganization();

  // Initialize state for view mode (grid or list)
  const [viewMode] = useState<string>('GRID');

  // Initialize initial filters from URL search params
  const initialFilters: MeetingFilters = {
    organizationId: currentOrganization?.id || '',
    status: (searchParams.get('status') as MeetingStatus) || undefined,
    meetingType: searchParams.get('type') || undefined,
    participantId: searchParams.get('participantId') || undefined,
    search: searchParams.get('search') || undefined,
    startDateFrom: searchParams.get('startDateFrom') || undefined,
    startDateTo: searchParams.get('startDateTo') || undefined,
  };

  // Use useMeetings hook to fetch meetings data with filters
  const {
    meetings,
    isLoading,
    isError,
    filters,
    setFilters,
    updateMeetingStatus,
    deleteMeeting,
  } = useMeetings();

  /**
   * Define handleViewMeeting function to navigate to meeting detail page
   * @param meeting 
   */
  const handleViewMeeting = useCallback((meeting: Meeting) => {
    navigate(`${ROUTES.MEETINGS.ROOT}/${meeting.id}`);
  }, [navigate]);

  /**
   * Define handleJoinMeeting function to navigate to meeting moderator page
   * @param meeting 
   */
  const handleJoinMeeting = useCallback((meeting: Meeting) => {
    navigate(`${ROUTES.MEETINGS.ROOT}/${meeting.id}/moderator`);
  }, [navigate]);

  /**
   * Define handleCancelMeeting function to update meeting status to CANCELLED
   * @param meetingId 
   */
  const handleCancelMeeting = useCallback((meetingId: string) => {
    updateMeetingStatus({ id: meetingId, status: MeetingStatus.CANCELLED });
  }, [updateMeetingStatus]);

  /**
   * Define handleDeleteMeeting function to delete a meeting
   * @param meetingId 
   */
  const handleDeleteMeeting = useCallback((meetingId: string) => {
    deleteMeeting(meetingId);
  }, [deleteMeeting]);

  /**
   * Define handleFilterChange function to update filters and URL search params
   * @param newFilters 
   */
  const handleFilterChange = useCallback((newFilters: MeetingFilters) => {
    setFilters(newFilters);
    setSearchParams(newFilters); // Update URL search params
  }, [setFilters, setSearchParams]);

  /**
   * Define handleCreateMeeting function to navigate to new meeting page
   */
  const handleCreateMeeting = useCallback(() => {
    navigate(ROUTES.MEETINGS.NEW);
  }, [navigate]);

  // Update URL search params when filters change
  useEffect(() => {
    setSearchParams(filters);
  }, [filters, setSearchParams]);

  // Render DashboardLayout with page title and content
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader>
          <PageTitle>Meetings</PageTitle>
          <Button
            icon={<PlusIcon />}
            label="Create New"
            onClick={handleCreateMeeting}
          />
        </PageHeader>
        <MeetingList
          initialFilters={initialFilters}
          viewMode={viewMode}
          onViewMeeting={handleViewMeeting}
          onJoinMeeting={handleJoinMeeting}
          onCancelMeeting={handleCancelMeeting}
          onDeleteMeeting={handleDeleteMeeting}
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
          isError={isError}
          meetings={meetings}
        />
      </PageContainer>
    </DashboardLayout>
  );
};

export default MeetingListPage;