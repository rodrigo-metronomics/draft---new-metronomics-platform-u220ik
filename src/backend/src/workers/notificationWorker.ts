import { Queue, Job, QueueScheduler } from 'bull'; // ^4.10.4
import * as cron from 'node-cron'; // ^3.0.2
import { NotificationService } from '../services/notification/notificationService';
import { NotificationDigestFrequency, NotificationDeliveryResult } from '../types/notification.types';
import { logger } from '../utils/helpers/logger';
import { redisClient } from '../config/redis';
import { env } from '../config/environment';

/**
 * Worker class that manages asynchronous processing of notification deliveries and digest emails
 */
export class NotificationWorker {
  private notificationService: NotificationService;
  private deliveryQueue: Queue;
  private digestQueue: Queue;
  private deliveryScheduler: QueueScheduler;
  private digestScheduler: QueueScheduler;
  private initialized: boolean;

  /**
   * Initializes the notification worker with required dependencies
   */
  constructor() {
    this.notificationService = new NotificationService();
    this.initialized = false;
    
    logger.info('NotificationWorker created');
  }

  /**
   * Initializes the worker queues and sets up job processors
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.debug('NotificationWorker already initialized');
      return;
    }

    // Create queues
    this.deliveryQueue = new Queue('notification-delivery', {
      redis: redisClient,
      prefix: 'metronomics:queue',
    });

    this.digestQueue = new Queue('notification-digest', {
      redis: redisClient,
      prefix: 'metronomics:queue',
    });

    // Initialize schedulers
    this.deliveryScheduler = new QueueScheduler('notification-delivery', {
      redis: redisClient,
      prefix: 'metronomics:queue',
    });

    this.digestScheduler = new QueueScheduler('notification-digest', {
      redis: redisClient,
      prefix: 'metronomics:queue',
    });

    // Set up processors
    this.deliveryQueue.process(async (job: Job) => {
      return this.processDeliveryJob(job);
    });

    this.digestQueue.process(async (job: Job) => {
      return this.processDigestJob(job);
    });

    // Set up error handlers
    this.deliveryQueue.on('error', (error) => {
      this.handleQueueError(error);
    });

    this.digestQueue.on('error', (error) => {
      this.handleQueueError(error);
    });

    this.initialized = true;
    logger.info('NotificationWorker initialized successfully');
  }

  /**
   * Gracefully shuts down the worker queues
   * @returns Promise that resolves when shutdown is complete
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      logger.debug('NotificationWorker not initialized, nothing to shut down');
      return;
    }

    logger.info('Shutting down NotificationWorker...');
    
    // Close queues
    await this.deliveryQueue.close();
    await this.digestQueue.close();
    
    // Close schedulers
    await this.deliveryScheduler.close();
    await this.digestScheduler.close();
    
    this.initialized = false;
    logger.info('NotificationWorker successfully shut down');
  }

  /**
   * Adds a notification delivery job to the queue
   * @param batchSize The number of notifications to process in this batch
   * @param options Additional job options
   * @returns The created job
   */
  async enqueueDeliveryJob(batchSize: number, options: object = {}): Promise<Job> {
    this.ensureInitialized();
    
    const job = await this.deliveryQueue.add(
      { batchSize },
      { 
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        ...options
      }
    );
    
    logger.debug('Delivery job added to queue', { jobId: job.id, batchSize });
    return job;
  }

  /**
   * Adds a notification digest job to the queue
   * @param frequency The frequency type of digest to send
   * @param options Additional job options
   * @returns The created job
   */
  async enqueueDigestJob(frequency: NotificationDigestFrequency, options: object = {}): Promise<Job> {
    this.ensureInitialized();
    
    const job = await this.digestQueue.add(
      { frequency },
      { 
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        ...options
      }
    );
    
    logger.debug('Digest job added to queue', { jobId: job.id, frequency });
    return job;
  }

  /**
   * Sets up recurring jobs for notification processing
   * @returns Promise that resolves when scheduling is complete
   */
  async scheduleRecurringJobs(): Promise<void> {
    this.ensureInitialized();
    
    logger.info('Setting up recurring notification jobs');
    
    // Schedule delivery job to run every 5 minutes
    await this.deliveryQueue.add(
      { batchSize: 100 },
      { 
        repeat: { cron: '*/5 * * * *' },
        jobId: 'scheduled-delivery'
      }
    );
    
    // Schedule daily digest job to run at midnight
    await this.digestQueue.add(
      { frequency: NotificationDigestFrequency.DAILY },
      { 
        repeat: { cron: '0 0 * * *' },
        jobId: 'daily-digest'
      }
    );
    
    // Schedule weekly digest job to run on Sunday at midnight
    await this.digestQueue.add(
      { frequency: NotificationDigestFrequency.WEEKLY },
      { 
        repeat: { cron: '0 0 * * 0' },
        jobId: 'weekly-digest'
      }
    );
    
    logger.info('Recurring notification jobs scheduled successfully');
  }

  /**
   * Processes a batch of pending notification deliveries
   * @param job The delivery job to process
   * @returns Results of the delivery processing
   */
  private async processDeliveryJob(job: Job): Promise<NotificationDeliveryResult> {
    const { batchSize } = job.data;
    
    logger.info('Processing notification deliveries', { jobId: job.id, batchSize });
    
    const results = await this.notificationService.processDeliveries(batchSize);
    
    logger.info('Completed processing notification deliveries', { 
      jobId: job.id,
      processed: Object.values(results).reduce((sum, result) => sum + result.processed, 0),
      successful: Object.values(results).reduce((sum, result) => sum + result.successful, 0),
      failed: Object.values(results).reduce((sum, result) => sum + result.failed, 0)
    });
    
    return results;
  }

  /**
   * Processes notification digest emails for the specified frequency
   * @param job The digest job to process
   * @returns Results of the digest processing
   */
  private async processDigestJob(job: Job): Promise<{ sent: number; failed: number }> {
    const { frequency } = job.data;
    
    logger.info('Processing notification digests', { jobId: job.id, frequency });
    
    const results = await this.notificationService.sendDigestEmails(frequency);
    
    logger.info('Completed processing notification digests', { 
      jobId: job.id,
      sent: results.sent,
      failed: results.failed
    });
    
    return results;
  }

  /**
   * Handles errors that occur in the job queues
   * @param error The error that occurred
   */
  private handleQueueError(error: Error): void {
    logger.error('Error in notification queue', { error: error.message, stack: error.stack });
    
    // Implement appropriate error handling strategy
    // For example, we might want to alert on persistent errors
    if (env.isDevelopment) {
      console.error('Notification queue error:', error);
    }
  }

  /**
   * Ensures the worker is initialized before performing operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('NotificationWorker is not initialized. Call initialize() first.');
    }
  }
}