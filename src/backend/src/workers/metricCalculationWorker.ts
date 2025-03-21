import { MetricRepository } from '../repositories/metricRepository';
import { MetricValueRepository } from '../repositories/metricValueRepository';
import { MetricCalculationService } from '../services/metric/metricCalculationService';
import { NotificationService } from '../services/notification/notificationService';
import { FirestoreService } from '../services/realtime/firestoreService';
import { Metric, CalculationMethod, NotificationType } from '../types/metric.types';
import { prisma } from '../config/database';
import { logger } from '../utils/helpers/logger';

/**
 * Worker class for handling metric calculation jobs
 */
export class MetricCalculationWorker {
  private metricRepository: MetricRepository;
  private metricValueRepository: MetricValueRepository;
  private metricCalculationService: MetricCalculationService;
  private notificationService: NotificationService;
  private firestoreService: FirestoreService;
  private systemUserId: string;

  /**
   * Initializes the metric calculation worker with required dependencies
   * @param systemUserId 
   */
  constructor(systemUserId: string) {
    this.metricRepository = new MetricRepository();
    this.metricValueRepository = new MetricValueRepository();
    this.metricCalculationService = new MetricCalculationService(this.metricRepository, this.metricValueRepository);
    this.notificationService = new NotificationService();
    this.firestoreService = new FirestoreService();
    this.systemUserId = systemUserId;
  }

  /**
   * Processes a calculation for a single metric
   * @param metricId 
   * @param timestamp 
   */
  async processMetric(metricId: string, timestamp: Date): Promise<void> {
    try {
      logger.info('Starting metric processing', { metricId, timestamp });
      await processMetricCalculation(metricId, timestamp, this.systemUserId);
      logger.info('Metric processing completed successfully', { metricId, timestamp });
    } catch (error) {
      logger.error('Error processing metric', { metricId, error });
    }
  }

  /**
   * Processes a batch of metrics
   * @param metricIds 
   * @param timestamp 
   */
  async processBatch(metricIds: string[], timestamp: Date): Promise<{ successful: string[]; failed: string[] }> {
    try {
      logger.info('Starting batch processing', { metricCount: metricIds.length, timestamp });
      const result = await processBatchMetricCalculations(metricIds, timestamp, this.systemUserId);
      logger.info('Batch processing completed', { successful: result.successful.length, failed: result.failed.length, timestamp });
      return result;
    } catch (error) {
      logger.error('Error processing batch', { error });
      return { successful: [], failed: metricIds };
    }
  }

  /**
   * Schedules calculations for all derived metrics in an organization
   * @param organizationId 
   */
  async scheduleOrganizationCalculations(organizationId: string): Promise<void> {
    try {
      logger.info('Starting organization calculations scheduling', { organizationId });
      await scheduleMetricCalculations(organizationId, this.systemUserId);
      logger.info('Organization calculations scheduling completed', { organizationId });
    } catch (error) {
      logger.error('Error scheduling organization calculations', { error });
    }
  }
}

/**
 * Processes a metric calculation job for a specific metric
 * @param metricId 
 * @param timestamp 
 * @param systemUserId 
 */
export async function processMetricCalculation(metricId: string, timestamp: Date, systemUserId: string): Promise<void> {
  // Initialize required services and repositories
  const metricRepository = new MetricRepository();
  const metricValueRepository = new MetricValueRepository();
  const metricCalculationService = new MetricCalculationService(metricRepository, metricValueRepository);
  const notificationService = new NotificationService();
  const firestoreService = new FirestoreService();

  logger.info('Starting metric calculation', { metricId, timestamp });

  try {
    // Retrieve the metric by ID
    const metric = await metricRepository.findById(metricId);

    // Check if the metric exists and has a calculation method other than MANUAL
    if (!metric || metric.calculationMethod === CalculationMethod.MANUAL) {
      logger.info('Metric not found or has manual calculation method', { metricId, exists: !!metric });
      return;
    }

    // Calculate the derived metric value using MetricCalculationService
    const calculatedValue = await metricCalculationService.calculateDerivedMetric(metricId, timestamp);

    // If calculation successful, create a new metric value record
    if (calculatedValue !== null) {
      await metricValueRepository.createForMetric(
        {
          metricId,
          value: calculatedValue,
          timestamp,
          note: 'Calculated by system'
        },
        systemUserId
      );

      // Update the metric value in Firestore for real-time updates
      await firestoreService.updateDocument('metrics', metricId, {
        currentValue: calculatedValue,
        updatedAt: new Date()
      });

      // Send notification about calculation completion
      await notificationService.sendHighPriorityNotification({
        type: NotificationType.METRIC_CALCULATION_COMPLETE,
        title: 'Metric Calculation Complete',
        content: `Metric ${metric.name} calculation completed successfully.`,
        priority: 'MEDIUM',
        userId: systemUserId,
        organizationId: metric.organizationId,
        channels: ['IN_APP']
      });

      logger.info('Metric calculation completed successfully', { metricId, calculatedValue });
    } else {
      logger.warn('Metric calculation resulted in null value', { metricId });
    }
  } catch (error) {
    logger.error('Error during metric calculation', { metricId, error });
  }
}

/**
 * Processes a batch of metric calculations for multiple metrics
 * @param metricIds 
 * @param timestamp 
 * @param systemUserId 
 */
export async function processBatchMetricCalculations(
  metricIds: string[],
  timestamp: Date,
  systemUserId: string
): Promise<{ successful: string[]; failed: string[] }> {
  // Initialize tracking arrays for successful and failed calculations
  const successful: string[] = [];
  const failed: string[] = [];

  logger.info('Starting batch metric calculation', { metricCount: metricIds.length, timestamp });

  // Process each metric ID in sequence
  for (const metricId of metricIds) {
    try {
      // For each metric, call processMetricCalculation
      await processMetricCalculation(metricId, timestamp, systemUserId);
      successful.push(metricId);
    } catch (error) {
      // Catch and log errors for individual metrics
      logger.error('Error calculating metric in batch', { metricId, error });
      failed.push(metricId);
    }
  }

  logger.info('Batch metric calculation completed', { successful: successful.length, failed: failed.length });

  // Return the results with successful and failed metric IDs
  return { successful, failed };
}

/**
 * Finds all metrics that use derived calculation methods
 * @param organizationId 
 */
export async function findDerivedMetrics(organizationId: string): Promise<Metric[]> {
  // Initialize MetricRepository
  const metricRepository = new MetricRepository();

  // Query for metrics in the specified organization
  const metrics = await metricRepository.findByOrganizationId(organizationId);

  // Filter metrics to only those with calculation methods other than MANUAL
  const derivedMetrics = metrics.filter(metric => metric.calculationMethod !== CalculationMethod.MANUAL);

  logger.debug('Found derived metrics', { count: derivedMetrics.length });

  // Return the filtered list of derived metrics
  return derivedMetrics;
}

/**
 * Schedules calculation jobs for all derived metrics in an organization
 * @param organizationId 
 * @param systemUserId 
 */
export async function scheduleMetricCalculations(organizationId: string, systemUserId: string): Promise<void> {
  try {
    // Find all derived metrics in the organization
    const derivedMetrics = await findDerivedMetrics(organizationId);

    // Create a timestamp for the calculation
    const timestamp = new Date();

    // Extract metric IDs from the derived metrics
    const metricIds = derivedMetrics.map(metric => metric.id);

    // Process batch calculations for all derived metrics
    const { successful, failed } = await processBatchMetricCalculations(metricIds, timestamp, systemUserId);

    logger.info('Scheduled metric calculations', {
      organizationId,
      total: metricIds.length,
      successful: successful.length,
      failed: failed.length
    });
  } catch (error) {
    logger.error('Error scheduling metric calculations', { organizationId, error });
  }
}