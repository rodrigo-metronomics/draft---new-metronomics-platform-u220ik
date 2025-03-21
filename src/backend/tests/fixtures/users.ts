/**
 * Provides mock user data for testing purposes in the Metronomics Platform.
 * Contains predefined user fixtures with various roles, statuses, and relationships
 * to support unit and integration tests.
 */

import { 
  User, 
  UserWithRelations, 
  UserPreferences, 
  UserStatus 
} from '../../src/types/user.types';
import { UserRole } from '../../src/utils/constants/roles';
import { AuthProvider } from '../../src/types/auth.types';
import { mockOrganization } from './organizations';

/**
 * Helper function to generate a mock user with customizable properties
 * 
 * @param overrides - Optional partial user object to override default values
 * @returns A mock user object with default values overridden by provided properties
 */
export const generateMockUser = (overrides: Partial<User> = {}): User => {
  const defaultUser: User = {
    id: 'user-123e4567-e89b-12d3-a456-426614174000',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    role: UserRole.TEAM_MEMBER,
    status: UserStatus.ACTIVE,
    organizationId: mockOrganization.id,
    authId: 'auth-123456789',
    authProvider: AuthProvider.EMAIL_PASSWORD,
    photoURL: null,
    preferences: {
      theme: 'light',
      timezone: 'America/New_York',
      notificationPreferences: {
        email: true,
        inApp: true,
        push: false,
        meetingReminders: true,
        actionItems: true,
        metricAlerts: true,
        teamUpdates: true,
        digestFrequency: 'daily'
      },
      dashboardLayout: {},
      customFields: {}
    },
    lastLoginAt: new Date('2023-01-15T08:30:00Z'),
    isActive: true,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-15T08:30:00Z')
  };

  return {
    ...defaultUser,
    ...overrides,
    preferences: {
      ...defaultUser.preferences,
      ...(overrides.preferences || {}),
      notificationPreferences: {
        ...defaultUser.preferences.notificationPreferences,
        ...(overrides.preferences?.notificationPreferences || {})
      }
    }
  };
};

/**
 * Helper function to generate a mock user with related entities like organization and teams
 * 
 * @param overrides - Optional partial user with relations object to override default values
 * @returns A mock user object with relations and default values overridden by provided properties
 */
export const generateMockUserWithRelations = (
  overrides: Partial<UserWithRelations> = {}
): UserWithRelations => {
  const defaultUser = generateMockUser(overrides);

  const userWithRelations: UserWithRelations = {
    ...defaultUser,
    organization: {
      id: mockOrganization.id,
      name: mockOrganization.name
    },
    teams: [
      {
        id: 'team-123e4567-e89b-12d3-a456-426614174001',
        name: 'Executive Team'
      },
      {
        id: 'team-123e4567-e89b-12d3-a456-426614174002',
        name: 'Marketing Team'
      }
    ]
  };

  return {
    ...userWithRelations,
    ...overrides,
    organization: overrides.organization || userWithRelations.organization,
    teams: [...(overrides.teams || userWithRelations.teams)]
  };
};

/**
 * A single mock user for simple test cases
 */
export const mockUser: User = generateMockUser();

/**
 * A mock user with Coach role for testing coach-specific functionality
 */
export const mockCoach: User = generateMockUser({
  id: 'user-coach-e89b-12d3-a456-426614174000',
  email: 'coach@example.com',
  firstName: 'Sarah',
  lastName: 'Johnson',
  name: 'Sarah Johnson',
  role: UserRole.COACH,
  organizationId: null // Coaches can access multiple organizations
});

/**
 * A mock user with CEO role for testing CEO-specific functionality
 */
export const mockCEO: User = generateMockUser({
  id: 'user-ceo-e89b-12d3-a456-426614174000',
  email: 'ceo@example.com',
  firstName: 'Michael',
  lastName: 'Smith',
  name: 'Michael Smith',
  role: UserRole.CEO
});

/**
 * A mock user with Leadership role for testing leadership-specific functionality
 */
export const mockLeadership: User = generateMockUser({
  id: 'user-leadership-e89b-12d3-a456-426614174000',
  email: 'leadership@example.com',
  firstName: 'Lisa',
  lastName: 'Brown',
  name: 'Lisa Brown',
  role: UserRole.LEADERSHIP
});

/**
 * A mock user with Team Member role for testing team member-specific functionality
 */
export const mockTeamMember: User = generateMockUser({
  id: 'user-teammember-e89b-12d3-a456-426614174000',
  email: 'teammember@example.com',
  firstName: 'David',
  lastName: 'Wilson',
  name: 'David Wilson',
  role: UserRole.TEAM_MEMBER
});

/**
 * A mock user with Viewer role for testing viewer-specific functionality
 */
export const mockViewer: User = generateMockUser({
  id: 'user-viewer-e89b-12d3-a456-426614174000',
  email: 'viewer@example.com',
  firstName: 'Emma',
  lastName: 'Taylor',
  name: 'Emma Taylor',
  role: UserRole.VIEWER
});

/**
 * A mock user with pending status for testing invitation and onboarding flows
 */
export const mockPendingUser: User = generateMockUser({
  id: 'user-pending-e89b-12d3-a456-426614174000',
  email: 'pending@example.com',
  firstName: 'Robert',
  lastName: 'Miller',
  name: 'Robert Miller',
  status: UserStatus.PENDING,
  lastLoginAt: null,
  isActive: false
});

/**
 * A mock user with inactive status for testing deactivation flows
 */
export const mockInactiveUser: User = generateMockUser({
  id: 'user-inactive-e89b-12d3-a456-426614174000',
  email: 'inactive@example.com',
  firstName: 'Patricia',
  lastName: 'Garcia',
  name: 'Patricia Garcia',
  status: UserStatus.INACTIVE,
  isActive: false
});

/**
 * A mock user authenticated via Google for testing Google SSO
 */
export const mockGoogleUser: User = generateMockUser({
  id: 'user-google-e89b-12d3-a456-426614174000',
  email: 'google-user@example.com',
  firstName: 'James',
  lastName: 'Anderson',
  name: 'James Anderson',
  authProvider: AuthProvider.GOOGLE,
  authId: 'google-auth-123456',
  photoURL: 'https://example.com/google-profile.jpg'
});

/**
 * A mock user authenticated via Microsoft for testing Microsoft SSO
 */
export const mockMicrosoftUser: User = generateMockUser({
  id: 'user-microsoft-e89b-12d3-a456-426614174000',
  email: 'microsoft-user@example.com',
  firstName: 'Jennifer',
  lastName: 'Martinez',
  name: 'Jennifer Martinez',
  authProvider: AuthProvider.MICROSOFT,
  authId: 'microsoft-auth-123456',
  photoURL: 'https://example.com/microsoft-profile.jpg'
});

/**
 * A mock user with custom preferences for testing preference-specific functionality
 */
export const mockUserWithCustomPreferences: User = generateMockUser({
  id: 'user-custom-prefs-e89b-12d3-a456-426614174000',
  email: 'custom-prefs@example.com',
  firstName: 'Alex',
  lastName: 'Johnson',
  name: 'Alex Johnson',
  preferences: {
    theme: 'dark',
    timezone: 'Europe/London',
    notificationPreferences: {
      email: false,
      inApp: true,
      push: true,
      meetingReminders: true,
      actionItems: false,
      metricAlerts: true,
      teamUpdates: false,
      digestFrequency: 'weekly'
    },
    dashboardLayout: {
      widgets: [
        { id: 'upcoming-meetings', position: { x: 0, y: 0, w: 6, h: 4 } },
        { id: 'key-metrics', position: { x: 6, y: 0, w: 6, h: 4 } },
        { id: 'action-items', position: { x: 0, y: 4, w: 12, h: 4 } }
      ]
    },
    customFields: {
      favoriteMetrics: ['revenue', 'nps', 'customer-acquisition'],
      defaultMeetingType: 'daily-huddle'
    }
  }
});

/**
 * A mock user with related entities (organization, teams) for testing relational data
 */
export const mockUserWithRelations: UserWithRelations = generateMockUserWithRelations();

/**
 * An array of multiple mock users for testing lists and filtering
 */
export const mockUsers: User[] = [
  mockUser,
  mockCoach,
  mockCEO,
  mockLeadership,
  mockTeamMember,
  mockViewer,
  mockPendingUser,
  mockInactiveUser,
  mockGoogleUser,
  mockMicrosoftUser,
  mockUserWithCustomPreferences
];

/**
 * An array of multiple mock users with relations for testing lists with related data
 */
export const mockUsersWithRelations: UserWithRelations[] = [
  mockUserWithRelations,
  generateMockUserWithRelations({
    id: 'user-with-relations-2',
    email: 'user2@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    name: 'Jane Smith',
    role: UserRole.LEADERSHIP,
    teams: [
      {
        id: 'team-123e4567-e89b-12d3-a456-426614174001',
        name: 'Executive Team'
      }
    ]
  }),
  generateMockUserWithRelations({
    id: 'user-with-relations-3',
    email: 'user3@example.com',
    firstName: 'Bob',
    lastName: 'Johnson',
    name: 'Bob Johnson',
    role: UserRole.TEAM_MEMBER,
    teams: [
      {
        id: 'team-123e4567-e89b-12d3-a456-426614174002',
        name: 'Marketing Team'
      }
    ]
  })
];