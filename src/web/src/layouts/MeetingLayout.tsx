import React, { useState, useEffect } from 'react'; // React v^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { useParams, useNavigate } from 'react-router-dom'; // version ^6.10.0

// Internal imports for layout and meeting components
import MainLayout from '../components/layout/MainLayout';
import MeetingProgress from '../components/meetings/MeetingProgress';
import MeetingParticipants from '../components/meetings/MeetingParticipants';

// Internal imports for hooks and types
import useMeetings from '../hooks/useMeetings';
import { useMeetingRealtime, usePresenceTracking } from '../hooks/useRealtime';
import useAuth from '../hooks/useAuth';
import { MeetingType, MeetingStageType, ParticipantRole } from '../types/meeting.types';
import { ROUTES } from '../utils/constants/routes';

// Define the props for the MeetingLayout component
interface MeetingLayoutProps {
  children: React.ReactNode;
  organizationId: string;
}

// Styled components for layout and visual elements
const MeetingContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const MeetingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
`;

const MeetingTitle = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-color);
`;

const MeetingStatus = styled.div<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${props => props.status === 'IN_PROGRESS' ? 'var(--green-100)' : props.status === 'SCHEDULED' ? 'var(--blue-100)' : 'var(--surface-200)'};
  color: ${props => props.status === 'IN_PROGRESS' ? 'var(--green-700)' : props.status === 'SCHEDULED' ? 'var(--blue-700)' : 'var(--text-color-secondary)'};
`;

const ContentLayout = styled.div`
  display: flex;
  flex: 1;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MainContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const SidePanel = styled.div`
  width: 300px;
  background-color: var(--surface-card);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ProgressContainer = styled.div`
  margin-bottom: 1.5rem;
`;

/**
 * Layout component for meeting-related pages with real-time collaboration features
 * @param props - Props including children and organizationId
 * @returns Rendered layout component
 */
const MeetingLayout: React.FC<MeetingLayoutProps> = ({ children, organizationId }) => {
  // Extract meetingId from URL parameters using useParams hook from react-router-dom@6.10.0
  const { meetingId } = useParams<{ meetingId: string }>();

  // Get current user from useAuth hook
  const { state: authState } = useAuth();
  const currentUser = authState.user;

  // Initialize navigate function from useNavigate hook
  const navigate = useNavigate();

  // Fetch meeting data using getMeetingById from useMeetings hook
  const { 
    getMeetingById,
    updateCurrentStage
  } = useMeetings();

  // Set up real-time meeting updates using useMeetingRealtime hook
  const { meeting } = useMeetingRealtime(meetingId || '', organizationId);

  // Set up real-time participant tracking using usePresenceTracking hook
  const { participants } = usePresenceTracking(meetingId || '', currentUser?.id || '');

  // Determine if current user is a moderator by checking participant roles
  const isModerator = React.useMemo(() => {
    if (!currentUser || !meeting || !participants) return false;
    const participant = participants.find(p => p.userId === currentUser.id);
    return participant?.role === ParticipantRole.MODERATOR;
  }, [currentUser, meeting, participants]);

  // Handle stage change by calling updateCurrentStage
  const handleStageChange = (stageType: MeetingStageType) => {
    if (meetingId) {
      updateCurrentStage({ id: meetingId, stageType });
    }
  };

  // Fetch meeting details when meetingId changes
  useEffect(() => {
    if (meetingId) {
      getMeetingById(meetingId);
    }
  }, [meetingId, getMeetingById]);

  // Navigate to meetings list if meeting is not found
  useEffect(() => {
    if (!meeting && meetingId) {
      navigate(ROUTES.MEETINGS.LIST);
    }
  }, [meeting, meetingId, navigate]);

  // Render MainLayout with meeting-specific components
  return (
    <MainLayout>
      {meeting && (
        <MeetingContainer>
          <MeetingHeader>
            <MeetingTitle>{meeting.title}</MeetingTitle>
            <MeetingStatus status={meeting.status}>{meeting.status}</MeetingStatus>
          </MeetingHeader>
          <ContentLayout>
            <MainContent>
              {meeting.status === 'IN_PROGRESS' && (
                <ProgressContainer>
                  <MeetingProgress
                    meetingType={meeting.meetingType}
                    currentStage={meeting.currentStage}
                    stages={[]} // TODO: Replace with actual stages data
                    onStageChange={handleStageChange}
                    isModerator={isModerator}
                  />
                </ProgressContainer>
              )}
              {children}
            </MainContent>
            <SidePanel>
              <MeetingParticipants
                participants={[]} // TODO: Replace with actual participants data
                meetingId={meetingId || ''}
                organizationId={organizationId}
                isModerator={isModerator}
                onParticipantUpdate={() => {}} // TODO: Implement participant update handler
              />
            </SidePanel>
          </ContentLayout>
        </MeetingContainer>
      )}
    </MainLayout>
  );
};

export default MeetingLayout;