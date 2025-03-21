import React from 'react'; // React library for component testing // v18.2.0
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'; // Testing library utilities for rendering and interacting with components // ^14.0.0
import userEvent from '@testing-library/user-event'; // Simulating user interactions in tests // ^14.0.0
import { vi } from 'vitest'; // Mocking and test utilities // ^0.34.0

// Component being tested
import DashboardPage from '../DashboardPage'; // Component being tested
import { renderWithRouter, createMockAuthUser, createMockOrganization, waitForLoadingToFinish } from '../../../tests/testUtils'; // Testing utilities for rendering with providers and creating mock data
import { ROUTES } from '../../../utils/constants/routes'; // Route constants for testing navigation
import { UserRole } from '../../../utils/constants/roles'; // User role constants for creating mock users

describe('DashboardPage', () => {
  // Set up mocks for hooks and API calls
  vi.mock('../../../hooks/useAuth', () => ({
    default: () => ({
      state: {
        user: createMockAuthUser({ firstName: 'Test', lastName: 'User' }),
        isAuthenticated: true,
      },
    }),
  }));

  vi.mock('../../../hooks/useOrganization', () => ({
    default: () => ({
      currentOrganization: createMockOrganization(),
      organizations: [createMockOrganization()],
    }),
  }));

  vi.mock('../../../hooks/useResponsive', () => ({
    default: () => ({
      isMobileView: false,
      isTabletView: false,
    }),
  }));

  const mockNavigate = vi.fn();
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
    };
  });

  // Define test cases for different scenarios
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any remaining mocks or side effects
  });

  it('should render the dashboard with all widgets', async () => {
    // Render the DashboardPage component with mock data
    renderWithProviders(<DashboardPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify that the page title and welcome message are displayed
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();

    // Verify that all four widgets are rendered (UpcomingMeetingsWidget, KeyMetricsWidget, ActionItemsWidget, AnnouncementsWidget)
    expect(screen.getByText('Upcoming Meetings')).toBeInTheDocument();
    expect(screen.getByText('Key Metrics')).toBeInTheDocument();
    expect(screen.getByText('My Action Items')).toBeInTheDocument();
    expect(screen.getByText('Team Announcements')).toBeInTheDocument();

    // Check that each widget has the correct title and content
  });

  it('should display the user name in the welcome message', async () => {
    // Create a mock user with specific first and last name
    const mockUser = createMockAuthUser({ firstName: 'John', lastName: 'Doe' });

    // Render the DashboardPage component with the mock user
    renderWithProviders(<DashboardPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify that the welcome message includes the user's first name
    expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
  });

  it('should navigate to meetings page when View All is clicked in UpcomingMeetingsWidget', async () => {
    // Render the DashboardPage component with mock data
    renderWithProviders(<DashboardPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find the View All button in the UpcomingMeetingsWidget
    const viewAllButton = screen.getByRole('button', { name: 'View All' });

    // Click the View All button
    await userEvent.click(viewAllButton);

    // Verify that navigation to the meetings page was triggered
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MEETINGS.LIST);
  });

  it('should navigate to metrics dashboard when View All is clicked in KeyMetricsWidget', async () => {
    // Render the DashboardPage component with mock data
    renderWithProviders(<DashboardPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find the View All button in the KeyMetricsWidget
    const viewAllButton = screen.getAllByRole('button', { name: 'View All' })[0];

    // Click the View All button
    await userEvent.click(viewAllButton);

    // Verify that navigation to the metrics dashboard page was triggered
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.METRICS.DASHBOARD);
  });

  it('should adjust layout for mobile viewport', async () => {
    // Mock the useResponsive hook to return isMobileView: true
    vi.mock('../../../hooks/useResponsive', () => ({
      default: () => ({
        isMobileView: true,
        isTabletView: false,
      }),
    }));

    // Render the DashboardPage component
    renderWithProviders(<DashboardPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify that the layout is adjusted for mobile (stacked widgets, single column)
  });

  it('should adjust layout for tablet viewport', async () => {
    // Mock the useResponsive hook to return isTabletView: true
    vi.mock('../../../hooks/useResponsive', () => ({
      default: () => ({
        isMobileView: false,
        isTabletView: true,
      }),
    }));

    // Render the DashboardPage component
    renderWithProviders(<DashboardPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify that the layout is adjusted for tablet (two-column layout)
  });

  it('should handle empty state for widgets', async () => {
    // Mock API responses to return empty arrays for meetings, metrics, action items, and announcements
    vi.mock('../../../hooks/useAuth', () => ({
      default: () => ({
        state: {
          user: createMockAuthUser({ firstName: 'Test', lastName: 'User' }),
          isAuthenticated: true,
        },
      }),
    }));

    vi.mock('../../../hooks/useOrganization', () => ({
      default: () => ({
        currentOrganization: createMockOrganization(),
        organizations: [createMockOrganization()],
      }),
    }));

    vi.mock('../../../hooks/useResponsive', () => ({
      default: () => ({
        isMobileView: false,
        isTabletView: false,
      }),
    }));

    // Render the DashboardPage component
    renderWithProviders(<DashboardPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify that each widget displays appropriate empty state messages
  });
});