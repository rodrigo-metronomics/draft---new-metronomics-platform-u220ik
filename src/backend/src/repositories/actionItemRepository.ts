import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import {
  ActionItem,
  ActionItemFilters,
  ActionItemStatus,
  ActionItemsResponse,
  ActionItemsByStatus,
  ActionItemsByAssignee
} from '../types/action-item.types';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/helpers/logger';

/**
 * Repository class for managing action items in the database
 */
export class ActionItemRepository extends BaseRepository<ActionItem> {
  /**
   * Initializes the ActionItemRepository with the ActionItem model
   */
  constructor() {
    super('actionItem');
  }

  /**
   * Finds action items based on provided filters with pagination
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @returns Paginated action items matching the filters
   */
  async findByFilters(
    filters: ActionItemFilters,
    pagination: PaginationParams
  ): Promise<ActionItemsResponse> {
    try {
      logger.debug('ActionItemRepository.findByFilters', { filters, pagination });
      
      // Build where clause
      const where: Prisma.ActionItemWhereInput = {};
      
      // Apply organization filter for multi-tenancy
      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }
      
      // Apply status filter if provided
      if (filters.status) {
        where.status = filters.status;
      }
      
      // Apply assignee filter if provided
      if (filters.assigneeId) {
        where.assigneeId = filters.assigneeId;
      }
      
      // Apply meeting filter if provided
      if (filters.meetingId) {
        where.meetingId = filters.meetingId;
      }
      
      // Apply priority filter if provided
      if (filters.priority) {
        where.priority = filters.priority;
      }
      
      // Apply due date range filters if provided
      if (filters.dueDateFrom || filters.dueDateTo) {
        where.dueDate = {};
        
        if (filters.dueDateFrom) {
          where.dueDate.gte = filters.dueDateFrom;
        }
        
        if (filters.dueDateTo) {
          where.dueDate.lte = filters.dueDateTo;
        }
      }
      
      // Calculate pagination parameters
      const skip = (pagination.page - 1) * pagination.limit;
      const take = pagination.limit;
      
      // Execute query with include for assignee and meeting
      const items = await this.model.findMany({
        where,
        skip,
        take,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              photoURL: true
            }
          },
          meeting: {
            select: {
              id: true,
              title: true,
              meetingType: true,
              startTime: true,
              status: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      });
      
      // Get total count
      const total = await this.model.count({ where });
      
      // Calculate total pages
      const totalPages = Math.ceil(total / pagination.limit) || 1;
      
      return {
        items,
        total,
        page: pagination.page,
        pageSize: pagination.limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error in ActionItemRepository.findByFilters', { filters, error });
      throw error;
    }
  }

  /**
   * Finds action items assigned to a specific user
   * @param assigneeId ID of the user to find action items for
   * @param organizationId ID of the organization
   * @param pagination Pagination parameters
   * @returns Paginated action items assigned to the user
   */
  async findByAssignee(
    assigneeId: string,
    organizationId: string,
    pagination: PaginationParams
  ): Promise<ActionItemsResponse> {
    // Validate assigneeId
    if (!assigneeId) {
      throw ValidationError.requiredField('assigneeId');
    }
    
    // Create filters object
    const filters: ActionItemFilters = {
      assigneeId,
      organizationId
    };
    
    // Use the findByFilters method
    return this.findByFilters(filters, pagination);
  }

  /**
   * Finds action items created in a specific meeting
   * @param meetingId ID of the meeting to find action items for
   * @param organizationId ID of the organization
   * @param pagination Pagination parameters
   * @returns Paginated action items for the meeting
   */
  async findByMeeting(
    meetingId: string,
    organizationId: string,
    pagination: PaginationParams
  ): Promise<ActionItemsResponse> {
    // Validate meetingId
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }
    
    // Create filters object
    const filters: ActionItemFilters = {
      meetingId,
      organizationId
    };
    
    // Use the findByFilters method
    return this.findByFilters(filters, pagination);
  }

  /**
   * Finds overdue action items that are not completed
   * @param organizationId ID of the organization
   * @param pagination Pagination parameters
   * @returns Paginated overdue action items
   */
  async findOverdue(
    organizationId: string,
    pagination: PaginationParams
  ): Promise<ActionItemsResponse> {
    try {
      logger.debug('ActionItemRepository.findOverdue', { organizationId, pagination });
      
      const currentDate = new Date();
      
      // Build where clause directly since we need to exclude multiple statuses
      const where: Prisma.ActionItemWhereInput = {
        organizationId,
        dueDate: { lt: currentDate },
        // Exclude completed and cancelled items
        status: { notIn: [ActionItemStatus.COMPLETED, ActionItemStatus.CANCELLED] }
      };
      
      // Calculate pagination parameters
      const skip = (pagination.page - 1) * pagination.limit;
      const take = pagination.limit;
      
      // Execute query
      const items = await this.model.findMany({
        where,
        skip,
        take,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              photoURL: true
            }
          },
          meeting: {
            select: {
              id: true,
              title: true,
              meetingType: true,
              startTime: true,
              status: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      });
      
      // Get total count
      const total = await this.model.count({ where });
      
      // Calculate total pages
      const totalPages = Math.ceil(total / pagination.limit) || 1;
      
      return {
        items,
        total,
        page: pagination.page,
        pageSize: pagination.limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error in ActionItemRepository.findOverdue', { organizationId, error });
      throw error;
    }
  }

  /**
   * Finds upcoming action items due within a specified number of days
   * @param organizationId ID of the organization
   * @param daysAhead Number of days to look ahead
   * @param pagination Pagination parameters
   * @returns Paginated upcoming action items
   */
  async findUpcoming(
    organizationId: string,
    daysAhead: number,
    pagination: PaginationParams
  ): Promise<ActionItemsResponse> {
    try {
      logger.debug('ActionItemRepository.findUpcoming', { organizationId, daysAhead, pagination });
      
      // Validate daysAhead
      if (daysAhead < 1) {
        throw ValidationError.invalidValueRange('daysAhead', 1, 365);
      }
      
      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(currentDate.getDate() + daysAhead);
      
      // Create where clause
      const where: Prisma.ActionItemWhereInput = {
        organizationId,
        dueDate: {
          gte: currentDate,
          lte: futureDate
        },
        // Exclude completed and cancelled items
        status: { notIn: [ActionItemStatus.COMPLETED, ActionItemStatus.CANCELLED] }
      };
      
      // Calculate pagination parameters
      const skip = (pagination.page - 1) * pagination.limit;
      const take = pagination.limit;
      
      // Execute query
      const items = await this.model.findMany({
        where,
        skip,
        take,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              photoURL: true
            }
          },
          meeting: {
            select: {
              id: true,
              title: true,
              meetingType: true,
              startTime: true,
              status: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      });
      
      // Get total count
      const total = await this.model.count({ where });
      
      // Calculate total pages
      const totalPages = Math.ceil(total / pagination.limit) || 1;
      
      return {
        items,
        total,
        page: pagination.page,
        pageSize: pagination.limit,
        totalPages
      };
    } catch (error) {
      logger.error('Error in ActionItemRepository.findUpcoming', { organizationId, daysAhead, error });
      throw error;
    }
  }

  /**
   * Marks an action item as completed
   * @param id ID of the action item to mark as completed
   * @param organizationId ID of the organization (for security check)
   * @returns The updated action item
   */
  async markAsCompleted(id: string, organizationId: string): Promise<ActionItem> {
    try {
      logger.debug('ActionItemRepository.markAsCompleted', { id, organizationId });
      
      // Validate ID
      if (!id) {
        throw ValidationError.requiredField('id');
      }
      
      // Find the action item to verify it exists and belongs to the organization
      const actionItem = await this.model.findFirst({
        where: {
          id,
          organizationId
        }
      });
      
      if (!actionItem) {
        throw NotFoundError.resourceNotFound('ActionItem', id);
      }
      
      // Update the action item status
      const updatedItem = await this.model.update({
        where: { id },
        data: {
          status: ActionItemStatus.COMPLETED,
          completedAt: new Date()
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              photoURL: true
            }
          },
          meeting: {
            select: {
              id: true,
              title: true,
              meetingType: true,
              startTime: true,
              status: true
            }
          }
        }
      });
      
      return updatedItem;
    } catch (error) {
      logger.error('Error in ActionItemRepository.markAsCompleted', { id, error });
      throw error;
    }
  }

  /**
   * Updates the status of multiple action items at once
   * @param ids Array of action item IDs to update
   * @param status New status to set
   * @param organizationId ID of the organization (for security check)
   * @returns The number of updated action items
   */
  async bulkUpdateStatus(
    ids: string[],
    status: ActionItemStatus,
    organizationId: string
  ): Promise<number> {
    try {
      logger.debug('ActionItemRepository.bulkUpdateStatus', { ids, status, organizationId });
      
      // Validate inputs
      if (!ids || !ids.length) {
        throw ValidationError.requiredField('ids');
      }
      
      if (!status) {
        throw ValidationError.requiredField('status');
      }
      
      // Create update data
      const updateData: Prisma.ActionItemUpdateManyMutationInput = {
        status
      };
      
      // Set completedAt if status is COMPLETED
      if (status === ActionItemStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
      
      // Update the action items
      const result = await this.model.updateMany({
        where: {
          id: { in: ids },
          organizationId
        },
        data: updateData
      });
      
      return result.count;
    } catch (error) {
      logger.error('Error in ActionItemRepository.bulkUpdateStatus', { ids, status, error });
      throw error;
    }
  }

  /**
   * Deletes multiple action items at once
   * @param ids Array of action item IDs to delete
   * @param organizationId ID of the organization (for security check)
   * @returns The number of deleted action items
   */
  async bulkDelete(
    ids: string[],
    organizationId: string
  ): Promise<number> {
    try {
      logger.debug('ActionItemRepository.bulkDelete', { ids, organizationId });
      
      // Validate inputs
      if (!ids || !ids.length) {
        throw ValidationError.requiredField('ids');
      }
      
      // Delete the action items
      const result = await this.model.deleteMany({
        where: {
          id: { in: ids },
          organizationId
        }
      });
      
      return result.count;
    } catch (error) {
      logger.error('Error in ActionItemRepository.bulkDelete', { ids, error });
      throw error;
    }
  }

  /**
   * Gets the count of action items grouped by status
   * @param organizationId ID of the organization
   * @returns Count of action items by status
   */
  async countByStatus(organizationId: string): Promise<ActionItemsByStatus[]> {
    try {
      logger.debug('ActionItemRepository.countByStatus', { organizationId });
      
      // Validate organizationId
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }
      
      // Group by status and count
      const groupedItems = await this.model.groupBy({
        by: ['status'],
        where: {
          organizationId
        },
        _count: {
          status: true
        }
      });
      
      // Transform the result to match the expected output format
      const result: ActionItemsByStatus[] = groupedItems.map(item => ({
        status: item.status as ActionItemStatus,
        count: item._count.status
      }));
      
      return result;
    } catch (error) {
      logger.error('Error in ActionItemRepository.countByStatus', { organizationId, error });
      throw error;
    }
  }

  /**
   * Gets the count of action items grouped by assignee
   * @param organizationId ID of the organization
   * @returns Count of action items by assignee
   */
  async countByAssignee(organizationId: string): Promise<ActionItemsByAssignee[]> {
    try {
      logger.debug('ActionItemRepository.countByAssignee', { organizationId });
      
      // Validate organizationId
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }
      
      // Group by assigneeId and count
      const groupedItems = await this.model.groupBy({
        by: ['assigneeId'],
        where: {
          organizationId
        },
        _count: {
          assigneeId: true
        }
      });
      
      // Get assignee names for the grouped items
      const assigneeIds = groupedItems.map(item => item.assigneeId);
      
      const assignees = await prisma.user.findMany({
        where: {
          id: {
            in: assigneeIds
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      // Create a map of assignee IDs to names
      const assigneeMap = new Map<string, string>();
      assignees.forEach(assignee => {
        assigneeMap.set(assignee.id, assignee.name);
      });
      
      // Transform the result to match the expected output format
      const result: ActionItemsByAssignee[] = groupedItems.map(item => ({
        assigneeId: item.assigneeId,
        assigneeName: assigneeMap.get(item.assigneeId) || 'Unknown User',
        count: item._count.assigneeId
      }));
      
      return result;
    } catch (error) {
      logger.error('Error in ActionItemRepository.countByAssignee', { organizationId, error });
      throw error;
    }
  }

  /**
   * Finds an action item by its ID with related entities
   * @param id ID of the action item to find
   * @returns The action item with assignee and meeting data or null if not found
   */
  async findById(id: string): Promise<ActionItem | null> {
    try {
      logger.debug('ActionItemRepository.findById', { id });
      
      // Call the parent findById method with include options
      const actionItem = await super.findById(id, {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              photoURL: true
            }
          },
          meeting: {
            select: {
              id: true,
              title: true,
              meetingType: true,
              startTime: true,
              status: true
            }
          }
        }
      });
      
      return actionItem;
    } catch (error) {
      logger.error('Error in ActionItemRepository.findById', { id, error });
      throw error;
    }
  }
}