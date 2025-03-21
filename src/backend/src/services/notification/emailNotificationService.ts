import sgMail from '@sendgrid/mail'; // ^7.7.0
import { logger } from '../../utils/helpers/logger';
import { NotificationRepository } from '../../repositories/notificationRepository';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationDeliveryResult,
  Notification,
  NotificationDigestFrequency
} from '../../types/notification.types';
import { User } from '../../types/user.types';

// Configure SendGrid API key from environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@metronomics.io';

/**
 * Service for sending email notifications using SendGrid
 */
export class EmailNotificationService {
  private notificationRepository: NotificationRepository;
  private readonly batchSize: number;

  /**
   * Initializes the email notification service with repository and SendGrid configuration
   */
  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.batchSize = 50; // Process 50 emails at a time
    
    // Configure SendGrid
    if (!SENDGRID_API_KEY) {
      logger.warn('SendGrid API key not configured. Email notifications will not be sent.');
    } else {
      sgMail.setApiKey(SENDGRID_API_KEY);
      logger.info('EmailNotificationService initialized successfully');
    }
  }

  /**
   * Sends an email notification to a user
   * @param to Email address of the recipient
   * @param subject Subject line of the email
   * @param content HTML content of the email
   * @param options Additional options for the email (attachments, templates, etc)
   * @returns True if email was sent successfully, false otherwise
   */
  async sendEmail(
    to: string,
    subject: string,
    content: string,
    options: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Validate inputs
      if (!to || !subject || !content) {
        logger.error('Missing required parameters for sending email', {
          to,
          subject,
          contentProvided: !!content
        });
        return false;
      }

      // Skip sending if SendGrid is not configured
      if (!SENDGRID_API_KEY) {
        logger.warn('SendGrid not configured, skipping email delivery', {
          to,
          subject
        });
        return false;
      }

      // Prepare email message
      const msg = {
        to,
        from: FROM_EMAIL,
        subject,
        html: content,
        ...options
      };

      // Send the email
      await sgMail.send(msg);
      
      logger.info('Email sent successfully', {
        to,
        subject
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        to,
        subject,
        error
      });
      return false;
    }
  }

  /**
   * Processes a batch of pending email notification deliveries
   * @param limit Maximum number of deliveries to process
   * @returns Statistics about processed deliveries
   */
  async processPendingDeliveries(limit = this.batchSize): Promise<NotificationDeliveryResult> {
    const result: NotificationDeliveryResult = {
      processed: 0,
      successful: 0,
      failed: 0
    };

    try {
      // Get pending email deliveries
      const pendingDeliveries = await this.notificationRepository.findPendingDeliveriesByChannel(
        NotificationChannel.EMAIL,
        limit
      );

      logger.info(`Found ${pendingDeliveries.length} pending email deliveries`);

      // Process each delivery
      for (const delivery of pendingDeliveries) {
        result.processed++;
        
        const notification = delivery.notification;
        
        // Try to get recipient email
        // In a real implementation, we would likely need to fetch the user from a user service
        // to get their email address. Here we are assuming the email is stored in the notification metadata.
        let recipientEmail: string | undefined;
        
        // Check if email is in metadata
        if (notification.metadata && typeof notification.metadata === 'object') {
          if ('recipientEmail' in notification.metadata) {
            recipientEmail = notification.metadata.recipientEmail as string;
          } else if ('email' in notification.metadata) {
            recipientEmail = notification.metadata.email as string;
          }
        }
        
        // If we couldn't find an email, mark as failed
        if (!recipientEmail) {
          logger.error('No recipient email found for notification', {
            notificationId: notification.id,
            deliveryId: delivery.id,
            userId: notification.userId
          });
          
          await this.notificationRepository.updateDeliveryStatus(delivery.id, {
            status: NotificationDeliveryStatus.FAILED,
            failureReason: 'No recipient email found',
            retryCount: delivery.retryCount + 1
          });
          
          result.failed++;
          continue;
        }
        
        const subject = notification.title;
        const content = this.generateEmailContent(notification);
        
        // Send the email
        const success = await this.sendEmail(recipientEmail, subject, content);
        
        // Update the delivery status
        const status = success ? NotificationDeliveryStatus.SENT : NotificationDeliveryStatus.FAILED;
        await this.notificationRepository.updateDeliveryStatus(delivery.id, {
          status,
          deliveredAt: success ? new Date() : undefined,
          failureReason: !success ? 'Failed to send email' : undefined,
          retryCount: delivery.retryCount + 1
        });
        
        // Update result counters
        if (success) {
          result.successful++;
        } else {
          result.failed++;
        }
      }

      logger.info('Completed processing email deliveries', result);
      
      return result;
    } catch (error) {
      logger.error('Error processing pending email deliveries', {
        error,
        processed: result.processed
      });
      
      return result;
    }
  }

  /**
   * Sends a digest email containing recent notifications to a user
   * @param user User to send digest to
   * @param frequency Frequency of the digest (daily, weekly)
   * @returns True if digest email was sent successfully, false otherwise
   */
  async sendDigestEmail(user: User, frequency: NotificationDigestFrequency): Promise<boolean> {
    try {
      // Calculate time range based on frequency
      const now = new Date();
      let startDate: Date;
      
      if (frequency === NotificationDigestFrequency.DAILY) {
        // Last 24 hours
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
      } else if (frequency === NotificationDigestFrequency.WEEKLY) {
        // Last 7 days
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
      } else {
        logger.error('Invalid digest frequency', { frequency });
        return false;
      }
      
      // Get notifications for the user within this time range
      const notifications = await this.notificationRepository.findByUserIdAndTimeRange(
        user.id,
        startDate,
        now
      );
      
      // If no notifications, no need to send digest
      if (!notifications || notifications.length === 0) {
        logger.debug('No notifications for digest', {
          userId: user.id,
          frequency
        });
        return true; // Return true as this is not an error condition
      }
      
      // Generate digest email content
      const emailContent = this.generateDigestEmailContent(user, notifications, frequency);
      
      // Create subject line
      const subjectLine = frequency === NotificationDigestFrequency.DAILY 
        ? 'Your Daily Metronomics Digest' 
        : 'Your Weekly Metronomics Digest';
      
      // Send the digest email
      const result = await this.sendEmail(user.email, subjectLine, emailContent);
      
      logger.info('Digest email sent', {
        userId: user.id,
        frequency,
        notificationCount: notifications.length,
        success: result
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to send digest email', {
        userId: user?.id,
        frequency,
        error
      });
      return false;
    }
  }

  /**
   * Generates HTML content for an email notification
   * @param notification Notification entity
   * @returns HTML content for the email
   */
  private generateEmailContent(notification: Notification): string {
    // Create a basic HTML template with Metronomics branding
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4361ee;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .footer {
            font-size: 12px;
            color: #666;
            text-align: center;
            padding: 20px;
          }
          .button {
            display: inline-block;
            background-color: #4361ee;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Metronomics</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.content}</p>
            ${notification.link ? `<a href="${notification.link}" class="button">View in Metronomics</a>` : ''}
          </div>
          <div class="footer">
            <p>This notification was sent from the Metronomics Platform.</p>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates HTML content for a digest email with multiple notifications
   * @param user User receiving the digest
   * @param notifications Array of notifications to include in the digest
   * @param frequency Frequency of the digest (daily, weekly)
   * @returns HTML content for the digest email
   */
  private generateDigestEmailContent(
    user: User,
    notifications: Notification[],
    frequency: NotificationDigestFrequency
  ): string {
    // Group notifications by type for better organization
    const groupedNotifications: Record<string, Notification[]> = {};
    
    for (const notification of notifications) {
      if (!groupedNotifications[notification.type]) {
        groupedNotifications[notification.type] = [];
      }
      groupedNotifications[notification.type].push(notification);
    }
    
    // Create sections for each notification type
    const notificationSections = Object.entries(groupedNotifications).map(([type, typeNotifications]) => {
      const notificationListItems = typeNotifications.map(notification => `
        <li style="margin-bottom: 15px;">
          <strong>${notification.title}</strong>
          <p>${notification.content}</p>
          ${notification.link ? `<a href="${notification.link}" style="color: #4361ee;">View details</a>` : ''}
        </li>
      `).join('');
      
      return `
        <div style="margin-bottom: 30px;">
          <h3>${this.formatNotificationType(type)}</h3>
          <ul style="padding-left: 20px;">
            ${notificationListItems}
          </ul>
        </div>
      `;
    }).join('');
    
    // Format the digest title based on frequency
    const digestTitle = frequency === NotificationDigestFrequency.DAILY 
      ? 'Your Daily Digest' 
      : 'Your Weekly Digest';
    
    // Create the full HTML email
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${digestTitle}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4361ee;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .footer {
            font-size: 12px;
            color: #666;
            text-align: center;
            padding: 20px;
          }
          .button {
            display: inline-block;
            background-color: #4361ee;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Metronomics</h1>
          </div>
          <div class="content">
            <h2>${digestTitle}</h2>
            <p>Hello ${user.firstName},</p>
            <p>Here's a summary of your recent notifications:</p>
            
            ${notificationSections}
            
            <a href="#" class="button">View All in Metronomics</a>
          </div>
          <div class="footer">
            <p>This digest was sent from the Metronomics Platform.</p>
            <p>You can manage your notification preferences in your <a href="#" style="color: #4361ee;">account settings</a>.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Formats notification type enum value to a user-friendly string
   * @param type Notification type
   * @returns Formatted notification type string
   */
  private formatNotificationType(type: string): string {
    // Convert SNAKE_CASE to Title Case with spaces
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}