/**
 * Provides mock team data for testing purposes in the Metronomics Platform.
 * Contains predefined team fixtures with various configurations, members, and
 * relationships to support unit and integration tests.
 */

import { 
  Team, 
  TeamRole, 
  TeamMember, 
  TeamWithRelations, 
  TeamMemberWithUser 
} from '../../src/types/team.types';
import { User } from '../../src/types/user.types';
import { mockOrganization } from './organizations';
import { 
  mockUser, 
  mockLeadership, 
  mockTeamMember as mockTeamMemberUser 
} from './users';

/**
 * Helper function to generate a mock team with customizable properties
 * 
 * @param overrides - Optional partial team object to override default values
 * @returns A mock team object with default values overridden by provided properties
 */
export const generateMockTeam = (overrides: Partial<Team> = {}): Team => {
  const defaultTeam: Team = {
    id: 'team-123e4567-e89b-12d3-a456-426614174000',
    name: 'Executive Team',
    description: 'Leadership team for strategic decision making',
    organizationId: mockOrganization.id,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  };

  return {
    ...defaultTeam,
    ...overrides
  };
};

/**
 * Helper function to generate a mock team member with customizable properties
 * 
 * @param overrides - Optional partial team member object to override default values
 * @returns A mock team member object with default values overridden by provided properties
 */
export const generateMockTeamMember = (overrides: Partial<TeamMember> = {}): TeamMember => {
  const defaultTeamMember: TeamMember = {
    id: 'team-member-123e4567-e89b-12d3-a456-426614174000',
    teamId: 'team-123e4567-e89b-12d3-a456-426614174000',
    userId: mockUser.id,
    role: TeamRole.MEMBER,
    joinedAt: new Date('2023-01-02T00:00:00Z')
  };

  return {
    ...defaultTeamMember,
    ...overrides
  };
};

/**
 * Helper function to generate a mock team with related entities like members
 * 
 * @param overrides - Optional partial team with relations object to override default values
 * @returns A mock team object with relations and default values overridden by provided properties
 */
export const generateMockTeamWithRelations = (
  overrides: Partial<TeamWithRelations> = {}
): TeamWithRelations => {
  const defaultTeam = generateMockTeam(overrides);

  const teamWithRelations: TeamWithRelations = {
    ...defaultTeam,
    members: [
      {
        id: 'team-member-lead-123e4567-e89b-12d3-a456-426614174000',
        teamId: defaultTeam.id,
        userId: mockLeadership.id,
        role: TeamRole.LEAD,
        joinedAt: new Date('2023-01-02T00:00:00Z'),
        user: {
          id: mockLeadership.id,
          name: mockLeadership.name,
          email: mockLeadership.email
        }
      },
      {
        id: 'team-member-regular-123e4567-e89b-12d3-a456-426614174000',
        teamId: defaultTeam.id,
        userId: mockTeamMemberUser.id,
        role: TeamRole.MEMBER,
        joinedAt: new Date('2023-01-03T00:00:00Z'),
        user: {
          id: mockTeamMemberUser.id,
          name: mockTeamMemberUser.name,
          email: mockTeamMemberUser.email
        }
      }
    ]
  };

  return {
    ...teamWithRelations,
    ...overrides,
    members: [...(overrides.members || teamWithRelations.members)]
  };
};

/**
 * A single mock team for simple test cases
 */
export const mockTeam: Team = generateMockTeam();

/**
 * A mock marketing team for testing department-specific functionality
 */
export const mockMarketingTeam: Team = generateMockTeam({
  id: 'team-marketing-e89b-12d3-a456-426614174000',
  name: 'Marketing Team',
  description: 'Team responsible for brand, marketing strategy and campaigns'
});

/**
 * A mock sales team for testing department-specific functionality
 */
export const mockSalesTeam: Team = generateMockTeam({
  id: 'team-sales-e89b-12d3-a456-426614174000',
  name: 'Sales Team',
  description: 'Team responsible for customer acquisition and account management'
});

/**
 * A mock product team for testing department-specific functionality
 */
export const mockProductTeam: Team = generateMockTeam({
  id: 'team-product-e89b-12d3-a456-426614174000',
  name: 'Product Team',
  description: 'Team responsible for product development and innovation'
});

/**
 * A single mock team member for simple test cases
 */
export const mockTeamMember: TeamMember = generateMockTeamMember();

/**
 * A mock team member with lead role for testing lead-specific functionality
 */
export const mockTeamLead: TeamMember = generateMockTeamMember({
  id: 'team-member-lead-123e4567-e89b-12d3-a456-426614174000',
  userId: mockLeadership.id,
  role: TeamRole.LEAD
});

/**
 * A mock team with related entities (members) for testing relational data
 */
export const mockTeamWithRelations: TeamWithRelations = generateMockTeamWithRelations();

/**
 * An array of multiple mock teams for testing lists and filtering
 */
export const mockTeams: Team[] = [
  mockTeam,
  mockMarketingTeam,
  mockSalesTeam,
  mockProductTeam,
  generateMockTeam({
    id: 'team-engineering-e89b-12d3-a456-426614174000',
    name: 'Engineering Team',
    description: 'Team responsible for software development and infrastructure'
  }),
  generateMockTeam({
    id: 'team-finance-e89b-12d3-a456-426614174000',
    name: 'Finance Team',
    description: 'Team responsible for financial planning and accounting'
  })
];

/**
 * An array of multiple mock team members for testing lists and filtering
 */
export const mockTeamMembers: TeamMember[] = [
  mockTeamMember,
  mockTeamLead,
  generateMockTeamMember({
    id: 'team-member-marketing-lead-123e4567-e89b-12d3-a456-426614174000',
    teamId: mockMarketingTeam.id,
    userId: 'user-leadership-marketing-id',
    role: TeamRole.LEAD
  }),
  generateMockTeamMember({
    id: 'team-member-marketing-1-123e4567-e89b-12d3-a456-426614174000',
    teamId: mockMarketingTeam.id,
    userId: 'user-marketing-1-id',
    role: TeamRole.MEMBER
  }),
  generateMockTeamMember({
    id: 'team-member-sales-lead-123e4567-e89b-12d3-a456-426614174000',
    teamId: mockSalesTeam.id,
    userId: 'user-leadership-sales-id',
    role: TeamRole.LEAD
  })
];

/**
 * An array of multiple mock teams with relations for testing lists with related data
 */
export const mockTeamsWithRelations: TeamWithRelations[] = [
  mockTeamWithRelations,
  generateMockTeamWithRelations({
    id: mockMarketingTeam.id,
    name: mockMarketingTeam.name,
    description: mockMarketingTeam.description,
    members: [
      {
        id: 'team-member-marketing-lead-123e4567-e89b-12d3-a456-426614174000',
        teamId: mockMarketingTeam.id,
        userId: 'user-leadership-marketing-id',
        role: TeamRole.LEAD,
        joinedAt: new Date('2023-01-02T00:00:00Z'),
        user: {
          id: 'user-leadership-marketing-id',
          name: 'Marketing Lead',
          email: 'marketing-lead@example.com'
        }
      },
      {
        id: 'team-member-marketing-1-123e4567-e89b-12d3-a456-426614174000',
        teamId: mockMarketingTeam.id,
        userId: 'user-marketing-1-id',
        role: TeamRole.MEMBER,
        joinedAt: new Date('2023-01-03T00:00:00Z'),
        user: {
          id: 'user-marketing-1-id',
          name: 'Marketing Member',
          email: 'marketing-member@example.com'
        }
      }
    ]
  }),
  generateMockTeamWithRelations({
    id: mockSalesTeam.id,
    name: mockSalesTeam.name,
    description: mockSalesTeam.description,
    members: [
      {
        id: 'team-member-sales-lead-123e4567-e89b-12d3-a456-426614174000',
        teamId: mockSalesTeam.id,
        userId: 'user-leadership-sales-id',
        role: TeamRole.LEAD,
        joinedAt: new Date('2023-01-02T00:00:00Z'),
        user: {
          id: 'user-leadership-sales-id',
          name: 'Sales Lead',
          email: 'sales-lead@example.com'
        }
      }
    ]
  })
];