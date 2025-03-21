import { get, post, put, delete as deleteRequest } from './index';
import { 
  Organization,
  OrganizationWithRelations,
  OrganizationResponse,
  OrganizationDetailResponse,
  OrganizationListResponse,
  OrganizationListParams,
  OrganizationFilters,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateOrganizationSettingsDto,
  OrganizationWithUsersResponse,
  OrganizationWithTeamsResponse,
  OrganizationSummary,
  OrganizationAnnouncementDto
} from '../../types/organization.types';
import { ApiResponse, PaginatedResponse } from '../../types/api.types';
import { ID } from '../../types/common.types';

// Base API endpoint for organizations
const ORGANIZATIONS_ENDPOINT = '/api/organizations';

/**
 * Fetches a paginated list of organizations based on provided filters
 * @param params - Filter and pagination parameters
 * @returns Promise resolving to a paginated list of organizations
 */
const getOrganizations = (params: OrganizationListParams): Promise<ApiResponse<OrganizationListResponse>> => {
  return get<OrganizationListResponse>(ORGANIZATIONS_ENDPOINT, params);
};

/**
 * Fetches a single organization by its ID
 * @param id - Organization ID
 * @returns Promise resolving to the requested organization with detailed information
 */
const getOrganizationById = (id: ID): Promise<ApiResponse<OrganizationDetailResponse>> => {
  return get<OrganizationDetailResponse>(`${ORGANIZATIONS_ENDPOINT}/${id}`);
};

/**
 * Fetches an organization with its users
 * @param id - Organization ID
 * @returns Promise resolving to the organization with its users
 */
const getOrganizationWithUsers = (id: ID): Promise<ApiResponse<OrganizationWithUsersResponse>> => {
  return get<OrganizationWithUsersResponse>(`${ORGANIZATIONS_ENDPOINT}/${id}/users`);
};

/**
 * Fetches an organization with its teams
 * @param id - Organization ID
 * @returns Promise resolving to the organization with its teams
 */
const getOrganizationWithTeams = (id: ID): Promise<ApiResponse<OrganizationWithTeamsResponse>> => {
  return get<OrganizationWithTeamsResponse>(`${ORGANIZATIONS_ENDPOINT}/${id}/teams`);
};

/**
 * Fetches an organization with both its users and teams
 * @param id - Organization ID
 * @returns Promise resolving to the organization with its users and teams
 */
const getOrganizationWithUsersAndTeams = (id: ID): Promise<ApiResponse<OrganizationWithRelations>> => {
  return get<OrganizationWithRelations>(`${ORGANIZATIONS_ENDPOINT}/${id}/full`);
};

/**
 * Creates a new organization
 * @param organizationData - Data for the new organization
 * @returns Promise resolving to the newly created organization
 */
const createOrganization = (organizationData: CreateOrganizationDto): Promise<ApiResponse<OrganizationResponse>> => {
  return post<OrganizationResponse>(ORGANIZATIONS_ENDPOINT, organizationData);
};

/**
 * Updates an existing organization
 * @param id - Organization ID
 * @param organizationData - Updated organization data
 * @returns Promise resolving to the updated organization
 */
const updateOrganization = (id: ID, organizationData: UpdateOrganizationDto): Promise<ApiResponse<OrganizationResponse>> => {
  return put<OrganizationResponse>(`${ORGANIZATIONS_ENDPOINT}/${id}`, organizationData);
};

/**
 * Updates an organization's settings
 * @param id - Organization ID
 * @param settingsData - Updated settings data
 * @returns Promise resolving to the organization with updated settings
 */
const updateOrganizationSettings = (id: ID, settingsData: UpdateOrganizationSettingsDto): Promise<ApiResponse<OrganizationResponse>> => {
  return put<OrganizationResponse>(`${ORGANIZATIONS_ENDPOINT}/${id}/settings`, settingsData);
};

/**
 * Permanently deletes an organization
 * @param id - Organization ID
 * @returns Promise resolving when the organization is deleted
 */
const deleteOrganization = (id: ID): Promise<ApiResponse<void>> => {
  return deleteRequest<void>(`${ORGANIZATIONS_ENDPOINT}/${id}`);
};

/**
 * Fetches the current user's active organization
 * @returns Promise resolving to the current organization
 */
const getCurrentOrganization = (): Promise<ApiResponse<OrganizationDetailResponse>> => {
  return get<OrganizationDetailResponse>(`${ORGANIZATIONS_ENDPOINT}/current`);
};

/**
 * Switches the current user's active organization
 * @param organizationId - ID of the organization to switch to
 * @returns Promise resolving to the success status
 */
const switchOrganization = (organizationId: ID): Promise<ApiResponse<{ success: boolean }>> => {
  return post<{ success: boolean }>(`${ORGANIZATIONS_ENDPOINT}/switch`, { organizationId });
};

/**
 * Fetches summaries of organizations for coaches
 * @returns Promise resolving to a list of organization summaries
 */
const getOrganizationSummaries = (): Promise<ApiResponse<OrganizationSummary[]>> => {
  return get<OrganizationSummary[]>(`${ORGANIZATIONS_ENDPOINT}/coach`);
};

/**
 * Fetches a summary of a specific organization with key metrics
 * @param id - Organization ID
 * @returns Promise resolving to the organization summary
 */
const getOrganizationSummary = (id: ID): Promise<ApiResponse<OrganizationSummary>> => {
  return get<OrganizationSummary>(`${ORGANIZATIONS_ENDPOINT}/${id}/summary`);
};

/**
 * Uploads a logo for an organization
 * @param id - Organization ID
 * @param logoFile - Logo image file
 * @returns Promise resolving to the URL of the uploaded logo
 */
const uploadOrganizationLogo = (id: ID, logoFile: File): Promise<ApiResponse<{ logoUrl: string }>> => {
  const formData = new FormData();
  formData.append('logo', logoFile);
  
  return post<{ logoUrl: string }>(
    `${ORGANIZATIONS_ENDPOINT}/${id}/logo`, 
    formData, 
    { 'Content-Type': 'multipart/form-data' }
  );
};

/**
 * Sends an announcement to all members of an organization
 * @param id - Organization ID
 * @param announcementData - Announcement content and settings
 * @returns Promise resolving to the success status and number of recipients
 */
const sendOrganizationAnnouncement = (
  id: ID, 
  announcementData: OrganizationAnnouncementDto
): Promise<ApiResponse<{ success: boolean, recipientCount: number }>> => {
  return post<{ success: boolean, recipientCount: number }>(
    `${ORGANIZATIONS_ENDPOINT}/${id}/announcements`, 
    announcementData
  );
};

/**
 * Adds a user to an organization
 * @param organizationId - Organization ID
 * @param userData - User data including ID and role
 * @returns Promise resolving to the success status
 */
const addUserToOrganization = (
  organizationId: ID, 
  userData: { userId: ID, role: string }
): Promise<ApiResponse<{ success: boolean }>> => {
  return post<{ success: boolean }>(
    `${ORGANIZATIONS_ENDPOINT}/${organizationId}/users`,
    userData
  );
};

/**
 * Removes a user from an organization
 * @param organizationId - Organization ID
 * @param userId - User ID to remove
 * @returns Promise resolving to the success status
 */
const removeUserFromOrganization = (
  organizationId: ID, 
  userId: ID
): Promise<ApiResponse<{ success: boolean }>> => {
  return deleteRequest<{ success: boolean }>(
    `${ORGANIZATIONS_ENDPOINT}/${organizationId}/users/${userId}`
  );
};

export const organizationApi = {
  getOrganizations,
  getOrganizationById,
  getOrganizationWithUsers,
  getOrganizationWithTeams,
  getOrganizationWithUsersAndTeams,
  createOrganization,
  updateOrganization,
  updateOrganizationSettings,
  deleteOrganization,
  getCurrentOrganization,
  switchOrganization,
  getOrganizationSummaries,
  getOrganizationSummary,
  uploadOrganizationLogo,
  sendOrganizationAnnouncement,
  addUserToOrganization,
  removeUserFromOrganization
};