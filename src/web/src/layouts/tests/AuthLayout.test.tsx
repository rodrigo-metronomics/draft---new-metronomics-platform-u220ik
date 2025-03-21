import React from 'react'; // version ^18.2.0
import { screen, waitFor } from '@testing-library/react'; // version ^14.0.0
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // version ^0.30.1

import AuthLayout from '../AuthLayout';
import { renderWithProviders } from '../../tests/testUtils';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * Helper function to mock the useResponsive hook with specific device type
 * @param deviceType 
 * @returns Mocked responsive values
 */
const mockUseResponsive = (deviceType: 'mobile' | 'tablet' | 'desktop') => {
  // Create a mock implementation of useResponsive
  vi.mock('../../hooks/useResponsive', () => ({
    useResponsive: vi.fn().mockReturnValue({
      deviceType,
      width: deviceType === 'mobile' ? 320 : deviceType === 'tablet' ? 768 : 1200,
      height: 600,
      isMobileView: deviceType === 'mobile',
      isTabletView: deviceType === 'tablet',
      isDesktopView: deviceType === 'desktop',
      getResponsiveValue: vi.fn(),
      checkIsMobile: vi.fn(),
      checkIsTablet: vi.fn(),
      checkIsDesktop: vi.fn(),
    }),
  }));
};

describe('AuthLayout', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore the original implementation of useResponsive after each test
    vi.restoreAllMocks();
  });

  it('should render the title and subtitle', () => {
    // Render AuthLayout with test title and subtitle
    renderWithProviders(
      <AuthLayout title="Test Title" subtitle="Test Subtitle">
        <div>Test Content</div>
      </AuthLayout>
    );

    // Verify that title and subtitle are displayed in the document
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should render children content', () => {
    // Render AuthLayout with test child content
    renderWithProviders(
      <AuthLayout>
        <div>Test Child Content</div>
      </AuthLayout>
    );

    // Verify that child content is displayed in the document
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('should show logo when showLogo is true', () => {
    // Render AuthLayout with showLogo set to true
    renderWithProviders(<AuthLayout showLogo={true}><div>Test Content</div></AuthLayout>);

    // Verify that logo is displayed in the document
    const logo = screen.getByAltText('Metronomics Logo');
    expect(logo).toBeInTheDocument();
  });

  it('should not show logo when showLogo is false', () => {
    // Render AuthLayout with showLogo set to false
    renderWithProviders(<AuthLayout showLogo={false}><div>Test Content</div></AuthLayout>);

    // Verify that logo is not displayed in the document
    const logo = screen.queryByAltText('Metronomics Logo');
    expect(logo).not.toBeInTheDocument();
  });

  it('should hide branding column on mobile view', () => {
    // Mock useResponsive to return mobile device type
    mockUseResponsive('mobile');

    // Render AuthLayout component
    renderWithProviders(<AuthLayout><div>Test Content</div></AuthLayout>);

    // Verify that branding column is not displayed
    const brandingColumn = screen.queryByRole('img', { name: /login-background/i });
    expect(brandingColumn).not.toBeInTheDocument();
  });

  it('should show branding column on tablet view', () => {
    // Mock useResponsive to return tablet device type
    mockUseResponsive('tablet');

    // Render AuthLayout component
    renderWithProviders(<AuthLayout><div>Test Content</div></AuthLayout>);

    // Verify that branding column is displayed
    const brandingColumn = screen.getByRole('img', { name: /login-background/i });
    expect(brandingColumn).toBeInTheDocument();
  });

  it('should show branding column on desktop view', () => {
    // Mock useResponsive to return desktop device type
    mockUseResponsive('desktop');

    // Render AuthLayout component
    renderWithProviders(<AuthLayout><div>Test Content</div></AuthLayout>);

    // Verify that branding column is displayed
    const brandingColumn = screen.getByRole('img', { name: /login-background/i });
    expect(brandingColumn).toBeInTheDocument();
  });

  it('should render footer with copyright information', () => {
    // Render AuthLayout component
    renderWithProviders(<AuthLayout><div>Test Content</div></AuthLayout>);

    // Verify that footer with copyright text is displayed
    expect(screen.getByText(/© \d{4} Metronomics\. All rights reserved\./i)).toBeInTheDocument();
  });

  it('should render footer links', () => {
    // Render AuthLayout component
    renderWithProviders(<AuthLayout><div>Test Content</div></AuthLayout>);

    // Verify that footer links (Terms, Privacy, Help) are displayed
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
    expect(screen.getByText(/Help/i)).toBeInTheDocument();
  });
});