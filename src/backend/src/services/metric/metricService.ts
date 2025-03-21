import { z } from 'zod'; // version ^3.21.4
import { MetricRepository } from '../../repositories/metricRepository';
import { MetricThresholdRepository } from '../../repositories/metricThresholdRepository';
import { MetricValueService } from './metricValueService';
import { MetricCalculationService } from './metricCalculationService';
import { FirestoreService } from '../realtime/firestoreService';
import {
  Metric,
  CreateMetricDto,
  UpdateMetricDto,
  MetricFilters,
  MetricDashboardData,
  ComparisonType,
  CalculationMethod,
  PaginationParams,
} from '../../types/metric.types';
import { createMetricSchema, updateMetricSchema } from '../../utils/validation/metricValidation';
import { validateMetricThresholds, validateFormulaForCalculationMethod } from '../../utils/validation/metricValidation';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/helpers/logger';

/**
 * Service class for managing metrics in the Metronomics Platform
 */
export class MetricService {
  private metricRepository: MetricRepository;
  private metricThresholdRepository: MetricThresholdRepository;
  private metricValueService: MetricValueService;
  private metricCalculationService: MetricCalculationService;
  private firestoreService: FirestoreService;

  /**
   * Initializes the metric service with required repositories and services
   * @param metricRepository Repository for metric data access operations
   * @param metricThresholdRepository Repository for metric threshold data access operations
   * @param metricValueService Service for managing metric values
   * @param metricCalculationService Service for performing complex metric calculations
   * @param firestoreService Service for real-time updates of metrics in Firestore
   */
  constructor(
    metricRepository: MetricRepository,
    metricThresholdRepository: MetricThresholdRepository,
    metricValueService: MetricValueService,
    metricCalculationService: MetricCalculationService,
    firestoreService: FirestoreService
  ) {
    this.metricRepository = metricRepository;
    this.metricThresholdRepository = metricThresholdRepository;
    this.metricValueService = metricValueService;
    this.metricCalculationService = metricCalculationService;
    this.firestoreService = firestoreService;
  }

  /**
   * Creates a new metric with optional thresholds and goal links
   * @param data Data for the new metric
   * @returns The created metric
   */
  async createMetric(data: CreateMetricDto): Promise<Metric> {
    // Validate the metric data using createMetricSchema
    try {
      createMetricSchema.parse(data);
    } catch (error) {
      logger.error('Invalid metric data', { error });
      throw ValidationError.fromZodError(error);
    }

    // Validate formula if calculation method is FORMULA
    if (data.calculationMethod === CalculationMethod.FORMULA) {
      const formulaValidationResult = validateFormulaForCalculationMethod(data.calculationMethod, data.formula);
      if (typeof formulaValidationResult === 'string') {
        throw new ValidationError(formulaValidationResult);
      }
    }

    // Validate thresholds if provided
    if (data.thresholds && data.thresholds.length > 0) {
      const thresholdValidationResult = validateMetricThresholds(data.thresholds, data.type);
      if (typeof thresholdValidationResult === 'string') {
        throw new ValidationError(thresholdValidationResult);
      }
    }

    try {
      // Create the metric using the repository
      const metric = await this.metricRepository.create(data);

      // If thresholds are provided, create them for the metric
      if (data.thresholds && data.thresholds.length > 0) {
        await this.metricThresholdRepository.bulkCreateForMetric(metric.id, data.thresholds);
      }

      // If goalIds are provided, link the goals to the metric
      if (data.goalIds && data.goalIds.length > 0) {
        for (const goalId of data.goalIds) {
          await this.metricRepository.addGoalToMetric(metric.id, goalId);
        }
      }

      // Update the metric in Firestore for real-time updates
      await this.firestoreService.updateDocument('metrics', metric.id, {
        name: metric.name,
        description: metric.description,
        type: metric.type,
        unit: metric.unit,
        comparisonType: metric.comparisonType,
        calculationMethod: metric.calculationMethod,
        formula: metric.formula,
        teamId: metric.teamId,
        organizationId: metric.organizationId,
      });

      // Log the creation of the metric
      logger.info('Metric created successfully', { metricId: metric.id });

      // Return the created metric with its relationships
      return await this.metricRepository.findByIdOrThrow(metric.id, {
        include: {
          values: true,
          thresholds: true,
          goals: true,
        },
      });
    } catch (error) {
      logger.error('Error creating metric', { error, data });
      throw error;
    }
  }

  /**
   * Retrieves a metric by its ID
   * @param id The ID of the metric to retrieve
   * @param options Additional options for the query
   * @returns The metric if found, null otherwise
   */
  async getMetricById(id: string, options: object = {}): Promise<Metric | null> {
    // Validate the metric ID
    if (!id) {
      throw new ValidationError('Metric ID is required');
    }

    try {
      // Call repository to find metric by ID with optional includes
      const metric = await this.metricRepository.findById(id, options);

      // Return the metric or null if not found
      return metric;
    } catch (error) {
      logger.error('Error retrieving metric by ID', { error, id });
      throw error;
    }
  }

  /**
   * Retrieves metrics for a specific organization
   * @param organizationId The ID of the organization to retrieve metrics for
   * @param options Additional options for the query
   * @returns Array of metrics for the organization
   */
  async getMetricsByOrganization(organizationId: string, options: object = {}): Promise<Metric[]> {
    // Validate the organization ID
    if (!organizationId) {
      throw new ValidationError('Organization ID is required');
    }

    try {
      // Call repository to find metrics by organization ID
      const metrics = await this.metricRepository.findByOrganizationId(organizationId, options);

      // Return the metrics
      return metrics;
    } catch (error) {
      logger.error('Error retrieving metrics by organization ID', { error, organizationId });
      throw error;
    }
  }

  /**
   * Retrieves metrics for a specific team
   * @param teamId The ID of the team to retrieve metrics for
   * @param options Additional options for the query
   * @returns Array of metrics for the team
   */
  async getMetricsByTeam(teamId: string, options: object = {}): Promise<Metric[]> {
    // Validate the team ID
    if (!teamId) {
      throw new ValidationError('Team ID is required');
    }

    try {
      // Call repository to find metrics by team ID
      const metrics = await this.metricRepository.findByTeamId(teamId, options);

      // Return the metrics
      return metrics;
    } catch (error) {
      logger.error('Error retrieving metrics by team ID', { error, teamId });
      throw error;
    }
  }

  /**
   * Retrieves metrics linked to a specific goal
   * @param goalId The ID of the goal to retrieve metrics for
   * @param options Additional options for the query
   * @returns Array of metrics linked to the goal
   */
  async getMetricsByGoal(goalId: string, options: object = {}): Promise<Metric[]> {
    // Validate the goal ID
    if (!goalId) {
      throw new ValidationError('Goal ID is required');
    }

    try {
      // Call repository to find metrics by goal ID
      const metrics = await this.metricRepository.findByGoalId(goalId, options);

      // Return the metrics
      return metrics;
    } catch (error) {
      logger.error('Error retrieving metrics by goal ID', { error, goalId });
      throw error;
    }
  }

  /**
   * Retrieves metrics based on filters with pagination
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @param options Additional options for the query
   * @returns Paginated metrics and total count
   */
  async getMetricsWithFilters(
    filters: MetricFilters,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: Metric[]; total: number }> {
    // Validate the filters and pagination parameters
    try {
      z.object({
        organizationId: z.string().uuid(),
      }).parse({ organizationId: filters.organizationId });
      z.object({
        page: z.number().min(1),
        limit: z.number().min(1).max(100),
      }).parse({ page: pagination.page, limit: pagination.limit });
    } catch (error) {
      logger.error('Invalid filters or pagination parameters', { error });
      throw ValidationError.fromZodError(error);
    }

    try {
      // Call repository to find metrics with values and thresholds based on filters
      const result = await this.metricRepository.findWithValuesAndThresholds(filters, pagination, options);

      // Return the paginated metrics and total count
      return result;
    } catch (error) {
      logger.error('Error retrieving metrics with filters', { error, filters, pagination });
      throw error;
    }
  }

  /**
   * Updates an existing metric
   * @param id The ID of the metric to update
   * @param data The data to update
   * @returns The updated metric
   */
  async updateMetric(id: string, data: UpdateMetricDto): Promise<Metric> {
    // Validate the metric ID and update data using updateMetricSchema
    try {
      updateMetricSchema.parse(data);
    } catch (error) {
      logger.error('Invalid metric update data', { error });
      throw ValidationError.fromZodError(error);
    }

    // Verify the metric exists
    try {
      await this.metricRepository.findByIdOrThrow(id);
    } catch (error) {
      logger.error('Metric not found', { error, id });
      throw error;
    }

    // Validate formula if calculation method is FORMULA
    if (data.calculationMethod === CalculationMethod.FORMULA) {
      const formulaValidationResult = validateFormulaForCalculationMethod(data.calculationMethod, data.formula);
      if (typeof formulaValidationResult === 'string') {
        throw new ValidationError(formulaValidationResult);
      }
    }

    try {
      // Update the metric using the repository
      const metric = await this.metricRepository.update(id, data);

      // Update the metric in Firestore for real-time updates
      await this.firestoreService.updateDocument('metrics', metric.id, {
        name: metric.name,
        description: metric.description,
        type: metric.type,
        unit: metric.unit,
        comparisonType: metric.comparisonType,
        calculationMethod: metric.calculationMethod,
        formula: metric.formula,
        teamId: metric.teamId,
      });

      // Log the update of the metric
      logger.info('Metric updated successfully', { metricId: metric.id });

      // Return the updated metric
      return metric;
    } catch (error) {
      logger.error('Error updating metric', { error, id, data });
      throw error;
    }
  }

  /**
   * Deletes a metric and its related data
   * @param id The ID of the metric to delete
   * @returns The deleted metric
   */
  async deleteMetric(id: string): Promise<Metric> {
    // Validate the metric ID
    if (!id) {
      throw new ValidationError('Metric ID is required');
    }

    // Verify the metric exists
    try {
      await this.metricRepository.findByIdOrThrow(id);
    } catch (error) {
      logger.error('Metric not found', { error, id });
      throw error;
    }

    try {
      // Delete all thresholds for the metric
      await this.metricThresholdRepository.deleteAllForMetric(id);

      // Delete the metric using the repository
      const metric = await this.metricRepository.delete(id);

      // Log the deletion of the metric
      logger.info('Metric deleted successfully', { metricId: metric.id });

      // Return the deleted metric
      return metric;
    } catch (error) {
      logger.error('Error deleting metric', { error, id });
      throw error;
    }
  }

  /**
   * Links a goal to a metric
   * @param metricId The ID of the metric to link
   * @param goalId The ID of the goal to link
   * @returns The updated metric with the new goal link
   */
  async linkGoalToMetric(metricId: string, goalId: string): Promise<Metric> {
    // Validate the metric ID and goal ID
    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }
    if (!goalId) {
      throw new ValidationError('Goal ID is required');
    }

    try {
      // Call repository to add goal to metric
      const metric = await this.metricRepository.addGoalToMetric(metricId, goalId);

      // Log the linking of goal to metric
      logger.info('Goal linked to metric successfully', { metricId, goalId });

      // Return the updated metric
      return metric;
    } catch (error) {
      logger.error('Error linking goal to metric', { error, metricId, goalId });
      throw error;
    }
  }

  /**
   * Removes a goal link from a metric
   * @param metricId The ID of the metric to update
   * @param goalId The ID of the goal to unlink
   * @returns The updated metric with the goal link removed
   */
  async unlinkGoalFromMetric(metricId: string, goalId: string): Promise<Metric> {
    // Validate the metric ID and goal ID
    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }
    if (!goalId) {
      throw new ValidationError('Goal ID is required');
    }

    try {
      // Call repository to remove goal from metric
      const metric = await this.metricRepository.removeGoalFromMetric(metricId, goalId);

      // Log the unlinking of goal from metric
      logger.info('Goal unlinked from metric successfully', { metricId, goalId });

      // Return the updated metric
      return metric;
    } catch (error) {
      logger.error('Error unlinking goal from metric', { error, metricId, goalId });
      throw error;
    }
  }

  /**
   * Prepares comprehensive dashboard data with metrics, values, and trends
   * @param filters Filters to apply to the query
   * @param comparisonType Type of comparison for trend calculation
   * @param referenceDate Reference date for comparison
   * @returns Complete dashboard data structure
   */
  async getDashboardData(
    filters: MetricFilters,
    comparisonType: ComparisonType,
    referenceDate: Date = new Date()
  ): Promise<MetricDashboardData> {
    // Validate the filters and comparison type
    if (!filters) {
      throw new ValidationError('Metric filters are required');
    }
    if (!comparisonType) {
      throw new ValidationError('Comparison type is required');
    }

    // Set default reference date to current date if not provided
    const refDate = referenceDate || new Date();

    try {
      // Retrieve metrics based on filters
      const metrics = await this.metricRepository.findByOrganizationId(filters.organizationId, {
        include: {
          thresholds: true,
          team: true
        }
      });

      // Use metricCalculationService to prepare dashboard data
      const dashboardData = await this.metricCalculationService.prepareDashboardData(
        metrics,
        comparisonType,
        refDate
      );

      // Return the dashboard data
      return dashboardData;
    } catch (error) {
      logger.error('Error preparing dashboard data', { error, filters, comparisonType, referenceDate });
      throw error;
    }
  }

  /**
   * Generates forecast data for a metric based on historical values
   * @param metricId ID of the metric to forecast
   * @param periods Number of periods to forecast
   * @returns Forecasted data points
   */
  async getForecastData(metricId: string, periods: number): Promise<any> {
    // Validate the metric ID and periods
    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }
    if (!periods) {
      throw new ValidationError('Number of periods is required');
    }

    try {
      // Verify the metric exists
      await this.metricRepository.findByIdOrThrow(metricId);

      // Use metricCalculationService to calculate forecast
      const forecastData = await this.metricCalculationService.calculateForecast(metricId, periods);

      // Return the forecasted data
      return forecastData;
    } catch (error) {
      logger.error('Error getting forecast data', { error, metricId, periods });
      throw error;
    }
  }

  /**
   * Calculates the value of a derived metric based on its calculation method
   * @param metricId ID of the metric to calculate
   * @param timestamp Timestamp for which to calculate the value
   * @returns Calculated metric value or null if calculation fails
   */
  async calculateDerivedMetricValue(metricId: string, timestamp: Date): Promise<number | null> {
    // Validate the metric ID and timestamp
    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }
    if (!timestamp) {
      throw new ValidationError('Timestamp is required');
    }

    try {
      // Use metricCalculationService to calculate derived metric value
      const calculatedValue = await this.metricCalculationService.calculateDerivedMetric(metricId, timestamp);

      // Return the calculated value
      return calculatedValue;
    } catch (error) {
      logger.error('Error calculating derived metric value', { error, metricId, timestamp });
      throw error;
    }
  }
}