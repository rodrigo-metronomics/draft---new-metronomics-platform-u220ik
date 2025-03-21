import React, { useState, useEffect, useCallback } from 'react'; // React ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.10

import Card from '../common/Card';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import { MeetingStageType } from '../../types/meeting.types';
import { MEETING_STAGES } from '../../utils/constants/meetingStages';
import useAuth from '../../hooks/useAuth';
import { useMeetingStagesRealtime, usePresenceTracking } from '../../hooks/useRealtime';

/**
 * Interface defining the props for the MeetingStageGoodNews component.
 */
interface MeetingStageGoodNewsProps {
  meetingId: string;
  stageId: string;
  isActive: boolean;
  isCompleted: boolean;
  onComplete: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Interface defining the structure of a Good News entry.
 */
interface GoodNewsEntry {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

/**
 * Styled component for the main stage container.
 */
const StageContainer = styled.div<{ isActive: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  transition: opacity 0.3s ease-in-out;
  opacity: ${props => (props.isActive ? 1 : 0.7)};
`;

/**
 * Styled component for the container of Good News entries.
 */
const GoodNewsEntries = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
`;

/**
 * Styled component for individual Good News entries.
 */
const GoodNewsEntry = styled.div`
  padding: 0.75rem;
  background-color: var(--surface-card);
  border-radius: 0.5rem;
  border-left: 3px solid var(--primary-color);
`;

/**
 * Styled component for the header of a Good News entry.
 */
const EntryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

/**
 * Styled component for the user name in a Good News entry.
 */
const UserName = styled.span`
  font-weight: 600;
  color: var(--text-color);
`;

/**
 * Styled component for the content of a Good News entry.
 */
const EntryContent = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

/**
 * Styled component for the input container.
 */
const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/**
 * Styled component for the button container.
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

/**
 * Styled component for the typing indicator.
 */
const TypingIndicator = styled.div`
  font-style: italic;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

/**
 * Component for the Good News stage of a meeting.
 * Allows participants to share positive updates or achievements since the last meeting.
 */
const MeetingStageGoodNews: React.FC<MeetingStageGoodNewsProps> = ({
  meetingId,
  stageId,
  isActive,
  isCompleted,
  onComplete,
  className,
  style,
}) => {
  // Get current user information using useAuth hook
  const { state: { user } } = useAuth();

  // Initialize state for the current user's good news input
  const [goodNewsInput, setGoodNewsInput] = useState('');

  // Initialize state for tracking if the user is currently typing
  const [isTyping, setIsTyping] = useState(false);

  // Use useMeetingStagesRealtime hook to get and update stage content in real-time
  const { stages, updateStage } = useMeetingStagesRealtime(meetingId);

  // Use usePresenceTracking hook to track participant presence and typing status
  const { setTypingStatus } = usePresenceTracking(meetingId, user?.id || '');

  // Get the current stage from the stages array
  const currentStage = stages?.find(stage => stage.id === stageId);

  // Parse existing good news entries from stage content
  const goodNewsEntries: GoodNewsEntry[] = currentStage?.content
    ? JSON.parse(currentStage.content)
    : [];

  /**
   * Handles input change for the good news textarea.
   * @param e - The change event.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGoodNewsInput(e.target.value);
  };

  /**
   * Handles submission of a new good news entry.
   */
  const handleSubmit = useCallback(async () => {
    if (!goodNewsInput.trim()) return;

    // Create a new good news entry
    const newEntry: GoodNewsEntry = {
      id: Date.now().toString(),
      userId: user?.id || 'unknown',
      userName: user?.name || 'Anonymous',
      content: goodNewsInput.trim(),
      timestamp: new Date().toISOString(),
    };

    // Update the stage content with the new entry
    const updatedEntries = [...goodNewsEntries, newEntry];
    await updateStage(stageId, JSON.stringify(updatedEntries));

    // Clear the input
    setGoodNewsInput('');
  }, [goodNewsInput, goodNewsEntries, updateStage, stageId, user]);

  /**
   * Updates typing status when user starts/stops typing.
   * @param typing - Whether the user is typing.
   */
  const handleTyping = useCallback(async (typing: boolean) => {
    setIsTyping(typing);
    await setTypingStatus(typing);
  }, [setTypingStatus]);

  // Render typing indicators for participants who are currently typing
  const typingUsers = []; // TODO: Implement presence tracking

  return (
    <StageContainer isActive={isActive} className={className} style={style}>
      <Card title={MEETING_STAGES[MeetingStageType.GOOD_NEWS].title}>
        <GoodNewsEntries>
          {goodNewsEntries.map((entry) => (
            <GoodNewsEntry key={entry.id}>
              <EntryHeader>
                <UserName>{entry.userName}</UserName>
              </EntryHeader>
              <EntryContent>{entry.content}</EntryContent>
            </GoodNewsEntry>
          ))}
        </GoodNewsEntries>

        {typingUsers.length > 0 && (
          <TypingIndicator>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </TypingIndicator>
        )}

        <InputContainer>
          <TextArea
            placeholder="Share your good news..."
            rows={3}
            value={goodNewsInput}
            onChange={handleInputChange}
            onFocus={() => handleTyping(true)}
            onBlur={() => handleTyping(false)}
          />
          <ButtonContainer>
            <Button label="Add Entry" onClick={handleSubmit} />
          </ButtonContainer>
        </InputContainer>
      </Card>
    </StageContainer>
  );
};

export default MeetingStageGoodNews;