import React, { useState, useEffect, useMemo, useCallback } from 'react'; // React v18.2.0
import { useParams, useNavigate } from 'react-router-dom'; // react-router-dom v6.10.0
import styled from 'styled-components'; // styled-components v5.3.9
import { ConfirmDialog } from 'primereact/confirmdialog'; // primereact/confirmdialog v10.0.0
import { Toast } from 'primereact/toast'; // primereact/toast v10.0.0
import { TabView, TabPanel } from 'primereact/tabview'; // primereact/tabview v10.0.0
import { Calendar, Clock, Users, Video, Edit, Play, X, Check, Share } from 'react-feather'; // react-feather v2.0.10

import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import MeetingParticipants from '../../components/meetings/MeetingParticipants';
import ActionItemList from '../../components/meetings/ActionItemList';
import useMeetings from '../../hooks/useMeetings';
import useCalendarSync from '../../hooks/useCalendarSync';
import useAuth from '../../hooks/useAuth';
import useOrganization from '../../hooks/useOrganization';
import { Meeting, MeetingStatus, MeetingType, MeetingStageType, ParticipantRole } from '../../types/meeting.types';
import { CalendarProvider } from '../../types/calendar.types';
import { formatDate, formatTimeRange } from '../../utils/helpers/dateTimeHelper';
import { ROUTES } from '../../utils/constants/routes';

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MeetingTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const MeetingActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const MeetingInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
`;

const Description = styled.p`
  margin: 1rem 0;
  line-height: 1.5;
  color: var(--text-color-secondary);
`;

const TabContent = styled.div`
  padding: 1rem 0;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--red-500);
`;

// Helper function to render a badge with appropriate styling for a meeting status
const getMeetingStatusBadge = (status: MeetingStatus) => {
  let color = 'primary';
  switch (status) {
    case MeetingStatus.SCHEDULED:
      color = 'primary';
      break;
    case MeetingStatus.IN_PROGRESS:
      color = 'success';
      break;
    case MeetingStatus.COMPLETED:
      color = 'secondary';
      break;
    case MeetingStatus.CANCELLED:
      color = 'danger';
      break;
    default:
      color = 'primary';
  }
  return <Badge value={status} severity={color} />;
};

// Helper function to get a human-readable label for meeting type
const getMeetingTypeLabel = (type: MeetingType) => {
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

// Main component function that renders the meeting detail page
export const MeetingDetailPage: React.FC = () => {
  // Extract meetingId from route parameters using useParams
  const { id: meetingId } = useParams();
  // Initialize navigate function from useNavigate
  const navigate = useNavigate();

  // Get current user and organization from useAuth and useOrganization hooks
  const { state: authState } = useAuth();
  const { currentOrganization } = useOrganization();

  // Initialize state for loading, error, meeting data, active tab, and confirmation dialogs
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);

  // Use useMeetings hook to access meeting operations
  const { getMeetingById, updateMeetingStatus, startMeeting, endMeeting } = useMeetings();

  // Use useCalendarSync hook for calendar integration
  const { syncMeetingWithCalendar } = useCalendarSync();

  // Create a toast reference
  const toast = useRef<Toast>(null);

  // Function to show a toast notification
  const showToast = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) => {
    toast.current?.show({ severity: severity, summary: summary, detail: detail, life: 3000 });
  };

  // Determine if current user is a moderator based on participant roles
  const isModerator = useMemo(() => {
    return meeting?.participants?.some(p => p.userId === authState.user?.id && p.role === ParticipantRole.MODERATOR);
  }, [meeting, authState.user]);

  // Implement handleEditMeeting to navigate to edit page
  const handleEditMeeting = useCallback(() => {
    navigate(`${ROUTES.MEETINGS.ROOT}/${meetingId}/edit`);
  }, [navigate, meetingId]);

  // Implement handleStartMeeting to start the meeting and navigate to moderator page
  const handleStartMeeting = useCallback(async () => {
    try {
      await startMeeting.mutateAsync(meetingId);
      navigate(ROUTES.MEETINGS.MEETING_MODERATOR.replace(':id', meetingId));
      showToast('success', 'Meeting Started', 'The meeting has been started successfully.');
    } catch (err: any) {
      showToast('error', 'Error Starting Meeting', err?.message || 'Failed to start the meeting.');
    }
  }, [startMeeting, navigate, meetingId, showToast]);

  // Implement handleJoinMeeting to navigate to moderator page for an in-progress meeting
  const handleJoinMeeting = useCallback(() => {
    navigate(ROUTES.MEETINGS.MEETING_MODERATOR.replace(':id', meetingId));
  }, [navigate, meetingId]);

  // Implement handleCancelMeeting to cancel the meeting after confirmation
  const handleCancelMeeting = useCallback(async () => {
    try {
      await updateMeetingStatus.mutateAsync({ id: meetingId, status: MeetingStatus.CANCELLED });
      setCancelDialogVisible(false);
      showToast('success', 'Meeting Cancelled', 'The meeting has been cancelled successfully.');
      navigate(ROUTES.MEETINGS.LIST);
    } catch (err: any) {
      showToast('error', 'Error Cancelling Meeting', err?.message || 'Failed to cancel the meeting.');
    }
  }, [updateMeetingStatus, meetingId, navigate, showToast]);

  // Implement handleSyncCalendar to sync the meeting with Google or Microsoft calendar
  const handleSyncCalendar = useCallback(async (provider?: CalendarProvider) => {
    try {
      await syncMeetingWithCalendar(meetingId, provider);
      showToast('success', 'Calendar Synced', 'The meeting has been synced with your calendar.');
    } catch (err: any) {
      showToast('error', 'Error Syncing Calendar', err?.message || 'Failed to sync the meeting with your calendar.');
    }
  }, [syncMeetingWithCalendar, meetingId, showToast]);

  // Implement handleActionItemCreated, handleActionItemUpdated, and handleActionItemDeleted callbacks
  const handleActionItemCreated = useCallback(() => {
    // TODO: Implement action item created callback
  }, []);

  const handleActionItemUpdated = useCallback(() => {
    // TODO: Implement action item updated callback
  }, []);

  const handleActionItemDeleted = useCallback(() => {
    // TODO: Implement action item deleted callback
  }, []);

  // Implement handleParticipantUpdated callback
  const handleParticipantUpdated = useCallback(() => {
    // TODO: Implement participant updated callback
  }, []);

  // Fetch meeting details when component mounts or meetingId changes
  useEffect(() => {
    if (meetingId) {
      setLoading(true);
      setError(null);
      getMeetingById(meetingId)
        .then(response => {
          setMeeting(response.data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Failed to load meeting details.');
          setLoading(false);
        });
    }
  }, [meetingId, getMeetingById]);

  // Render loading spinner while fetching meeting data
  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Spinner />
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Render error message if meeting data fetch fails
  if (error) {
    return (
      <DashboardLayout>
        <PageContainer>
          <ErrorContainer>
            <h2>Error</h2>
            <p>{error}</p>
          </ErrorContainer>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Render meeting details with header, status, type, date/time, location
  return (
    <DashboardLayout>
      <PageContainer>
        <Toast ref={toast} />
        <ConfirmDialog visible={cancelDialogVisible} onHide={() => setCancelDialogVisible(false)}
          message="Are you sure you want to cancel this meeting?"
          header="Cancel Meeting" icon="pi pi-exclamation-triangle"
          accept={() => handleCancelMeeting()} reject={() => setCancelDialogVisible(false)} />
        {meeting && (
          <>
            <HeaderContainer>
              <MeetingTitle>
                <Clock size={24} />
                {meeting.title}
              </MeetingTitle>
              <MeetingActions>
                {meeting.status === MeetingStatus.SCHEDULED && isModerator && (
                  <>
                    <Button icon={<Edit size={16} />} label="Edit" onClick={handleEditMeeting} />
                    <Button icon={<Play size={16} />} label="Start" onClick={handleStartMeeting} />
                    <Button icon={<X size={16} />} label="Cancel" severity="danger" onClick={() => setCancelDialogVisible(true)} />
                  </>
                )}
                {meeting.status === MeetingStatus.IN_PROGRESS && isModerator && (
                  <Button icon={<Check size={16} />} label="End" onClick={() => endMeeting.mutate(meetingId)} />
                )}
                {meeting.status === MeetingStatus.SCHEDULED && !isModerator && (
                  <Button icon={<Video size={16} />} label="Join" onClick={handleJoinMeeting} />
                )}
                <Button icon={<Share size={16} />} label="Sync Calendar" onClick={() => handleSyncCalendar()} />
              </MeetingActions>
            </HeaderContainer>
            <MeetingInfo>
              <InfoItem>
                Status: {getMeetingStatusBadge(meeting.status)}
              </InfoItem>
              <InfoItem>
                Type: {getMeetingTypeLabel(meeting.meetingType)}
              </InfoItem>
              <InfoItem>
                <Calendar size={16} />
                {formatDate(meeting.startTime, 'MM/dd/yyyy')}
              </InfoItem>
              <InfoItem>
                <Clock size={16} />
                {formatTimeRange(meeting.startTime, meeting.endTime)}
              </InfoItem>
              {meeting.location && (
                <InfoItem>
                  <Users size={16} />
                  {meeting.location}
                </InfoItem>
              )}
            </MeetingInfo>
            <Description>{meeting.description}</Description>
            <Card>
              <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                <TabPanel header="Details">
                  <TabContent>
                    {/* TODO: Implement meeting details section */}
                    Meeting details content here.
                  </TabContent>
                </TabPanel>
                <TabPanel header="Participants">
                  <TabContent>
                    <MeetingParticipants
                      meetingId={meetingId}
                      organizationId={currentOrganization?.id || ''}
                      participants={[]} // Replace with actual participants
                      isModerator={isModerator}
                      onParticipantUpdate={handleParticipantUpdated}
                    />
                  </TabContent>
                </TabPanel>
                <TabPanel header="Action Items">
                  <TabContent>
                    <ActionItemList
                      meetingId={meetingId}
                      onActionItemCreated={handleActionItemCreated}
                      onActionItemUpdated={handleActionItemUpdated}
                      onActionItemDeleted={handleActionItemDeleted}
                    />
                  </TabContent>
                </TabPanel>
              </TabView>
            </Card>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
};