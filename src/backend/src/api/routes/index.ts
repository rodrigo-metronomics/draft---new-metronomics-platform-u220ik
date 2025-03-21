import express from 'express'; // version ^4.18.2
import { authRoutes } from './auth.routes';
import { goalRoutes } from './goal.routes';
import { meetingRoutes } from './meeting.routes';
import { metricRoutes } from './metric.routes';
import { organizationRoutes } from './organization.routes';
import { userRoutes } from './user.routes';
import { kffmRoutes } from './kffm.routes';
import { logger } from '../../utils/helpers/logger';

/**
 * Configures and returns an Express router with all API routes mounted at appropriate paths
 * @returns {express.Router} Configured Express router with all API routes
 */
const setupRoutes = (): express.Router => {
  // Create a new Express router instance
  const router = express.Router();

  // Mount authentication routes at /auth
  router.use('/auth', authRoutes);

  // Mount meeting routes at /meetings
  router.use('/meetings', meetingRoutes);

  // Mount goal routes at /goals
  router.use('/goals', goalRoutes);

  // Mount metric routes at /metrics
  router.use('/metrics', metricRoutes);

  // Mount organization routes at /organizations
  router.use('/organizations', organizationRoutes);

  // Mount user routes at /users
  router.use('/users', userRoutes);

  // Mount KFFM routes at /kffm
  router.use('/kffm', kffmRoutes);

  // Log successful route initialization
  logger.info('API routes initialized');

  // Return the configured router
  return router;
};

// Export the setupRoutes function as the default export
export default setupRoutes();