import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { logger } from '../utils/helpers/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { 
  Team, 
  TeamWithRelations,
  CreateTeamDto,
  UpdateTeamDto,
  TeamFilters
} from '../types/team.types';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { teamMemberRepository } from './teamMemberRepository';

/**
 * Repository implementation for team-related database operations in the Metronomics Platform.
 * Extends the BaseRepository to provide team-specific data access methods,
 * supporting team management within organizations.
 */
export class TeamRepository extends BaseRepository<Team> {
  /**
   * Initializes the team repository with the Team model
   */
  constructor() {
    super('team');
  }

  /**
   * Finds a team by its name within an organization
   * @param name Team name to search for
   * @param organizationId Organization ID to scope the search
   * @returns The found team or null if not found
   */
  async findByName(name: string, organizationId: string): Promise<Team | null> {
    if (!name) {
      throw ValidationError.requiredField('name');
    }

    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    logger.debug('TeamRepository.findByName', { name, organizationId });

    return this.model.findFirst({
      where: {
        name,
        organizationId
      }
    });
  }

  /**
   * Finds all teams belonging to a specific organization
   * @param organizationId Organization ID to filter by
   * @param pagination Pagination parameters
   * @param options Additional query options such as includes
   * @returns Paginated teams belonging to the organization
   */
  async findByOrganizationId(
    organizationId: string,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Team[]; total: number }> {
    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    logger.debug('TeamRepository.findByOrganizationId', { organizationId, pagination });

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
  }

  /**
   * Finds all teams that a user belongs to
   * @param userId User ID to filter by
   * @param organizationId Organization ID to scope the search
   * @param options Additional query options such as includes
   * @returns List of teams the user belongs to
   */
  async findByUserId(
    userId: string,
    organizationId: string,
    options: Record<string, any> = {}
  ): Promise<Team[]> {
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    logger.debug('TeamRepository.findByUserId', { userId, organizationId });

    // Find team memberships for this user
    const teamMembers = await teamMemberRepository.findByUserId(userId);
    
    // If user isn't a member of any teams, return empty array
    if (!teamMembers || teamMembers.length === 0) {
      return [];
    }

    // Extract team IDs from memberships
    const teamIds = teamMembers.map(member => member.teamId);

    // Find teams with these IDs in the specified organization
    const include = this.buildInclude(options);
    const orderBy = this.buildOrderBy(options);

    return this.model.findMany({
      where: {
        id: { in: teamIds },
        organizationId
      },
      ...(orderBy && { orderBy }),
      ...include
    });
  }

  /**
   * Finds a team by ID with its members included
   * @param id Team ID to find
   * @returns The team with members or null if not found
   */
  async findWithMembers(id: string): Promise<TeamWithRelations | null> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('TeamRepository.findWithMembers', { id });

    // Find the team first
    const team = await this.findById(id);
    
    if (!team) {
      return null;
    }

    // Find team members with user details
    const members = await teamMemberRepository.findWithUserDetails({ teamId: id });

    // Combine team with members data
    const teamWithMembers: TeamWithRelations = {
      ...team,
      members
    };

    return teamWithMembers;
  }

  /**
   * Finds a team by ID with its members included or throws an error if not found
   * @param id Team ID to find
   * @returns The team with members
   * @throws NotFoundError if the team is not found
   */
  async findWithMembersOrThrow(id: string): Promise<TeamWithRelations> {
    const teamWithMembers = await this.findWithMembers(id);
    
    if (!teamWithMembers) {
      throw NotFoundError.resourceNotFound('Team', id);
    }
    
    return teamWithMembers;
  }

  /**
   * Creates a new team with initial members
   * @param data Team creation data including initial members
   * @returns The created team with members
   */
  async createWithMembers(data: CreateTeamDto): Promise<TeamWithRelations> {
    if (!data) {
      throw ValidationError.requiredField('data');
    }

    logger.debug('TeamRepository.createWithMembers', { data });

    // Check if a team with this name already exists in the organization
    const existingTeam = await this.findByName(data.name, data.organizationId);

    if (existingTeam) {
      throw new ValidationError(
        `A team with name "${data.name}" already exists in this organization`,
        { organizationId: data.organizationId }
      );
    }

    // Use transaction to ensure both team and initial members are created
    return this.transaction(async (tx) => {
      // Create the team
      const team = await tx.team.create({
        data: {
          name: data.name,
          description: data.description,
          organizationId: data.organizationId,
        }
      });

      // Add initial members if provided
      if (data.initialMembers && data.initialMembers.length > 0) {
        for (const member of data.initialMembers) {
          await tx.teamMember.create({
            data: {
              teamId: team.id,
              userId: member.userId,
              role: member.role,
              joinedAt: new Date()
            }
          });
        }
      }

      // Get the created team with members
      const members = await teamMemberRepository.findWithUserDetails({ teamId: team.id });

      return {
        ...team,
        members
      };
    });
  }

  /**
   * Updates a team and optionally its members
   * @param id Team ID to update
   * @param data Team update data
   * @returns The updated team with members
   */
  async updateWithMembers(id: string, data: UpdateTeamDto): Promise<TeamWithRelations> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    if (!data) {
      throw ValidationError.requiredField('data');
    }

    logger.debug('TeamRepository.updateWithMembers', { id, data });

    // Check if the team exists
    const existingTeam = await this.findById(id);
    
    if (!existingTeam) {
      throw NotFoundError.resourceNotFound('Team', id);
    }

    // Update the team
    const updatedTeam = await this.update(id, {
      name: data.name,
      description: data.description
    });

    // Find the updated team with its members
    const teamWithMembers = await this.findWithMembers(id);

    // This shouldn't happen since we just updated the team
    if (!teamWithMembers) {
      throw new Error('Failed to retrieve updated team with members');
    }

    return teamWithMembers;
  }

  /**
   * Deletes a team and all its member associations
   * @param id Team ID to delete
   * @returns The deleted team
   */
  async deleteWithMembers(id: string): Promise<Team> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('TeamRepository.deleteWithMembers', { id });

    // Check if the team exists
    const existingTeam = await this.findById(id);
    
    if (!existingTeam) {
      throw NotFoundError.resourceNotFound('Team', id);
    }

    // Use transaction to ensure both team and members are deleted
    return this.transaction(async (tx) => {
      // Delete all team members first (due to foreign key constraint)
      await tx.teamMember.deleteMany({
        where: { teamId: id }
      });

      // Delete the team
      const deletedTeam = await tx.team.delete({
        where: { id }
      });

      return deletedTeam;
    });
  }

  /**
   * Finds teams based on provided filters with pagination
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @param options Additional query options such as includes
   * @returns Paginated teams matching the filters
   */
  async findWithFilters(
    filters: TeamFilters,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Team[]; total: number }> {
    logger.debug('TeamRepository.findWithFilters', { filters, pagination });

    const where: Record<string, any> = {};

    // Apply filters
    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    // For searching by name or description
    if (filters.search && filters.search.trim() !== '') {
      where.OR = [
        { 
          name: { 
            contains: filters.search,
            mode: 'insensitive'
          } 
        },
        { 
          description: { 
            contains: filters.search,
            mode: 'insensitive'
          } 
        }
      ];
    }

    // For user-specific teams, we need to do this differently since it's a relation
    if (filters.userId) {
      // First find the team IDs where this user is a member
      const teamMembers = await teamMemberRepository.findByUserId(filters.userId);
      const teamIds = teamMembers.map(member => member.teamId);
      
      // If user isn't a member of any teams, return empty result
      if (teamIds.length === 0) {
        return { data: [], total: 0 };
      }
      
      // Add team IDs to the where clause
      where.id = { in: teamIds };
    }

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
  }

  /**
   * Gets a team with its member count
   * @param id Team ID to find
   * @returns Team with member count or null if not found
   */
  async getTeamWithMemberCount(id: string): Promise<(Team & { memberCount: number }) | null> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('TeamRepository.getTeamWithMemberCount', { id });

    // Find the team
    const team = await this.findById(id);
    
    if (!team) {
      return null;
    }

    // Get the member count
    const memberCount = await teamMemberRepository.getTeamMemberCount(id);

    // Return team with member count
    return {
      ...team,
      memberCount
    };
  }
}

// Create singleton instance
export const teamRepository = new TeamRepository();