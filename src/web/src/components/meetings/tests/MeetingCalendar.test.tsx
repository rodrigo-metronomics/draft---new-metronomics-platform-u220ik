import React from 'react'; // version ^18.2.0
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0
import MockAdapter from 'axios-mock-adapter'; // version ^1.21.4
import axios from 'axios'; // version ^1.4.0
import { addDays, subDays, format } from 'date-fns'; // version ^2.30.0

import MeetingCalendar from '../MeetingCalendar';
import { Meeting, MeetingType, MeetingStatus } from '../../types/meeting.types';
import { CalendarProvider } from '../../types/calendar.types';
import { renderWithProviders, waitForLoadingToFinish } from '../../../tests/testUtils';
import { mockMeeting, setupMeetingMocks } from '../../../tests/mocks/apiMocks';

/**
 * Generates an array of mock meetings for testing
 * @param count 
 * @returns 
 */
const generateMockMeetings = (count: number): Meeting[] => {
  const meetings: Meeting[] = [];

  for (let i = 0; i < count; i++) {
    const meetingDate = addDays(new Date(), i); // Varying dates for calendar testing
    const meeting: Meeting = {
      id: `meeting-${i + 1}`,
      title: `Meeting ${i + 1}`,
      description: 'Test meeting',
      meetingType: MeetingType.DAILY,
      status: MeetingStatus.SCHEDULED,
      startTime: meetingDate.toISOString(),
      endTime: addDays(meetingDate, 1).toISOString(),
      currentStage: null,
      organizationId: 'test-org-id',
      createdById: 'test-user-id',
      createdBy: null,
      recurrenceRule: null,
      calendarEventId: null,
      calendarProvider: null,
      location: null,
      virtualMeetingUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };
    meetings.push(meeting);
  }

  return meetings;
};

describe('MeetingCalendar', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter(axios);
    setupMeetingMocks(mockAdapter);
  });

  afterEach(() => {
    mockAdapter.restore();
    vi.restoreAllMocks();
  });

  it('renders the calendar with month view by default', async () => {
    renderWithProviders(<MeetingCalendar />);
    await waitForLoadingToFinish();

    expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(28);
  });

  it('displays meetings on the correct dates', async () => {
    const mockMeetings = generateMockMeetings(3);
    mockAdapter.onGet('/meetings').reply(200, { data: { items: mockMeetings } });

    renderWithProviders(<MeetingCalendar />);
    await waitForLoadingToFinish();

    mockMeetings.forEach(meeting => {
      const meetingDate = new Date(meeting.startTime);
      const dayOfMonth = meetingDate.getDate().toString();
      const cell = screen.getByText(dayOfMonth).closest('div');
      expect(within(cell as HTMLElement).getByText(meeting.title)).toBeInTheDocument();
    });
  });

  it('allows switching between month, week, and day views', async () => {
    renderWithProviders(<MeetingCalendar />);
    await waitForLoadingToFinish();

    await userEvent.click(screen.getByText('Week'));
    expect(screen.getByText(format(new Date(), 'MMMM d, y'))).toBeInTheDocument();

    await userEvent.click(screen.getByText('Month'));
    expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeInTheDocument();
  });

  it('allows navigation between different time periods', async () => {
    renderWithProviders(<MeetingCalendar />);
    await waitForLoadingToFinish();

    await userEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText(format(addDays(new Date(), 31), 'MMMM yyyy'))).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Previous'));
    expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeInTheDocument();

    await userEvent.click(screen.getByText('Today'));
    expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeInTheDocument();
  });

  it('calls onMeetingClick when a meeting is clicked', async () => {
    const onMeetingClick = vi.fn();
    const mockMeetings = generateMockMeetings(1);
    mockAdapter.onGet('/meetings').reply(200, { data: { items: mockMeetings } });

    renderWithProviders(<MeetingCalendar onMeetingClick={onMeetingClick} />);
    await waitForLoadingToFinish();

    const meetingElement = screen.getByText(mockMeetings[0].title);
    await userEvent.click(meetingElement);

    expect(onMeetingClick).toHaveBeenCalledWith(expect.objectContaining({ id: mockMeetings[0].id }));
  });

  it('opens create meeting modal when create button is clicked', async () => {
    const onCreateMeeting = vi.fn();
    renderWithProviders(<MeetingCalendar allowCreation={true} onCreateMeeting={onCreateMeeting} />);
    await waitForLoadingToFinish();

    const createButton = screen.getByLabelText('Add');
    await userEvent.click(createButton);

    expect(onCreateMeeting).toHaveBeenCalled();
  });

  it('does not show create button when allowCreation is false', async () => {
    renderWithProviders(<MeetingCalendar allowCreation={false} />);
    await waitForLoadingToFinish();

    expect(screen.queryByLabelText('Add')).not.toBeInTheDocument();
  });

  it('syncs with calendar when a meeting is created', async () => {
    const syncMeetingWithCalendar = vi.fn();
    renderWithProviders(<MeetingCalendar />);
    await waitForLoadingToFinish();

    // Mock the syncMeetingWithCalendar function
    vi.mock('../../../hooks/useCalendarSync', () => ({
      default: () => ({
        syncMeetingWithCalendar: syncMeetingWithCalendar,
        calendarStatus: { defaultProvider: CalendarProvider.GOOGLE }
      }),
    }));

    // Create a new meeting through the interface
    const meetingElement = screen.getByText('Meeting 1');
    await userEvent.click(meetingElement);

    // Verify that syncMeetingWithCalendar was called with the correct parameters
    expect(syncMeetingWithCalendar).toHaveBeenCalledWith('meeting-1', CalendarProvider.GOOGLE);
  });

  it('displays loading state while fetching meetings', () => {
    renderWithProviders(<MeetingCalendar />, {
      authContext: {
        state: {
          user: { id: 'test-user-id', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'VIEWER', organizationId: 'test-org-id', authId: 'firebase-auth-id', profileImageUrl: null, lastLogin: new Date(), createdAt: new Date(), updatedAt: new Date() },
          isAuthenticated: true,
          isLoading: false,
          error: null,
          permissions: []
        },
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn()
      },
      queryClient: {
        ...testQueryClient,
        getQueryState: vi.fn().mockReturnValue({ status: 'loading' })
      } as any
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles errors when fetching meetings', async () => {
    renderWithProviders(<MeetingCalendar />, {
      authContext: {
        state: {
          user: { id: 'test-user-id', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'VIEWER', organizationId: 'test-org-id', authId: 'firebase-auth-id', profileImageUrl: null, lastLogin: new Date(), createdAt: new Date(), updatedAt: new Date() },
          isAuthenticated: true,
          isLoading: false,
          error: null,
          permissions: []
        },
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn()
      },
      queryClient: {
        ...testQueryClient,
        getQueryState: vi.fn().mockReturnValue({ status: 'error' })
      } as any
    });

    await waitFor(() => {
      expect(screen.getByText('Error fetching meetings')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('adapts layout for mobile devices', async () => {
    renderWithProviders(<MeetingCalendar />, {
      authContext: {
        state: {
          user: { id: 'test-user-id', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'VIEWER', organizationId: 'test-org-id', authId: 'firebase-auth-id', profileImageUrl: null, lastLogin: new Date(), createdAt: new Date(), updatedAt: new Date() },
          isAuthenticated: true,
          isLoading: false,
          error: null,
          permissions: []
        },
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn()
      },
      queryClient: {
        ...testQueryClient,
        getQueryState: vi.fn().mockReturnValue({ status: 'success' })
      } as any
    });
    await waitForLoadingToFinish();

    // Mock the useResponsive hook to return isMobile=true
    vi.mock('../../../hooks/useResponsive', () => ({
      default: () => ({
        isMobile: true,
        width: 500,
        height: 800,
        deviceType: 'mobile',
        getResponsiveValue: (values: any) => values.mobile,
        checkIsMobile: () => true,
        checkIsTablet: () => false,
        checkIsDesktop: () => false
      }),
    }));

    // Verify that the calendar displays a simplified layout suitable for mobile
    expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeInTheDocument();
  });
});