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

interface MeetingStageBlockersProps {
  meetingId: string;
  stageId: string;
  isActive: boolean;
  isCompleted: boolean;
  isModerator: boolean;
  onComplete: () => void;
  className?: string;
  style?: React.CSSProperties;
}

interface BlockerEntry {
  userId: string;
  userName: string;
  userAvatar: string;
  description: string;
  potentialSolutions: string;
  isResolved: boolean;
  timestamp: string;
}

const StageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  margin: 0 0 0.5rem 0;
  white-space: pre-wrap;
`;

const EntrySolutions = styled.p`
  margin: 0;
  font-style: italic;
  color: var(--text-color-secondary);
  white-space: pre-wrap;
`;

const EntryStatus = styled.span`
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: var(--green-100);
  color: var(--green-700);

  &.unresolved {
    background-color: var(--yellow-100);
    color: var(--yellow-700);
  }
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

const MeetingStageBlockers: React.FC<MeetingStageBlockersProps> = ({
  meetingId,
  stageId,
  isActive,
  isCompleted,
  isModerator,
  onComplete,
  className,
  style,
}) => {
  // LD1: Get current user information using useAuth hook
  const { state: { user } } = useAuth();

  // LD1: Use useMeetingStagesRealtime hook to get and update the stage content
  const { stages, updateStage } = useMeetingStagesRealtime(meetingId);

  // LD1: Use usePresenceTracking hook to track participant presence and typing status
  const { setTypingStatus } = usePresenceTracking(meetingId, user?.id || '');

  // LD1: Find the current stage
  const currentStage = stages?.find(stage => stage.stageType === MeetingStageType.BLOCKERS && stage.id === stageId);

  // LD1: Parse existing blocker entries from stage content or initialize empty array
  const [blockerEntries, setBlockerEntries] = useState<BlockerEntry[]>(() => {
    try {
      return currentStage?.content ? JSON.parse(currentStage.content) : [];
    } catch (error) {
      console.error('Error parsing blocker entries:', error);
      return [];
    }
  });

  // LD1: Set up state for new blocker entry text
  const [newBlockerText, setNewBlockerText] = useState('');

  // LD1: Handle text input changes and update typing status
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewBlockerText(e.target.value);
    setTypingStatus(e.target.value.length > 0);
  }, [setNewBlockerText, setTypingStatus]);

  // LD1: Handle submission of new blocker entry
  const handleSubmit = useCallback(() => {
    if (!newBlockerText.trim()) return;

    // LD1: Create new blocker entry
    const newEntry: BlockerEntry = {
      userId: user?.id || 'unknown',
      userName: user?.name || 'Unknown User',
      userAvatar: user?.photoURL || '',
      description: newBlockerText,
      potentialSolutions: '',
      isResolved: false,
      timestamp: new Date().toISOString(),
    };

    // LD1: Update blocker entries state
    const updatedEntries = [...blockerEntries, newEntry];
    setBlockerEntries(updatedEntries);

    // LD1: Update stage content with new blocker entries
    updateStage(stageId, JSON.stringify(updatedEntries))
      .then(() => {
        setNewBlockerText('');
        setTypingStatus(false);
      })
      .catch(error => {
        console.error('Error updating stage content:', error);
      });
  }, [newBlockerText, blockerEntries, user, updateStage, stageId, setTypingStatus]);

  // LD1: Update blockerEntries when currentStage.content changes
  useEffect(() => {
    try {
      if (currentStage?.content) {
        setBlockerEntries(JSON.parse(currentStage.content));
      } else {
        setBlockerEntries([]);
      }
    } catch (error) {
      console.error('Error parsing blocker entries:', error);
    }
  }, [currentStage?.content]);

  return (
    <Card title={MEETING_STAGES.BLOCKERS.title} className={className} style={style}>
      <StageContainer>
        <PromptText>{MEETING_STAGES.BLOCKERS.prompt}</PromptText>

        <EntriesContainer>
          {blockerEntries.map((entry, index) => (
            <EntryContainer key={index}>
              <Avatar image={entry.userAvatar} size="small" shape="circle" />
              <EntryContent>
                <EntryHeader>
                  <EntryUserInfo>
                    <EntryUserName>{entry.userName}</EntryUserName>
                    <EntryStatus className={entry.isResolved ? '' : 'unresolved'}>
                      {entry.isResolved ? 'Resolved' : 'Unresolved'}
                    </EntryStatus>
                  </EntryUserInfo>
                  <EntryTimestamp>{new Date(entry.timestamp).toLocaleString()}</EntryTimestamp>
                </EntryHeader>
                <EntryDescription>{entry.description}</EntryDescription>
                <EntrySolutions>{entry.potentialSolutions}</EntrySolutions>
              </EntryContent>
            </EntryContainer>
          ))}
        </EntriesContainer>

        {isActive && (
          <InputContainer>
            <TextArea
              placeholder="Describe the blocker..."
              rows={3}
              value={newBlockerText}
              onChange={handleInputChange}
            />
            <ButtonContainer>
              <div></div>
              <Button label="Add Blocker" onClick={handleSubmit} />
            </ButtonContainer>
          </InputContainer>
        )}
      </StageContainer>
    </Card>
  );
};

export default MeetingStageBlockers;