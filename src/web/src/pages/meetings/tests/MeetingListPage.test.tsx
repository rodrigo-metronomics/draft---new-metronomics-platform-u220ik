import React from 'react'; // React library for component testing // v18.2.0
import { screen, waitFor, within, fireEvent } from '@testing-library/react'; // Testing library utilities for querying and interacting with components // v14.0.0
import userEvent from '@testing-library/user-event'; // Simulating user interactions in tests // v14.0.0
import MockAdapter from 'axios-mock-adapter'; // Mock adapter for axios to simulate API responses // v1.21.4
import axios from 'axios'; // HTTP client for making API requests // v1.4.0

import MeetingListPage from '../MeetingListPage'; // Component being tested
import { renderWithRouter, waitForLoadingToFinish, createMockAuthUser, createMockOrganization } from '../../../tests/testUtils'; // Testing utilities for rendering components with providers and router
import { mockMeeting, setupMeetingMocks } from '../../../tests/mocks/apiMocks'; // Mock API responses for meetings
import { MeetingType, MeetingStatus } from '../../../types/meeting.types'; // Type definitions for meeting data
import { ROUTES } from '../../../utils/constants/routes'; // Route constants for navigation testing
import { UserRole } from '../../../utils/constants/roles'; // User role constants for testing with different permissions

/**
 * Test suite for MeetingListPage component
 */
describe('MeetingListPage', () => {
  // Set up mock adapter for API requests
  let mock: MockAdapter;

  // Set up meeting mocks
  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  // Set up meeting mocks with the adapter
  beforeEach(() => {
    setupMeetingMocks(mock);
  });

  // Reset the mock adapter
  afterEach(() => {
    mock.reset();
  });

  // Define mock meetings data
  const mockMeetings = [
    mockMeeting({ id: '1', title: 'Daily Huddle', meetingType: MeetingType.DAILY, status: MeetingStatus.SCHEDULED }),
    mockMeeting({ id: '2', title: 'Weekly Review', meetingType: MeetingType.WEEKLY, status: MeetingStatus.IN_PROGRESS }),
    mockMeeting({ id: '3', title: 'Quarterly Planning', meetingType: MeetingType.QUARTERLY, status: MeetingStatus.COMPLETED }),
  ];

  // Mock useNavigate hook
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
  }));

  // Mock function for updating meeting status
  const mockUpdateMeetingStatus = jest.fn();
  jest.mock('../../../hooks/useMeetings', () => ({
    ...jest.requireActual('../../../hooks/useMeetings'),
    useMeetings: () => ({
      meetings: mockMeetings,
      isLoading: false,
      isError: false,
      error: null,
      totalItems: mockMeetings.length,
      page: 1,
      pageSize: 10,
      filters: { organizationId: 'test-org-id' },
      sort: 'startTime',
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      setFilters: jest.fn(),
      setSort: jest.fn(),
      updateMeetingStatus: mockUpdateMeetingStatus,
      deleteMeeting: jest.fn(),
    }),
  }));

  // Mock function for deleting a meeting
  const mockDeleteMeeting = jest.fn();
  jest.mock('../../../hooks/useMeetings', () => ({
    ...jest.requireActual('../../../hooks/useMeetings'),
    useMeetings: () => ({
      meetings: mockMeetings,
      isLoading: false,
      isError: false,
      error: null,
      totalItems: mockMeetings.length,
      page: 1,
      pageSize: 10,
      filters: { organizationId: 'test-org-id' },
      sort: 'startTime',
      setPage: jest.fn(),
      setPageSize: jest.fn(),
      setFilters: jest.fn(),
      setSort: jest.fn(),
      updateMeetingStatus: jest.fn(),
      deleteMeeting: mockDeleteMeeting,
    }),
  }));

  /**
   * Test that verifies the meeting list page renders correctly
   */
  it('should render the meeting list page', async () => {
    // Render the MeetingListPage component with router and providers
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify the page title is displayed
    expect(screen.getByText('Meetings')).toBeInTheDocument();

    // Verify the create meeting button is displayed
    expect(screen.getByText('Create New')).toBeInTheDocument();

    // Verify the meeting list is displayed with the correct number of meetings
    const meetingCards = await screen.findAllByRole('button');
    expect(meetingCards.length).toBeGreaterThanOrEqual(mockMeetings.length);
  });

  /**
   * Test that verifies the loading state is displayed
   */
  it('should display loading state', async () => {
    // Mock the API to delay response
    mock.onGet(ROUTES.MEETINGS.ROOT).reply(() => new Promise(resolve => setTimeout(() => {
      resolve([200, mockMeetings]);
    }, 100)));

    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Verify the loading spinner is displayed
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify the meeting list is displayed after loading
    const meetingCards = await screen.findAllByRole('button');
    expect(meetingCards.length).toBeGreaterThanOrEqual(mockMeetings.length);
  });

  /**
   * Test that verifies the error state is displayed
   */
  it('should display error state', async () => {
    // Mock the API to return an error
    mock.onGet(ROUTES.MEETINGS.ROOT).reply(500);

    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify the error message is displayed
    expect(screen.getByText(/Error fetching meetings/i)).toBeInTheDocument();
  });

  /**
   * Test that verifies the empty state is displayed when no meetings exist
   */
  it('should display empty state', async () => {
    // Mock the API to return an empty array of meetings
    mock.onGet(ROUTES.MEETINGS.ROOT).reply(200, []);

    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify the empty state message is displayed
    expect(screen.getByText(/No meetings found/i)).toBeInTheDocument();
  });

  /**
   * Test that verifies filtering meetings by type works correctly
   */
  it('should filter meetings by type', async () => {
    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the filter button
    const filterButton = screen.getByText('Filter');
    await userEvent.click(filterButton);

    // Select a meeting type from the dropdown
    const typeSelect = screen.getByPlaceholderText('All Types');
    await userEvent.selectOptions(typeSelect, 'daily');

    // Verify the API was called with the correct filter parameters
    expect(mock.history.get[0].params).toEqual({ organizationId: 'test-org-id', type: 'daily' });

    // Verify the filtered meetings are displayed
    const meetingCards = await screen.findAllByRole('button');
    expect(meetingCards.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * Test that verifies filtering meetings by status works correctly
   */
  it('should filter meetings by status', async () => {
    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the filter button
    const filterButton = screen.getByText('Filter');
    await userEvent.click(filterButton);

    // Select a meeting status from the dropdown
    const statusSelect = screen.getByPlaceholderText('All Statuses');
    await userEvent.selectOptions(statusSelect, 'inProgress');

    // Verify the API was called with the correct filter parameters
    expect(mock.history.get[0].params).toEqual({ organizationId: 'test-org-id', status: 'inProgress' });

    // Verify the filtered meetings are displayed
    const meetingCards = await screen.findAllByRole('button');
    expect(meetingCards.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * Test that verifies searching meetings by title works correctly
   */
  it('should search meetings by title', async () => {
    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find the search input
    const searchInput = screen.getByPlaceholderText('Search meetings...');

    // Type a search term in the input
    await userEvent.type(searchInput, 'Daily');

    // Verify the API was called with the correct search parameter
    expect(mock.history.get[0].params).toEqual({ organizationId: 'test-org-id', search: 'Daily' });

    // Verify the search results are displayed
    const meetingCards = await screen.findAllByRole('button');
    expect(meetingCards.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * Test that verifies navigation to the create meeting page works correctly
   */
  it('should navigate to create meeting page', async () => {
    // Render the MeetingListPage component with router
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the create meeting button
    const createButton = screen.getByText('Create New');
    await userEvent.click(createButton);

    // Verify navigation to the create meeting page
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MEETINGS.NEW);
  });

  /**
   * Test that verifies navigation to the meeting detail page works correctly
   */
  it('should navigate to meeting detail page', async () => {
    // Render the MeetingListPage component with router
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the view button on a meeting card
    const viewButton = screen.getAllByText('View')[0];
    await userEvent.click(viewButton);

    // Verify navigation to the meeting detail page with the correct meeting ID
    expect(mockNavigate).toHaveBeenCalledWith(`${ROUTES.MEETINGS.ROOT}/${mockMeetings[0].id}`);
  });

  /**
   * Test that verifies navigation to the meeting moderator page works correctly
   */
  it('should navigate to meeting moderator page', async () => {
    // Render the MeetingListPage component with router
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the join button on a meeting card
    const joinButton = screen.getAllByText('Join')[0];
    await userEvent.click(joinButton);

    // Verify navigation to the meeting moderator page with the correct meeting ID
    expect(mockNavigate).toHaveBeenCalledWith(`${ROUTES.MEETINGS.ROOT}/${mockMeetings[0].id}/moderator`);
  });

  /**
   * Test that verifies canceling a meeting works correctly
   */
  it('should cancel a meeting', async () => {
    // Mock the API for updating meeting status
    mock.onPut(`${ROUTES.MEETINGS.ROOT}/${mockMeetings[0].id}`).reply(200);

    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the cancel button on a meeting card
    const cancelButton = screen.getAllByText('Cancel')[0];
    await userEvent.click(cancelButton);

    // Confirm the cancellation in the dialog
    const confirmButton = screen.getByText('Yes');
    await userEvent.click(confirmButton);

    // Verify the API was called with the correct parameters
    expect(mockUpdateMeetingStatus).toHaveBeenCalledWith({ id: mockMeetings[0].id, status: MeetingStatus.CANCELLED });

    // Verify the meeting status was updated to CANCELLED
    expect(mock.history.put[0].url).toBe(`${ROUTES.MEETINGS.ROOT}/${mockMeetings[0].id}`);
    expect(mock.history.put[0].data).toBeDefined();
  });

  /**
   * Test that verifies deleting a meeting works correctly
   */
  it('should delete a meeting', async () => {
    // Mock the API for deleting a meeting
    mock.onDelete(`${ROUTES.MEETINGS.ROOT}/${mockMeetings[0].id}`).reply(200);

    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the delete button on a meeting card
    const deleteButton = screen.getAllByText('Delete')[0];
    await userEvent.click(deleteButton);

    // Confirm the deletion in the dialog
    const confirmButton = screen.getByText('Yes');
    await userEvent.click(confirmButton);

    // Verify the API was called with the correct meeting ID
    expect(mockDeleteMeeting).toHaveBeenCalledWith(mockMeetings[0].id);

    // Verify the meeting was removed from the list
    expect(mock.history.delete[0].url).toBe(`${ROUTES.MEETINGS.ROOT}/${mockMeetings[0].id}`);
  });

  /**
   * Test that verifies pagination works correctly
   */
  it('should handle pagination', async () => {
    // Mock the API to return paginated results
    mock.onGet(ROUTES.MEETINGS.ROOT).reply(config => {
      const page = config.params.page;
      const pageSize = config.params.pageSize;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedMeetings = mockMeetings.slice(start, end);
      return [200, paginatedMeetings];
    });

    // Render the MeetingListPage component
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify the first page of meetings is displayed
    let meetingCards = await screen.findAllByRole('button');
    expect(meetingCards.length).toBeGreaterThanOrEqual(1);

    // Find and click the next page button
    const nextPageButton = screen.getByLabelText('Next page');
    await userEvent.click(nextPageButton);

    // Verify the API was called with the correct page parameter
    expect(mock.history.get[1].params.page).toBe(2);

    // Verify the second page of meetings is displayed
    meetingCards = await screen.findAllByRole('button');
    expect(meetingCards.length).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test that verifies URL is updated with filter parameters
   */
  it('should update URL with filter parameters', async () => {
    // Render the MeetingListPage component with router
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Apply various filters (type, status, search)
    const filterButton = screen.getByText('Filter');
    await userEvent.click(filterButton);

    const typeSelect = screen.getByPlaceholderText('All Types');
    await userEvent.selectOptions(typeSelect, 'daily');

    const statusSelect = screen.getByPlaceholderText('All Statuses');
    await userEvent.selectOptions(statusSelect, 'inProgress');

    const searchInput = screen.getByPlaceholderText('Search meetings...');
    await userEvent.type(searchInput, 'Test');

    // Verify the URL search parameters are updated correctly
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('type=daily&status=inProgress&search=Test'));
  });

  /**
   * Test that verifies filters are loaded from URL parameters
   */
  it('should load filters from URL parameters', async () => {
    // Set up initial URL with filter parameters
    const initialUrl = `${ROUTES.MEETINGS.ROOT}?type=daily&status=inProgress&search=Test`;

    // Render the MeetingListPage component with router and initial URL
    renderWithRouter(
      <MeetingListPage />,
      [{ path: ROUTES.MEETINGS.ROOT, element: <MeetingListPage /> }],
      initialUrl
    );

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify the API was called with the correct filter parameters from URL
    expect(mock.history.get[0].params).toEqual({ organizationId: 'test-org-id', type: 'daily', status: 'inProgress', search: 'Test' });

    // Verify the filter controls reflect the URL parameters
    const typeSelect = screen.getByPlaceholderText('All Types');
    expect(typeSelect).toHaveValue('daily');

    const statusSelect = screen.getByPlaceholderText('All Statuses');
    expect(statusSelect).toHaveValue('inProgress');

    const searchInput = screen.getByPlaceholderText('Search meetings...');
    expect(searchInput).toHaveValue('Test');
  });
});