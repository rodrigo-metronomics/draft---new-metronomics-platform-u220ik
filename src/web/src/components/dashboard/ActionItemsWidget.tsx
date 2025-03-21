import React, { useState, useEffect, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10

import Card from '../common/Card';
import Button from '../common/Button';
import Checkbox from '../common/Checkbox';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import Tabs from '../common/Tabs';
import useActionItems from '../../hooks/useActionItems';
import {
  ActionItem,
  ActionItemStatus,
  ActionItemPriority
} from '../../types/action-item.types';
import { formatDate, isDateBefore } from '../../utils/helpers/dateTimeHelper';
import { truncateText } from '../../utils/helpers/formatHelper';

/**
 * Props interface for the ActionItemsWidget component
 */
export interface ActionItemsWidgetProps {
  /** Maximum number of action items to display (default: 5) */
  maxItems?: number;
  /** Callback function when the 'View All' button is clicked */
  onViewAllClick?: () => void;
  /** Callback function when the 'Add Action Item' button is clicked */
  onAddClick?: () => void;
  /** Callback function when an action item is clicked, receives the item ID */
  onItemClick?: (id: string) => void;
  /** Additional CSS class for styling */
  className?: string;
}

/**
 * A dashboard widget that displays a user's action items with filtering and status management
 */
const ActionItemsWidget: React.FC<ActionItemsWidgetProps> = ({
  maxItems = 5,
  onViewAllClick,
  onAddClick,
  onItemClick,
  className
}) => {
  // State for the currently selected filter tab
  const [selectedTab, setSelectedTab] = useState<ActionItemStatus | 'ALL'>('ALL');

  // Use the useActionItems hook to fetch and manage action items
  const {
    actionItems,
    isLoading,
    isError,
    error,
    updateActionItemStatus
  } = useActionItems();

  // Function to handle status changes of action items
  const handleStatusChange = (id: string, status: ActionItemStatus) => {
    updateActionItemStatus().mutate({ id, status });
  };

  // Function to check if an action item is overdue
  const isOverdue = (dueDate: string | null | undefined): boolean => {
    if (!dueDate) return false;
    return isDateBefore(dueDate, new Date());
  };

  // Filter action items based on the selected tab
  const filteredActionItems = useMemo(() => {
    let filtered = actionItems;

    if (selectedTab !== 'ALL') {
      filtered = actionItems.filter(item => item.status === selectedTab);
    }

    return filtered;
  }, [actionItems, selectedTab]);

  // Limit the number of displayed action items
  const limitedActionItems = useMemo(() => {
    return filteredActionItems.slice(0, maxItems);
  }, [filteredActionItems, maxItems]);

  return (
    <Card
      title="My Action Items"
      className={className}
      actions={onViewAllClick && (
        <Button label="View All" onClick={onViewAllClick} />
      )}
      fullHeight
    >
      <WidgetContainer>
        <Tabs
          items={[
            { label: 'All', content: null },
            { label: 'Pending', content: null },
            { label: 'Completed', content: null },
          ]}
          activeIndex={selectedTab === 'ALL' ? 0 : selectedTab === ActionItemStatus.PENDING ? 1 : 2}
          onTabChange={(index) => {
            if (index === 0) setSelectedTab('ALL');
            else if (index === 1) setSelectedTab(ActionItemStatus.PENDING);
            else setSelectedTab(ActionItemStatus.COMPLETED);
          }}
        />

        {isLoading ? (
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        ) : isError ? (
          <ErrorState>
            <div>Error loading action items.</div>
            <Button label="Retry" onClick={() => window.location.reload()} />
          </ErrorState>
        ) : limitedActionItems.length === 0 ? (
          <EmptyState>
            <div>No action items found.</div>
          </EmptyState>
        ) : (
          <ActionItemsList>
            {limitedActionItems.map(item => (
              <ActionItemRow
                key={item.id}
                isOverdue={isOverdue(item.dueDate)}
                isCompleted={item.status === ActionItemStatus.COMPLETED}
                onClick={() => {
                  if (onItemClick) {
                    onItemClick(item.id.toString());
                  }
                }}
              >
                <Checkbox
                  checked={item.status === ActionItemStatus.COMPLETED}
                  onChange={(checked) => {
                    handleStatusChange(
                      item.id.toString(),
                      checked ? ActionItemStatus.COMPLETED : ActionItemStatus.PENDING
                    );
                  }}
                />
                <ActionItemContent>
                  <ActionItemDescription>
                    {truncateText(item.description, 75)}
                  </ActionItemDescription>
                  <ActionItemMeta>
                    <DueDate isOverdue={isOverdue(item.dueDate)}>
                      Due: {formatDate(item.dueDate, 'MMM dd, yyyy')}
                    </DueDate>
                    <Badge value={item.priority} />
                  </ActionItemMeta>
                </ActionItemContent>
              </ActionItemRow>
            ))}
          </ActionItemsList>
        )}

        {onAddClick && (
          <AddActionItemButton onClick={onAddClick}>
            + Add Action Item
          </AddActionItemButton>
        )}
      </WidgetContainer>
    </Card>
  );
};

// Styled components for the ActionItemsWidget
const WidgetContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
`;

const ActionItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  overflow-y: auto;
  flex: 1;
`;

const ActionItemRow = styled.div<{ isOverdue: boolean; isCompleted: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: ${props => props.isOverdue ? 'rgba(var(--error-rgb), 0.1)' : 'transparent'};
  border: 1px solid ${props => props.isOverdue ? 'var(--error-color)' : 'var(--surface-border)'};
  text-decoration: ${props => props.isCompleted ? 'line-through' : 'none'};
  opacity: ${props => props.isCompleted ? 0.7 : 1};
  transition: background-color 0.2s, border-color 0.2s;

  &:hover {
    background-color: var(--surface-hover);
  }
`;

const ActionItemContent = styled.div`
  flex: 1;
  margin-left: 0.5rem;
  display: flex;
  flex-direction: column;
`;

const ActionItemDescription = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const ActionItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
`;

const DueDate = styled.span<{ isOverdue: boolean }>`
  color: ${props => props.isOverdue ? 'var(--error-color)' : 'inherit'};
  font-weight: ${props => props.isOverdue ? '500' : 'normal'};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--error-color);
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const AddActionItemButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.5rem;
  background-color: transparent;
  border: 1px dashed var(--surface-border);
  border-radius: 4px;
  color: var(--primary-color);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--surface-hover);
  }
`;

export default ActionItemsWidget;