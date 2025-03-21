import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { User, UserWithRelations, UserFilters, UserStatus } from '../types/user.types';
import { UserRole } from '../utils/constants/roles';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/helpers/logger';
import { prisma } from '../config/database';

/**
 * Repository class for user data access operations in the Metronomics Platform
 */
export class UserRepository extends BaseRepository<User> {
  /**
   * Initializes the user repository with the User model
   */
  constructor() {
    super('user');
  }

  /**
   * Finds a user by their email address
   * @param email The email to search for
   * @returns The user if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      if (!email || typeof email !== 'string') {
        throw ValidationError.requiredField('email');
      }

      logger.debug('UserRepository.findByEmail', { email });
      
      const user = await this.model.findUnique({
        where: { email }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.findByEmail', { email, error });
      throw error;
    }
  }

  /**
   * Finds a user by their authentication provider ID
   * @param authId The authentication ID to search for
   * @returns The user if found, null otherwise
   */
  async findByAuthId(authId: string): Promise<User | null> {
    try {
      if (!authId || typeof authId !== 'string') {
        throw ValidationError.requiredField('authId');
      }

      logger.debug('UserRepository.findByAuthId', { authId });
      
      const user = await this.model.findUnique({
        where: { authId }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.findByAuthId', { authId, error });
      throw error;
    }
  }

  /**
   * Finds users belonging to a specific organization
   * @param organizationId The organization ID to filter by
   * @param pagination Pagination parameters for the query
   * @param options Additional query options (e.g., includes, sorting)
   * @returns Users and total count
   */
  async findByOrganization(
    organizationId: string,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: User[]; total: number }> {
    try {
      if (!organizationId || typeof organizationId !== 'string') {
        throw ValidationError.requiredField('organizationId');
      }

      logger.debug('UserRepository.findByOrganization', { organizationId, pagination });
      
      const where = { organizationId };
      const paginationParams = this.buildPagination(pagination);
      const include = this.buildInclude(options);
      const orderBy = this.buildOrderBy(options);
      
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          ...paginationParams,
          ...(orderBy && { orderBy }),
          ...include
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error('Error in UserRepository.findByOrganization', { organizationId, error });
      throw error;
    }
  }

  /**
   * Finds users with a specific role
   * @param role The role to filter by
   * @param organizationId Optional organization ID to further filter the results
   * @param pagination Pagination parameters for the query
   * @param options Additional query options (e.g., includes, sorting)
   * @returns Users and total count
   */
  async findByRole(
    role: UserRole,
    organizationId: string,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: User[]; total: number }> {
    try {
      if (!role || !Object.values(UserRole).includes(role)) {
        throw ValidationError.requiredField('role');
      }

      const where: Record<string, any> = { role };
      
      if (organizationId) {
        where.organizationId = organizationId;
      }
      
      logger.debug('UserRepository.findByRole', { role, organizationId, pagination });
      
      const paginationParams = this.buildPagination(pagination);
      const include = this.buildInclude(options);
      const orderBy = this.buildOrderBy(options);
      
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          ...paginationParams,
          ...(orderBy && { orderBy }),
          ...include
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error('Error in UserRepository.findByRole', { role, organizationId, error });
      throw error;
    }
  }

  /**
   * Finds users who are members of a specific team
   * @param teamId The team ID to filter by
   * @param pagination Pagination parameters for the query
   * @param options Additional query options (e.g., includes, sorting)
   * @returns Users and total count
   */
  async findByTeam(
    teamId: string,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: User[]; total: number }> {
    try {
      if (!teamId || typeof teamId !== 'string') {
        throw ValidationError.requiredField('teamId');
      }

      logger.debug('UserRepository.findByTeam', { teamId, pagination });
      
      const where = {
        teamMembers: {
          some: {
            teamId
          }
        }
      };
      
      const paginationParams = this.buildPagination(pagination);
      const include = this.buildInclude(options);
      const orderBy = this.buildOrderBy(options);
      
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          ...paginationParams,
          ...(orderBy && { orderBy }),
          ...include
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error('Error in UserRepository.findByTeam', { teamId, error });
      throw error;
    }
  }

  /**
   * Finds users based on a combination of filters
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters for the query
   * @param options Additional query options (e.g., includes, sorting)
   * @returns Users and total count
   */
  async findWithFilters(
    filters: UserFilters,
    pagination: PaginationParams,
    options: object = {}
  ): Promise<{ data: User[]; total: number }> {
    try {
      const where: Record<string, any> = {};
      
      // Apply filters if they exist and are not empty
      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }
      
      if (filters.role) {
        where.role = filters.role;
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      if (filters.teamId) {
        where.teamMembers = {
          some: {
            teamId: filters.teamId
          }
        };
      }
      
      // Handle search filter (search across name and email)
      if (filters.search && typeof filters.search === 'string' && filters.search.trim() !== '') {
        const searchTerm = filters.search.trim();
        where.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ];
      }
      
      logger.debug('UserRepository.findWithFilters', { filters, where, pagination });
      
      const paginationParams = this.buildPagination(pagination);
      const include = this.buildInclude(options);
      const orderBy = this.buildOrderBy(options);
      
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          ...paginationParams,
          ...(orderBy && { orderBy }),
          ...include
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error('Error in UserRepository.findWithFilters', { filters, error });
      throw error;
    }
  }

  /**
   * Updates a user's last login timestamp
   * @param id User ID
   * @returns The updated user
   */
  async updateLastLogin(id: string): Promise<User> {
    try {
      this.validateId(id);

      logger.debug('UserRepository.updateLastLogin', { id });
      
      const user = await this.model.update({
        where: { id },
        data: {
          lastLoginAt: new Date()
        }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.updateLastLogin', { id, error });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound('User', id);
      }
      
      throw error;
    }
  }

  /**
   * Updates a user's email address
   * @param id User ID
   * @param email New email address
   * @returns The updated user
   */
  async updateEmail(id: string, email: string): Promise<User> {
    try {
      this.validateId(id);
      
      if (!email || typeof email !== 'string') {
        throw ValidationError.requiredField('email');
      }
      
      // Check if email is already in use by another user
      const existingUser = await this.findByEmail(email);
      if (existingUser && existingUser.id !== id) {
        throw ValidationError.invalidFormat('email', 'Email is already in use');
      }

      logger.debug('UserRepository.updateEmail', { id, email });
      
      const user = await this.model.update({
        where: { id },
        data: { email }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.updateEmail', { id, email, error });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound('User', id);
      }
      
      throw error;
    }
  }

  /**
   * Updates a user's role
   * @param id User ID
   * @param role New role
   * @returns The updated user
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    try {
      this.validateId(id);
      
      if (!role || !Object.values(UserRole).includes(role)) {
        throw ValidationError.requiredField('role');
      }

      logger.debug('UserRepository.updateRole', { id, role });
      
      const user = await this.model.update({
        where: { id },
        data: { role }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.updateRole', { id, role, error });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound('User', id);
      }
      
      throw error;
    }
  }

  /**
   * Updates a user's organization
   * @param id User ID
   * @param organizationId New organization ID
   * @returns The updated user
   */
  async updateOrganization(id: string, organizationId: string): Promise<User> {
    try {
      this.validateId(id);
      
      if (!organizationId || typeof organizationId !== 'string') {
        throw ValidationError.requiredField('organizationId');
      }

      logger.debug('UserRepository.updateOrganization', { id, organizationId });
      
      const user = await this.model.update({
        where: { id },
        data: { organizationId }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.updateOrganization', { id, organizationId, error });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound('User', id);
      }
      
      throw error;
    }
  }

  /**
   * Removes a user from their current organization
   * @param id User ID
   * @returns The updated user
   */
  async removeFromOrganization(id: string): Promise<User> {
    try {
      this.validateId(id);

      logger.debug('UserRepository.removeFromOrganization', { id });
      
      const user = await this.model.update({
        where: { id },
        data: { organizationId: null }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.removeFromOrganization', { id, error });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound('User', id);
      }
      
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
      this.validateId(id);

      logger.debug('UserRepository.deactivateUser', { id });
      
      const user = await this.model.update({
        where: { id },
        data: { isActive: false }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.deactivateUser', { id, error });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound('User', id);
      }
      
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
      this.validateId(id);

      logger.debug('UserRepository.activateUser', { id });
      
      const user = await this.model.update({
        where: { id },
        data: { isActive: true }
      });
      
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.activateUser', { id, error });
      
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound('User', id);
      }
      
      throw error;
    }
  }

  /**
   * Counts users in a specific organization
   * @param organizationId Organization ID
   * @returns The count of users in the organization
   */
  async countByOrganization(organizationId: string): Promise<number> {
    try {
      if (!organizationId || typeof organizationId !== 'string') {
        throw ValidationError.requiredField('organizationId');
      }

      logger.debug('UserRepository.countByOrganization', { organizationId });
      
      const count = await this.model.count({
        where: { organizationId }
      });
      
      return count;
    } catch (error) {
      logger.error('Error in UserRepository.countByOrganization', { organizationId, error });
      throw error;
    }
  }

  /**
   * Counts users with a specific role
   * @param role The role to count
   * @param organizationId Optional organization ID to filter by
   * @returns The count of users with the role
   */
  async countByRole(role: UserRole, organizationId?: string): Promise<number> {
    try {
      if (!role || !Object.values(UserRole).includes(role)) {
        throw ValidationError.requiredField('role');
      }

      const where: Record<string, any> = { role };
      
      if (organizationId) {
        where.organizationId = organizationId;
      }
      
      logger.debug('UserRepository.countByRole', { role, organizationId });
      
      const count = await this.model.count({ where });
      
      return count;
    } catch (error) {
      logger.error('Error in UserRepository.countByRole', { role, organizationId, error });
      throw error;
    }
  }
}

// Create a singleton instance of the repository
export const userRepository = new UserRepository();