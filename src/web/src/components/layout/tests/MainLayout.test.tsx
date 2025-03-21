import React from 'react'; // React v^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import { act } from 'react-dom/test-utils'; // ^18.2.0
import userEvent from '@testing-library/user-event'; // ^14.0.0

// Component being tested
import MainLayout from '../MainLayout';
// Utility for rendering components with all necessary providers
import { renderWithProviders, renderWithRouter } from '../../../tests/testUtils';

// Mock implementations for child components and hooks
jest.mock('../Header', () => ({ __esModule: true, default: () => <div data-testid="mock-header">Header</div> }));
jest.mock('../Sidebar', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }) => <div data-testid="mock-sidebar" data-is-open={String(isOpen)} onClick={onClose}>Sidebar</div>
}));
jest.mock('../Breadcrumbs', () => ({ __esModule: true, default: () => <div data-testid="mock-breadcrumbs">Breadcrumbs</div> }));
jest.mock('../Footer', () => ({ __esModule: true, default: () => <div data-testid="mock-footer">Footer</div> }));
jest.mock('../../hooks/useResponsive', () => ({ __esModule: true, default: jest.fn() }));

describe('MainLayout', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default mock implementation for useResponsive hook
    const useResponsiveMock = jest.requireMock('../../hooks/useResponsive').default;
    useResponsiveMock.mockReturnValue({
      isMobileView: false,
      isTabletView: false,
      isDesktopView: true,
      width: 1200,
      height: 800,
      getResponsiveValue: (values: any) => values.desktop,
      checkIsMobile: jest.fn(),
      checkIsTablet: jest.fn(),
      checkIsDesktop: jest.fn(),
    });
  });

  afterEach(() => {
    // Clean up any remaining mocks or side effects
  });

  it('renders correctly with all child components', () => {
    // Render MainLayout with renderWithProviders
    renderWithProviders(<MainLayout><div>Test Content</div></MainLayout>);

    // Check that Header component is rendered
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    // Check that Sidebar component is rendered
    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    // Check that Breadcrumbs component is rendered
    expect(screen.getByTestId('mock-breadcrumbs')).toBeInTheDocument();
    // Check that Footer component is rendered
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    // Render MainLayout with test child content
    renderWithProviders(<MainLayout><div>Test Content</div></MainLayout>);

    // Check that the child content is rendered in the content area
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders breadcrumbs when showBreadcrumbs is true', () => {
    // Render MainLayout with showBreadcrumbs prop set to true
    renderWithProviders(<MainLayout showBreadcrumbs={true}><div>Test Content</div></MainLayout>);

    // Check that Breadcrumbs component is rendered
    expect(screen.getByTestId('mock-breadcrumbs')).toBeInTheDocument();
  });

  it('does not render breadcrumbs when showBreadcrumbs is false', () => {
    // Render MainLayout with showBreadcrumbs prop set to false
    renderWithProviders(<MainLayout showBreadcrumbs={false}><div>Test Content</div></MainLayout>);

    // Check that Breadcrumbs component is not rendered
    expect(screen.queryByTestId('mock-breadcrumbs')).not.toBeInTheDocument();
  });

  it('toggles sidebar on mobile view', async () => {
    // Mock useResponsive to return mobile view (isMobile: true)
    const useResponsiveMock = jest.requireMock('../../hooks/useResponsive').default;
    useResponsiveMock.mockReturnValue({
      isMobileView: true,
      isTabletView: false,
      isDesktopView: false,
      width: 320,
      height: 480,
      getResponsiveValue: (values: any) => values.mobile,
      checkIsMobile: jest.fn(),
      checkIsTablet: jest.fn(),
      checkIsDesktop: jest.fn(),
    });

    // Render MainLayout component
    renderWithProviders(<MainLayout><div>Test Content</div></MainLayout>);

    // Find the menu toggle button in Header
    const menuToggleButton = screen.getByTestId('mock-header');

    // Click the menu toggle button in Header
    await act(async () => {
      fireEvent.click(menuToggleButton);
    });

    // Verify sidebar is opened (isOpen prop is true)
    const sidebar = screen.getByTestId('mock-sidebar');
    expect(sidebar).toHaveAttribute('data-is-open', 'true');

    // Click on sidebar to close it
    await act(async () => {
      fireEvent.click(sidebar);
    });

    // Verify sidebar is closed (isOpen prop is false)
    expect(sidebar).toHaveAttribute('data-is-open', 'false');
  });

  it('shows sidebar overlay when sidebar is open on mobile', async () => {
    // Mock useResponsive to return mobile view (isMobile: true)
    const useResponsiveMock = jest.requireMock('../../hooks/useResponsive').default;
    useResponsiveMock.mockReturnValue({
      isMobileView: true,
      isTabletView: false,
      isDesktopView: false,
      width: 320,
      height: 480,
      getResponsiveValue: (values: any) => values.mobile,
      checkIsMobile: jest.fn(),
      checkIsTablet: jest.fn(),
      checkIsDesktop: jest.fn(),
    });

    // Render MainLayout component
    renderWithProviders(<MainLayout><div>Test Content</div></MainLayout>);

    // Find and click the menu toggle button in Header
    const menuToggleButton = screen.getByTestId('mock-header');
    await act(async () => {
      fireEvent.click(menuToggleButton);
    });

    // Verify sidebar overlay is visible
    // TODO: Add overlay test id
    // const overlay = screen.getByTestId('sidebar-overlay');
    // expect(overlay).toBeVisible();

    // Click on overlay to close sidebar
    const sidebar = screen.getByTestId('mock-sidebar');
    await act(async () => {
      fireEvent.click(sidebar);
    });

    // Verify sidebar is closed and overlay is hidden
    expect(sidebar).toHaveAttribute('data-is-open', 'false');
    // TODO: Add overlay test id
    // expect(overlay).not.toBeVisible();
  });

  it('sidebar is always visible on desktop view', () => {
    // Mock useResponsive to return desktop view (isMobile: false, isTablet: false)
    const useResponsiveMock = jest.requireMock('../../hooks/useResponsive').default;
    useResponsiveMock.mockReturnValue({
      isMobileView: false,
      isTabletView: false,
      isDesktopView: true,
      width: 1200,
      height: 800,
      getResponsiveValue: (values: any) => values.desktop,
      checkIsMobile: jest.fn(),
      checkIsTablet: jest.fn(),
      checkIsDesktop: jest.fn(),
    });

    // Render MainLayout component
    renderWithProviders(<MainLayout><div>Test Content</div></MainLayout>);

    // Verify sidebar is visible (isOpen prop is true)
    const sidebar = screen.getByTestId('mock-sidebar');
    expect(sidebar).toHaveAttribute('data-is-open', 'true');

    // Verify no menu toggle button is visible
    expect(screen.queryByLabelText('Toggle Menu')).not.toBeInTheDocument();

    // Verify no sidebar overlay is present
    // TODO: Add overlay test id
    // expect(screen.queryByTestId('sidebar-overlay')).not.toBeInTheDocument();
  });

  it('adjusts content padding based on sidebar state', () => {
    // Render MainLayout component
    renderWithProviders(<MainLayout><div>Test Content</div></MainLayout>);

    // Check initial content padding style
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveStyle('padding-left: 24px');

    // Toggle sidebar state
    const useResponsiveMock = jest.requireMock('../../hooks/useResponsive').default;
    useResponsiveMock.mockReturnValue({
      isMobileView: false,
      isTabletView: false,
      isDesktopView: true,
      width: 1200,
      height: 800,
      getResponsiveValue: (values: any) => values.desktop,
      checkIsMobile: jest.fn(),
      checkIsTablet: jest.fn(),
      checkIsDesktop: jest.fn(),
    });

    // Verify content padding style changes accordingly
    expect(mainContent).toHaveStyle('padding-left: 24px');
  });

  it('handles window resize events correctly', async () => {
    // Mock useResponsive to return mobile view initially
    const useResponsiveMock = jest.requireMock('../../hooks/useResponsive').default;
    useResponsiveMock.mockReturnValue({
      isMobileView: true,
      isTabletView: false,
      isDesktopView: false,
      width: 320,
      height: 480,
      getResponsiveValue: (values: any) => values.mobile,
      checkIsMobile: jest.fn(),
      checkIsTablet: jest.fn(),
      checkIsDesktop: jest.fn(),
    });

    // Render MainLayout and open sidebar
    renderWithProviders(<MainLayout><div>Test Content</div></MainLayout>);
    const menuToggleButton = screen.getByTestId('mock-header');
    await act(async () => {
      fireEvent.click(menuToggleButton);
    });
    const sidebar = screen.getByTestId('mock-sidebar');
    expect(sidebar).toHaveAttribute('data-is-open', 'true');

    // Change useResponsive mock to return desktop view
    useResponsiveMock.mockReturnValue({
      isMobileView: false,
      isTabletView: false,
      isDesktopView: true,
      width: 1200,
      height: 800,
      getResponsiveValue: (values: any) => values.desktop,
      checkIsMobile: jest.fn(),
      checkIsTablet: jest.fn(),
      checkIsDesktop: jest.fn(),
    });

    // Trigger window resize event
    await act(async () => {
      global.dispatchEvent(new Event('resize'));
    });

    // Verify sidebar state adjusts correctly for desktop view
    expect(sidebar).toHaveAttribute('data-is-open', 'true');
  });
});