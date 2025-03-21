import React, { useState, useEffect, useCallback, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { useNavigate } from 'react-router-dom'; // version ^6.8.0
import { CalendarIcon, FilterIcon, GridIcon, ListIcon, SearchIcon } from 'primereact/icons/calendar'; // version ^10.0.0

import MeetingCard from './MeetingCard';
import Pagination from '../common/Pagination';
import Select from '../common/Select';
import Input from '../common/Input';
import DatePicker from '../common/DatePicker';
import Spinner from '../common/Spinner';
import {
  Meeting,
  MeetingType,
  MeetingStatus,
  MeetingFilters,
  MeetingSort
} from '../../types/meeting.types';
import useMeetings from '../../hooks/useMeetings';
import { formatDate } from '../../utils/helpers/dateTimeHelper';
import useResponsive from '../../hooks/useResponsive';

interface MeetingListProps {
  initialFilters?: MeetingFilters;
  viewMode?: string;
  onViewMeeting?: (meeting: Meeting) => void;
  onJoinMeeting?: (meeting: Meeting) => void;
  onCancelMeeting?: (meeting: Meeting) => void;
  onDeleteMeeting?: (meeting: Meeting) => void;
  onFilterChange?: (filters: MeetingFilters) => void;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface ViewMode {
  GRID: string;
  LIST: string;
}

const MeetingListContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
  padding: 16px;
`;

const ListControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  width: 300px;
  position: relative;
`;

const ControlsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterPanel = styled.div<{ visible: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: ${props => (props.visible ? 'auto' : '0')};
  opacity: ${props => (props.visible ? '1' : '0')};
  transition: height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 4px;
`;

const MeetingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const MeetingListView = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  min-height: 200px;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  color: #888;
`;

const EmptyStateText = styled.p`
  font-size: 1rem;
  font-weight: 500;
  color: #888;
  margin-bottom: 16px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 32px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 8px;
  border: 1px solid #d32f2f;
`;

/**
 * Component that displays a paginated, filterable list of meetings
 * @param props 
 * @returns Rendered meeting list component
 */
const MeetingList: React.FC<MeetingListProps> = ({
  initialFilters = {},
  viewMode: initialViewMode = 'GRID',
  onViewMeeting,
  onJoinMeeting,
  onCancelMeeting,
  onDeleteMeeting,
  onFilterChange,
  compact = false,
  className,
  style,
}) => {
  // Initialize navigation with useNavigate hook
  const navigate = useNavigate();

  // Get responsive breakpoints with useResponsive hook
  const { isMobile } = useResponsive();

  // Use useMeetings hook to fetch meetings data with pagination and filtering
  const {
    meetings,
    isLoading,
    isError,
    error,
    totalItems,
    page,
    pageSize,
    filters,
    sort,
    setPage,
    setPageSize,
    setFilters,
    setSort,
    updateMeetingStatus,
    deleteMeeting,
  } = useMeetings();

  // Initialize state for view mode (grid or list)
  const [viewMode, setViewMode] = useState<string>(initialViewMode);

  // Initialize state for filter panel visibility
  const [filterPanelVisible, setFilterPanelVisible] = useState<boolean>(false);

  /**
   * Define handleViewMeeting function to navigate to meeting detail page
   * @param meeting 
   */
  const handleViewMeeting = (meeting: Meeting) => {
    navigate(`/meetings/${meeting.id}`);
    onViewMeeting?.(meeting);
  };

  /**
   * Define handleJoinMeeting function to navigate to meeting moderator page
   * @param meeting 
   */
  const handleJoinMeeting = (meeting: Meeting) => {
    navigate(`/meetings/${meeting.id}/moderator`);
    onJoinMeeting?.(meeting);
  };

  /**
   * Define handleCancelMeeting function to update meeting status to CANCELLED
   * @param meetingId 
   */
  const handleCancelMeeting = (meetingId: string) => {
    updateMeetingStatus({ id: meetingId, status: MeetingStatus.CANCELLED });
    onCancelMeeting?.(meetings.find(m => m.id === meetingId) || null);
  };

  /**
   * Define handleDeleteMeeting function to delete a meeting
   * @param meetingId 
   */
  const handleDeleteMeeting = (meetingId: string) => {
    deleteMeeting(meetingId);
    onDeleteMeeting?.(meetings.find(m => m.id === meetingId) || null);
  };

  /**
   * Define handleFilterChange function to update filters
   * @param newFilters 
   */
  const handleFilterChange = (newFilters: MeetingFilters) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  /**
   * Define handleSortChange function to update sort order
   * @param newSort 
   */
  const handleSortChange = (newSort: MeetingSort) => {
    setSort(newSort);
  };

  /**
   * Define handleViewModeToggle function to switch between grid and list views
   */
  const handleViewModeToggle = () => {
    setViewMode(viewMode === 'GRID' ? 'LIST' : 'GRID');
  };

  /**
   * Define handleFilterToggle function to show/hide filter panel
   */
  const handleFilterToggle = () => {
    setFilterPanelVisible(!filterPanelVisible);
  };

  /**
   * Define handleDateRangeChange function to update date filters
   * @param dateRange 
   */
  const handleDateRangeChange = (dateRange: { startDate: string; endDate: string }) => {
    setFilters({ ...filters, startDateFrom: dateRange.startDate, startDateTo: dateRange.endDate });
  };

  /**
   * Define handleSearchChange function to update search filter
   * @param event 
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: event.target.value });
  };

  /**
   * Define handleClearFilters function to reset all filters
   */
  const handleClearFilters = () => {
    setFilters({ organizationId: filters.organizationId });
  };

  // Define available meeting type options
  const meetingTypeOptions = useMemo(() => {
    return Object.values(MeetingType).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
    }));
  }, []);

  // Define available meeting status options
  const meetingStatusOptions = useMemo(() => {
    return Object.values(MeetingStatus).map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    }));
  }, []);

  // Define available sort options
  const sortOptions = useMemo(() => {
    return Object.values(MeetingSort).map(sort => ({
      value: sort,
      label: sort.replace(/_/g, ' ').toLowerCase(),
    }));
  }, []);

  return (
    <MeetingListContainer className={className} style={style}>
      <ListControls>
        <SearchContainer>
          <Input
            placeholder="Search meetings..."
            onChange={handleSearchChange}
          />
          <SearchIcon style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
        </SearchContainer>
        <ControlsGroup>
          <Button
            icon={<FilterIcon />}
            label={isMobile ? '' : 'Filter'}
            onClick={handleFilterToggle}
            outlined
          />
          <Button
            icon={viewMode === 'GRID' ? <ListIcon /> : <GridIcon />}
            label={isMobile ? '' : viewMode === 'GRID' ? 'List' : 'Grid'}
            onClick={handleViewModeToggle}
            outlined
          />
          <Select
            options={sortOptions}
            value={sort}
            onChange={handleSortChange}
            placeholder="Sort by"
          />
        </ControlsGroup>
      </ListControls>

      <FilterPanel visible={filterPanelVisible}>
        <FilterGroup>
          <FilterLabel>Type:</FilterLabel>
          <Select
            options={meetingTypeOptions}
            value={filters.meetingType || ''}
            onChange={(value) => handleFilterChange({ ...filters, meetingType: value as MeetingType })}
            placeholder="All Types"
          />
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>Status:</FilterLabel>
          <Select
            options={meetingStatusOptions}
            value={filters.status || ''}
            onChange={(value) => handleFilterChange({ ...filters, status: value as MeetingStatus })}
            placeholder="All Statuses"
          />
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>Date Range:</FilterLabel>
          <DatePicker
            placeholder="Select Date Range"
            value={filters.startDateFrom && filters.startDateTo ? { startDate: filters.startDateFrom, endDate: filters.startDateTo } : null}
            onChange={(value) => {
              if (value && Array.isArray(value)) {
                handleDateRangeChange({
                  startDate: formatDate(value[0], 'yyyy-MM-dd'),
                  endDate: formatDate(value[1], 'yyyy-MM-dd'),
                });
              }
            }}
          />
        </FilterGroup>
        <Button label="Clear Filters" onClick={handleClearFilters} outlined />
      </FilterPanel>

      {isLoading && (
        <LoadingContainer>
          <Spinner />
        </LoadingContainer>
      )}

      {isError && (
        <ErrorContainer>
          <EmptyStateIcon>Error</EmptyStateIcon>
          <EmptyStateText>Error fetching meetings: {error.message}</EmptyStateText>
        </ErrorContainer>
      )}

      {!isLoading && !isError && meetings && meetings.length === 0 && (
        <EmptyState>
          <EmptyStateIcon>No Meetings</EmptyStateIcon>
          <EmptyStateText>No meetings found.</EmptyStateText>
        </EmptyState>
      )}

      {!isLoading && !isError && meetings && meetings.length > 0 && (
        <>
          {viewMode === 'GRID' ? (
            <MeetingGrid>
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onView={handleViewMeeting}
                  onJoin={handleJoinMeeting}
                  onCancel={() => handleCancelMeeting(meeting.id)}
                  onDelete={() => handleDeleteMeeting(meeting.id)}
                  compact={compact}
                />
              ))}
            </MeetingGrid>
          ) : (
            <MeetingListView>
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onView={handleViewMeeting}
                  onJoin={handleJoinMeeting}
                  onCancel={() => handleCancelMeeting(meeting.id)}
                  onDelete={() => handleDeleteMeeting(meeting.id)}
                  compact={compact}
                />
              ))}
            </MeetingListView>
          )}
          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalRecords={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </MeetingListContainer>
  );
};

export default MeetingList;