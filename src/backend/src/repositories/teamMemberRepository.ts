import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { 
  TeamMember, 
  TeamRole, 
  AddTeamMemberDto, 
  TeamMemberFilters, 
  TeamMemberWithUser, 
  UpdateTeamMemberRoleDto 
} from '../types/team.types';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * Repository implementation for team member-related database operations in the Metronomics Platform.
 * Extends the BaseRepository to provide team membership-specific data access methods,
 * supporting team management within organizations.
 */
export class TeamMemberRepository extends BaseRepository<TeamMember> {
  /**
   * Initializes the team member repository with the Prisma teamMember model
   */
  constructor() {
    super('teamMember');
  }

  /**
   * Finds all team members belonging to a specific team
   * @param teamId Team ID to filter by
   * @param options Additional query options such as includes
   * @returns List of team members in the team
   */
  async findByTeamId(teamId: string, options: Record<string, any> = {}): Promise<TeamMember[]> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }

    const include = this.buildInclude(options);

    return this.model.findMany({
      where: { teamId },
      ...include
    });
  }

  /**
   * Finds all team memberships for a specific user
   * @param userId User ID to filter by
   * @param options Additional query options such as includes
   * @returns List of team memberships for the user
   */
  async findByUserId(userId: string, options: Record<string, any> = {}): Promise<TeamMember[]> {
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    const include = this.buildInclude(options);

    return this.model.findMany({
      where: { userId },
      ...include
    });
  }

  /**
   * Finds a team membership for a specific team and user
   * @param teamId Team ID to filter by
   * @param userId User ID to filter by
   * @param options Additional query options such as includes
   * @returns The team membership or null if not found
   */
  async findByTeamAndUser(
    teamId: string, 
    userId: string, 
    options: Record<string, any> = {}
  ): Promise<TeamMember | null> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }

    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    const include = this.buildInclude(options);

    return this.model.findFirst({
      where: { 
        teamId, 
        userId 
      },
      ...include
    });
  }

  /**
   * Finds a team membership for a specific team and user or throws an error if not found
   * @param teamId Team ID to filter by
   * @param userId User ID to filter by
   * @param options Additional query options such as includes
   * @returns The team membership
   * @throws NotFoundError if team membership is not found
   */
  async findByTeamAndUserOrThrow(
    teamId: string, 
    userId: string, 
    options: Record<string, any> = {}
  ): Promise<TeamMember> {
    const teamMember = await this.findByTeamAndUser(teamId, userId, options);
    
    if (!teamMember) {
      throw NotFoundError.resourceNotFound('TeamMember', `teamId: ${teamId}, userId: ${userId}`);
    }
    
    return teamMember;
  }

  /**
   * Finds team members with their user details
   * @param filters Filters to apply to the query
   * @param options Additional query options such as includes
   * @returns Team members with user details
   */
  async findWithUserDetails(
    filters: TeamMemberFilters, 
    options: Record<string, any> = {}
  ): Promise<TeamMemberWithUser[]> {
    const where: Record<string, any> = {};
    
    if (filters.teamId) {
      where.teamId = filters.teamId;
    }
    
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.role) {
      where.role = filters.role;
    }
    
    // Always include user data
    const includeUser = {
      include: {
        user: true,
        ...(options.include || {})
      }
    };

    return this.model.findMany({
      where,
      ...includeUser
    });
  }

  /**
   * Adds a new member to a team
   * @param teamId ID of the team to add the member to
   * @param memberData Data for the new team member
   * @returns The created team membership
   * @throws ValidationError if the user is already a member of the team
   */
  async addMember(teamId: string, memberData: AddTeamMemberDto): Promise<TeamMember> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    
    if (!memberData || !memberData.userId) {
      throw ValidationError.requiredField('userId');
    }

    // Check if the user is already a member of this team
    const existingMembership = await this.findByTeamAndUser(teamId, memberData.userId);
    
    if (existingMembership) {
      throw new ValidationError(
        `User is already a member of this team`, 
        { teamId, userId: memberData.userId }
      );
    }

    return this.create({
      teamId,
      userId: memberData.userId,
      role: memberData.role || TeamRole.MEMBER,
      joinedAt: new Date()
    });
  }

  /**
   * Removes a member from a team
   * @param teamId ID of the team to remove the member from
   * @param userId ID of the user to remove from the team
   * @returns The deleted team membership
   * @throws NotFoundError if the team membership is not found
   */
  async removeMember(teamId: string, userId: string): Promise<TeamMember> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    // Find the team membership first to ensure it exists
    const teamMember = await this.findByTeamAndUser(teamId, userId);
    
    if (!teamMember) {
      throw NotFoundError.resourceNotFound('TeamMember', `teamId: ${teamId}, userId: ${userId}`);
    }

    return this.delete(teamMember.id);
  }

  /**
   * Updates a team member's role
   * @param teamId ID of the team
   * @param userId ID of the user whose role is being updated
   * @param updateData Data for updating the role
   * @returns The updated team membership
   * @throws NotFoundError if the team membership is not found
   */
  async updateMemberRole(
    teamId: string, 
    userId: string, 
    updateData: UpdateTeamMemberRoleDto
  ): Promise<TeamMember> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }
    
    if (!updateData || !updateData.role) {
      throw ValidationError.requiredField('role');
    }

    // Find the team membership first to ensure it exists
    const teamMember = await this.findByTeamAndUser(teamId, userId);
    
    if (!teamMember) {
      throw NotFoundError.resourceNotFound('TeamMember', `teamId: ${teamId}, userId: ${userId}`);
    }

    return this.update(teamMember.id, { role: updateData.role });
  }

  /**
   * Gets the count of members in a team
   * @param teamId ID of the team
   * @returns The count of team members
   */
  async getTeamMemberCount(teamId: string): Promise<number> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }

    return this.model.count({
      where: { teamId }
    });
  }

  /**
   * Checks if a user is a member of a team
   * @param teamId ID of the team
   * @param userId ID of the user
   * @returns True if the user is a member, false otherwise
   */
  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    const count = await this.model.count({
      where: { 
        teamId, 
        userId 
      }
    });

    return count > 0;
  }

  /**
   * Gets a user's role in a team
   * @param teamId ID of the team
   * @param userId ID of the user
   * @returns The user's role in the team or null if not a member
   */
  async getUserTeamRole(teamId: string, userId: string): Promise<TeamRole | null> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    const teamMember = await this.findByTeamAndUser(teamId, userId);
    
    if (!teamMember) {
      return null;
    }
    
    return teamMember.role;
  }

  /**
   * Finds team members matching the provided filters
   * @param filters Filters to apply to the query
   * @param options Additional query options such as includes
   * @returns The team members and total count
   */
  async findByFilters(
    filters: TeamMemberFilters, 
    options: Record<string, any> = {}
  ): Promise<{ data: TeamMember[]; total: number }> {
    const where: Record<string, any> = {};
    
    if (filters.teamId) {
      where.teamId = filters.teamId;
    }
    
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.role) {
      where.role = filters.role;
    }
    
    const include = this.buildInclude(options);
    
    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        ...include
      }),
      this.model.count({ where })
    ]);
    
    return { data, total };
  }
}

// Create singleton instance
export const teamMemberRepository = new TeamMemberRepository();