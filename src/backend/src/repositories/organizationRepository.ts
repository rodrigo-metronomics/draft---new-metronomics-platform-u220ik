import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { logger } from '../utils/helpers/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { 
  Organization, 
  OrganizationWithRelations,
  OrganizationSummary,
  OrganizationFilters 
} from '../types/organization.types';
import { UserRole } from '../utils/constants/roles';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { Prisma } from '@prisma/client'; // ^4.15.0

/**
 * Repository class for organization-related database operations.
 * Extends the BaseRepository to provide organization-specific data access methods,
 * supporting the multi-tenant architecture of the Metronomics Platform.
 */
export class OrganizationRepository extends BaseRepository<Organization> {
  /**
   * Creates a new OrganizationRepository instance.
   */
  constructor() {
    super('organization');
  }

  /**
   * Finds an organization by its name
   * @param name Organization name to search for
   * @returns The found organization or null if not found
   */
  async findByName(name: string): Promise<Organization | null> {
    try {
      if (!name) {
        throw ValidationError.requiredField('name');
      }
      
      logger.debug('OrganizationRepository.findByName', { name });
      
      const organization = await this.model.findFirst({
        where: { name }
      });
      
      return organization;
    } catch (error) {
      logger.error('Error in OrganizationRepository.findByName', { name, error });
      throw error;
    }
  }

  /**
   * Finds an organization by ID with its users included
   * @param id Organization ID to find
   * @returns The organization with users or null if not found
   */
  async findWithUsers(id: string): Promise<OrganizationWithRelations | null> {
    try {
      this.validateId(id);
      
      logger.debug('OrganizationRepository.findWithUsers', { id });
      
      const organization = await this.model.findUnique({
        where: { id },
        include: { users: true }
      });
      
      return organization;
    } catch (error) {
      logger.error('Error in OrganizationRepository.findWithUsers', { id, error });
      throw error;
    }
  }

  /**
   * Finds an organization by ID with its teams included
   * @param id Organization ID to find
   * @returns The organization with teams or null if not found
   */
  async findWithTeams(id: string): Promise<OrganizationWithRelations | null> {
    try {
      this.validateId(id);
      
      logger.debug('OrganizationRepository.findWithTeams', { id });
      
      const organization = await this.model.findUnique({
        where: { id },
        include: { teams: true }
      });
      
      return organization;
    } catch (error) {
      logger.error('Error in OrganizationRepository.findWithTeams', { id, error });
      throw error;
    }
  }

  /**
   * Finds an organization by ID with both users and teams included
   * @param id Organization ID to find
   * @returns The organization with users and teams or null if not found
   */
  async findWithUsersAndTeams(id: string): Promise<OrganizationWithRelations | null> {
    try {
      this.validateId(id);
      
      logger.debug('OrganizationRepository.findWithUsersAndTeams', { id });
      
      const organization = await this.model.findUnique({
        where: { id },
        include: { 
          users: true,
          teams: true
        }
      });
      
      return organization;
    } catch (error) {
      logger.error('Error in OrganizationRepository.findWithUsersAndTeams', { id, error });
      throw error;
    }
  }

  /**
   * Finds organizations that a user belongs to
   * @param userId User ID to find organizations for
   * @returns List of organizations the user belongs to
   */
  async findByUserId(userId: string): Promise<Organization[]> {
    try {
      this.validateId(userId);
      
      logger.debug('OrganizationRepository.findByUserId', { userId });
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizationId: true }
      });
      
      if (!user || !user.organizationId) {
        return [];
      }
      
      const organization = await this.model.findUnique({
        where: { id: user.organizationId }
      });
      
      return organization ? [organization] : [];
    } catch (error) {
      logger.error('Error in OrganizationRepository.findByUserId', { userId, error });
      throw error;
    }
  }

  /**
   * Finds organizations that a coach has access to
   * @param coachId Coach user ID to find organizations for
   * @returns List of organizations the coach has access to
   */
  async findByCoachId(coachId: string): Promise<Organization[]> {
    try {
      this.validateId(coachId);
      
      logger.debug('OrganizationRepository.findByCoachId', { coachId });
      
      // Find the coach user to verify role
      const coach = await prisma.user.findUnique({
        where: { id: coachId },
        select: { role: true }
      });
      
      if (!coach) {
        throw NotFoundError.resourceNotFound('User', coachId);
      }
      
      if (coach.role !== UserRole.COACH) {
        // Not a coach, return empty array
        return [];
      }
      
      // For a coach, we'll return all organizations
      // In a real implementation, this would likely involve a coach_organization
      // relationship table to determine which organizations a coach has access to
      const organizations = await this.model.findMany();
      
      return organizations;
    } catch (error) {
      logger.error('Error in OrganizationRepository.findByCoachId', { coachId, error });
      throw error;
    }
  }

  /**
   * Finds organizations based on provided filters with pagination
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @returns Paginated list of organizations matching the filters
   */
  async findWithFilters(
    filters: OrganizationFilters,
    pagination: PaginationParams
  ): Promise<{ data: Organization[]; total: number }> {
    try {
      logger.debug('OrganizationRepository.findWithFilters', { filters, pagination });
      
      // Build where clause based on filters
      const where: Prisma.OrganizationWhereInput = {};
      
      if (filters.userId) {
        // Find organizations where this user is a member
        const user = await prisma.user.findUnique({
          where: { id: filters.userId },
          select: { organizationId: true }
        });
        
        if (user?.organizationId) {
          where.id = user.organizationId;
        } else {
          // User doesn't belong to any organization
          return { data: [], total: 0 };
        }
      }
      
      if (filters.coachId) {
        // For a coach, we'll return all organizations
        // We first check if the user is actually a coach
        const coach = await prisma.user.findUnique({
          where: { id: filters.coachId },
          select: { role: true }
        });
        
        if (!coach || coach.role !== UserRole.COACH) {
          // Not a coach, return empty results
          return { data: [], total: 0 };
        }
        
        // For coaches, no additional filters needed as they can see all organizations
      }
      
      if (filters.search) {
        where.name = {
          contains: filters.search,
          mode: 'insensitive'
        };
      }
      
      // Get paginated results
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          skip: pagination.offset,
          take: pagination.limit,
          orderBy: { name: 'asc' }
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error('Error in OrganizationRepository.findWithFilters', { filters, error });
      throw error;
    }
  }

  /**
   * Creates a new organization with an owner user
   * @param data Organization data
   * @param ownerId User ID of the organization owner
   * @returns The created organization
   */
  async createWithOwner(data: Record<string, any>, ownerId: string): Promise<Organization> {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw ValidationError.requiredField('data');
      }
      
      if (!ownerId) {
        throw ValidationError.requiredField('ownerId');
      }
      
      logger.debug('OrganizationRepository.createWithOwner', { data, ownerId });
      
      // Create organization and update owner in a transaction
      const organization = await prisma.$transaction(async (tx) => {
        // Create the organization
        const newOrganization = await tx.organization.create({
          data
        });
        
        // Update the owner user with the new organization ID
        await tx.user.update({
          where: { id: ownerId },
          data: { 
            organizationId: newOrganization.id,
            role: UserRole.CEO
          }
        });
        
        return newOrganization;
      });
      
      return organization;
    } catch (error) {
      logger.error('Error in OrganizationRepository.createWithOwner', { data, ownerId, error });
      throw error;
    }
  }

  /**
   * Adds a user to an organization
   * @param organizationId Organization ID to add the user to
   * @param userId User ID to add to the organization
   * @returns The updated organization
   */
  async addUser(organizationId: string, userId: string): Promise<Organization> {
    try {
      this.validateId(organizationId);
      this.validateId(userId);
      
      logger.debug('OrganizationRepository.addUser', { organizationId, userId });
      
      // Check if organization exists
      const organization = await this.model.findUnique({
        where: { id: organizationId }
      });
      
      if (!organization) {
        throw NotFoundError.resourceNotFound('Organization', organizationId);
      }
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw NotFoundError.resourceNotFound('User', userId);
      }
      
      // Update user with organization ID
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId }
      });
      
      return organization;
    } catch (error) {
      logger.error('Error in OrganizationRepository.addUser', { organizationId, userId, error });
      throw error;
    }
  }

  /**
   * Removes a user from an organization
   * @param organizationId Organization ID to remove the user from
   * @param userId User ID to remove from the organization
   * @returns The updated organization
   */
  async removeUser(organizationId: string, userId: string): Promise<Organization> {
    try {
      this.validateId(organizationId);
      this.validateId(userId);
      
      logger.debug('OrganizationRepository.removeUser', { organizationId, userId });
      
      // Check if organization exists
      const organization = await this.model.findUnique({
        where: { id: organizationId }
      });
      
      if (!organization) {
        throw NotFoundError.resourceNotFound('Organization', organizationId);
      }
      
      // Check if user exists and belongs to this organization
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw NotFoundError.resourceNotFound('User', userId);
      }
      
      if (user.organizationId !== organizationId) {
        throw ValidationError.invalidFormat('userId', `User does not belong to organization ${organizationId}`);
      }
      
      // Update user to remove organization ID
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: null }
      });
      
      return organization;
    } catch (error) {
      logger.error('Error in OrganizationRepository.removeUser', { organizationId, userId, error });
      throw error;
    }
  }

  /**
   * Updates only the settings of an organization
   * @param id Organization ID to update
   * @param settings New settings object
   * @returns The updated organization
   */
  async updateSettings(id: string, settings: Record<string, any>): Promise<Organization> {
    try {
      this.validateId(id);
      
      if (!settings || Object.keys(settings).length === 0) {
        throw ValidationError.requiredField('settings');
      }
      
      logger.debug('OrganizationRepository.updateSettings', { id, settings });
      
      // Check if organization exists
      const organization = await this.model.findUnique({
        where: { id }
      });
      
      if (!organization) {
        throw NotFoundError.resourceNotFound('Organization', id);
      }
      
      // Update only the settings field
      const updatedOrganization = await this.model.update({
        where: { id },
        data: { settings }
      });
      
      return updatedOrganization;
    } catch (error) {
      logger.error('Error in OrganizationRepository.updateSettings', { id, settings, error });
      throw error;
    }
  }

  /**
   * Gets a summary of an organization including user and team counts
   * @param id Organization ID to get summary for
   * @returns Organization summary with counts
   */
  async getOrganizationSummary(id: string): Promise<OrganizationSummary> {
    try {
      this.validateId(id);
      
      logger.debug('OrganizationRepository.getOrganizationSummary', { id });
      
      // Get the organization
      const organization = await this.model.findUnique({
        where: { id }
      });
      
      if (!organization) {
        throw NotFoundError.resourceNotFound('Organization', id);
      }
      
      // Count users in the organization
      const userCount = await prisma.user.count({
        where: { organizationId: id }
      });
      
      // Count teams in the organization
      const teamCount = await prisma.team.count({
        where: { organizationId: id }
      });
      
      return {
        id: organization.id,
        name: organization.name,
        userCount,
        teamCount
      };
    } catch (error) {
      logger.error('Error in OrganizationRepository.getOrganizationSummary', { id, error });
      throw error;
    }
  }
}

// Create singleton instance of the repository for use throughout the application
export const organizationRepository = new OrganizationRepository();