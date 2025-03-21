import express from 'express'; // version ^4.18.2
import { authenticate } from '../middlewares/authentication';
import { authorize, authorizeResource } from '../middlewares/authorization';
import { Permission } from '../../utils/constants/permissions';
import { MetricController } from '../../controllers/metric.controller';
import { MetricService } from '../../services/metric/metricService';
import { validateBody, validateQuery, validateParams } from '../middlewares/requestValidator';
import { metricValidation } from '../../utils/validation/metricValidation';
import { authorizeOrganizationAccess, authorizeTeamAccess } from '../middlewares/authorization';

// Initialize metric service and controller
const metricService = new MetricService();
const metricController = new MetricController(metricService);

/**
 * Creates and configures an Express router with all metric-related routes
 * @returns Configured Express router with metric routes
 */
export const setupMetricRoutes = (): express.Router => {
  // 1. Create a new Express router instance
  const router = express.Router();

  // 2. Initialize MetricService instance
  // Already initialized above: const metricService = new MetricService();

  // 3. Create a MetricController instance with the service
  // Already initialized above: const metricController = new MetricController(metricService);

  // 4. Set up routes with appropriate middleware for authentication and authorization
  // Create a new metric
  router.post(
    '/',
    authenticate,
    authorize(Permission.CREATE_METRIC),
    validateBody(metricValidation.createMetricSchema),
    metricController.createMetric
  );

  // Get a metric by ID
  router.get(
    '/:id',
    authenticate,
    authorize(Permission.VIEW_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    metricController.getMetricById
  );

  // Get metrics for an organization
  router.get(
    '/organization/:organizationId',
    authenticate,
    authorizeOrganizationAccess,
    validateParams(metricValidation.metricFiltersSchema),
    metricController.getMetricsByOrganization
  );

  // Get metrics for a team
  router.get(
    '/team/:teamId',
    authenticate,
    authorizeTeamAccess,
    validateParams(metricValidation.metricFiltersSchema),
    metricController.getMetricsByTeam
  );

  // Get metrics for a goal
  router.get(
    '/goal/:goalId',
    authenticate,
    authorize(Permission.VIEW_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    metricController.getMetricsByGoal
  );

  // Get metrics with filters
  router.get(
    '/',
    authenticate,
    authorize(Permission.VIEW_METRIC),
    validateQuery(metricValidation.metricFiltersSchema),
    metricController.getMetricsWithFilters
  );

  // Update a metric
  router.put(
    '/:id',
    authenticate,
    authorize(Permission.UPDATE_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    validateBody(metricValidation.updateMetricSchema),
    metricController.updateMetric
  );

  // Delete a metric
  router.delete(
    '/:id',
    authenticate,
    authorize(Permission.DELETE_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    metricController.deleteMetric
  );

  // Link a goal to a metric
  router.post(
    '/:metricId/link/:goalId',
    authenticate,
    authorize(Permission.UPDATE_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    metricController.linkGoalToMetric
  );

  // Unlink a goal from a metric
  router.delete(
    '/:metricId/link/:goalId',
    authenticate,
    authorize(Permission.UPDATE_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    metricController.unlinkGoalFromMetric
  );

  // Create a new metric value
  router.post(
    '/:metricId/values',
    authenticate,
    authorize(Permission.UPDATE_METRIC_VALUE),
    validateParams(metricValidation.metricFiltersSchema),
    validateBody(metricValidation.createMetricValueSchema),
    metricController.createMetricValue
  );

  // Get values for a metric
  router.get(
    '/:metricId/values',
    authenticate,
    authorize(Permission.VIEW_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    validateQuery(metricValidation.metricValueFiltersSchema),
    metricController.getMetricValues
  );

  // Get time series data for a metric
  router.get(
    '/:metricId/time-series',
    authenticate,
    authorize(Permission.VIEW_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    validateQuery(metricValidation.metricValueFiltersSchema),
    metricController.getTimeSeriesData
  );

  // Get dashboard data with metrics, values, and trends
  router.get(
    '/dashboard',
    authenticate,
    authorize(Permission.VIEW_DASHBOARD),
    validateQuery(metricValidation.metricFiltersSchema),
    metricController.getDashboardData
  );

  // Get forecast data for a metric
  router.get(
    '/:metricId/forecast',
    authenticate,
    authorize(Permission.VIEW_METRIC),
    validateParams(metricValidation.metricFiltersSchema),
    validateQuery(metricValidation.metricValueFiltersSchema),
    metricController.getForecastData
  );

  // 5. Return the configured router
  return router;
};

// Export the configured router for use in the main application
export const metricRoutes = setupMetricRoutes();