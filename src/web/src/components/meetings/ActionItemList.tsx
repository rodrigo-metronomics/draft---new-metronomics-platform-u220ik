import React, { useState, useEffect, useMemo, useCallback } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // styled-components@^5.3.10

import Table from '../common/Table';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Pagination from '../common/Pagination';
import ActionItemModal from './ActionItemModal';
import useActionItems from '../../hooks/useActionItems';
import {
  ActionItem, ActionItemStatus, ActionItemPriority, ActionItemSort
} from '../../types/action-item.types';
import { SortDirection } from '../../types/common.types';
import { formatDate } from '../../utils/helpers/dateTimeHelper';
import useOrganization from '../../hooks/useOrganization';

/**
 * Interface defining the props for the ActionItemList component
 */
interface ActionItemListProps {
  meetingId: string;
  onActionItemCreated: () => void;
  onActionItemUpdated: () => void;
  onActionItemDeleted: () => void;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Interface defining the structure for action item filters
 */
interface ActionItemFilters {
  status?: ActionItemStatus;
  assigneeId?: string;
  priority?: ActionItemPriority;
}

/**
 * Styled component for the main container of the ActionItemList
 */
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

/**
 * Styled component for the filters container
 */
const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

/**
 * Styled component for a filter group
 */
const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/**
 * Styled component for the actions container
 */
const ActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

/**
 * Styled component for a button group
 */
const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

/**
 * Styled component for displaying a message when there are no action items
 */
const NoActionItemsMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-style: italic;
`;

/**
 * Main component function that renders a list of action items for a meeting
 */
const ActionItemList: React.FC<ActionItemListProps> = ({
  meetingId,
  onActionItemCreated,
  onActionItemUpdated,
  onActionItemDeleted,
  readOnly = false,
  className,
  style,
}) => {
  // State variables for managing the modal, selected action item, and filters
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null);
  const [filters, setFilters] = useState<ActionItemFilters>({});

  // Access the current organization context
  const { currentOrganization } = useOrganization();

  // Use the useActionItems hook to fetch and manage action items
  const {
    actionItems,
    isLoading,
    totalItems,
    page,
    pageSize,
    sort,
    setPage,
    setPageSize,
    setFilters: setFiltersHook,
    setSort,
    refetch,
    createActionItem,
    updateActionItem,
    deleteActionItem,
    updateActionItemStatus,
    bulkUpdateStatus,
    bulkDelete,
    getActionItemsByMeeting,
  } = useActionItems();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(5);

  // Sorting state
  const [sortField, setSortField] = useState<ActionItemSort>(ActionItemSort.DUE_DATE);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Table columns configuration
  const columns = useMemo(
    () => [
      {
        field: 'status',
        header: 'Status',
        body: (rowData: ActionItem) => renderStatusBadge(rowData.status),
      },
      {
        field: 'description',
        header: 'Description',
      },
      {
        field: 'assignee.name',
        header: 'Assignee',
      },
      {
        field: 'dueDate',
        header: 'Due Date',
        body: (rowData: ActionItem) => rowData.dueDate ? formatDate(rowData.dueDate, 'MM/dd/yyyy') : '',
        sortable: true,
      },
      {
        field: 'priority',
        header: 'Priority',
        body: (rowData: ActionItem) => renderPriorityBadge(rowData.priority),
      },
      {
        field: 'actions',
        header: 'Actions',
        body: (rowData: ActionItem) => renderActionButtons(rowData),
      },
    ],
    []
  );

  // Handlers for creating, editing, and deleting action items
  const handleCreateActionItem = useCallback(() => {
    setSelectedActionItem(null);
    setIsModalOpen(true);
  }, []);

  const handleEditActionItem = useCallback((actionItem: ActionItem) => {
    setSelectedActionItem(actionItem);
    setIsModalOpen(true);
  }, []);

  const handleDeleteActionItem = useCallback(async (actionItem: ActionItem) => {
    if (window.confirm(`Are you sure you want to delete action item "${actionItem.description}"?`)) {
      await deleteActionItem.mutateAsync(actionItem.id.toString());
      onActionItemDeleted();
    }
  }, [deleteActionItem, onActionItemDeleted]);

  const handleStatusChange = useCallback(async (actionItem: ActionItem, status: ActionItemStatus) => {
    await updateActionItemStatus.mutateAsync({ id: actionItem.id.toString(), status });
    onActionItemUpdated();
  }, [updateActionItemStatus, onActionItemUpdated]);

  const handleBulkStatusUpdate = useCallback(async (status: ActionItemStatus) => {
    if (window.confirm(`Are you sure you want to update the status of all selected action items to "${status}"?`)) {
      // Implement bulk status update logic here
    }
  }, []);

  // Handlers for sorting and pagination
  const handleSort = useCallback((field: string, direction: SortDirection) => {
    setSortField(field as ActionItemSort);
    setSortDirection(direction);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setCurrentPageSize(pageSize);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: ActionItemFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  return (
    <Container className={className} style={style}>
      <FiltersContainer>
        {/* Implement filters here */}
      </FiltersContainer>

      <ActionsContainer>
        <ButtonGroup>
          {!readOnly && (
            <Button label="Create Action Item" onClick={handleCreateActionItem} />
          )}
          {/* Implement bulk actions here */}
        </ButtonGroup>
        {/* Implement search bar here */}
      </ActionsContainer>

      {actionItems && actionItems.length > 0 ? (
        <Table
          data={actionItems}
          columns={columns}
          loading={isLoading}
          sortable
          defaultSortField={sortField}
          defaultSortDirection={sortDirection}
          onSort={handleSort}
          paginated
          currentPage={currentPage}
          pageSize={currentPageSize}
          totalRecords={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : (
        <NoActionItemsMessage>No action items found for this meeting.</NoActionItemsMessage>
      )}

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalRecords={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {isModalOpen && (
        <ActionItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          meetingId={meetingId}
          actionItem={selectedActionItem || undefined}
          participants={[]} // Replace with actual participants
          onActionItemSaved={() => {
            refetch();
            onActionItemCreated();
          }}
        />
      )}
    </Container>
  );
};

/**
 * Renders a badge with appropriate styling for an action item status
 */
const renderStatusBadge = (status: ActionItemStatus) => {
  let color = 'primary';
  switch (status) {
    case ActionItemStatus.COMPLETED:
      color = 'success';
      break;
    case ActionItemStatus.BLOCKED:
      color = 'danger';
      break;
    case ActionItemStatus.IN_PROGRESS:
      color = 'info';
      break;
    case ActionItemStatus.CANCELLED:
      color = 'secondary';
      break;
    default:
      color = 'primary';
  }
  return <Badge value={status} severity={color} />;
};

/**
 * Renders a badge with appropriate styling for an action item priority
 */
const renderPriorityBadge = (priority: ActionItemPriority) => {
  let color = 'primary';
  switch (priority) {
    case ActionItemPriority.HIGH:
      color = 'danger';
      break;
    case ActionItemPriority.MEDIUM:
      color = 'warning';
      break;
    case ActionItemPriority.LOW:
      color = 'success';
      break;
    default:
      color = 'primary';
  }
  return <Badge value={priority} severity={color} />;
};

/**
 * Renders action buttons for an action item (edit, delete, etc.)
 */
const renderActionButtons = (actionItem: ActionItem) => {
  return (
    <div>
      <Button label="Edit" onClick={() => handleEditActionItem(actionItem)} />
      <Button label="Delete" onClick={() => handleDeleteActionItem(actionItem)} />
    </div>
  );
};

export default ActionItemList;