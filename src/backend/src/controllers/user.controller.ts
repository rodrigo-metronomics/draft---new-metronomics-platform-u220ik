import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import { userService, } from '../services/user/userService';
import { logger } from '../utils/helpers/logger';
import { successResponse, errorResponse, createdResponse, paginatedResponse } from '../utils/helpers/responseHelper';
import { parsePaginationParams, createPaginationLinks } from '../utils/helpers/paginationHelper';
import { UserRole } from '../utils/constants/roles';
import { CreateUserDto, UpdateUserDto, UpdateUserEmailDto, UpdateUserPreferencesDto, UserInviteDto, UserFilters } from '../types/user.types';

/**
 * Controller handling HTTP requests for user management in the Metronomics Platform.
 * Implements RESTful endpoints for creating, retrieving, updating, and managing users,
 * including user profiles, roles, and organization relationships.
 */

/**
 * Gets the currently authenticated user's profile
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the current user's profile
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user ID from the authenticated request object
    const userId = req.user.id;

    // Call userService.getUserWithTeams to get the user with team relationships
    const user = await userService.getUserWithTeams(userId);

    // If user not found, return 404 error response
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    // Format the user data using userService.formatUserProfileResponse
    const formattedUser = userService.formatUserProfileResponse(user);

    // Return success response with the formatted user profile
    return successResponse(res, formattedUser, 'User profile retrieved successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error getting current user', { error });
    return errorResponse(res, 'Failed to get current user', error);
  }
};

/**
 * Gets a user by their ID
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the requested user's details
 */
export const getUserById = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Extract current user ID from the authenticated request object
    const currentUserId = req.user.id;

    // Call userService.validateUserAccess to ensure current user has access to the requested user
    await userService.validateUserAccess(userId, currentUserId, true);

    // Call userService.getUserWithTeams to get the user with team relationships
    const user = await userService.getUserWithTeams(userId);

    // If user not found, return 404 error response
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    // Format the user data using userService.formatUserDetailResponse
    const formattedUser = userService.formatUserDetailResponse(user);

    // Return success response with the formatted user details
    return successResponse(res, formattedUser, 'User details retrieved successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error getting user by ID', { error, userId: req.params.id });
    return errorResponse(res, 'Failed to get user details', error);
  }
};

/**
 * Gets a paginated list of users with optional filtering
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with paginated list of users
 */
export const getUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Parse pagination parameters from request query using parsePaginationParams
    const { page, limit, offset } = parsePaginationParams(req.query);

    // Extract filter parameters from request query (organizationId, role, status, teamId, search, isActive)
    const filters: UserFilters = {
      organizationId: req.query.organizationId as string,
      role: req.query.role as UserRole,
      status: req.query.status as any, // TODO: Fix this typing
      teamId: req.query.teamId as string,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true'
    };

    // Call userService.findUsersWithFilters with pagination and filter parameters
    const usersData = await userService.findUsersWithFilters(filters, { page, limit, offset });

    // Create pagination links using createPaginationLinks
    const links = createPaginationLinks(req, { page, limit }, usersData.total);

    // Format the user list using userService.formatUserListResponse
    const formattedUsers = userService.formatUserListResponse(usersData, { page, limit });

    // Return paginated response with the formatted user list
    return paginatedResponse(res, formattedUsers.users, { page, limit, total: usersData.total, totalPages: Math.ceil(usersData.total / limit) }, links, 'Users retrieved successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error getting users', { error, query: req.query });
    return errorResponse(res, 'Failed to get users', error);
  }
};

/**
 * Creates a new user
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the created user
 */
export const createUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user creation data from request body as CreateUserDto
    const userData: CreateUserDto = req.body;

    // Call userService.createUser with the user data
    const user = await userService.createUser(userData);

    // Format the created user using userService.formatUserResponse
    const formattedUser = userService.formatUserResponse(user);

    // Return created response with the formatted user data
    return createdResponse(res, formattedUser, 'User created successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error creating user', { error, body: req.body });
    return errorResponse(res, 'Failed to create user', error);
  }
};

/**
 * Updates an existing user's details
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the updated user
 */
export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Extract current user ID from the authenticated request object
    const currentUserId = req.user.id;

    // Extract user update data from request body as UpdateUserDto
    const updateData: UpdateUserDto = req.body;

    // Call userService.validateUserAccess to ensure current user has access to update the user
    await userService.validateUserAccess(userId, currentUserId, true);

    // Call userService.updateUser with the user ID, update data, and current user ID
    const user = await userService.updateUser(userId, updateData, currentUserId);

    // Format the updated user using userService.formatUserResponse
    const formattedUser = userService.formatUserResponse(user);

    // Return success response with the formatted user data
    return successResponse(res, formattedUser, 'User updated successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error updating user', { error, userId: req.params.id, body: req.body });
    return errorResponse(res, 'Failed to update user', error);
  }
};

/**
 * Updates a user's email address
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the updated user
 */
export const updateUserEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Extract current user ID from the authenticated request object
    const currentUserId = req.user.id;

    // Extract email update data from request body as UpdateUserEmailDto
    const updateData: UpdateUserEmailDto = req.body;

    // Call userService.validateUserAccess to ensure current user has access to update the user
    await userService.validateUserAccess(userId, currentUserId, true);

    // Call userService.updateUserEmail with the user ID and email data
    const user = await userService.updateUserEmail(userId, updateData);

    // Format the updated user using userService.formatUserResponse
    const formattedUser = userService.formatUserResponse(user);

    // Return success response with the formatted user data
    return successResponse(res, formattedUser, 'User email updated successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error updating user email', { error, userId: req.params.id, body: req.body });
    return errorResponse(res, 'Failed to update user email', error);
  }
};

/**
 * Updates a user's role
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the updated user
 */
export const updateUserRole = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Extract current user ID from the authenticated request object
    const currentUserId = req.user.id;

    // Extract role from request body
    const { role } = req.body;

    // Call userService.validateUserAccess to ensure current user has access to update the user
    await userService.validateUserAccess(userId, currentUserId, true);

    // Call userService.updateUserRole with the user ID, role, and current user ID
    const user = await userService.updateUserRole(userId, role, currentUserId);

    // Format the updated user using userService.formatUserResponse
    const formattedUser = userService.formatUserResponse(user);

    // Return success response with the formatted user data
    return successResponse(res, formattedUser, 'User role updated successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error updating user role', { error, userId: req.params.id, body: req.body });
    return errorResponse(res, 'Failed to update user role', error);
  }
};

/**
 * Updates a user's preferences
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the updated user
 */
export const updateUserPreferences = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Extract current user ID from the authenticated request object
    const currentUserId = req.user.id;

    // Extract preferences data from request body as UpdateUserPreferencesDto
    const preferencesData: UpdateUserPreferencesDto = req.body;

    // Call userService.validateUserAccess to ensure current user has access to update the user
    await userService.validateUserAccess(userId, currentUserId, true);

    // Call userService.updateUserPreferences with the user ID and preferences data
    const user = await userService.updateUserPreferences(userId, preferencesData);

    // Format the updated user using userService.formatUserResponse
    const formattedUser = userService.formatUserResponse(user);

    // Return success response with the formatted user data
    return successResponse(res, formattedUser, 'User preferences updated successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error updating user preferences', { error, userId: req.params.id, body: req.body });
    return errorResponse(res, 'Failed to update user preferences', error);
  }
};

/**
 * Activates a user account
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the activated user
 */
export const activateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Extract current user ID from the authenticated request object
    const currentUserId = req.user.id;

    // Call userService.validateUserAccess to ensure current user has access to manage the user
    await userService.validateUserAccess(userId, currentUserId, true);

    // Call userService.activateUser with the user ID
    const user = await userService.activateUser(userId);

    // Format the updated user using userService.formatUserResponse
    const formattedUser = userService.formatUserResponse(user);

    // Return success response with the formatted user data
    return successResponse(res, formattedUser, 'User activated successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error activating user', { error, userId: req.params.id });
    return errorResponse(res, 'Failed to activate user', error);
  }
};

/**
 * Deactivates a user account
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the deactivated user
 */
export const deactivateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Extract current user ID from the authenticated request object
    const currentUserId = req.user.id;

    // Call userService.validateUserAccess to ensure current user has access to manage the user
    await userService.validateUserAccess(userId, currentUserId, true);

    // Call userService.deactivateUser with the user ID
    const user = await userService.deactivateUser(userId);

    // Format the updated user using userService.formatUserResponse
    const formattedUser = userService.formatUserResponse(user);

    // Return success response with the formatted user data
    return successResponse(res, formattedUser, 'User deactivated successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error deactivating user', { error, userId: req.params.id });
    return errorResponse(res, 'Failed to deactivate user', error);
  }
};

/**
 * Invites a new user to the platform
 * @param req Express Request object
 * @param res Express Response object
 * @returns Response with the invited user
 */
export const inviteUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Extract invitation data from request body as UserInviteDto
    const inviteData: UserInviteDto = req.body;

    // Extract current user ID from the authenticated request object
    const currentUserId = req.user.id;

    // Call userService.inviteUser with the invitation data and current user ID
    const user = await userService.inviteUser(inviteData, currentUserId);

    // Format the created user using userService.formatUserResponse
    const formattedUser = userService.formatUserResponse(user);

    // Return created response with the formatted user data
    return createdResponse(res, formattedUser, 'User invited successfully');
  } catch (error) {
    // Handle any errors with appropriate error responses
    logger.error('Error inviting user', { error, body: req.body });
    return errorResponse(res, 'Failed to invite user', error);
  }
};