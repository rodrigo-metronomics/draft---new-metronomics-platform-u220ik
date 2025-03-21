import { z } from 'zod'; // ^3.21.4

import { MilestoneRepository } from '../../repositories/milestoneRepository';
import { GoalRepository } from '../../repositories/goalRepository';
import { 
  Milestone, 
  MilestoneStatus, 
  CreateMilestoneDto, 
  UpdateMilestoneDto,
  MilestoneFilters 
} from '../../types/goal.types';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { 
  createMilestoneSchema, 
  updateMilestoneSchema,
  validateMilestoneDates
} from '../../utils/validation/goalValidation';
import { logger } from '../../utils/helpers/logger';
import { FindManyParams } from '../../repositories/baseRepository';

/**
 * Service class for managing milestone operations in the Metronomics Platform
 */
export class MilestoneService {
  private milestoneRepository: MilestoneRepository;
  private goalRepository: GoalRepository;

  /**
   * Initializes the milestone service with required repositories
   * @param milestoneRepository Repository for milestone data access operations
   * @param goalRepository Repository for goal data access operations
   */
  constructor(
    milestoneRepository: MilestoneRepository,
    goalRepository: GoalRepository
  ) {
    this.milestoneRepository = milestoneRepository;
    this.goalRepository = goalRepository;
  }

  /**
   * Retrieves a milestone by its ID
   * @param id The milestone ID
   * @returns The milestone with the specified ID
   */
  async getMilestone(id: string): Promise<Milestone> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('MilestoneService.getMilestone', { id });
    return this.milestoneRepository.findByIdOrThrow(id);
  }

  /**
   * Retrieves all milestones associated with a specific goal
   * @param goalId The ID of the goal
   * @returns Array of milestones for the goal
   */
  async getMilestonesByGoal(goalId: string): Promise<Milestone[]> {
    if (!goalId) {
      throw ValidationError.requiredField('goalId');
    }

    logger.debug('MilestoneService.getMilestonesByGoal', { goalId });
    return this.milestoneRepository.findByGoal(goalId);
  }

  /**
   * Retrieves milestones filtered by status
   * @param status The milestone status to filter by
   * @param goalId Optional goal ID to further filter the results
   * @returns Array of milestones matching the status
   */
  async getMilestonesByStatus(
    status: MilestoneStatus,
    goalId?: string
  ): Promise<Milestone[]> {
    if (!status) {
      throw ValidationError.requiredField('status');
    }

    logger.debug('MilestoneService.getMilestonesByStatus', { status, goalId });
    return this.milestoneRepository.findByStatus(status, goalId, {});
  }

  /**
   * Retrieves upcoming milestones with due dates in the future
   * @param goalId Optional goal ID to filter by
   * @returns Array of upcoming milestones
   */
  async getUpcomingMilestones(goalId?: string): Promise<Milestone[]> {
    logger.debug('MilestoneService.getUpcomingMilestones', { goalId });
    return this.milestoneRepository.findUpcoming(goalId);
  }

  /**
   * Retrieves overdue milestones with due dates in the past and not completed
   * @param goalId Optional goal ID to filter by
   * @returns Array of overdue milestones
   */
  async getOverdueMilestones(goalId?: string): Promise<Milestone[]> {
    logger.debug('MilestoneService.getOverdueMilestones', { goalId });
    return this.milestoneRepository.findOverdue(goalId);
  }

  /**
   * Finds milestones matching the specified filters with pagination
   * @param filters Filters to apply to the query
   * @param params Pagination and sorting parameters
   * @returns Filtered milestones and total count
   */
  async findMilestones(
    filters: MilestoneFilters = {},
    params: FindManyParams
  ): Promise<{ data: Milestone[]; total: number }> {
    logger.debug('MilestoneService.findMilestones', { filters, params });
    return this.milestoneRepository.findWithFilters(filters, params);
  }

  /**
   * Creates a new milestone
   * @param data The milestone data to create
   * @returns The created milestone
   */
  async createMilestone(data: CreateMilestoneDto): Promise<Milestone> {
    logger.debug('MilestoneService.createMilestone', { data });

    try {
      // Validate the data using zod schema
      const validatedData = createMilestoneSchema.parse(data);

      // Get the associated goal to ensure it exists and validate date ranges
      const goal = await this.goalRepository.findByIdOrThrow(validatedData.goalId);

      // Validate milestone due date is within goal date range
      const dateValidation = validateMilestoneDates(
        validatedData.dueDate,
        goal.startDate,
        goal.endDate
      );

      if (dateValidation !== true) {
        throw ValidationError.invalidFormat('dueDate', dateValidation as string);
      }

      // Create the milestone
      const milestone = await this.milestoneRepository.createMilestone(validatedData);

      // Update the goal's progress
      await this.calculateGoalProgress(goal.id);

      return milestone;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    }
  }

  /**
   * Updates an existing milestone
   * @param id The ID of the milestone to update
   * @param data The updated milestone data
   * @returns The updated milestone
   */
  async updateMilestone(id: string, data: UpdateMilestoneDto): Promise<Milestone> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('MilestoneService.updateMilestone', { id, data });

    try {
      // Validate the data using zod schema
      const validatedData = updateMilestoneSchema.parse(data);

      // Get the existing milestone to ensure it exists
      const existingMilestone = await this.milestoneRepository.findByIdOrThrow(id);

      // Get the associated goal
      const goal = await this.goalRepository.findByIdOrThrow(existingMilestone.goalId);

      // If due date is being updated, validate it's within the goal's date range
      if (validatedData.dueDate) {
        const dateValidation = validateMilestoneDates(
          validatedData.dueDate,
          goal.startDate,
          goal.endDate
        );

        if (dateValidation !== true) {
          throw ValidationError.invalidFormat('dueDate', dateValidation as string);
        }
      }

      // Check if status is being updated
      const isStatusChange = validatedData.status && validatedData.status !== existingMilestone.status;

      // Update the milestone
      const updatedMilestone = await this.milestoneRepository.updateMilestone(id, validatedData);

      // If status changed, update the goal's progress
      if (isStatusChange) {
        await this.calculateGoalProgress(goal.id);
      }

      return updatedMilestone;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw ValidationError.fromZodError(error);
      }
      throw error;
    }
  }

  /**
   * Updates the status of a milestone
   * @param id The ID of the milestone to update
   * @param status The new status
   * @returns The updated milestone with new status
   */
  async updateMilestoneStatus(id: string, status: MilestoneStatus): Promise<Milestone> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    if (!status) {
      throw ValidationError.requiredField('status');
    }

    logger.debug('MilestoneService.updateMilestoneStatus', { id, status });

    // Get the existing milestone to ensure it exists
    const existingMilestone = await this.milestoneRepository.findByIdOrThrow(id);

    // Update the milestone status
    const updatedMilestone = await this.milestoneRepository.updateStatus(id, status);

    // Update the goal's progress
    await this.calculateGoalProgress(existingMilestone.goalId);

    return updatedMilestone;
  }

  /**
   * Deletes a milestone by ID
   * @param id The ID of the milestone to delete
   * @returns The deleted milestone
   */
  async deleteMilestone(id: string): Promise<Milestone> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('MilestoneService.deleteMilestone', { id });

    // Get the milestone first to get the goalId
    const milestone = await this.milestoneRepository.findByIdOrThrow(id);
    const goalId = milestone.goalId;

    // Delete the milestone
    const deletedMilestone = await this.milestoneRepository.delete(id);

    // Update the goal's progress
    await this.calculateGoalProgress(goalId);

    return deletedMilestone;
  }

  /**
   * Calculates the progress percentage of a goal based on milestone completion
   * @param goalId The ID of the goal
   * @returns The calculated progress percentage
   */
  async calculateGoalProgress(goalId: string): Promise<number> {
    if (!goalId) {
      throw ValidationError.requiredField('goalId');
    }

    logger.debug('MilestoneService.calculateGoalProgress', { goalId });

    // Get all milestones for the goal
    const milestones = await this.milestoneRepository.findByGoal(goalId);

    // If there are no milestones, set progress to 0%
    if (milestones.length === 0) {
      await this.goalRepository.updateProgress(goalId, 0);
      return 0;
    }

    // Count completed milestones
    const completedMilestones = milestones.filter(
      milestone => milestone.status === MilestoneStatus.COMPLETED
    ).length;

    // Calculate progress percentage
    const progress = Math.round((completedMilestones / milestones.length) * 100);

    // Update the goal's progress in the database
    await this.goalRepository.updateProgress(goalId, progress);

    return progress;
  }

  /**
   * Checks and updates milestone statuses based on due dates
   * @returns Array of updated milestones
   */
  async checkMilestoneStatuses(): Promise<Milestone[]> {
    logger.debug('MilestoneService.checkMilestoneStatuses');

    const now = new Date();
    
    // Find all milestones that are either PENDING or IN_PROGRESS
    const activeMilestones = await this.milestoneRepository.findByStatus(MilestoneStatus.PENDING);
    const inProgressMilestones = await this.milestoneRepository.findByStatus(MilestoneStatus.IN_PROGRESS);
    
    const milestonesToCheck = [...activeMilestones, ...inProgressMilestones];
    const updatedMilestones: Milestone[] = [];
    const affectedGoals = new Set<string>();

    // Check each milestone
    for (const milestone of milestonesToCheck) {
      // If the due date has passed and the milestone is not completed, mark it as MISSED
      if (milestone.dueDate < now && milestone.status !== MilestoneStatus.COMPLETED) {
        const updatedMilestone = await this.milestoneRepository.updateStatus(
          milestone.id,
          MilestoneStatus.MISSED
        );
        
        updatedMilestones.push(updatedMilestone);
        affectedGoals.add(milestone.goalId);
      }
    }

    // Update progress for affected goals
    for (const goalId of affectedGoals) {
      await this.calculateGoalProgress(goalId);
    }

    return updatedMilestones;
  }
}