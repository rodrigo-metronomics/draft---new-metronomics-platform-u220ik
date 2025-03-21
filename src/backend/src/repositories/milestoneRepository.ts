import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository, FindManyParams, FindOptions } from './baseRepository';
import { prisma } from '../config/database';
import { 
  Milestone, 
  MilestoneStatus, 
  CreateMilestoneDto, 
  UpdateMilestoneDto,
  MilestoneFilters 
} from '../types/goal.types';
import { logger } from '../utils/helpers/logger';

/**
 * Repository class for managing milestones in the database
 * Provides milestone-specific data access operations and extends the BaseRepository
 */
export class MilestoneRepository extends BaseRepository<Milestone> {
  private defaultInclude: Prisma.MilestoneInclude;

  /**
   * Initializes the milestone repository with the appropriate model name and include options
   */
  constructor() {
    super('milestone');
    this.defaultInclude = {
      goal: true
    };
  }

  /**
   * Finds all milestones associated with a specific goal
   * @param goalId - The ID of the goal
   * @param options - Additional query options
   * @returns Array of milestones for the goal
   */
  async findByGoal(goalId: string, options: FindOptions = {}): Promise<Milestone[]> {
    logger.debug('MilestoneRepository.findByGoal', { goalId });
    
    if (!goalId) {
      return [];
    }
    
    const { data } = await this.findMany(
      { goalId },
      { limit: 100, offset: 0 },
      { 
        include: options.include,
        sortBy: 'dueDate',
        sortOrder: 'asc'
      }
    );
    
    return data;
  }

  /**
   * Finds milestones by their status (PENDING, IN_PROGRESS, COMPLETED, MISSED)
   * @param status - The milestone status to filter by
   * @param goalId - Optional goal ID to further filter the results
   * @param options - Additional query options
   * @returns Array of milestones matching the status
   */
  async findByStatus(
    status: MilestoneStatus, 
    goalId?: string, 
    options: FindOptions = {}
  ): Promise<Milestone[]> {
    logger.debug('MilestoneRepository.findByStatus', { status, goalId });
    
    const filters: Record<string, any> = { status };
    
    if (goalId) {
      filters.goalId = goalId;
    }
    
    const { data } = await this.findMany(
      filters,
      { limit: 100, offset: 0 },
      { 
        include: options.include,
        sortBy: 'dueDate',
        sortOrder: 'asc'
      }
    );
    
    return data;
  }

  /**
   * Finds upcoming milestones with due dates in the future
   * @param goalId - Optional goal ID to filter by
   * @param options - Additional query options
   * @returns Array of upcoming milestones
   */
  async findUpcoming(goalId?: string, options: FindOptions = {}): Promise<Milestone[]> {
    logger.debug('MilestoneRepository.findUpcoming', { goalId });
    
    const now = new Date();
    const where: Prisma.MilestoneWhereInput = {
      dueDate: { gte: now }
    };
    
    if (goalId) {
      where.goalId = goalId;
    }
    
    const include = this.buildMilestoneInclude(options);
    
    const milestones = await prisma.milestone.findMany({
      where,
      ...include,
      orderBy: { dueDate: 'asc' }
    });
    
    return milestones;
  }

  /**
   * Finds overdue milestones with due dates in the past and not completed
   * @param goalId - Optional goal ID to filter by
   * @param options - Additional query options
   * @returns Array of overdue milestones
   */
  async findOverdue(goalId?: string, options: FindOptions = {}): Promise<Milestone[]> {
    logger.debug('MilestoneRepository.findOverdue', { goalId });
    
    const now = new Date();
    const where: Prisma.MilestoneWhereInput = {
      dueDate: { lt: now },
      status: { not: MilestoneStatus.COMPLETED }
    };
    
    if (goalId) {
      where.goalId = goalId;
    }
    
    const include = this.buildMilestoneInclude(options);
    
    const milestones = await prisma.milestone.findMany({
      where,
      ...include,
      orderBy: { dueDate: 'asc' }
    });
    
    return milestones;
  }

  /**
   * Creates a new milestone
   * @param data - The milestone data to create
   * @returns The created milestone
   */
  async createMilestone(data: CreateMilestoneDto): Promise<Milestone> {
    logger.debug('MilestoneRepository.createMilestone', { data });
    
    // Set default status to PENDING if not provided
    const milestoneData = {
      ...data,
      status: data.status || MilestoneStatus.PENDING
    };
    
    const milestone = await this.create(milestoneData);
    
    return this.findByIdOrThrow(milestone.id, { include: this.defaultInclude });
  }

  /**
   * Updates an existing milestone
   * @param id - The ID of the milestone to update
   * @param data - The updated milestone data
   * @returns The updated milestone
   */
  async updateMilestone(id: string, data: UpdateMilestoneDto): Promise<Milestone> {
    logger.debug('MilestoneRepository.updateMilestone', { id, data });
    
    await this.update(id, data);
    
    return this.findByIdOrThrow(id, { include: this.defaultInclude });
  }

  /**
   * Updates the status of a milestone
   * @param id - The ID of the milestone to update
   * @param status - The new status
   * @returns The updated milestone with new status
   */
  async updateStatus(id: string, status: MilestoneStatus): Promise<Milestone> {
    logger.debug('MilestoneRepository.updateStatus', { id, status });
    
    await this.update(id, { status });
    
    return this.findByIdOrThrow(id, { include: this.defaultInclude });
  }

  /**
   * Finds milestones matching the specified filters with pagination
   * @param filters - Filters to apply to the query
   * @param params - Pagination and sorting parameters
   * @returns Filtered milestones and total count
   */
  async findWithFilters(
    filters: MilestoneFilters = {}, 
    params: FindManyParams
  ): Promise<{ data: Milestone[]; total: number }> {
    logger.debug('MilestoneRepository.findWithFilters', { filters, params });
    
    const where = this.buildMilestoneWhere(filters);
    const include = this.buildMilestoneInclude({ include: params.include });
    
    const [data, total] = await Promise.all([
      prisma.milestone.findMany({
        where,
        ...include,
        skip: params.offset,
        take: params.limit,
        orderBy: params.orderBy || { dueDate: 'asc' }
      }),
      prisma.milestone.count({ where })
    ]);
    
    return { data, total };
  }

  /**
   * Builds the include object for milestone queries with appropriate relationships
   * @param options - Query options
   * @returns The include object for Prisma queries
   */
  private buildMilestoneInclude(options: FindOptions = {}): { include: Prisma.MilestoneInclude } {
    // Start with the default include
    const include = { ...this.defaultInclude };
    
    // Merge with any additional include options
    if (options.include) {
      Object.assign(include, options.include);
    }
    
    return { include };
  }

  /**
   * Builds the where clause for milestone queries based on filters
   * @param filters - Filters to apply
   * @returns The where clause for Prisma queries
   */
  private buildMilestoneWhere(filters: MilestoneFilters): Prisma.MilestoneWhereInput {
    const where: Prisma.MilestoneWhereInput = {};
    
    if (filters.goalId) {
      where.goalId = filters.goalId;
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.dueDateStart) {
      where.dueDate = {
        ...where.dueDate,
        gte: filters.dueDateStart
      };
    }
    
    if (filters.dueDateEnd) {
      where.dueDate = {
        ...where.dueDate,
        lte: filters.dueDateEnd
      };
    }
    
    return where;
  }
}