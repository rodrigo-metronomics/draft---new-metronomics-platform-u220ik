// actionItemService.ts
import { ActionItemRepository } from '../../repositories/actionItemRepository';
import { MeetingRepository } from '../../repositories/meetingRepository';
import { UserRepository } from '../../repositories/userRepository';
import { NotificationService } from '../notification/notificationService';
import { RealtimeService } from '../realtime/realtimeService';
import {
  ActionItem,
  CreateActionItemDto,
  UpdateActionItemDto,
  ActionItemFilters,
  ActionItemsResponse,
  ActionItemStatus,
  ActionItemsByStatus,
  ActionItemsByAssignee,
  BulkStatusUpdateDto,
  BulkDeleteDto,
  NotificationType,
  NotificationPriority
} from '../../types/action-item.types';
import { PaginationParams } from '../../utils/helpers/paginationHelper';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors';
import { logger } from '../../utils/helpers/logger';

/**
 * Service class for managing action items in the Metronomics Platform
 */
export class ActionItemService {
  private actionItemRepository: ActionItemRepository;
  private meetingRepository: MeetingRepository;
  private userRepository: UserRepository;
  private notificationService: NotificationService;
  private realtimeService: RealtimeService;

  /**
   * Initializes the ActionItemService with required dependencies
   * @param actionItemRepository Data access for action items
   * @param meetingRepository Data access for meetings
   * @param userRepository Data access for users
   * @param notificationService Sending notifications for action items
   * @param realtimeService Real-time updates for action items
   */
  constructor(
    actionItemRepository: ActionItemRepository,
    meetingRepository: MeetingRepository,
    userRepository: UserRepository,
    notificationService: NotificationService,
    realtimeService: RealtimeService
  ) {
    this.actionItemRepository = actionItemRepository;
    this.meetingRepository = meetingRepository;
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.realtimeService = realtimeService;
  }

  /**
   * Retrieves an action item by its ID
   * @param id The ID of the action item
   * @param organizationId The ID of the organization
   * @returns The action item if found
   * @throws ValidationError if the ID is invalid
   * @throws NotFoundError if the action item is not found
   * @throws AuthorizationError if the action item does not belong to the organization
   */
  async getActionItemById(id: string, organizationId: string): Promise<ActionItem> {
    if (!id) {
      throw new ValidationError('Action item ID is required');
    }

    const actionItem = await this.actionItemRepository.findById(id);

    if (!actionItem) {
      throw new NotFoundError(`Action item with ID ${id} not found`);
    }

    if (actionItem.organizationId !== organizationId) {
      throw new AuthorizationError('Action item does not belong to this organization');
    }

    return actionItem;
  }

  /**
   * Retrieves action items based on filters with pagination
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @returns Paginated action items matching the filters
   * @throws ValidationError if the filters are invalid
   */
  async getActionItems(filters: ActionItemFilters, pagination: PaginationParams): Promise<ActionItemsResponse> {
    if (!filters) {
      throw new ValidationError('Filters are required');
    }

    return await this.actionItemRepository.findByFilters(filters, pagination);
  }

  /**
   * Retrieves action items for a specific meeting
   * @param meetingId The ID of the meeting
   * @param organizationId The ID of the organization
   * @param pagination Pagination parameters
   * @returns Paginated action items for the meeting
   * @throws ValidationError if the meetingId is invalid
   * @throws NotFoundError if the meeting is not found
   * @throws AuthorizationError if the meeting does not belong to the organization
   */
  async getActionItemsByMeeting(meetingId: string, organizationId: string, pagination: PaginationParams): Promise<ActionItemsResponse> {
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    const meeting = await this.meetingRepository.findById(meetingId);

    if (!meeting) {
      throw new NotFoundError(`Meeting with ID ${meetingId} not found`);
    }

    if (meeting.organizationId !== organizationId) {
      throw new AuthorizationError('Meeting does not belong to this organization');
    }

    return await this.actionItemRepository.findByMeeting(meetingId, organizationId, pagination);
  }

  /**
   * Retrieves action items assigned to a specific user
   * @param assigneeId The ID of the assignee
   * @param organizationId The ID of the organization
   * @param pagination Pagination parameters
   * @returns Paginated action items assigned to the user
   * @throws ValidationError if the assigneeId is invalid
   * @throws NotFoundError if the user is not found
   * @throws AuthorizationError if the user does not belong to the organization
   */
  async getActionItemsByAssignee(assigneeId: string, organizationId: string, pagination: PaginationParams): Promise<ActionItemsResponse> {
    if (!assigneeId) {
      throw new ValidationError('Assignee ID is required');
    }

    const user = await this.userRepository.findById(assigneeId);

    if (!user) {
      throw new NotFoundError(`User with ID ${assigneeId} not found`);
    }

    if (user.organizationId !== organizationId) {
      throw new AuthorizationError('User does not belong to this organization');
    }

    return await this.actionItemRepository.findByAssignee(assigneeId, organizationId, pagination);
  }

  /**
   * Retrieves overdue action items for an organization
   * @param organizationId The ID of the organization
   * @param pagination Pagination parameters
   * @returns Paginated overdue action items
   * @throws ValidationError if the organizationId is invalid
   */
  async getOverdueActionItems(organizationId: string, pagination: PaginationParams): Promise<ActionItemsResponse> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    return await this.actionItemRepository.findOverdue(organizationId, pagination);
  }

  /**
   * Retrieves upcoming action items due within a specified number of days
   * @param organizationId The ID of the organization
   * @param daysAhead The number of days ahead to look for upcoming action items
   * @param pagination Pagination parameters
   * @returns Paginated upcoming action items
   * @throws ValidationError if the organizationId or daysAhead is invalid
   */
  async getUpcomingActionItems(organizationId: string, daysAhead: number, pagination: PaginationParams): Promise<ActionItemsResponse> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    if (!daysAhead || typeof daysAhead !== 'number' || daysAhead <= 0) {
      throw new ValidationError('Days ahead must be a positive number');
    }

    return await this.actionItemRepository.findUpcoming(organizationId, daysAhead, pagination);
  }

  /**
   * Creates a new action item
   * @param data The action item data
   * @param organizationId The ID of the organization
   * @param createdByUserId The ID of the user creating the action item
   * @returns The created action item
   * @throws ValidationError if the data is invalid
   * @throws NotFoundError if the meeting or assignee is not found
   * @throws AuthorizationError if the meeting or assignee does not belong to the organization
   */
  async createActionItem(data: CreateActionItemDto, organizationId: string, createdByUserId: string): Promise<ActionItem> {
    if (!data) {
      throw new ValidationError('Action item data is required');
    }

    const meeting = await this.meetingRepository.findById(data.meetingId);

    if (!meeting) {
      throw new NotFoundError(`Meeting with ID ${data.meetingId} not found`);
    }

    if (meeting.organizationId !== organizationId) {
      throw new AuthorizationError('Meeting does not belong to this organization');
    }

    const assignee = await this.userRepository.findById(data.assigneeId);

    if (!assignee) {
      throw new NotFoundError(`User with ID ${data.assigneeId} not found`);
    }

    if (assignee.organizationId !== organizationId) {
      throw new AuthorizationError('User does not belong to this organization');
    }

    const actionItemData = {
      ...data,
      organizationId,
    };

    const actionItem = await this.actionItemRepository.create(actionItemData);

    // Send notification to the assignee about the new action item
    await this.notificationService.createNotification({
      type: NotificationType.ACTION_ITEM_ASSIGNED,
      title: 'New Action Item Assigned',
      content: `You have been assigned a new action item: ${data.description}`,
      priority: NotificationPriority.MEDIUM,
      userId: data.assigneeId,
      organizationId: organizationId,
      link: `/meetings/${data.meetingId}`,
      channels: [],
    });

    // If created during a meeting, sync action items with real-time collaboration
    if (data.meetingId) {
      await this.syncActionItemsWithRealtime(data.meetingId, organizationId, createdByUserId);
    }

    return actionItem;
  }

  /**
   * Updates an existing action item
   * @param id The ID of the action item to update
   * @param data The updated action item data
   * @param organizationId The ID of the organization
   * @param updatedByUserId The ID of the user updating the action item
   * @returns The updated action item
   * @throws ValidationError if the data is invalid
   * @throws NotFoundError if the action item is not found
   * @throws AuthorizationError if the action item does not belong to the organization
   */
  async updateActionItem(id: string, data: UpdateActionItemDto, organizationId: string, updatedByUserId: string): Promise<ActionItem> {
    if (!id) {
      throw new ValidationError('Action item ID is required');
    }

    if (!data) {
      throw new ValidationError('Action item data is required');
    }

    const existingActionItem = await this.actionItemRepository.findById(id);

    if (!existingActionItem) {
      throw new NotFoundError(`Action item with ID ${id} not found`);
    }

    if (existingActionItem.organizationId !== organizationId) {
      throw new AuthorizationError('Action item does not belong to this organization');
    }

    if (data.assigneeId) {
      const assignee = await this.userRepository.findById(data.assigneeId);

      if (!assignee) {
        throw new NotFoundError(`User with ID ${data.assigneeId} not found`);
      }

      if (assignee.organizationId !== organizationId) {
        throw new AuthorizationError('User does not belong to this organization');
      }
    }

    const updatedActionItem = await this.actionItemRepository.update(id, data);

    // If status changed, send notification about status change
    if (data.status && data.status !== existingActionItem.status) {
      await this.notificationService.createNotification({
        type: NotificationType.ACTION_ITEM_STATUS_CHANGED,
        title: 'Action Item Status Changed',
        content: `The status of action item "${existingActionItem.description}" has been changed to ${data.status}`,
        priority: NotificationPriority.MEDIUM,
        userId: existingActionItem.assigneeId,
        organizationId: organizationId,
        link: `/meetings/${existingActionItem.meetingId}`,
        channels: [],
      });
    }

    // If assignee changed, send notification to the new assignee
    if (data.assigneeId && data.assigneeId !== existingActionItem.assigneeId) {
      await this.notificationService.createNotification({
        type: NotificationType.ACTION_ITEM_ASSIGNED,
        title: 'New Action Item Assigned',
        content: `You have been assigned a new action item: ${existingActionItem.description}`,
        priority: NotificationPriority.MEDIUM,
        userId: data.assigneeId,
        organizationId: organizationId,
        link: `/meetings/${existingActionItem.meetingId}`,
        channels: [],
      });
    }

    // If the action item is from a meeting, sync updates with real-time collaboration
    if (existingActionItem.meetingId) {
      await this.syncActionItemsWithRealtime(existingActionItem.meetingId, organizationId, updatedByUserId);
    }

    return updatedActionItem;
  }

  /**
   * Deletes an action item
   * @param id The ID of the action item to delete
   * @param organizationId The ID of the organization
   * @returns The deleted action item
   * @throws ValidationError if the ID is invalid
   * @throws NotFoundError if the action item is not found
   * @throws AuthorizationError if the action item does not belong to the organization
   */
  async deleteActionItem(id: string, organizationId: string): Promise<ActionItem> {
    if (!id) {
      throw new ValidationError('Action item ID is required');
    }

    const existingActionItem = await this.actionItemRepository.findById(id);

    if (!existingActionItem) {
      throw new NotFoundError(`Action item with ID ${id} not found`);
    }

    if (existingActionItem.organizationId !== organizationId) {
      throw new AuthorizationError('Action item does not belong to this organization');
    }

    const deletedActionItem = await this.actionItemRepository.delete(id);

    // If the action item is from a meeting, sync deletion with real-time collaboration
    if (existingActionItem.meetingId) {
      await this.syncActionItemsWithRealtime(existingActionItem.meetingId, organizationId, null);
    }

    return deletedActionItem;
  }

  /**
   * Marks an action item as completed
   * @param id The ID of the action item to mark as completed
   * @param organizationId The ID of the organization
   * @param completedByUserId The ID of the user completing the action item
   * @returns The updated action item
   * @throws ValidationError if the ID is invalid
   * @throws NotFoundError if the action item is not found
   * @throws AuthorizationError if the action item does not belong to the organization
   */
  async markAsCompleted(id: string, organizationId: string, completedByUserId: string): Promise<ActionItem> {
    if (!id) {
      throw new ValidationError('Action item ID is required');
    }

    const existingActionItem = await this.actionItemRepository.findById(id);

    if (!existingActionItem) {
      throw new NotFoundError(`Action item with ID ${id} not found`);
    }

    if (existingActionItem.organizationId !== organizationId) {
      throw new AuthorizationError('Action item does not belong to this organization');
    }

    const updatedActionItem = await this.actionItemRepository.markAsCompleted(id, organizationId);

    // Send notification about the completed action item
    await this.notificationService.createNotification({
      type: NotificationType.ACTION_ITEM_STATUS_CHANGED,
      title: 'Action Item Completed',
      content: `Action item "${existingActionItem.description}" has been completed`,
      priority: NotificationPriority.MEDIUM,
      userId: existingActionItem.assigneeId,
      organizationId: organizationId,
      link: `/meetings/${existingActionItem.meetingId}`,
      channels: [],
    });

    // If the action item is from a meeting, sync completion with real-time collaboration
    if (existingActionItem.meetingId) {
      await this.syncActionItemsWithRealtime(existingActionItem.meetingId, organizationId, completedByUserId);
    }

    return updatedActionItem;
  }

  /**
   * Updates the status of multiple action items at once
   * @param data The bulk status update data
   * @param organizationId The ID of the organization
   * @param updatedByUserId The ID of the user updating the action items
   * @returns The number of updated action items
   * @throws ValidationError if the data is invalid
   */
  async bulkUpdateStatus(data: BulkStatusUpdateDto, organizationId: string, updatedByUserId: string): Promise<{ count: number }> {
    if (!data) {
      throw new ValidationError('Bulk status update data is required');
    }

    const updatedCount = await this.actionItemRepository.bulkUpdateStatus(data.ids, data.status, organizationId);

    // For each updated item, send notification about status change
    for (const actionItemId of data.ids) {
      const existingActionItem = await this.actionItemRepository.findById(actionItemId);

      if (existingActionItem) {
        await this.notificationService.createNotification({
          type: NotificationType.ACTION_ITEM_STATUS_CHANGED,
          title: 'Action Item Status Changed',
          content: `The status of action item "${existingActionItem.description}" has been changed to ${data.status}`,
          priority: NotificationPriority.MEDIUM,
          userId: existingActionItem.assigneeId,
          organizationId: organizationId,
          link: `/meetings/${existingActionItem.meetingId}`,
          channels: [],
        });

        // If any items are from meetings, sync updates with real-time collaboration
        if (existingActionItem.meetingId) {
          await this.syncActionItemsWithRealtime(existingActionItem.meetingId, organizationId, updatedByUserId);
        }
      }
    }

    return { count: updatedCount };
  }

  /**
   * Deletes multiple action items at once
   * @param data The bulk delete data
   * @param organizationId The ID of the organization
   * @returns The number of deleted action items
   * @throws ValidationError if the data is invalid
   */
  async bulkDelete(data: BulkDeleteDto, organizationId: string): Promise<{ count: number }> {
    if (!data) {
      throw new ValidationError('Bulk delete data is required');
    }

    const deletedCount = await this.actionItemRepository.bulkDelete(data.ids, organizationId);

    // If any items are from meetings, sync deletions with real-time collaboration
    for (const actionItemId of data.ids) {
      const existingActionItem = await this.actionItemRepository.findById(actionItemId);

      if (existingActionItem && existingActionItem.meetingId) {
        await this.syncActionItemsWithRealtime(existingActionItem.meetingId, organizationId, null);
      }
    }

    return { count: deletedCount };
  }

  /**
   * Gets the count of action items grouped by status
   * @param organizationId The ID of the organization
   * @returns Count of action items by status
   * @throws ValidationError if the organizationId is invalid
   */
  async getActionItemsByStatus(organizationId: string): Promise<ActionItemsByStatus[]> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    return await this.actionItemRepository.countByStatus(organizationId);
  }

  /**
   * Gets the count of action items grouped by assignee
   * @param organizationId The ID of the organization
   * @returns Count of action items by assignee
   * @throws ValidationError if the organizationId is invalid
   */
  async getActionItemsByAssigneeCount(organizationId: string): Promise<ActionItemsByAssignee[]> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    return await this.actionItemRepository.countByAssignee(organizationId);
  }

  /**
   * Sends reminders for action items due soon
   * @param organizationId The ID of the organization
   * @param daysAhead The number of days ahead to send reminders for
   * @returns The number of reminders sent
   * @throws ValidationError if the organizationId or daysAhead is invalid
   */
  async sendActionItemReminders(organizationId: string, daysAhead: number): Promise<number> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    if (!daysAhead || typeof daysAhead !== 'number' || daysAhead <= 0) {
      throw new ValidationError('Days ahead must be a positive number');
    }

    const upcomingActionItems = await this.actionItemRepository.findUpcoming(organizationId, daysAhead, { page: 1, limit: 1000 });
    let remindersSent = 0;

    for (const actionItem of upcomingActionItems.items) {
      await this.notificationService.createNotification({
        type: NotificationType.ACTION_ITEM_DUE,
        title: 'Action Item Due Soon',
        content: `Action item "${actionItem.description}" is due in ${daysAhead} days`,
        priority: NotificationPriority.MEDIUM,
        userId: actionItem.assigneeId,
        organizationId: organizationId,
        link: `/meetings/${actionItem.meetingId}`,
        channels: [],
      });
      remindersSent++;
    }

    return remindersSent;
  }

  /**
   * Synchronizes action items with real-time collaboration for a meeting
   * @param meetingId The ID of the meeting
   * @param organizationId The ID of the organization
   * @param userId The ID of the user triggering the sync
   * @returns Resolves when synchronization is complete
   * @throws ValidationError if the meetingId is invalid
   */
  async syncActionItemsWithRealtime(meetingId: string, organizationId: string, userId: string | null): Promise<void> {
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    const actionItemsResponse = await this.actionItemRepository.findByMeeting(meetingId, organizationId, { page: 1, limit: 1000 });
    const actionItems = actionItemsResponse.items.map(item => ({
      id: item.id,
      description: item.description,
      assigneeId: item.assigneeId,
      status: item.status,
      priority: item.priority,
      dueDate: item.dueDate,
      meetingId: item.meetingId,
    }));

    await this.realtimeService.updateMeetingData(meetingId, { actionItems }, userId);
    logger.info('Action items synced with real-time collaboration', { meetingId });
  }
}