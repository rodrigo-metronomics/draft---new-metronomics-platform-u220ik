import { logger } from '../../utils/helpers/logger';
import { teamRepository } from '../../repositories/teamRepository';
import { teamMemberRepository } from '../../repositories/teamMemberRepository';
import { userRepository } from '../../repositories/userRepository';
import { NotificationService } from '../notification/notificationService';
import {
  Team,
  TeamWithRelations,
  TeamMember,
  TeamMemberWithUser,
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberRoleDto,
  TeamResponse,
  TeamDetailResponse,
  TeamMemberResponse,
  TeamListResponse,
  TeamRole,
  TeamFilters
} from '../../types/team.types';
import { NotificationType } from '../../types/notification.types';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors';
import { PaginationParams } from '../../utils/helpers/paginationHelper';

/**
 * Service class for team management operations in the Metronomics Platform
 */
export class TeamService {
  private notificationService: NotificationService;

  /**
   * Initializes the team service with required dependencies
   */
  constructor() {
    this.notificationService = new NotificationService();
    logger.info('TeamService initialized');
  }

  /**
   * Creates a new team within an organization
   * @param teamData Data for creating the team
   * @returns The created team
   */
  async createTeam(teamData: CreateTeamDto): Promise<Team> {
    // Validate required fields
    if (!teamData.name) {
      throw ValidationError.requiredField('name');
    }
    if (!teamData.organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    logger.debug('TeamService.createTeam', { teamData });

    // Check if team name already exists in this organization
    const existingTeam = await teamRepository.findByName(teamData.name, teamData.organizationId);
    if (existingTeam) {
      throw new ValidationError(`Team name '${teamData.name}' already exists in this organization`);
    }

    // Create the team with initial members
    const team = await teamRepository.createWithMembers(teamData);

    // Send notifications to team members if any were added
    if (team.members && team.members.length > 0) {
      for (const member of team.members) {
        await this.notificationService.createNotification({
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'You were added to a team',
          content: `You have been added to the team "${team.name}"`,
          priority: 'MEDIUM',
          userId: member.userId,
          organizationId: team.organizationId,
          channels: []
        });
      }
    }

    logger.info('Team created successfully', { teamId: team.id, name: team.name });
    return team;
  }

  /**
   * Retrieves a team by its ID
   * @param id The team ID
   * @returns The team if found, null otherwise
   */
  async getTeam(id: string): Promise<Team | null> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('TeamService.getTeam', { id });
    return teamRepository.findById(id);
  }

  /**
   * Retrieves a team by its ID with all members included
   * @param id The team ID
   * @returns The team with members if found, null otherwise
   */
  async getTeamWithMembers(id: string): Promise<TeamWithRelations | null> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('TeamService.getTeamWithMembers', { id });
    return teamRepository.findWithMembers(id);
  }

  /**
   * Retrieves a team by its ID with all members included or throws an error if not found
   * @param id The team ID
   * @returns The team with members
   */
  async getTeamWithMembersOrThrow(id: string): Promise<TeamWithRelations> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('TeamService.getTeamWithMembersOrThrow', { id });
    return teamRepository.findWithMembersOrThrow(id);
  }

  /**
   * Retrieves all teams belonging to a specific organization
   * @param organizationId The organization ID
   * @param pagination Pagination parameters
   * @returns Paginated list of teams in the organization
   */
  async getTeamsByOrganization(
    organizationId: string,
    pagination: PaginationParams
  ): Promise<TeamListResponse> {
    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    logger.debug('TeamService.getTeamsByOrganization', { organizationId, pagination });
    
    const teamsData = await teamRepository.findByOrganizationId(organizationId, pagination);
    return this.formatTeamListResponse(teamsData, pagination);
  }

  /**
   * Retrieves all teams that a user belongs to within an organization
   * @param userId The user ID
   * @param organizationId The organization ID
   * @returns List of teams the user belongs to
   */
  async getTeamsByUser(userId: string, organizationId: string): Promise<Team[]> {
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }
    if (!organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    logger.debug('TeamService.getTeamsByUser', { userId, organizationId });
    return teamRepository.findByUserId(userId, organizationId);
  }

  /**
   * Updates an existing team's details
   * @param id The team ID
   * @param updateData The data to update
   * @returns The updated team
   */
  async updateTeam(id: string, updateData: UpdateTeamDto): Promise<Team> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }
    if (!updateData) {
      throw ValidationError.requiredField('updateData');
    }
    if (!updateData.name) {
      throw ValidationError.requiredField('name');
    }

    logger.debug('TeamService.updateTeam', { id, updateData });

    // Ensure team exists
    const existingTeam = await teamRepository.findById(id);
    if (!existingTeam) {
      throw NotFoundError.resourceNotFound('Team', id);
    }

    // If name is changing, check if new name is already taken
    if (updateData.name !== existingTeam.name) {
      const nameExists = await teamRepository.findByName(updateData.name, existingTeam.organizationId);
      if (nameExists && nameExists.id !== id) {
        throw new ValidationError(`Team name '${updateData.name}' already exists in this organization`);
      }
    }

    // Update team
    const updatedTeam = await teamRepository.updateWithMembers(id, updateData);
    
    logger.info('Team updated successfully', { teamId: id, name: updateData.name });
    return updatedTeam;
  }

  /**
   * Deletes a team and all its member associations
   * @param id The team ID
   * @returns The deleted team
   */
  async deleteTeam(id: string): Promise<Team> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug('TeamService.deleteTeam', { id });

    // Ensure team exists
    const existingTeam = await teamRepository.findById(id);
    if (!existingTeam) {
      throw NotFoundError.resourceNotFound('Team', id);
    }

    // Delete team and all its member associations
    const deletedTeam = await teamRepository.deleteWithMembers(id);
    
    logger.info('Team deleted successfully', { teamId: id, name: existingTeam.name });
    return deletedTeam;
  }

  /**
   * Adds a new member to a team
   * @param teamId The team ID
   * @param memberData The member data to add
   * @returns The created team membership
   */
  async addTeamMember(teamId: string, memberData: AddTeamMemberDto): Promise<TeamMember> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    if (!memberData) {
      throw ValidationError.requiredField('memberData');
    }
    if (!memberData.userId) {
      throw ValidationError.requiredField('userId');
    }

    logger.debug('TeamService.addTeamMember', { teamId, memberData });

    // Ensure team exists
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw NotFoundError.resourceNotFound('Team', teamId);
    }

    // Ensure user exists
    const user = await userRepository.findById(memberData.userId);
    if (!user) {
      throw NotFoundError.resourceNotFound('User', memberData.userId);
    }

    // Check if user is already a member of this team
    const isAlreadyMember = await teamMemberRepository.isUserInTeam(teamId, memberData.userId);
    if (isAlreadyMember) {
      throw new ValidationError('User is already a member of this team', {
        teamId,
        userId: memberData.userId
      });
    }

    // Add member to team
    const teamMember = await teamMemberRepository.addMember(teamId, memberData);

    // Send notification to the added user
    await this.notificationService.createNotification({
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'You were added to a team',
      content: `You have been added to the team "${team.name}"`,
      priority: 'MEDIUM',
      userId: memberData.userId,
      organizationId: team.organizationId,
      channels: []
    });

    logger.info('Team member added successfully', {
      teamId,
      teamName: team.name,
      userId: memberData.userId,
      role: memberData.role
    });

    return teamMember;
  }

  /**
   * Removes a member from a team
   * @param teamId The team ID
   * @param userId The user ID to remove
   * @returns The removed team membership
   */
  async removeTeamMember(teamId: string, userId: string): Promise<TeamMember> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    logger.debug('TeamService.removeTeamMember', { teamId, userId });

    // Ensure team exists
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw NotFoundError.resourceNotFound('Team', teamId);
    }

    // Check if user is a member of this team
    const isTeamMember = await teamMemberRepository.isUserInTeam(teamId, userId);
    if (!isTeamMember) {
      throw new ValidationError('User is not a member of this team', {
        teamId,
        userId
      });
    }

    // Remove member from team
    const teamMember = await teamMemberRepository.removeMember(teamId, userId);

    logger.info('Team member removed successfully', {
      teamId,
      teamName: team.name,
      userId
    });

    return teamMember;
  }

  /**
   * Updates a team member's role
   * @param teamId The team ID
   * @param userId The user ID
   * @param updateData The role update data
   * @returns The updated team membership
   */
  async updateTeamMemberRole(
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

    logger.debug('TeamService.updateTeamMemberRole', { teamId, userId, role: updateData.role });

    // Ensure team exists
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw NotFoundError.resourceNotFound('Team', teamId);
    }

    // Check if user is a member of this team
    const isTeamMember = await teamMemberRepository.isUserInTeam(teamId, userId);
    if (!isTeamMember) {
      throw new ValidationError('User is not a member of this team', {
        teamId,
        userId
      });
    }

    // Update member role
    const teamMember = await teamMemberRepository.updateMemberRole(teamId, userId, updateData);

    logger.info('Team member role updated successfully', {
      teamId,
      teamName: team.name,
      userId,
      newRole: updateData.role
    });

    return teamMember;
  }

  /**
   * Retrieves all members of a specific team
   * @param teamId The team ID
   * @returns List of team members with user details
   */
  async getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }

    logger.debug('TeamService.getTeamMembers', { teamId });

    // Ensure team exists
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw NotFoundError.resourceNotFound('Team', teamId);
    }

    // Get team members with user details
    return teamMemberRepository.findWithUserDetails({ teamId });
  }

  /**
   * Checks if a user is a member of a specific team
   * @param teamId The team ID
   * @param userId The user ID
   * @returns True if the user is a member, false otherwise
   */
  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    logger.debug('TeamService.isUserInTeam', { teamId, userId });
    return teamMemberRepository.isUserInTeam(teamId, userId);
  }

  /**
   * Gets a user's role in a specific team
   * @param teamId The team ID
   * @param userId The user ID
   * @returns The user's role in the team or null if not a member
   */
  async getUserTeamRole(teamId: string, userId: string): Promise<TeamRole | null> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    logger.debug('TeamService.getUserTeamRole', { teamId, userId });
    return teamMemberRepository.getUserTeamRole(teamId, userId);
  }

  /**
   * Finds teams based on provided filters with pagination
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @returns Paginated teams matching the filters
   */
  async findTeamsWithFilters(
    filters: TeamFilters,
    pagination: PaginationParams
  ): Promise<TeamListResponse> {
    logger.debug('TeamService.findTeamsWithFilters', { filters, pagination });
    
    const teamsData = await teamRepository.findWithFilters(filters, pagination);
    return this.formatTeamListResponse(teamsData, pagination);
  }

  /**
   * Validates if a user has access to a team based on their role
   * @param teamId The team ID
   * @param userId The user ID
   * @param requireLead If true, the user must be a team lead
   */
  async validateTeamAccess(teamId: string, userId: string, requireLead: boolean = false): Promise<void> {
    if (!teamId) {
      throw ValidationError.requiredField('teamId');
    }
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    logger.debug('TeamService.validateTeamAccess', { teamId, userId, requireLead });

    // Check if team exists
    const team = await teamRepository.findById(teamId);
    if (!team) {
      throw NotFoundError.resourceNotFound('Team', teamId);
    }

    // Check if user is a member of the team
    const isTeamMember = await teamMemberRepository.isUserInTeam(teamId, userId);
    if (!isTeamMember) {
      throw AuthorizationError.resourceAccessDenied('Team', teamId, { userId });
    }

    // If lead role is required, check if user is a team lead
    if (requireLead) {
      const userRole = await teamMemberRepository.getUserTeamRole(teamId, userId);
      if (userRole !== TeamRole.LEAD) {
        throw AuthorizationError.insufficientPermissions('manage team', {
          teamId,
          userId,
          requiredRole: TeamRole.LEAD,
          actualRole: userRole
        });
      }
    }
  }

  /**
   * Formats a team object into a standardized response format
   * @param team Team object to format
   * @returns Formatted team response
   */
  formatTeamResponse(team: Team & { memberCount?: number }): TeamResponse {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      organizationId: team.organizationId,
      memberCount: team.memberCount || 0,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString()
    };
  }

  /**
   * Formats a team with members into a detailed response format
   * @param team Team with members to format
   * @returns Formatted detailed team response
   */
  formatTeamDetailResponse(team: TeamWithRelations): TeamDetailResponse {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      organizationId: team.organizationId,
      members: team.members.map(member => this.formatTeamMemberResponse(member)),
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString()
    };
  }

  /**
   * Formats a team member object into a standardized response format
   * @param teamMember Team member object to format
   * @returns Formatted team member response
   */
  formatTeamMemberResponse(teamMember: TeamMemberWithUser): TeamMemberResponse {
    return {
      id: teamMember.id,
      userId: teamMember.userId,
      name: teamMember.user.name,
      email: teamMember.user.email,
      role: teamMember.role,
      photoURL: teamMember.user.photoURL,
      joinedAt: teamMember.joinedAt.toISOString()
    };
  }

  /**
   * Formats a list of teams into a paginated response format
   * @param teamsData Teams data with total count
   * @param pagination Pagination parameters
   * @returns Formatted paginated team list response
   */
  formatTeamListResponse(
    teamsData: { data: Team[]; total: number },
    pagination: PaginationParams
  ): TeamListResponse {
    return {
      teams: teamsData.data.map(team => this.formatTeamResponse(team)),
      total: teamsData.total,
      page: pagination.page,
      limit: pagination.limit
    };
  }
}

// Export a singleton instance of the service
export const teamService = new TeamService();