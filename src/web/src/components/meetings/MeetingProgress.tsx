import React, { useMemo } from 'react';
import styled from 'styled-components';
import { MeetingStageType, MeetingType } from '../../types/meeting.types';
import { MEETING_STAGES, DEFAULT_MEETING_STAGES, getStageSequence } from '../../utils/constants/meetingStages';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';

interface MeetingProgressProps {
  meetingType: MeetingType;
  currentStage: MeetingStageType | null;
  stages: Array<{ id: string; stageType: MeetingStageType; isCompleted: boolean }>;
  onStageChange: (stageType: MeetingStageType) => void;
  isModerator: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface StageIndicatorProps {
  stageType: MeetingStageType;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  isModerator: boolean;
}

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StageIndicatorsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 0.5rem;
  position: relative;
  @media (max-width: 768px) {
    overflow-x: auto;
    justify-content: flex-start;
    gap: 1rem;
  }
`;

const StageIndicator = styled.div<{ isActive: boolean; isModerator: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: ${props => (props.isModerator ? 'pointer' : 'default')};
  opacity: ${props => (props.isActive ? 1 : 0.7)};
  transition: opacity 0.2s ease-in-out;
  &:hover {
    opacity: ${props => (props.isModerator ? 1 : props.isActive ? 1 : 0.7)};
  }
`;

const StageIcon = styled.div<{ isActive: boolean; isCompleted: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => (
    props.isCompleted ? 'var(--green-500)' : 
    props.isActive ? 'var(--primary-color)' : 
    'var(--surface-300)'
  )};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  margin-bottom: 0.5rem;
`;

const StageName = styled.span<{ isActive: boolean }>`
  font-size: 0.75rem;
  text-align: center;
  color: ${props => (props.isActive ? 'var(--text-color)' : 'var(--text-color-secondary)')};
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media (max-width: 768px) {
    display: ${props => (props.isActive ? 'block' : 'none')};
  }
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const StageTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
  text-align: center;
`;

const MeetingProgress: React.FC<MeetingProgressProps> = ({
  meetingType,
  currentStage,
  stages,
  onStageChange,
  isModerator,
  className,
  style,
}) => {
  // Get the default stage sequence based on meeting type
  const defaultStages = useMemo(() => 
    DEFAULT_MEETING_STAGES[meetingType] || [], 
    [meetingType]
  );
  
  // Calculate total number of stages
  const totalStages = useMemo(() => 
    defaultStages.length, 
    [defaultStages]
  );
  
  // Calculate current stage index
  const currentStageIndex = useMemo(() => {
    if (!currentStage) return 0;
    const sequence = getStageSequence(meetingType, currentStage);
    return sequence >= 0 ? sequence : 0;
  }, [meetingType, currentStage]);
  
  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (totalStages <= 1) return 100;
    return Math.round((currentStageIndex / (totalStages - 1)) * 100);
  }, [currentStageIndex, totalStages]);
  
  // Determine if we can navigate to previous/next stage
  const canNavigatePrevious = currentStageIndex > 0 && isModerator;
  const canNavigateNext = currentStageIndex < totalStages - 1 && isModerator;
  
  // Handle navigation to previous stage
  const handlePreviousStage = () => {
    if (!canNavigatePrevious || !currentStage) return;
    const prevIndex = currentStageIndex - 1;
    if (prevIndex >= 0 && prevIndex < defaultStages.length) {
      onStageChange(defaultStages[prevIndex].stageType);
    }
  };
  
  // Handle navigation to next stage
  const handleNextStage = () => {
    if (!canNavigateNext || !currentStage) return;
    const nextIndex = currentStageIndex + 1;
    if (nextIndex >= 0 && nextIndex < defaultStages.length) {
      onStageChange(defaultStages[nextIndex].stageType);
    }
  };
  
  // Handle click on a stage indicator
  const handleStageClick = (stageType: MeetingStageType) => {
    if (isModerator) {
      onStageChange(stageType);
    }
  };
  
  // Get the current stage info
  const currentStageInfo = currentStage ? MEETING_STAGES[currentStage] : null;
  
  return (
    <ProgressContainer className={className} style={style}>
      {/* Current stage title */}
      {currentStageInfo && (
        <StageTitle>{currentStageInfo.title}</StageTitle>
      )}
      
      {/* Progress bar */}
      <ProgressBar 
        value={progressPercentage} 
        showValue={false} 
        aria-label="Meeting progress"
      />
      
      {/* Stage indicators */}
      <StageIndicatorsContainer>
        {defaultStages.map((stage) => {
          const stageInfo = MEETING_STAGES[stage.stageType];
          const isCurrentStage = currentStage === stage.stageType;
          const stageData = stages.find(s => s.stageType === stage.stageType);
          const isCompleted = stageData?.isCompleted || false;
          
          return (
            <StageIndicator 
              key={stage.stageType}
              isActive={isCurrentStage}
              isModerator={isModerator}
              onClick={() => handleStageClick(stage.stageType)}
              aria-label={`${stageInfo.title} ${isCurrentStage ? '(current stage)' : ''} ${isCompleted ? '(completed)' : ''}`}
              role={isModerator ? 'button' : 'presentation'}
              tabIndex={isModerator ? 0 : -1}
            >
              <StageIcon isActive={isCurrentStage} isCompleted={isCompleted}>
                {isCompleted ? '✓' : stage.sequence + 1}
              </StageIcon>
              <StageName isActive={isCurrentStage}>
                {stageInfo.title}
              </StageName>
            </StageIndicator>
          );
        })}
      </StageIndicatorsContainer>
      
      {/* Navigation buttons */}
      {isModerator && (
        <NavigationContainer>
          <Button
            label="Previous"
            onClick={handlePreviousStage}
            disabled={!canNavigatePrevious}
            variant="secondary"
            icon="pi pi-chevron-left"
            iconPos="left"
          />
          <Button
            label="Next Stage"
            onClick={handleNextStage}
            disabled={!canNavigateNext}
            variant="primary"
            icon="pi pi-chevron-right"
            iconPos="right"
          />
        </NavigationContainer>
      )}
    </ProgressContainer>
  );
};

export default MeetingProgress;