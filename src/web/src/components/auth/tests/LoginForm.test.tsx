import React from 'react'; // version ^18.2.0
import { render, screen, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

import LoginForm from '../LoginForm';
import { renderWithProviders } from '../../../tests/testUtils';
import { AuthProvider } from '../../../types/auth.types';

describe('LoginForm', () => {
  // Test suite for the LoginForm component
  describe('LoginForm', () => {
    // Set up test suite for LoginForm component
    // Group related tests together
    // Run individual test cases

    it('renders the login form correctly', async () => {
      // Tests that the LoginForm component renders correctly with all expected elements
      // Render the LoginForm component with necessary providers
      renderWithProviders(<LoginForm />);

      // Check that email input field is present
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

      // Check that password input field is present
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Check that login button is present
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();

      // Check that forgot password link is present
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();

      // Check that SSO buttons are present
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with microsoft/i)).toBeInTheDocument();
    });

    it('validates email and password inputs', async () => {
      // Tests form validation for email and password fields
      // Set up user event for interactions
      const user = userEvent.setup();

      // Render the LoginForm component
      renderWithProviders(<LoginForm />);

      // Click the login button without entering any data
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Check that email required error message is displayed
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();

      // Check that password required error message is displayed
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();

      // Enter invalid email format
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Check that invalid email format error message is displayed
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();

      // Enter short password
      await user.type(screen.getByLabelText(/password/i), 'short');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Check that password length error message is displayed
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('calls login function with correct values on submit', async () => {
      // Tests that the login function is called with correct values when form is submitted
      // Create mock login function
      const mockLogin = vi.fn();

      // Create mock auth context with mocked login function
      const mockAuthContext = {
        state: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          permissions: [],
        },
        login: mockLogin,
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      };

      // Render LoginForm with mocked context
      renderWithProviders(<LoginForm />, { authContext: mockAuthContext });

      // Fill in valid email and password
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      // Verify that login function was called with correct email, password, and provider type
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          provider: AuthProvider.EMAIL_PASSWORD,
        });
      });
    });

    it('shows loading state during authentication', async () => {
      // Tests that loading state is shown during authentication process
      // Create mock auth context with isLoading state set to true
      const mockAuthContext = {
        state: {
          user: null,
          isAuthenticated: false,
          isLoading: true,
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
      };

      // Render LoginForm with mocked context
      renderWithProviders(<LoginForm />, { authContext: mockAuthContext });

      // Check that submit button shows loading state
      expect(screen.getByRole('button', { name: /login/i })).toHaveAttribute('aria-busy', 'true');

      // Verify that submit button is disabled during loading
      expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
    });

    it('displays error message when authentication fails', async () => {
      // Tests that error message is displayed when authentication fails
      // Create mock auth context with error state set to an error message
      const mockAuthContext = {
        state: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Invalid credentials',
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
      };

      // Render LoginForm with mocked context
      renderWithProviders(<LoginForm />, { authContext: mockAuthContext });

      // Check that error message is displayed in the form
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    it('calls onSuccess callback after successful login', async () => {
      // Tests that onSuccess callback is called after successful login
      // Create mock onSuccess callback function
      const mockOnSuccess = vi.fn();

      // Create mock login function that resolves successfully
      const mockLogin = vi.fn().mockResolvedValue(undefined);

      // Create mock auth context with mocked login function
      const mockAuthContext = {
        state: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          permissions: [],
        },
        login: mockLogin,
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn(),
        hasPermission: vi.fn(),
        hasRole: vi.fn(),
      };

      // Render LoginForm with mocked context and onSuccess prop
      renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />, { authContext: mockAuthContext });

      // Fill in valid email and password
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      // Wait for login promise to resolve
      await waitFor(() => {
        // Verify that onSuccess callback was called
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });
});