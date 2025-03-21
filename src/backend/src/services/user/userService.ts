import { UserRole, ROLE_HIERARCHY, getRoleDisplayName } from '../../utils/constants/roles';
import { Permission, DEFAULT_PERMISSIONS } from '../../utils/constants/permissions';
import { AuthorizationError } from '../../utils/errors/AuthorizationError';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { userRepository } from '../../repositories/userRepository';
import { teamMemberRepository } from '../../repositories/teamMemberRepository';
import { organizationRepository } from '../../repositories/organizationRepository';
import { logger } from '../../utils/helpers/logger';
import {
  User,
  UserWithRelations,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserEmailDto,
  UpdateUserPreferencesDto,
  UserInviteDto,
  UserResponse,
  UserDetailResponse,
  UserProfileResponse,
  UserListResponse,
  UserFilters,
  UserStatus
} from '../../types/user.types';
import { NotificationService } from '../notification/notificationService';
import { NotificationType } from '../../types/notification.types';
import { PaginationParams } from '../../utils/helpers/paginationHelper';
import { createUserSchema, updateUserSchema, updateUserEmailSchema, updateUserPreferencesSchema, userInviteSchema, userFiltersSchema } from '../../utils/validation/userValidation';

/**
 * Service class for user management operations in the Metronomics Platform
 */
class UserService {
  private notificationService: NotificationService;

  /**
   * Initializes the user service with required dependencies
   */
  constructor() {
    this.notificationService = new NotificationService();
    logger.info('UserService initialized');
  }

  /**
   * Retrieves a user by their ID
   * @param id User ID
   * @returns The user if found, null otherwise
   */
  async getUser(id: string): Promise<User | null> {
    try {
      if (!id || typeof id !== 'string') {
        throw ValidationError.requiredField('id');
      }

      logger.debug('UserService.getUser', { id });
      const user = await userRepository.findById(id);
      return user;
    } catch (error) {
      logger.error('Error in UserService.getUser', { id, error });
      throw error;
    }
  }

  /**
   * Retrieves a user by their ID or throws an error if not found
   * @param id User ID
   * @returns The user if found
   */
  async getUserOrThrow(id: string): Promise<User> {
    try {
      if (!id || typeof id !== 'string') {
        throw ValidationError.requiredField('id');
      }

      logger.debug('UserService.getUserOrThrow', { id });
      const user = await userRepository.findById(id);
      if (!user) {
        throw NotFoundError.resourceNotFound('User', id);
      }
      return user;
    } catch (error) {
      logger.error('Error in UserService.getUserOrThrow', { id, error });
      throw error;
    }
  }

  /**
   * Retrieves a user by their email address
   * @param email User email
   * @returns The user if found, null otherwise
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      if (!email || typeof email !== 'string') {
        throw ValidationError.requiredField('email');
      }

      logger.debug('UserService.getUserByEmail', { email });
      const user = await userRepository.findByEmail(email);
      return user;
    } catch (error) {
      logger.error('Error in UserService.getUserByEmail', { email, error });
      throw error;
    }
  }

  /**
   * Retrieves a user by their authentication provider ID
   * @param authId Authentication provider ID
   * @returns The user if found, null otherwise
   */
  async getUserByAuthId(authId: string): Promise<User | null> {
    try {
      if (!authId || typeof authId !== 'string') {
        throw ValidationError.requiredField('authId');
      }

      logger.debug('UserService.getUserByAuthId', { authId });
      const user = await userRepository.findByAuthId(authId);
      return user;
    } catch (error) {
      logger.error('Error in UserService.getUserByAuthId', { authId, error });
      throw error;
    }
  }

  /**
   * Retrieves a user with their team memberships
   * @param id User ID
   * @returns The user with teams if found, null otherwise
   */
  async getUserWithTeams(id: string): Promise<UserWithRelations | null> {
    try {
      if (!id || typeof id !== 'string') {
        throw ValidationError.requiredField('id');
      }

      logger.debug('UserService.getUserWithTeams', { id });
      const user = await userRepository.findById(id);
      if (!user) {
        return null;
      }

      const teams = await teamMemberRepository.findByUserId(id);

      const userWithTeams: UserWithRelations = {
        ...user,
        teams: teams.map(teamMember => ({
          id: teamMember.teamId,
          name: 'Team Name Placeholder' // Replace with actual team name retrieval
        })),
        organization: null // Replace with actual organization retrieval
      };

      return userWithTeams;
    } catch (error) {
      logger.error('Error in UserService.getUserWithTeams', { id, error });
      throw error;
    }
  }

  /**
   * Retrieves users belonging to a specific organization
   * @param organizationId Organization ID
   * @param pagination Pagination parameters
   * @param options Additional query options
   * @returns Users and total count
   */
  async getUsersByOrganization(
    organizationId: string,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: User[]; total: number }> {
    try {
      if (!organizationId || typeof organizationId !== 'string') {
        throw ValidationError.requiredField('organizationId');
      }

      logger.debug('UserService.getUsersByOrganization', { organizationId, pagination });
      return await userRepository.findByOrganization(organizationId, pagination, options);
    } catch (error) {
      logger.error('Error in UserService.getUsersByOrganization', { organizationId, error });
      throw error;
    }
  }

  /**
   * Retrieves users with a specific role
   * @param role User role
   * @param organizationId Organization ID
   * @param pagination Pagination parameters
   * @param options Additional query options
   * @returns Users and total count
   */
  async getUsersByRole(
    role: UserRole,
    organizationId: string,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: User[]; total: number }> {
    try {
      if (!role || !Object.values(UserRole).includes(role)) {
        throw ValidationError.requiredField('role');
      }

      logger.debug('UserService.getUsersByRole', { role, organizationId, pagination });
      return await userRepository.findByRole(role, organizationId, pagination, options);
    } catch (error) {
      logger.error('Error in UserService.getUsersByRole', { role, organizationId, error });
      throw error;
    }
  }

  /**
   * Retrieves users who are members of a specific team
   * @param teamId Team ID
   * @param pagination Pagination parameters
   * @param options Additional query options
   * @returns Users and total count
   */
  async getUsersByTeam(
    teamId: string,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: User[]; total: number }> {
    try {
      if (!teamId || typeof teamId !== 'string') {
        throw ValidationError.requiredField('teamId');
      }

      logger.debug('UserService.getUsersByTeam', { teamId, pagination });
      return await userRepository.findByTeam(teamId, pagination, options);
    } catch (error) {
      logger.error('Error in UserService.getUsersByTeam', { teamId, error });
      throw error;
    }
  }

  /**
   * Finds users based on a combination of filters
   * @param filters User filters
   * @param pagination Pagination parameters
   * @param options Additional query options
   * @returns Users and total count
   */
  async findUsersWithFilters(
    filters: UserFilters,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: User[]; total: number }> {
    try {
      const validatedFilters = userFiltersSchema.parse(filters);

      logger.debug('UserService.findUsersWithFilters', { filters, pagination });
      return await userRepository.findWithFilters(validatedFilters, pagination, options);
    } catch (error) {
      logger.error('Error in UserService.findUsersWithFilters', { filters, error });
      throw error;
    }
  }

  /**
   * Creates a new user
   * @param userData User data
   * @returns The created user
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      const validatedUserData = createUserSchema.parse(userData);

      logger.debug('UserService.createUser', { userData });

      const existingUser = await userRepository.findByEmail(validatedUserData.email);
      if (existingUser) {
        throw ValidationError.invalidFormat('email', 'Email is already in use');
      }

      if (validatedUserData.organizationId) {
        const organization = await organizationRepository.findById(validatedUserData.organizationId);
        if (!organization) {
          throw new NotFoundError('Organization not found', { organizationId: validatedUserData.organizationId });
        }
      }

      const user = await userRepository.create(validatedUserData);
      logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('Error in UserService.createUser', { userData, error });
      throw error;
    }
  }

  /**
   * Updates an existing user's details
   * @param id User ID
   * @param updateData Updated user data
   * @param currentUserId ID of the user performing the update
   * @returns The updated user
   */
  async updateUser(id: string, updateData: UpdateUserDto, currentUserId: string): Promise<User> {
    try {
      const validatedUpdateData = updateUserSchema.parse(updateData);

      logger.debug('UserService.updateUser', { id, updateData });

      const user = await userRepository.findById(id);
      if (!user) {
        throw NotFoundError.resourceNotFound('User', id);
      }

      if (updateData.role && user.role !== updateData.role) {
        await this.validateRoleManagement(user.role, updateData.role);
      }

      const updatedUser = await userRepository.update(id, validatedUpdateData);

      if (updateData.role && user.role !== updateData.role) {
        await this.notificationService.createNotification({
          userId: id,
          organizationId: user.organizationId,
          type: NotificationType.ROLE_CHANGE,
          title: 'Role Changed',
          content: `Your role has been changed to ${getRoleDisplayName(updateData.role)}`,
          priority: 'MEDIUM'
        });
      }

      logger.info('User updated successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.updateUser', { id, updateData, error });
      throw error;
    }
  }

  /**
   * Updates a user's email address
   * @param id User ID
   * @param updateData Updated email data
   * @returns The updated user
   */
  async updateUserEmail(id: string, updateData: UpdateUserEmailDto): Promise<User> {
    try {
      const validatedUpdateData = updateUserEmailSchema.parse(updateData);

      logger.debug('UserService.updateUserEmail', { id, updateData });

      const user = await userRepository.findById(id);
      if (!user) {
        throw NotFoundError.resourceNotFound('User', id);
      }

      const updatedUser = await userRepository.updateEmail(id, validatedUpdateData.email);
      logger.info('User email updated successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.updateUserEmail', { id, updateData, error });
      throw error;
    }
  }

  /**
   * Updates a user's role
   * @param id User ID
   * @param role New role
   * @param currentUserId ID of the user performing the update
   * @returns The updated user
   */
  async updateUserRole(id: string, role: UserRole, currentUserId: string): Promise<User> {
    try {
      logger.debug('UserService.updateUserRole', { id, role, currentUserId });
      const updatedUser = await userRepository.updateRole(id, role);
      logger.info('User role updated successfully', { userId: id, role });
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.updateUserRole', { id, role, error });
      throw error;
    }
  }

  /**
   * Updates a user's organization
   * @param id User ID
   * @param organizationId New organization ID
   * @returns The updated user
   */
  async updateUserOrganization(id: string, organizationId: string): Promise<User> {
    try {
      logger.debug('UserService.updateUserOrganization', { id, organizationId });
      const updatedUser = await userRepository.updateOrganization(id, organizationId);
      logger.info('User organization updated successfully', { userId: id, organizationId });
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.updateUserOrganization', { id, organizationId, error });
      throw error;
    }
  }

  /**
   * Removes a user from their current organization
   * @param id User ID
   * @returns The updated user
   */
  async removeUserFromOrganization(id: string): Promise<User> {
    try {
      logger.debug('UserService.removeUserFromOrganization', { id });
      const updatedUser = await userRepository.removeFromOrganization(id);
      logger.info('User removed from organization successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.removeUserFromOrganization', { id, error });
      throw error;
    }
  }

  /**
   * Updates a user's preferences
   * @param id User ID
   * @param preferencesData Updated preferences data
   * @returns The updated user
   */
  async updateUserPreferences(id: string, preferencesData: UpdateUserPreferencesDto): Promise<User> {
    try {
      const validatedPreferencesData = updateUserPreferencesSchema.parse(preferencesData);

      logger.debug('UserService.updateUserPreferences', { id, preferencesData });
      const updatedUser = await userRepository.updatePreferences(id, validatedPreferencesData.preferences);
      logger.info('User preferences updated successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.updateUserPreferences', { id, preferencesData, error });
      throw error;
    }
  }

  /**
   * Activates a user account
   * @param id User ID
   * @returns The updated user
   */
  async activateUser(id: string): Promise<User> {
    try {
      logger.debug('UserService.activateUser', { id });
      const updatedUser = await userRepository.activateUser(id);
      logger.info('User activated successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.activateUser', { id, error });
      throw error;
    }
  }

  /**
   * Deactivates a user account
   * @param id User ID
   * @returns The updated user
   */
  async deactivateUser(id: string): Promise<User> {
    try {
      logger.debug('UserService.deactivateUser', { id });
      const updatedUser = await userRepository.deactivateUser(id);
      logger.info('User deactivated successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      logger.error('Error in UserService.deactivateUser', { id, error });
      throw error;
    }
  }

  /**
   * Invites a new user to the platform
   * @param inviteData User invite data
   * @param invitedBy User ID of the inviter
   * @returns The created user
   */
  async inviteUser(inviteData: UserInviteDto, invitedBy: string): Promise<User> {
    try {
      const validatedInviteData = userInviteSchema.parse(inviteData);

      logger.debug('UserService.inviteUser', { inviteData, invitedBy });

      const existingUser = await userRepository.findByEmail(validatedInviteData.email);
      if (existingUser) {
        throw ValidationError.invalidFormat('email', 'Email is already in use');
      }

      const organization = await organizationRepository.findById(validatedInviteData.organizationId);
      if (!organization) {
        throw new NotFoundError('Organization not found', { organizationId: inviteData.organizationId });
      }

      const user = await userRepository.create({
        ...validatedInviteData,
        authId: 'pending',
        authProvider: 'EMAIL_PASSWORD',
        photoURL: null,
        status: UserStatus.PENDING
      });

      // TODO: Add user to teams if teamIds are provided

      await this.notificationService.createNotification({
        userId: user.id,
        organizationId: inviteData.organizationId,
        type: NotificationType.USER_INVITATION,
        title: 'Invitation to Metronomics',
        content: `You have been invited to join ${organization.name} on Metronomics`,
        priority: 'MEDIUM'
      });

      logger.info('User invited successfully', { userId: user.id, invitedBy });
      return user;
    } catch (error) {
      logger.error('Error in UserService.inviteUser', { inviteData, invitedBy, error });
      throw error;
    }
  }

  /**
   * Validates if a user has access to another user's data based on their role
   * @param targetUserId ID of the user being accessed
   * @param currentUserId ID of the user attempting to access
   * @param requireSameOrg Whether the users must belong to the same organization
   */
  async validateUserAccess(targetUserId: string, currentUserId: string, requireSameOrg: boolean): Promise<void> {
    try {
      if (!targetUserId || typeof targetUserId !== 'string') {
        throw ValidationError.requiredField('targetUserId');
      }

      if (!currentUserId || typeof currentUserId !== 'string') {
        throw ValidationError.requiredField('currentUserId');
      }

      if (targetUserId === currentUserId) {
        return; // Allow access to self
      }

      const [targetUser, currentUser] = await Promise.all([
        userRepository.findById(targetUserId),
        userRepository.findById(currentUserId)
      ]);

      if (!targetUser) {
        throw NotFoundError.resourceNotFound('Target User', targetUserId);
      }

      if (!currentUser) {
        throw NotFoundError.resourceNotFound('Current User', currentUserId);
      }

      if (currentUser.role === UserRole.COACH) {
        return; // Coaches have access to all users
      }

      if (requireSameOrg && currentUser.organizationId !== targetUser.organizationId) {
        throw new AuthorizationError('Users must belong to the same organization');
      }

      if (!roleService.canManageRole(currentUser.role, targetUser.role)) {
        throw new AuthorizationError('Current user cannot manage target user');
      }
    } catch (error) {
      logger.error('Error in UserService.validateUserAccess', { targetUserId, currentUserId, requireSameOrg, error });
      throw error;
    }
  }

  /**
   * Formats a user object into a standardized response format
   * @param user User object
   * @returns Formatted user response
   */
  formatUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      photoURL: user.photoURL,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  /**
   * Formats a user object into a detailed response format with relations
   * @param user User object with relations
   * @returns Formatted detailed user response
   */
  formatUserDetailResponse(user: UserWithRelations): UserDetailResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      role: user.role,
      status: user.status,
      organization: user.organization ? { id: user.organization.id, name: user.organization.name } : null,
      teams: user.teams.map(team => ({ id: team.id, name: 'Team Name Placeholder' })), // Replace with actual team name retrieval
      photoURL: user.photoURL,
      authProvider: user.authProvider,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  /**
   * Formats a user object into a profile response format
   * @param user User object with relations
   * @returns Formatted user profile response
   */
  formatUserProfileResponse(user: UserWithRelations): UserProfileResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      role: user.role,
      organization: user.organization ? { id: user.organization.id, name: user.organization.name } : null,
      photoURL: user.photoURL,
      preferences: user.preferences,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null
    };
  }

  /**
   * Formats a list of users into a paginated response format
   * @param usersData Users data with total count
   * @param pagination Pagination parameters
   * @returns Formatted paginated user list response
   */
  formatUserListResponse(
    usersData: { data: User[]; total: number },
    pagination: PaginationParams
  ): UserListResponse {
    return {
      users: usersData.data.map(this.formatUserResponse),
      total: usersData.total,
      page: pagination.page,
      limit: pagination.limit
    };
  }
}

// Create a singleton instance of the service
export const userService = new UserService();