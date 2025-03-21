import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Milestone, MilestoneStatus } from '../../types/goal.types';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import { formatDate } from '../../utils/helpers/dateTimeHelper';
import { Severity } from '../../types/common.types';

interface MilestoneTimelineProps {
  milestones: Milestone[];
  onMilestoneClick?: (milestone: Milestone) => void;
  showProgress?: boolean;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Helper function to map milestone status to appropriate severity for Badge component
const getStatusSeverity = (status: MilestoneStatus): Severity => {
  switch (status) {
    case MilestoneStatus.COMPLETED:
      return Severity.SUCCESS;
    case MilestoneStatus.MISSED:
      return Severity.ERROR;
    case MilestoneStatus.IN_PROGRESS:
      return Severity.WARNING;
    case MilestoneStatus.PENDING:
    default:
      return Severity.INFO;
  }
};

// Helper function to convert milestone status enum value to a human-readable label
const getStatusLabel = (status: MilestoneStatus): string => {
  switch (status) {
    case MilestoneStatus.COMPLETED:
      return 'Completed';
    case MilestoneStatus.MISSED:
      return 'Missed';
    case MilestoneStatus.IN_PROGRESS:
      return 'In Progress';
    case MilestoneStatus.PENDING:
      return 'Pending';
    default:
      return status;
  }
};

// Helper function to calculate the percentage of completed milestones
const calculateProgress = (milestones: Milestone[]): number => {
  if (milestones.length === 0) return 0;
  
  const completedCount = milestones.filter(
    milestone => milestone.status === MilestoneStatus.COMPLETED
  ).length;
  
  return (completedCount / milestones.length) * 100;
};

// Helper function to sort milestones by due date in ascending order
const sortMilestonesByDate = (milestones: Milestone[]): Milestone[] => {
  return [...milestones].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
};

const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const TimelineContent = styled.div`
  position: relative;
  padding: 0 0 1rem 0;
  min-height: 100px;
`;

const TimelineAxis = styled.div`
  position: absolute;
  left: 8px;
  top: 0;
  width: 2px;
  height: 100%;
  background-color: #e0e0e0;
  z-index: 1;
`;

const TimelineItem = styled.div<{ interactive?: boolean; status: MilestoneStatus }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding: 1rem 1rem 1rem 2rem;
  border-radius: 6px;
  background-color: ${props => {
    switch (props.status) {
      case MilestoneStatus.COMPLETED:
        return 'rgba(76, 175, 80, 0.05)';
      case MilestoneStatus.MISSED:
        return 'rgba(244, 67, 54, 0.05)';
      case MilestoneStatus.IN_PROGRESS:
        return 'rgba(255, 152, 0, 0.05)';
      default:
        return 'rgba(33, 150, 243, 0.05)';
    }
  }};
  border-left: 3px solid ${props => {
    switch (props.status) {
      case MilestoneStatus.COMPLETED:
        return '#4caf50';
      case MilestoneStatus.MISSED:
        return '#f44336';
      case MilestoneStatus.IN_PROGRESS:
        return '#ff9800';
      default:
        return '#2196f3';
    }
  }};
  cursor: ${props => (props.interactive ? 'pointer' : 'default')};
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    ${props =>
      props.interactive &&
      `
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    `}
  }

  &::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${props => {
      switch (props.status) {
        case MilestoneStatus.COMPLETED:
          return '#4caf50';
        case MilestoneStatus.MISSED:
          return '#f44336';
        case MilestoneStatus.IN_PROGRESS:
          return '#ff9800';
        default:
          return '#2196f3';
      }
    }};
    z-index: 2;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 0.75rem 0.75rem 1.5rem;
    
    &::before {
      left: -8px;
      width: 10px;
      height: 10px;
    }
  }
`;

const TimelineDate = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #707070;
  margin-bottom: 0.5rem;

  @media (max-width: 576px) {
    font-size: 0.75rem;
  }
`;

const TimelineItemContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-left: 0.5rem;
`;

const TimelineItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TimelineItemTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 576px) {
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
`;

const TimelineItemDescription = styled.div`
  font-size: 0.875rem;
  color: #666666;
  margin-bottom: 0.5rem;

  @media (max-width: 576px) {
    font-size: 0.75rem;
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #666666;
  font-style: italic;
`;

const ProgressContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
  width: 100%;
`;

/**
 * A component that visualizes milestones on a chronological timeline,
 * showing progress towards strategic goals with dates, titles, descriptions,
 * and status indicators.
 */
const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  milestones = [],
  onMilestoneClick,
  showProgress = true,
  interactive = true,
  className,
  style,
}) => {
  // Sort milestones by due date
  const sortedMilestones = useMemo(() => sortMilestonesByDate(milestones), [milestones]);
  
  // Calculate progress percentage
  const progressPercentage = useMemo(() => calculateProgress(milestones), [milestones]);

  return (
    <TimelineContainer className={className} style={style}>
      {showProgress && (
        <ProgressContainer>
          <ProgressBar
            value={progressPercentage}
            label="Milestone Completion"
            unit="%"
            color="#1890ff"
          />
        </ProgressContainer>
      )}
      
      <TimelineContent>
        <TimelineAxis />
        
        {sortedMilestones.length === 0 ? (
          <EmptyState>No milestones to display</EmptyState>
        ) : (
          sortedMilestones.map(milestone => (
            <TimelineItem
              key={milestone.id}
              interactive={interactive && !!onMilestoneClick}
              status={milestone.status}
              onClick={() => {
                if (interactive && onMilestoneClick) {
                  onMilestoneClick(milestone);
                }
              }}
              role={interactive && onMilestoneClick ? "button" : "listitem"}
              tabIndex={interactive && onMilestoneClick ? 0 : undefined}
              aria-label={`${milestone.title}. Due date: ${formatDate(milestone.dueDate, 'MMMM d, yyyy')}. Status: ${getStatusLabel(milestone.status)}.`}
            >
              <TimelineItemContent>
                <TimelineDate>{formatDate(milestone.dueDate, 'MMM d, yyyy')}</TimelineDate>
                <TimelineItemHeader>
                  <TimelineItemTitle>{milestone.title}</TimelineItemTitle>
                  <Badge
                    value={getStatusLabel(milestone.status)}
                    severity={getStatusSeverity(milestone.status)}
                  />
                </TimelineItemHeader>
                {milestone.description && (
                  <TimelineItemDescription>{milestone.description}</TimelineItemDescription>
                )}
              </TimelineItemContent>
            </TimelineItem>
          ))
        )}
      </TimelineContent>
    </TimelineContainer>
  );
};

export default MilestoneTimeline;