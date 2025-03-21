/**
 * Provides mock organization data for testing purposes in the Metronomics Platform.
 * Contains predefined organization fixtures with various settings, configurations,
 * and relationships to support unit and integration tests.
 */

import { Organization, OrganizationSettings, OrganizationWithRelations } from '../../src/types/organization.types';

/**
 * Helper function to generate a mock organization with customizable properties
 * 
 * @param overrides - Optional partial organization object to override default values
 * @returns A mock organization object with default values overridden by provided properties
 */
export const generateMockOrganization = (overrides: Partial<Organization> = {}): Organization => {
  const defaultOrg: Organization = {
    id: 'org-123e4567-e89b-12d3-a456-426614174000',
    name: 'Acme Inc',
    settings: {
      theme: 'light',
      timezone: 'America/New_York',
      defaultMeetingDuration: 60,
      defaultMeetingReminders: [15, 5],
      logoUrl: null,
      customFields: {}
    },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  };

  return {
    ...defaultOrg,
    ...overrides,
    settings: {
      ...defaultOrg.settings,
      ...(overrides.settings || {})
    }
  };
};

/**
 * Helper function to generate a mock organization with related entities like users and teams
 * 
 * @param overrides - Optional partial organization with relations object to override default values
 * @returns A mock organization object with relations and default values overridden by provided properties
 */
export const generateMockOrganizationWithRelations = (
  overrides: Partial<OrganizationWithRelations> = {}
): OrganizationWithRelations => {
  const defaultOrg = generateMockOrganization(overrides);

  const orgWithRelations: OrganizationWithRelations = {
    ...defaultOrg,
    users: [
      {
        id: 'user-123e4567-e89b-12d3-a456-426614174001',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        role: 'CEO',
        status: 'ACTIVE',
        organizationId: defaultOrg.id,
        authId: 'auth-123',
        authProvider: 'EMAIL_PASSWORD',
        photoURL: null,
        preferences: {
          theme: 'light',
          timezone: 'America/New_York',
          notificationPreferences: {
            email: true,
            inApp: true,
            push: true,
            meetingReminders: true,
            actionItems: true,
            metricAlerts: true,
            teamUpdates: true,
            digestFrequency: 'daily'
          },
          dashboardLayout: {},
          customFields: {}
        },
        lastLoginAt: new Date('2023-01-15T00:00:00Z'),
        isActive: true,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-15T00:00:00Z')
      },
      {
        id: 'user-123e4567-e89b-12d3-a456-426614174002',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        name: 'Jane Smith',
        role: 'LEADERSHIP',
        status: 'ACTIVE',
        organizationId: defaultOrg.id,
        authId: 'auth-124',
        authProvider: 'EMAIL_PASSWORD',
        photoURL: null,
        preferences: {
          theme: 'light',
          timezone: 'America/Los_Angeles',
          notificationPreferences: {
            email: true,
            inApp: true,
            push: false,
            meetingReminders: true,
            actionItems: true,
            metricAlerts: true,
            teamUpdates: true,
            digestFrequency: 'weekly'
          },
          dashboardLayout: {},
          customFields: {}
        },
        lastLoginAt: new Date('2023-01-16T00:00:00Z'),
        isActive: true,
        createdAt: new Date('2023-01-02T00:00:00Z'),
        updatedAt: new Date('2023-01-16T00:00:00Z')
      }
    ],
    teams: [
      {
        id: 'team-123e4567-e89b-12d3-a456-426614174001',
        name: 'Executive Team',
        description: 'Company leadership team',
        organizationId: defaultOrg.id,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      },
      {
        id: 'team-123e4567-e89b-12d3-a456-426614174002',
        name: 'Marketing Team',
        description: 'Marketing department',
        organizationId: defaultOrg.id,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      }
    ]
  };

  return {
    ...orgWithRelations,
    ...overrides,
    users: [...(overrides.users || orgWithRelations.users)],
    teams: [...(overrides.teams || orgWithRelations.teams)]
  };
};

/**
 * A single mock organization for simple test cases
 */
export const mockOrganization: Organization = generateMockOrganization();

/**
 * A mock organization with custom theme settings for testing theme-specific functionality
 */
export const mockOrganizationWithCustomTheme: Organization = generateMockOrganization({
  id: 'org-123e4567-e89b-12d3-a456-426614174001',
  name: 'Acme Inc (Custom Theme)',
  settings: {
    theme: 'dark',
    timezone: 'America/New_York',
    defaultMeetingDuration: 60,
    defaultMeetingReminders: [15, 5],
    logoUrl: null,
    customFields: {}
  }
});

/**
 * A mock organization with a logo URL for testing logo display functionality
 */
export const mockOrganizationWithLogo: Organization = generateMockOrganization({
  id: 'org-123e4567-e89b-12d3-a456-426614174002',
  name: 'Acme Inc (With Logo)',
  settings: {
    theme: 'light',
    timezone: 'America/New_York',
    defaultMeetingDuration: 60,
    defaultMeetingReminders: [15, 5],
    logoUrl: 'https://example.com/logo.png',
    customFields: {}
  }
});

/**
 * A mock organization with custom meeting duration and reminder settings
 */
export const mockOrganizationWithCustomMeetingSettings: Organization = generateMockOrganization({
  id: 'org-123e4567-e89b-12d3-a456-426614174003',
  name: 'Acme Inc (Custom Meetings)',
  settings: {
    theme: 'light',
    timezone: 'America/Chicago',
    defaultMeetingDuration: 30,
    defaultMeetingReminders: [30, 10, 5],
    logoUrl: null,
    customFields: {
      defaultMeetingTemplate: 'daily-huddle'
    }
  }
});

/**
 * A mock organization with related entities (users, teams) for testing relational data
 */
export const mockOrganizationWithRelations: OrganizationWithRelations = generateMockOrganizationWithRelations();

/**
 * An array of multiple mock organizations for testing lists and filtering
 */
export const mockOrganizations: Organization[] = [
  mockOrganization,
  mockOrganizationWithCustomTheme,
  mockOrganizationWithLogo,
  mockOrganizationWithCustomMeetingSettings,
  generateMockOrganization({
    id: 'org-123e4567-e89b-12d3-a456-426614174004',
    name: 'XYZ Corp',
    settings: {
      theme: 'light',
      timezone: 'Europe/London',
      defaultMeetingDuration: 45,
      defaultMeetingReminders: [10],
      logoUrl: null,
      customFields: {}
    }
  })
];

/**
 * An array of multiple mock organizations with relations for testing lists with related data
 */
export const mockOrganizationsWithRelations: OrganizationWithRelations[] = [
  mockOrganizationWithRelations,
  generateMockOrganizationWithRelations({
    id: 'org-123e4567-e89b-12d3-a456-426614174005',
    name: 'XYZ Corp (With Relations)',
    settings: {
      theme: 'dark',
      timezone: 'Europe/London',
      defaultMeetingDuration: 45,
      defaultMeetingReminders: [10],
      logoUrl: 'https://example.com/xyz-logo.png',
      customFields: {}
    }
  })
];