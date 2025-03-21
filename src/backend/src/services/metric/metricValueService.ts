import { MetricValueRepository } from '../../repositories/metricValueRepository';
import { MetricRepository } from '../../repositories/metricRepository';
import { NotificationService } from '../notification/notificationService';
import { FirestoreService } from '../realtime/firestoreService';
import {
  MetricValue,
  CreateMetricValueDto,
  MetricValueFilters,
  TimeSeriesDataPoint,
  MetricTrend,
  ComparisonType,
  TrendDirection,
  ThresholdCrossing,
  Metric,
} from '../../types/metric.types';
import { NotificationType } from '../../types/notification.types';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/helpers/logger';

/**
 * Service class for managing metric values in the Metronomics Platform
 */
export class MetricValueService {
  private metricValueRepository: MetricValueRepository;
  private metricRepository: MetricRepository;
  private notificationService: NotificationService;
  private firestoreService: FirestoreService;

  /**
   * Initializes the metric value service with required repositories and services
   * @param metricValueRepository Repository for metric value data access operations
   * @param metricRepository Repository for metric data access operations
   * @param notificationService Service for sending notifications when metric thresholds are crossed
   * @param firestoreService Service for real-time updates of metric values in Firestore
   */
  constructor(
    metricValueRepository: MetricValueRepository,
    metricRepository: MetricRepository,
    notificationService: NotificationService,
    firestoreService: FirestoreService
  ) {
    this.metricValueRepository = metricValueRepository;
    this.metricRepository = metricRepository;
    this.notificationService = notificationService;
    this.firestoreService = firestoreService;
  }

  /**
   * Creates a new value for a metric and checks for threshold crossings
   * @param data Data for the new metric value
   * @param userId ID of the user creating the value
   * @returns The created metric value
   */
  async createMetricValue(
    data: CreateMetricValueDto,
    userId: string
  ): Promise<MetricValue> {
    // Validate the data and userId parameters
    if (!data) {
      throw new ValidationError('Metric value data is required');
    }
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Verify that the metric exists
    const metricId = data.metricId;
    try {
      await this.metricRepository.findByIdOrThrow(metricId);
    } catch (error) {
      throw new NotFoundError(`Metric with id '${metricId}' not found`);
    }

    // Create the metric value using the repository
    let metricValue: MetricValue;
    try {
      metricValue = await this.metricValueRepository.createForMetric(data, userId);
    } catch (error) {
      logger.error('Error creating metric value', { error, metricId, userId });
      throw error;
    }

    // Update the metric value in Firestore for real-time updates
    try {
      await this.firestoreService.updateMetricValue(metricId, metricValue.value);
    } catch (error) {
      logger.error('Error updating metric value in Firestore', { error, metricId, userId });
    }

    // Check for threshold crossings with the new value
    try {
      const crossings = await this.checkThresholdCrossings(metricId, metricValue.value);

      // If thresholds are crossed, send notifications
      if (crossings && crossings.length > 0) {
        await this.sendThresholdAlerts(metricId, crossings);
      }
    } catch (error) {
      logger.error('Error checking or sending threshold alerts', { error, metricId, userId });
    }

    // Log the creation of the metric value
    logger.info('Metric value created successfully', { metricId, userId });

    // Return the created metric value
    return metricValue;
  }

  /**
   * Retrieves values for a metric based on filters
   * @param filters Filters to apply to the query
   * @returns Array of metric values matching the filters
   */
  async getMetricValues(filters: MetricValueFilters): Promise<MetricValue[]> {
    // Validate the filters parameter
    if (!filters) {
      throw new ValidationError('Metric value filters are required');
    }

    // If startDate and endDate are provided, use findByMetricIdAndDateRange
    if (filters.startDate && filters.endDate) {
      return this.metricValueRepository.findByMetricIdAndDateRange(
        filters.metricId,
        filters.startDate,
        filters.endDate
      );
    }

    // Otherwise, use findByMetricId for all values
    return this.metricValueRepository.findByMetricId(filters.metricId);
  }

  /**
   * Retrieves the most recent value for a metric
   * @param metricId ID of the metric to retrieve the latest value for
   * @returns The latest metric value or null if none exists
   */
  async getLatestMetricValue(metricId: string): Promise<MetricValue | null> {
    // Validate the metricId parameter
    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }

    // Use the repository to find the latest value for the metric
    return this.metricValueRepository.findLatestByMetricId(metricId);
  }

  /**
   * Calculates trend data for a metric based on comparison type
   * @param metricId ID of the metric to calculate trend data for
   * @param comparisonType The type of comparison (YTD, M/M, Y/Y)
   * @param referenceDate The reference date for comparison (defaults to current date)
   * @returns Trend data including current and previous values, change percentage, and trend direction
   */
  async getMetricTrend(
    metricId: string,
    comparisonType: ComparisonType,
    referenceDate: Date = new Date()
  ): Promise<MetricTrend> {
    // Validate the metricId and comparisonType parameters
    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }
    if (!comparisonType) {
      throw new ValidationError('Comparison type is required');
    }

    // Use the repository to get aggregated values for current and previous periods
    const { current, previous } = await this.metricValueRepository.getAggregatedValues(
      metricId,
      comparisonType,
      referenceDate
    );

    // Calculate the percentage change between periods
    let changePercentage: number | null = null;
    let trend: TrendDirection = TrendDirection.FLAT;

    if (current !== null && previous !== null && previous !== 0) {
      changePercentage = ((current - previous) / Math.abs(previous)) * 100;

      // Determine trend direction (UP, DOWN, or FLAT) based on the change
      if (changePercentage > 0) {
        trend = TrendDirection.UP;
      } else if (changePercentage < 0) {
        trend = TrendDirection.DOWN;
      } else {
        trend = TrendDirection.FLAT;
      }
    }

    // Return the trend data object
    return {
      current,
      previous,
      changePercentage,
      trend,
    };
  }

  /**
   * Retrieves time series data for a metric for charting
   * @param metricId ID of the metric to retrieve time series data for
   * @param startDate The start date of the time range
   * @param endDate The end date of the time range
   * @param interval The interval for data points (day, week, month)
   * @returns Array of time series data points
   */
  async getTimeSeriesData(
    metricId: string,
    startDate: Date,
    endDate: Date,
    interval: string
  ): Promise<TimeSeriesDataPoint[]> {
    // Validate the metricId, startDate, endDate, and interval parameters
    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }
    if (!startDate) {
      throw new ValidationError('Start date is required');
    }
    if (!endDate) {
      throw new ValidationError('End date is required');
    }
    if (!interval) {
      throw new ValidationError('Interval is required');
    }

    // Use the repository to get time series data with the specified interval
    return this.metricValueRepository.getTimeSeriesData(metricId, startDate, endDate, interval);
  }

  /**
   * Checks if a new metric value crosses any defined thresholds
   * @param metricId ID of the metric to check
   * @param value New value of the metric
   * @returns Array of threshold crossing information
   */
  async checkThresholdCrossings(
    metricId: string,
    value: number
  ): Promise<ThresholdCrossing[]> {
    // Validate the metricId and value parameters
    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }
    if (value === null || value === undefined) {
      throw new ValidationError('Value is required');
    }

    // Retrieve the metric with its thresholds
    const metric: Metric | null = await this.metricRepository.findById(metricId, {
      include: { thresholds: true },
    });

    if (!metric) {
      throw new NotFoundError(`Metric with id '${metricId}' not found`);
    }

    const crossings: ThresholdCrossing[] = [];

    // For each threshold, check if the value crosses it
    if (metric.thresholds) {
      metric.thresholds.forEach((threshold) => {
        let crossed = false;

        switch (threshold.type) {
          case 'TARGET':
            crossed = value >= threshold.value;
            break;
          case 'WARNING':
            crossed = value >= threshold.value;
            break;
          case 'CRITICAL':
            crossed = value >= threshold.value;
            break;
          default:
            break;
        }

        crossings.push({
          thresholdId: threshold.id,
          type: threshold.type,
          value: threshold.value,
          crossed,
        });
      });
    }

    // Return array of threshold crossing information
    return crossings;
  }

  /**
   * Sends notifications for crossed thresholds
   * @param metricId ID of the metric that crossed thresholds
   * @param crossings Array of threshold crossing information
   */
  async sendThresholdAlerts(metricId: string, crossings: ThresholdCrossing[]): Promise<void> {
    // Filter crossings to only those that were actually crossed
    const actualCrossings = crossings.filter((crossing) => crossing.crossed);

    // If no crossings, return early
    if (!actualCrossings || actualCrossings.length === 0) {
      return;
    }

    // Retrieve the metric details
    const metric: Metric | null = await this.metricRepository.findById(metricId);

    if (!metric) {
      throw new NotFoundError(`Metric with id '${metricId}' not found`);
    }

    // For each crossing, create a notification with appropriate content
    for (const crossing of actualCrossings) {
      const notificationContent = `Metric '${metric.name}' crossed ${crossing.type} threshold of ${crossing.value}`;

      // Send high priority notifications using the notification service
      await this.notificationService.sendHighPriorityNotification({
        type: NotificationType.METRIC_THRESHOLD_ALERT,
        title: 'Metric Threshold Alert',
        content: notificationContent,
        priority: 'HIGH',
        userId: metric.organizationId, // TODO: Determine the appropriate user ID
        organizationId: metric.organizationId,
        channels: ['PUSH', 'IN_APP'], // Send via push and in-app
      });
    }
  }
}