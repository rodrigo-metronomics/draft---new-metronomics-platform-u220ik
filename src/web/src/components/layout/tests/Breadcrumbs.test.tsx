import React from 'react'; // react@^18.2.0
import { screen, within } from '@testing-library/react'; // @testing-library/react@^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event@^14.0.0
import { vi } from 'vitest'; // vitest@^0.34.0

import Breadcrumbs from '../Breadcrumbs'; // Import the Breadcrumbs component to be tested
import { ROUTES } from '../../utils/constants/routes'; // Import route constants for testing breadcrumb paths
import { renderWithRouter } from '../../../tests/testUtils'; // Import test utility for rendering components with router context
import useResponsive from '../../hooks/useResponsive'; // Mock the responsive hook to test different viewport sizes

// Mock the useResponsive hook to test different viewport sizes
vi.mock('../../hooks/useResponsive', () => ({
  default: vi.fn(),
}));

describe('Test suite for the Breadcrumbs component', () => { // Group related tests for the Breadcrumbs component
  beforeEach(() => { // Set up mocks for useResponsive hook
    vi.mocked(useResponsive).mockReset(); // Reset all mocks before each test
    vi.mocked(useResponsive).mockImplementation(() => ({ // Set up default mock implementations
      isMobileView: false,
      isTabletView: false,
      isDesktopView: true,
      width: 1024,
      height: 768,
      deviceType: 'desktop',
      getResponsiveValue: (values: any) => values.desktop,
      checkIsMobile: () => false,
      checkIsTablet: () => false,
      checkIsDesktop: () => true,
    }));
  });

  afterEach(() => { // Cleanup function that runs after each test
    vi.clearAllMocks(); // Clean up any remaining mocks or test artifacts
  });

  it('renders home breadcrumb when on root path', () => { // Define test expectations
    renderWithRouter(<Breadcrumbs />, [], '/'); // Render component with specific props or route

    expect(screen.getByText('Home')).toBeInTheDocument(); // Home breadcrumb is rendered
    expect(screen.queryByRole('separator')).not.toBeInTheDocument(); // No separators are visible
    expect(screen.getByText('Home')).toHaveAttribute('aria-current', 'page'); // Home breadcrumb has current (active) styling
  });

  it('renders correct breadcrumbs for nested routes', () => { // Define test expectations
    const routes = [
      { path: ROUTES.DASHBOARD.ROOT, element: <div>Dashboard</div> },
      { path: ROUTES.MEETINGS.ROOT, element: <div>Meetings</div> },
      { path: ROUTES.METRICS.ROOT, element: <div>Metrics</div> },
    ];
    renderWithRouter(<Breadcrumbs />, routes, ROUTES.METRICS.ROOT); // Render component with specific props or route

    const breadcrumbLinks = screen.getAllByRole('link'); // Query rendered elements
    expect(breadcrumbLinks[0]).toHaveTextContent('Home'); // Assert on expected outcomes
    expect(breadcrumbLinks[1]).toHaveTextContent('Metrics'); // Assert on expected outcomes
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Metrics')).toBeInTheDocument()
    expect(screen.getAllByRole('separator').length).toBeGreaterThan(0); // Separators are visible between breadcrumbs
    expect(screen.getByText('Metrics')).toHaveAttribute('aria-current', 'page'); // Current page breadcrumb has active styling
  });

  it('handles dynamic route parameters correctly', () => { // Define test expectations
    const routes = [
      { path: ROUTES.MEETINGS.ROOT, element: <div>Meetings</div> },
      { path: ROUTES.MEETINGS.DETAIL, element: <div>Meeting Detail</div> },
    ];
    renderWithRouter(<Breadcrumbs />, routes, '/meetings/123'); // Render component with specific props or route

    expect(screen.getByText('Meeting')).toBeInTheDocument(); // Dynamic parameters are displayed in a human-readable format
    expect(screen.getByText('Meeting')).toHaveAttribute('aria-current', 'page'); // Correct breadcrumb path is constructed for routes with parameters
  });

  it('navigates correctly when breadcrumb links are clicked', async () => { // Define test expectations
    const routes = [
      { path: ROUTES.DASHBOARD.ROOT, element: <div>Dashboard</div> },
      { path: ROUTES.MEETINGS.ROOT, element: <div>Meetings</div> },
      { path: ROUTES.METRICS.ROOT, element: <div>Metrics</div> },
    ];
    const { history } = renderWithRouter(<Breadcrumbs />, routes, ROUTES.METRICS.ROOT); // Render component with specific props or route
    const user = userEvent.setup(); // Query rendered elements

    await user.click(screen.getByText('Home')); // Simulate user interactions in tests
    expect(history.location.pathname).toBe('/'); // Assert on expected outcomes

    await user.click(screen.getByText('Metrics')); // Simulate user interactions in tests
    expect(history.location.pathname).toBe('/metrics'); // Assert on expected outcomes
  });

  it('applies responsive styling based on viewport size', () => { // Define test expectations
    vi.mocked(useResponsive).mockImplementation(() => ({
      isMobileView: true,
      isTabletView: false,
      isDesktopView: false,
      width: 320,
      height: 480,
      deviceType: 'mobile',
      getResponsiveValue: (values: any) => values.mobile,
      checkIsMobile: () => true,
      checkIsTablet: () => false,
      checkIsDesktop: () => false,
    }));
    const routes = [
      { path: ROUTES.DASHBOARD.ROOT, element: <div>Dashboard</div> },
      { path: ROUTES.MEETINGS.ROOT, element: <div>Meetings</div> },
      { path: ROUTES.METRICS.ROOT, element: <div>Metrics</div> },
    ];
    renderWithRouter(<Breadcrumbs />, routes, ROUTES.METRICS.ROOT); // Render component with specific props or route

    const breadcrumbList = screen.getByRole('list'); // Query rendered elements
    expect(within(breadcrumbList).getAllRole('listitem').length).toBeLessThanOrEqual(2); // Mobile view shows condensed breadcrumbs

    vi.mocked(useResponsive).mockImplementation(() => ({
      isMobileView: false,
      isTabletView: false,
      isDesktopView: true,
      width: 1024,
      height: 768,
      deviceType: 'desktop',
      getResponsiveValue: (values: any) => values.desktop,
      checkIsMobile: () => false,
      checkIsTablet: () => false,
      checkIsDesktop: () => true,
    }));
    renderWithRouter(<Breadcrumbs />, routes, ROUTES.METRICS.ROOT); // Render component with specific props or route
    const breadcrumbListDesktop = screen.getByRole('list'); // Query rendered elements
    expect(within(breadcrumbListDesktop).getAllRole('listitem').length).toBeGreaterThan(2); // Desktop view shows full breadcrumbs
  });

  it('includes proper ARIA attributes for accessibility', () => { // Define test expectations
    const routes = [
      { path: ROUTES.DASHBOARD.ROOT, element: <div>Dashboard</div> },
      { path: ROUTES.MEETINGS.ROOT, element: <div>Meetings</div> },
      { path: ROUTES.METRICS.ROOT, element: <div>Metrics</div> },
    ];
    renderWithRouter(<Breadcrumbs />, routes, ROUTES.METRICS.ROOT); // Render component with specific props or route

    const navElement = screen.getByRole('navigation'); // Query rendered elements
    expect(navElement).toHaveAttribute('aria-label', 'Breadcrumb'); // Nav element has aria-label='Breadcrumb'

    const listElement = screen.getByRole('list'); // Query rendered elements
    expect(listElement).toHaveAttribute('aria-label', 'Breadcrumb'); // List element has appropriate role

    expect(screen.getByText('Metrics')).toHaveAttribute('aria-current', 'page'); // Current page is properly indicated for screen readers
  });
});