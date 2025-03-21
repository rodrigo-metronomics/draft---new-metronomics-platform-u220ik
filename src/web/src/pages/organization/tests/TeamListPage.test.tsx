import React from 'react'; // React library for building user interfaces // v18.2.0
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // Testing utilities for rendering and interacting with components // ^14.0.0
import userEvent from '@testing-library/user-event'; // Simulating user interactions in tests // ^14.0.0
import { vi } from 'vitest'; // Mocking functionality for tests // ^0.34.0

import TeamListPage from '../TeamListPage'; // Component under test
import { renderWithProviders, renderWithRouter, createMockAuthUser, createMockOrganization, waitForLoadingToFinish } from '../../../tests/testUtils'; // Testing utilities for rendering components with providers and creating mock data
import { PERMISSIONS } from '../../../utils/constants/permissions'; // Permission constants for testing access control
import { ROUTES } from '../../../utils/constants/routes'; // Route constants for testing navigation
import { Team } from '../../../types/team.types'; // Type definitions for team data
import { UserRole } from '../../../utils/constants/roles'; // Role constants for creating mock users with different roles

/**
 * Creates an array of mock teams for testing
 * @param count Number of teams to create
 * @param overrides Optional overrides for team properties
 * @returns Array of mock team objects
 */
const createMockTeams = (count: number, overrides: Partial<Team> = {}): Team[] => {
  // LD1: Create an array of the specified count
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    description: `Description for Team ${i + 1}`,
    organizationId: 'test-org-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberCount: 5,
    ...overrides, // LD1: Apply any overrides provided in the parameters
  })) as Team[]; // LD1: Return the array of mock teams
};

/**
 * Creates a mock implementation of the useTeams hook
 * @param overrides Optional overrides for hook properties
 * @returns Mock implementation of useTeams hook
 */
const mockUseTeams = (overrides: any = {}) => {
  // LD1: Create default mock teams data
  const mockTeams = createMockTeams(3);

  // LD1: Create mock functions for all team operations (getTeams, createTeam, updateTeam, deleteTeam)
  const mockGetTeams = vi.fn().mockResolvedValue(mockTeams);
  const mockCreateTeam = vi.fn().mockResolvedValue({});
  const mockUpdateTeam = vi.fn().mockResolvedValue({});
  const mockDeleteTeam = vi.fn().mockResolvedValue({});

  // LD1: Set default loading and error states
  const defaultValues = {
    teams: mockTeams,
    isLoading: false,
    isError: false,
    error: null,
    refetch: mockGetTeams,
    createTeam: { mutateAsync: mockCreateTeam },
    updateTeam: { mutateAsync: mockUpdateTeam },
    deleteTeam: { mutateAsync: mockDeleteTeam },
    useTeamForm: vi.fn().mockReturnValue({
      values: { name: '', description: '' },
      errors: {},
      touched: {},
      isSubmitting: false,
      isSubmitted: false,
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
      handleSubmit: vi.fn(),
      setFieldValue: vi.fn(),
      setFieldError: vi.fn(),
      setFieldTouched: vi.fn(),
      validateField: vi.fn(),
      validateAllFields: vi.fn(),
      resetForm: vi.fn(),
    }),
  };

  // LD1: Override defaults with any provided overrides
  return { ...defaultValues, ...overrides }; // LD1: Return the mock hook implementation
};

/**
 * Sets up the test environment with mocks and renders the component
 * @param options Optional properties to configure the test environment
 * @returns Render result with additional helper methods
 */
const setupTest = (options: any = {}) => {
  // LD1: Create mock auth user with specified permissions
  const mockAuthUser = createMockAuthUser({ permissions: options.permissions });

  // LD1: Create mock organization
  const mockOrganization = createMockOrganization();

  // LD1: Mock the useTeams hook with specified options
  const useTeamsMock = mockUseTeams(options.useTeams);

  // LD1: Render the TeamListPage component with all providers and router
  const renderResult = renderWithProviders(
    <TeamListPage />,
    {
      authContext: {
        state: { ...createMockAuthState(), user: mockAuthUser, permissions: options.permissions },
      },
      organizationContext: {
        currentOrganization: mockOrganization,
        organizations: [mockOrganization],
      },
      realtimeContext: {
        syncCollection: vi.fn().mockReturnValue(vi.fn()),
      },
    }
  );

  return renderResult; // LD1: Return the render result
};

describe('TeamListPage', () => {
  it('renders team list page with title', () => {
    // LD1: Render the TeamListPage component with providers
    setupTest();

    // LD1: Check that the page title 'Teams' is displayed
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('displays loading state when teams are being fetched', () => {
    // LD1: Mock the useTeams hook with loading set to true
    setupTest({ useTeams: { isLoading: true } });

    // LD1: Check that a loading indicator is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state when teams fetch fails', async () => {
    // LD1: Mock the useTeams hook with error set to an Error object
    setupTest({ useTeams: { isError: true, error: new Error('Failed to fetch teams') } });

    // LD1: Check that an error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch teams')).toBeInTheDocument();
    });
  });

  it('displays teams in a table', () => {
    // LD1: Create mock teams data
    const mockTeams = createMockTeams(3);

    // LD1: Mock the useTeams hook to return the mock teams
    setupTest({ useTeams: { teams: mockTeams } });

    // LD1: Check that the table displays the correct columns (Name, Description, Members)
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();

    // LD1: Check that each team's data is displayed correctly in the table
    mockTeams.forEach((team) => {
      expect(screen.getByText(team.name)).toBeInTheDocument();
      expect(screen.getByText(team.description)).toBeInTheDocument();
    });
  });

  it('shows create team button when user has permission', () => {
    // LD1: Create mock auth user with MANAGE_TEAMS permission
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS] });

    // LD1: Check that the 'Create Team' button is displayed
    expect(screen.getByText('Create Team')).toBeInTheDocument();
  });

  it('hides create team button when user lacks permission', () => {
    // LD1: Create mock auth user without MANAGE_TEAMS permission
    setupTest({ permissions: [] });

    // LD1: Check that the 'Create Team' button is not displayed
    expect(screen.queryByText('Create Team')).not.toBeInTheDocument();
  });

  it('opens create team modal when create button is clicked', async () => {
    // LD1: Create mock auth user with MANAGE_TEAMS permission
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS] });

    // LD1: Click the 'Create Team' button
    await userEvent.click(screen.getByText('Create Team'));

    // LD1: Check that the team creation modal is displayed with the correct title
    expect(screen.getByText('Create Team')).toBeInTheDocument();
  });

  it('submits create team form with correct data', async () => {
    // LD1: Mock the useTeams hook with createTeam function
    const createTeamFn = vi.fn().mockResolvedValue({});
    const useTeamsMock = { createTeam: { mutateAsync: createTeamFn } };
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS], useTeams: useTeamsMock });

    // LD1: Click the 'Create Team' button to open the modal
    await userEvent.click(screen.getByText('Create Team'));

    // LD1: Fill in the team name and description fields
    await userEvent.type(screen.getByLabelText('Name'), 'New Team');
    await userEvent.type(screen.getByLabelText('Description'), 'New Team Description');

    // LD1: Click the 'Save' button
    await userEvent.click(screen.getByText('Save'));

    // LD1: Verify that createTeam was called with the correct data
    await waitFor(() => {
      expect(createTeamFn).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Team',
        description: 'New Team Description',
        organizationId: 'test-org-id',
      }));
    });
  });

  it('validates create team form before submission', async () => {
    // LD1: Mock the useTeams hook with createTeam function
    const createTeamFn = vi.fn().mockResolvedValue({});
    const useTeamsMock = { createTeam: { mutateAsync: createTeamFn } };
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS], useTeams: useTeamsMock });

    // LD1: Click the 'Create Team' button to open the modal
    await userEvent.click(screen.getByText('Create Team'));

    // LD1: Leave the required fields empty
    // LD1: Click the 'Save' button
    await userEvent.click(screen.getByText('Save'));

    // LD1: Verify that validation errors are displayed
    expect(screen.getByText('The field \'Name\' is required.')).toBeInTheDocument();
    expect(screen.getByText('The field \'Description\' is required.')).toBeInTheDocument();

    // LD1: Verify that createTeam was not called
    expect(createTeamFn).not.toHaveBeenCalled();
  });

  it('shows edit and delete buttons for teams when user has permission', () => {
    // LD1: Create mock auth user with MANAGE_TEAMS permission
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS] });

    // LD1: Create mock teams data
    const mockTeams = createMockTeams(3);

    // LD1: Mock the useTeams hook to return the mock teams
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS], useTeams: { teams: mockTeams } });

    // LD1: Check that edit and delete buttons are displayed for each team
    mockTeams.forEach((team) => {
      const row = screen.getByText(team.name).closest('tr');
      expect(within(row as HTMLElement).getByLabelText('Edit')).toBeVisible();
      expect(within(row as HTMLElement).getByLabelText('Delete')).toBeVisible();
    });
  });

  it('hides edit and delete buttons for teams when user lacks permission', () => {
    // LD1: Create mock auth user without MANAGE_TEAMS permission
    setupTest({ permissions: [] });

    // LD1: Create mock teams data
    const mockTeams = createMockTeams(3);

    // LD1: Mock the useTeams hook to return the mock teams
    setupTest({ permissions: [], useTeams: { teams: mockTeams } });

    // LD1: Check that edit and delete buttons are not displayed for teams
    mockTeams.forEach((team) => {
      const row = screen.getByText(team.name).closest('tr');
      expect(within(row as HTMLElement).queryByLabelText('Edit')).toBeNull();
      expect(within(row as HTMLElement).queryByLabelText('Delete')).toBeNull();
    });
  });

  it('opens edit team modal with correct data when edit button is clicked', async () => {
    // LD1: Create mock auth user with MANAGE_TEAMS permission
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS] });

    // LD1: Create mock teams data
    const mockTeams = createMockTeams(1);

    // LD1: Mock the useTeams hook to return the mock teams
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS], useTeams: { teams: mockTeams } });

    // LD1: Click the edit button for a team
    await userEvent.click(screen.getByLabelText('Edit'));

    // LD1: Check that the team editing modal is displayed with the correct title
    expect(screen.getByText('Edit Team')).toBeInTheDocument();

    // LD1: Verify that the form fields are pre-filled with the team's data
    expect(screen.getByLabelText('Name')).toHaveValue(mockTeams[0].name);
    expect(screen.getByLabelText('Description')).toHaveValue(mockTeams[0].description);
  });

  it('submits edit team form with correct data', async () => {
    // LD1: Create mock auth user with MANAGE_TEAMS permission
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS] });

    // LD1: Create mock teams data
    const mockTeams = createMockTeams(1);

    // LD1: Mock the useTeams hook with updateTeam function
    const updateTeamFn = vi.fn().mockResolvedValue({});
    const useTeamsMock = { teams: mockTeams, updateTeam: { mutateAsync: updateTeamFn } };
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS], useTeams: useTeamsMock });

    // LD1: Click the edit button for a team to open the modal
    await userEvent.click(screen.getByLabelText('Edit'));

    // LD1: Update the team name and description fields
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), 'Updated Team Name');
    await userEvent.clear(screen.getByLabelText('Description'));
    await userEvent.type(screen.getByLabelText('Description'), 'Updated Team Description');

    // LD1: Click the 'Save' button
    await userEvent.click(screen.getByText('Save'));

    // LD1: Verify that updateTeam was called with the correct data
    await waitFor(() => {
      expect(updateTeamFn).toHaveBeenCalledWith(expect.objectContaining({
        id: mockTeams[0].id,
        teamData: expect.objectContaining({
          name: 'Updated Team Name',
          description: 'Updated Team Description',
        }),
      }));
    });
  });

  it('opens delete confirmation modal when delete button is clicked', async () => {
    // LD1: Create mock auth user with MANAGE_TEAMS permission
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS] });

    // LD1: Create mock teams data
    const mockTeams = createMockTeams(1);

    // LD1: Mock the useTeams hook to return the mock teams
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS], useTeams: { teams: mockTeams } });

    // LD1: Click the delete button for a team
    await userEvent.click(screen.getByLabelText('Delete'));

    // LD1: Check that the delete confirmation modal is displayed with the correct message
    expect(screen.getByText('Are you sure you want to delete this team?')).toBeInTheDocument();
  });

  it('deletes team when confirmation is confirmed', async () => {
    // LD1: Create mock auth user with MANAGE_TEAMS permission
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS] });

    // LD1: Create mock teams data
    const mockTeams = createMockTeams(1);

    // LD1: Mock the useTeams hook with deleteTeam function
    const deleteTeamFn = vi.fn().mockResolvedValue({});
    const useTeamsMock = { teams: mockTeams, deleteTeam: { mutateAsync: deleteTeamFn } };
    setupTest({ permissions: [PERMISSIONS.MANAGE_TEAMS], useTeams: useTeamsMock });

    // LD1: Click the delete button for a team to open the confirmation modal
    await userEvent.click(screen.getByLabelText('Delete'));

    // LD1: Click the 'Delete' button in the confirmation modal
    await userEvent.click(screen.getByText('Delete'));

    // LD1: Verify that deleteTeam was called with the correct team ID
    await waitFor(() => {
      expect(deleteTeamFn).toHaveBeenCalledWith(mockTeams[0].id);
    });
  });

  it('navigates to team details page when team row is clicked', async () => {
    // LD1: Create mock teams data
    const mockTeams = createMockTeams(1);

    // LD1: Mock the useTeams hook to return the mock teams
    const navigate = vi.fn();
    setupTest({ useTeams: { teams: mockTeams } });

    // LD1: Click on a team row
    const row = screen.getByText(mockTeams[0].name).closest('tr');
    await userEvent.click(row as HTMLElement);

    // LD1: Verify that navigation to the team details page was triggered with the correct team ID
    expect(navigate).toHaveBeenCalledWith(ROUTES.ORGANIZATION.TEAM_DETAIL.replace(':id', mockTeams[0].id));
  });

  it('filters teams when search input is used', async () => {
    // LD1: Create mock teams data
    const mockTeams = createMockTeams(3);

    // LD1: Mock the useTeams hook with getTeams function
    const getTeamsFn = vi.fn().mockResolvedValue(mockTeams);
    const useTeamsMock = { teams: mockTeams, refetch: getTeamsFn };
    setupTest({ useTeams: useTeamsMock });

    // LD1: Enter a search term in the search input
    await userEvent.type(screen.getByPlaceholderText('Search teams...'), 'Team 1');

    // LD1: Verify that getTeams was called with the correct search parameter
    expect(getTeamsFn).toHaveBeenCalledWith(expect.objectContaining({ search: 'Team 1' }));
  });

  it('handles pagination correctly', async () => {
    // LD1: Create mock teams data with multiple pages
    const mockTeams = createMockTeams(25);

    // LD1: Mock the useTeams hook with getTeams function
    const getTeamsFn = vi.fn().mockResolvedValue(mockTeams.slice(0, 10));
    const useTeamsMock = { teams: mockTeams.slice(0, 10), refetch: getTeamsFn };
    setupTest({ useTeams: useTeamsMock });

    // LD1: Click on the next page button
    await userEvent.click(screen.getByLabelText('Go to next page'));

    // LD1: Verify that getTeams was called with the correct page parameter
    expect(getTeamsFn).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });
});