import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { 
  MetricValue, 
  MetricValueFilters, 
  CreateMetricValueDto, 
  TimeSeriesDataPoint,
  ComparisonType 
} from '../types/metric.types';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { logger } from '../utils/helpers/logger';

/**
 * Repository class for metric value data access operations,
 * extending BaseRepository to provide specialized methods for retrieving,
 * creating, and analyzing metric values, including time-series data
 * and aggregations for dashboards.
 */
export class MetricValueRepository extends BaseRepository<MetricValue> {
  /**
   * Initializes the metric value repository with the MetricValue model
   */
  constructor() {
    super('metricValue');
  }

  /**
   * Finds all values for a specific metric
   * 
   * @param metricId - The ID of the metric to find values for
   * @param options - Additional query options such as includes
   * @returns Array of metric values for the metric
   */
  async findByMetricId(
    metricId: string,
    options: Record<string, any> = {}
  ): Promise<MetricValue[]> {
    try {
      if (!metricId) {
        throw new Error('Metric ID is required');
      }

      logger.debug(`MetricValueRepository.findByMetricId`, { metricId });

      const include = this.buildInclude(options);
      
      const metricValues = await this.model.findMany({
        where: { metricId },
        ...include,
        orderBy: { timestamp: 'desc' }
      });

      return metricValues;
    } catch (error) {
      logger.error(`Error in MetricValueRepository.findByMetricId`, { metricId, error });
      throw error;
    }
  }

  /**
   * Finds metric values for a specific metric within a date range
   * 
   * @param metricId - The ID of the metric to find values for
   * @param startDate - The start date of the date range
   * @param endDate - The end date of the date range
   * @param options - Additional query options such as includes
   * @returns Array of metric values within the date range
   */
  async findByMetricIdAndDateRange(
    metricId: string,
    startDate: Date,
    endDate: Date,
    options: Record<string, any> = {}
  ): Promise<MetricValue[]> {
    try {
      if (!metricId) {
        throw new Error('Metric ID is required');
      }

      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      logger.debug(`MetricValueRepository.findByMetricIdAndDateRange`, { 
        metricId, startDate, endDate 
      });

      const include = this.buildInclude(options);
      
      const metricValues = await this.model.findMany({
        where: {
          metricId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        ...include,
        orderBy: { timestamp: 'asc' }
      });

      return metricValues;
    } catch (error) {
      logger.error(`Error in MetricValueRepository.findByMetricIdAndDateRange`, { 
        metricId, startDate, endDate, error 
      });
      throw error;
    }
  }

  /**
   * Finds the most recent value for a specific metric
   * 
   * @param metricId - The ID of the metric to find the latest value for
   * @param options - Additional query options such as includes
   * @returns The latest metric value or null if none exists
   */
  async findLatestByMetricId(
    metricId: string,
    options: Record<string, any> = {}
  ): Promise<MetricValue | null> {
    try {
      if (!metricId) {
        throw new Error('Metric ID is required');
      }

      logger.debug(`MetricValueRepository.findLatestByMetricId`, { metricId });

      const include = this.buildInclude(options);
      
      const metricValue = await this.model.findFirst({
        where: { metricId },
        ...include,
        orderBy: { timestamp: 'desc' },
        take: 1
      });

      return metricValue;
    } catch (error) {
      logger.error(`Error in MetricValueRepository.findLatestByMetricId`, { metricId, error });
      throw error;
    }
  }

  /**
   * Creates a new value for a specific metric
   * 
   * @param data - Data for the new metric value
   * @param userId - ID of the user creating the value
   * @returns The created metric value
   */
  async createForMetric(
    data: CreateMetricValueDto,
    userId: string
  ): Promise<MetricValue> {
    try {
      if (!data || !data.metricId) {
        throw new Error('Metric value data is required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      logger.debug(`MetricValueRepository.createForMetric`, { data, userId });

      const metricValue = await this.model.create({
        data: {
          ...data,
          userId
        }
      });

      return metricValue;
    } catch (error) {
      logger.error(`Error in MetricValueRepository.createForMetric`, { data, userId, error });
      throw error;
    }
  }

  /**
   * Gets aggregated values for a metric based on comparison type
   * 
   * @param metricId - The ID of the metric to get aggregated values for
   * @param comparisonType - The type of comparison (YTD, M/M, Y/Y)
   * @param referenceDate - The reference date for comparison (defaults to current date)
   * @returns Object containing current and previous period values
   */
  async getAggregatedValues(
    metricId: string,
    comparisonType: ComparisonType,
    referenceDate: Date = new Date()
  ): Promise<{ current: number | null; previous: number | null }> {
    try {
      if (!metricId) {
        throw new Error('Metric ID is required');
      }

      logger.debug(`MetricValueRepository.getAggregatedValues`, { 
        metricId, comparisonType, referenceDate 
      });

      // Default result
      let result = { current: null, previous: null };

      // Define date ranges based on comparison type
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date = new Date(referenceDate);
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;

      switch (comparisonType) {
        case ComparisonType.YEAR_TO_DATE:
          // Current period: Jan 1 of current year to reference date
          currentPeriodStart = new Date(referenceDate.getFullYear(), 0, 1);
          
          // Previous period: Same range in previous year
          previousPeriodStart = new Date(referenceDate.getFullYear() - 1, 0, 1);
          previousPeriodEnd = new Date(
            referenceDate.getFullYear() - 1,
            referenceDate.getMonth(),
            referenceDate.getDate()
          );
          break;
          
        case ComparisonType.MONTH_TO_MONTH:
          // Current period: Current month
          currentPeriodStart = new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth(),
            1
          );
          
          // Previous period: Previous month
          previousPeriodStart = new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth() - 1,
            1
          );
          previousPeriodEnd = new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth(),
            0
          );
          break;
          
        case ComparisonType.YEAR_TO_YEAR:
          // Current period: Last 12 months
          currentPeriodStart = new Date(
            referenceDate.getFullYear() - 1,
            referenceDate.getMonth(),
            referenceDate.getDate()
          );
          
          // Previous period: 12 months before that
          previousPeriodStart = new Date(
            referenceDate.getFullYear() - 2,
            referenceDate.getMonth(),
            referenceDate.getDate()
          );
          previousPeriodEnd = new Date(
            referenceDate.getFullYear() - 1,
            referenceDate.getMonth(),
            referenceDate.getDate() - 1
          );
          break;
          
        case ComparisonType.CUSTOM:
          // For custom, we'll just use the provided reference date
          // and get the latest value before that date, plus the latest
          // value before 1 period ago (period defined as the difference
          // between reference date and currentPeriodStart)
          currentPeriodStart = new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth() - 1,
            referenceDate.getDate()
          );
          
          previousPeriodStart = new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth() - 2,
            referenceDate.getDate()
          );
          previousPeriodEnd = new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth() - 1,
            referenceDate.getDate() - 1
          );
          break;
          
        default:
          throw new Error(`Unsupported comparison type: ${comparisonType}`);
      }

      // Get current period values
      const currentValues = await this.model.findMany({
        where: {
          metricId,
          timestamp: {
            gte: currentPeriodStart,
            lte: currentPeriodEnd
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Get previous period values
      const previousValues = await this.model.findMany({
        where: {
          metricId,
          timestamp: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Get the latest value from each period
      if (currentValues.length > 0) {
        result.current = currentValues[0].value;
      }

      if (previousValues.length > 0) {
        result.previous = previousValues[0].value;
      }

      return result;
    } catch (error) {
      logger.error(`Error in MetricValueRepository.getAggregatedValues`, { 
        metricId, comparisonType, referenceDate, error 
      });
      throw error;
    }
  }

  /**
   * Gets time series data for a metric for charting
   * 
   * @param metricId - The ID of the metric to get time series data for
   * @param startDate - The start date of the time range
   * @param endDate - The end date of the time range
   * @param interval - The interval for data points (day, week, month)
   * @returns Array of time series data points
   */
  async getTimeSeriesData(
    metricId: string,
    startDate: Date,
    endDate: Date,
    interval: string = 'day'
  ): Promise<TimeSeriesDataPoint[]> {
    try {
      if (!metricId) {
        throw new Error('Metric ID is required');
      }

      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      logger.debug(`MetricValueRepository.getTimeSeriesData`, { 
        metricId, startDate, endDate, interval 
      });

      // Find all metric values within the date range
      const values = await this.model.findMany({
        where: {
          metricId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      // Group the values by the specified interval
      const groupedValues = new Map<string, { timestamp: Date, value: number }>();

      values.forEach(value => {
        let key: string;
        const date = new Date(value.timestamp);
        
        switch (interval.toLowerCase()) {
          case 'day':
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            break;
          case 'week':
            // Calculate the week number
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
            const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            key = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
            break;
          case 'month':
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
          default:
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        }

        // Keep the latest value for each interval
        if (!groupedValues.has(key) || 
            date > groupedValues.get(key)!.timestamp) {
          groupedValues.set(key, { 
            timestamp: date,
            value: value.value
          });
        }
      });

      // Convert the grouped values to time series data points
      const timeSeriesData: TimeSeriesDataPoint[] = Array.from(groupedValues.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return timeSeriesData;
    } catch (error) {
      logger.error(`Error in MetricValueRepository.getTimeSeriesData`, { 
        metricId, startDate, endDate, interval, error 
      });
      throw error;
    }
  }

  /**
   * Builds a Prisma where clause from metric value filters
   * 
   * @param filters - The filters to apply
   * @returns Prisma where clause for metric value queries
   */
  buildWhereClause(filters: MetricValueFilters): Prisma.MetricValueWhereInput {
    const where: Prisma.MetricValueWhereInput = {};

    if (filters.metricId) {
      where.metricId = filters.metricId;
    }

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};

      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }

      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    return where;
  }
}