import React from 'react'; // React v^18.2.0
import { screen, waitFor, within } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

// Component under test
import MeetingLayout from '../MeetingLayout';

// Testing utilities for rendering components with router and creating mock data
import { renderWithRouter, createMockAuthUser, createMockOrganization } from '../../tests/testUtils';

// Type definitions for meetings
import { MeetingStatus, MeetingType, ParticipantRole } from '../../types/meeting.types';

// Role constants for user permissions
import { UserRole } from '../../utils/constants/roles';

interface SetupResult {
  mockMeeting: any;
  mockParticipants: any[];
  getMeetingByIdMock: any;
  updateCurrentStageMock: any;
  useNavigateMock: any;
  mockIsLoading: boolean;
}

/**
 * Setup function to create mock data and mocks for hooks
 * @returns Mock data and functions for tests
 */
const setup = (): SetupResult => {
  // Create mock organization data
  const mockOrganization = createMockOrganization();

  // Create mock user data with CEO role
  const mockUser = createMockAuthUser({ role: UserRole.CEO });

  // Create mock meeting data with participants including the current user
  const mockMeeting = {
    id: 'test-meeting-id',
    title: 'Test Meeting',
    description: 'Test Meeting Description',
    meetingType: MeetingType.DAILY,
    status: MeetingStatus.SCHEDULED,
    startTime: '2024-01-01T10:00:00.000Z',
    endTime: '2024-01-01T11:00:00.000Z',
    currentStage: null,
    organizationId: mockOrganization.id,
    createdById: mockUser.id,
    recurrenceRule: null,
    calendarEventId: null,
    calendarProvider: null,
    location: null,
    virtualMeetingUrl: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    completedAt: null,
  };

  const mockParticipants = [
    {
      id: 'participant-1',
      meetingId: mockMeeting.id,
      userId: mockUser.id,
      user: mockUser,
      role: ParticipantRole.MODERATOR,
      attendanceStatus: 'accepted',
      joinedAt: '2024-01-01T10:00:00.000Z',
      leftAt: null,
      isOnline: true,
      lastActivity: '2024-01-01T10:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  // Mock useMeetings hook to return getMeetingById and updateCurrentStage functions
  const getMeetingByIdMock = vi.fn().mockResolvedValue(mockMeeting);
  const updateCurrentStageMock = vi.fn();
  vi.mock('../../hooks/useMeetings', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue({
      getMeetingById: getMeetingByIdMock,
      updateCurrentStage: updateCurrentStageMock,
    }),
  }));

  // Mock useMeetingRealtime hook to return meeting data and loading state
  const mockIsLoading = false;
  vi.mock('../../hooks/useRealtime', () => ({
    useMeetingRealtime: vi.fn().mockReturnValue({
      meeting: mockMeeting,
      loading: mockIsLoading,
    }),
    usePresenceTracking: vi.fn().mockReturnValue({
      participants: mockParticipants,
    }),
  }));

  // Mock usePresenceTracking hook to return participants data
  vi.mock('../../hooks/useRealtime', () => {
    const actual = vi.importActual('../../hooks/useRealtime');
    return {
      ...actual,
      usePresenceTracking: vi.fn().mockReturnValue({
        participants: mockParticipants,
      }),
    };
  });

  // Mock useNavigate hook
  const useNavigateMock = vi.fn();
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => useNavigateMock,
      useParams: () => ({ meetingId: 'test-meeting-id' }),
    };
  });

  return {
    mockMeeting,
    mockParticipants,
    getMeetingByIdMock,
    updateCurrentStageMock,
    useNavigateMock,
    mockIsLoading,
  };
};

describe('MeetingLayout', () => {
  it('renders correctly with meeting data', async () => {
    // Set up mock data and hooks
    const { mockMeeting } = setup();

    // Render MeetingLayout with mock props and router
    renderWithRouter(
      <MeetingLayout organizationId="test-org-id">
        <div>Test Content</div>
      </MeetingLayout>,
      [{ path: '/meetings/:id', element: <div>Meeting Detail</div> }]
    );

    // Verify that the meeting title is displayed
    expect(screen.getByText(mockMeeting.title)).toBeInTheDocument();

    // Verify that the meeting status is displayed
    expect(screen.getByText(mockMeeting.status)).toBeInTheDocument();

    // Verify that the children content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays meeting progress for in-progress meetings', async () => {
    // Set up mock data with IN_PROGRESS meeting status
    setup();
    vi.mock('../../hooks/useRealtime', () => {
      const actual = vi.importActual('../../hooks/useRealtime');
      return {
        ...actual,
        useMeetingRealtime: vi.fn().mockReturnValue({
          meeting: { ...createMockMeeting(), status: MeetingStatus.IN_PROGRESS },
          loading: false,
        }),
        usePresenceTracking: vi.fn().mockReturnValue({
          participants: [],
        }),
      };
    });

    // Render MeetingLayout with mock props and router
    renderWithRouter(
      <MeetingLayout organizationId="test-org-id">
        <div>Test Content</div>
      </MeetingLayout>,
      [{ path: '/meetings/:id', element: <div>Meeting Detail</div> }]
    );

    // Verify that the MeetingProgress component is rendered
    expect(screen.getByLabelText('Meeting progress')).toBeInTheDocument();
  });

  it('does not display meeting progress for scheduled meetings', async () => {
    // Set up mock data with SCHEDULED meeting status
    setup();
    vi.mock('../../hooks/useRealtime', () => {
      const actual = vi.importActual('../../hooks/useRealtime');
      return {
        ...actual,
        useMeetingRealtime: vi.fn().mockReturnValue({
          meeting: { ...createMockMeeting(), status: MeetingStatus.SCHEDULED },
          loading: false,
        }),
        usePresenceTracking: vi.fn().mockReturnValue({
          participants: [],
        }),
      };
    });

    // Render MeetingLayout with mock props and router
    renderWithRouter(
      <MeetingLayout organizationId="test-org-id">
        <div>Test Content</div>
      </MeetingLayout>,
      [{ path: '/meetings/:id', element: <div>Meeting Detail</div> }]
    );

    // Verify that the MeetingProgress component is not rendered
    expect(screen.queryByLabelText('Meeting progress')).not.toBeInTheDocument();
  });

  it('displays participants panel', async () => {
    // Set up mock data and hooks
    const { mockParticipants } = setup();

    // Render MeetingLayout with mock props and router
    renderWithRouter(
      <MeetingLayout organizationId="test-org-id">
        <div>Test Content</div>
      </MeetingLayout>,
      [{ path: '/meetings/:id', element: <div>Meeting Detail</div> }]
    );

    // Verify that the MeetingParticipants component is rendered
    expect(screen.getByText('Participants')).toBeInTheDocument();

    // Verify that participant names are displayed
    mockParticipants.forEach((participant) => {
      expect(screen.getByText(participant.user.name)).toBeInTheDocument();
    });
  });

  it('handles stage navigation for moderators', async () => {
    // Set up mock data with current user as moderator
    const { updateCurrentStageMock } = setup();

    // Render MeetingLayout with mock props and router
    renderWithRouter(
      <MeetingLayout organizationId="test-org-id">
        <div>Test Content</div>
      </MeetingLayout>,
      [{ path: '/meetings/:id', element: <div>Meeting Detail</div> }]
    );

    // Simulate clicking on next stage button
    const nextButton = screen.getByRole('button', { name: 'Next Stage' });
    await userEvent.click(nextButton);

    // Verify that updateCurrentStage was called with correct parameters
    expect(updateCurrentStageMock).toHaveBeenCalled();
  });

  it('redirects to meetings list when meeting not found', async () => {
    // Set up mock data with getMeetingById returning null
    const { useNavigateMock } = setup();
    vi.mock('../../hooks/useMeetings', () => ({
      __esModule: true,
      default: vi.fn().mockReturnValue({
        getMeetingById: vi.fn().mockResolvedValue(null),
        updateCurrentStage: vi.fn(),
      }),
    }));

    // Render MeetingLayout with mock props and router
    renderWithRouter(
      <MeetingLayout organizationId="test-org-id">
        <div>Test Content</div>
      </MeetingLayout>,
      [{ path: '/meetings/:id', element: <div>Meeting Detail</div> }]
    );

    // Verify that navigate was called with the correct route
    await waitFor(() => {
      expect(useNavigateMock).toHaveBeenCalledWith('/meetings');
    });
  });

  it('handles loading state correctly', async () => {
    // Set up mock data with loading state set to true
    const { mockMeeting } = setup();
    vi.mock('../../hooks/useRealtime', () => {
      const actual = vi.importActual('../../hooks/useRealtime');
      return {
        ...actual,
        useMeetingRealtime: vi.fn().mockReturnValue({
          meeting: null,
          loading: true,
        }),
        usePresenceTracking: vi.fn().mockReturnValue({
          participants: [],
        }),
      };
    });

    // Render MeetingLayout with mock props and router
    renderWithRouter(
      <MeetingLayout organizationId="test-org-id">
        <div>Test Content</div>
      </MeetingLayout>,
      [{ path: '/meetings/:id', element: <div>Meeting Detail</div> }]
    );

    // Verify that a loading indicator is displayed
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Update loading state to false
    vi.mock('../../hooks/useRealtime', () => {
      const actual = vi.importActual('../../hooks/useRealtime');
      return {
        ...actual,
        useMeetingRealtime: vi.fn().mockReturnValue({
          meeting: mockMeeting,
          loading: false,
        }),
        usePresenceTracking: vi.fn().mockReturnValue({
          participants: [],
        }),
      };
    });

    // Verify that the meeting content is displayed
    await waitFor(() => {
      expect(screen.getByText(mockMeeting.title)).toBeInTheDocument();
    });
  });
});

const createMockMeeting = () => ({
  id: 'test-meeting-id',
  title: 'Test Meeting',
  description: 'Test Meeting Description',
  meetingType: MeetingType.DAILY,
  status: MeetingStatus.SCHEDULED,
  startTime: '2024-01-01T10:00:00.000Z',
  endTime: '2024-01-01T11:00:00.000Z',
  currentStage: null,
  organizationId: 'test-org-id',
  createdById: 'test-user-id',
  recurrenceRule: null,
  calendarEventId: null,
  calendarProvider: null,
  location: null,
  virtualMeetingUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  completedAt: null,
});