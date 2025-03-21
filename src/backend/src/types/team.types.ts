/**
 * TypeScript type definitions for team-related entities in the Metronomics Platform.
 * This file defines interfaces, enums, and types for team data structures, including
 * team profiles, memberships, roles, and request/response interfaces for the API.
 */

import { UserRole } from '../utils/constants/roles';
import { User } from './user.types';

/**
 * Enum defining possible roles within a team
 * 
 * LEAD: Team or department leader responsible for team management
 * MEMBER: Regular team member with standard team access
 */
export enum TeamRole {
  LEAD = 'LEAD',
  MEMBER = 'MEMBER'
}

/**
 * Core team entity interface representing a team in the system
 * Teams are used to group users and assign team-specific permissions and metrics
 */
export interface Team {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface representing a user's membership in a team
 * This creates the many-to-many relationship between users and teams
 */
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
}

/**
 * Extended team member interface that includes user details
 * Used when team members need to be displayed with user information
 */
export interface TeamMemberWithUser extends TeamMember {
  user: User;
}

/**
 * Extended team interface that includes related entities like members
 * Used for detailed team views that need complete member information
 */
export interface TeamWithRelations extends Team {
  members: TeamMemberWithUser[];
}

/**
 * Data transfer object for creating a new team
 * Includes initial member assignments to setup the team
 * 
 * Note: Only users with LEADERSHIP or higher role can typically create teams
 */
export interface CreateTeamDto {
  name: string;
  description: string;
  organizationId: string;
  initialMembers: Array<{ userId: string; role: TeamRole }>;
}

/**
 * Data transfer object for updating an existing team
 * Used to modify the team name and description
 */
export interface UpdateTeamDto {
  name: string;
  description: string;
}

/**
 * Data transfer object for adding a member to a team
 * Specifies the user and their role within the team
 */
export interface AddTeamMemberDto {
  userId: string;
  role: TeamRole;
}

/**
 * Data transfer object for updating a team member's role
 * Used to promote or demote team members
 */
export interface UpdateTeamMemberRoleDto {
  role: TeamRole;
}

/**
 * Response format for team data in API responses
 * Includes a count of members but not the member details
 */
export interface TeamResponse {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response format for team member data in API responses
 * Includes essential user information for team member display
 */
export interface TeamMemberResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TeamRole;
  photoURL: string | null;
  joinedAt: string;
}

/**
 * Detailed response format for team data including members
 * Used for team detail views that show the complete team roster
 */
export interface TeamDetailResponse {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  members: TeamMemberResponse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Response format for paginated team list in API responses
 * Supports pagination for organizations with many teams
 */
export interface TeamListResponse {
  teams: TeamResponse[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Interface for filtering teams by organization, user, and search term
 * Used to create filtered team queries
 */
export interface TeamFilters {
  organizationId: string;
  userId: string;
  search: string;
}

/**
 * Interface for filtering team members by team, user, and role
 * Used to create filtered team member queries
 */
export interface TeamMemberFilters {
  teamId: string;
  userId: string;
  role: TeamRole;
}