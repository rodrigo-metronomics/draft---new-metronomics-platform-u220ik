# src/backend/src/controllers/goal.controller.ts
```typescript
import { Request, Response, NextFunction, Router } from 'express'; // express v4.18.2
import { GoalService } from '../services/goal/goalService';
import { MilestoneService } from '../services/goal/milestoneService';
import {
  GoalType,
  GoalStatus,
  CreateGoalDto,
  UpdateGoalDto,
  GoalFilters,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  MilestoneFilters,
} from '../types/goal.types';
import {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
} from '../utils/helpers/responseHelper';
import {
  parsePaginationParams,
  createPaginationLinks,
} from '../utils/helpers/paginationHelper';
import { logger } from '../utils/helpers/logger';

/**
 * Controller class for handling HTTP requests related to strategic goals
 */
export class GoalController {
  private goalService: GoalService;
  private milestoneService: MilestoneService;
  private router: express.Router;

  /**
   * Initializes the goal controller with required services
   * @param goalService GoalService instance
   * @param milestoneService MilestoneService instance
   */
  constructor(goalService: GoalService, milestoneService: MilestoneService) {
    this.goalService = goalService;
    this.milestoneService = milestoneService;
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Returns the configured Express router
   * @returns Configured Express router with goal routes
   */
  getRouter(): express.Router {
    return this.router;
  }

  /**
   * Configures all route handlers for goal-related endpoints
   * @returns void No return value
   */
  private setupRoutes(): void {
    // Goal routes
    this.router.get('/goals', this.getAllGoals.bind(this));
    this.router.get('/goals/:id', this.getGoalById.bind(this));
    this.router.get('/goals/:id/milestones', this.getGoalMilestones.bind(this));
    this.router.get('/goals/:id/metrics', this.getGoalMetrics.bind(this));
    this.router.get('/goals/type/:type', this.getGoalsByType.bind(this));
    this.router.get('/goals/status/:status', this.getGoalsByStatus.bind(this));
    this.router.get('/goals/organization/:organizationId', this.getOrganizationGoals.bind(this));
    this.router.post('/goals', this.createGoal.bind(this));
    this.router.put('/goals/:id', this.updateGoal.bind(this));
    this.router.patch('/goals/:id/progress', this.updateGoalProgress.bind(this));
    this.router.patch('/goals/:id/recalculate', this.recalculateGoalProgress.bind(this));
    this.router.delete('/goals/:id', this.deleteGoal.bind(this));
    this.router.post('/goals/:id/metrics/:metricId', this.linkMetricToGoal.bind(this));
    this.router.delete('/goals/:id/metrics/:metricId', this.unlinkMetricFromGoal.bind(this));
    this.router.put('/goals/:id/metrics', this.updateGoalMetrics.bind(this));

    // Milestone routes
    this.router.post('/milestones', this.createMilestone.bind(this));
    this.router.put('/milestones/:id', this.updateMilestone.bind(this));
    this.router.patch('/milestones/:id/status', this.updateMilestoneStatus.bind(this));
    this.router.delete('/milestones/:id', this.deleteMilestone.bind(this));
    this.router.get('/milestones/:id', this.getMilestoneById.bind(this));
    this.router.get('/milestones/goal/:goalId', this.getGoalMilestones.bind(this));
    this.router.get('/milestones', this.findMilestones.bind(this));
  }

  /**
   * Handles GET request to retrieve all goals with filtering and pagination
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async getAllGoals(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract filter parameters from request query
      const filters: GoalFilters = req.query as GoalFilters;

      // Parse pagination parameters from request query
      const { page, limit, offset } = parsePaginationParams(req.query);

      // Call goalService.findGoals with filters and pagination
      const { data, total } = await this.goalService.findGoals(filters, { page, limit, offset });

      // Create pagination links based on results
      const links = createPaginationLinks(req, { page, limit, offset }, total);

      // Return paginated response with goals data
      paginatedResponse(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) }, links, 'Goals retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving all goals', { error });
      errorResponse(res, 'Error retrieving goals', error, 500);
    }
  }

  /**
   * Handles GET request to retrieve a specific goal by ID
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async getGoalById(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID from request parameters
      const { id } = req.params;

      // Determine if detailed view is requested (with milestones, metrics, or both)
      const includeMilestones = req.query.includeMilestones === 'true';
      const includeMetrics = req.query.includeMetrics === 'true';

      let goal;

      if (includeMilestones && includeMetrics) {
        // Call goalService.getGoalWithMilestonesAndMetrics
        goal = await this.goalService.getGoalWithMilestonesAndMetrics(id);
      } else if (includeMilestones) {
        // Call goalService.getGoalWithMilestones
        goal = await this.goalService.getGoalWithMilestones(id);
      } else if (includeMetrics) {
        // Call goalService.getGoalWithMetrics
        goal = await this.goalService.getGoalWithMetrics(id);
      } else {
        // Call goalService.getGoal
        goal = await this.goalService.getGoal(id);
      }

      // Return success response with goal data
      successResponse(res, goal, 'Goal retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving goal by ID', { error, goalId: req.params.id });
      errorResponse(res, 'Error retrieving goal', error, 500);
    }
  }

  /**
   * Handles GET request to retrieve milestones for a specific goal
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async getGoalMilestones(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID from request parameters
      const { id } = req.params;

      // Call milestoneService.getMilestonesByGoal with the goal ID
      const milestones = await this.milestoneService.getMilestonesByGoal(id);

      // Return success response with milestones data
      successResponse(res, milestones, 'Milestones retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving milestones for goal', { error, goalId: req.params.id });
      errorResponse(res, 'Error retrieving milestones', error, 500);
    }
  }

  /**
   * Handles GET request to retrieve metrics for a specific goal
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async getGoalMetrics(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID from request parameters
      const { id } = req.params;

      // Call goalService.getGoalMetrics with the goal ID
      const metrics = await this.goalService.getGoalMetrics(id);

      // Return success response with metrics data
      successResponse(res, metrics, 'Metrics retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving metrics for goal', { error, goalId: req.params.id });
      errorResponse(res, 'Error retrieving metrics', error, 500);
    }
  }

  /**
   * Handles GET request to retrieve goals filtered by type
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async getGoalsByType(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal type and organization ID from request parameters
      const { type } = req.params;
      const { organizationId } = req.query;

      // Call goalService.getGoalsByType with type and organization ID
      const goals = await this.goalService.getGoalsByType(type as GoalType, organizationId as string);

      // Return success response with filtered goals data
      successResponse(res, goals, 'Goals retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving goals by type', { error, type: req.params.type, organizationId: req.query.organizationId });
      errorResponse(res, 'Error retrieving goals', error, 500);
    }
  }

  /**
   * Handles GET request to retrieve goals filtered by status
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async getGoalsByStatus(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal status and organization ID from request parameters
      const { status } = req.params;
      const { organizationId } = req.query;

      // Call goalService.getGoalsByStatus with status and organization ID
      const goals = await this.goalService.getGoalsByStatus(status as GoalStatus, organizationId as string);

      // Return success response with filtered goals data
      successResponse(res, goals, 'Goals retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving goals by status', { error, status: req.params.status, organizationId: req.query.organizationId });
      errorResponse(res, 'Error retrieving goals', error, 500);
    }
  }

  /**
   * Handles GET request to retrieve all goals for a specific organization
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async getOrganizationGoals(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract organization ID from request parameters
      const { organizationId } = req.params;

      // Call goalService.getOrganizationGoals with organization ID
      const goals = await this.goalService.getOrganizationGoals(organizationId);

      // Return success response with organization's goals data
      successResponse(res, goals, 'Organization goals retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving organization goals', { error, organizationId: req.params.organizationId });
      errorResponse(res, 'Error retrieving goals', error, 500);
    }
  }

  /**
   * Handles POST request to create a new strategic goal
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async createGoal(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal data from request body
      const goalData: CreateGoalDto = req.body;

      // Call goalService.createGoal with the goal data
      const newGoal = await this.goalService.createGoal(goalData);

      // Return created response with the new goal data
      createdResponse(res, newGoal, 'Goal created successfully');
    } catch (error) {
      logger.error('Error creating goal', { error, goalData: req.body });
      errorResponse(res, 'Error creating goal', error, 500);
    }
  }

  /**
   * Handles PUT request to update an existing goal
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async updateGoal(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID from request parameters
      const { id } = req.params;

      // Extract update data from request body
      const updateData: UpdateGoalDto = req.body;

      // Call goalService.updateGoal with ID and update data
      const updatedGoal = await this.goalService.updateGoal(id, updateData);

      // Return success response with updated goal data
      successResponse(res, updatedGoal, 'Goal updated successfully');
    } catch (error) {
      logger.error('Error updating goal', { error, goalId: req.params.id, updateData: req.body });
      errorResponse(res, 'Error updating goal', error, 500);
    }
  }

  /**
   * Handles PATCH request to update a goal's progress percentage
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async updateGoalProgress(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID from request parameters
      const { id } = req.params;

      // Extract progress value from request body
      const { progress } = req.body;

      // Call goalService.updateGoalProgress with ID and progress value
      const updatedGoal = await this.goalService.updateGoalProgress(id, progress);

      // Return success response with updated goal data
      successResponse(res, updatedGoal, 'Goal progress updated successfully');
    } catch (error) {
      logger.error('Error updating goal progress', { error, goalId: req.params.id, progress: req.body.progress });
      errorResponse(res, 'Error updating goal progress', error, 500);
    }
  }

  /**
   * Handles PATCH request to recalculate a goal's progress based on milestones
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async recalculateGoalProgress(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID from request parameters
      const { id } = req.params;

      // Call goalService.recalculateGoalProgress with the goal ID
      const updatedGoal = await this.goalService.recalculateGoalProgress(id);

      // Return success response with updated goal data
      successResponse(res, updatedGoal, 'Goal progress recalculated successfully');
    } catch (error) {
      logger.error('Error recalculating goal progress', { error, goalId: req.params.id });
      errorResponse(res, 'Error recalculating goal progress', error, 500);
    }
  }

  /**
   * Handles DELETE request to remove a strategic goal
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async deleteGoal(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID from request parameters
      const { id } = req.params;

      // Call goalService.deleteGoal with the goal ID
      await this.goalService.deleteGoal(id);

      // Return no-content response on successful deletion
      noContentResponse(res);
    } catch (error) {
      logger.error('Error deleting goal', { error, goalId: req.params.id });
      errorResponse(res, 'Error deleting goal', error, 500);
    }
  }

  /**
   * Handles POST request to link a metric to a goal
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async linkMetricToGoal(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID and metric ID from request parameters
      const { id, metricId } = req.params;

      // Call goalService.linkMetricToGoal with goal ID and metric ID
      const updatedGoal = await this.goalService.linkMetricToGoal(id, metricId);

      // Return success response with updated goal data
      successResponse(res, updatedGoal, 'Metric linked to goal successfully');
    } catch (error) {
      logger.error('Error linking metric to goal', { error, goalId: req.params.id, metricId: req.params.metricId });
      errorResponse(res, 'Error linking metric to goal', error, 500);
    }
  }

  /**
   * Handles DELETE request to unlink a metric from a goal
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async unlinkMetricFromGoal(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID and metric ID from request parameters
      const { id, metricId } = req.params;

      // Call goalService.unlinkMetricFromGoal with goal ID and metric ID
      const updatedGoal = await this.goalService.unlinkMetricFromGoal(id, metricId);

      // Return success response with updated goal data
      successResponse(res, updatedGoal, 'Metric unlinked from goal successfully');
    } catch (error) {
      logger.error('Error unlinking metric from goal', { error, goalId: req.params.id, metricId: req.params.metricId });
      errorResponse(res, 'Error unlinking metric from goal', error, 500);
    }
  }

  /**
   * Handles PUT request to update all metrics linked to a goal
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async updateGoalMetrics(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract goal ID from request parameters
      const { id } = req.params;

      // Extract metric IDs array from request body
      const { metricIds } = req.body;

      // Call goalService.updateGoalMetrics with goal ID and metric IDs
      const updatedGoal = await this.goalService.updateGoalMetrics(id, metricIds);

      // Return success response with updated goal data
      successResponse(res, updatedGoal, 'Goal metrics updated successfully');
    } catch (error) {
      logger.error('Error updating goal metrics', { error, goalId: req.params.id, metricIds: req.body.metricIds });
      errorResponse(res, 'Error updating goal metrics', error, 500);
    }
  }

  /**
   * Handles POST request to create a new milestone
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async createMilestone(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract milestone data from request body
      const milestoneData: CreateMilestoneDto = req.body;

      // Call milestoneService.createMilestone with the milestone data
      const newMilestone = await this.milestoneService.createMilestone(milestoneData);

      // Return created response with the new milestone data
      createdResponse(res, newMilestone, 'Milestone created successfully');
    } catch (error) {
      logger.error('Error creating milestone', { error, milestoneData: req.body });
      errorResponse(res, 'Error creating milestone', error, 500);
    }
  }

  /**
   * Handles PUT request to update an existing milestone
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async updateMilestone(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract milestone ID from request parameters
      const { id } = req.params;

      // Extract update data from request body
      const updateData: UpdateMilestoneDto = req.body;

      // Call milestoneService.updateMilestone with ID and update data
      const updatedMilestone = await this.milestoneService.updateMilestone(id, updateData);

      // Return success response with updated milestone data
      successResponse(res, updatedMilestone, 'Milestone updated successfully');
    } catch (error) {
      logger.error('Error updating milestone', { error, milestoneId: req.params.id, updateData: req.body });
      errorResponse(res, 'Error updating milestone', error, 500);
    }
  }

  /**
   * Handles PATCH request to update a milestone's status
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async updateMilestoneStatus(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract milestone ID from request parameters
      const { id } = req.params;

      // Extract status value from request body
      const { status } = req.body;

      // Call milestoneService.updateMilestoneStatus with ID and status
      const updatedMilestone = await this.milestoneService.updateMilestoneStatus(id, status);

      // Return success response with updated milestone data
      successResponse(res, updatedMilestone, 'Milestone status updated successfully');
    } catch (error) {
      logger.error('Error updating milestone status', { error, milestoneId: req.params.id, status: req.body.status });
      errorResponse(res, 'Error updating milestone status', error, 500);
    }
  }

  /**
   * Handles DELETE request to remove a milestone
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async deleteMilestone(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract milestone ID from request parameters
      const { id } = req.params;

      // Call milestoneService.deleteMilestone with the milestone ID
      await this.milestoneService.deleteMilestone(id);

      // Return no-content response on successful deletion
      noContentResponse(res);
    } catch (error) {
      logger.error('Error deleting milestone', { error, milestoneId: req.params.id });
      errorResponse(res, 'Error deleting milestone', error, 500);
    }
  }

  /**
   * Handles GET request to retrieve a specific milestone by ID
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async getMilestoneById(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract milestone ID from request parameters
      const { id } = req.params;

      // Call milestoneService.getMilestone with the milestone ID
      const milestone = await this.milestoneService.getMilestone(id);

      // Return success response with milestone data
      successResponse(res, milestone, 'Milestone retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving milestone by ID', { error, milestoneId: req.params.id });
      errorResponse(res, 'Error retrieving milestone', error, 500);
    }
  }

  /**
   * Handles GET request to find milestones with filtering and pagination
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   * @returns Promise<void> Void promise that resolves when response is sent
   */
  private async findMilestones(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    try {
      // Extract filter parameters from request query
      const filters: MilestoneFilters = req.query as MilestoneFilters;

      // Parse pagination parameters from request query
      const { page, limit, offset } = parsePaginationParams(req.query);

      // Call milestoneService.findMilestones with filters and pagination
      const { data, total } = await this.milestoneService.findMilestones(filters, { page, limit, offset });

      // Create pagination links based on results
      const links = createPaginationLinks(req, { page, limit, offset }, total);

      // Return paginated response with milestones data
      paginatedResponse(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) }, links, 'Milestones retrieved successfully');
    } catch (error) {
      logger.error('Error retrieving milestones', { error });
      errorResponse(res, 'Error retrieving milestones', error, 500);
    }
  }
}