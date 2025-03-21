import admin from 'firebase-admin'; // v11.8.0
import { logger } from '../../utils/helpers/logger';
import { messaging } from '../../config/firebase';
import { NotificationRepository } from '../../repositories/notificationRepository';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationStatus,
  Notification,
  NotificationDelivery,
  NotificationDeliveryResult,
  CreateNotificationDto
} from '../../types/notification.types';

/**
 * Service for sending push notifications using Firebase Cloud Messaging
 * in the Metronomics Platform.
 */
export class FirebaseNotificationService {
  private notificationRepository: NotificationRepository;
  private readonly BATCH_SIZE: number;
  private readonly MAX_RETRIES: number;

  /**
   * Initializes the Firebase notification service with repository and configuration
   */
  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.BATCH_SIZE = 50; // Process 50 notifications at a time
    this.MAX_RETRIES = 3; // Maximum number of retries for failed deliveries
    
    logger.info('FirebaseNotificationService initialized');
  }

  /**
   * Sends a push notification to a single device token
   * @param token Device token to send notification to
   * @param payload Notification payload
   * @returns Message ID if successful
   */
  async sendPushNotification(token: string, payload: object): Promise<string> {
    try {
      if (!token) {
        throw new Error('Device token is required');
      }

      if (!payload) {
        throw new Error('Notification payload is required');
      }

      logger.debug('Sending push notification', { token, payload });

      const message: admin.messaging.Message = {
        token,
        notification: payload['notification'],
        data: payload['data'],
        android: payload['android'],
        webpush: payload['webpush'],
        apns: payload['apns'],
      };

      const response = await messaging.send(message);
      
      logger.info('Push notification sent successfully', { messageId: response });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send push notification', { 
        error: errorMessage, 
        token, 
        payload 
      });
      throw error;
    }
  }

  /**
   * Sends a push notification to multiple device tokens
   * @param tokens Array of device tokens to send notification to
   * @param payload Notification payload
   * @returns Batch response with success/failure counts
   */
  async sendMulticastPushNotification(
    tokens: string[],
    payload: object
  ): Promise<admin.messaging.BatchResponse> {
    try {
      if (!tokens || tokens.length === 0) {
        throw new Error('At least one device token is required');
      }

      if (!payload) {
        throw new Error('Notification payload is required');
      }

      logger.debug('Sending multicast push notification', { 
        tokenCount: tokens.length, 
        payload 
      });

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: payload['notification'],
        data: payload['data'],
        android: payload['android'],
        webpush: payload['webpush'],
        apns: payload['apns'],
      };

      const response = await messaging.sendMulticast(message);
      
      logger.info('Multicast push notification sent', { 
        success: response.successCount,
        failure: response.failureCount,
        total: tokens.length
      });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send multicast push notification', { 
        error: errorMessage, 
        tokenCount: tokens.length, 
        payload 
      });
      throw error;
    }
  }

  /**
   * Processes pending push notification deliveries from the database
   * @param batchSize Number of deliveries to process in one batch
   * @returns Statistics about processed deliveries
   */
  async processPendingDeliveries(
    batchSize?: number
  ): Promise<NotificationDeliveryResult> {
    try {
      const limit = batchSize || this.BATCH_SIZE;
      
      logger.info('Processing pending push notification deliveries', { batchSize: limit });
      
      // Get pending deliveries for PUSH channel
      const pendingDeliveries = await this.notificationRepository.findPendingDeliveriesByChannel(
        NotificationChannel.PUSH,
        limit
      );
      
      logger.info(`Found ${pendingDeliveries.length} pending push deliveries to process`);
      
      // Initialize counters
      const result: NotificationDeliveryResult = {
        processed: pendingDeliveries.length,
        successful: 0,
        failed: 0
      };
      
      // Process each delivery
      for (const delivery of pendingDeliveries) {
        try {
          const { id: deliveryId, notification } = delivery;
          
          // Skip if no notification is present
          if (!notification) {
            logger.warn('Notification not found for delivery', { deliveryId });
            await this.notificationRepository.updateDeliveryStatus(deliveryId, {
              status: NotificationDeliveryStatus.FAILED,
              failureReason: 'Notification not found',
              updatedAt: new Date()
            });
            result.failed++;
            continue;
          }
          
          // Get user's device token (this would come from a user repository or service in a real implementation)
          // For simplicity, assuming it's available in notification metadata
          const token = notification.metadata?.['deviceToken'] as string;
          
          if (!token) {
            logger.warn('Device token not found for user', { 
              userId: notification.userId,
              deliveryId 
            });
            await this.notificationRepository.updateDeliveryStatus(deliveryId, {
              status: NotificationDeliveryStatus.FAILED,
              failureReason: 'Device token not found',
              updatedAt: new Date()
            });
            result.failed++;
            continue;
          }
          
          // Create notification payload
          const payload = this.createNotificationPayload(notification);
          
          // Send push notification
          await this.sendPushNotification(token, payload);
          
          // Update delivery status to DELIVERED
          await this.notificationRepository.updateDeliveryStatus(deliveryId, {
            status: NotificationDeliveryStatus.DELIVERED,
            deliveredAt: new Date(),
            updatedAt: new Date()
          });
          
          result.successful++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const deliveryId = delivery.id;
          logger.error('Failed to process push notification delivery', { 
            error: errorMessage, 
            deliveryId 
          });
          
          // Update retry count and status
          const updatedDelivery = await this.notificationRepository.updateDeliveryStatus(deliveryId, {
            status: NotificationDeliveryStatus.FAILED,
            failureReason: errorMessage,
            retryCount: { increment: 1 }, // Using Prisma's increment operator
            updatedAt: new Date()
          });
          
          // Check if retry count exceeds MAX_RETRIES
          if (updatedDelivery.retryCount >= this.MAX_RETRIES) {
            logger.warn('Max retries exceeded for delivery', { 
              deliveryId, 
              retryCount: updatedDelivery.retryCount 
            });
            await this.notificationRepository.updateDeliveryStatus(deliveryId, {
              failureReason: `Max retries (${this.MAX_RETRIES}) exceeded: ${errorMessage}`,
              updatedAt: new Date()
            });
          }
          
          result.failed++;
        }
      }
      
      logger.info('Finished processing push notification deliveries', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing push notification deliveries', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Sends a high priority notification immediately
   * @param notificationDto Notification data
   * @param deliveryId ID of the delivery record
   * @returns True if successful, false otherwise
   */
  async sendHighPriorityNotification(
    notificationDto: CreateNotificationDto,
    deliveryId: string
  ): Promise<boolean> {
    try {
      if (!notificationDto) {
        throw new Error('Notification data is required');
      }
      
      if (!deliveryId) {
        throw new Error('Delivery ID is required');
      }
      
      logger.info('Sending high priority push notification', { 
        userId: notificationDto.userId,
        type: notificationDto.type 
      });
      
      // Get user's device token (this would come from a user repository or service in a real implementation)
      // For simplicity, assuming it's available in notification metadata
      const token = notificationDto.metadata?.['deviceToken'] as string;
      
      if (!token) {
        logger.warn('Device token not found for high priority notification', { 
          userId: notificationDto.userId 
        });
        await this.notificationRepository.updateDeliveryStatus(deliveryId, {
          status: NotificationDeliveryStatus.FAILED,
          failureReason: 'Device token not found',
          updatedAt: new Date()
        });
        return false;
      }
      
      // Create notification object for payload creation
      const notification: Notification = {
        id: 'temp-id', // Will be replaced with actual ID in database
        ...notificationDto,
        status: NotificationStatus.UNREAD,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create notification payload
      const payload = this.createNotificationPayload(notification);
      
      // Send push notification
      await this.sendPushNotification(token, payload);
      
      // Update delivery status to DELIVERED
      await this.notificationRepository.updateDeliveryStatus(deliveryId, {
        status: NotificationDeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.info('High priority push notification sent successfully', { deliveryId });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send high priority push notification', { 
        error: errorMessage, 
        deliveryId 
      });
      
      // Update delivery status to FAILED
      try {
        await this.notificationRepository.updateDeliveryStatus(deliveryId, {
          status: NotificationDeliveryStatus.FAILED,
          failureReason: errorMessage,
          updatedAt: new Date()
        });
      } catch (updateError) {
        logger.error('Failed to update delivery status after failure', { 
          error: updateError, 
          deliveryId 
        });
      }
      
      return false;
    }
  }

  /**
   * Creates a formatted notification payload for Firebase Cloud Messaging
   * @param notification Notification entity
   * @returns Formatted notification payload
   */
  private createNotificationPayload(notification: Notification): object {
    const { title, content, link } = notification;
    
    const payload: any = {
      notification: {
        title,
        body: content
      },
      data: {
        notificationId: notification.id,
        type: notification.type,
        priority: notification.priority,
        link: link || ''
      }
    };
    
    // Add click_action for web push if link is provided
    if (link) {
      payload.webpush = {
        notification: {
          click_action: link
        }
      };
    }
    
    // Add high priority for important notifications
    if (notification.priority === 'HIGH') {
      payload.android = {
        priority: 'high'
      };
      payload.apns = {
        headers: {
          'apns-priority': '10'
        }
      };
    }
    
    return payload;
  }
}