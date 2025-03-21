import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { Avatar } from 'primereact/avatar'; // version ^10.0.0
import { ScrollPanel } from 'primereact/scrollpanel'; // version ^10.0.0

import Card from '../common/Card';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import { MeetingStageType } from '../../types/meeting.types';
import { MEETING_STAGES } from '../../utils/constants/meetingStages';
import useAuth from '../../hooks/useAuth';
import { useMeetingStagesRealtime, usePresenceTracking } from '../../hooks/useRealtime';

interface MeetingStagePrioritiesProps {
  meetingId: string;
  stageId: string;
  isActive: boolean;
  isCompleted: boolean;
  isModerator: boolean;
  onComplete: () => void;
  className?: string;
  style?: React.CSSProperties;
}

interface PriorityEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null | undefined;
  description: string;
  timestamp: string;
}

const StageContainer = styled.div<{ isActive: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  transition: opacity 0.3s ease-in-out;
  opacity: ${props => (props.isActive ? 1 : 0.7)};
`;

const PromptText = styled.p`
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
`;

const EntriesContainer = styled(ScrollPanel)`
  width: 100%;
  height: 300px;
  margin-bottom: 1rem;
`;

const EntryContainer = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: var(--surface-card);
  border-radius: 4px;
  box-shadow: var(--card-shadow);
`;

const EntryContent = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
  flex: 1;
`;

const EntryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const EntryUserInfo = styled.div`
  display: flex;
  align-items: center;
`;

const EntryUserName = styled.span`
  font-weight: 600;
  margin-right: 0.5rem;
`;

const EntryTimestamp = styled.span`
  font-size: 0.8rem;
  color: var(--text-color-secondary);
`;

const EntryDescription = styled.p`
  margin: 0;
  white-space: pre-wrap;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TypingIndicator = styled.div`
  font-size: 0.8rem;
  font-style: italic;
  color: var(--primary-color);
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
`;

/**
 * Component that implements the Priorities stage of a meeting
 */
const MeetingStagePriorities: React.FC<MeetingStagePrioritiesProps> = ({
  meetingId,
  stageId,
  isActive,
  isCompleted,
  isModerator,
  onComplete,
  className,
  style,
}) => {
  // Get current user information using useAuth hook
  const { state: { user } } = useAuth();

  // Use useMeetingStagesRealtime hook to get and update the stage content
  const { stages, updateStage } = useMeetingStagesRealtime(meetingId);

  // Use usePresenceTracking hook to track participant presence and typing status
  const { participants, setTypingStatus } = usePresenceTracking(meetingId, user?.id || '');

  // Find the current stage
  const currentStage = stages?.find(stage => stage.id === stageId);

  // Parse existing priority entries from stage content or initialize empty array
  const [priorityEntries, setPriorityEntries] = useState<PriorityEntry[]>(() => {
    try {
      return currentStage?.content ? JSON.parse(currentStage.content) : [];
    } catch (error) {
      console.error('Error parsing priority entries:', error);
      return [];
    }
  });

  // Set up state for new priority entry text
  const [newPriority, setNewPriority] = useState('');

  // Handle text input changes and update typing status
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPriority(e.target.value);
    setTypingStatus(e.target.value.length > 0);
  }, [setTypingStatus]);

  // Handle submission of new priority entry
  const handleSubmit = useCallback(async () => {
    if (!newPriority.trim() || !user) return;

    const newEntry: PriorityEntry = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.photoURL,
      description: newPriority,
      timestamp: new Date().toLocaleString(),
    };

    const updatedEntries = [...priorityEntries, newEntry];
    setPriorityEntries(updatedEntries);
    setNewPriority('');
    setTypingStatus(false);

    try {
      await updateStage(stageId, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error updating stage content:', error);
    }
  }, [newPriority, priorityEntries, stageId, updateStage, user]);

  // Update priority entries when stage content changes
  useEffect(() => {
    try {
      setPriorityEntries(currentStage?.content ? JSON.parse(currentStage.content) : []);
    } catch (error) {
      console.error('Error parsing priority entries:', error);
    }
  }, [currentStage?.content]);

  return (
    <StageContainer isActive={isActive} className={className} style={style}>
      <Card title={MEETING_STAGES.PRIORITIES.title}>
        <PromptText>{MEETING_STAGES.PRIORITIES.prompt}</PromptText>

        <EntriesContainer>
          {priorityEntries.map((entry) => (
            <EntryContainer key={entry.id}>
              <Avatar image={entry.userAvatar || undefined} size="small" shape="circle" />
              <EntryContent>
                <EntryHeader>
                  <EntryUserInfo>
                    <EntryUserName>{entry.userName}</EntryUserName>
                    <EntryTimestamp>{entry.timestamp}</EntryTimestamp>
                  </EntryUserInfo>
                </EntryHeader>
                <EntryDescription>{entry.description}</EntryDescription>
              </EntryContent>
            </EntryContainer>
          ))}
        </EntriesContainer>

        {isActive && (
          <InputContainer>
            <TextArea
              rows={3}
              placeholder="Enter your priority..."
              value={newPriority}
              onChange={handleInputChange}
            />
            <ButtonContainer>
              <TypingIndicator>
                {participants
                  .filter((p) => p.isTyping)
                  .map((p) => p.userId)
                  .join(', ')}
                {participants.filter((p) => p.isTyping).length > 0 ? ' is typing...' : ''}
              </TypingIndicator>
              <Button label="Add Priority" onClick={handleSubmit} />
            </ButtonContainer>
          </InputContainer>
        )}
      </Card>
    </StageContainer>
  );
};

export default MeetingStagePriorities;