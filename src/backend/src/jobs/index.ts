import {
  startMetricAggregationJob,
  stopMetricAggregationJob,
  runMetricAggregation,
} from './metricAggregationJob';
import {
  startReminderNotificationJob,
  stopReminderNotificationJob,
  runReminderNotifications,
} from './reminderNotificationJob';
import {
  startSyncCalendarJob,
  stopSyncCalendarJob,
  runCalendarSync,
} from './syncCalendarJob';
import { logger } from '../utils/helpers/logger';

/**
 * Starts all scheduled jobs with their configured schedules
 */
export function startAllJobs(): void {
  // Start the metric aggregation job
  startMetricAggregationJob();

  // Start the reminder notification job
  startReminderNotificationJob();

  // Start the calendar synchronization job
  startSyncCalendarJob();

  // Log successful initialization of all scheduled jobs
  logger.info('All scheduled jobs initialized successfully');
}

/**
 * Stops all currently running scheduled jobs
 */
export function stopAllJobs(): void {
  // Stop the metric aggregation job
  stopMetricAggregationJob();

  // Stop the reminder notification job
  stopReminderNotificationJob();

  // Stop the calendar synchronization job
  stopSyncCalendarJob();

  // Log successful stopping of all scheduled jobs
  logger.info('All scheduled jobs stopped successfully');
}

// Export individual job control functions
export {
  startMetricAggregationJob,
  stopMetricAggregationJob,
  runMetricAggregation,
  startReminderNotificationJob,
  stopReminderNotificationJob,
  runReminderNotifications,
  startSyncCalendarJob,
  stopSyncCalendarJob,
  runCalendarSync,
};