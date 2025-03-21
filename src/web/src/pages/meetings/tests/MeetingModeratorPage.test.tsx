import React from 'react'; // react@^18.2.0
import { screen, waitFor, fireEvent, within } from '@testing-library/react'; // @testing-library/react v^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event v^14.0.0
import { vi } from 'vitest'; // vitest v^0.34.0

import MeetingModeratorPage from '../MeetingModeratorPage';
import { renderWithRouter, renderWithProviders, createMockAuthUser, createMockOrganization, waitForLoadingToFinish } from '../../../tests/testUtils';
import { MeetingStatus, MeetingType, MeetingStageType, ParticipantRole } from '../../../types/meeting.types';
import { UserRole } from '../../../utils/constants/roles';
import { ROUTES } from '../../../utils/constants/routes';

const mockMeetingData = (overrides: any = {}) => {
  // LD1: Create a default mock meeting with id, title, type, status, and organizationId
  const defaultMeeting = {
    id: 'test-meeting-id',
    title: 'Test Meeting',
    meetingType: MeetingType.DAILY,
    status: MeetingStatus.SCHEDULED,
    organizationId: 'test-org-id',
    currentStage: null,
    startTime: new Date(),
    endTime: new Date(),
    createdById: 'test-user-id',
    recurrenceRule: null,
    calendarEventId: null,
    calendarProvider: null,
    location: null,
    virtualMeetingUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
  };

  // LD1: Create mock participants with different roles
  const mockParticipants = [
    { id: '1', userId: 'test-user-id', role: ParticipantRole.MODERATOR },
    { id: '2', userId: 'participant-user-id', role: ParticipantRole.PARTICIPANT },
  ];

  // LD1: Create mock meeting stages for each stage type
  const mockMeetingStages = mockMeetingStagesData(defaultMeeting.id);

  // LD1: Apply any overrides provided in the parameters
  const meeting = {
    ...defaultMeeting,
    participants: mockParticipants,
    stages: mockMeetingStages,
    ...overrides,
  };

  // LD1: Return the mock meeting object with participants and stages
  return meeting;
};

const mockMeetingStagesData = (meetingId: string) => {
  // LD1: Create mock stages for each MeetingStageType
  const stages = [
    { id: '1', meetingId, stageType: MeetingStageType.GOOD_NEWS, content: 'Good News Content', sequence: 1 },
    { id: '2', meetingId, stageType: MeetingStageType.PREVIOUS_ACTIONS, content: 'Previous Actions Content', sequence: 2 },
    { id: '3', meetingId, stageType: MeetingStageType.METRICS, content: 'Metrics Content', sequence: 3 },
    { id: '4', meetingId, stageType: MeetingStageType.PRIORITIES, content: 'Priorities Content', sequence: 4 },
    { id: '5', meetingId, stageType: MeetingStageType.BLOCKERS, content: 'Blockers Content', sequence: 5 },
    { id: '6', meetingId, stageType: MeetingStageType.NEW_ACTIONS, content: 'New Actions Content', sequence: 6 },
    { id: '7', meetingId, stageType: MeetingStageType.SUMMARY, content: 'Summary Content', sequence: 7 },
  ];

  // LD1: Set appropriate content for each stage type
  // LD1: Associate all stages with the provided meetingId
  // LD1: Return array of mock meeting stages
  return stages;
};

const mockActionItemsData = (meetingId: string) => {
  // LD1: Create several mock action items with different statuses
  const actionItems = [
    { id: '1', meetingId, description: 'Action Item 1', status: 'pending', assigneeId: 'test-user-id' },
    { id: '2', meetingId, description: 'Action Item 2', status: 'inProgress', assigneeId: 'test-user-id' },
    { id: '3', meetingId, description: 'Action Item 3', status: 'completed', assigneeId: 'test-user-id' },
  ];

  // LD1: Associate all action items with the provided meetingId
  // LD1: Assign action items to different users
  // LD1: Return array of mock action items
  return actionItems;
};

const setupMocks = () => {
  // LD1: Mock useMeetings hook with getMeetingById, startMeeting, endMeeting, and updateCurrentStage functions
  const mockUseMeetings = {
    getMeetingById: vi.fn().mockResolvedValue(mockMeetingData()),
    startMeeting: vi.fn().mockResolvedValue(null),
    endMeeting: vi.fn().mockResolvedValue(null),
    updateCurrentStage: vi.fn().mockResolvedValue(null),
  };

  // LD1: Mock useRealtime hooks (useMeetingRealtime, useMeetingStagesRealtime, useActionItemsRealtime)
  const mockUseRealtime = {
    useMeetingRealtime: vi.fn().mockReturnValue({ meeting: mockMeetingData(), loading: false, error: null }),
    useMeetingStagesRealtime: vi.fn().mockReturnValue({ stages: mockMeetingStagesData('test-meeting-id'), loading: false, error: null }),
    useActionItemsRealtime: vi.fn().mockReturnValue({ actionItems: mockActionItemsData('test-meeting-id'), loading: false, error: null }),
  };

  // LD1: Mock useNavigate for testing navigation
  const mockUseNavigate = vi.fn();

  // LD1: Return all mock functions and data
  return {
    mockUseMeetings,
    mockUseRealtime,
    mockUseNavigate,
  };
};

describe('MeetingModeratorPage', () => {
  it('renders loading state initially', async () => {
    // LD1: Setup mocks with loading state
    const { mockUseMeetings } = setupMocks();
    mockUseMeetings.getMeetingById.mockResolvedValue(null);

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext(),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Verify loading spinner is displayed
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state when meeting fetch fails', async () => {
    // LD1: Setup mocks with error state
    const { mockUseMeetings } = setupMocks();
    mockUseMeetings.getMeetingById.mockRejectedValue(new Error('Failed to fetch meeting'));

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext(),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('renders start meeting button for scheduled meetings', async () => {
    // LD1: Setup mocks with a scheduled meeting
    setupMocks();

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext(),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Verify start meeting button is displayed
    expect(screen.getByRole('button', { name: 'Start Meeting' })).toBeInTheDocument();
  });

  it('allows moderator to start a meeting', async () => {
    // LD1: Setup mocks with a scheduled meeting and current user as moderator
    const { mockUseMeetings } = setupMocks();

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext(),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Click start meeting button
    await userEvent.click(screen.getByRole('button', { name: 'Start Meeting' }));

    // LD1: Verify startMeeting function was called with correct parameters
    expect(mockUseMeetings.startMeeting).toHaveBeenCalledWith('test-meeting-id');
  });

  it('renders meeting stages for in-progress meetings', async () => {
    // LD1: Setup mocks with an in-progress meeting
    setupMocks();

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext({
        state: createMockAuthState({
          user: createMockAuthUser({ id: 'test-user-id' }),
        }),
      }),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Verify meeting stages component is displayed
    expect(screen.getByText('Good News')).toBeInTheDocument();

    // LD1: Verify current stage is highlighted
    expect(screen.getByText('Good News')).toHaveClass('p-highlight');
  });

  it('allows navigation between meeting stages', async () => {
    // LD1: Setup mocks with an in-progress meeting and current user as moderator
    const { mockUseMeetings } = setupMocks();

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext({
        state: createMockAuthState({
          user: createMockAuthUser({ id: 'test-user-id' }),
        }),
      }),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Click next stage button
    await userEvent.click(screen.getByRole('button', { name: 'Next Stage' }));

    // LD1: Verify updateCurrentStage function was called with correct parameters
    expect(mockUseMeetings.updateCurrentStage).toHaveBeenCalledWith('test-meeting-id', 'previousActions');
  });

  it('displays end meeting button for moderators', async () => {
    // LD1: Setup mocks with an in-progress meeting and current user as moderator
    setupMocks();

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext({
        state: createMockAuthState({
          user: createMockAuthUser({ id: 'test-user-id' }),
        }),
      }),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Verify end meeting button is displayed
    expect(screen.getByRole('button', { name: 'End Meeting' })).toBeInTheDocument();
  });

  it('does not display end meeting button for non-moderators', async () => {
    // LD1: Setup mocks with an in-progress meeting and current user as participant
    setupMocks();

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext({
        state: createMockAuthState({
          user: createMockAuthUser({ id: 'participant-user-id' }),
        }),
      }),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Verify end meeting button is not displayed
    expect(screen.queryByRole('button', { name: 'End Meeting' })).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when ending meeting', async () => {
    // LD1: Setup mocks with an in-progress meeting and current user as moderator
    setupMocks();

    // LD1: Mock confirmDialog function
    const confirmDialogMock = vi.fn();
    vi.mock('primereact/confirmdialog', () => ({
      confirmDialog: confirmDialogMock,
    }));

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext({
        state: createMockAuthState({
          user: createMockAuthUser({ id: 'test-user-id' }),
        }),
      }),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Click end meeting button
    await userEvent.click(screen.getByRole('button', { name: 'End Meeting' }));

    // LD1: Verify confirmDialog function was called
    expect(confirmDialogMock).toHaveBeenCalled();
  });

  it('ends meeting when confirmed', async () => {
    // LD1: Setup mocks with an in-progress meeting and current user as moderator
    const { mockUseMeetings } = setupMocks();

    // LD1: Mock confirmDialog to immediately call the accept callback
    const confirmDialogMock = vi.fn().mockImplementation((options) => {
      options.accept();
    });
    vi.mock('primereact/confirmdialog', () => ({
      confirmDialog: confirmDialogMock,
    }));

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext({
        state: createMockAuthState({
          user: createMockAuthUser({ id: 'test-user-id' }),
        }),
      }),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Click end meeting button
    await userEvent.click(screen.getByRole('button', { name: 'End Meeting' }));

    // LD1: Verify endMeeting function was called with correct parameters
    expect(mockUseMeetings.endMeeting).toHaveBeenCalledWith('test-meeting-id');
  });

  it('displays meeting summary for completed meetings', async () => {
    // LD1: Setup mocks with a completed meeting
    setupMocks();

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext({
        state: createMockAuthState({
          user: createMockAuthUser({ id: 'test-user-id' }),
        }),
      }),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Verify meeting summary component is displayed
    expect(screen.getByText('Key Points')).toBeInTheDocument();
  });

  it('navigates back to meetings list when clicking return button', async () => {
    // LD1: Setup mocks with a completed meeting
    setupMocks();

    // LD1: Mock useNavigate
    const mockUseNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockUseNavigate,
      };
    });

    // LD1: Render MeetingModeratorPage with router and providers
    renderWithProviders(<MeetingModeratorPage />, {
      authContext: createMockAuthContext({
        state: createMockAuthState({
          user: createMockAuthUser({ id: 'test-user-id' }),
        }),
      }),
      organizationContext: createMockOrganizationContext(),
    });

    // LD1: Wait for loading to finish
    await waitForLoadingToFinish();

    // LD1: Click return to meetings button
    await userEvent.click(screen.getByRole('button', { name: 'Return to Meetings' }));

    // LD1: Verify navigate was called with correct route
    expect(mockUseNavigate).toHaveBeenCalledWith(ROUTES.MEETINGS.LIST);
  });
});