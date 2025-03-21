import { UserRole } from '../utils/constants/roles';
import { AuthProvider } from './auth.types';
import { ID, Timestamp, Status, PaginatedResult, PaginationParams } from './common.types';

/**
 * Enum defining possible user account statuses in the system.
 */
export enum UserStatus {
  /** User account is active and can access the system */
  ACTIVE = 'active',
  /** User account is created but not yet activated (e.g., pending email verification) */
  PENDING = 'pending',
  /** User account is deactivated and cannot access the system */
  INACTIVE = 'inactive'
}

/**
 * Minimal reference to organization to avoid circular dependency.
 */
export interface OrganizationReference {
  /** Unique identifier for the organization */
  id: ID;
  /** Name of the organization */
  name: string;
}

/**
 * Minimal reference to team to avoid circular dependency.
 */
export interface TeamReference {
  /** Unique identifier for the team */
  id: ID;
  /** Name of the team */
  name: string;
}

/**
 * Core user entity interface representing a user in the system.
 */
export interface User {
  /** Unique identifier for the user */
  id: ID;
  /** Email address of the user, used for login and communication */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Combined full name (firstName + lastName) */
  name: string;
  /** User's role in the system, determining their permissions */
  role: UserRole;
  /** Current status of the user account */
  status: UserStatus;
  /** ID of the organization the user belongs to, null for multi-org users (e.g., coaches) */
  organizationId: ID | null;
  /** External authentication provider's user ID */
  authId: string;
  /** Authentication provider used by this user */
  authProvider: AuthProvider;
  /** URL to the user's profile photo, if available */
  photoURL: string | null;
  /** User's personal preferences for app configuration */
  preferences: UserPreferences;
  /** Timestamp of user's last login, null if never logged in */
  lastLoginAt: Timestamp | null;
  /** Whether the user account is currently active */
  isActive: boolean;
  /** Timestamp when the user was created */
  createdAt: Timestamp;
  /** Timestamp when the user was last updated */
  updatedAt: Timestamp;
}

/**
 * User preferences configuration.
 */
export interface UserPreferences {
  /** User's preferred UI theme */
  theme: string;
  /** User's timezone for date/time display */
  timezone: string;
  /** User's notification preferences */
  notificationPreferences: NotificationPreferences;
  /** User's customized dashboard layout */
  dashboardLayout: Record<string, any>;
  /** Additional custom preference fields */
  customFields: Record<string, any>;
}

/**
 * User notification preferences configuration.
 */
export interface NotificationPreferences {
  /** Whether to receive email notifications */
  email: boolean;
  /** Whether to receive in-app notifications */
  inApp: boolean;
  /** Whether to receive browser push notifications */
  push: boolean;
  /** Whether to receive meeting reminder notifications */
  meetingReminders: boolean;
  /** Whether to receive action item notifications */
  actionItems: boolean;
  /** Whether to receive metric alert notifications */
  metricAlerts: boolean;
  /** Whether to receive team update notifications */
  teamUpdates: boolean;
  /** How frequently to receive email digest notifications */
  digestFrequency: string;
}

/**
 * Extended user interface that includes related entities like organization and teams.
 */
export interface UserWithRelations extends User {
  /** Organization the user belongs to, null for multi-org users */
  organization: OrganizationReference | null;
  /** Teams the user belongs to */
  teams: TeamReference[];
}

/**
 * Minimal reference to user to avoid circular dependency.
 */
export interface UserReference {
  /** Unique identifier for the user */
  id: ID;
  /** User's full name */
  name: string;
  /** User's email address */
  email: string;
  /** URL to the user's profile photo, if available */
  photoURL: string | null;
}

/**
 * Data transfer object for creating a new user.
 */
export interface CreateUserDto {
  /** Email address for the new user */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Role to assign to the user */
  role: UserRole;
  /** ID of the organization to assign the user to, null for multi-org users */
  organizationId: ID | null;
  /** External authentication provider's user ID */
  authId: string;
  /** Authentication provider used by this user */
  authProvider: AuthProvider;
  /** URL to the user's profile photo, if available */
  photoURL: string | null;
  /** Initial status for the user account */
  status: UserStatus;
}

/**
 * Data transfer object for updating an existing user.
 */
export interface UpdateUserDto {
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Role to assign to the user */
  role: UserRole;
  /** URL to the user's profile photo, if available */
  photoURL: string | null;
  /** Status to set for the user account */
  status: UserStatus;
}

/**
 * Data transfer object for updating a user's email.
 */
export interface UpdateUserEmailDto {
  /** New email address for the user */
  email: string;
}

/**
 * Data transfer object for updating user preferences.
 */
export interface UpdateUserPreferencesDto {
  /** Partial user preferences to update */
  preferences: Partial<UserPreferences>;
}

/**
 * Data transfer object for inviting a new user.
 */
export interface UserInviteDto {
  /** Email address for the invited user */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Role to assign to the invited user */
  role: UserRole;
  /** ID of the organization to assign the user to */
  organizationId: ID;
  /** IDs of teams to assign the user to */
  teamIds: ID[];
}

/**
 * Response format for user data in API responses.
 */
export interface UserResponse {
  /** Unique identifier for the user */
  id: ID;
  /** Email address of the user */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Combined full name */
  name: string;
  /** User's role in the system */
  role: UserRole;
  /** Current status of the user account */
  status: UserStatus;
  /** ID of the organization the user belongs to, null for multi-org users */
  organizationId: ID | null;
  /** URL to the user's profile photo, if available */
  photoURL: string | null;
  /** Whether the user account is active */
  isActive: boolean;
  /** Timestamp of user's last login, null if never logged in */
  lastLoginAt: string | null;
  /** Timestamp when the user was created */
  createdAt: string;
  /** Timestamp when the user was last updated */
  updatedAt: string;
}

/**
 * Detailed response format for user data including relations.
 */
export interface UserDetailResponse {
  /** Unique identifier for the user */
  id: ID;
  /** Email address of the user */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Combined full name */
  name: string;
  /** User's role in the system */
  role: UserRole;
  /** Current status of the user account */
  status: UserStatus;
  /** Organization the user belongs to, null for multi-org users */
  organization: OrganizationReference | null;
  /** Teams the user belongs to */
  teams: TeamReference[];
  /** URL to the user's profile photo, if available */
  photoURL: string | null;
  /** Authentication provider used by this user */
  authProvider: AuthProvider;
  /** Whether the user account is active */
  isActive: boolean;
  /** Timestamp of user's last login, null if never logged in */
  lastLoginAt: string | null;
  /** Timestamp when the user was created */
  createdAt: string;
  /** Timestamp when the user was last updated */
  updatedAt: string;
}

/**
 * Response format for user profile data.
 */
export interface UserProfileResponse {
  /** Unique identifier for the user */
  id: ID;
  /** Email address of the user */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Combined full name */
  name: string;
  /** User's role in the system */
  role: UserRole;
  /** Organization the user belongs to, null for multi-org users */
  organization: OrganizationReference | null;
  /** URL to the user's profile photo, if available */
  photoURL: string | null;
  /** User's personal preferences for app configuration */
  preferences: UserPreferences;
  /** Timestamp of user's last login, null if never logged in */
  lastLoginAt: string | null;
}

/**
 * Response format for paginated user list in API responses.
 */
export interface UserListResponse {
  /** Array of user data */
  users: UserResponse[];
  /** Total number of users matching the filter criteria */
  total: number;
  /** Current page number */
  page: number;
  /** Number of users per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * Interface for filtering users by various criteria.
 */
export interface UserFilters {
  /** Filter by organization ID */
  organizationId: ID | undefined;
  /** Filter by user role */
  role: UserRole | undefined;
  /** Filter by user status */
  status: UserStatus | undefined;
  /** Filter by team ID */
  teamId: ID | undefined;
  /** Search by name or email */
  search: string | undefined;
  /** Filter by active status */
  isActive: boolean | undefined;
}

/**
 * Parameters for paginated user lists with filtering.
 */
export interface UserListParams extends UserFilters, PaginationParams {
}

/**
 * Interface for tracking user presence and activity status.
 */
export interface UserPresence {
  /** ID of the user */
  userId: ID;
  /** Current online status */
  status: 'online' | 'away' | 'offline';
  /** Timestamp of last activity */
  lastActive: Timestamp;
  /** Description of current activity, if available */
  currentActivity: string | null;
}