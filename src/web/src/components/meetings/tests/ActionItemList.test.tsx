import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // @testing-library/react@^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event@^14.0.0
import { vi } from 'vitest'; // vitest@^0.34.0

import ActionItemList from '../ActionItemList';
import ActionItemModal from '../ActionItemModal';
import { renderWithProviders, createMockOrganization } from '../../../tests/testUtils';
import { ActionItem, ActionItemStatus, ActionItemPriority } from '../../../types/action-item.types';
import useActionItems from '../../../hooks/useActionItems';
import useOrganization from '../../../hooks/useOrganization';

const createMockActionItems = (count: number, overrides: Partial<ActionItem> = {}): ActionItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `action-${i + 1}`,
    description: `Action Item ${i + 1}`,
    status: ActionItemStatus.PENDING,
    priority: ActionItemPriority.MEDIUM,
    dueDate: new Date(),
    assigneeId: 'assignee-1',
    assignee: { id: 'assignee-1', name: 'John Doe' },
    meetingId: 'meeting-1',
    meeting: null,
    organizationId: 'org-1',
    notes: 'Some notes',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    ...overrides,
  }));
};

const setup = (props: any = {}, mocks: any = {}) => {
  const mockActionItems = createMockActionItems(3);

  vi.mock('../../../hooks/useActionItems', () => ({
    default: vi.fn().mockReturnValue({
      actionItems: mockActionItems,
      isLoading: false,
      totalItems: mockActionItems.length,
      page: 1,
      pageSize: 10,
      sort: 'dueDate',
      setPage: vi.fn(),
      setPageSize: vi.fn(),
      setFilters: vi.fn(),
      setSort: vi.fn(),
      refetch: vi.fn(),
      createActionItem: vi.fn(),
      updateActionItem: vi.fn(),
      deleteActionItem: vi.fn(),
      updateActionItemStatus: vi.fn(),
      bulkUpdateStatus: vi.fn(),
      bulkDelete: vi.fn(),
      getActionItemsByMeeting: vi.fn(),
      ...mocks.useActionItems,
    }),
  }));

  vi.mock('../../../hooks/useOrganization', () => ({
    default: vi.fn().mockReturnValue({
      currentOrganization: createMockOrganization(),
      ...mocks.useOrganization,
    }),
  }));

  const renderResult = renderWithProviders(<ActionItemList meetingId="meeting-1" onActionItemCreated={vi.fn()} onActionItemUpdated={vi.fn()} onActionItemDeleted={vi.fn()} {...props} />);
  const user = userEvent.setup();

  return {
    ...renderResult,
    user,
    mockActionItems,
    useActionItems: useActionItems()
  };
};

describe('ActionItemList', () => {
  it('renders the component with action items', () => {
    const { getByText, getAllByRole } = setup();
    expect(getByText('Action Item 1')).toBeInTheDocument();
    const rows = getAllByRole('row');
    expect(rows.length).toBe(4);
  });

  it('displays a message when no action items are available', () => {
    setup({}, { useActionItems: { actionItems: [] } });
    expect(screen.getByText('No action items found for this meeting.')).toBeInTheDocument();
  });

  it('opens the create action item modal when the create button is clicked', async () => {
    const { user } = setup();
    const createButton = screen.getByText('Create Action Item');
    await user.click(createButton);
    expect(screen.getByText('Create Action Item')).toBeInTheDocument();
  });

  it('opens the edit action item modal when the edit button is clicked', async () => {
    const { user } = setup();
    const editButton = screen.getAllByText('Edit')[0];
    await user.click(editButton);
    expect(screen.getByText('Edit Action Item')).toBeInTheDocument();
  });

  it('calls deleteActionItem when delete button is clicked and confirmed', async () => {
    const deleteActionItemMock = vi.fn();
    const { user } = setup({}, { useActionItems: { deleteActionItem: { mutateAsync: deleteActionItemMock } } });
    window.confirm = vi.fn(() => true);
    const deleteButton = screen.getAllByText('Delete')[0];
    await user.click(deleteButton);
    expect(deleteActionItemMock).toHaveBeenCalledWith('action-1');
  });

  it('toggles action item status when checkbox is clicked', async () => {
    const updateActionItemStatusMock = vi.fn();
    const { user } = setup({}, { useActionItems: { updateActionItemStatus: { mutateAsync: updateActionItemStatusMock } } });
    const checkbox = screen.getAllByRole('checkbox')[0];
    await user.click(checkbox);
    expect(updateActionItemStatusMock).toHaveBeenCalled();
  });

  it('filters action items by status', async () => {
    const getActionItemsByMeetingMock = vi.fn();
    const { user } = setup({}, { useActionItems: { getActionItemsByMeeting: getActionItemsByMeetingMock } });
    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    await user.selectOptions(statusFilter, ['completed']);
    expect(getActionItemsByMeetingMock).toHaveBeenCalled();
  });

  it('sorts action items by different fields', async () => {
    const getActionItemsByMeetingMock = vi.fn();
    const { user } = setup({}, { useActionItems: { getActionItemsByMeeting: getActionItemsByMeetingMock } });
    const dueDateHeader = screen.getByText('Due Date');
    await user.click(dueDateHeader);
    expect(getActionItemsByMeetingMock).toHaveBeenCalled();
    await user.click(dueDateHeader);
    expect(getActionItemsByMeetingMock).toHaveBeenCalledTimes(2);
  });

  it('handles pagination correctly', async () => {
    const getActionItemsByMeetingMock = vi.fn();
    const { user } = setup({}, { useActionItems: { getActionItemsByMeeting: getActionItemsByMeetingMock, totalPages: 3 } });
    const nextPageButton = screen.getByRole('button', { name: /next page/i });
    await user.click(nextPageButton);
    expect(getActionItemsByMeetingMock).toHaveBeenCalled();
    const pageTwoButton = screen.getByRole('button', { name: /page 2/i });
    await user.click(pageTwoButton);
    expect(getActionItemsByMeetingMock).toHaveBeenCalledTimes(2);
  });

  it('calls onActionItemCreated callback when an action item is created', async () => {
    const createActionItemMock = vi.fn();
    const onActionItemCreatedMock = vi.fn();
    const { user } = setup({ onActionItemCreated: onActionItemCreatedMock }, { useActionItems: { createActionItem: { mutateAsync: createActionItemMock } } });
    const createButton = screen.getByText('Create Action Item');
    await user.click(createButton);
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);
    expect(createActionItemMock).toHaveBeenCalled();
    expect(onActionItemCreatedMock).toHaveBeenCalled();
  });

  it('calls onActionItemUpdated callback when an action item is updated', async () => {
    const updateActionItemMock = vi.fn();
    const onActionItemUpdatedMock = vi.fn();
    const { user } = setup({ onActionItemUpdated: onActionItemUpdatedMock }, { useActionItems: { updateActionItem: { mutateAsync: updateActionItemMock } } });
    const editButton = screen.getAllByText('Edit')[0];
    await user.click(editButton);
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);
    expect(updateActionItemMock).toHaveBeenCalled();
    expect(onActionItemUpdatedMock).toHaveBeenCalled();
  });

  it('calls onActionItemDeleted callback when an action item is deleted', async () => {
    const deleteActionItemMock = vi.fn();
    const onActionItemDeletedMock = vi.fn();
    const { user } = setup({ onActionItemDeleted: onActionItemDeletedMock }, { useActionItems: { deleteActionItem: { mutateAsync: deleteActionItemMock } } });
    window.confirm = vi.fn(() => true);
    const deleteButton = screen.getAllByText('Delete')[0];
    await user.click(deleteButton);
    expect(deleteActionItemMock).toHaveBeenCalledWith('action-1');
    expect(onActionItemDeletedMock).toHaveBeenCalled();
  });

  it('disables edit and delete buttons in read-only mode', async () => {
    setup({ readOnly: true });
    expect(screen.queryByText('Create Action Item')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});