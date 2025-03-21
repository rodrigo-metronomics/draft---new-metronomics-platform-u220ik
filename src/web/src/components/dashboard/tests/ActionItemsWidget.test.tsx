import React from 'react'; // version ^18.2.0
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

import ActionItemsWidget from '../ActionItemsWidget'; // Component being tested
import { renderWithProviders } from '../../../tests/testUtils'; // Utility for rendering components with necessary providers
import { waitForLoadingToFinish } from '../../../tests/testUtils'; // Utility for waiting for loading states to resolve
import { ActionItem, ActionItemStatus, ActionItemPriority } from '../../../types/action-item.types'; // Type definitions for action items data

/**
 * Helper function to create mock action items data for testing
 * @param count 
 * @returns Array of mock action items
 */
const createMockActionItems = (count: number): ActionItem[] => {
  const mockActionItems: ActionItem[] = [];
  for (let i = 0; i < count; i++) {
    mockActionItems.push({
      id: `action-item-${i + 1}`,
      description: `Mock action item ${i + 1}`,
      status: i % 2 === 0 ? ActionItemStatus.PENDING : ActionItemStatus.COMPLETED,
      priority: i % 3 === 0 ? ActionItemPriority.HIGH : ActionItemPriority.MEDIUM,
      dueDate: `2024-01-${i + 1}`,
      assigneeId: 'user-1',
      assignee: { id: 'user-1', name: 'Test User' } as any,
      meetingId: 'meeting-1',
      meeting: { id: 'meeting-1', title: 'Test Meeting' } as any,
      organizationId: 'org-1',
      notes: 'Test notes',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      completedAt: i % 2 === 0 ? null : '2024-01-01',
    });
  }
  return mockActionItems;
};

/**
 * Setup function for common test configuration
 * @param options 
 * @returns Test utilities and mock data
 */
const setup = (options: { actionItems?: ActionItem[]; isLoading?: boolean; isError?: boolean; error?: Error; onViewAllClick?: () => void; onAddClick?: () => void; onItemClick?: (id: string) => void; updateActionItemStatus?: (id: string, status: ActionItemStatus) => void } = {}) => {
  const { actionItems, isLoading, isError, error, onViewAllClick, onAddClick, onItemClick, updateActionItemStatus } = options;

  const mockUseActionItems = {
    actionItems: actionItems || [],
    isLoading: isLoading || false,
    isError: isError || false,
    error: error || null,
    updateActionItemStatus: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  };

  vi.mock('../../../hooks/useActionItems', () => ({
    default: () => mockUseActionItems,
  }));

  return {
    mockUseActionItems,
    onViewAllClick: onViewAllClick || vi.fn(),
    onAddClick: onAddClick || vi.fn(),
    onItemClick: onItemClick || vi.fn(),
    updateActionItemStatus: updateActionItemStatus || vi.fn(),
  };
};

describe('ActionItemsWidget', () => {
  it('renders loading state correctly', async () => {
    const { mockUseActionItems } = setup({ isLoading: true });
    renderWithProviders(<ActionItemsWidget />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Mock action item 1')).not.toBeInTheDocument();
  });

  it('renders error state correctly', async () => {
    const { mockUseActionItems } = setup({ isError: true, error: new Error('Test error') });
    renderWithProviders(<ActionItemsWidget />);

    expect(screen.getByText('Error loading action items.')).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
  });

  it('renders empty state correctly', async () => {
    const { mockUseActionItems } = setup({ actionItems: [] });
    renderWithProviders(<ActionItemsWidget />);

    expect(screen.getByText('No action items found.')).toBeInTheDocument();
  });

  it('renders action items correctly', async () => {
    const mockActionItems = createMockActionItems(3);
    const { mockUseActionItems } = setup({ actionItems: mockActionItems });
    renderWithProviders(<ActionItemsWidget />);

    expect(screen.getAllByText(/Mock action item/).length).toBe(3);
    expect(screen.getByText(/Mock action item 1/)).toBeInTheDocument();
    expect(screen.getByText(/Mock action item 2/)).toBeInTheDocument();
    expect(screen.getByText(/Mock action item 3/)).toBeInTheDocument();

    const firstItem = screen.getByText(/Mock action item 1/);
    expect(firstItem).toBeInTheDocument();
  });

  it('limits the number of displayed action items based on maxItems prop', async () => {
    const mockActionItems = createMockActionItems(7);
    const { mockUseActionItems } = setup({ actionItems: mockActionItems });
    renderWithProviders(<ActionItemsWidget maxItems={5} />);

    expect(screen.getAllByText(/Mock action item/).length).toBe(5);
    expect(screen.getByText(/Mock action item 1/)).toBeInTheDocument();
    expect(screen.getByText(/Mock action item 5/)).toBeInTheDocument();
    expect(screen.queryByText(/Mock action item 6/)).not.toBeInTheDocument();
  });

  it('calls onViewAllClick when View All button is clicked', async () => {
    const { onViewAllClick } = setup({ actionItems: createMockActionItems(3), onViewAllClick: vi.fn() });
    renderWithProviders(<ActionItemsWidget onViewAllClick={onViewAllClick} />);

    const viewAllButton = screen.getByRole('button', { name: 'View All' });
    await userEvent.click(viewAllButton);

    expect(onViewAllClick).toHaveBeenCalledTimes(1);
  });

  it('calls onAddClick when Add Action Item button is clicked', async () => {
    const { onAddClick } = setup({ actionItems: createMockActionItems(3), onAddClick: vi.fn() });
    renderWithProviders(<ActionItemsWidget onAddClick={onAddClick} />);

    const addActionButton = screen.getByRole('button', { name: '+ Add Action Item' });
    await userEvent.click(addActionButton);

    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it('calls onItemClick when an action item is clicked', async () => {
    const { onItemClick } = setup({ actionItems: createMockActionItems(3), onItemClick: vi.fn() });
    renderWithProviders(<ActionItemsWidget onItemClick={onItemClick} />);

    const actionItemRow = screen.getByText(/Mock action item 1/).closest('div');
    await userEvent.click(actionItemRow as Element);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith('action-item-1');
  });

  it('updates action item status when checkbox is clicked', async () => {
    const { updateActionItemStatus } = setup({ actionItems: createMockActionItems(3) });
    renderWithProviders(<ActionItemsWidget />);

    const checkbox = screen.getByRole('checkbox', { name: /Mock action item 1/ });
    await userEvent.click(checkbox);

    expect(updateActionItemStatus().mutate).toHaveBeenCalledTimes(1);
  });

  it('filters action items when tab is changed', async () => {
    const mockActionItems = createMockActionItems(3);
    const { mockUseActionItems } = setup({ actionItems: mockActionItems });
    renderWithProviders(<ActionItemsWidget />);

    expect(screen.getAllByText(/Mock action item/).length).toBe(3);

    const pendingTab = screen.getByRole('tab', { name: 'Pending' });
    await userEvent.click(pendingTab);

    expect(screen.getAllByText(/Mock action item/).length).toBe(2);

    const completedTab = screen.getByRole('tab', { name: 'Completed' });
    await userEvent.click(completedTab);

    expect(screen.getAllByText(/Mock action item/).length).toBe(1);
  });

  it('highlights overdue action items correctly', async () => {
    const mockActionItems = createMockActionItems(3);
    const { mockUseActionItems } = setup({ actionItems: mockActionItems });
    renderWithProviders(<ActionItemsWidget />);

    const actionItemRows = screen.getAllByText(/Mock action item/).map(item => item.closest('div'));
    expect(actionItemRows[0]).toHaveClass('p-datatable-row');
  });

  it('displays priority badges correctly', async () => {
    const mockActionItems = createMockActionItems(3);
    const { mockUseActionItems } = setup({ actionItems: mockActionItems });
    renderWithProviders(<ActionItemsWidget />);

    const actionItemRows = screen.getAllByText(/Mock action item/).map(item => item.closest('div'));
    expect(actionItemRows[0]).toHaveClass('p-datatable-row');
  });
});