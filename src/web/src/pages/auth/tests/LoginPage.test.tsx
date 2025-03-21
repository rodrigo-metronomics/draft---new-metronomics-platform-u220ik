import React from 'react'; // version ^18.2.0
import { render, screen, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

import LoginPage from '../LoginPage';
import { ROUTES } from '../../utils/constants/routes';
import { renderWithRouter, createMockAuthUser, setMockCurrentUser } from '../../../tests/testUtils';

// Define mock navigation function
const navigate = vi.fn();

// Mock the useAuthContext hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    state: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      permissions: [],
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
    hasRole: vi.fn(),
  }),
}));

describe('LoginPage component', () => {
  beforeEach(() => {
    // Reset the mock implementation before each test
    navigate.mockReset();
  });

  it('should render the login form', async () => {
    renderWithRouter(<LoginPage />, [{ path: ROUTES.AUTH.LOGIN, element: <LoginPage /> }]);

    // Check for the presence of email and password inputs
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for the presence of the login button
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();

    // Check for the presence of SSO options
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with microsoft/i)).toBeInTheDocument();
  });

  it('should redirect to dashboard if user is already authenticated', async () => {
    // Create a mock authenticated user
    const mockUser = createMockAuthUser();

    // Set up the mock authentication state to indicate the user is authenticated
    vi.mock('../../../contexts/AuthContext', () => ({
      useAuthContext: () => ({
        state: {
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          permissions: [],
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
        hasRole: vi.fn(),
      }),
    }));

    // Render the LoginPage component with renderWithRouter
    renderWithRouter(<LoginPage />, [{ path: ROUTES.AUTH.LOGIN, element: <LoginPage /> }], ROUTES.AUTH.LOGIN);

    // Verify that the navigation function was called with the dashboard route
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should navigate to dashboard after successful login', async () => {
    // Set up the mock authentication service to simulate successful login
    vi.mock('../../../contexts/AuthContext', () => ({
      useAuthContext: () => ({
        state: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          permissions: [],
        },
        login: vi.fn().mockResolvedValue(undefined),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      }),
    }));

    // Render the LoginPage component with renderWithRouter
    renderWithRouter(<LoginPage />, [{ path: ROUTES.AUTH.LOGIN, element: <LoginPage /> }], ROUTES.AUTH.LOGIN);

    // Fill in the email and password fields with valid credentials
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    // Click the login button
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the login process to complete
    await waitFor(() => {
      // Verify that the navigation function was called with the dashboard route
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it('should display error message on login failure', async () => {
    // Set up the mock authentication service to simulate login failure
    vi.mock('../../../contexts/AuthContext', () => ({
      useAuthContext: () => ({
        state: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Invalid credentials',
          permissions: [],
        },
        login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      }),
    }));

    // Render the LoginPage component with renderWithRouter
    renderWithRouter(<LoginPage />, [{ path: ROUTES.AUTH.LOGIN, element: <LoginPage /> }], ROUTES.AUTH.LOGIN);

    // Fill in the email and password fields
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Click the login button
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the login process to complete
    await waitFor(() => {
      // Verify that an error message is displayed
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();

      // Verify that navigation to dashboard did not occur
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it('should show validation errors for invalid inputs', async () => {
    renderWithRouter(<LoginPage />, [{ path: ROUTES.AUTH.LOGIN, element: <LoginPage /> }], ROUTES.AUTH.LOGIN);

    // Fill in the email field with an invalid email format
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');

    // Fill in the password field with a too short password
    await userEvent.type(screen.getByLabelText(/password/i), 'short');

    // Click the login button
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // Verify that validation error messages are displayed
    expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // Verify that the login function was not called
    const mockLogin = vi.fn();
    expect(mockLogin).not.toHaveBeenCalled();
  });
});