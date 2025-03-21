import { logger } from '../../utils/helpers/logger';
import { organizationRepository } from '../../repositories/organizationRepository';
import { userRepository } from '../../repositories/userRepository';
import { NotificationService } from '../notification/notificationService';
import {
  Organization,
  OrganizationWithRelations,
  OrganizationSummary,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateOrganizationSettingsDto,
  OrganizationResponse,
  OrganizationDetailResponse,
  OrganizationWithUsersResponse,
  OrganizationWithTeamsResponse,
  OrganizationListResponse,
  OrganizationFilters,
  OrganizationAnnouncementDto
} from '../../types/organization.types';
import { UserRole } from '../../utils/constants/roles';
import { NotificationType } from '../../types/notification.types';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors';
import { PaginationParams } from '../../utils/helpers/paginationHelper';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationSettingsSchema,
  organizationFiltersSchema
} from '../../utils/validation/organizationValidation';

/**
 * Service class for organization management operations in the Metronomics Platform
 */
export class OrganizationService {
  private notificationService: NotificationService;

  /**
   * Initializes the organization service with required dependencies
   */
  constructor() {
    this.notificationService = new NotificationService();
    logger.info('OrganizationService initialized');
  }

  /**
   * Retrieves an organization by its ID
   * @param id The organization ID to find
   * @returns The organization if found, null otherwise
   */
  async getOrganization(id: string): Promise<Organization | null> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('Getting organization by ID', { id });
    return organizationRepository.findById(id);
  }

  /**
   * Retrieves an organization by its ID with all users included
   * @param id The organization ID to find
   * @returns The organization with users if found, null otherwise
   */
  async getOrganizationWithUsers(id: string): Promise<OrganizationWithRelations | null> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('Getting organization with users by ID', { id });
    return organizationRepository.findWithUsers(id);
  }

  /**
   * Retrieves an organization by its ID with all teams included
   * @param id The organization ID to find
   * @returns The organization with teams if found, null otherwise
   */
  async getOrganizationWithTeams(id: string): Promise<OrganizationWithRelations | null> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('Getting organization with teams by ID', { id });
    return organizationRepository.findWithTeams(id);
  }

  /**
   * Retrieves an organization by its ID with both users and teams included
   * @param id The organization ID to find
   * @returns The organization with users and teams if found, null otherwise
   */
  async getOrganizationWithUsersAndTeams(id: string): Promise<OrganizationWithRelations | null> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('Getting organization with users and teams by ID', { id });
    return organizationRepository.findWithUsersAndTeams(id);
  }

  /**
   * Retrieves an organization by its name
   * @param name The organization name to find
   * @returns The organization if found, null otherwise
   */
  async getOrganizationByName(name: string): Promise<Organization | null> {
    if (!name) {
      throw ValidationError.requiredField('name');
    }

    logger.debug('Getting organization by name', { name });
    return organizationRepository.findByName(name);
  }

  /**
   * Retrieves organizations that a user belongs to
   * @param userId The user ID to find organizations for
   * @returns List of organizations the user belongs to
   */
  async getOrganizationsByUser(userId: string): Promise<Organization[]> {
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    logger.debug('Getting organizations by user ID', { userId });
    return organizationRepository.findByUserId(userId);
  }

  /**
   * Retrieves organizations that a coach has access to
   * @param coachId The coach ID to find organizations for
   * @returns List of organizations the coach has access to
   */
  async getOrganizationsByCoach(coachId: string): Promise<Organization[]> {
    if (!coachId) {
      throw ValidationError.requiredField('coachId');
    }

    logger.debug('Getting organizations by coach ID', { coachId });
    return organizationRepository.findByCoachId(coachId);
  }

  /**
   * Finds organizations based on provided filters with pagination
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @returns Paginated organizations matching the filters
   */
  async findOrganizations(
    filters: OrganizationFilters,
    pagination: PaginationParams
  ): Promise<OrganizationListResponse> {
    // Validate filters with the schema
    try {
      organizationFiltersSchema.parse(filters);
    } catch (error) {
      logger.error('Invalid organization filters', { filters, error });
      throw ValidationError.fromZodError(error as any);
    }

    logger.debug('Finding organizations with filters', { filters, pagination });
    
    // Get organizations with filters and pagination
    const { data, total } = await organizationRepository.findWithFilters(filters, pagination);
    
    // Format the response
    return this.formatOrganizationListResponse({ data, total }, pagination);
  }

  /**
   * Creates a new organization
   * @param organizationData Data for the new organization
   * @returns The created organization
   */
  async createOrganization(organizationData: CreateOrganizationDto): Promise<Organization> {
    // Validate with schema
    try {
      createOrganizationSchema.parse(organizationData);
    } catch (error) {
      logger.error('Invalid organization data', { organizationData, error });
      throw ValidationError.fromZodError(error as any);
    }

    // Check if organization name is already taken
    const existingOrg = await organizationRepository.findByName(organizationData.name);
    if (existingOrg) {
      throw new ValidationError(`Organization with name '${organizationData.name}' already exists`);
    }

    logger.debug('Creating organization', organizationData);
    
    const organization = await organizationRepository.create(organizationData);
    
    logger.info('Organization created successfully', { 
      orgId: organization.id, 
      name: organization.name 
    });
    
    return organization;
  }

  /**
   * Creates a new organization with an owner user
   * @param organizationData Data for the new organization
   * @param ownerId User ID of the organization owner
   * @returns The created organization
   */
  async createOrganizationWithOwner(
    organizationData: CreateOrganizationDto, 
    ownerId: string
  ): Promise<Organization> {
    // Validate organization data with schema
    try {
      createOrganizationSchema.parse(organizationData);
    } catch (error) {
      logger.error('Invalid organization data', { organizationData, error });
      throw ValidationError.fromZodError(error as any);
    }

    if (!ownerId) {
      throw ValidationError.requiredField('ownerId');
    }

    // Check if organization name is already taken
    const existingOrg = await organizationRepository.findByName(organizationData.name);
    if (existingOrg) {
      throw new ValidationError(`Organization with name '${organizationData.name}' already exists`);
    }

    // Check if user exists
    const user = await userRepository.findById(ownerId);
    if (!user) {
      throw NotFoundError.resourceNotFound('User', ownerId);
    }

    logger.debug('Creating organization with owner', { organizationData, ownerId });
    
    const organization = await organizationRepository.createWithOwner(organizationData, ownerId);
    
    logger.info('Organization created with owner successfully', { 
      orgId: organization.id, 
      name: organization.name,
      ownerId
    });
    
    return organization;
  }

  /**
   * Updates an existing organization's details
   * @param id The organization ID to update
   * @param updateData The data to update
   * @returns The updated organization
   */
  async updateOrganization(
    id: string, 
    updateData: UpdateOrganizationDto
  ): Promise<Organization> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    // Validate update data with schema
    try {
      updateOrganizationSchema.parse(updateData);
    } catch (error) {
      logger.error('Invalid organization update data', { updateData, error });
      throw ValidationError.fromZodError(error as any);
    }

    // Check if organization exists
    const existingOrg = await organizationRepository.findById(id);
    if (!existingOrg) {
      throw NotFoundError.resourceNotFound('Organization', id);
    }

    // If name is being updated, check if it's already taken by another organization
    if (updateData.name && updateData.name !== existingOrg.name) {
      const orgWithSameName = await organizationRepository.findByName(updateData.name);
      if (orgWithSameName && orgWithSameName.id !== id) {
        throw new ValidationError(`Organization with name '${updateData.name}' already exists`);
      }
    }

    logger.debug('Updating organization', { id, updateData });
    
    const updatedOrganization = await organizationRepository.update(id, updateData);
    
    logger.info('Organization updated successfully', { 
      orgId: updatedOrganization.id, 
      name: updatedOrganization.name 
    });
    
    return updatedOrganization;
  }

  /**
   * Updates only the settings of an organization
   * @param id The organization ID to update settings for
   * @param settingsData The settings data to update
   * @returns The updated organization
   */
  async updateOrganizationSettings(
    id: string, 
    settingsData: UpdateOrganizationSettingsDto
  ): Promise<Organization> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    // Validate settings data with schema
    try {
      updateOrganizationSettingsSchema.parse(settingsData);
    } catch (error) {
      logger.error('Invalid organization settings data', { settingsData, error });
      throw ValidationError.fromZodError(error as any);
    }

    // Check if organization exists
    const existingOrg = await organizationRepository.findById(id);
    if (!existingOrg) {
      throw NotFoundError.resourceNotFound('Organization', id);
    }

    logger.debug('Updating organization settings', { id, settingsData });
    
    const updatedOrganization = await organizationRepository.updateSettings(id, settingsData);
    
    logger.info('Organization settings updated successfully', { 
      orgId: updatedOrganization.id
    });
    
    return updatedOrganization;
  }

  /**
   * Deletes an organization
   * @param id The organization ID to delete
   * @returns The deleted organization
   */
  async deleteOrganization(id: string): Promise<Organization> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    // Check if organization exists
    const existingOrg = await organizationRepository.findById(id);
    if (!existingOrg) {
      throw NotFoundError.resourceNotFound('Organization', id);
    }

    logger.debug('Deleting organization', { id });
    
    const deletedOrganization = await organizationRepository.delete(id);
    
    logger.info('Organization deleted successfully', { 
      orgId: deletedOrganization.id, 
      name: deletedOrganization.name 
    });
    
    return deletedOrganization;
  }

  /**
   * Adds a user to an organization
   * @param organizationId The organization ID to add the user to
   * @param userId The user ID to add to the organization
   * @returns The updated organization
   */
  async addUserToOrganization(organizationId: string, userId: string): Promise<Organization> {
    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    // Check if organization exists
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw NotFoundError.resourceNotFound('Organization', organizationId);
    }

    // Check if user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw NotFoundError.resourceNotFound('User', userId);
    }

    logger.debug('Adding user to organization', { organizationId, userId });
    
    const updatedOrganization = await organizationRepository.addUser(organizationId, userId);
    
    // Create a notification for the user about the organization invitation
    await this.notificationService.createNotification({
      type: NotificationType.ORGANIZATION_INVITATION,
      title: `You've been added to ${organization.name}`,
      content: `You have been added to the organization ${organization.name}.`,
      priority: 'MEDIUM',
      userId,
      organizationId,
      channels: ['IN_APP', 'EMAIL']
    });
    
    logger.info('User added to organization successfully', { 
      orgId: updatedOrganization.id, 
      userId 
    });
    
    return updatedOrganization;
  }

  /**
   * Removes a user from an organization
   * @param organizationId The organization ID to remove the user from
   * @param userId The user ID to remove from the organization
   * @returns The updated organization
   */
  async removeUserFromOrganization(organizationId: string, userId: string): Promise<Organization> {
    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    // Check if organization exists
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw NotFoundError.resourceNotFound('Organization', organizationId);
    }

    // Check if user exists and belongs to the organization
    const user = await userRepository.findById(userId);
    if (!user) {
      throw NotFoundError.resourceNotFound('User', userId);
    }

    // Check if user is part of the organization
    const userOrgs = await organizationRepository.findByUserId(userId);
    const isUserInOrg = userOrgs.some(org => org.id === organizationId);
    if (!isUserInOrg) {
      throw new ValidationError(`User does not belong to organization ${organizationId}`);
    }

    logger.debug('Removing user from organization', { organizationId, userId });
    
    const updatedOrganization = await organizationRepository.removeUser(organizationId, userId);
    
    logger.info('User removed from organization successfully', { 
      orgId: updatedOrganization.id, 
      userId 
    });
    
    return updatedOrganization;
  }

  /**
   * Gets a summary of an organization including user and team counts
   * @param id The organization ID to get summary for
   * @returns Organization summary with counts
   */
  async getOrganizationSummary(id: string): Promise<OrganizationSummary> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('Getting organization summary', { id });
    
    return organizationRepository.getOrganizationSummary(id);
  }

  /**
   * Creates an organization-wide announcement
   * @param organizationId The organization ID to create announcement for
   * @param announcementData The announcement data
   * @param createdBy User ID of the announcement creator
   * @returns True if announcement was created successfully
   */
  async createOrganizationAnnouncement(
    organizationId: string,
    announcementData: OrganizationAnnouncementDto,
    createdBy: string
  ): Promise<boolean> {
    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    if (!announcementData || !announcementData.title || !announcementData.content) {
      throw new ValidationError('Announcement requires title and content');
    }

    if (!createdBy) {
      throw ValidationError.requiredField('createdBy');
    }

    // Check if organization exists
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw NotFoundError.resourceNotFound('Organization', organizationId);
    }

    // Get all users in the organization
    const organizationWithUsers = await organizationRepository.findWithUsers(organizationId);
    if (!organizationWithUsers || !organizationWithUsers.users || organizationWithUsers.users.length === 0) {
      logger.warn('No users found in organization for announcement', { organizationId });
      return false;
    }

    logger.debug('Creating organization announcement', { 
      organizationId, 
      title: announcementData.title,
      createdBy
    });

    // Send notification to all users in the organization
    for (const user of organizationWithUsers.users) {
      await this.notificationService.createNotification({
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: announcementData.title,
        content: announcementData.content,
        priority: 'MEDIUM',
        userId: user.id,
        organizationId,
        metadata: { createdBy },
        channels: ['IN_APP', 'EMAIL']
      });
    }

    logger.info('Organization announcement created successfully', { 
      organizationId, 
      title: announcementData.title,
      createdBy,
      recipientCount: organizationWithUsers.users.length
    });

    return true;
  }

  /**
   * Validates if a user has access to an organization based on their role
   * @param organizationId The organization ID to check access for
   * @param userId The user ID to check access for
   * @param requireAdmin Whether to require admin-level access
   * @throws AuthorizationError if user doesn't have required access
   */
  async validateOrganizationAccess(
    organizationId: string, 
    userId: string, 
    requireAdmin: boolean = false
  ): Promise<void> {
    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    // Check if organization exists
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw NotFoundError.resourceNotFound('Organization', organizationId);
    }

    // Get user details including role
    const user = await userRepository.findById(userId);
    if (!user) {
      throw NotFoundError.resourceNotFound('User', userId);
    }

    // Coaches have access to all organizations
    if (user.role === UserRole.COACH) {
      return;
    }

    // Check if user belongs to the organization
    const userOrgs = await organizationRepository.findByUserId(userId);
    const isUserInOrg = userOrgs.some(org => org.id === organizationId);
    
    if (!isUserInOrg) {
      throw AuthorizationError.resourceAccessDenied('Organization', organizationId);
    }

    // If admin access is required, check if user is CEO
    if (requireAdmin && user.role !== UserRole.CEO) {
      throw AuthorizationError.insufficientPermissions('manage organization');
    }
  }

  /**
   * Formats an organization object into a standardized response format
   * @param organization The organization to format
   * @returns Formatted organization response
   */
  formatOrganizationResponse(organization: Organization): OrganizationResponse {
    return {
      id: organization.id,
      name: organization.name,
      settings: organization.settings,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString()
    };
  }

  /**
   * Formats an organization object into a detailed response format with counts
   * @param organization The organization to format
   * @param userCount Count of users in the organization
   * @param teamCount Count of teams in the organization
   * @returns Formatted detailed organization response
   */
  formatOrganizationDetailResponse(
    organization: Organization,
    userCount: number,
    teamCount: number
  ): OrganizationDetailResponse {
    return {
      id: organization.id,
      name: organization.name,
      settings: organization.settings,
      userCount,
      teamCount,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString()
    };
  }

  /**
   * Formats an organization with users into a response format
   * @param organization The organization with users to format
   * @returns Formatted organization with users response
   */
  formatOrganizationWithUsersResponse(
    organization: OrganizationWithRelations
  ): OrganizationWithUsersResponse {
    return {
      id: organization.id,
      name: organization.name,
      settings: organization.settings,
      users: organization.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photoURL: user.photoURL,
        isActive: user.isActive
      })),
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString()
    };
  }

  /**
   * Formats an organization with teams into a response format
   * @param organization The organization with teams to format
   * @returns Formatted organization with teams response
   */
  formatOrganizationWithTeamsResponse(
    organization: OrganizationWithRelations
  ): OrganizationWithTeamsResponse {
    return {
      id: organization.id,
      name: organization.name,
      settings: organization.settings,
      teams: organization.teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: 0 // This would need to be calculated or provided
      })),
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString()
    };
  }

  /**
   * Formats a list of organizations into a paginated response format
   * @param organizationsData The organization data with pagination info
   * @param pagination The pagination parameters
   * @returns Formatted paginated organization list response
   */
  formatOrganizationListResponse(
    organizationsData: { data: Organization[]; total: number },
    pagination: PaginationParams
  ): OrganizationListResponse {
    return {
      organizations: organizationsData.data.map(org => this.formatOrganizationResponse(org)),
      total: organizationsData.total,
      page: pagination.page,
      limit: pagination.limit
    };
  }
}

// Create a singleton instance of OrganizationService
export const organizationService = new OrganizationService();