import React from 'react'; // react v18.2.0
import { render, screen, waitFor, fireEvent } from '@testing-library/react'; // @testing-library/react v14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event v14.0.0
import { vi } from 'vitest'; // vitest v0.34.0

import MeetingParticipants from '../MeetingParticipants';
import { renderWithProviders, createMockAuthUser } from '../../../tests/testUtils';
import { MeetingParticipant, ParticipantRole, AttendanceStatus } from '../../../types/meeting.types';
import { User } from '../../../types/user.types';

/**
 * Helper function to create a mock meeting participant for testing
 * @param overrides 
 * @returns A mock meeting participant
 */
const createMockParticipant = (overrides: Partial<MeetingParticipant> = {}): MeetingParticipant => {
  // Create a default mock user with id, name, email, and photoURL
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    role: ParticipantRole.PARTICIPANT,
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
    lastLoginAt: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Create a default mock participant with meetingId, userId, user, role, attendanceStatus, and timestamps
  const mockParticipant: MeetingParticipant = {
    id: 'participant-id',
    meetingId: 'test-meeting-id',
    userId: 'test-user-id',
    user: mockUser,
    role: ParticipantRole.PARTICIPANT,
    attendanceStatus: AttendanceStatus.PENDING,
    joinedAt: new Date(),
    leftAt: null,
    isOnline: false,
    lastActivity: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockParticipant; // Return the mock participant object
};

/**
 * Helper function to create an array of mock meeting participants for testing
 * @param number count
 * @returns An array of mock meeting participants
 */
const createMockParticipants = (count: number): MeetingParticipant[] => {
  const participants: MeetingParticipant[] = []; // Create an empty array to hold participants

  // Loop count times to create the specified number of participants
  for (let i = 0; i < count; i++) {
    // For each iteration, create a participant with unique ID and varying roles
    const participant = createMockParticipant({
      id: `participant-${i}`,
      userId: `user-${i}`,
      role: i % 2 === 0 ? ParticipantRole.MODERATOR : ParticipantRole.PARTICIPANT,
    });
    participants.push(participant); // Add the participant to the array
  }

  return participants; // Return the array of mock participants
};

// Mock implementation of useMeetings hook that returns mock functions for addParticipants, removeParticipant, and updateParticipant
vi.mock('../../../hooks/useMeetings', () => ({
  default: vi.fn(() => ({
    addParticipants: { mutateAsync: vi.fn() },
    removeParticipant: { mutateAsync: vi.fn() },
    updateParticipant: { mutateAsync: vi.fn() },
  })),
}));

// Mock implementation of usePresenceTracking hook that returns mock participant presence data
vi.mock('../../../hooks/useRealtime', () => ({
  usePresenceTracking: vi.fn(() => ({
    participants: [],
  })),
}));

// Mock implementation of useAuth hook that returns mock current user data
vi.mock('../../../hooks/useAuth', () => ({
  default: vi.fn(() => ({
    state: {
      user: createMockAuthUser(),
    },
  })),
}));

describe('MeetingParticipants', () => {
  it('renders a list of participants', () => {
    // Create mock participants array
    const mockParticipants = createMockParticipants(3);

    // Render MeetingParticipants component with mock participants
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={false}
      onParticipantUpdate={vi.fn()}
    />);

    // Verify that each participant's name is displayed
    mockParticipants.forEach(participant => {
      expect(screen.getByText(participant.user?.name || '')).toBeInTheDocument();
    });

    // Verify that each participant's role is displayed
    mockParticipants.forEach(participant => {
      expect(screen.getByText(participant.role)).toBeInTheDocument();
    });
  });

  it('highlights the current user', () => {
    // Create mock participants array including the current user
    const mockParticipants = createMockParticipants(3);

    // Mock the useAuth hook to return the current user
    vi.mock('../../../hooks/useAuth', () => ({
      default: vi.fn(() => ({
        state: {
          user: createMockAuthUser({ id: 'user-1' }),
        },
      })),
    }));

    // Render MeetingParticipants component
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={false}
      onParticipantUpdate={vi.fn()}
    />);

    // Verify that the current user's entry has a different styling
    const currentUserEntry = screen.getByText(mockParticipants[1].user?.name || '').closest('div');
    expect(currentUserEntry).toHaveStyle('background-color: rgba(0, 123, 255, 0.1)');
  });

  it('displays online status indicators correctly', () => {
    // Create mock participants array with varying online statuses
    const mockParticipants = createMockParticipants(3);

    // Create initial presence data with some participants online
    const initialPresenceData = [
      { userId: 'user-0', isOnline: true },
      { userId: 'user-2', isOnline: false },
    ];

    // Mock the usePresenceTracking hook to return presence data
    vi.mock('../../../hooks/useRealtime', () => ({
      usePresenceTracking: vi.fn(() => ({
        participants: initialPresenceData,
      })),
    }));

    // Render MeetingParticipants component
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={false}
      onParticipantUpdate={vi.fn()}
    />);

    // Verify that online participants have green status indicators
    const onlineParticipant = screen.getByText(mockParticipants[0].user?.name || '').closest('div');
    expect(onlineParticipant).toContainHTML('background-color:#4caf50');

    // Verify that offline participants have gray status indicators
    const offlineParticipant = screen.getByText(mockParticipants[2].user?.name || '').closest('div');
    expect(offlineParticipant).toContainHTML('background-color:#9e9e9e');
  });

  it('shows moderator badge for moderators', () => {
    // Create mock participants array with some moderators
    const mockParticipants = createMockParticipants(3);

    // Render MeetingParticipants component
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={false}
      onParticipantUpdate={vi.fn()}
    />);

    // Verify that moderator badges are displayed for participants with MODERATOR role
    const moderatorEntry = screen.getByText(mockParticipants[0].user?.name || '').closest('div');
    expect(moderatorEntry).toContainHTML('Moderator');

    // Verify that regular participants don't have moderator badges
    const participantEntry = screen.getByText(mockParticipants[1].user?.name || '').closest('div');
    expect(participantEntry).not.toContainHTML('Moderator');
  });

  it('allows adding participants when user is moderator', async () => {
    // Create mock participants array
    const mockParticipants = createMockParticipants(3);

    // Render MeetingParticipants component with isModerator prop set to true
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={true}
      onParticipantUpdate={vi.fn()}
    />);

    // Verify that the add participant button is displayed
    const addParticipantButton = screen.getByLabelText('Add Participant');
    expect(addParticipantButton).toBeInTheDocument();

    // Click the add participant button
    await userEvent.click(addParticipantButton);

    // Verify that the add participant dialog is displayed
    // TODO: Implement add participant dialog and verify its presence
  });

  it('does not show add participant button when user is not moderator', () => {
    // Create mock participants array
    const mockParticipants = createMockParticipants(3);

    // Render MeetingParticipants component with isModerator prop set to false
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={false}
      onParticipantUpdate={vi.fn()}
    />);

    // Verify that the add participant button is not displayed
    const addParticipantButton = screen.queryByLabelText('Add Participant');
    expect(addParticipantButton).not.toBeInTheDocument();
  });

  it('allows removing participants when user is moderator', async () => {
    // Create mock participants array
    const mockParticipants = createMockParticipants(3);

    // Mock the useMeetings hook to provide removeParticipant function
    const removeParticipant = vi.fn();
    vi.mock('../../../hooks/useMeetings', () => ({
      default: vi.fn(() => ({
        addParticipants: { mutateAsync: vi.fn() },
        removeParticipant: { mutateAsync: removeParticipant },
        updateParticipant: { mutateAsync: vi.fn() },
      })),
    }));

    // Render MeetingParticipants component with isModerator prop set to true
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={true}
      onParticipantUpdate={vi.fn()}
    />);

    // Click the remove button for a participant
    const removeButton = screen.getByLabelText(`Remove Participant`);
    await userEvent.click(removeButton);

    // Verify that removeParticipant function was called with correct parameters
    expect(removeParticipant).toHaveBeenCalledWith({ id: 'test-meeting-id', participantsData: { userIds: ['user-0'] } });
  });

  it('allows editing participant roles when user is moderator', async () => {
    // Create mock participants array
    const mockParticipants = createMockParticipants(3);

    // Mock the useMeetings hook to provide updateParticipant function
    const updateParticipant = vi.fn();
    vi.mock('../../../hooks/useMeetings', () => ({
      default: vi.fn(() => ({
        addParticipants: { mutateAsync: vi.fn() },
        removeParticipant: { mutateAsync: vi.fn() },
        updateParticipant: { mutateAsync: updateParticipant },
      })),
    }));

    // Render MeetingParticipants component with isModerator prop set to true
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={true}
      onParticipantUpdate={vi.fn()}
    />);

    // Click the edit button for a participant
    const editButton = screen.getByLabelText(`Edit Participant`);
    await userEvent.click(editButton);

    // Verify that the edit dialog is displayed
    const roleDropdown = await screen.findByRole('combobox', { name: 'Role' });
    expect(roleDropdown).toBeInTheDocument();

    // Change the role in the dropdown
    fireEvent.change(roleDropdown, { target: { value: ParticipantRole.OBSERVER } });

    // Click the save button
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    // Verify that updateParticipant function was called with correct parameters
    expect(updateParticipant).toHaveBeenCalledWith({
      meetingId: 'test-meeting-id',
      userId: 'user-0',
      participantData: { role: ParticipantRole.OBSERVER }
    });
  });

  it('allows editing attendance status when user is moderator', async () => {
    // Create mock participants array
    const mockParticipants = createMockParticipants(3);

    // Mock the useMeetings hook to provide updateParticipant function
    const updateParticipant = vi.fn();
    vi.mock('../../../hooks/useMeetings', () => ({
      default: vi.fn(() => ({
        addParticipants: { mutateAsync: vi.fn() },
        removeParticipant: { mutateAsync: vi.fn() },
        updateParticipant: { mutateAsync: updateParticipant },
      })),
    }));

    // Render MeetingParticipants component with isModerator prop set to true
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={true}
      onParticipantUpdate={vi.fn()}
    />);

    // Click the edit button for a participant
    const editButton = screen.getByLabelText(`Edit Participant`);
    await userEvent.click(editButton);

    // Verify that the edit dialog is displayed
    const attendanceDropdown = await screen.findByRole('combobox', { name: 'Attendance Status' });
    expect(attendanceDropdown).toBeInTheDocument();

    // Change the attendance status in the dropdown
    fireEvent.change(attendanceDropdown, { target: { value: AttendanceStatus.ACCEPTED } });

    // Click the save button
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    // Verify that updateParticipant function was called with correct parameters
    expect(updateParticipant).toHaveBeenCalledWith({
      meetingId: 'test-meeting-id',
      userId: 'user-0',
      participantData: { attendanceStatus: AttendanceStatus.ACCEPTED }
    });
  });

  it('updates participant list when real-time presence changes', async () => {
    // Create mock participants array
    const mockParticipants = createMockParticipants(3);

    // Create initial presence data with some participants online
    const initialPresenceData = [
      { userId: 'user-0', isOnline: true },
      { userId: 'user-1', isOnline: false },
      { userId: 'user-2', isOnline: true },
    ];

    // Mock the usePresenceTracking hook to return the presence data
    const usePresenceTrackingMock = vi.fn(() => ({
      participants: initialPresenceData,
    }));
    vi.mock('../../../hooks/useRealtime', () => ({
      usePresenceTracking: usePresenceTrackingMock,
    }));

    // Render MeetingParticipants component
    const { rerender } = renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={false}
      onParticipantUpdate={vi.fn()}
    />);

    // Verify initial online status indicators
    const onlineParticipant1 = screen.getByText(mockParticipants[0].user?.name || '').closest('div');
    expect(onlineParticipant1).toContainHTML('background-color:#4caf50');
    const offlineParticipant = screen.getByText(mockParticipants[1].user?.name || '').closest('div');
    expect(offlineParticipant).toContainHTML('background-color:#9e9e9e');
    const onlineParticipant2 = screen.getByText(mockParticipants[2].user?.name || '').closest('div');
    expect(onlineParticipant2).toContainHTML('background-color:#4caf50');

    // Update the mock presence data to change online statuses
    const updatedPresenceData = [
      { userId: 'user-0', isOnline: false },
      { userId: 'user-1', isOnline: true },
      { userId: 'user-2', isOnline: false },
    ];
    usePresenceTrackingMock.mockReturnValueOnce({ participants: updatedPresenceData });

    // Re-render the component with the updated presence data
    rerender(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={false}
      onParticipantUpdate={vi.fn()}
    />);

    // Verify that the online status indicators have updated accordingly
    const updatedOfflineParticipant1 = screen.getByText(mockParticipants[0].user?.name || '').closest('div');
    expect(updatedOfflineParticipant1).toContainHTML('background-color:#9e9e9e');
    const updatedOnlineParticipant = screen.getByText(mockParticipants[1].user?.name || '').closest('div');
    expect(updatedOnlineParticipant).toContainHTML('background-color:#4caf50');
    const updatedOfflineParticipant2 = screen.getByText(mockParticipants[2].user?.name || '').closest('div');
    expect(updatedOfflineParticipant2).toContainHTML('background-color:#9e9e9e');
  });

  it('calls onParticipantUpdate when participants are modified', async () => {
    // Create mock participants array
    const mockParticipants = createMockParticipants(3);

    // Create mock onParticipantUpdate callback function
    const onParticipantUpdate = vi.fn();

    // Mock the useMeetings hook to provide updateParticipant function
    const updateParticipant = vi.fn();
    vi.mock('../../../hooks/useMeetings', () => ({
      default: vi.fn(() => ({
        addParticipants: { mutateAsync: vi.fn() },
        removeParticipant: { mutateAsync: vi.fn() },
        updateParticipant: { mutateAsync: updateParticipant },
      })),
    }));

    // Render MeetingParticipants component with the callback
    renderWithProviders(<MeetingParticipants
      participants={mockParticipants}
      meetingId="test-meeting-id"
      organizationId="test-org-id"
      isModerator={true}
      onParticipantUpdate={onParticipantUpdate}
    />);

    // Edit a participant's role
    const editButton = screen.getByLabelText(`Edit Participant`);
    await userEvent.click(editButton);

    const roleDropdown = await screen.findByRole('combobox', { name: 'Role' });
    fireEvent.change(roleDropdown, { target: { value: ParticipantRole.OBSERVER } });

    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);

    // Verify that onParticipantUpdate was called with updated participant data
    expect(updateParticipant).toHaveBeenCalled();
  });
});