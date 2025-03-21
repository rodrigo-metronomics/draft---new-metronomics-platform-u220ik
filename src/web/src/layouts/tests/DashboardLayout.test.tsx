import React from 'react'; // React library for component creation // v18.2.0
import { render, screen } from '@testing-library/react'; // Testing library utilities for rendering and querying components // v14.0.0
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'; // React Router components for testing routing behavior // v6.14.0

import DashboardLayout from '../DashboardLayout'; // Import the DashboardLayout component to be tested
import { ROUTES } from '../../utils/constants/routes'; // Import route constants for testing navigation
import { renderWithRouter, createMockAuthUser } from '../../../tests/testUtils'; // Import test utility for rendering components with router context
import { vi } from 'vitest'; // v0.34.0

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({ useAuthContext: jest.fn() }));
// Mock the MainLayout component
jest.mock('../../components/layout/MainLayout', () => ({ __esModule: true, default: jest.fn().mockImplementation(({ children, showBreadcrumbs }) => <div data-testid="mock-main-layout" data-show-breadcrumbs={showBreadcrumbs}>{children}</div>) }));

// Mock the Navigate component from react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    Navigate: jest.fn().mockImplementation(({ to, state }) => <div data-testid="mock-navigate" data-to={to} data-state={JSON.stringify(state)} />)
}));

/**
 * Creates a mock AuthContext for testing different authentication states
 * @param isAuthenticated A boolean indicating whether the user is authenticated
 * @returns Mock AuthContext value with specified authentication state
 */
const mockAuthContext = (isAuthenticated: boolean) => ({
    state: {
        isAuthenticated: isAuthenticated,
        user: isAuthenticated ? createMockAuthUser() : null,
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
});

describe('DashboardLayout', () => {
    it('redirects to login page when user is not authenticated', () => {
        // Arrange: Mock the AuthContext with isAuthenticated set to false
        require('../../contexts/AuthContext').useAuthContext.mockReturnValue(mockAuthContext(false));

        // Act: Render the DashboardLayout with renderWithRouter
        renderWithRouter(<DashboardLayout>Test Content</DashboardLayout>, []);

        // Assert: Verify that Navigate is called with the login route path
        const mockNavigate = screen.getByTestId('mock-navigate');
        expect(mockNavigate).toBeInTheDocument();
        expect(mockNavigate).toHaveAttribute('data-to', ROUTES.AUTH.LOGIN);

        // Assert: Verify that the children content is not rendered
        expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('renders children when user is authenticated', () => {
        // Arrange: Mock the AuthContext with isAuthenticated set to true
        require('../../contexts/AuthContext').useAuthContext.mockReturnValue(mockAuthContext(true));

        // Act: Render the DashboardLayout with renderWithRouter and test child content
        renderWithRouter(<DashboardLayout>Test Content</DashboardLayout>, []);

        // Assert: Verify that the test child content is rendered
        expect(screen.getByText('Test Content')).toBeInTheDocument();

        // Assert: Verify that the MainLayout component is rendered
        const mockMainLayout = screen.getByTestId('mock-main-layout');
        expect(mockMainLayout).toBeInTheDocument();
    });

    it('passes showBreadcrumbs prop to MainLayout', () => {
        // Arrange: Mock the AuthContext with isAuthenticated set to true
        require('../../contexts/AuthContext').useAuthContext.mockReturnValue(mockAuthContext(true));

        // Act: Render the DashboardLayout with renderWithRouter and showBreadcrumbs set to true
        renderWithRouter(<DashboardLayout showBreadcrumbs={true}>Test Content</DashboardLayout>, []);

        // Assert: Verify that the MainLayout receives the showBreadcrumbs prop
        const mockMainLayout = screen.getByTestId('mock-main-layout');
        expect(mockMainLayout).toHaveAttribute('data-show-breadcrumbs', 'true');

        // Act: Repeat the test with showBreadcrumbs set to false
        renderWithRouter(<DashboardLayout showBreadcrumbs={false}>Test Content</DashboardLayout>, []);

        // Assert: Verify that the MainLayout receives the showBreadcrumbs prop
        const mockMainLayoutFalse = screen.getByTestId('mock-main-layout');
        expect(mockMainLayoutFalse).toHaveAttribute('data-show-breadcrumbs', 'false');
    });

    it('includes return location when redirecting to login', () => {
        // Arrange: Mock the AuthContext with isAuthenticated set to false
        require('../../contexts/AuthContext').useAuthContext.mockReturnValue(mockAuthContext(false));

        // Arrange: Set up a test location path
        const testLocationPath = '/test-location';

        // Act: Render the DashboardLayout with renderWithRouter at the test location
        renderWithRouter(<DashboardLayout>Test Content</DashboardLayout>, [], testLocationPath);

        // Assert: Verify that Navigate is called with state containing the return location
        const mockNavigate = screen.getByTestId('mock-navigate');
        expect(mockNavigate).toBeInTheDocument();
        expect(mockNavigate).toHaveAttribute('data-to', ROUTES.AUTH.LOGIN);
        const state = JSON.parse(mockNavigate.getAttribute('data-state') || '{}');
        expect(state.from.pathname).toBe(testLocationPath);
    });
});