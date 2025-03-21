import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository, FindManyParams, FindOptions } from './baseRepository';
import { prisma } from '../config/database';
import { 
  Goal, 
  GoalType, 
  GoalStatus, 
  GoalWithMilestones, 
  GoalWithMetrics, 
  GoalWithMilestonesAndMetrics,
  CreateGoalDto,
  UpdateGoalDto,
  GoalFilters
} from '../types/goal.types';
import { NotFoundError } from '../utils/errors';

/**
 * Repository class for managing strategic goals in the database.
 * Provides methods for creating, reading, updating, and deleting goals,
 * as well as specialized queries for filtering goals by type, status, and organization.
 */
export class GoalRepository extends BaseRepository<Goal> {
  private defaultInclude: Prisma.GoalInclude;
  private milestonesInclude: Prisma.GoalInclude;
  private metricsInclude: Prisma.GoalInclude;
  private fullInclude: Prisma.GoalInclude;

  /**
   * Initializes the goal repository with the appropriate model name and include options.
   */
  constructor() {
    super('goal');
    
    // Initialize default include object
    this.defaultInclude = {};
    
    // Initialize milestones include object
    this.milestonesInclude = {
      milestones: {
        orderBy: {
          dueDate: 'asc'
        }
      }
    };
    
    // Initialize metrics include object
    this.metricsInclude = {
      metrics: {
        include: {
          metric: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    };
    
    // Initialize full include object (both milestones and metrics)
    this.fullInclude = {
      ...this.milestonesInclude,
      ...this.metricsInclude
    };
  }

  /**
   * Finds a goal by ID with its associated milestones.
   * 
   * @param id The goal ID
   * @param options Additional query options
   * @returns The goal with milestones or null if not found
   */
  async findWithMilestones(id: string, options: FindOptions = {}): Promise<GoalWithMilestones | null> {
    this.validateId(id);
    
    const include = this.buildGoalInclude(true, false, options);
    
    const goal = await prisma.goal.findUnique({
      where: { id },
      include
    });
    
    return goal as GoalWithMilestones | null;
  }

  /**
   * Finds a goal by ID with its associated milestones or throws an error if not found.
   * 
   * @param id The goal ID
   * @param options Additional query options
   * @returns The goal with milestones
   * @throws NotFoundError if the goal is not found
   */
  async findWithMilestonesOrThrow(id: string, options: FindOptions = {}): Promise<GoalWithMilestones> {
    const goal = await this.findWithMilestones(id, options);
    
    if (!goal) {
      throw NotFoundError.resourceNotFound('Goal', id);
    }
    
    return goal;
  }

  /**
   * Finds a goal by ID with its associated metrics.
   * 
   * @param id The goal ID
   * @param options Additional query options
   * @returns The goal with metrics or null if not found
   */
  async findWithMetrics(id: string, options: FindOptions = {}): Promise<GoalWithMetrics | null> {
    this.validateId(id);
    
    const include = this.buildGoalInclude(false, true, options);
    
    const goal = await prisma.goal.findUnique({
      where: { id },
      include
    });
    
    if (!goal) {
      return null;
    }
    
    // Transform the metrics array to match the GoalWithMetrics interface
    const transformedGoal = {
      ...goal,
      metrics: goal.metrics ? goal.metrics.map((metricGoal: any) => ({
        id: metricGoal.metric.id,
        name: metricGoal.metric.name
      })) : []
    };
    
    return transformedGoal as GoalWithMetrics;
  }

  /**
   * Finds a goal by ID with its associated metrics or throws an error if not found.
   * 
   * @param id The goal ID
   * @param options Additional query options
   * @returns The goal with metrics
   * @throws NotFoundError if the goal is not found
   */
  async findWithMetricsOrThrow(id: string, options: FindOptions = {}): Promise<GoalWithMetrics> {
    const goal = await this.findWithMetrics(id, options);
    
    if (!goal) {
      throw NotFoundError.resourceNotFound('Goal', id);
    }
    
    return goal;
  }

  /**
   * Finds a goal by ID with both its milestones and metrics.
   * 
   * @param id The goal ID
   * @param options Additional query options
   * @returns The goal with milestones and metrics or null if not found
   */
  async findWithMilestonesAndMetrics(id: string, options: FindOptions = {}): Promise<GoalWithMilestonesAndMetrics | null> {
    this.validateId(id);
    
    const include = this.buildGoalInclude(true, true, options);
    
    const goal = await prisma.goal.findUnique({
      where: { id },
      include
    });
    
    if (!goal) {
      return null;
    }
    
    // Transform the metrics array to match the GoalWithMilestonesAndMetrics interface
    const transformedGoal = {
      ...goal,
      metrics: goal.metrics ? goal.metrics.map((metricGoal: any) => ({
        id: metricGoal.metric.id,
        name: metricGoal.metric.name
      })) : []
    };
    
    return transformedGoal as GoalWithMilestonesAndMetrics;
  }

  /**
   * Finds a goal by ID with both its milestones and metrics or throws an error if not found.
   * 
   * @param id The goal ID
   * @param options Additional query options
   * @returns The goal with milestones and metrics
   * @throws NotFoundError if the goal is not found
   */
  async findWithMilestonesAndMetricsOrThrow(id: string, options: FindOptions = {}): Promise<GoalWithMilestonesAndMetrics> {
    const goal = await this.findWithMilestonesAndMetrics(id, options);
    
    if (!goal) {
      throw NotFoundError.resourceNotFound('Goal', id);
    }
    
    return goal;
  }

  /**
   * Finds goals by their type (BHAG, THREE_HAG, ONE_HAG, QUARTERLY).
   * 
   * @param type The goal type to filter by
   * @param organizationId The organization ID
   * @param options Additional query options
   * @returns Array of goals matching the type
   */
  async findByType(type: GoalType, organizationId: string, options: FindOptions = {}): Promise<Goal[]> {
    if (!type || !organizationId) {
      throw new Error('Goal type and organizationId are required');
    }
    
    const include = this.buildGoalInclude(
      options.includeMilestones || false,
      options.includeMetrics || false,
      options
    );
    
    const goals = await prisma.goal.findMany({
      where: {
        type,
        organizationId
      },
      include,
      orderBy: options.orderBy || { updatedAt: 'desc' }
    });
    
    // Transform the metrics array if metrics are included
    if (options.includeMetrics) {
      return goals.map(goal => ({
        ...goal,
        metrics: goal.metrics ? goal.metrics.map((metricGoal: any) => ({
          id: metricGoal.metric.id,
          name: metricGoal.metric.name
        })) : []
      }));
    }
    
    return goals;
  }

  /**
   * Finds goals by their status (DRAFT, ACTIVE, AT_RISK, COMPLETED, ARCHIVED).
   * 
   * @param status The goal status to filter by
   * @param organizationId The organization ID
   * @param options Additional query options
   * @returns Array of goals matching the status
   */
  async findByStatus(status: GoalStatus, organizationId: string, options: FindOptions = {}): Promise<Goal[]> {
    if (!status || !organizationId) {
      throw new Error('Goal status and organizationId are required');
    }
    
    const include = this.buildGoalInclude(
      options.includeMilestones || false,
      options.includeMetrics || false,
      options
    );
    
    const goals = await prisma.goal.findMany({
      where: {
        status,
        organizationId
      },
      include,
      orderBy: options.orderBy || { updatedAt: 'desc' }
    });
    
    // Transform the metrics array if metrics are included
    if (options.includeMetrics) {
      return goals.map(goal => ({
        ...goal,
        metrics: goal.metrics ? goal.metrics.map((metricGoal: any) => ({
          id: metricGoal.metric.id,
          name: metricGoal.metric.name
        })) : []
      }));
    }
    
    return goals;
  }

  /**
   * Finds all goals for a specific organization.
   * 
   * @param organizationId The organization ID
   * @param options Additional query options
   * @returns Array of goals for the organization
   */
  async findByOrganization(organizationId: string, options: FindOptions = {}): Promise<Goal[]> {
    if (!organizationId) {
      throw new Error('organizationId is required');
    }
    
    const include = this.buildGoalInclude(
      options.includeMilestones || false,
      options.includeMetrics || false,
      options
    );
    
    const goals = await prisma.goal.findMany({
      where: {
        organizationId
      },
      include,
      orderBy: options.orderBy || { updatedAt: 'desc' }
    });
    
    // Transform the metrics array if metrics are included
    if (options.includeMetrics) {
      return goals.map(goal => ({
        ...goal,
        metrics: goal.metrics ? goal.metrics.map((metricGoal: any) => ({
          id: metricGoal.metric.id,
          name: metricGoal.metric.name
        })) : []
      }));
    }
    
    return goals;
  }

  /**
   * Finds goals matching the specified filters with pagination.
   * 
   * @param filters The filters to apply
   * @param params The pagination and ordering parameters
   * @returns Filtered goals and total count
   */
  async findWithFilters(
    filters: GoalFilters, 
    params: FindManyParams
  ): Promise<{ data: Goal[]; total: number }> {
    const where: any = {};
    
    // Apply filters
    if (filters.type) {
      where.type = filters.type;
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    
    // Date range filters
    if (filters.startDateFrom) {
      where.startDate = {
        ...(where.startDate || {}),
        gte: new Date(filters.startDateFrom)
      };
    }
    
    if (filters.startDateTo) {
      where.startDate = {
        ...(where.startDate || {}),
        lte: new Date(filters.startDateTo)
      };
    }
    
    if (filters.endDateFrom) {
      where.endDate = {
        ...(where.endDate || {}),
        gte: new Date(filters.endDateFrom)
      };
    }
    
    if (filters.endDateTo) {
      where.endDate = {
        ...(where.endDate || {}),
        lte: new Date(filters.endDateTo)
      };
    }
    
    // Build include based on params
    const include = this.buildGoalInclude(
      params.includeMilestones || false,
      params.includeMetrics || false,
      params
    );
    
    // Execute the query with pagination
    const [data, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        include,
        skip: params.skip || 0,
        take: params.take || 10,
        orderBy: params.orderBy || { updatedAt: 'desc' }
      }),
      prisma.goal.count({ where })
    ]);
    
    // Transform the metrics array if metrics are included
    let transformedData = data;
    if (params.includeMetrics) {
      transformedData = data.map(goal => ({
        ...goal,
        metrics: goal.metrics ? goal.metrics.map((metricGoal: any) => ({
          id: metricGoal.metric.id,
          name: metricGoal.metric.name
        })) : []
      }));
    }
    
    return { data: transformedData, total };
  }

  /**
   * Creates a new strategic goal.
   * 
   * @param data The goal data
   * @returns The created goal
   */
  async createGoal(data: CreateGoalDto): Promise<Goal> {
    // Validate required fields
    if (!data.title || !data.type || !data.organizationId) {
      throw new Error('Title, type, and organizationId are required');
    }
    
    // Set default values if not provided
    const goalData = {
      ...data,
      status: data.status || GoalStatus.DRAFT,
      progress: data.progress || 0
    };
    
    // Extract metricIds from data if present
    const { metricIds, ...goalDataWithoutMetrics } = goalData as any;
    
    // Create the goal
    const goal = await prisma.goal.create({
      data: goalDataWithoutMetrics,
      include: this.defaultInclude
    });
    
    // If metrics are provided, link them to the goal
    if (metricIds && metricIds.length > 0) {
      await this.updateMetrics(goal.id, metricIds);
    }
    
    // Return the created goal with relationships
    return this.findWithMilestonesAndMetricsOrThrow(goal.id);
  }

  /**
   * Updates an existing strategic goal.
   * 
   * @param id The goal ID
   * @param data The updated goal data
   * @returns The updated goal
   */
  async updateGoal(id: string, data: UpdateGoalDto): Promise<Goal> {
    this.validateId(id);
    
    // Extract metricIds from data if present
    const { metricIds, ...goalDataWithoutMetrics } = data as any;
    
    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: goalDataWithoutMetrics,
      include: this.defaultInclude
    });
    
    // If metrics are provided, update the goal's metrics
    if (metricIds) {
      await this.updateMetrics(id, metricIds);
    }
    
    // Return the updated goal with relationships
    return this.findWithMilestonesAndMetricsOrThrow(id);
  }

  /**
   * Updates the progress percentage of a goal.
   * 
   * @param id The goal ID
   * @param progress The new progress value (0-100)
   * @returns The updated goal with new progress value
   */
  async updateProgress(id: string, progress: number): Promise<Goal> {
    this.validateId(id);
    
    // Validate progress value
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      throw new Error('Progress must be a number between 0 and 100');
    }
    
    // Update the goal's progress
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: { progress },
      include: this.defaultInclude
    });
    
    return updatedGoal;
  }

  /**
   * Links a metric to a goal for tracking progress.
   * 
   * @param goalId The goal ID
   * @param metricId The metric ID
   * @returns The updated goal with the linked metric
   */
  async linkMetric(goalId: string, metricId: string): Promise<Goal> {
    this.validateId(goalId);
    this.validateId(metricId);
    
    // Create the link between goal and metric
    await prisma.metricGoal.create({
      data: {
        goalId,
        metricId
      }
    });
    
    // Return the updated goal with metrics
    return this.findWithMetricsOrThrow(goalId);
  }

  /**
   * Unlinks a metric from a goal.
   * 
   * @param goalId The goal ID
   * @param metricId The metric ID
   * @returns The updated goal without the unlinked metric
   */
  async unlinkMetric(goalId: string, metricId: string): Promise<Goal> {
    this.validateId(goalId);
    this.validateId(metricId);
    
    // Delete the link between goal and metric
    await prisma.metricGoal.deleteMany({
      where: {
        goalId,
        metricId
      }
    });
    
    // Return the updated goal with metrics
    return this.findWithMetricsOrThrow(goalId);
  }

  /**
   * Updates the metrics linked to a goal.
   * 
   * @param goalId The goal ID
   * @param metricIds Array of metric IDs to link to the goal
   * @returns The updated goal with the new set of metrics
   */
  async updateMetrics(goalId: string, metricIds: string[]): Promise<Goal> {
    this.validateId(goalId);
    
    // Validate metricIds
    if (!Array.isArray(metricIds)) {
      throw new Error('metricIds must be an array');
    }
    
    // Delete all existing metric links
    await prisma.metricGoal.deleteMany({
      where: {
        goalId
      }
    });
    
    // Create new metric links
    if (metricIds.length > 0) {
      await prisma.metricGoal.createMany({
        data: metricIds.map(metricId => ({
          goalId,
          metricId
        })),
        skipDuplicates: true
      });
    }
    
    // Return the updated goal with metrics
    return this.findWithMetricsOrThrow(goalId);
  }

  /**
   * Builds the include object for goal queries with appropriate relationships.
   * 
   * @param includeMilestones Whether to include milestones
   * @param includeMetrics Whether to include metrics
   * @param options Additional include options
   * @returns The include object for Prisma queries
   */
  private buildGoalInclude(
    includeMilestones: boolean = false,
    includeMetrics: boolean = false,
    options: FindOptions = {}
  ): Prisma.GoalInclude {
    let include: Prisma.GoalInclude = {};
    
    if (includeMilestones) {
      include = {
        ...include,
        ...this.milestonesInclude
      };
    }
    
    if (includeMetrics) {
      include = {
        ...include,
        ...this.metricsInclude
      };
    }
    
    // Merge with any additional include options
    if (options.include) {
      include = {
        ...include,
        ...options.include
      };
    }
    
    return include;
  }
}