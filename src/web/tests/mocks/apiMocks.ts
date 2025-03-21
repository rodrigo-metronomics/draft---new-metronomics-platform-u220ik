import { ApiResponse, AuthResponse, ApiError, ApiErrorType } from '../../src/types/api.types'; // Import API-related type definitions for creating mock responses
import { AuthUser } from '../../src/types/auth.types'; // Import authentication user type for mock auth responses
import { Meeting, MeetingResponse, MeetingDetailResponse, MeetingListResponse, MeetingParticipant, MeetingStage } from '../../src/types/meeting.types'; // Import meeting-related types for mock meeting responses
import { Goal, GoalResponse, GoalDetailResponse, GoalListResponse, Milestone } from '../../src/types/goal.types'; // Import goal-related types for mock strategic goal responses
import { Metric, MetricResponse, MetricDetailResponse, MetricListResponse, MetricValue, MetricThreshold } from '../../src/types/metric.types'; // Import metric-related types for mock metrics responses
import { Organization, OrganizationResponse, OrganizationListResponse } from '../../src/types/organization.types'; // Import organization-related types for mock organization responses
import { User, UserResponse, UserListResponse } from '../../src/types/user.types'; // Import user-related types for mock user responses
import { KFFM, KFFMNode, KFFMConnection, KFFMResponse, KFFMDetailResponse, KFFMListResponse } from '../../src/types/kffm.types'; // Import KFFM-related types for mock KFFM responses
import { ActionItem, ActionItemResponse, ActionItemListResponse } from '../../src/types/action-item.types'; // Import action item-related types for mock action item responses
import { Notification, NotificationResponse, NotificationListResponse } from '../../src/types/notification.types'; // Import notification-related types for mock notification responses
import { Team, TeamResponse, TeamListResponse, TeamMember } from '../../src/types/team.types'; // Import team-related types for mock team responses
import { UserRole } from '../../src/utils/constants/roles'; // Import user role enum for creating mock users with different roles
import { MeetingType, MeetingStatus, MeetingStageType } from '../../src/utils/constants/meetingStages'; // Import meeting-related enums for creating mock meeting data
import { createMockAuthUser, createMockOrganization } from '../testUtils'; // Import utility functions for creating mock user and organization data
import { jest } from 'jest'; // ^29.5.0 Testing framework for creating mock functions

/**
 * Helper function to create successful API responses for testing
 * @param data 
 * @returns 
 */
const mockSuccessResponse = <T>(data: T): ApiResponse<T> => ({ success: true, data, message: null });

/**
 * Helper function to create error API responses for testing
 * @param message 
 * @param errors 
 * @param statusCode 
 * @returns 
 */
const mockErrorResponse = <T>(message: string, errors?: any[], statusCode?: number): ApiResponse<T> => ({ success: false, data: null as unknown as T, message, errors: errors || null, statusCode: statusCode || 400 });

/**
 * Helper function to create API error objects for testing
 * @param type 
 * @param message 
 * @param errors 
 * @param statusCode 
 * @returns 
 */
const mockApiError = (type: ApiErrorType, message: string, errors?: any[], statusCode?: number): ApiError => ({ type, message, errors: errors || null, statusCode: statusCode || 400, originalError: null });

/**
 * Creates a mock meeting object for testing
 * @param overrides 
 * @returns A mock meeting object
 */
const createMockMeeting = (overrides: Partial<Meeting> = {}): Meeting => {
  // Create a default mock meeting with id, title, description, meetingType, status, startTime, endTime, and organizationId
  const mockMeeting: Meeting = {
    id: 'test-meeting-id',
    title: 'Test Meeting',
    description: 'This is a test meeting',
    meetingType: MeetingType.DAILY,
    status: MeetingStatus.SCHEDULED,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    currentStage: MeetingStageType.GOOD_NEWS,
    organizationId: 'test-org-id',
    createdById: 'test-user-id',
    createdBy: createMockAuthUser(),
    recurrenceRule: null,
    calendarEventId: null,
    calendarProvider: null,
    location: null,
    virtualMeetingUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockMeeting; // Return the mock meeting object
};

/**
 * Creates a mock strategic goal object for testing
 * @param overrides 
 * @returns A mock goal object
 */
const createMockGoal = (overrides: Partial<Goal> = {}): Goal => {
  // Create a default mock goal with id, title, description, type, startDate, endDate, status, and organizationId
  const mockGoal: Goal = {
    id: 'test-goal-id',
    type: '1HAG',
    title: 'Test Goal',
    description: 'This is a test goal',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: 'active',
    progress: 50,
    organizationId: 'test-org-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockGoal; // Return the mock goal object
};

/**
 * Creates a mock metric object for testing
 * @param overrides 
 * @returns A mock metric object
 */
const createMockMetric = (overrides: Partial<Metric> = {}): Metric => {
  // Create a default mock metric with id, name, description, unit, comparisonType, calculationMethod, organizationId, and teamId
  const mockMetric: Metric = {
    id: 'test-metric-id',
    name: 'Test Metric',
    description: 'This is a test metric',
    type: 'number',
    unit: 'count',
    comparisonType: 'yoy',
    calculationMethod: 'manual',
    formula: null,
    organizationId: 'test-org-id',
    teamId: 'test-team-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockMetric; // Return the mock metric object
};

/**
 * Creates a mock KFFM object for testing
 * @param overrides 
 * @returns A mock KFFM object
 */
const createMockKFFM = (overrides: Partial<KFFM> = {}): KFFM => {
  // Create a default mock KFFM with id, title, version, status, and organizationId
  const mockKFFM: KFFM = {
    id: 'test-kffm-id',
    title: 'Test KFFM',
    description: 'This is a test KFFM',
    version: 1,
    status: 'draft',
    organizationId: 'test-org-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [],
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockKFFM; // Return the mock KFFM object
};

/**
 * Creates a mock user object for testing
 * @param overrides 
 * @returns A mock user object
 */
const createMockUser = (overrides: Partial<User> = {}): User => {
  // Create a default mock user with id, email, firstName, lastName, role, and organizationId
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    role: UserRole.VIEWER,
    status: 'active',
    organizationId: 'test-org-id',
    authId: 'firebase-auth-id',
    authProvider: 'email_password',
    photoURL: null,
    preferences: {
      theme: 'light',
      timezone: 'UTC',
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
    lastLoginAt: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockUser; // Return the mock user object
};

/**
 * Creates a mock team object for testing
 * @param overrides 
 * @returns A mock team object
 */
const createMockTeam = (overrides: Partial<Team> = {}): Team => {
  // Create a default mock team with id, name, description, and organizationId
  const mockTeam: Team = {
    id: 'test-team-id',
    name: 'Test Team',
    description: 'This is a test team',
    organizationId: 'test-org-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockTeam; // Return the mock team object
};

/**
 * Creates a mock action item object for testing
 * @param overrides 
 * @returns A mock action item object
 */
const createMockActionItem = (overrides: Partial<ActionItem> = {}): ActionItem => {
  // Create a default mock action item with id, description, status, dueDate, meetingId, assigneeId, and createdById
  const mockActionItem: ActionItem = {
    id: 'test-action-item-id',
    description: 'Test Action Item',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date().toISOString(),
    assigneeId: 'test-user-id',
    assignee: createMockUser(),
    meetingId: 'test-meeting-id',
    meeting: createMockMeeting(),
    organizationId: 'test-org-id',
    notes: 'Test Notes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockActionItem; // Return the mock action item object
};

/**
 * Creates a mock notification object for testing
 * @param overrides 
 * @returns A mock notification object
 */
const createMockNotification = (overrides: Partial<Notification> = {}): Notification => {
  // Create a default mock notification with id, type, content, read, userId, and createdAt
  const mockNotification: Notification = {
    id: 'test-notification-id',
    type: 'meeting_reminder',
    title: 'Test Notification',
    content: 'This is a test notification',
    priority: 'medium',
    status: 'unread',
    link: null,
    metadata: null,
    userId: 'test-user-id',
    organizationId: 'test-org-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockNotification; // Return the mock notification object
};

/**
 * Mock implementation of authentication API functions
 */
export const mockAuthApi = {
  login: jest.fn(),
  loginWithFirebaseToken: jest.fn(),
  register: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
};

/**
 * Mock implementation of meeting API functions
 */
export const mockMeetingApi = {
  getMeetings: jest.fn(),
  getMeetingById: jest.fn(),
  getMeetingDetail: jest.fn(),
  getUpcomingMeetings: jest.fn(),
  createMeeting: jest.fn(),
  updateMeeting: jest.fn(),
  deleteMeeting: jest.fn(),
  startMeeting: jest.fn(),
  endMeeting: jest.fn(),
  changeStage: jest.fn(),
  syncWithCalendar: jest.fn(),
};

/**
 * Mock implementation of strategic goal API functions
 */
export const mockGoalApi = {
  getGoals: jest.fn(),
  getGoalById: jest.fn(),
  getGoalDetail: jest.fn(),
  createGoal: jest.fn(),
  updateGoal: jest.fn(),
  deleteGoal: jest.fn(),
  getMilestones: jest.fn(),
  createMilestone: jest.fn(),
  updateMilestone: jest.fn(),
  deleteMilestone: jest.fn(),
};

/**
 * Mock implementation of metrics API functions
 */
export const mockMetricApi = {
  getMetrics: jest.fn(),
  getMetricById: jest.fn(),
  getMetricDetail: jest.fn(),
  createMetric: jest.fn(),
  updateMetric: jest.fn(),
  deleteMetric: jest.fn(),
  getMetricValues: jest.fn(),
  addMetricValue: jest.fn(),
  updateMetricValue: jest.fn(),
  getMetricThresholds: jest.fn(),
  updateMetricThresholds: jest.fn(),
};

/**
 * Mock implementation of organization API functions
 */
export const mockOrganizationApi = {
  getOrganizations: jest.fn(),
  getOrganizationById: jest.fn(),
  createOrganization: jest.fn(),
  updateOrganization: jest.fn(),
  deleteOrganization: jest.fn(),
};

/**
 * Mock implementation of user API functions
 */
export const mockUserApi = {
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  getCurrentUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  inviteUser: jest.fn(),
  updateUserRole: jest.fn(),
};

/**
 * Mock implementation of KFFM API functions
 */
export const mockKffmApi = {
  getKffms: jest.fn(),
  getKffmById: jest.fn(),
  getKffmDetail: jest.fn(),
  createKffm: jest.fn(),
  updateKffm: jest.fn(),
  deleteKffm: jest.fn(),
  getKffmNodes: jest.fn(),
  createKffmNode: jest.fn(),
  updateKffmNode: jest.fn(),
  deleteKffmNode: jest.fn(),
  getKffmConnections: jest.fn(),
  createKffmConnection: jest.fn(),
  deleteKffmConnection: jest.fn(),
};

/**
 * Mock implementation of action item API functions
 */
export const mockActionItemApi = {
  getActionItems: jest.fn(),
  getActionItemById: jest.fn(),
  createActionItem: jest.fn(),
  updateActionItem: jest.fn(),
  deleteActionItem: jest.fn(),
  completeActionItem: jest.fn(),
  getUserActionItems: jest.fn(),
};

/**
 * Mock implementation of notification API functions
 */
export const mockNotificationApi = {
  getNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  deleteNotification: jest.fn(),
};

/**
 * Mock implementation of team API functions
 */
export const mockTeamApi = {
  getTeams: jest.fn(),
  getTeamById: jest.fn(),
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  deleteTeam: jest.fn(),
  getTeamMembers: jest.fn(),
  addTeamMember: jest.fn(),
  removeTeamMember: jest.fn(),
};

export {
  mockSuccessResponse,
  mockErrorResponse,
  mockApiError,
  createMockMeeting,
  createMockGoal,
  createMockMetric,
  createMockKFFM,
  createMockUser,
  createMockTeam,
  createMockActionItem,
  createMockNotification
};