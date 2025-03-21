import { ID, Timestamp, Status, PaginatedResult, PaginationParams } from './common.types';
import { UserRole } from '../utils/constants/roles';

/**
 * Core organization entity interface representing an organization in the Metronomics Platform
 * This is the fundamental data structure for organizations in the system.
 */
export interface Organization {
  /** Unique identifier for the organization */
  id: ID;
  /** Display name of the organization */
  name: string;
  /** Configuration settings for the organization */
  settings: OrganizationSettings;
  /** Current status of the organization (active, inactive, etc.) */
  status: Status;
  /** Timestamp when the organization was created */
  createdAt: Timestamp;
  /** Timestamp when the organization was last updated */
  updatedAt: Timestamp;
}

/**
 * Organization settings configuration interface
 * Contains all configurable preferences and settings for an organization.
 */
export interface OrganizationSettings {
  /** UI theme preference */
  theme: string;
  /** Preferred timezone for date/time display */
  timezone: string;
  /** Default meeting duration in minutes */
  defaultMeetingDuration: number;
  /** Default reminder times in minutes before meeting start */
  defaultMeetingReminders: number[];
  /** URL to organization logo, null if not set */
  logoUrl: string | null;
  /** Additional custom settings as key-value pairs */
  customFields: Record<string, any>;
}

/**
 * Extended organization interface that includes related entities
 * This includes users and teams that belong to the organization.
 */
export interface OrganizationWithRelations {
  /** Unique identifier for the organization */
  id: ID;
  /** Display name of the organization */
  name: string;
  /** Configuration settings for the organization */
  settings: OrganizationSettings;
  /** Users that belong to this organization */
  users: UserReference[];
  /** Teams within this organization */
  teams: TeamReference[];
  /** Current status of the organization */
  status: Status;
  /** Timestamp when the organization was created */
  createdAt: Timestamp;
  /** Timestamp when the organization was last updated */
  updatedAt: Timestamp;
}

/**
 * Minimal reference to organization to avoid circular dependencies
 * Used when only basic organization information is needed.
 */
export interface OrganizationReference {
  /** Unique identifier for the organization */
  id: ID;
  /** Display name of the organization */
  name: string;
}

/**
 * Minimal reference to user for organization context
 * Contains essential user information needed in organizational contexts.
 */
export interface UserReference {
  /** Unique identifier for the user */
  id: ID;
  /** Display name of the user */
  name: string;
  /** Email address of the user */
  email: string;
  /** Role of the user within the organization */
  role: UserRole;
  /** URL to user's profile photo, null if not set */
  photoURL: string | null;
}

/**
 * Minimal reference to team for organization context
 * Contains essential team information needed in organizational contexts.
 */
export interface TeamReference {
  /** Unique identifier for the team */
  id: ID;
  /** Display name of the team */
  name: string;
  /** Number of members in the team */
  memberCount: number;
}

/**
 * Data transfer object for creating a new organization
 * Contains the minimum required fields to create an organization.
 */
export interface CreateOrganizationDto {
  /** Display name for the new organization */
  name: string;
  /** Partial settings configuration, defaults will be applied for missing fields */
  settings: Partial<OrganizationSettings>;
}

/**
 * Data transfer object for updating an existing organization
 * Contains fields that can be updated on an organization.
 */
export interface UpdateOrganizationDto {
  /** New display name for the organization */
  name: string;
  /** Partial settings to update, existing settings will be preserved for missing fields */
  settings: Partial<OrganizationSettings>;
}

/**
 * Data transfer object for updating only organization settings
 * Used when only settings need to be updated.
 */
export interface UpdateOrganizationSettingsDto {
  /** Partial settings to update, existing settings will be preserved for missing fields */
  settings: Partial<OrganizationSettings>;
}

/**
 * Response format for organization data in API responses
 * Standard format returned from organization API endpoints.
 */
export interface OrganizationResponse {
  /** Unique identifier for the organization */
  id: ID;
  /** Display name of the organization */
  name: string;
  /** Configuration settings for the organization */
  settings: OrganizationSettings;
  /** Current status of the organization */
  status: Status;
  /** ISO date string when the organization was created */
  createdAt: string;
  /** ISO date string when the organization was last updated */
  updatedAt: string;
}

/**
 * Detailed response format for organization data including counts
 * Includes additional statistics about the organization.
 */
export interface OrganizationDetailResponse {
  /** Unique identifier for the organization */
  id: ID;
  /** Display name of the organization */
  name: string;
  /** Configuration settings for the organization */
  settings: OrganizationSettings;
  /** Total number of users in the organization */
  userCount: number;
  /** Total number of teams in the organization */
  teamCount: number;
  /** Current status of the organization */
  status: Status;
  /** ISO date string when the organization was created */
  createdAt: string;
  /** ISO date string when the organization was last updated */
  updatedAt: string;
}

/**
 * Response format for organization data including users
 * Used when user information is needed alongside organization data.
 */
export interface OrganizationWithUsersResponse {
  /** Unique identifier for the organization */
  id: ID;
  /** Display name of the organization */
  name: string;
  /** Configuration settings for the organization */
  settings: OrganizationSettings;
  /** Users that belong to this organization */
  users: UserReference[];
  /** Current status of the organization */
  status: Status;
  /** ISO date string when the organization was created */
  createdAt: string;
  /** ISO date string when the organization was last updated */
  updatedAt: string;
}

/**
 * Response format for organization data including teams
 * Used when team information is needed alongside organization data.
 */
export interface OrganizationWithTeamsResponse {
  /** Unique identifier for the organization */
  id: ID;
  /** Display name of the organization */
  name: string;
  /** Configuration settings for the organization */
  settings: OrganizationSettings;
  /** Teams within this organization */
  teams: TeamReference[];
  /** Current status of the organization */
  status: Status;
  /** ISO date string when the organization was created */
  createdAt: string;
  /** ISO date string when the organization was last updated */
  updatedAt: string;
}

/**
 * Response format for paginated organization list in API responses
 * Extends the generic PaginatedResult with OrganizationResponse items.
 */
export interface OrganizationListResponse extends PaginatedResult<OrganizationResponse> {}

/**
 * Simplified organization summary for coach dashboards
 * Contains essential information for displaying organizations in dashboards.
 */
export interface OrganizationSummary {
  /** Unique identifier for the organization */
  id: ID;
  /** Display name of the organization */
  name: string;
  /** Total number of users in the organization */
  userCount: number;
  /** Total number of teams in the organization */
  teamCount: number;
  /** Current status of the organization */
  status: Status;
}

/**
 * Interface for filtering organizations by user, coach, status, and search term
 * Used to filter organization lists based on criteria.
 */
export interface OrganizationFilters {
  /** Filter by user ID (organizations the user belongs to) */
  userId: ID | undefined;
  /** Filter by coach ID (organizations the coach has access to) */
  coachId: ID | undefined;
  /** Filter by organization status */
  status: Status | undefined;
  /** Text search term to match against organization name */
  search: string | undefined;
}

/**
 * Parameters for paginated organization lists with filtering
 * Combines organization filters with pagination parameters.
 */
export interface OrganizationListParams extends OrganizationFilters, PaginationParams {}

/**
 * Data transfer object for creating an organization-wide announcement
 * Used to create announcements visible to all organization members.
 */
export interface OrganizationAnnouncementDto {
  /** Title of the announcement */
  title: string;
  /** Content body of the announcement */
  content: string;
  /** Priority level determining how prominently the announcement is displayed */
  priority: 'low' | 'medium' | 'high';
  /** ISO date string when the announcement expires, null for no expiration */
  expiresAt: string | null;
}

/**
 * Data transfer object for inviting users to an organization
 * Used to send invitations to multiple email addresses at once.
 */
export interface OrganizationInviteDto {
  /** Email addresses to send invitations to */
  emails: string[];
  /** Role to assign to invited users */
  role: UserRole;
  /** Optional team IDs to automatically add users to */
  teamIds: ID[] | undefined;
  /** Optional personalized message to include in invitation */
  message: string | undefined;
}