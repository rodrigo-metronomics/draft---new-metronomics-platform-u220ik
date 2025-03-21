import { UserRole } from '../utils/constants/roles';
import { ID, Timestamp, PaginatedResult, PaginationParams } from './common.types';
import { UserReference } from './user.types';

/**
 * Enum defining possible roles within a team.
 * Determines what actions a team member can perform within their team.
 */
export enum TeamRole {
  /** Team lead role with management capabilities within the team */
  LEAD = 'LEAD',
  /** Standard team member role */
  MEMBER = 'MEMBER'
}

/**
 * Core team entity interface representing a team in the system.
 */
export interface Team {
  /** Unique identifier for the team */
  id: ID;
  /** Name of the team */
  name: string;
  /** Description of the team's purpose and responsibilities */
  description: string;
  /** ID of the organization this team belongs to */
  organizationId: ID;
  /** Timestamp when the team was created */
  createdAt: Timestamp;
  /** Timestamp when the team was last updated */
  updatedAt: Timestamp;
}

/**
 * Interface representing a user's membership in a team.
 */
export interface TeamMember {
  /** Unique identifier for the team membership */
  id: ID;
  /** ID of the team this membership relates to */
  teamId: ID;
  /** ID of the user who is a member of the team */
  userId: ID;
  /** Role of the user within the team */
  role: TeamRole;
  /** Timestamp when the user joined the team */
  joinedAt: Timestamp;
}

/**
 * Extended team interface that includes related members.
 */
export interface TeamWithMembers extends Team {
  /** Array of team members with their user details */
  members: TeamMemberWithUser[];
}

/**
 * Extended team member interface that includes user details.
 */
export interface TeamMemberWithUser extends TeamMember {
  /** User details for the team member */
  user: UserReference;
}

/**
 * Data transfer object for creating a new team.
 */
export interface CreateTeamDto {
  /** Name for the new team */
  name: string;
  /** Description of the team's purpose and responsibilities */
  description: string;
  /** ID of the organization this team belongs to */
  organizationId: ID;
  /** Initial members to add to the team with their roles */
  initialMembers: Array<{ userId: ID; role: TeamRole }>;
}

/**
 * Data transfer object for updating an existing team.
 */
export interface UpdateTeamDto {
  /** Updated name for the team */
  name: string;
  /** Updated description of the team */
  description: string;
}

/**
 * Data transfer object for adding a member to a team.
 */
export interface AddTeamMemberDto {
  /** ID of the user to add to the team */
  userId: ID;
  /** Role to assign to the user within the team */
  role: TeamRole;
}

/**
 * Data transfer object for updating a team member's role.
 */
export interface UpdateTeamMemberRoleDto {
  /** New role to assign to the team member */
  role: TeamRole;
}

/**
 * Response format for team data in API responses.
 */
export interface TeamResponse {
  /** Unique identifier for the team */
  id: ID;
  /** Name of the team */
  name: string;
  /** Description of the team's purpose and responsibilities */
  description: string;
  /** ID of the organization this team belongs to */
  organizationId: ID;
  /** Number of members in the team */
  memberCount: number;
  /** Timestamp when the team was created (ISO string format) */
  createdAt: string;
  /** Timestamp when the team was last updated (ISO string format) */
  updatedAt: string;
}

/**
 * Detailed response format for team data including members.
 */
export interface TeamDetailResponse {
  /** Unique identifier for the team */
  id: ID;
  /** Name of the team */
  name: string;
  /** Description of the team's purpose and responsibilities */
  description: string;
  /** ID of the organization this team belongs to */
  organizationId: ID;
  /** Array of team members with their details */
  members: TeamMemberResponse[];
  /** Timestamp when the team was created (ISO string format) */
  createdAt: string;
  /** Timestamp when the team was last updated (ISO string format) */
  updatedAt: string;
}

/**
 * Response format for team member data in API responses.
 */
export interface TeamMemberResponse {
  /** Unique identifier for the team membership */
  id: ID;
  /** ID of the user */
  userId: ID;
  /** Name of the user */
  name: string;
  /** Email of the user */
  email: string;
  /** Role of the user within the team */
  role: TeamRole;
  /** URL to the user's profile photo, if available */
  photoURL: string | null;
  /** Timestamp when the user joined the team (ISO string format) */
  joinedAt: string;
}

/**
 * Response format for paginated team list in API responses.
 */
export interface TeamListResponse extends PaginatedResult<TeamResponse> {
}

/**
 * Interface for filtering teams by organization, user, and search term.
 */
export interface TeamFilters {
  /** Filter by organization ID */
  organizationId: ID;
  /** Filter by user ID */
  userId?: ID;
  /** Search teams by name or description */
  search?: string;
}

/**
 * Parameters for paginated team lists with filtering.
 */
export interface TeamListParams extends TeamFilters, PaginationParams {
}

/**
 * Interface for filtering team members by team, user, and role.
 */
export interface TeamMemberFilters {
  /** Filter by team ID */
  teamId: ID;
  /** Filter by user ID */
  userId?: ID;
  /** Filter by team role */
  role?: TeamRole;
}