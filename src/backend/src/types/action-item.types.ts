/**
 * TypeScript type definitions for action items in the Metronomics Platform.
 * This file defines interfaces, enums, and types for action items, their statuses,
 * priorities, and related API request/response types.
 */

import { User } from './user.types';
import { Meeting } from './meeting.types';

/**
 * Enum defining the possible statuses for an action item
 */
export enum ActionItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED'
}

/**
 * Enum defining the possible priority levels for an action item
 */
export enum ActionItemPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Interface defining the structure of an action item
 */
export interface ActionItem {
  id: string;
  description: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  dueDate: Date | null;
  assigneeId: string;
  assignee: User;
  meetingId: string;
  meeting: Meeting;
  organizationId: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

/**
 * Data transfer object for creating a new action item
 */
export interface CreateActionItemDto {
  description: string;
  assigneeId: string;
  meetingId: string;
  dueDate: Date | null;
  priority: ActionItemPriority;
  notes: string | null;
}

/**
 * Data transfer object for updating an existing action item
 */
export interface UpdateActionItemDto {
  description: string | undefined;
  status: ActionItemStatus | undefined;
  priority: ActionItemPriority | undefined;
  dueDate: Date | null | undefined;
  assigneeId: string | undefined;
  notes: string | null | undefined;
}

/**
 * Interface for filtering action items by various criteria
 */
export interface ActionItemFilters {
  status?: ActionItemStatus;
  assigneeId?: string;
  meetingId?: string;
  priority?: ActionItemPriority;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  organizationId: string;
}

/**
 * Response structure for paginated action item queries
 */
export interface ActionItemsResponse {
  items: ActionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Structure for grouping action items by status
 */
export interface ActionItemsByStatus {
  status: ActionItemStatus;
  count: number;
}

/**
 * Structure for grouping action items by assignee
 */
export interface ActionItemsByAssignee {
  assigneeId: string;
  assigneeName: string;
  count: number;
}

/**
 * Simplified reference to an action item to prevent circular dependencies
 */
export interface ActionItemReference {
  id: string;
  description: string;
  assigneeId: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  dueDate: Date | null;
  meetingId: string;
}

/**
 * Data transfer object for bulk updating action item statuses
 */
export interface BulkStatusUpdateDto {
  ids: string[];
  status: ActionItemStatus;
}

/**
 * Data transfer object for bulk deleting action items
 */
export interface BulkDeleteDto {
  ids: string[];
}