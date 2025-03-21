import { Router } from 'express'; // version ^4.18.2
import { authenticate, authorize, validateBody, Permission } from '../middlewares';
import { userController } from '../../controllers';
import { userValidation } from '../../utils/validation/userValidation';

/**
 * Configures and returns an Express router with user management routes
 * @returns Configured Express router with user management routes
 */
function setupUserRoutes(): Router {
  // 1. Create a new Express router instance
  const router = Router();

  // 2. Configure routes for user management operations with appropriate middleware
  // GET /users/me - Get the currently authenticated user's profile
  router.get('/users/me', authenticate, userController.getCurrentUser);

  // GET /users/:id - Get a user by ID (requires authentication and authorization)
  router.get('/users/:id', authenticate, authorize(Permission.VIEW_USERS), userController.getUserById);

  // GET /users - Get a paginated list of users (requires authentication and authorization)
  router.get('/users', authenticate, authorize(Permission.VIEW_USERS), userController.getUsers);

  // POST /users - Create a new user (requires authentication and authorization)
  router.post('/users', authenticate, authorize(Permission.MANAGE_USERS), validateBody(userValidation.createUserSchema), userController.createUser);

  // PUT /users/:id - Update an existing user (requires authentication and authorization)
  router.put('/users/:id', authenticate, authorize(Permission.MANAGE_USERS), validateBody(userValidation.updateUserSchema), userController.updateUser);

  // PUT /users/:id/email - Update a user's email (requires authentication and authorization)
  router.put('/users/:id/email', authenticate, authorize(Permission.MANAGE_USERS), validateBody(userValidation.updateUserEmailSchema), userController.updateUserEmail);

  // PUT /users/:id/preferences - Update a user's preferences (requires authentication and authorization)
  router.put('/users/:id/preferences', authenticate, authorize(Permission.MANAGE_USERS), validateBody(userValidation.updateUserPreferencesSchema), userController.updateUserPreferences);

  // PUT /users/:id/role - Change a user's role (requires authentication and authorization)
  router.put('/users/:id/role', authenticate, authorize(Permission.MANAGE_ROLES), validateBody(userValidation.changeUserRoleSchema), userController.changeUserRole);

  // DELETE /users/:id - Deactivate a user (requires authentication and authorization)
  router.delete('/users/:id', authenticate, authorize(Permission.MANAGE_USERS), userController.deactivateUser);

  // PUT /users/:id/activate - Activate a user (requires authentication and authorization)
  router.put('/users/:id/activate', authenticate, authorize(Permission.MANAGE_USERS), userController.activateUser);

  // POST /users/invite - Invite a new user (requires authentication and authorization)
  router.post('/users/invite', authenticate, authorize(Permission.MANAGE_USERS), validateBody(userValidation.inviteUserSchema), userController.inviteUser);

  // 3. Return the configured router
  return router;
}

// Export the setupUserRoutes function as the default export
export default setupUserRoutes();