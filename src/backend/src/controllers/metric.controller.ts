# src/backend/src/controllers/metric.controller.ts
```typescript
import { Request, Response } from 'express'; // version ^4.18.2
import { MetricService } from '../services/metric/metricService';
import { MetricValueService } from '../services/metric/metricValueService';
import {
  CreateMetricDto,
  UpdateMetricDto,
  CreateMetricValueDto,
  MetricFilters,
  MetricValueFilters,
  ComparisonType,
} from '../types/metric.types';
import {
  successResponse,
  errorResponse,
  createdResponse,
  paginatedResponse,
} from '../utils/helpers/responseHelper';
import {
  parsePaginationParams,
  createPaginationLinks,
} from '../utils/helpers/paginationHelper';
import { logger } from '../utils/helpers/logger';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Controller for handling metric-related HTTP requests in the Metronomics Platform.
 * Provides endpoints for creating, retrieving, updating, and deleting metrics, as well as
 * managing metric values, thresholds, and dashboard data.
 */
// Initialize metric service and metric value service
const metricService = new MetricService();
const metricValueService = new MetricValueService();

/**
 * Creates a new metric with optional thresholds and goal links
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with created metric data
 */
export const createMetric = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric data from request body
    const metricData: CreateMetricDto = req.body;

    // 2. Call metricService.createMetric with the data
    const newMetric = await metricService.createMetric(metricData);

    // 3. Return created response with the new metric
    return createdResponse(res, newMetric, 'Metric created successfully');
  } catch (error) {
    // 4. Handle validation errors and return appropriate error response
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, error.details, 422);
    }

    // 5. Log any unexpected errors and return error response
    logger.error('Unexpected error creating metric', { error });
    return errorResponse(res, 'Failed to create metric', null, 500);
  }
};

/**
 * Retrieves a metric by its ID
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with metric data
 */
export const getMetricById = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric ID from request parameters
    const { id } = req.params;

    // 2. Call metricService.getMetricById with the ID
    const metric = await metricService.getMetricById(id);

    // 3. If metric not found, return 404 error response
    if (!metric) {
      return errorResponse(res, 'Metric not found', null, 404);
    }

    // 4. Return success response with the metric data
    return successResponse(res, metric, 'Metric retrieved successfully');
  } catch (error) {
    // 5. Handle errors and return appropriate error response
    logger.error('Error retrieving metric by ID', { error });
    return errorResponse(res, 'Failed to retrieve metric', null, 500);
  }
};

/**
 * Retrieves metrics for a specific organization with pagination
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with paginated metrics data
 */
export const getMetricsByOrganization = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract organization ID from request parameters
    const { organizationId } = req.params;

    // 2. Parse pagination parameters from request query
    const pagination = parsePaginationParams(req.query);

    // 3. Call metricService.getMetricsByOrganization with the organization ID
    const { data, total } = await metricService.getMetricsByOrganization(organizationId, pagination);

    // 4. Create pagination links for the response
    const links = createPaginationLinks(req, pagination, total);

    // 5. Return paginated response with metrics data
    return paginatedResponse(res, data, { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) }, links, 'Metrics retrieved successfully');
  } catch (error) {
    // 6. Handle errors and return appropriate error response
    logger.error('Error retrieving metrics by organization', { error });
    return errorResponse(res, 'Failed to retrieve metrics', null, 500);
  }
};

/**
 * Retrieves metrics for a specific team with pagination
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with paginated metrics data
 */
export const getMetricsByTeam = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract team ID from request parameters
    const { teamId } = req.params;

    // 2. Parse pagination parameters from request query
    const pagination = parsePaginationParams(req.query);

    // 3. Call metricService.getMetricsByTeam with the team ID
    const { data, total } = await metricService.getMetricsByTeam(teamId, pagination);

    // 4. Create pagination links for the response
    const links = createPaginationLinks(req, pagination, total);

    // 5. Return paginated response with metrics data
    return paginatedResponse(res, data, { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) }, links, 'Metrics retrieved successfully');
  } catch (error) {
    // 6. Handle errors and return appropriate error response
    logger.error('Error retrieving metrics by team', { error });
    return errorResponse(res, 'Failed to retrieve metrics', null, 500);
  }
};

/**
 * Retrieves metrics linked to a specific goal with pagination
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with paginated metrics data
 */
export const getMetricsByGoal = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract goal ID from request parameters
    const { goalId } = req.params;

    // 2. Parse pagination parameters from request query
    const pagination = parsePaginationParams(req.query);

    // 3. Call metricService.getMetricsByGoal with the goal ID
    const { data, total } = await metricService.getMetricsByGoal(goalId, pagination);

    // 4. Create pagination links for the response
    const links = createPaginationLinks(req, pagination, total);

    // 5. Return paginated response with metrics data
    return paginatedResponse(res, data, { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) }, links, 'Metrics retrieved successfully');
  } catch (error) {
    // 6. Handle errors and return appropriate error response
    logger.error('Error retrieving metrics by goal', { error });
    return errorResponse(res, 'Failed to retrieve metrics', null, 500);
  }
};

/**
 * Retrieves metrics based on filters with pagination
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with paginated filtered metrics data
 */
export const getMetricsWithFilters = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract filter parameters from request query
    const filters: MetricFilters = req.query as any;

    // 2. Parse pagination parameters from request query
    const pagination = parsePaginationParams(req.query);

    // 3. Call metricService.getMetricsWithFilters with the filters and pagination
    const { data, total } = await metricService.getMetricsWithFilters(filters, pagination);

    // 4. Create pagination links for the response
    const links = createPaginationLinks(req, pagination, total);

    // 5. Return paginated response with filtered metrics data
    return paginatedResponse(res, data, { ...pagination, total, totalPages: Math.ceil(total / pagination.limit) }, links, 'Metrics retrieved successfully');
  } catch (error) {
    // 6. Handle errors and return appropriate error response
    logger.error('Error retrieving metrics with filters', { error });
    return errorResponse(res, 'Failed to retrieve metrics', null, 500);
  }
};

/**
 * Updates an existing metric
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with updated metric data
 */
export const updateMetric = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric ID from request parameters
    const { id } = req.params;

    // 2. Extract update data from request body
    const updateData: UpdateMetricDto = req.body;

    // 3. Call metricService.updateMetric with the ID and data
    const updatedMetric = await metricService.updateMetric(id, updateData);

    // 4. Return success response with the updated metric
    return successResponse(res, updatedMetric, 'Metric updated successfully');
  } catch (error) {
    // 5. Handle not found errors and return 404 response
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, null, 404);
    }
    // 6. Handle validation errors and return appropriate error response
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, error.details, 422);
    }

    // 7. Log any unexpected errors and return error response
    logger.error('Unexpected error updating metric', { error });
    return errorResponse(res, 'Failed to update metric', null, 500);
  }
};

/**
 * Deletes a metric and its related data
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with deleted metric data
 */
export const deleteMetric = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric ID from request parameters
    const { id } = req.params;

    // 2. Call metricService.deleteMetric with the ID
    const deletedMetric = await metricService.deleteMetric(id);

    // 3. Return success response with the deleted metric
    return successResponse(res, deletedMetric, 'Metric deleted successfully');
  } catch (error) {
    // 4. Handle not found errors and return 404 response
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, null, 404);
    }

    // 5. Log any unexpected errors and return error response
    logger.error('Unexpected error deleting metric', { error });
    return errorResponse(res, 'Failed to delete metric', null, 500);
  }
};

/**
 * Links a goal to a metric
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with updated metric data
 */
export const linkGoalToMetric = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric ID and goal ID from request parameters
    const { metricId, goalId } = req.params;

    // 2. Call metricService.linkGoalToMetric with the metric ID and goal ID
    const updatedMetric = await metricService.linkGoalToMetric(metricId, goalId);

    // 3. Return success response with the updated metric
    return successResponse(res, updatedMetric, 'Goal linked to metric successfully');
  } catch (error) {
    // 4. Handle not found errors and return 404 response
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, null, 404);
    }

    // 5. Log any unexpected errors and return error response
    logger.error('Unexpected error linking goal to metric', { error });
    return errorResponse(res, 'Failed to link goal to metric', null, 500);
  }
};

/**
 * Removes a goal link from a metric
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with updated metric data
 */
export const unlinkGoalFromMetric = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric ID and goal ID from request parameters
    const { metricId, goalId } = req.params;

    // 2. Call metricService.unlinkGoalFromMetric with the metric ID and goal ID
    const updatedMetric = await metricService.unlinkGoalFromMetric(metricId, goalId);

    // 3. Return success response with the updated metric
    return successResponse(res, updatedMetric, 'Goal unlinked from metric successfully');
  } catch (error) {
    // 4. Handle not found errors and return 404 response
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, null, 404);
    }

    // 5. Log any unexpected errors and return error response
    logger.error('Unexpected error unlinking goal from metric', { error });
    return errorResponse(res, 'Failed to unlink goal from metric', null, 500);
  }
};

/**
 * Creates a new value for a metric
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with created metric value data
 */
export const createMetricValue = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric value data from request body
    const metricValueData: CreateMetricValueDto = req.body;

    // 2. Extract user ID from authenticated request
    const userId = req['user'].id;

    // 3. Call metricValueService.createMetricValue with the data and user ID
    const newMetricValue = await metricValueService.createMetricValue(metricValueData, userId);

    // 4. Return created response with the new metric value
    return createdResponse(res, newMetricValue, 'Metric value created successfully');
  } catch (error) {
    // 5. Handle validation errors and return appropriate error response
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, error.details, 422);
    }

    // 6. Log any unexpected errors and return error response
    logger.error('Unexpected error creating metric value', { error });
    return errorResponse(res, 'Failed to create metric value', null, 500);
  }
};

/**
 * Retrieves values for a metric based on filters
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with metric values data
 */
export const getMetricValues = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric ID from request parameters
    const { metricId } = req.params;

    // 2. Extract date range filters from request query
    const filters: MetricValueFilters = {
      metricId,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : null,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : null,
    };

    // 3. Create MetricValueFilters object with the parameters
    const metricValueFilters: MetricValueFilters = filters;

    // 4. Call metricValueService.getMetricValues with the filters
    const metricValues = await metricValueService.getMetricValues(metricValueFilters);

    // 5. Return success response with the metric values
    return successResponse(res, metricValues, 'Metric values retrieved successfully');
  } catch (error) {
    // 6. Handle errors and return appropriate error response
    logger.error('Error retrieving metric values', { error });
    return errorResponse(res, 'Failed to retrieve metric values', null, 500);
  }
};

/**
 * Retrieves time series data for a metric for charting
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with time series data
 */
export const getTimeSeriesData = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric ID from request parameters
    const { metricId } = req.params;

    // 2. Extract start date, end date, and interval from request query
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);
    const interval = req.query.interval as string;

    // 3. Call metricValueService.getTimeSeriesData with the parameters
    const timeSeriesData = await metricValueService.getTimeSeriesData(metricId, startDate, endDate, interval);

    // 4. Return success response with the time series data
    return successResponse(res, timeSeriesData, 'Time series data retrieved successfully');
  } catch (error) {
    // 5. Handle errors and return appropriate error response
    logger.error('Error retrieving time series data', { error });
    return errorResponse(res, 'Failed to retrieve time series data', null, 500);
  }
};

/**
 * Retrieves dashboard data with metrics, values, and trends
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with dashboard data
 */
export const getDashboardData = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract organization ID, team ID, goal ID, and date range from request query
    const { organizationId, teamId, goalId, startDate, endDate, comparisonType: comparisonTypeQuery } = req.query;

    // 2. Extract comparison type from request query, default to YEAR_TO_DATE if not provided
    const comparisonType = (comparisonTypeQuery as ComparisonType) || ComparisonType.YEAR_TO_DATE;

    // 3. Create MetricFilters object with the parameters
    const filters: MetricFilters = {
      organizationId: organizationId as string,
      teamId: teamId as string || null,
      goalId: goalId as string || null,
      startDate: startDate ? new Date(startDate as string) : null,
      endDate: endDate ? new Date(endDate as string) : null,
      type: null, // type filter is not supported in this method
    };

    // 4. Call metricService.getDashboardData with the filters and comparison type
    const dashboardData = await metricService.getDashboardData(filters, comparisonType);

    // 5. Return success response with the dashboard data
    return successResponse(res, dashboardData, 'Dashboard data retrieved successfully');
  } catch (error) {
    // 6. Handle errors and return appropriate error response
    logger.error('Error retrieving dashboard data', { error });
    return errorResponse(res, 'Failed to retrieve dashboard data', null, 500);
  }
};

/**
 * Generates forecast data for a metric based on historical values
 * @param req Express Request
 * @param res Express Response
 * @returns Promise<Response> Express response with forecast data
 */
export const getForecastData = async (req: Request, res: Response): Promise<Response> => {
  try {
    // 1. Extract metric ID from request parameters
    const { metricId } = req.params;

    // 2. Extract periods parameter from request query, default to 12 if not provided
    const periods = parseInt(req.query.periods as string, 10) || 12;

    // 3. Call metricService.getForecastData with the metric ID and periods
    const forecastData = await metricService.getForecastData(metricId, periods);

    // 4. Return success response with the forecast data
    return successResponse(res, forecastData, 'Forecast data retrieved successfully');
  } catch (error) {
    // 5. Handle validation errors and return appropriate error response
    if (error instanceof ValidationError) {
      return errorResponse(res, error.message, error.details, 422);
    }
    // 6. Handle not found errors and return 404 response
    if (error instanceof NotFoundError) {
      return errorResponse(res, error.message, null, 404);
    }

    // 7. Log any unexpected errors and return error response
    logger.error('Unexpected error retrieving forecast data', { error });
    return errorResponse(res, 'Failed to retrieve forecast data', null, 500);
  }
};