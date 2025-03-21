/**
 * Provides mock action item data for testing purposes in the Metronomics Platform.
 * Contains predefined action item fixtures with various statuses, priorities, and
 * associations to meetings and users to support unit and integration tests.
 */

import { 
  ActionItem, 
  ActionItemStatus, 
  ActionItemPriority 
} from '../../src/types/action-item.types';
import { mockUser, mockUsers } from './users';
import { mockMeeting, mockMeetings } from './meetings';
import { mockOrganization } from './organizations';

/**
 * Helper function to generate a mock action item with customizable properties
 * 
 * @param overrides - Optional partial action item object to override default values
 * @returns A mock action item object with default values overridden by provided properties
 */
export const generateMockActionItem = (overrides: Partial<ActionItem> = {}): ActionItem => {
  const defaultActionItem: ActionItem = {
    id: 'action-123e4567-e89b-12d3-a456-426614174000',
    description: 'Complete the quarterly forecast',
    status: ActionItemStatus.PENDING,
    priority: ActionItemPriority.MEDIUM,
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    assigneeId: mockUser.id,
    meetingId: mockMeeting.id,
    organizationId: mockOrganization.id,
    notes: 'Include the updated sales projections from the marketing team',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null
  };

  return {
    ...defaultActionItem,
    ...overrides
  };
};

/**
 * A single mock action item for simple test cases
 */
export const mockActionItem: ActionItem = generateMockActionItem();

/**
 * A mock action item with PENDING status
 */
export const mockPendingActionItem: ActionItem = generateMockActionItem({
  id: 'action-pending-e89b-12d3-a456-426614174000',
  description: 'Prepare slides for the board meeting',
  status: ActionItemStatus.PENDING
});

/**
 * A mock action item with IN_PROGRESS status
 */
export const mockInProgressActionItem: ActionItem = generateMockActionItem({
  id: 'action-inprogress-e89b-12d3-a456-426614174000',
  description: 'Conduct user interviews for new feature',
  status: ActionItemStatus.IN_PROGRESS,
  notes: 'Focusing on enterprise customers first'
});

/**
 * A mock action item with COMPLETED status
 */
export const mockCompletedActionItem: ActionItem = generateMockActionItem({
  id: 'action-completed-e89b-12d3-a456-426614174000',
  description: 'Submit Q1 performance reports',
  status: ActionItemStatus.COMPLETED,
  completedAt: new Date(Date.now() - 86400000) // Yesterday
});

/**
 * A mock action item with BLOCKED status
 */
export const mockBlockedActionItem: ActionItem = generateMockActionItem({
  id: 'action-blocked-e89b-12d3-a456-426614174000',
  description: 'Launch marketing campaign',
  status: ActionItemStatus.BLOCKED,
  notes: 'Blocked by legal approval on messaging'
});

/**
 * A mock action item with CANCELLED status
 */
export const mockCancelledActionItem: ActionItem = generateMockActionItem({
  id: 'action-cancelled-e89b-12d3-a456-426614174000',
  description: 'Organize team building retreat',
  status: ActionItemStatus.CANCELLED,
  notes: 'Cancelled due to budget constraints'
});

/**
 * A mock action item with HIGH priority
 */
export const mockHighPriorityActionItem: ActionItem = generateMockActionItem({
  id: 'action-highpriority-e89b-12d3-a456-426614174000',
  description: 'Fix critical security vulnerability',
  priority: ActionItemPriority.HIGH,
  notes: 'Security team identified this as a high risk'
});

/**
 * A mock action item with CRITICAL priority
 */
export const mockCriticalPriorityActionItem: ActionItem = generateMockActionItem({
  id: 'action-criticalpriority-e89b-12d3-a456-426614174000',
  description: 'Resolve production outage',
  priority: ActionItemPriority.CRITICAL,
  notes: 'Affecting all customers, immediate action required'
});

/**
 * A mock action item with a past due date
 */
export const mockOverdueActionItem: ActionItem = generateMockActionItem({
  id: 'action-overdue-e89b-12d3-a456-426614174000',
  description: 'Complete the customer feedback analysis',
  dueDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
  status: ActionItemStatus.PENDING,
  notes: 'This item is now overdue'
});

/**
 * A mock action item with a future due date
 */
export const mockUpcomingActionItem: ActionItem = generateMockActionItem({
  id: 'action-upcoming-e89b-12d3-a456-426614174000',
  description: 'Prepare for quarterly planning session',
  dueDate: new Date(Date.now() + 86400000 * 7), // 7 days from now
  notes: 'Gather department goals and metrics'
});

/**
 * An array of multiple mock action items for testing lists and filtering
 */
export const mockActionItems: ActionItem[] = [
  mockActionItem,
  mockPendingActionItem,
  mockInProgressActionItem,
  mockCompletedActionItem,
  mockBlockedActionItem,
  mockCancelledActionItem,
  mockHighPriorityActionItem,
  mockCriticalPriorityActionItem,
  mockOverdueActionItem,
  mockUpcomingActionItem,
  // Additional action items with different assignees and meetings
  generateMockActionItem({
    id: 'action-additional-1',
    description: 'Update the team on project status',
    assigneeId: mockUsers[1].id,
    meetingId: mockMeetings[1].id
  }),
  generateMockActionItem({
    id: 'action-additional-2',
    description: 'Schedule customer feedback sessions',
    assigneeId: mockUsers[2].id,
    meetingId: mockMeetings[2].id,
    priority: ActionItemPriority.LOW
  }),
  generateMockActionItem({
    id: 'action-additional-3',
    description: 'Finalize the Q2 budget',
    assigneeId: mockUsers[3].id,
    meetingId: mockMeetings[3].id,
    status: ActionItemStatus.IN_PROGRESS
  })
];

/**
 * Mock action items grouped by status for testing filtering and aggregation
 */
export const mockActionItemsByStatus: Record<ActionItemStatus, ActionItem[]> = {
  [ActionItemStatus.PENDING]: [
    mockPendingActionItem,
    mockActionItem,
    mockOverdueActionItem,
    mockUpcomingActionItem
  ],
  [ActionItemStatus.IN_PROGRESS]: [
    mockInProgressActionItem,
    mockActionItems[12] // The "Finalize the Q2 budget" item
  ],
  [ActionItemStatus.COMPLETED]: [
    mockCompletedActionItem
  ],
  [ActionItemStatus.BLOCKED]: [
    mockBlockedActionItem
  ],
  [ActionItemStatus.CANCELLED]: [
    mockCancelledActionItem
  ]
};

/**
 * Mock action items grouped by priority for testing filtering and aggregation
 */
export const mockActionItemsByPriority: Record<ActionItemPriority, ActionItem[]> = {
  [ActionItemPriority.LOW]: [
    mockActionItems[11] // The "Schedule customer feedback sessions" item
  ],
  [ActionItemPriority.MEDIUM]: [
    mockActionItem,
    mockPendingActionItem,
    mockInProgressActionItem,
    mockCompletedActionItem,
    mockBlockedActionItem,
    mockCancelledActionItem,
    mockOverdueActionItem,
    mockUpcomingActionItem,
    mockActionItems[10],
    mockActionItems[12]
  ],
  [ActionItemPriority.HIGH]: [
    mockHighPriorityActionItem
  ],
  [ActionItemPriority.CRITICAL]: [
    mockCriticalPriorityActionItem
  ]
};

/**
 * Mock action items grouped by assignee ID for testing user-specific queries
 */
export const mockActionItemsByAssignee: Record<string, ActionItem[]> = {
  [mockUser.id]: [
    mockActionItem,
    mockPendingActionItem,
    mockInProgressActionItem,
    mockCompletedActionItem,
    mockBlockedActionItem,
    mockCancelledActionItem,
    mockHighPriorityActionItem,
    mockCriticalPriorityActionItem,
    mockOverdueActionItem,
    mockUpcomingActionItem
  ],
  [mockUsers[1].id]: [
    mockActionItems[10] // The "Update the team on project status" item
  ],
  [mockUsers[2].id]: [
    mockActionItems[11] // The "Schedule customer feedback sessions" item
  ],
  [mockUsers[3].id]: [
    mockActionItems[12] // The "Finalize the Q2 budget" item
  ]
};

/**
 * Mock action items grouped by meeting ID for testing meeting-specific queries
 */
export const mockActionItemsByMeeting: Record<string, ActionItem[]> = {
  [mockMeeting.id]: [
    mockActionItem,
    mockPendingActionItem,
    mockInProgressActionItem,
    mockCompletedActionItem,
    mockBlockedActionItem,
    mockCancelledActionItem,
    mockHighPriorityActionItem,
    mockCriticalPriorityActionItem,
    mockOverdueActionItem,
    mockUpcomingActionItem
  ],
  [mockMeetings[1].id]: [
    mockActionItems[10] // The "Update the team on project status" item
  ],
  [mockMeetings[2].id]: [
    mockActionItems[11] // The "Schedule customer feedback sessions" item
  ],
  [mockMeetings[3].id]: [
    mockActionItems[12] // The "Finalize the Q2 budget" item
  ]
};