import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

// Component to test
import Sidebar from '../Sidebar';
// Utility functions for testing
import { renderWithProviders, createMockAuthUser } from '../../../tests/testUtils';
// Constants
import { ROUTES } from '../../../utils/constants/routes';
import { Permission } from '../../../utils/constants/permissions';
import { UserRole } from '../../../utils/constants/roles';

describe('Sidebar component', () => {
  // it('renders all navigation items for a user with all permissions', async () => {
  //   const hasPermissionMock = vi.fn().mockReturnValue(true);
  //   const useAuthMock = vi.fn().mockReturnValue({ hasPermission: hasPermissionMock });

  //   renderWithProviders(<Sidebar isOpen={true} onClose={() => {}} />, {
  //     authContext: { hasPermission: hasPermissionMock },
  //   });

  //   expect(screen.getByText('Dashboard')).toBeInTheDocument();
  //   expect(screen.getByText('Meetings')).toBeInTheDocument();
  //   expect(screen.getByText('Strategy')).toBeInTheDocument();
  //   expect(screen.getByText('Metrics')).toBeInTheDocument();
  //   expect(screen.getByText('KFFM')).toBeInTheDocument();
  //   expect(screen.getByText('Users')).toBeInTheDocument();
  // });

  it('renders all navigation items for a user with all permissions', async () => {
    // Mock useAuth hook to return hasPermission that always returns true
    const hasPermissionMock = vi.fn().mockReturnValue(true);
    const useAuthMock = vi.fn().mockReturnValue({ hasPermission: hasPermissionMock });

    // Render the Sidebar component with mock providers
    renderWithProviders(<Sidebar isOpen={true} onClose={() => {}} />);

    // Verify that all navigation items are rendered (Dashboard, Meetings, Strategy, Metrics, KFFM, Users)
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Meetings')).toBeInTheDocument();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText('KFFM')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();

    // Verify that each navigation item has the correct label and links to the correct route
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', ROUTES.DASHBOARD.ROOT);
    expect(screen.getByRole('link', { name: 'Meetings' })).toHaveAttribute('href', ROUTES.MEETINGS.ROOT);
    expect(screen.getByRole('link', { name: 'Strategy' })).toHaveAttribute('href', ROUTES.STRATEGY.ROOT);
    expect(screen.getByRole('link', { name: 'Metrics' })).toHaveAttribute('href', ROUTES.METRICS.ROOT);
    expect(screen.getByRole('link', { name: 'KFFM' })).toHaveAttribute('href', ROUTES.KFFM.ROOT);
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', ROUTES.USERS.ROOT);
  });

  it('renders only permitted navigation items based on user permissions', async () => {
    // Mock useAuth hook to return hasPermission that returns true only for specific permissions
    const hasPermissionMock = vi.fn().mockImplementation((permission) => {
      return [Permission.VIEW_DASHBOARD, Permission.VIEW_MEETING].includes(permission);
    });

    // Render the Sidebar component with mock providers
    renderWithProviders(<Sidebar isOpen={true} onClose={() => {}} />);

    // Verify that only permitted navigation items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Meetings')).toBeInTheDocument();

    // Verify that non-permitted navigation items are not rendered
    expect(screen.queryByText('Strategy')).toBeNull();
    expect(screen.queryByText('Metrics')).toBeNull();
    expect(screen.queryByText('KFFM')).toBeNull();
    expect(screen.queryByText('Users')).toBeNull();
  });

  it('highlights the active navigation item based on current route', async () => {
    // Mock useLocation to return a specific route path
    const mockLocation = {
      pathname: ROUTES.MEETINGS.ROOT,
      search: '',
      hash: '',
      state: null,
      key: 'default'
    };
    vi.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue(mockLocation);

    // Render the Sidebar component with mock providers
    renderWithProviders(<Sidebar isOpen={true} onClose={() => {}} />);

    // Verify that the navigation item matching the current route has the active class or style
    const activeLink = screen.getByRole('link', { name: 'Meetings' });
    expect(activeLink).toHaveClass('active');

    // Verify that other navigation items do not have the active class or style
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink).not.toHaveClass('active');
  });

  it('calls onClose when a navigation item is clicked on mobile view', async () => {
    // Mock useResponsive hook to return isMobile: true
    vi.spyOn(require('../../../hooks/useResponsive'), 'default').mockReturnValue({
      isMobileView: true,
      isTabletView: false,
      isDesktopView: false,
    });

    // Create a mock onClose function
    const onCloseMock = vi.fn();

    // Render the Sidebar component with mock providers and onClose prop
    renderWithProviders(<Sidebar isOpen={true} onClose={onCloseMock} />);

    // Click on a navigation item
    const meetingsLink = screen.getByRole('link', { name: 'Meetings' });
    await userEvent.click(meetingsLink);

    // Verify that onClose function was called
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when a navigation item is clicked on desktop view', async () => {
    // Mock useResponsive hook to return isMobile: false
    vi.spyOn(require('../../../hooks/useResponsive'), 'default').mockReturnValue({
      isMobileView: false,
      isTabletView: false,
      isDesktopView: true,
    });

    // Create a mock onClose function
    const onCloseMock = vi.fn();

    // Render the Sidebar component with mock providers and onClose prop
    renderWithProviders(<Sidebar isOpen={true} onClose={onCloseMock} />);

    // Click on a navigation item
    const meetingsLink = screen.getByRole('link', { name: 'Meetings' });
    await userEvent.click(meetingsLink);

    // Verify that onClose function was not called
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('applies correct styles based on isOpen prop', async () => {
    // Render the Sidebar component with isOpen=true
    const { rerender } = renderWithProviders(<Sidebar isOpen={true} onClose={() => {}} />);

    // Verify that the sidebar has styles indicating it is open
    const sidebarContainer = screen.getByRole('complementary');
    expect(sidebarContainer).toBeVisible();

    // Re-render the Sidebar component with isOpen=false
    rerender(<Sidebar isOpen={false} onClose={() => {}} />);

    // Verify that the sidebar has styles indicating it is closed
    expect(sidebarContainer).not.toBeVisible();
  });

  it('renders correctly on mobile devices', async () => {
    // Mock useResponsive hook to return isMobile: true
    vi.spyOn(require('../../../hooks/useResponsive'), 'default').mockReturnValue({
      isMobileView: true,
      isTabletView: false,
      isDesktopView: false,
    });

    // Render the Sidebar component with mock providers
    renderWithProviders(<Sidebar isOpen={true} onClose={() => {}} />);

    // Verify that the sidebar has mobile-specific styles and behavior
    const sidebarContainer = screen.getByRole('complementary');
    expect(sidebarContainer).toBeVisible();

    // Verify that navigation items are rendered correctly for mobile view
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Meetings')).toBeInTheDocument();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText('KFFM')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
});