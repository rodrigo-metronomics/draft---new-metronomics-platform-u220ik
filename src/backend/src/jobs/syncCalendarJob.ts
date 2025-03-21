import * as cron from 'node-cron'; // version ^3.0.2
import { CalendarSyncWorker } from '../workers/syncCalendarWorker';
import { OrganizationRepository } from '../repositories/organizationRepository';
import { env } from '../config/environment';
import { logger } from '../utils/helpers/logger';

/**
 * Global variable to hold the cron job instance for calendar synchronization
 */
let syncCalendarJob: cron.ScheduledTask | null = null;

/**
 * Global variable to hold the CalendarSyncWorker instance
 */
let calendarSyncWorker: CalendarSyncWorker | null = null;

/**
 * Starts the scheduled calendar synchronization job with the configured cron schedule
 * @param schedule Cron schedule string (e.g., '0 0 * * *' for daily at midnight)
 */
export function startSyncCalendarJob(schedule?: string): void {
  // Check if the job is already running and stop it if needed
  if (syncCalendarJob) {
    stopSyncCalendarJob();
  }

  // Use provided schedule or fall back to environment variable
  const cronSchedule = schedule || env.CALENDAR_SYNC_SCHEDULE;

  // Validate the cron schedule format
  if (!cron.validate(cronSchedule)) {
    logger.error('Invalid cron schedule format. Job not started.', { schedule: cronSchedule });
    return;
  }

  // Initialize the calendar sync worker if not already initialized
  if (!calendarSyncWorker) {
    initializeCalendarSyncWorker()
      .catch(error => {
        logger.error('Failed to initialize CalendarSyncWorker', { error });
      });
    if (!calendarSyncWorker) {
      logger.error('CalendarSyncWorker is null after initialization attempt. Job not started.');
      return;
    }
  }

  // Schedule the job using node-cron with the validated schedule
  syncCalendarJob = cron.schedule(cronSchedule, async () => {
    logger.info('Running scheduled calendar synchronization job');
    await runCalendarSync();
  });

  // Log successful job scheduling
  logger.info('Scheduled calendar synchronization job', { schedule: cronSchedule });
}

/**
 * Stops the currently running calendar synchronization job
 */
export function stopSyncCalendarJob(): void {
  // Check if job is currently running
  if (syncCalendarJob) {
    // Stop the job if it exists
    syncCalendarJob.stop();

    // Set the job reference to null
    syncCalendarJob = null;

    // Log successful job stopping
    logger.info('Stopped calendar synchronization job');
  }
}

/**
 * Executes the calendar synchronization process for all organizations
 */
export async function runCalendarSync(): Promise<void> {
  // Log the start of the calendar synchronization process
  logger.info('Starting calendar synchronization process for all organizations');

  // Initialize the calendar sync worker if not already initialized
  if (!calendarSyncWorker) {
    await initializeCalendarSyncWorker();
    if (!calendarSyncWorker) {
      logger.error('CalendarSyncWorker is null after initialization attempt. Aborting sync.');
      return;
    }
  }

  // Create instance of OrganizationRepository
  const organizationRepository = new OrganizationRepository();

  try {
    // Retrieve all active organizations
    const allOrganizations = await organizationRepository.findAll();

    // For each organization, call syncOrganizationMeetings on the worker
    for (const organization of allOrganizations) {
      try {
        const meetingsSynced = await calendarSyncWorker.syncOrganizationMeetings(organization.id);
        logger.info(`Calendar synchronization completed for organization`, {
          organizationId: organization.id,
          meetingsSynced
        });
      } catch (error) {
        logger.error(`Error synchronizing calendar for organization`, {
          organizationId: organization.id,
          error
        });
      }
    }

    // Log the completion of the calendar synchronization process
    logger.info('Calendar synchronization process completed for all organizations');
  } catch (error) {
    logger.error('Error during calendar synchronization process', { error });
  }
}

/**
 * Initializes the calendar synchronization worker if not already initialized
 */
async function initializeCalendarSyncWorker(): Promise<CalendarSyncWorker> {
  // Check if worker is already initialized
  if (calendarSyncWorker) {
    return calendarSyncWorker;
  }

  try {
    // If not initialized, create a new CalendarSyncWorker instance with system user ID
    calendarSyncWorker = new CalendarSyncWorker(env.SYSTEM_USER_ID);

    // Call initialize() on the worker
    await calendarSyncWorker.initialize();

    return calendarSyncWorker;
  } catch (error) {
    logger.error('Failed to initialize CalendarSyncWorker', { error });
    throw error;
  }
}