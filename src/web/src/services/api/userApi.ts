import { get, post, put, patch, delete } from './index';
import { ApiResponse, PaginatedApiResponse } from '../../types/api.types';
import { 
  UserResponse, 
  UserDetailResponse, 
  UserListResponse, 
  UserListParams, 
  CreateUserDto, 
  UpdateUserDto, 
  UpdateUserPreferencesDto, 
  UserInviteDto, 
  UserProfileResponse 
} from '../../types/user.types';
import { ID } from '../../types/common.types';

/**
 * API endpoints for user management operations
 */
const USER_ENDPOINTS = {
  BASE: '/users',
  CURRENT: '/users/me',
  INVITATIONS: '/users/invitations',
  PROFILE_IMAGE: '/users/profile-image',
  BY_TEAM: '/users/team'
};

/**
 * Fetches a paginated list of users with optional filtering
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Promise resolving to a paginated list of users
 */
export const getUsers = async (params: UserListParams): Promise<ApiResponse<UserListResponse>> => {
  return get<UserListResponse>(USER_ENDPOINTS.BASE, params);
};

/**
 * Fetches a single user by their ID
 * 
 * @param userId - ID of the user to fetch
 * @returns Promise resolving to detailed user data
 */
export const getUserById = async (userId: ID): Promise<ApiResponse<UserDetailResponse>> => {
  return get<UserDetailResponse>(`${USER_ENDPOINTS.BASE}/${userId}`);
};

/**
 * Fetches the profile of the currently authenticated user
 * 
 * @returns Promise resolving to the current user's profile data
 */
export const getCurrentUser = async (): Promise<ApiResponse<UserProfileResponse>> => {
  return get<UserProfileResponse>(USER_ENDPOINTS.CURRENT);
};

/**
 * Creates a new user with the provided data
 * 
 * @param userData - Data for the new user
 * @returns Promise resolving to the created user data
 */
export const createUser = async (userData: CreateUserDto): Promise<ApiResponse<UserResponse>> => {
  return post<UserResponse>(USER_ENDPOINTS.BASE, userData);
};

/**
 * Updates an existing user with the provided data
 * 
 * @param userId - ID of the user to update
 * @param userData - Updated user data
 * @returns Promise resolving to the updated user data
 */
export const updateUser = async (userId: ID, userData: UpdateUserDto): Promise<ApiResponse<UserResponse>> => {
  return put<UserResponse>(`${USER_ENDPOINTS.BASE}/${userId}`, userData);
};

/**
 * Updates the preferences for the current user
 * 
 * @param preferencesData - Updated preferences data
 * @returns Promise resolving to the updated user profile
 */
export const updateUserPreferences = async (preferencesData: UpdateUserPreferencesDto): Promise<ApiResponse<UserProfileResponse>> => {
  return patch<UserProfileResponse>(`${USER_ENDPOINTS.CURRENT}/preferences`, preferencesData);
};

/**
 * Deactivates a user by their ID
 * 
 * @param userId - ID of the user to deactivate
 * @returns Promise resolving to a success response
 */
export const deactivateUser = async (userId: ID): Promise<ApiResponse<{ success: boolean }>> => {
  return post<{ success: boolean }>(`${USER_ENDPOINTS.BASE}/${userId}/deactivate`);
};

/**
 * Activates a previously deactivated user by their ID
 * 
 * @param userId - ID of the user to activate
 * @returns Promise resolving to a success response
 */
export const activateUser = async (userId: ID): Promise<ApiResponse<{ success: boolean }>> => {
  return post<{ success: boolean }>(`${USER_ENDPOINTS.BASE}/${userId}/activate`);
};

/**
 * Permanently deletes a user by their ID
 * 
 * @param userId - ID of the user to delete
 * @returns Promise resolving to a success response
 */
export const deleteUser = async (userId: ID): Promise<ApiResponse<{ success: boolean }>> => {
  return delete<{ success: boolean }>(`${USER_ENDPOINTS.BASE}/${userId}`);
};

/**
 * Sends an invitation to a new user
 * 
 * @param inviteData - Data for the user invitation
 * @returns Promise resolving to a success response with invitation ID
 */
export const inviteUser = async (inviteData: UserInviteDto): Promise<ApiResponse<{ success: boolean, invitationId: string }>> => {
  return post<{ success: boolean, invitationId: string }>(USER_ENDPOINTS.INVITATIONS, inviteData);
};

/**
 * Resends an invitation to a previously invited user
 * 
 * @param invitationId - ID of the invitation to resend
 * @returns Promise resolving to a success response
 */
export const resendInvitation = async (invitationId: ID): Promise<ApiResponse<{ success: boolean }>> => {
  return post<{ success: boolean }>(`${USER_ENDPOINTS.INVITATIONS}/${invitationId}/resend`);
};

/**
 * Cancels a pending user invitation
 * 
 * @param invitationId - ID of the invitation to cancel
 * @returns Promise resolving to a success response
 */
export const cancelInvitation = async (invitationId: ID): Promise<ApiResponse<{ success: boolean }>> => {
  return delete<{ success: boolean }>(`${USER_ENDPOINTS.INVITATIONS}/${invitationId}`);
};

/**
 * Fetches a list of pending user invitations
 * 
 * @param params - Optional parameters like organizationId
 * @returns Promise resolving to a list of pending invitations
 */
export const getPendingInvitations = async (params: { organizationId?: ID } = {}): Promise<ApiResponse<{ invitations: Array<{ id: ID, email: string, role: string, createdAt: string }> }>> => {
  return get<{ invitations: Array<{ id: ID, email: string, role: string, createdAt: string }> }>(USER_ENDPOINTS.INVITATIONS, params);
};

/**
 * Uploads a profile image for the current user
 * 
 * @param formData - Form data containing the image file
 * @returns Promise resolving to the URL of the uploaded image
 */
export const uploadProfileImage = async (formData: FormData): Promise<ApiResponse<{ photoURL: string }>> => {
  return post<{ photoURL: string }>(USER_ENDPOINTS.PROFILE_IMAGE, formData);
};

/**
 * Fetches users belonging to a specific team
 * 
 * @param teamId - ID of the team
 * @param params - Optional pagination parameters
 * @returns Promise resolving to a paginated list of team members
 */
export const getUsersByTeam = async (teamId: ID, params: { page?: number, pageSize?: number } = {}): Promise<ApiResponse<UserListResponse>> => {
  return get<UserListResponse>(`${USER_ENDPOINTS.BY_TEAM}/${teamId}`, params);
};