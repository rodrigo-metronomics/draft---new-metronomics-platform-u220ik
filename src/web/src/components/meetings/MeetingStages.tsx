import React, { useState, useEffect, useMemo, useCallback } from 'react'; // React ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.10

import MeetingProgress from './MeetingProgress';
import MeetingStageGoodNews from './MeetingStageGoodNews';
import MeetingStagePreviousActions from './MeetingStagePreviousActions';
import MeetingStageMetrics from './MeetingStageMetrics';
import MeetingStagePriorities from './MeetingStagePriorities';
import MeetingStageBlockers from './MeetingStageBlockers';
import MeetingStageNewActions from './MeetingStageNewActions';
import { MeetingStageType, MeetingType } from '../../types/meeting.types';
import { MEETING_STAGES, DEFAULT_MEETING_STAGES, getStageSequence } from '../../utils/constants/meetingStages';
import useAuth from '../../hooks/useAuth';
import { useMeetingStagesRealtime } from '../../hooks/useRealtime';

/**
 * Interface defining the props for the MeetingStages component
 */
export interface MeetingStagesProps {
  meetingId: string;
  meetingType: MeetingType;
  currentStage: MeetingStageType | null;
  isModerator: boolean;
  onStageChange: (stageType: MeetingStageType) => void;
  onComplete: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Interface defining the structure of stage data
 */
interface StageData {
  id: string;
  stageType: MeetingStageType;
  content: string;
  isCompleted: boolean;
  sequence: number;
}

/**
 * Styled component for the main container of the meeting stages
 */
const StagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

/**
 * Styled component for wrapping each stage
 */
const StageWrapper = styled.div<{ isActive: boolean }>`
  width: 100%;
  transition: opacity 0.3s ease-in-out, height 0.3s ease-in-out;
  opacity: ${props => (props.isActive ? 1 : 0.7)};
  height: ${props => (props.isActive ? 'auto' : '0')};
  overflow: ${props => (props.isActive ? 'visible' : 'hidden')};
  margin-bottom: ${props => (props.isActive ? '1rem' : '0')};
`;

/**
 * Styled component for the loading container
 */
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
`;

/**
 * Styled component for the error container
 */
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
  color: var(--red-500);
  text-align: center;
`;

/**
 * Component that manages and renders the appropriate meeting stage components based on the current stage
 */
const MeetingStages: React.FC<MeetingStagesProps> = ({
  meetingId,
  meetingType,
  currentStage,
  isModerator,
  onStageChange,
  onComplete,
  className,
  style,
}) => {
  // LD1: Extract meetingId, meetingType, currentStage, isModerator, onStageChange, onComplete, and other props from the component props
  // LD1: Get current user information using useAuth hook
  const { state: { user } } = useAuth();

  // LD1: Initialize state for tracking completed stages
  const [completedStages, setCompletedStages] = useState<MeetingStageType[]>([]);

  // LD1: Use useMeetingStagesRealtime hook to get and update stage data in real-time
  const { stages, updateStage } = useMeetingStagesRealtime(meetingId);

  // LD1: Determine the appropriate stage sequence based on the meeting type using DEFAULT_MEETING_STAGES
  const stageSequence = useMemo(() => {
    return DEFAULT_MEETING_STAGES[meetingType] || [];
  }, [meetingType]);

  // LD1: Create a mapping of stage IDs to stage data for easy access
  const stageDataMap = useMemo(() => {
    const map: Record<MeetingStageType, StageData> = {};
    stages?.forEach(stage => {
      map[stage.stageType] = {
        id: stage.id,
        stageType: stage.stageType,
        content: stage.content,
        isCompleted: completedStages.includes(stage.stageType),
        sequence: stage.sequence,
      };
    });
    return map;
  }, [stages, completedStages]);

  // LD1: Handle stage change when the user navigates to a different stage
  const handleStageChange = useCallback((stageType: MeetingStageType) => {
    onStageChange(stageType);
  }, [onStageChange]);

  // LD1: Handle stage completion when a stage is marked as completed
  const handleStageComplete = useCallback((stageType: MeetingStageType) => {
    setCompletedStages(prev => [...prev, stageType]);
  }, []);

  // LD1: Handle meeting completion when all stages are completed
  const handleMeetingComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // LD1: Render MeetingProgress component with appropriate props
  // LD1: Render the appropriate stage component based on the current stage
  // LD1: Pass appropriate props to each stage component including isActive, isCompleted, and callbacks
  // LD1: Apply appropriate styling based on component props
  return (
    <StagesContainer className={className} style={style}>
      <MeetingProgress
        meetingType={meetingType}
        currentStage={currentStage}
        stages={stages?.map(stage => ({
          id: stage.id,
          stageType: stage.stageType,
          isCompleted: completedStages.includes(stage.stageType),
        })) || []}
        onStageChange={handleStageChange}
        isModerator={isModerator}
      />

      {/* Meeting Stage Components */}
      <StageWrapper isActive={currentStage === MeetingStageType.GOOD_NEWS}>
        <MeetingStageGoodNews
          meetingId={meetingId}
          stageId={stageDataMap[MeetingStageType.GOOD_NEWS]?.id || ''}
          isActive={currentStage === MeetingStageType.GOOD_NEWS}
          isCompleted={completedStages.includes(MeetingStageType.GOOD_NEWS)}
          onComplete={() => handleStageComplete(MeetingStageType.GOOD_NEWS)}
        />
      </StageWrapper>

      <StageWrapper isActive={currentStage === MeetingStageType.PREVIOUS_ACTIONS}>
        <MeetingStagePreviousActions
          meetingId={meetingId}
          stageId={stageDataMap[MeetingStageType.PREVIOUS_ACTIONS]?.id || ''}
          isActive={currentStage === MeetingStageType.PREVIOUS_ACTIONS}
          isCompleted={completedStages.includes(MeetingStageType.PREVIOUS_ACTIONS)}
          onComplete={() => handleStageComplete(MeetingStageType.PREVIOUS_ACTIONS)}
        />
      </StageWrapper>

      <StageWrapper isActive={currentStage === MeetingStageType.METRICS}>
        <MeetingStageMetrics
          meetingId={meetingId}
          stageId={stageDataMap[MeetingStageType.METRICS]?.id || ''}
          isActive={currentStage === MeetingStageType.METRICS}
          isCompleted={completedStages.includes(MeetingStageType.METRICS)}
          onComplete={() => handleStageComplete(MeetingStageType.METRICS)}
        />
      </StageWrapper>

      <StageWrapper isActive={currentStage === MeetingStageType.PRIORITIES}>
        <MeetingStagePriorities
          meetingId={meetingId}
          stageId={stageDataMap[MeetingStageType.PRIORITIES]?.id || ''}
          isActive={currentStage === MeetingStageType.PRIORITIES}
          isCompleted={completedStages.includes(MeetingStageType.PRIORITIES)}
          onComplete={() => handleStageComplete(MeetingStageType.PRIORITIES)}
        />
      </StageWrapper>

      <StageWrapper isActive={currentStage === MeetingStageType.BLOCKERS}>
        <MeetingStageBlockers
          meetingId={meetingId}
          stageId={stageDataMap[MeetingStageType.BLOCKERS]?.id || ''}
          isActive={currentStage === MeetingStageType.BLOCKERS}
          isCompleted={completedStages.includes(MeetingStageType.BLOCKERS)}
          onComplete={() => handleStageComplete(MeetingStageType.BLOCKERS)}
        />
      </StageWrapper>

      <StageWrapper isActive={currentStage === MeetingStageType.NEW_ACTIONS}>
        <MeetingStageNewActions
          meetingId={meetingId}
          stageId={stageDataMap[MeetingStageType.NEW_ACTIONS]?.id || ''}
          isActive={currentStage === MeetingStageType.NEW_ACTIONS}
          isCompleted={completedStages.includes(MeetingStageType.NEW_ACTIONS)}
          onComplete={() => handleStageComplete(MeetingStageType.NEW_ACTIONS)}
        />
      </StageWrapper>
    </StagesContainer>
  );
};

export default MeetingStages;