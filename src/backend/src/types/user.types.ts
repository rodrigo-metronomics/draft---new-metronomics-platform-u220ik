/**
 * TypeScript type definitions for user-related entities in the Metronomics Platform.
 * This file defines interfaces, enums, and types for user data structures, including
 * user profiles, authentication, roles, and request/response interfaces for the API.
 */

import { UserRole } from '../utils/constants/roles';
import { AuthProvider } from './auth.types';

/**
 * Enum defining possible user account statuses
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  INACTIVE = 'INACTIVE'
}

/**
 * Minimal reference to organization to avoid circular dependency
 */
export interface OrganizationReference {
  id: string;
  name: string;
}

/**
 * Minimal reference to team to avoid circular dependency
 */
export interface TeamReference {
  id: string;
  name: string;
}

/**
 * Core user entity interface representing a user in the system
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string | null;
  authId: string;
  authProvider: AuthProvider;
  photoURL: string | null;
  preferences: UserPreferences;
  lastLoginAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User preferences configuration
 */
export interface UserPreferences {
  theme: string;
  timezone: string;
  notificationPreferences: NotificationPreferences;
  dashboardLayout: Record<string, any>;
  customFields: Record<string, any>;
}

/**
 * User notification preferences configuration
 */
export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  push: boolean;
  meetingReminders: boolean;
  actionItems: boolean;
  metricAlerts: boolean;
  teamUpdates: boolean;
  digestFrequency: string;
}

/**
 * Extended user interface that includes related entities like organization and teams
 */
export interface UserWithRelations extends User {
  organization: OrganizationReference | null;
  teams: TeamReference[];
}

/**
 * Minimal reference to user to avoid circular dependency
 */
export interface UserReference {
  id: string;
  name: string;
  email: string;
  photoURL: string | null;
}

/**
 * Data transfer object for creating a new user
 */
export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string | null;
  authId: string;
  authProvider: AuthProvider;
  photoURL: string | null;
  status: UserStatus;
}

/**
 * Data transfer object for updating an existing user
 */
export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  role: UserRole;
  photoURL: string | null;
  status: UserStatus;
}

/**
 * Data transfer object for updating a user's email
 */
export interface UpdateUserEmailDto {
  email: string;
}

/**
 * Data transfer object for updating user preferences
 */
export interface UpdateUserPreferencesDto {
  preferences: Partial<UserPreferences>;
}

/**
 * Data transfer object for inviting a new user
 */
export interface UserInviteDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  teamIds: string[];
}

/**
 * Response format for user data in API responses
 */
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string | null;
  photoURL: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Detailed response format for user data including relations
 */
export interface UserDetailResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  organization: OrganizationReference | null;
  teams: TeamReference[];
  photoURL: string | null;
  authProvider: AuthProvider;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response format for user profile data
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  organization: OrganizationReference | null;
  photoURL: string | null;
  preferences: UserPreferences;
  lastLoginAt: string | null;
}

/**
 * Response format for paginated user list in API responses
 */
export interface UserListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Interface for filtering users by various criteria
 */
export interface UserFilters {
  organizationId: string;
  role: UserRole;
  status: UserStatus;
  teamId: string;
  search: string;
  isActive: boolean;
}