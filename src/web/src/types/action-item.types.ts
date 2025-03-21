/**
 * TypeScript type definitions for action items in the Metronomics Platform frontend.
 * This file defines the interfaces, enums, and types used for action items, including
 * their structure, status types, priorities, and related request/response types for API interactions.
 */

import { ID, Timestamp, PaginatedResult, PaginationParams } from './common.types';
import { User } from './user.types';
import { Meeting } from './meeting.types';

/**
 * Enum for action item status in the Metronomics Platform.
 * Represents the current state of an action item.
 */
export enum ActionItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled'
}

/**
 * Enum for action item priority levels in the Metronomics Platform.
 * Used to indicate the importance and urgency of action items.
 */
export enum ActionItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interface for an action item entity.
 * Represents a task assigned during meetings that needs to be completed.
 */
export interface ActionItem {
  id: ID;
  description: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  dueDate: Timestamp | null;
  assigneeId: ID;
  assignee: User | null;
  meetingId: ID;
  meeting: Meeting | null;
  organizationId: ID;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

/**
 * Data transfer object for creating a new action item.
 * Contains all required fields to create an action item in the system.
 */
export interface CreateActionItemDto {
  description: string;
  assigneeId: ID;
  meetingId: ID;
  dueDate: Timestamp | null;
  priority: ActionItemPriority;
  notes: string | null;
}

/**
 * Data transfer object for updating an existing action item.
 * Contains fields that can be updated for an action item.
 */
export interface UpdateActionItemDto {
  description?: string;
  status?: ActionItemStatus;
  priority?: ActionItemPriority;
  dueDate?: Timestamp | null;
  assigneeId?: ID;
  notes?: string | null;
}

/**
 * Interface for filtering action items by various criteria.
 * Used to search and filter action items in list views.
 */
export interface ActionItemFilters {
  status?: ActionItemStatus;
  assigneeId?: ID;
  meetingId?: ID;
  priority?: ActionItemPriority;
  dueDateFrom?: Timestamp;
  dueDateTo?: Timestamp;
  organizationId: ID;
  search?: string;
}

/**
 * Enum for action item sort field options.
 * Defines the possible fields to sort action item lists by.
 */
export enum ActionItemSort {
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

/**
 * Response format for paginated action item queries.
 * Extends the generic paginated result with action item type.
 */
export interface ActionItemsResponse extends PaginatedResult<ActionItem> {}

/**
 * Structure for grouping action items by status.
 * Used for aggregated views and statistics.
 */
export interface ActionItemsByStatus {
  status: ActionItemStatus;
  count: number;
}

/**
 * Structure for grouping action items by assignee.
 * Used for aggregated views and statistics.
 */
export interface ActionItemsByAssignee {
  assigneeId: ID;
  assigneeName: string;
  count: number;
}

/**
 * Structure for grouping action items by priority.
 * Used for aggregated views and statistics.
 */
export interface ActionItemsByPriority {
  priority: ActionItemPriority;
  count: number;
}

/**
 * Comprehensive statistics about action items.
 * Used for dashboards and reporting.
 */
export interface ActionItemStats {
  total: number;
  byStatus: ActionItemsByStatus[];
  byAssignee: ActionItemsByAssignee[];
  byPriority: ActionItemsByPriority[];
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

/**
 * Parameters for paginated action item lists with filtering and sorting.
 * Extends both action item filters and pagination parameters.
 */
export interface ActionItemListParams extends ActionItemFilters, PaginationParams {
  sortBy: ActionItemSort;
}

/**
 * Data transfer object for bulk updating action item statuses.
 * Contains IDs of action items to update and the new status.
 */
export interface BulkStatusUpdateDto {
  ids: ID[];
  status: ActionItemStatus;
}

/**
 * Data transfer object for bulk deleting action items.
 * Contains IDs of action items to delete.
 */
export interface BulkDeleteDto {
  ids: ID[];
}

/**
 * Simplified reference to an action item to prevent circular dependencies.
 * Contains essential information about an action item for display in other contexts.
 */
export interface ActionItemReference {
  id: ID;
  description: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  dueDate: Timestamp | null;
  assigneeId: ID;
  assigneeName: string;
}