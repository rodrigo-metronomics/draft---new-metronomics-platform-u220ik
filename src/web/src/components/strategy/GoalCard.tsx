import React from 'react';
import styled from 'styled-components'; // ^5.3.10
import { PencilIcon, TrashIcon } from 'primereact/icons/pencil'; // ^10.0.0
import Card from '../common/Card';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import IconButton from '../common/IconButton';
import { 
  Goal, 
  GoalType, 
  GoalStatus, 
  GoalWithMetrics, 
  GoalWithMilestones, 
  GoalWithMilestonesAndMetrics 
} from '../../types/goal.types';
import { Severity } from '../../types/common.types';
import { formatDate } from '../../utils/helpers/dateTimeHelper';

/**
 * Type definition for GoalCard props
 */
interface GoalCardProps {
  goal: Goal | GoalWithMetrics | GoalWithMilestones | GoalWithMilestonesAndMetrics;
  showMetrics?: boolean;
  showMilestones?: boolean;
  showActions?: boolean;
  interactive?: boolean;
  onClick?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  className?: string;
}

/**
 * Helper function to get a human-readable label for goal types
 */
const getGoalTypeLabel = (type: GoalType): string => {
  switch (type) {
    case GoalType.BHAG:
      return 'BHAG';
    case GoalType.THREE_HAG:
      return '3HAG';
    case GoalType.ONE_HAG:
      return '1HAG';
    case GoalType.QUARTERLY:
      return 'Quarterly';
    default:
      return 'Goal';
  }
};

/**
 * Helper function to determine badge severity based on goal status
 */
const getStatusSeverity = (status: GoalStatus): Severity => {
  switch (status) {
    case GoalStatus.ACTIVE:
      return Severity.SUCCESS;
    case GoalStatus.AT_RISK:
      return Severity.WARNING;
    case GoalStatus.COMPLETED:
      return Severity.INFO;
    case GoalStatus.ARCHIVED:
      return Severity.INFO;
    case GoalStatus.DRAFT:
    default:
      return Severity.INFO;
  }
};

/**
 * Helper function to get a human-readable label for goal status
 */
const getStatusLabel = (status: GoalStatus): string => {
  switch (status) {
    case GoalStatus.ACTIVE:
      return 'Active';
    case GoalStatus.AT_RISK:
      return 'At Risk';
    case GoalStatus.COMPLETED:
      return 'Completed';
    case GoalStatus.ARCHIVED:
      return 'Archived';
    case GoalStatus.DRAFT:
      return 'Draft';
    default:
      return 'Unknown';
  }
};

/**
 * Styled components for the GoalCard
 */
const GoalCardContainer = styled.div`
  width: 100%;
  overflow: hidden;
`;

const GoalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const GoalTypeLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors?.text?.secondary};
  margin-right: 8px;
`;

const GoalActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const GoalContent = styled.div`
  margin-bottom: 16px;
`;

const GoalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GoalDescription = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors?.text?.secondary};
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GoalProgress = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 4px;
`;

const GoalFooter = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors?.text?.tertiary};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DateRange = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetaInfo = styled.div`
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
`;

/**
 * A component that displays strategic goals with their details, progress, and status.
 * It provides a visual representation of goals (BHAG, 3HAG, 1HAG, Quarterly) with 
 * options to show metrics, milestones, and action buttons.
 */
const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  showMetrics = false,
  showMilestones = false,
  showActions = false,
  interactive = false,
  onClick,
  onEdit,
  onDelete,
  className,
}) => {
  // Determine goal type label
  const goalTypeLabel = getGoalTypeLabel(goal.type);
  
  // Determine status label and severity for the badge
  const statusLabel = getStatusLabel(goal.status);
  const statusSeverity = getStatusSeverity(goal.status);
  
  // Format date range for display
  const dateRange = `${formatDate(goal.startDate, 'MMM d, yyyy')} - ${formatDate(goal.endDate, 'MMM d, yyyy')}`;
  
  // Determine if we have metrics or milestones to display
  const hasMetrics = showMetrics && 'metrics' in goal && goal.metrics?.length > 0;
  const hasMilestones = showMilestones && 'milestones' in goal && goal.milestones?.length > 0;

  // Calculate metrics and milestones counts
  const metricsCount = hasMetrics ? (goal as GoalWithMetrics).metrics.length : 0;
  const milestonesCount = hasMilestones ? (goal as GoalWithMilestones).milestones.length : 0;

  // Handle click on the card
  const handleClick = () => {
    if (interactive && onClick) {
      onClick(goal);
    }
  };

  // Handle edit button click
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (onEdit) {
      onEdit(goal);
    }
  };

  // Handle delete button click
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (onDelete) {
      onDelete(goal);
    }
  };

  // Render the card with all goal information
  return (
    <GoalCardContainer className={className}>
      <Card
        interactive={interactive}
        onClick={handleClick}
        header={
          <GoalHeader>
            <div>
              <GoalTypeLabel>{goalTypeLabel}</GoalTypeLabel>
              <Badge value={statusLabel} severity={statusSeverity} size="small" />
            </div>
            {showActions && (
              <GoalActions>
                <IconButton
                  icon={<PencilIcon />}
                  variant="TERTIARY"
                  size="SMALL"
                  onClick={handleEdit}
                  aria-label="Edit goal"
                />
                <IconButton
                  icon={<TrashIcon />}
                  variant="TERTIARY"
                  size="SMALL"
                  onClick={handleDelete}
                  aria-label="Delete goal"
                />
              </GoalActions>
            )}
          </GoalHeader>
        }
      >
        <GoalContent>
          <GoalTitle title={goal.title}>{goal.title}</GoalTitle>
          <GoalDescription>{goal.description}</GoalDescription>
          
          <GoalProgress>
            <ProgressLabel>
              <span>Progress</span>
              <span>{goal.progress}%</span>
            </ProgressLabel>
            <ProgressBar 
              value={goal.progress}
              variant={goal.status === GoalStatus.AT_RISK ? 'warning' : 'primary'}
            />
          </GoalProgress>
        </GoalContent>
        
        <GoalFooter>
          <DateRange>{dateRange}</DateRange>
          {(hasMetrics || hasMilestones) && (
            <MetaInfo>
              {hasMetrics && <span>{metricsCount} Metrics</span>}
              {hasMilestones && <span>{milestonesCount} Milestones</span>}
            </MetaInfo>
          )}
        </GoalFooter>
      </Card>
    </GoalCardContainer>
  );
};

export default GoalCard;