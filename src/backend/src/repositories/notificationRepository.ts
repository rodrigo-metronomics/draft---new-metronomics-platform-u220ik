import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { logger } from '../utils/helpers/logger';
import { ValidationError } from '../utils/errors';
import {
  Notification,
  CreateNotificationDto,
  NotificationChannel,
  NotificationStatus,
  NotificationDeliveryStatus,
  NotificationQueryParams,
  NotificationCount
} from '../types/notification.types';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { Prisma } from '@prisma/client'; // ^4.15.0

/**
 * Repository class for managing notification data in the database
 */
export class NotificationRepository extends BaseRepository<Notification> {
  /**
   * Initializes the notification repository with the Notification model
   */
  constructor() {
    super('notification');
  }

  /**
   * Creates a notification with delivery records for specified channels
   * @param data The notification data to create
   * @param channels The channels to create delivery records for
   * @returns The created notification with delivery records
   */
  async createWithDeliveries(
    data: CreateNotificationDto,
    channels: NotificationChannel[]
  ): Promise<Notification> {
    try {
      if (!data) {
        throw ValidationError.requiredField('data');
      }

      // Use transaction to ensure atomicity
      const result = await this.transaction(async (tx) => {
        // Create the notification with UNREAD status
        const notification = await tx.notification.create({
          data: {
            ...data,
            status: NotificationStatus.UNREAD,
            deliveries: {
              create: channels.map(channel => ({
                channel,
                status: NotificationDeliveryStatus.PENDING,
                retryCount: 0
              }))
            }
          },
          include: {
            deliveries: true
          }
        });

        return notification;
      });

      logger.debug('NotificationRepository.createWithDeliveries success', { 
        notificationId: result.id, 
        channels 
      });
      
      return result;
    } catch (error) {
      logger.error('Error in NotificationRepository.createWithDeliveries', { error });
      throw error;
    }
  }

  /**
   * Finds notifications for a specific user with optional filtering and pagination
   * @param userId The ID of the user to find notifications for
   * @param queryParams Optional query parameters for filtering
   * @param pagination Pagination parameters for limiting results
   * @returns Paginated notifications for the user
   */
  async findByUserId(
    userId: string,
    queryParams: NotificationQueryParams = {},
    pagination: PaginationParams
  ): Promise<{ data: Notification[]; total: number }> {
    try {
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      // Build filters combining userId with other query parameters
      const filters: Record<string, any> = {
        userId
      };

      // Apply organization filter if provided
      if (queryParams.organizationId) {
        filters.organizationId = queryParams.organizationId;
      }

      // Apply date range filters if provided
      if (queryParams.startDate) {
        filters.createdAt_from = queryParams.startDate;
      }
      if (queryParams.endDate) {
        filters.createdAt_to = queryParams.endDate;
      }

      // Apply status filter if provided
      if (queryParams.status) {
        filters.status = queryParams.status;
      }

      // Apply type filter if provided
      if (queryParams.type) {
        filters.type = queryParams.type;
      }

      // Apply priority filter if provided
      if (queryParams.priority) {
        filters.priority = queryParams.priority;
      }

      // Include delivery records and set sorting options
      const options = {
        include: {
          deliveries: true
        },
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      logger.debug('NotificationRepository.findByUserId', { 
        userId, 
        filters, 
        pagination 
      });

      return await this.findMany(filters, pagination, options);
    } catch (error) {
      logger.error('Error in NotificationRepository.findByUserId', { 
        error, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Counts unread notifications for a specific user
   * @param userId The ID of the user to count notifications for
   * @returns Count of total and unread notifications
   */
  async countUnreadByUserId(userId: string): Promise<NotificationCount> {
    try {
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      // Count total notifications for the user
      const total = await this.count({ userId });

      // Count unread notifications for the user
      const unread = await this.count({
        userId,
        status: NotificationStatus.UNREAD
      });

      logger.debug('NotificationRepository.countUnreadByUserId result', { 
        userId, 
        total, 
        unread 
      });

      return { total, unread };
    } catch (error) {
      logger.error('Error in NotificationRepository.countUnreadByUserId', { 
        error, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Marks a specific notification as read
   * @param id The ID of the notification to mark as read
   * @returns The updated notification
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      this.validateId(id);

      const updatedNotification = await this.update(id, {
        status: NotificationStatus.READ
      });

      logger.debug('NotificationRepository.markAsRead success', { id });
      return updatedNotification;
    } catch (error) {
      logger.error('Error in NotificationRepository.markAsRead', { error, id });
      throw error;
    }
  }

  /**
   * Marks all unread notifications for a user as read
   * @param userId The ID of the user to mark notifications as read for
   * @returns Count of updated notifications
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      const result = await prisma.notification.updateMany({
        where: {
          userId,
          status: NotificationStatus.UNREAD
        },
        data: {
          status: NotificationStatus.READ
        }
      });

      logger.debug('NotificationRepository.markAllAsRead success', { 
        userId, 
        count: result.count 
      });

      return { count: result.count };
    } catch (error) {
      logger.error('Error in NotificationRepository.markAllAsRead', { 
        error, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Finds pending notification deliveries for a specific channel
   * @param channel The channel to find pending deliveries for
   * @param limit Maximum number of deliveries to return
   * @returns Pending deliveries with their notifications
   */
  async findPendingDeliveriesByChannel(
    channel: NotificationChannel,
    limit: number = 50
  ): Promise<Array<{ id: string; notification: Notification }>> {
    try {
      const pendingDeliveries = await prisma.notificationDelivery.findMany({
        where: {
          channel,
          status: NotificationDeliveryStatus.PENDING
        },
        take: limit,
        include: {
          notification: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      logger.debug('NotificationRepository.findPendingDeliveriesByChannel result', { 
        channel, 
        count: pendingDeliveries.length 
      });

      return pendingDeliveries.map(delivery => ({
        id: delivery.id,
        notification: delivery.notification as unknown as Notification
      }));
    } catch (error) {
      logger.error('Error in NotificationRepository.findPendingDeliveriesByChannel', { 
        error, 
        channel 
      });
      throw error;
    }
  }

  /**
   * Updates the status of a notification delivery
   * @param deliveryId The ID of the delivery to update
   * @param updateData The data to update the delivery with
   * @returns The updated delivery record
   */
  async updateDeliveryStatus(
    deliveryId: string,
    updateData: Record<string, any>
  ): Promise<any> {
    try {
      this.validateId(deliveryId);

      const updatedDelivery = await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: updateData
      });

      logger.debug('NotificationRepository.updateDeliveryStatus success', { 
        deliveryId, 
        updateData 
      });

      return updatedDelivery;
    } catch (error) {
      logger.error('Error in NotificationRepository.updateDeliveryStatus', { 
        error, 
        deliveryId 
      });
      throw error;
    }
  }

  /**
   * Finds notifications for a user within a specific time range
   * @param userId The ID of the user to find notifications for
   * @param startDate The start date of the time range
   * @param endDate The end date of the time range
   * @returns Notifications within the time range
   */
  async findByUserIdAndTimeRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Notification[]> {
    try {
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      if (!startDate || !endDate) {
        throw ValidationError.requiredField('date range');
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          deliveries: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      logger.debug('NotificationRepository.findByUserIdAndTimeRange result', { 
        userId, 
        startDate, 
        endDate, 
        count: notifications.length 
      });

      return notifications as unknown as Notification[];
    } catch (error) {
      logger.error('Error in NotificationRepository.findByUserIdAndTimeRange', { 
        error, 
        userId, 
        startDate, 
        endDate 
      });
      throw error;
    }
  }

  /**
   * Deletes notifications older than the specified date
   * @param olderThan The date threshold for deletion
   * @returns Count of deleted notifications
   */
  async deleteOldNotifications(olderThan: Date): Promise<{ count: number }> {
    try {
      if (!olderThan) {
        throw ValidationError.requiredField('olderThan');
      }

      // Delete old notifications
      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: olderThan
          }
        }
      });

      logger.debug('NotificationRepository.deleteOldNotifications success', { 
        olderThan, 
        count: result.count 
      });

      return { count: result.count };
    } catch (error) {
      logger.error('Error in NotificationRepository.deleteOldNotifications', { 
        error, 
        olderThan 
      });
      throw error;
    }
  }
}