import React, { useCallback } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // styled-components@^5.3.10

import ActionItemList from './ActionItemList';
import Card from '../common/Card';
import { MeetingStageType } from '../../types/meeting.types';
import { MEETING_STAGES } from '../../utils/constants/meetingStages';
import useActionItems from '../../hooks/useActionItems';
import useRealtime from '../../hooks/useRealtime';
import { ActionItem } from '../../types/action-item.types';

/**
 * Interface for the props that MeetingStagePreviousActions component accepts.
 */
interface MeetingStagePreviousActionsProps {
  meetingId: string;
  isActive: boolean;
  isModerator: boolean;
  onStageContentChange: (content: string) => void;
  stageContent: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Styled Card component for consistent styling
 */
const StyledCard = styled(Card)<{ isActive: boolean }>`
  width: 100%;
  margin-bottom: 1rem;
  transition: opacity 0.3s ease-in-out;
  opacity: ${props => props.isActive ? 1 : 0.7};
`;

/**
 * Styled paragraph for the prompt text
 */
const PromptText = styled.p`
  font-style: italic;
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
`;

/**
 * Styled div for the action items container
 */
const ActionItemsContainer = styled.div`
  margin-top: 1rem;
`;

/**
 * Component for displaying and managing previous action items during a meeting
 */
const MeetingStagePreviousActions: React.FC<MeetingStagePreviousActionsProps> = ({
  meetingId,
  isActive,
  isModerator,
  onStageContentChange,
  stageContent,
  className,
  style,
}) => {
  // Use useActionItems hook to get action item management functions
  const {
    getActionItemsByMeeting,
    updateActionItemStatus,
  } = useActionItems();

  // Use useRealtime hook to subscribe to real-time updates for action items
  const { subscribeToActionItems } = useRealtime();

  // Implement handleActionItemUpdated to update action items and notify parent component
  const handleActionItemUpdated = useCallback(() => {
    // Notify parent component that action items have been updated
    onStageContentChange(stageContent);
  }, [onStageContentChange, stageContent]);

  // Implement handleActionItemCreated to add new action items to the list
  const handleActionItemCreated = useCallback(() => {
    // Notify parent component that action items have been created
    onStageContentChange(stageContent);
  }, [onStageContentChange, stageContent]);

  // Implement handleActionItemDeleted to remove action items from the list
  const handleActionItemDeleted = useCallback(() => {
    // Notify parent component that action items have been deleted
    onStageContentChange(stageContent);
  }, [onStageContentChange, stageContent]);

  return (
    <StyledCard isActive={isActive} className={className} style={style} title={MEETING_STAGES[MeetingStageType.PREVIOUS_ACTIONS].title}>
      <PromptText>{MEETING_STAGES[MeetingStageType.PREVIOUS_ACTIONS].prompt}</PromptText>
      <ActionItemsContainer>
        <ActionItemList
          meetingId={meetingId}
          onActionItemCreated={handleActionItemCreated}
          onActionItemUpdated={handleActionItemUpdated}
          onActionItemDeleted={handleActionItemDeleted}
          readOnly={!isModerator}
        />
      </ActionItemsContainer>
    </StyledCard>
  );
};

export default MeetingStagePreviousActions;