import * as mathjs from 'mathjs'; // ^11.8.0
import regression from 'regression'; // ^2.0.1

import { MetricRepository } from '../../repositories/metricRepository';
import { MetricValueRepository } from '../../repositories/metricValueRepository';
import {
  Metric,
  MetricWithValues,
  MetricDashboardData,
  TimeSeriesDataPoint,
  CalculationMethod,
  ComparisonType,
  TrendDirection
} from '../../types/metric.types';
import { getDateRangeForComparison } from '../../utils/helpers/dateTimeHelper';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/helpers/logger';

/**
 * Service class for performing complex metric calculations and data preparation
 * in the Metronomics Platform. Handles derived metrics, dashboard visualization,
 * forecasting, and enrichment of metrics with calculated values.
 */
export class MetricCalculationService {
  private metricRepository: MetricRepository;
  private metricValueRepository: MetricValueRepository;

  /**
   * Initializes the metric calculation service with required repositories
   * 
   * @param metricRepository Repository for accessing metric data
   * @param metricValueRepository Repository for accessing metric values
   */
  constructor(
    metricRepository: MetricRepository,
    metricValueRepository: MetricValueRepository
  ) {
    this.metricRepository = metricRepository;
    this.metricValueRepository = metricValueRepository;
  }

  /**
   * Calculates the value of a derived metric based on its calculation method
   * 
   * @param metricId ID of the metric to calculate
   * @param timestamp Timestamp for which to calculate the value
   * @returns Promise resolving to the calculated value or null if calculation fails
   */
  async calculateDerivedMetric(metricId: string, timestamp: Date): Promise<number | null> {
    try {
      logger.info('Calculating derived metric', { metricId, timestamp });

      // Retrieve the metric
      const metric = await this.metricRepository.findById(metricId);
      if (!metric) {
        throw NotFoundError.resourceNotFound('Metric', metricId);
      }

      // Check if metric has a calculation method other than MANUAL
      if (metric.calculationMethod === CalculationMethod.MANUAL) {
        logger.info('Metric has manual calculation method, no calculation needed', { metricId });
        return null;
      }

      // Get component metric IDs from formula or direct relationships
      const componentMetricIds: string[] = [];
      
      if (metric.calculationMethod === CalculationMethod.FORMULA && metric.formula) {
        // Extract metric IDs from formula - assuming metrics are referenced as metric_123 in formula
        const metricIdPattern = /metric_([a-zA-Z0-9-]+)/g;
        let match;
        while ((match = metricIdPattern.exec(metric.formula)) !== null) {
          componentMetricIds.push(match[1]);
        }
      } else if (metric.calculationMethod === CalculationMethod.SUM || 
                 metric.calculationMethod === CalculationMethod.AVERAGE) {
        // For SUM and AVERAGE, get the linked metrics
        // This assumes there's a way to get component metrics from the repository
        const linkedMetrics = await this.metricRepository.findWithValuesAndThresholds(
          { organizationId: metric.organizationId },
          { page: 1, limit: 100, offset: 0 }
        );
        
        // Filter metrics that are components of this derived metric
        // In a real implementation, there would be a proper relationship table
        // For simplicity, we'll assume there's a convention in naming or a field that links them
        const componentMetrics = linkedMetrics.data.filter(m => 
          m.name.startsWith(`${metric.name}_component`) || 
          (m as any).parentMetricId === metric.id
        );
        
        componentMetricIds.push(...componentMetrics.map(m => m.id));
      }

      // Get the values of component metrics
      const componentValues = await this.getComponentMetricValues(componentMetricIds, timestamp);

      // Calculate based on the calculation method
      let calculatedValue: number | null = null;

      switch (metric.calculationMethod) {
        case CalculationMethod.SUM:
          // Sum all component values, ignoring nulls
          calculatedValue = Object.values(componentValues)
            .filter(value => value !== null)
            .reduce((sum, value) => sum + (value as number), 0);
          break;

        case CalculationMethod.AVERAGE:
          // Calculate average of component values, ignoring nulls
          const validValues = Object.values(componentValues).filter(value => value !== null) as number[];
          if (validValues.length > 0) {
            calculatedValue = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
          }
          break;

        case CalculationMethod.FORMULA:
          if (!metric.formula) {
            throw ValidationError.requiredField('formula');
          }
          // Prepare variables for formula evaluation
          const variables: Record<string, any> = {};
          for (const [id, value] of Object.entries(componentValues)) {
            variables[`metric_${id}`] = value;
          }
          // Evaluate the formula
          calculatedValue = this.evaluateFormula(metric.formula, variables);
          break;

        default:
          logger.error('Unsupported calculation method', { method: metric.calculationMethod });
          throw new ValidationError(`Unsupported calculation method: ${metric.calculationMethod}`);
      }

      logger.info('Derived metric calculated successfully', { metricId, calculatedValue });
      return calculatedValue;
    } catch (error) {
      logger.error('Error calculating derived metric', { metricId, error });
      throw error;
    }
  }

  /**
   * Evaluates a formula with variable substitution for metric values
   * 
   * @param formula Formula string to evaluate
   * @param variables Object mapping variable names to values
   * @returns Result of formula evaluation or null if evaluation fails
   */
  evaluateFormula(formula: string, variables: object): number | null {
    try {
      // Validate formula to prevent injection or invalid expressions
      if (!formula || typeof formula !== 'string') {
        throw ValidationError.requiredField('formula');
      }

      logger.info('Evaluating formula', { formula });

      // Prepare the scope with variables
      const scope = { ...variables };

      // Evaluate the formula using mathjs
      const result = mathjs.evaluate(formula, scope);

      // Ensure the result is a number
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        logger.warn('Formula evaluation did not result in a valid number', { formula, result });
        return null;
      }

      return result;
    } catch (error) {
      logger.error('Error evaluating formula', { formula, error });
      return null;
    }
  }

  /**
   * Retrieves values for component metrics used in derived calculations
   * 
   * @param metricIds Array of metric IDs to retrieve values for
   * @param timestamp Timestamp for which to retrieve values
   * @returns Promise resolving to an object mapping metric IDs to their values
   */
  async getComponentMetricValues(metricIds: string[], timestamp: Date): Promise<{ [metricId: string]: number | null }> {
    try {
      if (!metricIds || !Array.isArray(metricIds) || metricIds.length === 0) {
        return {};
      }

      logger.info('Getting component metric values', { metricCount: metricIds.length, timestamp });

      const result: { [metricId: string]: number | null } = {};

      // Get the latest value before the timestamp for each metric
      for (const metricId of metricIds) {
        try {
          // Find values for this metric with timestamp <= specified timestamp
          const values = await this.metricValueRepository.findByMetricIdAndDateRange(
            metricId,
            new Date(0), // Start from earliest possible date
            timestamp,   // Up to specified timestamp
            { orderBy: { timestamp: 'desc' } } // Get the most recent value
          );

          // Use the latest value or null if no values exist
          result[metricId] = values.length > 0 ? values[0].value : null;
        } catch (error) {
          logger.warn(`Could not retrieve values for component metric ${metricId}`, { error });
          result[metricId] = null;
        }
      }

      return result;
    } catch (error) {
      logger.error('Error getting component metric values', { error });
      throw error;
    }
  }

  /**
   * Enriches metrics with calculated values, trends, and time series data
   * 
   * @param metrics Array of metrics to enrich
   * @param comparisonType Type of comparison for trend calculation
   * @param referenceDate Reference date for comparison (defaults to current date)
   * @returns Promise resolving to array of metrics with calculated values
   */
  async enrichMetricsWithCalculatedValues(
    metrics: Metric[],
    comparisonType: ComparisonType,
    referenceDate: Date = new Date()
  ): Promise<MetricWithValues[]> {
    try {
      if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
        return [];
      }

      logger.info('Enriching metrics with calculated values', { 
        metricCount: metrics.length, 
        comparisonType, 
        referenceDate 
      });

      const enrichedMetrics: MetricWithValues[] = [];
      const dateRange = getDateRangeForComparison(comparisonType, referenceDate);

      for (const metric of metrics) {
        try {
          // Get current and previous values based on comparison type
          const { current, previous } = await this.metricValueRepository.getAggregatedValues(
            metric.id,
            comparisonType,
            referenceDate
          );

          // Calculate change percentage and trend direction
          const changePercentage = this.calculateChangePercentage(current, previous);
          const trend = this.calculateTrendDirection(changePercentage);

          // Get time series data for charts
          const timeSeriesData = await this.metricValueRepository.getTimeSeriesData(
            metric.id,
            dateRange.currentPeriod.start,
            dateRange.currentPeriod.end,
            'day' // Default interval
          );

          // Create enriched metric object
          const enrichedMetric: MetricWithValues = {
            id: metric.id,
            name: metric.name,
            description: metric.description,
            type: metric.type,
            unit: metric.unit,
            comparisonType: metric.comparisonType,
            calculationMethod: metric.calculationMethod,
            currentValue: current,
            previousValue: previous,
            changePercentage,
            trend,
            thresholds: metric.thresholds || [],
            values: timeSeriesData,
            teamId: metric.teamId,
            team: metric.team
          };

          enrichedMetrics.push(enrichedMetric);
        } catch (error) {
          logger.error(`Error enriching metric ${metric.id}`, { error });
          // Continue with next metric instead of failing the entire operation
        }
      }

      return enrichedMetrics;
    } catch (error) {
      logger.error('Error enriching metrics with calculated values', { error });
      throw error;
    }
  }

  /**
   * Prepares comprehensive dashboard data with metrics, values, and trends
   * organized by categories
   * 
   * @param metrics Array of metrics to include in the dashboard
   * @param comparisonType Type of comparison for trend calculation
   * @param referenceDate Reference date for comparison (defaults to current date)
   * @returns Promise resolving to complete dashboard data structure
   */
  async prepareDashboardData(
    metrics: Metric[],
    comparisonType: ComparisonType,
    referenceDate: Date = new Date()
  ): Promise<MetricDashboardData> {
    try {
      if (!metrics || !Array.isArray(metrics)) {
        return {
          metrics: [],
          timeRange: {
            startDate: new Date(),
            endDate: new Date()
          },
          comparisonType,
          categories: {}
        };
      }

      logger.info('Preparing dashboard data', { 
        metricCount: metrics.length, 
        comparisonType, 
        referenceDate 
      });

      // Enrich metrics with calculated values
      const enrichedMetrics = await this.enrichMetricsWithCalculatedValues(
        metrics,
        comparisonType,
        referenceDate
      );

      // Get time range based on comparison type
      const dateRange = getDateRangeForComparison(comparisonType, referenceDate);

      // Organize metrics by category - first by type, then by team if available
      const categories: { [key: string]: MetricWithValues[] } = {};
      
      // Standard categories based on metric type
      enrichedMetrics.forEach(metric => {
        const category = metric.type.toString();
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(metric);
      });
      
      // Also organize by team if teams are available
      const teamCategories: { [key: string]: MetricWithValues[] } = {};
      enrichedMetrics.forEach(metric => {
        if (metric.team && metric.teamId) {
          const teamKey = `TEAM_${metric.teamId}`;
          if (!teamCategories[teamKey]) {
            teamCategories[teamKey] = [];
          }
          teamCategories[teamKey].push(metric);
        }
      });
      
      // Merge team categories into the main categories object
      Object.assign(categories, teamCategories);

      // Create dashboard data structure
      const dashboardData: MetricDashboardData = {
        metrics: enrichedMetrics,
        timeRange: {
          startDate: dateRange.currentPeriod.start,
          endDate: dateRange.currentPeriod.end
        },
        comparisonType,
        categories
      };

      return dashboardData;
    } catch (error) {
      logger.error('Error preparing dashboard data', { error });
      throw error;
    }
  }

  /**
   * Generates forecast data for a metric based on historical values
   * using linear regression analysis
   * 
   * @param metricId ID of the metric to forecast
   * @param periods Number of periods to forecast
   * @returns Promise resolving to array of forecasted data points
   */
  async calculateForecast(metricId: string, periods: number): Promise<TimeSeriesDataPoint[]> {
    try {
      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      if (!periods || periods <= 0 || periods > 365) {
        throw ValidationError.invalidValueRange('periods', 1, 365);
      }

      logger.info('Calculating forecast', { metricId, periods });

      // Retrieve historical data for the metric
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1); // Get 1 year of data

      const historicalData = await this.metricValueRepository.getTimeSeriesData(
        metricId,
        startDate,
        endDate,
        'day'
      );

      // Check if we have enough data points for forecasting
      if (historicalData.length < 5) {
        throw new ValidationError(
          'Insufficient historical data', 
          { detail: 'At least 5 data points are required for forecasting' }
        );
      }

      // Prepare data for regression analysis
      // Convert dates to numeric values (days since first data point)
      const firstDate = historicalData[0].timestamp.getTime();
      const regressionData = historicalData.map(point => [
        (point.timestamp.getTime() - firstDate) / (1000 * 60 * 60 * 24), // Days since first data point
        point.value
      ]);

      // Perform linear regression
      const result = regression.linear(regressionData);
      const slope = result.equation[0];
      const intercept = result.equation[1];

      // Generate forecasted points
      const forecastData: TimeSeriesDataPoint[] = [];
      
      // Last historical point
      const lastPoint = historicalData[historicalData.length - 1];
      const lastDate = lastPoint.timestamp;
      
      // Generate future points
      for (let i = 1; i <= periods; i++) {
        // Calculate future date
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + i);
        
        // Calculate days since first data point
        const days = (forecastDate.getTime() - firstDate) / (1000 * 60 * 60 * 24);
        
        // Calculate forecasted value using regression equation
        const forecastValue = slope * days + intercept;
        
        forecastData.push({
          timestamp: forecastDate,
          value: forecastValue
        });
      }

      logger.info('Forecast calculation complete', { 
        metricId, 
        periods, 
        pointsGenerated: forecastData.length,
        equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`
      });

      return forecastData;
    } catch (error) {
      logger.error('Error calculating forecast', { metricId, periods, error });
      throw error;
    }
  }

  /**
   * Determines the trend direction based on percentage change
   * 
   * @param changePercentage Percentage change to evaluate
   * @returns Trend direction (UP, DOWN, or FLAT)
   */
  calculateTrendDirection(changePercentage: number | null): TrendDirection {
    // If no change percentage, trend is flat
    if (changePercentage === null) {
      return TrendDirection.FLAT;
    }

    // Define thresholds for determining trend direction
    const upThreshold = 1; // 1% increase is considered UP
    const downThreshold = -1; // 1% decrease is considered DOWN

    if (changePercentage > upThreshold) {
      return TrendDirection.UP;
    } else if (changePercentage < downThreshold) {
      return TrendDirection.DOWN;
    } else {
      return TrendDirection.FLAT;
    }
  }

  /**
   * Calculates the percentage change between current and previous values
   * 
   * @param current Current value
   * @param previous Previous value
   * @returns Percentage change or null if calculation not possible
   */
  calculateChangePercentage(current: number | null, previous: number | null): number | null {
    // If either value is null, can't calculate change
    if (current === null || previous === null) {
      return null;
    }

    // Handle division by zero
    if (previous === 0) {
      // If current is also 0, no change
      if (current === 0) {
        return 0;
      }
      // If current is not 0, but previous is 0, this is an infinite increase
      // For practical purposes, return a large number (e.g., 100% or more)
      return current > 0 ? 100 : -100;
    }

    // Calculate percentage change
    const change = ((current - previous) / Math.abs(previous)) * 100;
    
    // Round to 2 decimal places
    return Math.round(change * 100) / 100;
  }
}