# src/backend/src/controllers/organization.controller.ts
import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import { organizationService, OrganizationService } from '../services/organization';
import { logger } from '../utils/helpers/logger';
import { successResponse, errorResponse, createdResponse, noContentResponse, paginatedResponse } from '../utils/helpers/responseHelper';
import { getPaginationParams, generatePaginationLinks } from '../utils/helpers/paginationHelper';
import { CreateOrganizationDto, UpdateOrganizationDto, UpdateOrganizationSettingsDto, OrganizationFilters, OrganizationAnnouncementDto } from '../types/organization.types';

/**
 * Controller for handling organization-related HTTP requests in the Metronomics Platform.
 * Provides endpoints for creating, retrieving, updating, and managing organizations,
 * including organization settings, user membership, and organization-wide announcements.
 */

/**
 * Creates a new organization
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const createOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization data from request body
    const organizationData: CreateOrganizationDto = req.body;

    // LD1: Extract user ID from authenticated request
    const userId = req.user.id;

    // LD1: Log organization creation attempt
    logger.info('Attempting to create organization', { organizationData, userId });

    // LD1: Call organizationService.createOrganizationWithOwner with organization data and user ID
    const organization = await organizationService.createOrganizationWithOwner(organizationData, userId);

    // LD1: Return created response with the new organization data
    createdResponse(res, organization, 'Organization created successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error creating organization', { error });
    next(error);
  }
};

/**
 * Retrieves a specific organization by ID
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const getOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Call organizationService.getOrganization with the organization ID
    const organization = await organizationService.getOrganization(organizationId);

    // LD1: Return success response with the organization data
    successResponse(res, organization, 'Organization retrieved successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error getting organization', { error });
    next(error);
  }
};

/**
 * Retrieves an organization with its users
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const getOrganizationWithUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Call organizationService.getOrganizationWithUsers with the organization ID
    const organization = await organizationService.getOrganizationWithUsers(organizationId);

    // LD1: Return success response with the organization and users data
    successResponse(res, organization, 'Organization with users retrieved successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error getting organization with users', { error });
    next(error);
  }
};

/**
 * Retrieves an organization with its teams
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const getOrganizationWithTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Call organizationService.getOrganizationWithTeams with the organization ID
    const organization = await organizationService.getOrganizationWithTeams(organizationId);

    // LD1: Return success response with the organization and teams data
    successResponse(res, organization, 'Organization with teams retrieved successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error getting organization with teams', { error });
    next(error);
  }
};

/**
 * Retrieves an organization with both its users and teams
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const getOrganizationWithUsersAndTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Call organizationService.getOrganizationWithUsersAndTeams with the organization ID
    const organization = await organizationService.getOrganizationWithUsersAndTeams(organizationId);

    // LD1: Return success response with the organization, users, and teams data
    successResponse(res, organization, 'Organization with users and teams retrieved successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error getting organization with users and teams', { error });
    next(error);
  }
};

/**
 * Retrieves organizations for the current user with optional filtering
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const getUserOrganizations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract user ID from authenticated request
    const userId: string = req.user.id;

    // LD1: Extract query parameters for filtering
    const { search } = req.query;

    // LD1: Extract pagination parameters using getPaginationParams
    const { page, limit, offset } = getPaginationParams(req.query);

    // LD1: Create filters object with user ID and search parameters
    const filters: OrganizationFilters = {
      userId,
      coachId: null, // Ensure coachId is null for user organizations
      search: search as string,
    };

    // LD1: Call organizationService.findOrganizations with filters and pagination
    const { organizations, total } = await organizationService.findOrganizations(filters, { page, limit, offset });

    // LD1: Generate pagination links using generatePaginationLinks
    const links = generatePaginationLinks(req, { page, limit, offset }, total);

    // LD1: Return paginated response with organizations data and pagination links
    paginatedResponse(res, organizations, { page, limit, total, totalPages: Math.ceil(total / limit) }, links, 'Organizations retrieved successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error getting user organizations', { error });
    next(error);
  }
};

/**
 * Retrieves organizations for a coach user
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const getCoachOrganizations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract user ID from authenticated request
    const userId: string = req.user.id;

    // LD1: Extract pagination parameters using getPaginationParams
    const { page, limit, offset } = getPaginationParams(req.query);

    // LD1: Create filters object with coach ID
    const filters: OrganizationFilters = {
      userId: null, // Ensure userId is null for coach organizations
      coachId: userId,
      search: null, // Ensure search is null for coach organizations
    };

    // LD1: Call organizationService.findOrganizations with filters and pagination
    const { organizations, total } = await organizationService.findOrganizations(filters, { page, limit, offset });

    // LD1: Generate pagination links using generatePaginationLinks
    const links = generatePaginationLinks(req, { page, limit, offset }, total);

    // LD1: Return paginated response with organizations data and pagination links
    paginatedResponse(res, organizations, { page, limit, total, totalPages: Math.ceil(total / limit) }, links, 'Coach organizations retrieved successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error getting coach organizations', { error });
    next(error);
  }
};

/**
 * Updates an organization's details
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const updateOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Extract update data from request body
    const updateData: UpdateOrganizationDto = req.body;

    // LD1: Log organization update attempt
    logger.info('Attempting to update organization', { organizationId, updateData });

    // LD1: Call organizationService.updateOrganization with organization ID and update data
    const updatedOrganization = await organizationService.updateOrganization(organizationId, updateData);

    // LD1: Return success response with the updated organization data
    successResponse(res, updatedOrganization, 'Organization updated successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error updating organization', { error });
    next(error);
  }
};

/**
 * Updates an organization's settings
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const updateOrganizationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Extract settings data from request body
    const settingsData: UpdateOrganizationSettingsDto = req.body;

    // LD1: Log organization settings update attempt
    logger.info('Attempting to update organization settings', { organizationId, settingsData });

    // LD1: Call organizationService.updateOrganizationSettings with organization ID and settings data
    const updatedOrganization = await organizationService.updateOrganizationSettings(organizationId, settingsData);

    // LD1: Return success response with the updated organization data
    successResponse(res, updatedOrganization, 'Organization settings updated successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error updating organization settings', { error });
    next(error);
  }
};

/**
 * Adds a user to an organization
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const addUserToOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Extract user ID to add from request body
    const { userId } = req.body;

    // LD1: Log user addition attempt
    logger.info('Attempting to add user to organization', { organizationId, userId });

    // LD1: Call organizationService.addUserToOrganization with organization ID and user ID
    const updatedOrganization = await organizationService.addUserToOrganization(organizationId, userId);

    // LD1: Return success response with the updated organization data
    successResponse(res, updatedOrganization, 'User added to organization successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error adding user to organization', { error });
    next(error);
  }
};

/**
 * Removes a user from an organization
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const removeUserFromOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Extract user ID to remove from request parameters
    const userId: string = req.params.userId;

    // LD1: Log user removal attempt
    logger.info('Attempting to remove user from organization', { organizationId, userId });

    // LD1: Call organizationService.removeUserFromOrganization with organization ID and user ID
    const updatedOrganization = await organizationService.removeUserFromOrganization(organizationId, userId);

    // LD1: Return success response with the updated organization data
    successResponse(res, updatedOrganization, 'User removed from organization successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error removing user from organization', { error });
    next(error);
  }
};

/**
 * Retrieves a summary of an organization with key metrics
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const getOrganizationSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Call organizationService.getOrganizationSummary with the organization ID
    const organizationSummary = await organizationService.getOrganizationSummary(organizationId);

    // LD1: Return success response with the organization summary data
    successResponse(res, organizationSummary, 'Organization summary retrieved successfully');
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error getting organization summary', { error });
    next(error);
  }
};

/**
 * Sends an announcement to all members of an organization
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise<void> Resolves when the response is sent
 */
export const sendOrganizationAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // LD1: Extract organization ID from request parameters
    const organizationId: string = req.params.id;

    // LD1: Extract announcement data from request body
    const announcementData: OrganizationAnnouncementDto = req.body;

    // LD1: Extract user ID from authenticated request
    const userId: string = req.user.id;

    // LD1: Log announcement creation attempt
    logger.info('Attempting to create organization announcement', { organizationId, announcementData, userId });

    // LD1: Call organizationService.createOrganizationAnnouncement with organization ID, announcement data, and user ID
    const success = await organizationService.createOrganizationAnnouncement(organizationId, announcementData, userId);

    // LD1: Return success response with confirmation message
    if (success) {
      successResponse(res, { message: 'Organization announcement sent successfully' }, 'Announcement sent successfully');
    } else {
      errorResponse(res, 'Failed to send organization announcement', null, 500);
    }
  } catch (error) {
    // LD1: Catch any errors and pass to next middleware
    logger.error('Error sending organization announcement', { error });
    next(error);
  }
};