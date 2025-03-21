# src/web/src/hooks/useActionItems.ts
```typescript
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query'; // react-query@^3.39.3
import { useState, useCallback, useEffect } from 'react'; // react@^18.2.0

import {
  ActionItem, ActionItemFilters, ActionItemsResponse, ActionItemStatus, ActionItemPriority, CreateActionItemDto, UpdateActionItemDto, ActionItemSort, ActionItemStats, ActionItemListParams, BulkStatusUpdateDto, BulkDeleteDto
} from '../types/action-item.types';
import { actionItemApi } from '../services/api/actionItemApi';
import useOrganization from './useOrganization';
import useAuth from './useAuth';

/**
 * Custom hook for managing action items data and operations
 * @param options 
 * @returns Action items data and operations including queries, mutations, and utility functions
 */
export const useActionItems = (options?: UseQueryOptions<ActionItem[]>) => {
  // Initialize React Query client for cache management
  const queryClient = useQueryClient();

  // Get current organization ID from useOrganization hook
  const { getPersistedOrganization } = useOrganization();
  const persistedOrgId = getPersistedOrganization();
  const organizationId = persistedOrgId || '';

  // Get current user information from useAuth hook
  const { state: authState } = useAuth();
  const userId = authState.user?.id;

  // Initialize state for filters, pagination, and sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<ActionItemFilters>({ organizationId: organizationId });
  const [sort, setSort] = useState<ActionItemSort>(ActionItemSort.DUE_DATE);

  // Define query key factory functions for consistent cache management
  const actionItemQueryKeys = {
    all: () => ['actionItems'] as const,
    lists: (filters: ActionItemFilters, page: number, pageSize: number, sort: ActionItemSort) =>
      [...actionItemQueryKeys.all(), 'list', filters, page, pageSize, sort] as const,
    details: () => [...actionItemQueryKeys.all(), 'detail'] as const,
    detail: (id: string) => [...actionItemQueryKeys.details(), id] as const,
    meetingActionItems: (meetingId: string) => [...actionItemQueryKeys.all(), 'meeting', meetingId] as const,
    myActionItems: (organizationId: string, status?: ActionItemStatus) => [...actionItemQueryKeys.all(), 'myItems', organizationId, status] as const,
    stats: (organizationId: string) => [...actionItemQueryKeys.all(), 'stats', organizationId] as const
  };

  // Implement useGetActionItems query for fetching action items with filters, pagination, and sorting
  const useGetActionItems = (queryOptions?: UseQueryOptions<ActionItem[]>) => {
    const params: ActionItemListParams = {
      ...filters,
      page: page,
      pageSize: pageSize,
      sortBy: sort
    };

    return useQuery<ActionItem[]>(
      actionItemQueryKeys.lists(filters, page, pageSize, sort),
      () => actionItemApi.getActionItems(params)
        .then(res => {
          return res.data.items;
        }),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetActionItemById query for fetching a single action item by ID
  const useGetActionItemById = (id: string, queryOptions?: UseQueryOptions<ActionItem>) => {
    return useQuery<ActionItem>(
      actionItemQueryKeys.detail(id),
      () => actionItemApi.getActionItemById(id)
        .then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetActionItemsByMeeting query for fetching action items associated with a meeting
  const useGetActionItemsByMeeting = (meetingId: string, queryOptions?: UseQueryOptions<ActionItem[]>) => {
    return useQuery<ActionItem[]>(
      actionItemQueryKeys.meetingActionItems(meetingId),
      () => actionItemApi.getMeetingActionItems(meetingId)
        .then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMyActionItems query for fetching action items assigned to the current user
  const useGetMyActionItems = (status?: ActionItemStatus, limit: number = 10, queryOptions?: UseQueryOptions<ActionItem[]>) => {
    return useQuery<ActionItem[]>(
      actionItemQueryKeys.myActionItems(organizationId, status),
      () => actionItemApi.getMyActionItems(organizationId, status, limit)
        .then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetActionItemsStats query for fetching action item statistics
  const useGetActionItemsStats = (queryOptions?: UseQueryOptions<ActionItemStats>) => {
    return useQuery<ActionItemStats>(
      actionItemQueryKeys.stats(organizationId),
      () => actionItemApi.getActionItemsStats(organizationId)
        .then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateActionItem mutation for creating new action items
  const useCreateActionItem = () => {
    return useMutation(
      (actionItemData: CreateActionItemDto) => actionItemApi.createActionItem(actionItemData)
        .then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(actionItemQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateActionItem mutation for updating existing action items
  const useUpdateActionItem = () => {
    return useMutation(
      ({ id, actionItemData }: { id: string, actionItemData: UpdateActionItemDto }) =>
        actionItemApi.updateActionItem(id, actionItemData)
          .then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(actionItemQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateActionItemStatus mutation for updating only the status of an action item
  const useUpdateActionItemStatus = () => {
    return useMutation(
      ({ id, status }: { id: string, status: ActionItemStatus }) =>
        actionItemApi.updateActionItemStatus(id, status)
          .then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(actionItemQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeleteActionItem mutation for deleting action items
  const useDeleteActionItem = () => {
    return useMutation(
      (id: string) => actionItemApi.deleteActionItem(id)
        .then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(actionItemQueryKeys.all());
        },
      }
    );
  };

  // Implement useBulkUpdateStatus mutation for updating status of multiple action items
  const useBulkUpdateStatus = () => {
    return useMutation(
      (updateData: BulkStatusUpdateDto) => actionItemApi.bulkUpdateStatus(updateData)
        .then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(actionItemQueryKeys.all());
        },
      }
    );
  };

  // Implement useBulkDelete mutation for deleting multiple action items
  const useBulkDelete = () => {
    return useMutation(
      (deleteData: BulkDeleteDto) => actionItemApi.bulkDelete(deleteData)
        .then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(actionItemQueryKeys.all());
        },
      }
    );
  };

  // Implement filter, pagination, and sorting state management functions
  const setPageHandler = (newPage: number) => {
    setPage(newPage);
  };

  const setPageSizeHandler = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };

  const setFiltersHandler = (newFilters: ActionItemFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const setSortHandler = (newSort: ActionItemSort) => {
    setSort(newSort);
    setPage(1); // Reset to first page when sort changes
  };

  const { data: actionItems, isLoading, isError, error, refetch } = useGetActionItems();

  // Fetch total items and total pages from the API response
  // const totalItems = data?.total || 0;
  // const totalPages = data?.totalPages || 0;
  const totalItems = 0;
  const totalPages = 0;

  // Return all queries, mutations, and utility functions
  return {
    actionItems: actionItems || [],
    isLoading,
    isError,
    error,
    totalItems,
    totalPages,
    page,
    pageSize,
    filters,
    sort,
    setPage: setPageHandler,
    setPageSize: setPageSizeHandler,
    setFilters: setFiltersHandler,
    setSort: setSortHandler,
    refetch,
    getActionItemById: useGetActionItemById,
    getActionItemsByMeeting: useGetActionItemsByMeeting,
    getMyActionItems: useGetMyActionItems,
    getActionItemsStats: useGetActionItemsStats,
    createActionItem: useCreateActionItem,
    updateActionItem: useUpdateActionItem,
    updateActionItemStatus: useUpdateActionItemStatus,
    deleteActionItem: useDeleteActionItem,
    bulkUpdateStatus: useBulkUpdateStatus,
    bulkDelete: useBulkDelete
  };
};