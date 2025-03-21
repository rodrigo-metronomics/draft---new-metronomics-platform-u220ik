import { logger } from '../../utils/helpers/logger';
import { NotificationRepository } from '../../repositories/notificationRepository';
import { FirebaseNotificationService } from './firebaseNotificationService';
import { EmailNotificationService } from './emailNotificationService';
import { UserRepository } from '../../repositories/userRepository';
import {
  Notification,
  CreateNotificationDto,
  NotificationQueryParams,
  NotificationCount,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationDeliveryResult,
  NotificationPreferences,
  NotificationTypePreference,
  NotificationDigestFrequency
} from '../../types/notification.types';
import { User } from '../../types/user.types';
import { ValidationError, NotFoundError } from '../../utils/errors';

/**
 * Core service for managing notifications across multiple channels
 */
export class NotificationService {
  private notificationRepository: NotificationRepository;
  private firebaseNotificationService: FirebaseNotificationService;
  private emailNotificationService: EmailNotificationService;
  private userRepository: UserRepository;

  /**
   * Initializes the notification service with required dependencies
   */
  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.firebaseNotificationService = new FirebaseNotificationService();
    this.emailNotificationService = new EmailNotificationService();
    this.userRepository = new UserRepository();
    
    logger.info('NotificationService initialized');
  }

  /**
   * Creates a new notification and schedules delivery through specified channels
   * @param notificationData The notification data to create
   * @returns The created notification
   */
  async createNotification(notificationData: CreateNotificationDto): Promise<Notification> {
    try {
      if (!notificationData) {
        throw ValidationError.requiredField('notificationData');
      }

      // If channels are not specified in the notification data, determine them based on user preferences
      let channels = notificationData.channels || [];
      
      if (channels.length === 0) {
        // Get user preferences
        const preferences = await this.getUserPreferences(notificationData.userId);
        
        // Determine appropriate channels based on notification type and user preferences
        channels = this.getDefaultChannelsForNotification(notificationData, preferences);
      }

      logger.debug('Creating notification with delivery channels', { 
        userId: notificationData.userId, 
        channels, 
        type: notificationData.type 
      });
      
      // Create the notification with deliveries for each channel
      const notification = await this.notificationRepository.createWithDeliveries(
        notificationData,
        channels
      );

      // If notification is high priority, trigger immediate delivery
      if (notification.priority === NotificationPriority.HIGH) {
        // Find the push delivery if it exists
        const pushDelivery = notification.deliveries?.find(d => d.channel === NotificationChannel.PUSH);
        
        if (pushDelivery) {
          await this.firebaseNotificationService.sendHighPriorityNotification(
            notificationData,
            pushDelivery.id
          );
        }
      }

      logger.info('Notification created successfully', { 
        notificationId: notification.id,
        channels 
      });

      return notification;
    } catch (error) {
      logger.error('Error creating notification', { error, notificationData });
      throw error;
    }
  }

  /**
   * Retrieves a notification by its ID
   * @param id The ID of the notification to retrieve
   * @returns The notification if found, null otherwise
   */
  async getNotification(id: string): Promise<Notification | null> {
    try {
      if (!id) {
        throw ValidationError.requiredField('id');
      }

      return await this.notificationRepository.findById(id);
    } catch (error) {
      logger.error('Error retrieving notification', { error, id });
      throw error;
    }
  }

  /**
   * Retrieves notifications for a specific user with filtering and pagination
   * @param userId The ID of the user to retrieve notifications for
   * @param queryParams Query parameters for filtering notifications
   * @param pagination Pagination parameters
   * @returns Paginated notifications for the user
   */
  async getUserNotifications(
    userId: string,
    queryParams: NotificationQueryParams = {},
    pagination: { page: number; limit: number; offset: number }
  ): Promise<{ data: Notification[]; total: number }> {
    try {
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      return await this.notificationRepository.findByUserId(userId, queryParams, pagination);
    } catch (error) {
      logger.error('Error retrieving user notifications', { error, userId, queryParams });
      throw error;
    }
  }

  /**
   * Gets the count of unread notifications for a user
   * @param userId The ID of the user to get counts for
   * @returns Count of total and unread notifications
   */
  async getUnreadCount(userId: string): Promise<NotificationCount> {
    try {
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      return await this.notificationRepository.countUnreadByUserId(userId);
    } catch (error) {
      logger.error('Error retrieving unread notification count', { error, userId });
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
      if (!id) {
        throw ValidationError.requiredField('id');
      }

      return await this.notificationRepository.markAsRead(id);
    } catch (error) {
      logger.error('Error marking notification as read', { error, id });
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

      return await this.notificationRepository.markAllAsRead(userId);
    } catch (error) {
      logger.error('Error marking all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Processes pending notification deliveries across all channels
   * @param batchSize The number of deliveries to process in each batch
   * @returns Results of processing deliveries for each channel
   */
  async processDeliveries(batchSize: number = 50): Promise<{ [key: string]: NotificationDeliveryResult }> {
    try {
      logger.info('Processing pending notification deliveries', { batchSize });

      // Process push notifications
      const pushResults = await this.firebaseNotificationService.processPendingDeliveries(batchSize);
      
      // Process email notifications
      const emailResults = await this.emailNotificationService.processPendingDeliveries(batchSize);

      return {
        push: pushResults,
        email: emailResults
      };
    } catch (error) {
      logger.error('Error processing notification deliveries', { error, batchSize });
      throw error;
    }
  }

  /**
   * Sends a high priority notification immediately through appropriate channels
   * @param notificationData The notification data to send
   * @returns True if successful, false otherwise
   */
  async sendHighPriorityNotification(notificationData: CreateNotificationDto): Promise<boolean> {
    try {
      if (!notificationData) {
        throw ValidationError.requiredField('notificationData');
      }

      if (notificationData.priority !== NotificationPriority.HIGH) {
        throw new ValidationError('Notification must be high priority for immediate delivery');
      }

      // Create notification with deliveries
      const notification = await this.createNotification(notificationData);

      // Find the push delivery if it exists
      const pushDelivery = notification.deliveries?.find(d => d.channel === NotificationChannel.PUSH);
      
      if (!pushDelivery) {
        logger.warn('No push delivery channel for high priority notification');
        return false;
      }

      // Send immediately via push notification
      return await this.firebaseNotificationService.sendHighPriorityNotification(
        notificationData,
        pushDelivery.id
      );
    } catch (error) {
      logger.error('Error sending high priority notification', { error, notificationData });
      throw error;
    }
  }

  /**
   * Sends digest emails to users based on their notification preferences
   * @param frequency The digest frequency to process (DAILY or WEEKLY)
   * @returns Count of successful and failed digest emails
   */
  async sendDigestEmails(frequency: NotificationDigestFrequency): Promise<{ sent: number; failed: number }> {
    try {
      logger.info('Sending notification digest emails', { frequency });

      // Initialize counters
      let sent = 0;
      let failed = 0;

      // Find users with matching digest frequency preference
      // In a real implementation, we would query all users with this digest frequency
      // This is a simplified approach for demonstration
      const usersWithDigestPreference: User[] = [];
      
      // Get all users from the system and filter by preference
      // Note: In a production environment, this would be a direct database query with filtering
      const allUsers = await this.userRepository.findMany({}, { page: 1, limit: 1000, offset: 0 });
      
      for (const user of allUsers.data) {
        // Check if user has notification preferences set
        if (user.preferences?.notificationPreferences) {
          const notificationPrefs = user.preferences.notificationPreferences;
          
          // Check if user has enabled notifications and has matching digest frequency
          if (notificationPrefs.enabled && notificationPrefs.digestFrequency === frequency) {
            usersWithDigestPreference.push(user);
          }
        }
      }

      // Send digest email to each user
      for (const user of usersWithDigestPreference) {
        try {
          const success = await this.emailNotificationService.sendDigestEmail(user, frequency);
          
          if (success) {
            sent++;
          } else {
            failed++;
          }
        } catch (error) {
          logger.error('Error sending digest email to user', { 
            error, 
            userId: user.id, 
            frequency 
          });
          failed++;
        }
      }

      logger.info('Completed sending digest emails', { frequency, sent, failed });
      
      return { sent, failed };
    } catch (error) {
      logger.error('Error sending digest emails', { error, frequency });
      throw error;
    }
  }

  /**
   * Gets notification preferences for a specific user
   * @param userId The ID of the user to get preferences for
   * @returns The user's notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw NotFoundError.resourceNotFound('User', userId);
      }

      // Return user's notification preferences or default preferences if not set
      return user.preferences?.notificationPreferences || this.getDefaultPreferences();
    } catch (error) {
      logger.error('Error retrieving user notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Updates notification preferences for a specific user
   * @param userId The ID of the user to update preferences for
   * @param preferences The new notification preferences
   * @returns The updated notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    try {
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      if (!preferences) {
        throw ValidationError.requiredField('preferences');
      }

      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw NotFoundError.resourceNotFound('User', userId);
      }

      // Update user preferences
      const updatedUser = await this.userRepository.update(userId, {
        preferences: {
          ...user.preferences,
          notificationPreferences: preferences
        }
      });

      return updatedUser.preferences.notificationPreferences;
    } catch (error) {
      logger.error('Error updating user notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Determines appropriate delivery channels based on notification type and user preferences
   * @param notification The notification to determine channels for
   * @param preferences The user's notification preferences
   * @returns Array of appropriate delivery channels
   */
  getDefaultChannelsForNotification(
    notification: CreateNotificationDto,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    // If notification already has channels specified, use those
    if (notification.channels && notification.channels.length > 0) {
      return notification.channels;
    }

    // If user has disabled notifications, return only IN_APP channel as fallback
    if (!preferences.enabled) {
      return [NotificationChannel.IN_APP];
    }

    // Find type-specific preferences
    const typePreference = preferences.typePreferences.find(p => p.type === notification.type);

    // If type-specific preferences exist and are disabled, return only IN_APP channel
    if (typePreference && !typePreference.enabled) {
      return [NotificationChannel.IN_APP];
    }

    // If type-specific channels are defined, use those
    if (typePreference && typePreference.channels.length > 0) {
      return typePreference.channels;
    }

    // Otherwise, use the user's default channels
    let channels = [...preferences.channels];

    // If notification is high priority, ensure we include immediate channels (PUSH and IN_APP)
    if (notification.priority === NotificationPriority.HIGH) {
      if (!channels.includes(NotificationChannel.PUSH)) {
        channels.push(NotificationChannel.PUSH);
      }
      
      if (!channels.includes(NotificationChannel.IN_APP)) {
        channels.push(NotificationChannel.IN_APP);
      }
    }

    // Always include IN_APP channel as fallback
    if (!channels.includes(NotificationChannel.IN_APP)) {
      channels.push(NotificationChannel.IN_APP);
    }

    return channels;
  }

  /**
   * Gets default notification preferences for new users
   * @returns Default notification preferences
   */
  getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      digestFrequency: NotificationDigestFrequency.DAILY,
      typePreferences: [
        {
          type: NotificationType.MEETING_REMINDER,
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        },
        {
          type: NotificationType.ACTION_ITEM_ASSIGNED,
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        },
        {
          type: NotificationType.ACTION_ITEM_DUE,
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH]
        },
        {
          type: NotificationType.METRIC_THRESHOLD_ALERT,
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH]
        },
        {
          type: NotificationType.GOAL_UPDATE,
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        },
        {
          type: NotificationType.MENTION,
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH]
        },
        {
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        }
      ]
    };
  }
}

export { NotificationService };