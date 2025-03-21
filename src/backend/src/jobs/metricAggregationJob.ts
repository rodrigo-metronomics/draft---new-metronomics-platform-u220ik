import cron from 'node-cron'; // ^3.0.2
import { MetricRepository } from '../repositories/metricRepository';
import { MetricValueRepository } from '../repositories/metricValueRepository';
import { MetricCalculationService } from '../services/metric/metricCalculationService';
import { OrganizationRepository } from '../repositories/organizationRepository';
import { CalculationMethod } from '../types/metric.types';
import { env } from '../config/environment';
import { logger } from '../utils/helpers/logger';

// Global variable to hold the cron job
let metricAggregationJob: cron.ScheduledTask | null = null;

/**
 * Starts the scheduled metric aggregation job with the configured cron schedule
 * @param schedule Custom cron schedule, defaults to value from environment
 */
export function startMetricAggregationJob(schedule?: string): void {
  // If a job is already running, stop it first
  if (metricAggregationJob) {
    stopMetricAggregationJob();
  }

  // Use provided schedule or fall back to environment variable
  const jobSchedule = schedule || env.METRIC_AGGREGATION_SCHEDULE;
  
  // Validate the cron schedule format
  if (!jobSchedule || !cron.validate(jobSchedule)) {
    const error = new Error(`Invalid cron schedule: ${jobSchedule}`);
    logger.error('Failed to start metric aggregation job', { error, schedule: jobSchedule });
    throw error;
  }

  try {
    logger.info('Starting metric aggregation job', { schedule: jobSchedule });
    
    // Schedule the job using node-cron
    metricAggregationJob = cron.schedule(jobSchedule, async () => {
      try {
        await runMetricAggregation();
      } catch (error) {
        logger.error('Error in metric aggregation job execution', { error });
      }
    });
    
    logger.info('Metric aggregation job scheduled successfully');
  } catch (error) {
    logger.error('Failed to start metric aggregation job', { error });
    throw error;
  }
}

/**
 * Stops the currently running metric aggregation job
 */
export function stopMetricAggregationJob(): void {
  if (metricAggregationJob) {
    logger.info('Stopping metric aggregation job');
    metricAggregationJob.stop();
    metricAggregationJob = null;
    logger.info('Metric aggregation job stopped successfully');
  }
}

/**
 * Executes the metric aggregation process for all organizations
 * This can be called manually or triggered by the scheduled job
 */
export async function runMetricAggregation(): Promise<void> {
  try {
    logger.info('Starting metric aggregation process');
    
    // Create instance of OrganizationRepository
    const organizationRepository = new OrganizationRepository();
    
    // Get all active organizations
    const { data: organizations } = await organizationRepository.findMany(
      { /* No filters to get all active organizations */ },
      { page: 1, limit: 1000, offset: 0 } // Using a large limit to get all organizations
    );
    
    logger.info('Found organizations for metric aggregation', { count: organizations.length });
    
    // Process metrics for each organization
    for (const organization of organizations) {
      try {
        await processOrganizationMetrics(organization.id);
      } catch (error) {
        logger.error('Error processing metrics for organization', { 
          organizationId: organization.id, 
          error 
        });
        // Continue with next organization instead of failing the entire process
      }
    }
    
    logger.info('Metric aggregation process completed successfully');
  } catch (error) {
    logger.error('Error in metric aggregation process', { error });
    throw error;
  }
}

/**
 * Processes all derived metrics for a specific organization
 * @param organizationId ID of the organization to process metrics for
 */
async function processOrganizationMetrics(organizationId: string): Promise<void> {
  try {
    // Create instances of required repositories and services
    const metricRepository = new MetricRepository();
    const metricValueRepository = new MetricValueRepository();
    const metricCalculationService = new MetricCalculationService(
      metricRepository, 
      metricValueRepository
    );
    
    // Get all metrics for the organization
    const metrics = await metricRepository.findByOrganizationId(organizationId);
    
    // Filter metrics to only those with non-MANUAL calculation methods
    const derivedMetrics = metrics.filter(
      metric => metric.calculationMethod !== CalculationMethod.MANUAL
    );
    
    logger.info('Processing derived metrics', { 
      organizationId, 
      totalMetrics: metrics.length, 
      derivedMetricCount: derivedMetrics.length 
    });
    
    // Calculate current values for each derived metric
    const now = new Date();
    let processedCount = 0;
    
    for (const metric of derivedMetrics) {
      try {
        // Calculate the metric value
        const calculatedValue = await metricCalculationService.calculateDerivedMetric(
          metric.id, 
          now
        );
        
        // If calculation returns a value, create a new metric value record
        if (calculatedValue !== null) {
          // Note: In a production implementation, there should be a dedicated system user
          // or a specific mechanism to handle system-generated values rather than using
          // a hardcoded ID. This is simplified for the current implementation.
          const systemUserId = 'system';
          
          await metricValueRepository.createForMetric(
            {
              metricId: metric.id,
              value: calculatedValue,
              timestamp: now,
              note: 'Automatically calculated by system job'
            },
            systemUserId
          );
          processedCount++;
        }
      } catch (error) {
        logger.error('Error calculating derived metric', { 
          organizationId, 
          metricId: metric.id, 
          error 
        });
        // Continue with next metric instead of failing the entire organization
      }
    }
    
    logger.info('Derived metrics processing completed', { 
      organizationId, 
      processedCount 
    });
  } catch (error) {
    logger.error('Error processing organization metrics', { organizationId, error });
    throw error;
  }
}