import React, { useState, useEffect, useCallback, useRef } from 'react'; // React v^18.2.0
import { useParams, useNavigate } from 'react-router-dom'; // react-router-dom v^6.8.0
import styled from 'styled-components'; // styled-components v^5.3.10
import { Toast } from 'primereact/toast'; // primereact/toast v^10.0.0
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; // primereact/confirmdialog v^10.0.0

import MeetingLayout from '../../layouts/MeetingLayout';
import MeetingStages from '../../components/meetings/MeetingStages';
import MeetingSummary from '../../components/meetings/MeetingSummary';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Card from '../../components/common/Card';
import useMeetings, { useActiveMeeting } from '../../hooks/useMeetings';
import { useMeetingRealtime, useMeetingStagesRealtime, useActionItemsRealtime } from '../../hooks/useRealtime';
import useAuth from '../../hooks/useAuth';
import useOrganization from '../../hooks/useOrganization';
import { MeetingStatus, MeetingType, MeetingStageType, ParticipantRole } from '../../types/meeting.types';
import { ROUTES } from '../../utils/constants/routes';

// Styled Components
const ModeratorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  height: 100%;
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
  width: 100%;
  color: var(--red-500);
  text-align: center;
`;

const StartMeetingCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--surface-card);
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const StartMeetingTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-color);
`;

const StartMeetingDescription = styled.p`
  margin-bottom: 2rem;
  color: var(--text-color-secondary);
`;

/**
 * Main component for the meeting moderator page that facilitates meeting flow
 */
const MeetingModeratorPage: React.FC = () => {
  // LD1: Get meetingId from URL parameters using useParams
  const { meetingId } = useParams<{ meetingId: string }>();

  // LD1: Get current user information from useAuth hook
  const { state: authState } = useAuth();
  const currentUser = authState.user;

  // LD1: Get current organization from useOrganization hook
  const { currentOrganization } = useOrganization();

  // LD1: Initialize navigate function from useNavigate
  const navigate = useNavigate();

  // LD1: Create toast reference for notifications
  const toast = useRef<Toast>(null);

  // LD1: Initialize state for loading status, error state, and meeting completion
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingComplete, setMeetingComplete] = useState(false);

  // F-001-RQ-001: System shall provide a guided meeting flow with prompts for Good News, priorities, metrics updates, and blockers
  // F-001-RQ-002: System shall support different meeting types (daily, weekly, quarterly) with appropriate templates
  // LD1: Fetch meeting data using getMeetingById from useMeetings
  const { getMeetingById, startMeeting, endMeeting, updateCurrentStage } = useMeetings();

  // LD1: Use the useActiveMeeting hook to manage the meeting state and actions
  const { meeting, stages, isLoading, isError, error: activeMeetingError } = useActiveMeeting(meetingId || '', currentOrganization?.id || '');

  // LD1: Determine if current user is a moderator by checking participant roles
  const isModerator = React.useMemo(() => {
    if (!currentUser || !meeting) return false;
    return meeting.participants?.some(p => p.userId === currentUser.id && p.role === ParticipantRole.MODERATOR);
  }, [currentUser, meeting]);

  // F-001-RQ-001: System shall provide a guided meeting flow with prompts for Good News, priorities, metrics updates, and blockers
  // LD1: Implement handleStartMeeting function to start the meeting
  const handleStartMeeting = useCallback(async () => {
    if (!meetingId) return;
    try {
      await startMeeting(meetingId);
      toast.current?.show({ severity: 'success', summary: 'Meeting Started', detail: 'The meeting has been started.' });
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: 'Error Starting Meeting', detail: err?.message || 'Failed to start the meeting.' });
    }
  }, [meetingId, startMeeting, toast]);

  // F-001-RQ-003: System shall allow creation and assignment of action items during meetings
  // LD1: Implement handleEndMeeting function to end the meeting
  const handleEndMeeting = useCallback(async () => {
    if (!meetingId) return;
    try {
      await endMeeting(meetingId);
      setMeetingComplete(true);
      toast.current?.show({ severity: 'success', summary: 'Meeting Ended', detail: 'The meeting has been ended.' });
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: 'Error Ending Meeting', detail: err?.message || 'Failed to end the meeting.' });
    }
  }, [meetingId, endMeeting, toast]);

  // F-001-RQ-001: System shall provide a guided meeting flow with prompts for Good News, priorities, metrics updates, and blockers
  // LD1: Implement handleStageChange function to navigate between meeting stages
  const handleStageChange = useCallback(async (stageType: MeetingStageType) => {
    if (!meetingId) return;
    try {
      await updateCurrentStage(meetingId, stageType);
      toast.current?.show({ severity: 'success', summary: 'Stage Changed', detail: `Moved to ${stageType} stage.` });
    } catch (err: any) {
      toast.current?.show({ severity: 'error', summary: 'Error Changing Stage', detail: err?.message || 'Failed to change stage.' });
    }
  }, [meetingId, updateCurrentStage, toast]);

  // LD1: Implement handleMeetingComplete function to finalize the meeting
  const handleMeetingComplete = useCallback(() => {
    setMeetingComplete(true);
  }, []);

  // LD1: Implement confirmEndMeeting function to show confirmation dialog
  const confirmEndMeeting = () => {
    confirmDialog({
      message: 'Are you sure you want to end this meeting?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleEndMeeting(),
    });
  };

  // LD1: Render loading spinner while data is being fetched
  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner size="xl" />
      </LoadingContainer>
    );
  }

  // LD1: Render error message if data fetching fails
  if (isError || activeMeetingError) {
    return (
      <ErrorContainer>
        <h1>Error</h1>
        <p>{error || activeMeetingError}</p>
      </ErrorContainer>
    );
  }

  // LD1: Render MeetingLayout with appropriate props
  return (
    <MeetingLayout organizationId={currentOrganization?.id || ''}>
      <Toast ref={toast} />
      <ConfirmDialog />
      <ModeratorContainer>
        {meeting?.status === MeetingStatus.SCHEDULED && (
          <StartMeetingCard>
            <StartMeetingTitle>Ready to start the meeting?</StartMeetingTitle>
            <StartMeetingDescription>Click the button below to begin the meeting flow.</StartMeetingDescription>
            <ActionContainer>
              <Button label="Start Meeting" onClick={handleStartMeeting} />
            </ActionContainer>
          </StartMeetingCard>
        )}
        {meeting?.status === MeetingStatus.IN_PROGRESS && (
          <MeetingStages
            meetingId={meetingId || ''}
            meetingType={meeting.meetingType}
            currentStage={meeting.currentStage}
            isModerator={isModerator}
            onStageChange={handleStageChange}
            onComplete={handleMeetingComplete}
          />
        )}
        {meetingComplete && (
          <MeetingSummary meetingId={meetingId} />
        )}
        {meeting?.status === MeetingStatus.IN_PROGRESS && isModerator && !meetingComplete && (
          <ActionContainer>
            <Button label="End Meeting" onClick={confirmEndMeeting} />
          </ActionContainer>
        )}
      </ModeratorContainer>
    </MeetingLayout>
  );
};

export default MeetingModeratorPage;