import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { Metric, MetricFilters } from '../types/metric.types';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { logger } from '../utils/helpers/logger';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Repository class for metric data access operations in the Metronomics Platform.
 * Extends the BaseRepository to provide specialized methods for retrieving, creating,
 * updating, and deleting metrics, as well as managing relationships with goals, teams, and values.
 */
export class MetricRepository extends BaseRepository<Metric> {
  /**
   * Initializes the metric repository with the Metric model
   */
  constructor() {
    super('metric');
  }

  /**
   * Finds metrics belonging to a specific organization
   * 
   * @param organizationId - The ID of the organization to filter by
   * @param options - Additional query options such as includes
   * @returns Promise resolving to an array of metrics for the organization
   */
  async findByOrganizationId(
    organizationId: string,
    options: Record<string, any> = {}
  ): Promise<Metric[]> {
    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    try {
      logger.debug('MetricRepository.findByOrganizationId', { organizationId });

      const include = this.buildInclude(options);
      
      const metrics = await this.model.findMany({
        where: { 
          organizationId 
        },
        ...include
      });
      
      return metrics;
    } catch (error) {
      logger.error('Error in MetricRepository.findByOrganizationId', { organizationId, error });
      throw error;
    }
  }

  /**
   * Finds metrics associated with a specific team
   * 
   * @param teamId - The ID of the team to filter by
   * @param options - Additional query options such as includes
   * @returns Promise resolving to an array of metrics for the team
   */
  async findByTeamId(
    teamId: string,
    options: Record<string, any> = {}
  ): Promise<Metric[]> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }

    try {
      logger.debug('MetricRepository.findByTeamId', { teamId });

      const include = this.buildInclude(options);
      
      const metrics = await this.model.findMany({
        where: { 
          teamId 
        },
        ...include
      });
      
      return metrics;
    } catch (error) {
      logger.error('Error in MetricRepository.findByTeamId', { teamId, error });
      throw error;
    }
  }

  /**
   * Finds metrics linked to a specific goal
   * 
   * @param goalId - The ID of the goal to filter by
   * @param options - Additional query options such as includes
   * @returns Promise resolving to an array of metrics linked to the goal
   */
  async findByGoalId(
    goalId: string,
    options: Record<string, any> = {}
  ): Promise<Metric[]> {
    if (!goalId) {
      throw ValidationError.requiredField('goalId');
    }

    try {
      logger.debug('MetricRepository.findByGoalId', { goalId });

      const include = this.buildInclude(options);
      
      const metrics = await this.model.findMany({
        where: {
          goals: {
            some: {
              goalId
            }
          }
        },
        ...include
      });
      
      return metrics;
    } catch (error) {
      logger.error('Error in MetricRepository.findByGoalId', { goalId, error });
      throw error;
    }
  }

  /**
   * Finds metrics with their associated values based on filters
   * 
   * @param filters - Filters to apply to the query (organization, team, type, goal, date range)
   * @param pagination - Pagination parameters for limiting results
   * @param options - Additional query options
   * @returns Promise resolving to paginated metrics with values and total count
   */
  async findWithValues(
    filters: MetricFilters,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Metric[]; total: number }> {
    try {
      logger.debug('MetricRepository.findWithValues', { filters, pagination });

      const where = this.buildWhereClause(filters);
      const paginationParams = this.buildPagination(pagination);
      const orderBy = this.buildOrderBy(options);
      
      // Always include values relation
      const include = {
        include: {
          values: true,
          ...(options.include || {})
        }
      };
      
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          ...paginationParams,
          ...(orderBy && { orderBy }),
          ...include
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error('Error in MetricRepository.findWithValues', { filters, error });
      throw error;
    }
  }

  /**
   * Finds metrics with their associated thresholds based on filters
   * 
   * @param filters - Filters to apply to the query (organization, team, type, goal, date range)
   * @param pagination - Pagination parameters for limiting results
   * @param options - Additional query options
   * @returns Promise resolving to paginated metrics with thresholds and total count
   */
  async findWithThresholds(
    filters: MetricFilters,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Metric[]; total: number }> {
    try {
      logger.debug('MetricRepository.findWithThresholds', { filters, pagination });

      const where = this.buildWhereClause(filters);
      const paginationParams = this.buildPagination(pagination);
      const orderBy = this.buildOrderBy(options);
      
      // Always include thresholds relation
      const include = {
        include: {
          thresholds: true,
          ...(options.include || {})
        }
      };
      
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          ...paginationParams,
          ...(orderBy && { orderBy }),
          ...include
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error('Error in MetricRepository.findWithThresholds', { filters, error });
      throw error;
    }
  }

  /**
   * Finds metrics with both values and thresholds based on filters
   * 
   * @param filters - Filters to apply to the query (organization, team, type, goal, date range)
   * @param pagination - Pagination parameters for limiting results
   * @param options - Additional query options
   * @returns Promise resolving to paginated metrics with values, thresholds and total count
   */
  async findWithValuesAndThresholds(
    filters: MetricFilters,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Metric[]; total: number }> {
    try {
      logger.debug('MetricRepository.findWithValuesAndThresholds', { filters, pagination });

      const where = this.buildWhereClause(filters);
      const paginationParams = this.buildPagination(pagination);
      const orderBy = this.buildOrderBy(options);
      
      // Include both values and thresholds relations
      const include = {
        include: {
          values: true,
          thresholds: true,
          ...(options.include || {})
        }
      };
      
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          ...paginationParams,
          ...(orderBy && { orderBy }),
          ...include
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error('Error in MetricRepository.findWithValuesAndThresholds', { filters, error });
      throw error;
    }
  }

  /**
   * Links a goal to a metric
   * 
   * @param metricId - The ID of the metric to link
   * @param goalId - The ID of the goal to link
   * @returns Promise resolving to the updated metric with the new goal link
   */
  async addGoalToMetric(metricId: string, goalId: string): Promise<Metric> {
    if (!metricId) {
      throw ValidationError.requiredField('metricId');
    }
    
    if (!goalId) {
      throw ValidationError.requiredField('goalId');
    }

    try {
      logger.debug('MetricRepository.addGoalToMetric', { metricId, goalId });

      // Check if the metric exists
      const metric = await this.findByIdOrThrow(metricId);
      
      // Check if the goal exists
      const goal = await prisma.goal.findUnique({
        where: { id: goalId }
      });
      
      if (!goal) {
        throw NotFoundError.resourceNotFound('Goal', goalId);
      }
      
      // Check if the relationship already exists
      const existingRelation = await prisma.metricGoal.findUnique({
        where: {
          metricId_goalId: {
            metricId,
            goalId
          }
        }
      });
      
      if (!existingRelation) {
        // Create the relationship
        await prisma.metricGoal.create({
          data: {
            metricId,
            goalId
          }
        });
      }
      
      // Fetch the updated metric with its relationships
      const updatedMetric = await prisma.metric.findUnique({
        where: { id: metricId },
        include: {
          values: true,
          thresholds: true,
          goals: {
            include: {
              goal: true
            }
          }
        }
      });
      
      if (!updatedMetric) {
        throw NotFoundError.resourceNotFound('Metric', metricId);
      }
      
      return updatedMetric as unknown as Metric;
    } catch (error) {
      logger.error('Error in MetricRepository.addGoalToMetric', { metricId, goalId, error });
      throw error;
    }
  }

  /**
   * Removes a goal link from a metric
   * 
   * @param metricId - The ID of the metric to update
   * @param goalId - The ID of the goal to unlink
   * @returns Promise resolving to the updated metric with the goal link removed
   */
  async removeGoalFromMetric(metricId: string, goalId: string): Promise<Metric> {
    if (!metricId) {
      throw ValidationError.requiredField('metricId');
    }
    
    if (!goalId) {
      throw ValidationError.requiredField('goalId');
    }

    try {
      logger.debug('MetricRepository.removeGoalFromMetric', { metricId, goalId });

      // Check if the metric exists
      const metric = await this.findByIdOrThrow(metricId);
      
      // Delete the relationship
      await prisma.metricGoal.delete({
        where: {
          metricId_goalId: {
            metricId,
            goalId
          }
        }
      }).catch(error => {
        // If the relationship doesn't exist, we can ignore the error
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          logger.warn('Relationship between metric and goal does not exist', { metricId, goalId });
        } else {
          throw error;
        }
      });
      
      // Fetch the updated metric with its relationships
      const updatedMetric = await prisma.metric.findUnique({
        where: { id: metricId },
        include: {
          values: true,
          thresholds: true,
          goals: {
            include: {
              goal: true
            }
          }
        }
      });
      
      if (!updatedMetric) {
        throw NotFoundError.resourceNotFound('Metric', metricId);
      }
      
      return updatedMetric as unknown as Metric;
    } catch (error) {
      logger.error('Error in MetricRepository.removeGoalFromMetric', { metricId, goalId, error });
      throw error;
    }
  }

  /**
   * Builds a Prisma where clause from metric filters
   * 
   * @param filters - Filters to apply to the query
   * @returns Prisma where clause for metric queries
   * @private
   */
  private buildWhereClause(filters: MetricFilters): Prisma.MetricWhereInput {
    const where: Prisma.MetricWhereInput = {};
    
    // Add organizationId filter
    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    
    // Add teamId filter
    if (filters.teamId) {
      where.teamId = filters.teamId;
    }
    
    // Add type filter
    if (filters.type) {
      where.type = filters.type;
    }
    
    // Add goalId filter through the goals relation
    if (filters.goalId) {
      where.goals = {
        some: {
          goalId: filters.goalId
        }
      };
    }
    
    // Add date range filters for metric values
    if (filters.startDate || filters.endDate) {
      where.values = {
        some: {}
      };
      
      if (filters.startDate) {
        where.values.some.timestamp = {
          ...(where.values.some.timestamp || {}),
          gte: filters.startDate
        };
      }
      
      if (filters.endDate) {
        where.values.some.timestamp = {
          ...(where.values.some.timestamp || {}),
          lte: filters.endDate
        };
      }
    }
    
    return where;
  }
}