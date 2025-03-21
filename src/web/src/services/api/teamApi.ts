import { get, post, put, delete } from './index';
import { 
  Team, 
  TeamWithMembers, 
  TeamResponse, 
  TeamDetailResponse, 
  TeamListResponse, 
  TeamListParams, 
  TeamFilters, 
  CreateTeamDto, 
  UpdateTeamDto, 
  AddTeamMemberDto, 
  UpdateTeamMemberRoleDto,
  TeamMemberResponse,
  TeamMemberFilters
} from '../../types/team.types';
import { ApiResponse } from '../../types/api.types';
import { ID } from '../../types/common.types';

// API endpoint for team operations
const TEAMS_ENDPOINT = '/api/teams';

/**
 * Fetches a paginated list of teams based on provided filters
 * @param params - Pagination and filtering parameters
 * @returns Promise resolving to a paginated list of teams
 */
const getTeams = async (params: TeamListParams): Promise<ApiResponse<TeamListResponse>> => {
  return get<TeamListResponse>(TEAMS_ENDPOINT, params);
};

/**
 * Fetches a single team by its ID
 * @param id - ID of the team to retrieve
 * @returns Promise resolving to the requested team with detailed information
 */
const getTeamById = async (id: ID): Promise<ApiResponse<TeamDetailResponse>> => {
  return get<TeamDetailResponse>(`${TEAMS_ENDPOINT}/${id}`);
};

/**
 * Fetches teams belonging to a specific organization
 * @param organizationId - ID of the organization
 * @param params - Pagination and filtering parameters
 * @returns Promise resolving to a paginated list of teams in the organization
 */
const getTeamsByOrganization = async (
  organizationId: ID, 
  params: TeamListParams
): Promise<ApiResponse<TeamListResponse>> => {
  return get<TeamListResponse>(`/api/organizations/${organizationId}/teams`, params);
};

/**
 * Fetches teams that a specific user belongs to
 * @param userId - ID of the user
 * @param params - Pagination and filtering parameters
 * @returns Promise resolving to a paginated list of teams the user belongs to
 */
const getTeamsByUser = async (
  userId: ID, 
  params: TeamListParams
): Promise<ApiResponse<TeamListResponse>> => {
  return get<TeamListResponse>(`/api/users/${userId}/teams`, params);
};

/**
 * Creates a new team
 * @param teamData - Data for the new team
 * @returns Promise resolving to the newly created team
 */
const createTeam = async (teamData: CreateTeamDto): Promise<ApiResponse<TeamResponse>> => {
  return post<TeamResponse>(TEAMS_ENDPOINT, teamData);
};

/**
 * Updates an existing team
 * @param id - ID of the team to update
 * @param teamData - Updated team data
 * @returns Promise resolving to the updated team
 */
const updateTeam = async (
  id: ID, 
  teamData: UpdateTeamDto
): Promise<ApiResponse<TeamResponse>> => {
  return put<TeamResponse>(`${TEAMS_ENDPOINT}/${id}`, teamData);
};

/**
 * Permanently deletes a team
 * @param id - ID of the team to delete
 * @returns Promise resolving when the team is deleted
 */
const deleteTeam = async (id: ID): Promise<ApiResponse<void>> => {
  return delete<void>(`${TEAMS_ENDPOINT}/${id}`);
};

/**
 * Fetches members of a specific team
 * @param teamId - ID of the team
 * @param filters - Filtering options for team members
 * @returns Promise resolving to a list of team members
 */
const getTeamMembers = async (
  teamId: ID, 
  filters: TeamMemberFilters
): Promise<ApiResponse<TeamMemberResponse[]>> => {
  return get<TeamMemberResponse[]>(`${TEAMS_ENDPOINT}/${teamId}/members`, filters);
};

/**
 * Adds a user to a team
 * @param teamId - ID of the team
 * @param memberData - Data for the new team member
 * @returns Promise resolving to the newly added team member
 */
const addTeamMember = async (
  teamId: ID, 
  memberData: AddTeamMemberDto
): Promise<ApiResponse<TeamMemberResponse>> => {
  return post<TeamMemberResponse>(`${TEAMS_ENDPOINT}/${teamId}/members`, memberData);
};

/**
 * Updates a team member's role
 * @param teamId - ID of the team
 * @param userId - ID of the user
 * @param roleData - Updated role data
 * @returns Promise resolving to the updated team member
 */
const updateTeamMemberRole = async (
  teamId: ID, 
  userId: ID, 
  roleData: UpdateTeamMemberRoleDto
): Promise<ApiResponse<TeamMemberResponse>> => {
  return put<TeamMemberResponse>(`${TEAMS_ENDPOINT}/${teamId}/members/${userId}`, roleData);
};

/**
 * Removes a user from a team
 * @param teamId - ID of the team
 * @param userId - ID of the user to remove
 * @returns Promise resolving to the success status
 */
const removeTeamMember = async (
  teamId: ID, 
  userId: ID
): Promise<ApiResponse<{ success: boolean }>> => {
  return delete<{ success: boolean }>(`${TEAMS_ENDPOINT}/${teamId}/members/${userId}`);
};

/**
 * Adds multiple users to a team at once
 * @param teamId - ID of the team
 * @param membersData - Array of member data to add
 * @returns Promise resolving to the success status and number of added members
 */
const bulkAddTeamMembers = async (
  teamId: ID, 
  membersData: AddTeamMemberDto[]
): Promise<ApiResponse<{ success: boolean, addedCount: number }>> => {
  return post<{ success: boolean, addedCount: number }>(
    `${TEAMS_ENDPOINT}/${teamId}/members/bulk`, 
    membersData
  );
};

/**
 * Removes multiple users from a team at once
 * @param teamId - ID of the team
 * @param userIds - Array of user IDs to remove
 * @returns Promise resolving to the success status and number of removed members
 */
const bulkRemoveTeamMembers = async (
  teamId: ID, 
  userIds: ID[]
): Promise<ApiResponse<{ success: boolean, removedCount: number }>> => {
  return post<{ success: boolean, removedCount: number }>(
    `${TEAMS_ENDPOINT}/${teamId}/members/bulk-remove`, 
    userIds
  );
};

// Export all team API functions
export const teamApi = {
  getTeams,
  getTeamById,
  getTeamsByOrganization,
  getTeamsByUser,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  bulkAddTeamMembers,
  bulkRemoveTeamMembers
};