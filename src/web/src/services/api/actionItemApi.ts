import { get, post, put, delete as deleteRequest } from './index';
import { 
  ActionItem, 
  ActionItemStatus, 
  ActionItemPriority, 
  CreateActionItemDto, 
  UpdateActionItemDto, 
  ActionItemFilters, 
  ActionItemSort, 
  ActionItemsResponse, 
  ActionItemStats, 
  ActionItemListParams, 
  BulkStatusUpdateDto, 
  BulkDeleteDto 
} from '../../types/action-item.types';
import { ApiResponse } from '../../types/api.types';

/**
 * Fetches a paginated list of action items based on provided filters and sorting options
 * @param params - Filters, pagination, and sorting parameters
 * @returns Promise resolving to a paginated list of action items
 */
const getActionItems = (
  params: ActionItemListParams
): Promise<ApiResponse<ActionItemsResponse>> => {
  return get<ActionItemsResponse>('/api/action-items', params);
};

/**
 * Fetches a single action item by its ID
 * @param id - Action item ID
 * @returns Promise resolving to the requested action item
 */
const getActionItemById = (
  id: string
): Promise<ApiResponse<ActionItem>> => {
  return get<ActionItem>(`/api/action-items/${id}`);
};

/**
 * Fetches action items assigned to the current user
 * @param organizationId - Organization ID for filtering
 * @param status - Optional filter by status
 * @param limit - Maximum number of items to fetch
 * @returns Promise resolving to a list of the user's action items
 */
const getMyActionItems = (
  organizationId: string,
  status?: ActionItemStatus,
  limit: number = 10
): Promise<ApiResponse<ActionItem[]>> => {
  const params = { 
    organizationId,
    status,
    limit
  };
  
  return get<ActionItem[]>('/api/action-items/my-items', params);
};

/**
 * Fetches statistics about action items for an organization
 * @param organizationId - Organization ID
 * @returns Promise resolving to action item statistics
 */
const getActionItemStats = (
  organizationId: string
): Promise<ApiResponse<ActionItemStats>> => {
  return get<ActionItemStats>('/api/action-items/stats', { organizationId });
};

/**
 * Creates a new action item
 * @param actionItemData - Action item data
 * @returns Promise resolving to the newly created action item
 */
const createActionItem = (
  actionItemData: CreateActionItemDto
): Promise<ApiResponse<ActionItem>> => {
  return post<ActionItem>('/api/action-items', actionItemData);
};

/**
 * Updates an existing action item
 * @param id - Action item ID
 * @param actionItemData - Updated action item data
 * @returns Promise resolving to the updated action item
 */
const updateActionItem = (
  id: string,
  actionItemData: UpdateActionItemDto
): Promise<ApiResponse<ActionItem>> => {
  return put<ActionItem>(`/api/action-items/${id}`, actionItemData);
};

/**
 * Updates only the status of an action item
 * @param id - Action item ID
 * @param status - New status
 * @returns Promise resolving to the updated action item
 */
const updateActionItemStatus = (
  id: string,
  status: ActionItemStatus
): Promise<ApiResponse<ActionItem>> => {
  return put<ActionItem>(`/api/action-items/${id}/status`, { status });
};

/**
 * Deletes an action item
 * @param id - Action item ID
 * @returns Promise resolving when the action item is deleted
 */
const deleteActionItem = (
  id: string
): Promise<ApiResponse<void>> => {
  return deleteRequest<void>(`/api/action-items/${id}`);
};

/**
 * Updates the status of multiple action items at once
 * @param updateData - IDs and new status
 * @returns Promise resolving to the number of updated items
 */
const bulkUpdateStatus = (
  updateData: BulkStatusUpdateDto
): Promise<ApiResponse<{ updated: number }>> => {
  return put<{ updated: number }>('/api/action-items/bulk-status', updateData);
};

/**
 * Deletes multiple action items at once
 * @param deleteData - IDs to delete
 * @returns Promise resolving to the number of deleted items
 */
const bulkDelete = (
  deleteData: BulkDeleteDto
): Promise<ApiResponse<{ deleted: number }>> => {
  return deleteRequest<{ deleted: number }>('/api/action-items/bulk', deleteData);
};

/**
 * Fetches action items associated with a specific meeting
 * @param meetingId - Meeting ID
 * @returns Promise resolving to a list of meeting action items
 */
const getMeetingActionItems = (
  meetingId: string
): Promise<ApiResponse<ActionItem[]>> => {
  return get<ActionItem[]>(`/api/meetings/${meetingId}/action-items`);
};

export const actionItemApi = {
  getActionItems,
  getActionItemById,
  getMyActionItems,
  getActionItemStats,
  createActionItem,
  updateActionItem,
  updateActionItemStatus,
  deleteActionItem,
  bulkUpdateStatus,
  bulkDelete,
  getMeetingActionItems
};