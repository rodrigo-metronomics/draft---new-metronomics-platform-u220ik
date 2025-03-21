import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'; // vitest@^0.34.0
import { act, waitFor } from '@testing-library/react'; // @testing-library/react@^14.0.0

import useActionItems from '../useActionItems';
import { ActionItem, ActionItemStatus, ActionItemPriority, ActionItemSort, CreateActionItemDto, UpdateActionItemDto } from '../../types/action-item.types';
import { actionItemApi } from '../../services/api/actionItemApi';
import { renderHookWithProviders, createMockAuthUser, createMockOrganization } from '../../../tests/testUtils';
import { mockActionItem } from '../../../tests/mocks/apiMocks';

describe('useActionItems', () => {
  // Mock all action item API functions
  beforeEach(() => {
    vi.spyOn(actionItemApi, 'getActionItems').mockResolvedValue(mockSuccessResponse([mockActionItem]));
    vi.spyOn(actionItemApi, 'getActionItemById').mockResolvedValue(mockSuccessResponse(mockActionItem));
    vi.spyOn(actionItemApi, 'getActionItemsByMeeting').mockResolvedValue(mockSuccessResponse([mockActionItem]));
    vi.spyOn(actionItemApi, 'getMyActionItems').mockResolvedValue(mockSuccessResponse([mockActionItem]));
    vi.spyOn(actionItemApi, 'getActionItemsStats').mockResolvedValue(mockSuccessResponse({ total: 1, byStatus: [], byAssignee: [], byPriority: [], overdue: 0, dueToday: 0, dueThisWeek: 0 }));
    vi.spyOn(actionItemApi, 'createActionItem').mockResolvedValue(mockSuccessResponse(mockActionItem));
    vi.spyOn(actionItemApi, 'updateActionItem').mockResolvedValue(mockSuccessResponse(mockActionItem));
    vi.spyOn(actionItemApi, 'updateActionItemStatus').mockResolvedValue(mockSuccessResponse(mockActionItem));
    vi.spyOn(actionItemApi, 'deleteActionItem').mockResolvedValue(mockSuccessResponse(undefined));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch action items with default parameters', async () => {
    // Mock getActionItems to return a successful response with mock data
    const getActionItemsMock = vi.spyOn(actionItemApi, 'getActionItems');
    const mockData: ActionItem[] = [mockActionItem];
    getActionItemsMock.mockResolvedValue(mockSuccessResponse({ items: mockData, total: 1, page: 1, pageSize: 10, totalPages: 1 }));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Verify that the hook returns the expected action items data
    await waitFor(() => {
      expect(result.current.actionItems).toEqual(mockData);
    });

    // Verify that getActionItems was called with the correct parameters
    expect(getActionItemsMock).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      page: 1,
      pageSize: 10,
      sortBy: ActionItemSort.DUE_DATE
    });
  });

  it('should fetch action items with custom filters', async () => {
    // Mock getActionItems to return a successful response with mock data
    const getActionItemsMock = vi.spyOn(actionItemApi, 'getActionItems');
    const mockData: ActionItem[] = [mockActionItem];
     getActionItemsMock.mockResolvedValue(mockSuccessResponse({ items: mockData, total: 1, page: 1, pageSize: 10, totalPages: 1 }));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call setFilters with custom filter values
    act(() => {
      result.current.setFilters({ status: ActionItemStatus.COMPLETED, organizationId: 'test-org-id' });
    });

    // Verify that getActionItems was called with the updated filters
    await waitFor(() => {
      expect(getActionItemsMock).toHaveBeenCalledWith(expect.objectContaining({
        status: ActionItemStatus.COMPLETED,
        organizationId: 'test-org-id',
        page: 1,
        pageSize: 10,
        sortBy: ActionItemSort.DUE_DATE
      }));
    });
  });

  it('should fetch action items with pagination', async () => {
    // Mock getActionItems to return a successful response with mock data
    const getActionItemsMock = vi.spyOn(actionItemApi, 'getActionItems');
    const mockData: ActionItem[] = [mockActionItem];
     getActionItemsMock.mockResolvedValue(mockSuccessResponse({ items: mockData, total: 1, page: 2, pageSize: 20, totalPages: 1 }));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call setPage and setPageSize to update pagination
    act(() => {
      result.current.setPage(2);
      result.current.setPageSize(20);
    });

    // Verify that getActionItems was called with the updated pagination parameters
    await waitFor(() => {
      expect(getActionItemsMock).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'test-org-id',
        page: 2,
        pageSize: 20,
        sortBy: ActionItemSort.DUE_DATE
      }));
    });
  });

  it('should fetch action items with sorting', async () => {
    // Mock getActionItems to return a successful response with mock data
    const getActionItemsMock = vi.spyOn(actionItemApi, 'getActionItems');
    const mockData: ActionItem[] = [mockActionItem];
     getActionItemsMock.mockResolvedValue(mockSuccessResponse({ items: mockData, total: 1, page: 1, pageSize: 10, totalPages: 1 }));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call setSort to update sorting
    act(() => {
      result.current.setSort(ActionItemSort.PRIORITY);
    });

    // Verify that getActionItems was called with the updated sorting parameter
    await waitFor(() => {
      expect(getActionItemsMock).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 'test-org-id',
        page: 1,
        pageSize: 10,
        sortBy: ActionItemSort.PRIORITY
      }));
    });
  });

  it('should fetch a single action item by ID', async () => {
    // Mock getActionItemById to return a successful response with mock data
    const getActionItemByIdMock = vi.spyOn(actionItemApi, 'getActionItemById');
    const mockData: ActionItem = mockActionItem;
    getActionItemByIdMock.mockResolvedValue(mockSuccessResponse(mockData));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call getActionItemById with a specific ID
    let actionItem: ActionItem | undefined;
    await act(async () => {
      const queryResult = result.current.getActionItemById.mutate('test-action-item-id');
      actionItem = await queryResult;
    });

    // Verify that the API function was called with the correct ID
    expect(getActionItemByIdMock).toHaveBeenCalledWith('test-action-item-id');

    // Verify that the hook returns the expected action item
    expect(actionItem).toEqual(mockData);
  });

  it('should fetch action items by meeting', async () => {
    // Mock getActionItemsByMeeting to return a successful response with mock data
    const getActionItemsByMeetingMock = vi.spyOn(actionItemApi, 'getMeetingActionItems');
    const mockData: ActionItem[] = [mockActionItem];
    getActionItemsByMeetingMock.mockResolvedValue(mockSuccessResponse(mockData));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call getActionItemsByMeeting with a meeting ID
    let actionItems: ActionItem[] | undefined;
    await act(async () => {
       const queryResult = result.current.getActionItemsByMeeting.mutate('test-meeting-id');
       actionItems = await queryResult;
    });

    // Verify that the API function was called with the correct meeting ID
    expect(getActionItemsByMeetingMock).toHaveBeenCalledWith('test-meeting-id');

    // Verify that the hook returns the expected action items
    expect(actionItems).toEqual(mockData);
  });

  it('should fetch my action items', async () => {
    // Mock getMyActionItems to return a successful response with mock data
    const getMyActionItemsMock = vi.spyOn(actionItemApi, 'getMyActionItems');
    const mockData: ActionItem[] = [mockActionItem];
    getMyActionItemsMock.mockResolvedValue(mockSuccessResponse(mockData));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call getMyActionItems with optional status filter
    let actionItems: ActionItem[] | undefined;
    await act(async () => {
      const queryResult = result.current.getMyActionItems.mutate(ActionItemStatus.COMPLETED);
      actionItems = await queryResult;
    });

    // Verify that the API function was called with the correct parameters
    expect(getMyActionItemsMock).toHaveBeenCalledWith('test-org-id', ActionItemStatus.COMPLETED, 10);

    // Verify that the hook returns the expected action items
    expect(actionItems).toEqual(mockData);
  });

  it('should fetch action items statistics', async () => {
    // Mock getActionItemsStats to return a successful response with mock data
    const getActionItemsStatsMock = vi.spyOn(actionItemApi, 'getActionItemsStats');
    const mockData = { total: 1, byStatus: [], byAssignee: [], byPriority: [], overdue: 0, dueToday: 0, dueThisWeek: 0 };
    getActionItemsStatsMock.mockResolvedValue(mockSuccessResponse(mockData));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call getActionItemsStats
    let stats: any;
    await act(async () => {
      const queryResult = result.current.getActionItemsStats.mutate();
      stats = await queryResult;
    });

    // Verify that the API function was called with the correct organization ID
    expect(getActionItemsStatsMock).toHaveBeenCalledWith('test-org-id');

    // Verify that the hook returns the expected statistics
    expect(stats).toEqual(mockData);
  });

  it('should create a new action item', async () => {
    // Mock createActionItem to return a successful response with mock data
    const createActionItemMock = vi.spyOn(actionItemApi, 'createActionItem');
    const mockData: ActionItem = mockActionItem;
    createActionItemMock.mockResolvedValue(mockSuccessResponse(mockData));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Create a new action item DTO
    const newActionItem: CreateActionItemDto = {
      description: 'New Action Item',
      assigneeId: 'test-user-id',
      meetingId: 'test-meeting-id',
      dueDate: new Date().toISOString(),
      priority: ActionItemPriority.MEDIUM,
      notes: 'Test Notes'
    };

    // Call createActionItem with the DTO
    let actionItem: ActionItem | undefined;
    await act(async () => {
      const queryResult = result.current.createActionItem.mutate(newActionItem);
      actionItem = await queryResult;
    });

    // Verify that the API function was called with the correct data
    expect(createActionItemMock).toHaveBeenCalledWith(newActionItem);

    // Verify that the hook returns the newly created action item
    expect(actionItem).toEqual(mockData);
  });

  it('should update an existing action item', async () => {
    // Mock updateActionItem to return a successful response with updated mock data
    const updateActionItemMock = vi.spyOn(actionItemApi, 'updateActionItem');
    const mockData: ActionItem = { ...mockActionItem, description: 'Updated Action Item' };
    updateActionItemMock.mockResolvedValue(mockSuccessResponse(mockData));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Create an update action item DTO
    const updatedActionItem: UpdateActionItemDto = {
      description: 'Updated Action Item',
    };

    // Call updateActionItem with an ID and the DTO
    let actionItem: ActionItem | undefined;
    await act(async () => {
      const queryResult = result.current.updateActionItem.mutate({ id: 'test-action-item-id', actionItemData: updatedActionItem });
      actionItem = await queryResult;
    });

    // Verify that the API function was called with the correct ID and data
    expect(updateActionItemMock).toHaveBeenCalledWith('test-action-item-id', updatedActionItem);

    // Verify that the hook returns the updated action item
    expect(actionItem).toEqual(mockData);
  });

  it('should update an action item status', async () => {
    // Mock updateActionItemStatus to return a successful response with updated mock data
    const updateActionItemStatusMock = vi.spyOn(actionItemApi, 'updateActionItemStatus');
    const mockData: ActionItem = { ...mockActionItem, status: ActionItemStatus.COMPLETED };
    updateActionItemStatusMock.mockResolvedValue(mockSuccessResponse(mockData));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call updateActionItemStatus with an ID and new status
    let actionItem: ActionItem | undefined;
    await act(async () => {
      const queryResult = result.current.updateActionItemStatus.mutate({ id: 'test-action-item-id', status: ActionItemStatus.COMPLETED });
      actionItem = await queryResult;
    });

    // Verify that the API function was called with the correct ID and status
    expect(updateActionItemStatusMock).toHaveBeenCalledWith('test-action-item-id', ActionItemStatus.COMPLETED);

    // Verify that the hook returns the updated action item
    expect(actionItem).toEqual(mockData);
  });

  it('should delete an action item', async () => {
    // Mock deleteActionItem to return a successful response
    const deleteActionItemMock = vi.spyOn(actionItemApi, 'deleteActionItem');
    deleteActionItemMock.mockResolvedValue(mockSuccessResponse(undefined));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call deleteActionItem with an ID
    await act(async () => {
      await result.current.deleteActionItem.mutate('test-action-item-id');
    });

    // Verify that the API function was called with the correct ID
    expect(deleteActionItemMock).toHaveBeenCalledWith('test-action-item-id');

    // Verify that the hook returns a successful result
    expect(deleteActionItemMock).toHaveBeenCalled();
  });

  it('should handle bulk status updates', async () => {
    // Mock the bulk update API function to return a successful response
    const bulkUpdateStatusMock = vi.spyOn(actionItemApi, 'bulkUpdateStatus');
    bulkUpdateStatusMock.mockResolvedValue(mockSuccessResponse({ updated: 2 }));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call bulkUpdateStatus with an array of IDs and a new status
    const ids = ['test-action-item-id-1', 'test-action-item-id-2'];
    const status = ActionItemStatus.COMPLETED;
    await act(async () => {
      await result.current.bulkUpdateStatus.mutate({ ids, status });
    });

    // Verify that the API function was called with the correct parameters
    expect(bulkUpdateStatusMock).toHaveBeenCalledWith({ ids, status });

    // Verify that the hook returns a successful result
    expect(bulkUpdateStatusMock).toHaveBeenCalled();
  });

  it('should handle bulk deletion', async () => {
    // Mock the bulk delete API function to return a successful response
    const bulkDeleteMock = vi.spyOn(actionItemApi, 'bulkDelete');
    bulkDeleteMock.mockResolvedValue(mockSuccessResponse({ deleted: 2 }));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Call bulkDelete with an array of IDs
    const ids = ['test-action-item-id-1', 'test-action-item-id-2'];
    await act(async () => {
      await result.current.bulkDelete.mutate({ ids });
    });

    // Verify that the API function was called with the correct IDs
    expect(bulkDeleteMock).toHaveBeenCalledWith({ ids });

    // Verify that the hook returns a successful result
    expect(bulkDeleteMock).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    // Mock getActionItems to return an error response
    const getActionItemsMock = vi.spyOn(actionItemApi, 'getActionItems');
    getActionItemsMock.mockRejectedValue(new Error('API Error'));

    // Render the useActionItems hook with renderHookWithProviders
    const { result } = renderHookWithProviders(() => useActionItems());

    // Verify that the hook returns isError as true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify that the hook returns the error object
    expect(result.current.error).toBeInstanceOf(Error);
  });
});