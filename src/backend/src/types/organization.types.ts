/**
 * TypeScript type definitions for organization-related entities in the Metronomics Platform.
 * This file defines interfaces, enums, and types for organization data structures, including
 * organization profiles, settings, and request/response interfaces for the API.
 * 
 * The organization is a core entity in the multi-tenant architecture, serving as the
 * container for users, teams, and all business data.
 */

import { UserRole } from '../utils/constants/roles';
import { User } from './user.types';
import { Team } from './team.types';

/**
 * Core organization entity interface representing an organization in the system
 */
export interface Organization {
  id: string;
  name: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization settings configuration
 */
export interface OrganizationSettings {
  theme: string;
  timezone: string;
  defaultMeetingDuration: number;
  defaultMeetingReminders: number[];
  logoUrl: string | null;
  customFields: Record<string, any>;
}

/**
 * Extended organization interface that includes related entities like users and teams
 */
export interface OrganizationWithRelations {
  id: string;
  name: string;
  settings: OrganizationSettings;
  users: User[];
  teams: Team[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Minimal reference to organization to avoid circular dependency
 */
export interface OrganizationReference {
  id: string;
  name: string;
}

/**
 * Data transfer object for creating a new organization
 */
export interface CreateOrganizationDto {
  name: string;
  settings: Partial<OrganizationSettings>;
}

/**
 * Data transfer object for updating an existing organization
 */
export interface UpdateOrganizationDto {
  name: string;
  settings: Partial<OrganizationSettings>;
}

/**
 * Data transfer object for updating only organization settings
 */
export interface UpdateOrganizationSettingsDto {
  settings: Partial<OrganizationSettings>;
}

/**
 * Response format for organization data in API responses
 */
export interface OrganizationResponse {
  id: string;
  name: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

/**
 * Detailed response format for organization data including counts
 */
export interface OrganizationDetailResponse {
  id: string;
  name: string;
  settings: OrganizationSettings;
  userCount: number;
  teamCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified user response for organization context
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL: string | null;
  isActive: boolean;
}

/**
 * Simplified team response for organization context
 */
export interface TeamResponse {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

/**
 * Response format for organization data including users
 */
export interface OrganizationWithUsersResponse {
  id: string;
  name: string;
  settings: OrganizationSettings;
  users: UserResponse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Response format for organization data including teams
 */
export interface OrganizationWithTeamsResponse {
  id: string;
  name: string;
  settings: OrganizationSettings;
  teams: TeamResponse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Response format for paginated organization list in API responses
 */
export interface OrganizationListResponse {
  organizations: OrganizationResponse[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Simplified organization summary for coach dashboards
 */
export interface OrganizationSummary {
  id: string;
  name: string;
  userCount: number;
  teamCount: number;
}

/**
 * Interface for filtering organizations by user, coach, and search term
 */
export interface OrganizationFilters {
  userId: string;
  coachId: string;
  search: string;
}

/**
 * Data transfer object for creating an organization-wide announcement
 */
export interface OrganizationAnnouncementDto {
  title: string;
  content: string;
}