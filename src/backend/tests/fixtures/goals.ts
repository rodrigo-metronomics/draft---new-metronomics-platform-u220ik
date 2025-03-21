/**
 * Provides mock goal data for testing purposes in the Metronomics Platform.
 * Contains predefined goal fixtures with various types, statuses, and configurations
 * to support unit and integration tests for the strategic planning features.
 */

import { 
  Goal, 
  GoalType, 
  GoalStatus, 
  GoalWithMilestones, 
  Milestone, 
  MilestoneStatus,
  GoalWithMetrics,
  MetricReference,
  GoalWithMilestonesAndMetrics
} from '../../src/types/goal.types';
import { mockOrganization, mockOrganizations } from './organizations';

/**
 * Helper function to generate a mock goal with customizable properties
 * 
 * @param overrides - Optional partial goal object to override default values
 * @returns A mock goal object with default values overridden by provided properties
 */
export const generateMockGoal = (overrides: Partial<Goal> = {}): Goal => {
  const defaultGoal: Goal = {
    id: 'goal-123e4567-e89b-12d3-a456-426614174000',
    type: GoalType.ONE_HAG,
    title: 'Increase revenue to $10M',
    description: 'Achieve $10M in annual recurring revenue by end of fiscal year',
    startDate: new Date('2023-01-01T00:00:00Z'),
    endDate: new Date('2023-12-31T23:59:59Z'),
    status: GoalStatus.ACTIVE,
    progress: 65,
    organizationId: mockOrganization.id,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-06-15T00:00:00Z')
  };

  return {
    ...defaultGoal,
    ...overrides
  };
};

/**
 * Helper function to generate a mock milestone with customizable properties
 * 
 * @param overrides - Optional partial milestone object to override default values
 * @returns A mock milestone object with default values overridden by provided properties
 */
export const generateMockMilestone = (overrides: Partial<Milestone> = {}): Milestone => {
  const defaultMilestone: Milestone = {
    id: 'milestone-123e4567-e89b-12d3-a456-426614174000',
    title: 'Q2 Revenue Target',
    description: 'Reach $5M in revenue by end of Q2',
    dueDate: new Date('2023-06-30T23:59:59Z'),
    status: MilestoneStatus.COMPLETED,
    goalId: 'goal-123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-07-01T00:00:00Z')
  };

  return {
    ...defaultMilestone,
    ...overrides
  };
};

/**
 * Helper function to generate a mock goal with associated milestones
 * 
 * @param overrides - Optional partial goal with milestones object to override default values
 * @returns A mock goal with milestones and default values overridden by provided properties
 */
export const generateMockGoalWithMilestones = (overrides: Partial<GoalWithMilestones> = {}): GoalWithMilestones => {
  const defaultGoal = generateMockGoal(overrides);
  
  const defaultGoalWithMilestones: GoalWithMilestones = {
    ...defaultGoal,
    milestones: [
      generateMockMilestone({
        id: 'milestone-123e4567-e89b-12d3-a456-426614174001',
        title: 'Q1 Revenue Target',
        description: 'Reach $2.5M in revenue by end of Q1',
        dueDate: new Date('2023-03-31T23:59:59Z'),
        status: MilestoneStatus.COMPLETED,
        goalId: defaultGoal.id
      }),
      generateMockMilestone({
        id: 'milestone-123e4567-e89b-12d3-a456-426614174002',
        title: 'Q2 Revenue Target',
        description: 'Reach $5M in revenue by end of Q2',
        dueDate: new Date('2023-06-30T23:59:59Z'),
        status: MilestoneStatus.COMPLETED,
        goalId: defaultGoal.id
      }),
      generateMockMilestone({
        id: 'milestone-123e4567-e89b-12d3-a456-426614174003',
        title: 'Q3 Revenue Target',
        description: 'Reach $7.5M in revenue by end of Q3',
        dueDate: new Date('2023-09-30T23:59:59Z'),
        status: MilestoneStatus.IN_PROGRESS,
        goalId: defaultGoal.id
      }),
      generateMockMilestone({
        id: 'milestone-123e4567-e89b-12d3-a456-426614174004',
        title: 'Q4 Revenue Target',
        description: 'Reach $10M in revenue by end of Q4',
        dueDate: new Date('2023-12-31T23:59:59Z'),
        status: MilestoneStatus.PENDING,
        goalId: defaultGoal.id
      })
    ]
  };

  return {
    ...defaultGoalWithMilestones,
    ...overrides,
    milestones: overrides.milestones || defaultGoalWithMilestones.milestones
  };
};

/**
 * Helper function to generate a mock goal with associated metrics
 * 
 * @param overrides - Optional partial goal with metrics object to override default values
 * @returns A mock goal with metrics and default values overridden by provided properties
 */
export const generateMockGoalWithMetrics = (overrides: Partial<GoalWithMetrics> = {}): GoalWithMetrics => {
  const defaultGoal = generateMockGoal(overrides);
  
  const defaultGoalWithMetrics: GoalWithMetrics = {
    ...defaultGoal,
    metrics: [
      {
        id: 'metric-123e4567-e89b-12d3-a456-426614174001',
        name: 'Monthly Recurring Revenue'
      },
      {
        id: 'metric-123e4567-e89b-12d3-a456-426614174002',
        name: 'Customer Acquisition Cost'
      },
      {
        id: 'metric-123e4567-e89b-12d3-a456-426614174003',
        name: 'Customer Lifetime Value'
      }
    ]
  };

  return {
    ...defaultGoalWithMetrics,
    ...overrides,
    metrics: overrides.metrics || defaultGoalWithMetrics.metrics
  };
};

/**
 * Helper function to generate a mock goal with both milestones and metrics
 * 
 * @param overrides - Optional partial goal with milestones and metrics object to override default values
 * @returns A mock goal with both milestones and metrics, with default values overridden by provided properties
 */
export const generateMockGoalWithMilestonesAndMetrics = (
  overrides: Partial<GoalWithMilestonesAndMetrics> = {}
): GoalWithMilestonesAndMetrics => {
  const goalWithMilestones = generateMockGoalWithMilestones(overrides);
  const goalWithMetrics = generateMockGoalWithMetrics(overrides);
  
  const defaultGoalWithBoth: GoalWithMilestonesAndMetrics = {
    ...goalWithMilestones,
    metrics: goalWithMetrics.metrics
  };

  return {
    ...defaultGoalWithBoth,
    ...overrides,
    milestones: overrides.milestones || defaultGoalWithBoth.milestones,
    metrics: overrides.metrics || defaultGoalWithBoth.metrics
  };
};

// Different goal types
export const mockBHAG: Goal = generateMockGoal({
  id: 'goal-bhag-4567-e89b-12d3-a456-426614174000',
  type: GoalType.BHAG,
  title: 'Become a $100M company',
  description: 'Transform into a $100M revenue company with global presence by 2030',
  startDate: new Date('2023-01-01T00:00:00Z'),
  endDate: new Date('2030-12-31T23:59:59Z'),
  progress: 15
});

export const mockThreeHAG: Goal = generateMockGoal({
  id: 'goal-3hag-4567-e89b-12d3-a456-426614174000',
  type: GoalType.THREE_HAG,
  title: 'Reach $30M annual revenue',
  description: 'Achieve $30M in annual recurring revenue with 20% EBITDA by 2025',
  startDate: new Date('2023-01-01T00:00:00Z'),
  endDate: new Date('2025-12-31T23:59:59Z'),
  progress: 25
});

export const mockOneHAG: Goal = generateMockGoal({
  id: 'goal-1hag-4567-e89b-12d3-a456-426614174000',
  type: GoalType.ONE_HAG,
  title: 'Increase revenue to $10M',
  description: 'Achieve $10M in annual recurring revenue by end of fiscal year',
  startDate: new Date('2023-01-01T00:00:00Z'),
  endDate: new Date('2023-12-31T23:59:59Z'),
  progress: 65
});

export const mockQuarterlyGoal: Goal = generateMockGoal({
  id: 'goal-q2-4567-e89b-12d3-a456-426614174000',
  type: GoalType.QUARTERLY,
  title: 'Q2 Sales Target',
  description: 'Reach $2.5M in new sales during Q2 2023',
  startDate: new Date('2023-04-01T00:00:00Z'),
  endDate: new Date('2023-06-30T23:59:59Z'),
  progress: 90
});

// Goals with different statuses
export const mockDraftGoal: Goal = generateMockGoal({
  id: 'goal-draft-567-e89b-12d3-a456-426614174000',
  title: 'Expand to European Market',
  description: 'Initial plan for European market expansion',
  status: GoalStatus.DRAFT,
  progress: 0
});

export const mockActiveGoal: Goal = generateMockGoal({
  id: 'goal-active-567-e89b-12d3-a456-426614174000',
  title: 'Improve Customer Retention',
  description: 'Increase customer retention rate to 95%',
  status: GoalStatus.ACTIVE,
  progress: 45
});

export const mockAtRiskGoal: Goal = generateMockGoal({
  id: 'goal-risk-567-e89b-12d3-a456-426614174000',
  title: 'Launch Mobile Application',
  description: 'Develop and launch mobile app for iOS and Android',
  status: GoalStatus.AT_RISK,
  progress: 30
});

export const mockCompletedGoal: Goal = generateMockGoal({
  id: 'goal-done-567-e89b-12d3-a456-426614174000',
  title: 'Redesign Company Website',
  description: 'Complete redesign of company website for better conversion',
  status: GoalStatus.COMPLETED,
  progress: 100
});

export const mockArchivedGoal: Goal = generateMockGoal({
  id: 'goal-arch-567-e89b-12d3-a456-426614174000',
  title: 'Legacy System Migration',
  description: 'Migrate from legacy CRM to new platform',
  status: GoalStatus.ARCHIVED,
  progress: 100,
  startDate: new Date('2022-01-01T00:00:00Z'),
  endDate: new Date('2022-12-31T23:59:59Z')
});

// Goals with related entities
export const mockGoalWithMilestones: GoalWithMilestones = generateMockGoalWithMilestones();
export const mockGoalWithMetrics: GoalWithMetrics = generateMockGoalWithMetrics();
export const mockGoalWithMilestonesAndMetrics: GoalWithMilestonesAndMetrics = generateMockGoalWithMilestonesAndMetrics();

// Milestone samples with different statuses
export const mockMilestone: Milestone = generateMockMilestone();

export const mockPendingMilestone: Milestone = generateMockMilestone({
  id: 'milestone-pending-67-e89b-12d3-a456-426614174000',
  title: 'Q4 Marketing Campaign',
  description: 'Launch Q4 holiday marketing campaign',
  dueDate: new Date('2023-11-01T00:00:00Z'),
  status: MilestoneStatus.PENDING
});

export const mockInProgressMilestone: Milestone = generateMockMilestone({
  id: 'milestone-progress-7-e89b-12d3-a456-426614174000',
  title: 'Product Feature Deployment',
  description: 'Deploy new product features to production',
  dueDate: new Date('2023-08-15T00:00:00Z'),
  status: MilestoneStatus.IN_PROGRESS
});

export const mockCompletedMilestone: Milestone = generateMockMilestone({
  id: 'milestone-complete-7-e89b-12d3-a456-426614174000',
  title: 'Investor Presentation',
  description: 'Prepare and deliver Q2 investor presentation',
  dueDate: new Date('2023-07-15T00:00:00Z'),
  status: MilestoneStatus.COMPLETED
});

export const mockMissedMilestone: Milestone = generateMockMilestone({
  id: 'milestone-missed-7-e89b-12d3-a456-426614174000',
  title: 'Certification Completion',
  description: 'Complete industry certification process',
  dueDate: new Date('2023-05-01T00:00:00Z'),
  status: MilestoneStatus.MISSED
});

// Arrays of mock data
export const mockGoals: Goal[] = [
  mockBHAG,
  mockThreeHAG,
  mockOneHAG,
  mockQuarterlyGoal,
  mockDraftGoal,
  mockActiveGoal,
  mockAtRiskGoal,
  mockCompletedGoal,
  mockArchivedGoal
];

export const mockMilestones: Milestone[] = [
  mockMilestone,
  mockPendingMilestone,
  mockInProgressMilestone,
  mockCompletedMilestone,
  mockMissedMilestone
];