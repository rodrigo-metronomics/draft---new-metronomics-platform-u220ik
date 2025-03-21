import React from 'react'; // version ^18.2.0
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

import UpcomingMeetingsWidget from '../UpcomingMeetingsWidget';
import { renderWithProviders, waitForLoadingToFinish, createMockOrganization } from '../../../../tests/testUtils';
import { createMockMeetingsQueryResult } from '../../../../tests/mocks/reactQueryMock';
import { Meeting, MeetingType, MeetingStatus } from '../../../types/meeting.types';
import { ROUTES } from '../../../utils/constants/routes';

// Mock the useMeetings hook
vi.mock('../../../hooks/useMeetings', () => ({
  useMeetings: vi.fn(),
}));

// Mock the useNavigate hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock the useOrganization hook
vi.mock('../../../hooks/useOrganization', () => ({
  useOrganization: vi.fn(),
}));

/**
 * Creates an array of mock meetings for testing
 * @param count The number of meetings to create
 * @returns An array of mock meeting objects
 */
const createMockMeetings = (count: number): Meeting[] => {
  const meetings: Meeting[] = [];
  for (let i = 0; i < count; i++) {
    meetings.push({
      id: `meeting-${i + 1}`,
      title: `Meeting ${i + 1}`,
      description: `Description for Meeting ${i + 1}`,
      meetingType: MeetingType.DAILY,
      status: MeetingStatus.SCHEDULED,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      organizationId: 'test-org-id',
      createdById: 'test-user-id',
      createdBy: null,
      recurrenceRule: null,
      calendarEventId: null,
      calendarProvider: null,
      location: 'Test Location',
      virtualMeetingUrl: 'https://test.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    });
  }
  return meetings;
};

describe('UpcomingMeetingsWidget', () => {
  test('renders loading state initially', async () => {
    // Arrange: Mock useMeetings hook to return isLoading: true
    vi.mocked(require('../../../hooks/useMeetings').useMeetings).mockReturnValue(
      createMockMeetingsQueryResult({ isLoading: true })
    );

    // Act: Render UpcomingMeetingsWidget component with providers
    renderWithProviders(<UpcomingMeetingsWidget />);

    // Assert: Verify loading spinner is displayed
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders error state when API call fails', async () => {
    // Arrange: Mock useMeetings hook to return isError: true
    vi.mocked(require('../../../hooks/useMeetings').useMeetings).mockReturnValue(
      createMockMeetingsQueryResult({ isError: true, error: new Error('API Error') })
    );

    // Act: Render UpcomingMeetingsWidget component with providers
    renderWithProviders(<UpcomingMeetingsWidget />);

    // Assert: Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('renders empty state when no meetings are available', async () => {
    // Arrange: Mock useMeetings hook to return empty meetings array
    vi.mocked(require('../../../hooks/useMeetings').useMeetings).mockReturnValue(
      createMockMeetingsQueryResult({ data: [] })
    );

    // Act: Render UpcomingMeetingsWidget component with providers
    renderWithProviders(<UpcomingMeetingsWidget />);

    // Assert: Verify empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText('No upcoming meetings')).toBeInTheDocument();
    });
  });

  test('renders list of upcoming meetings', async () => {
    // Arrange: Create mock meetings array
    const mockMeetings = createMockMeetings(3);
    vi.mocked(require('../../../hooks/useMeetings').useMeetings).mockReturnValue(
      createMockMeetingsQueryResult({ data: mockMeetings })
    );

    // Act: Render UpcomingMeetingsWidget component with providers
    renderWithProviders(<UpcomingMeetingsWidget />);

    // Assert: Verify each meeting is displayed with correct information
    await waitForLoadingToFinish();
    mockMeetings.forEach((meeting) => {
      expect(screen.getByText(meeting.title)).toBeInTheDocument();
    });
  });

  test('limits the number of meetings displayed based on limit prop', async () => {
    // Arrange: Create mock meetings array with more items than limit
    const mockMeetings = createMockMeetings(7);
    vi.mocked(require('../../../hooks/useMeetings').useMeetings).mockReturnValue(
      createMockMeetingsQueryResult({ data: mockMeetings })
    );

    // Act: Render UpcomingMeetingsWidget with limit prop
    renderWithProviders(<UpcomingMeetingsWidget limit={5} />);

    // Assert: Verify only the specified number of meetings are displayed
    await waitForLoadingToFinish();
    const meetingCards = screen.getAllByTestId('meeting-card');
    expect(meetingCards.slice(0,5)).toHaveLength(5);
  });

  test('calls onViewAll callback when View All button is clicked', async () => {
    // Arrange: Create mock onViewAll callback function
    const onViewAll = vi.fn();
    vi.mocked(require('../../../hooks/useMeetings').useMeetings).mockReturnValue(
      createMockMeetingsQueryResult()
    );

    // Act: Render UpcomingMeetingsWidget with onViewAll prop
    renderWithProviders(<UpcomingMeetingsWidget onViewAll={onViewAll} />);

    // Simulate click on View All button
    const viewAllButton = screen.getByText('View All');
    await userEvent.click(viewAllButton);

    // Assert: Verify onViewAll callback was called
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  test('navigates to meeting details when a meeting card is clicked', async () => {
    // Arrange: Create mock meetings array
    const mockMeetings = createMockMeetings(1);
    vi.mocked(require('../../../hooks/useMeetings').useMeetings).mockReturnValue(
      createMockMeetingsQueryResult({ data: mockMeetings })
    );

    // Mock useNavigate hook
    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    // Act: Render UpcomingMeetingsWidget component with providers
    renderWithProviders(<UpcomingMeetingsWidget />);

    // Simulate click on a meeting card
    await waitForLoadingToFinish();
    const meetingCard = screen.getByText(mockMeetings[0].title);
    await userEvent.click(meetingCard);

    // Assert: Verify navigation was called with correct route
    expect(mockNavigate).toHaveBeenCalledWith(`${ROUTES.MEETINGS.ROOT}/${mockMeetings[0].id}`);
  });
});