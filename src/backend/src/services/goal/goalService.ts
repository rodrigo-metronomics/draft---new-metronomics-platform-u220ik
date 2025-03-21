import { z } from 'zod'; // ^3.21.4
import { GoalRepository } from '../../repositories/goalRepository';
import { MetricRepository } from '../../repositories/metricRepository';
import { MilestoneService } from './milestoneService';
import { NotificationService } from '../notification/notificationService';
import {
  Goal,
  GoalType,
  GoalStatus,
  GoalWithMilestones,
  GoalWithMetrics,
  GoalWithMilestonesAndMetrics,
  CreateGoalDto,
  UpdateGoalDto,
  GoalFilters,
} from '../../types/goal.types';
import { NotificationType } from '../../types/notification.types';
import { ValidationError, NotFoundError } from '../../utils/errors';
import {
  createGoalSchema,
  updateGoalSchema,
  validateGoalDates,
} from '../../utils/validation/goalValidation';
import { logger } from '../../utils/helpers/logger';
import { FindManyParams } from '../../repositories/baseRepository';

/**
 * Service class for managing strategic goals in the Metronomics Platform
 */
export class GoalService {
  private goalRepository: GoalRepository;
  private metricRepository: MetricRepository;
  private milestoneService: MilestoneService;
  private notificationService: NotificationService;

  /**
   * Initializes the goal service with required repositories and services
   * @param goalRepository Repository for goal data access operations
   * @param metricRepository Repository for metric data access operations
   * @param milestoneService Service for milestone operations related to goals
   * @param notificationService Service for sending notifications about goal changes
   */
  constructor(
    goalRepository: GoalRepository,
    metricRepository: MetricRepository,
    milestoneService: MilestoneService,
    notificationService: NotificationService
  ) {
    this.goalRepository = goalRepository;
    this.metricRepository = metricRepository;
    this.milestoneService = milestoneService;
    this.notificationService = notificationService;
  }

  /**
   * Retrieves a goal by its ID
   * @param id The goal ID
   * @returns The goal with the specified ID
   */
  async getGoal(id: string): Promise<Goal> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('GoalService.getGoal', { id });
    return this.goalRepository.findByIdOrThrow(id);
  }

  /**
   * Retrieves a goal with its associated milestones
   * @param id The goal ID
   * @returns The goal with its milestones
   */
  async getGoalWithMilestones(id: string): Promise<GoalWithMilestones> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('GoalService.getGoalWithMilestones', { id });
    return this.goalRepository.findWithMilestonesOrThrow(id);
  }

  /**
   * Retrieves a goal with its associated metrics
   * @param id The goal ID
   * @returns The goal with its metrics
   */
  async getGoalWithMetrics(id: string): Promise<GoalWithMetrics> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('GoalService.getGoalWithMetrics', { id });
    return this.goalRepository.findWithMetricsOrThrow(id);
  }

  /**
   * Retrieves a goal with both its milestones and metrics
   * @param id The goal ID
   * @returns The goal with milestones and metrics
   */
  async getGoalWithMilestonesAndMetrics(id: string): Promise<GoalWithMilestonesAndMetrics> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('GoalService.getGoalWithMilestonesAndMetrics', { id });
    return this.goalRepository.findWithMilestonesAndMetricsOrThrow(id);
  }

  /**
   * Retrieves goals filtered by type (BHAG, THREE_HAG, ONE_HAG, QUARTERLY)
   * @param type The goal type to filter by
   * @param organizationId The organization ID
   * @returns Array of goals matching the type
   */
  async getGoalsByType(type: GoalType, organizationId: string): Promise<Goal[]> {
    if (!type || !organizationId) {
      throw new Error('Goal type and organizationId are required');
    }

    logger.debug('GoalService.getGoalsByType', { type, organizationId });
    return this.goalRepository.findByType(type, organizationId, {});
  }

  /**
   * Retrieves goals filtered by status (DRAFT, ACTIVE, AT_RISK, COMPLETED, ARCHIVED)
   * @param status The goal status to filter by
   * @param organizationId The organization ID
   * @returns Array of goals matching the status
   */
  async getGoalsByStatus(status: GoalStatus, organizationId: string): Promise<Goal[]> {
    if (!status || !organizationId) {
      throw new Error('Goal status and organizationId are required');
    }

    logger.debug('GoalService.getGoalsByStatus', { status, organizationId });
    return this.goalRepository.findByStatus(status, organizationId, {});
  }

  /**
   * Retrieves all goals for a specific organization
   * @param organizationId The organization ID
   * @returns Array of goals for the organization
   */
  async getOrganizationGoals(organizationId: string): Promise<Goal[]> {
    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    logger.debug('GoalService.getOrganizationGoals', { organizationId });
    return this.goalRepository.findByOrganization(organizationId, {});
  }

  /**
   * Finds goals matching the specified filters with pagination
   * @param filters Filters to apply to the query
   * @param params Pagination and sorting parameters
   * @returns Filtered goals and total count
   */
  async findGoals(
    filters: GoalFilters,
    params: FindManyParams
  ): Promise<{ data: Goal[]; total: number }> {
    logger.debug('GoalService.findGoals', { filters, params });
    return this.goalRepository.findWithFilters(filters, params);
  }

  /**
   * Creates a new strategic goal
   * @param data The goal data
   * @returns The created goal
   */
  async createGoal(data: CreateGoalDto): Promise<Goal> {
    logger.debug('GoalService.createGoal', { data });

    try {
      // Validate the data using createGoalSchema
      createGoalSchema.parse(data);

      // Validate goal dates based on goal type using validateGoalDates
      validateGoalDates(data.startDate, data.endDate, data.type);

      // Call goalRepository.createGoal to create the goal
      const goal = await this.goalRepository.createGoal(data);

      // Send notification about new goal creation if needed
      await this.notifyGoalUpdate(goal, 'created');

      // Return the created goal
      return goal;
    } catch (error) {
      logger.error('Error creating goal', { error, data });
      throw error;
    }
  }

  /**
   * Updates an existing strategic goal
   * @param id The goal ID
   * @param data The updated goal data
   * @returns The updated goal
   */
  async updateGoal(id: string, data: UpdateGoalDto): Promise<Goal> {
    logger.debug('GoalService.updateGoal', { id, data });

    try {
      // Validate the ID and data using updateGoalSchema
      updateGoalSchema.parse({ id, ...data });

      // Call goalRepository.updateGoal to update the goal
      const goal = await this.goalRepository.updateGoal(id, data);

      // Send notification about goal update if needed
      await this.notifyGoalUpdate(goal, 'updated');

      // Return the updated goal
      return goal;
    } catch (error) {
      logger.error('Error updating goal', { error, id, data });
      throw error;
    }
  }

  /**
   * Updates the progress percentage of a goal
   * @param id The goal ID
   * @param progress The new progress value (0-100)
   * @returns The updated goal with new progress value
   */
  async updateGoalProgress(id: string, progress: number): Promise<Goal> {
    logger.debug('GoalService.updateGoalProgress', { id, progress });

    try {
      // Validate the ID and progress parameters (progress between 0-100)
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        throw ValidationError.invalidValueRange('progress', 0, 100);
      }

      // Call goalRepository.updateProgress to update the goal progress
      const goal = await this.goalRepository.updateProgress(id, progress);

      // Send notification about goal progress update if needed
      await this.notifyGoalUpdate(goal, 'progress_updated');

      return goal;
    } catch (error) {
      logger.error('Error updating goal progress', { error, id, progress });
      throw error;
    }
  }

  /**
   * Recalculates a goal's progress based on milestone completion
   * @param id The ID of the goal
   * @returns The updated goal with recalculated progress
   */
  async recalculateGoalProgress(id: string): Promise<Goal> {
    logger.debug('GoalService.recalculateGoalProgress', { id });

    try {
      // Call milestoneService.calculateGoalProgress to calculate the new progress
      const progress = await this.milestoneService.calculateGoalProgress(id);

      // Update the goal's status based on the new progress value
      const goal = await this.goalRepository.updateProgress(id, progress);

      // Send notification about goal progress recalculation if needed
      await this.notifyGoalUpdate(goal, 'progress_recalculated');

      return goal;
    } catch (error) {
      logger.error('Error recalculating goal progress', { error, id });
      throw error;
    }
  }

  /**
   * Deletes a strategic goal by ID
   * @param id The ID of the goal to delete
   * @returns The deleted goal
   */
  async deleteGoal(id: string): Promise<Goal> {
    logger.debug('GoalService.deleteGoal', { id });

    try {
      // Call goalRepository.delete to delete the goal
      const goal = await this.goalRepository.delete(id);

      // Send notification about goal deletion if needed
      await this.notifyGoalUpdate(goal, 'deleted');

      return goal;
    } catch (error) {
      logger.error('Error deleting goal', { error, id });
      throw error;
    }
  }

  /**
   * Links a metric to a goal for tracking progress
   * @param goalId The goal ID
   * @param metricId The metric ID
   * @returns The updated goal with the linked metric
   */
  async linkMetricToGoal(goalId: string, metricId: string): Promise<Goal> {
    logger.debug('GoalService.linkMetricToGoal', { goalId, metricId });

    try {
      // Call goalRepository.linkMetric to create the relationship
      const goal = await this.goalRepository.linkMetric(goalId, metricId);

      // Send notification about metric linked to goal if needed
      await this.notifyGoalUpdate(goal, 'metric_linked');

      return goal;
    } catch (error) {
      logger.error('Error linking metric to goal', { error, goalId, metricId });
      throw error;
    }
  }

  /**
   * Unlinks a metric from a goal
   * @param goalId The goal ID
   * @param metricId The metric ID
   * @returns The updated goal without the unlinked metric
   */
  async unlinkMetricFromGoal(goalId: string, metricId: string): Promise<Goal> {
    logger.debug('GoalService.unlinkMetricFromGoal', { goalId, metricId });

    try {
      // Call goalRepository.unlinkMetric to remove the relationship
      const goal = await this.goalRepository.unlinkMetric(goalId, metricId);

      // Send notification about metric unlinked from goal if needed
      await this.notifyGoalUpdate(goal, 'metric_unlinked');

      return goal;
    } catch (error) {
      logger.error('Error unlinking metric from goal', { error, goalId, metricId });
      throw error;
    }
  }

  /**
   * Updates the metrics linked to a goal
   * @param goalId The goal ID
   * @param metricIds Array of metric IDs to link to the goal
   * @returns The updated goal with the new set of metrics
   */
  async updateGoalMetrics(goalId: string, metricIds: string[]): Promise<Goal> {
    logger.debug('GoalService.updateGoalMetrics', { goalId, metricIds });

    try {
      // Call goalRepository.updateMetrics to update the goal's metrics
      const goal = await this.goalRepository.updateMetrics(goalId, metricIds);

      // Send notification about goal metrics updated if needed
      await this.notifyGoalUpdate(goal, 'metrics_updated');

      return goal;
    } catch (error) {
      logger.error('Error updating goal metrics', { error, goalId, metricIds });
      throw error;
    }
  }

  /**
   * Retrieves all metrics linked to a specific goal
   * @param goalId The goal ID
   * @returns Array of metrics linked to the goal
   */
  async getGoalMetrics(goalId: string): Promise<Metric[]> {
    logger.debug('GoalService.getGoalMetrics', { goalId });

    try {
      // Call metricRepository.findByGoalId with the goalId
      const metrics = await this.metricRepository.findByGoalId(goalId);
      return metrics;
    } catch (error) {
      logger.error('Error getting goal metrics', { error, goalId });
      throw error;
    }
  }

  /**
   * Checks and updates goal statuses based on progress and dates
   * @returns Array of updated goals
   */
  async checkGoalStatuses(): Promise<Goal[]> {
    logger.debug('GoalService.checkGoalStatuses');
    return [];
  }

  /**
   * Sends notifications about goal updates to relevant stakeholders
   * @param goal The goal that was updated
   * @param updateType Type of update that occurred
   */
  async notifyGoalUpdate(goal: Goal, updateType: string): Promise<void> {
    logger.info('Sending notification for goal update', {
      goalId: goal.id,
      updateType,
    });
  }
}