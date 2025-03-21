import React from 'react'; // version ^18.2.0
import { render, screen, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

// Internal imports
import SSOButtons from '../SSOButtons';
import { renderWithProviders } from '../../../tests/testUtils';
import {
  mockSignInWithGoogle,
  mockSignInWithMicrosoft,
  setMockCurrentUser,
  resetMockFirebase
} from '../../../tests/mocks/firebaseMocks';

describe('SSOButtons', () => {
  beforeEach(() => {
    resetMockFirebase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Google and Microsoft buttons', () => {
    renderWithProviders(<SSOButtons />);

    const googleButtonText = screen.getByText('Continue with Google');
    const microsoftButtonText = screen.getByText('Continue with Microsoft');

    expect(googleButtonText).toBeInTheDocument();
    expect(microsoftButtonText).toBeInTheDocument();
  });

  it('calls loginWithGoogle when Google button is clicked', async () => {
    const onSuccess = vi.fn();
    renderWithProviders(<SSOButtons onSuccess={onSuccess} />);

    const googleButton = screen.getByText('Continue with Google');
    await userEvent.click(googleButton);

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);

    // Simulate successful authentication
    setMockCurrentUser({ uid: 'test-user' });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('calls loginWithMicrosoft when Microsoft button is clicked', async () => {
    const onSuccess = vi.fn();
    renderWithProviders(<SSOButtons onSuccess={onSuccess} />);

    const microsoftButton = screen.getByText('Continue with Microsoft');
    await userEvent.click(microsoftButton);

    expect(mockSignInWithMicrosoft).toHaveBeenCalledTimes(1);

    // Simulate successful authentication
    setMockCurrentUser({ uid: 'test-user' });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('disables buttons during authentication process', async () => {
    // Mock the authentication state to indicate loading
    renderWithProviders(<SSOButtons />, {
      authContext: {
        state: {
          user: null,
          isAuthenticated: false,
          isLoading: true,
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
      }
    });

    const googleButton = screen.getByText('Continue with Google');
    const microsoftButton = screen.getByText('Continue with Microsoft');

    expect(googleButton).toBeDisabled();
    expect(microsoftButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  });

  it('handles authentication errors gracefully', async () => {
    // Mock the Google authentication to reject with an error
    mockSignInWithGoogle.mockRejectedValue(new Error('Google sign-in failed'));

    const onSuccess = vi.fn();
    renderWithProviders(<SSOButtons onSuccess={onSuccess} />);

    const googleButton = screen.getByText('Continue with Google');
    await userEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(googleButton).not.toBeDisabled();
  });

  it('applies custom className to container', () => {
    const customClassName = 'custom-sso-buttons';
    renderWithProviders(<SSOButtons className={customClassName} />);

    const container = screen.getByRole('group');
    expect(container).toHaveClass(customClassName);
  });
});