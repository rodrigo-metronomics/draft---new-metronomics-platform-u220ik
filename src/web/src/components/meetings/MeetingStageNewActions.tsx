import React, { useState, useCallback } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // styled-components@^5.3.10

import ActionItemList from './ActionItemList';
import ActionItemModal from './ActionItemModal';
import Button from '../common/Button';
import Card from '../common/Card';
import { MeetingStageType } from '../../types/meeting.types';
import { MEETING_STAGES } from '../../utils/constants/meetingStages';
import useActionItems from '../../hooks/useActionItems';
import useMeetings from '../../hooks/useMeetings';
import { MeetingStageNewActionsProps } from '../../types/meeting.types';

/**
 * Styled component for the main container of the New Actions stage
 */
const StageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

/**
 * Styled component for displaying the stage prompt
 */
const StagePrompt = styled.div`
  font-size: 1.1rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
  font-style: italic;
`;

/**
 * Styled component for the action header
 */
const ActionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

/**
 * Styled component for the complete button container
 */
const CompleteButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;

/**
 * Component for the New Actions stage of a meeting that allows users to create, view, and manage action items
 */
const MeetingStageNewActions: React.FC<MeetingStageNewActionsProps> = ({
  meetingId,
  isActive,
  onComplete,
  stageData,
  className,
  style,
}) => {
  // Destructure props to access meetingId, isActive, onComplete, and stageData
  // Initialize state for modal visibility and selected action item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState(null);

  // Fetch meeting data with participants using useMeetings hook
  const { getMeetingWithParticipants } = useMeetings();
  const { data: meeting, isLoading: isMeetingLoading } = getMeetingWithParticipants(meetingId);

  // Fetch action items for the meeting using useActionItems hook
  const { actionItems, isLoading: isActionItemsLoading, refetch } = useActionItems();

  // Handle opening the action item creation modal
  const handleCreateActionItem = useCallback(() => {
    setSelectedActionItem(null);
    setIsModalOpen(true);
  }, []);

  // Handle action item creation success
  const handleActionItemCreated = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle action item update success
  const handleActionItemUpdated = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle action item deletion
  const handleActionItemDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  // Render the stage prompt from MEETING_STAGES
  // Render a Card component containing the action items section
  // Render a Button for creating new action items
  // Render the ActionItemList component with the meeting's action items
  // Render the ActionItemModal for creating/editing action items
  // Conditionally render a completion button if the stage is active
  return (
    <StageContainer className={className} style={style}>
      <StagePrompt>{MEETING_STAGES[MeetingStageType.NEW_ACTIONS].prompt}</StagePrompt>
      <Card>
        <ActionHeader>
          <h3>Action Items</h3>
          <Button label="Create Action Item" onClick={handleCreateActionItem} />
        </ActionHeader>
        <ActionItemList
          meetingId={meetingId}
          onActionItemCreated={handleActionItemCreated}
          onActionItemUpdated={handleActionItemUpdated}
          onActionItemDeleted={handleActionItemDeleted}
        />
      </Card>
      {isModalOpen && (
        <ActionItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          meetingId={meetingId}
          actionItem={selectedActionItem}
          participants={meeting?.participants || []}
          onActionItemSaved={handleActionItemCreated}
        />
      )}
      {isActive && (
        <CompleteButtonContainer>
          <Button label="Complete" onClick={onComplete} />
        </CompleteButtonContainer>
      )}
    </StageContainer>
  );
};

export default MeetingStageNewActions;