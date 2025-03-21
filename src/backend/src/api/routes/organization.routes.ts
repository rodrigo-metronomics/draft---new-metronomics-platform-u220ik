import { Router } from 'express'; // express v4.x
import { organizationController } from '../../controllers';
import { authenticate } from '../middlewares/authentication';
import { authorize, authorizeOrganizationAccess } from '../middlewares/authorization';
import { validateBody, validateQuery } from '../middlewares/requestValidator';
import { Permission } from '../../utils/constants/permissions';
import { createOrganizationSchema, updateOrganizationSchema, updateOrganizationSettingsSchema, organizationFiltersSchema } from '../../utils/validation/organizationValidation';

/**
 * Defines the API routes for organization management in the Metronomics Platform.
 * This file configures Express routes for creating, retrieving, updating, and managing organizations, teams, and organization settings.
 */

// Create an Express router
const router = Router();

// Base path for all routes in this router
const basePath = '/api/organizations';

/**
 * Route: POST /api/organizations/
 * Description: Create a new organization
 * Permissions: Authenticated user
 */
router.post(
  '/',
  authenticate,
  validateBody(createOrganizationSchema),
  organizationController.createOrganization
);

/**
 * Route: GET /api/organizations/
 * Description: Get organizations for the current user
 * Permissions: Authenticated user
 */
router.get(
  '/',
  authenticate,
  validateQuery(organizationFiltersSchema),
  organizationController.getUserOrganizations
);

/**
 * Route: GET /api/organizations/coach
 * Description: Get organizations for a coach
 * Permissions: Authenticated user with ACCESS_MULTIPLE_ORGANIZATIONS permission
 */
router.get(
  '/coach',
  authenticate,
  authorize(Permission.ACCESS_MULTIPLE_ORGANIZATIONS),
  organizationController.getCoachOrganizations
);

/**
 * Route: GET /api/organizations/:organizationId
 * Description: Get a specific organization by ID
 * Permissions: Authenticated user with access to the organization and VIEW_ORGANIZATION permission
 */
router.get(
  '/:organizationId',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.VIEW_ORGANIZATION),
  organizationController.getOrganization
);

/**
 * Route: GET /api/organizations/:organizationId/users
 * Description: Get organization with its users
 * Permissions: Authenticated user with access to the organization and VIEW_ORGANIZATION permission
 */
router.get(
  '/:organizationId/users',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.VIEW_ORGANIZATION),
  organizationController.getOrganizationWithUsers
);

/**
 * Route: GET /api/organizations/:organizationId/teams
 * Description: Get organization with its teams
 * Permissions: Authenticated user with access to the organization and VIEW_ORGANIZATION permission
 */
router.get(
  '/:organizationId/teams',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.VIEW_ORGANIZATION),
  organizationController.getOrganizationWithTeams
);

/**
 * Route: GET /api/organizations/:organizationId/full
 * Description: Get organization with both users and teams
 * Permissions: Authenticated user with access to the organization and VIEW_ORGANIZATION permission
 */
router.get(
  '/:organizationId/full',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.VIEW_ORGANIZATION),
  organizationController.getOrganizationWithUsersAndTeams
);

/**
 * Route: PUT /api/organizations/:organizationId
 * Description: Update a specific organization
 * Permissions: Authenticated user with access to the organization and MANAGE_ORGANIZATION permission
 */
router.put(
  '/:organizationId',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.MANAGE_ORGANIZATION),
  validateBody(updateOrganizationSchema),
  organizationController.updateOrganization
);

/**
 * Route: PUT /api/organizations/:organizationId/settings
 * Description: Update organization settings
 * Permissions: Authenticated user with access to the organization and MANAGE_ORGANIZATION permission
 */
router.put(
  '/:organizationId/settings',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.MANAGE_ORGANIZATION),
  validateBody(updateOrganizationSettingsSchema),
  organizationController.updateOrganizationSettings
);

/**
 * Route: POST /api/organizations/:organizationId/users
 * Description: Add a user to the organization
 * Permissions: Authenticated user with access to the organization and MANAGE_USERS permission
 */
router.post(
  '/:organizationId/users',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.MANAGE_USERS),
  organizationController.addUserToOrganization
);

/**
 * Route: DELETE /api/organizations/:organizationId/users/:userId
 * Description: Remove a user from the organization
 * Permissions: Authenticated user with access to the organization and MANAGE_USERS permission
 */
router.delete(
  '/:organizationId/users/:userId',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.MANAGE_USERS),
  organizationController.removeUserFromOrganization
);

/**
 * Route: GET /api/organizations/:organizationId/summary
 * Description: Get organization summary with key metrics and statistics
 * Permissions: Authenticated user with access to the organization and VIEW_ORGANIZATION permission
 */
router.get(
  '/:organizationId/summary',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.VIEW_ORGANIZATION),
  organizationController.getOrganizationSummary
);

/**
 * Route: POST /api/organizations/:organizationId/announcements
 * Description: Send an announcement to all organization members
 * Permissions: Authenticated user with access to the organization and MANAGE_ORGANIZATION permission
 */
router.post(
  '/:organizationId/announcements',
  authenticate,
  authorizeOrganizationAccess,
  authorize(Permission.MANAGE_ORGANIZATION),
  organizationController.sendOrganizationAnnouncement
);

export default router;