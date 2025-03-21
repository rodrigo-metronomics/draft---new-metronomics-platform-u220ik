/**
 * Provides mock meeting data for testing purposes in the Metronomics Platform.
 * Contains predefined meeting fixtures with various types, statuses, and stages
 * to support unit and integration tests.
 */

import {
  Meeting,
  MeetingWithRelations,
  MeetingParticipant,
  MeetingStage,
  MeetingType,
  MeetingStatus,
  MeetingStageType,
  ParticipantRole,
  AttendanceStatus
} from '../../src/types/meeting.types';

import {
  ActionItemReference,
  ActionItemStatus,
  ActionItemPriority
} from '../../src/types/action-item.types';

import {
  mockUser,
  mockCEO,
  mockLeadership,
  mockTeamMember,
  mockUsers
} from './users';

import { mockOrganization } from './organizations';

/**
 * Helper function to generate a mock meeting with customizable properties
 * 
 * @param overrides - Optional partial meeting object to override default values
 * @returns A mock meeting object with default values overridden by provided properties
 */
export const generateMockMeeting = (overrides: Partial<Meeting> = {}): Meeting => {
  const now = new Date();
  const startTime = new Date(now.getTime() + 3600000); // 1 hour from now
  const endTime = new Date(now.getTime() + 7200000);   // 2 hours from now

  const defaultMeeting: Meeting = {
    id: 'meeting-123e4567-e89b-12d3-a456-426614174000',
    title: 'Daily Huddle',
    description: 'Daily team sync meeting to discuss priorities and blockers',
    meetingType: MeetingType.DAILY,
    status: MeetingStatus.SCHEDULED,
    startTime,
    endTime,
    currentStage: null,
    organizationId: mockOrganization.id,
    createdById: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null
  };

  return {
    ...defaultMeeting,
    ...overrides
  };
};

/**
 * Helper function to generate a mock meeting participant with customizable properties
 * 
 * @param overrides - Optional partial meeting participant object to override default values
 * @returns A mock meeting participant object with default values overridden by provided properties
 */
export const generateMockMeetingParticipant = (overrides: Partial<MeetingParticipant> = {}): MeetingParticipant => {
  const defaultParticipant: MeetingParticipant = {
    id: 'participant-123e4567-e89b-12d3-a456-426614174000',
    meetingId: 'meeting-123e4567-e89b-12d3-a456-426614174000',
    userId: mockUser.id,
    role: ParticipantRole.PARTICIPANT,
    attendanceStatus: AttendanceStatus.PENDING
  };

  return {
    ...defaultParticipant,
    ...overrides
  };
};

/**
 * Helper function to generate a mock meeting stage with customizable properties
 * 
 * @param overrides - Optional partial meeting stage object to override default values
 * @returns A mock meeting stage object with default values overridden by provided properties
 */
export const generateMockMeetingStage = (overrides: Partial<MeetingStage> = {}): MeetingStage => {
  const defaultStage: MeetingStage = {
    id: 'stage-123e4567-e89b-12d3-a456-426614174000',
    meetingId: 'meeting-123e4567-e89b-12d3-a456-426614174000',
    stageType: MeetingStageType.GOOD_NEWS,
    content: '',
    sequence: 1
  };

  return {
    ...defaultStage,
    ...overrides
  };
};

/**
 * Helper function to generate a mock meeting with related entities like participants, stages, and action items
 * 
 * @param overrides - Optional partial meeting with relations object to override default values
 * @returns A mock meeting object with relations and default values overridden by provided properties
 */
export const generateMockMeetingWithRelations = (overrides: Partial<MeetingWithRelations> = {}): MeetingWithRelations => {
  const defaultMeeting = generateMockMeeting(overrides);
  const meetingId = overrides.id || defaultMeeting.id;

  const participants: MeetingParticipant[] = [
    generateMockMeetingParticipant({
      id: `participant-${meetingId}-1`,
      meetingId,
      userId: mockCEO.id,
      role: ParticipantRole.MODERATOR,
      attendanceStatus: AttendanceStatus.ACCEPTED
    }),
    generateMockMeetingParticipant({
      id: `participant-${meetingId}-2`,
      meetingId,
      userId: mockLeadership.id,
      role: ParticipantRole.PARTICIPANT,
      attendanceStatus: AttendanceStatus.ACCEPTED
    }),
    generateMockMeetingParticipant({
      id: `participant-${meetingId}-3`,
      meetingId,
      userId: mockTeamMember.id,
      role: ParticipantRole.PARTICIPANT,
      attendanceStatus: AttendanceStatus.ACCEPTED
    })
  ];

  const stages: MeetingStage[] = [
    generateMockMeetingStage({
      id: `stage-${meetingId}-1`,
      meetingId,
      stageType: MeetingStageType.SETUP,
      content: '',
      sequence: 0
    }),
    generateMockMeetingStage({
      id: `stage-${meetingId}-2`,
      meetingId,
      stageType: MeetingStageType.GOOD_NEWS,
      content: 'Team shared positive updates about recent achievements.',
      sequence: 1
    }),
    generateMockMeetingStage({
      id: `stage-${meetingId}-3`,
      meetingId,
      stageType: MeetingStageType.PREVIOUS_ACTIONS,
      content: 'Reviewed action items from previous meeting.',
      sequence: 2
    }),
    generateMockMeetingStage({
      id: `stage-${meetingId}-4`,
      meetingId,
      stageType: MeetingStageType.METRICS,
      content: 'Discussed key performance metrics for the week.',
      sequence: 3
    }),
    generateMockMeetingStage({
      id: `stage-${meetingId}-5`,
      meetingId,
      stageType: MeetingStageType.PRIORITIES,
      content: 'Set priorities for the day/week.',
      sequence: 4
    }),
    generateMockMeetingStage({
      id: `stage-${meetingId}-6`,
      meetingId,
      stageType: MeetingStageType.BLOCKERS,
      content: 'Identified potential blockers and resolved issues.',
      sequence: 5
    }),
    generateMockMeetingStage({
      id: `stage-${meetingId}-7`,
      meetingId,
      stageType: MeetingStageType.NEW_ACTIONS,
      content: 'Created new action items with clear ownership.',
      sequence: 6
    }),
    generateMockMeetingStage({
      id: `stage-${meetingId}-8`,
      meetingId,
      stageType: MeetingStageType.SUMMARY,
      content: 'Summarized the meeting outcomes and next steps.',
      sequence: 7
    })
  ];

  const actionItems: ActionItemReference[] = [
    {
      id: `action-${meetingId}-1`,
      description: 'Update the quarterly forecast',
      assigneeId: mockCEO.id,
      status: ActionItemStatus.PENDING,
      priority: ActionItemPriority.HIGH,
      dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      meetingId
    },
    {
      id: `action-${meetingId}-2`,
      description: 'Complete customer interview summaries',
      assigneeId: mockLeadership.id,
      status: ActionItemStatus.IN_PROGRESS,
      priority: ActionItemPriority.MEDIUM,
      dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      meetingId
    },
    {
      id: `action-${meetingId}-3`,
      description: 'Fix bug in analytics dashboard',
      assigneeId: mockTeamMember.id,
      status: ActionItemStatus.PENDING,
      priority: ActionItemPriority.CRITICAL,
      dueDate: new Date(Date.now() + 86400000), // 1 day from now
      meetingId
    }
  ];

  const meetingWithRelations: MeetingWithRelations = {
    ...defaultMeeting,
    participants,
    stages,
    actionItems
  };

  return {
    ...meetingWithRelations,
    ...overrides,
    participants: overrides.participants || meetingWithRelations.participants,
    stages: overrides.stages || meetingWithRelations.stages,
    actionItems: overrides.actionItems || meetingWithRelations.actionItems
  };
};

/**
 * A single mock meeting for simple test cases
 */
export const mockMeeting: Meeting = generateMockMeeting();

/**
 * A mock meeting with DAILY type for testing daily meeting functionality
 */
export const mockDailyMeeting: Meeting = generateMockMeeting({
  id: 'meeting-daily-12d3-a456-426614174000',
  title: 'Daily Huddle',
  description: 'Quick daily sync to align priorities and remove blockers',
  meetingType: MeetingType.DAILY
});

/**
 * A mock meeting with WEEKLY type for testing weekly meeting functionality
 */
export const mockWeeklyMeeting: Meeting = generateMockMeeting({
  id: 'meeting-weekly-12d3-a456-426614174000',
  title: 'Weekly Review',
  description: 'Weekly team meeting to review progress and plan next week',
  meetingType: MeetingType.WEEKLY,
  startTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
  endTime: new Date(Date.now() + 86400000 * 2 + 3600000 * 2) // 2 days + 2 hours from now
});

/**
 * A mock meeting with QUARTERLY type for testing quarterly meeting functionality
 */
export const mockQuarterlyMeeting: Meeting = generateMockMeeting({
  id: 'meeting-quarterly-12d3-a456-426614174000',
  title: 'Q2 Strategic Planning',
  description: 'Quarterly strategic planning session to align on goals and metrics',
  meetingType: MeetingType.QUARTERLY,
  startTime: new Date(Date.now() + 86400000 * 14), // 14 days from now
  endTime: new Date(Date.now() + 86400000 * 14 + 3600000 * 4) // 14 days + 4 hours from now
});

/**
 * A mock meeting with SCHEDULED status for testing scheduled meeting functionality
 */
export const mockScheduledMeeting: Meeting = generateMockMeeting({
  id: 'meeting-scheduled-12d3-a456-426614174000',
  status: MeetingStatus.SCHEDULED,
  startTime: new Date(Date.now() + 3600000) // 1 hour from now
});

/**
 * A mock meeting with IN_PROGRESS status for testing in-progress meeting functionality
 */
export const mockInProgressMeeting: Meeting = generateMockMeeting({
  id: 'meeting-inprogress-12d3-a456-426614174000',
  status: MeetingStatus.IN_PROGRESS,
  currentStage: MeetingStageType.METRICS,
  startTime: new Date(Date.now() - 1800000), // 30 minutes ago
  endTime: new Date(Date.now() + 1800000) // 30 minutes from now
});

/**
 * A mock meeting with COMPLETED status for testing completed meeting functionality
 */
export const mockCompletedMeeting: Meeting = generateMockMeeting({
  id: 'meeting-completed-12d3-a456-426614174000',
  status: MeetingStatus.COMPLETED,
  startTime: new Date(Date.now() - 7200000), // 2 hours ago
  endTime: new Date(Date.now() - 3600000), // 1 hour ago
  completedAt: new Date(Date.now() - 3600000) // 1 hour ago
});

/**
 * A mock meeting with CANCELLED status for testing cancelled meeting functionality
 */
export const mockCancelledMeeting: Meeting = generateMockMeeting({
  id: 'meeting-cancelled-12d3-a456-426614174000',
  status: MeetingStatus.CANCELLED,
  startTime: new Date(Date.now() + 86400000), // Tomorrow
  endTime: new Date(Date.now() + 86400000 + 3600000) // Tomorrow + 1 hour
});

/**
 * A mock meeting with related entities (participants, stages, action items) for testing relational data
 */
export const mockMeetingWithRelations: MeetingWithRelations = generateMockMeetingWithRelations();

/**
 * A single mock meeting participant for simple test cases
 */
export const mockMeetingParticipant: MeetingParticipant = generateMockMeetingParticipant();

/**
 * An array of mock meeting participants for testing participant lists
 */
export const mockMeetingParticipants: MeetingParticipant[] = [
  generateMockMeetingParticipant({
    id: 'participant-1',
    userId: mockCEO.id,
    role: ParticipantRole.MODERATOR,
    attendanceStatus: AttendanceStatus.ACCEPTED
  }),
  generateMockMeetingParticipant({
    id: 'participant-2',
    userId: mockLeadership.id,
    role: ParticipantRole.PARTICIPANT,
    attendanceStatus: AttendanceStatus.ACCEPTED
  }),
  generateMockMeetingParticipant({
    id: 'participant-3',
    userId: mockTeamMember.id,
    role: ParticipantRole.PARTICIPANT,
    attendanceStatus: AttendanceStatus.TENTATIVE
  }),
  generateMockMeetingParticipant({
    id: 'participant-4',
    userId: mockUsers[5].id,
    role: ParticipantRole.OBSERVER,
    attendanceStatus: AttendanceStatus.ACCEPTED
  })
];

/**
 * A single mock meeting stage for simple test cases
 */
export const mockMeetingStage: MeetingStage = generateMockMeetingStage();

/**
 * An array of mock meeting stages for testing stage progression
 */
export const mockMeetingStages: MeetingStage[] = [
  generateMockMeetingStage({
    id: 'stage-1',
    stageType: MeetingStageType.SETUP,
    sequence: 0
  }),
  generateMockMeetingStage({
    id: 'stage-2',
    stageType: MeetingStageType.GOOD_NEWS,
    content: 'Team shared recent wins and positive updates.',
    sequence: 1
  }),
  generateMockMeetingStage({
    id: 'stage-3',
    stageType: MeetingStageType.PREVIOUS_ACTIONS,
    content: 'Reviewed and updated status on previous action items.',
    sequence: 2
  }),
  generateMockMeetingStage({
    id: 'stage-4',
    stageType: MeetingStageType.METRICS,
    content: 'Discussed key metrics: Revenue up 15%, NPS at 72.',
    sequence: 3
  }),
  generateMockMeetingStage({
    id: 'stage-5',
    stageType: MeetingStageType.PRIORITIES,
    content: 'Priorities for the week: Launch prep, customer interviews.',
    sequence: 4
  }),
  generateMockMeetingStage({
    id: 'stage-6',
    stageType: MeetingStageType.BLOCKERS,
    content: 'Identified resource constraints in design team.',
    sequence: 5
  }),
  generateMockMeetingStage({
    id: 'stage-7',
    stageType: MeetingStageType.NEW_ACTIONS,
    content: 'Created 5 new action items with clear ownership.',
    sequence: 6
  }),
  generateMockMeetingStage({
    id: 'stage-8',
    stageType: MeetingStageType.SUMMARY,
    content: 'Summarized key decisions and next steps.',
    sequence: 7
  })
];

/**
 * An array of multiple mock meetings for testing lists and filtering
 */
export const mockMeetings: Meeting[] = [
  mockMeeting,
  mockDailyMeeting,
  mockWeeklyMeeting,
  mockQuarterlyMeeting,
  mockScheduledMeeting,
  mockInProgressMeeting,
  mockCompletedMeeting,
  mockCancelledMeeting
];