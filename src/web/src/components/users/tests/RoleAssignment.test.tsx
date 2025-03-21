import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

import RoleAssignment from '../RoleAssignment'; // Import the component being tested
import { renderWithProviders, createMockAuthUser } from '../../../tests/testUtils'; // Utility function to render components with all necessary providers for testing
import { UserRole, ROLE_DISPLAY_NAMES } from '../../../utils/constants/roles'; // Import role enum for testing different role scenarios
import { Permission } from '../../../utils/constants/permissions'; // Import permission constants for testing permission-based behavior

describe('RoleAssignment Component', () => {
  // Test suite for RoleAssignment component
  // Group related tests for the RoleAssignment component

  it('renders with current role selected', () => {
    // Individual test case for specific component behavior
    // Tests that the component renders with the current role correctly selected

    // Render RoleAssignment with a specific currentRole prop
    renderWithProviders(<RoleAssignment currentRole={UserRole.LEADERSHIP} onChange={() => {}} />);

    // Verify that the select element shows the correct role display name
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue(UserRole.LEADERSHIP);

    // Check that the label is rendered correctly
    const labelElement = screen.getByText('Role');
    expect(labelElement).toBeInTheDocument();
  });

  it('calls onChange when a new role is selected', async () => {
    // Individual test case for specific component behavior
    // Tests that the onChange callback is called with the new role when selection changes

    // Create a mock onChange function using vi.fn()
    const onChange = vi.fn();

    // Render RoleAssignment with the mock onChange function
    renderWithProviders(<RoleAssignment currentRole={UserRole.TEAM_MEMBER} onChange={onChange} />);

    // Simulate selecting a different role
    const selectElement = screen.getByRole('combobox');
    await userEvent.selectOptions(selectElement, [UserRole.VIEWER]);

    // Verify that onChange was called with the new role value
    expect(onChange).toHaveBeenCalledWith(UserRole.VIEWER);
  });

  it('disables the select when disabled prop is true', async () => {
    // Individual test case for specific component behavior
    // Tests that the component is disabled when the disabled prop is true

    // Render RoleAssignment with disabled={true}
    renderWithProviders(<RoleAssignment currentRole={UserRole.TEAM_MEMBER} onChange={() => {}} disabled={true} />);

    // Verify that the select element has the disabled attribute
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeDisabled();

    // Attempt to change the selection and verify onChange is not called
    const onChange = vi.fn();
    renderWithProviders(<RoleAssignment currentRole={UserRole.TEAM_MEMBER} onChange={onChange} disabled={true} />);
    await userEvent.click(selectElement);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('displays error message when error prop is provided', () => {
    // Individual test case for specific component behavior
    // Tests that the component displays the error message when the error prop is provided

    // Render RoleAssignment with an error message
    renderWithProviders(<RoleAssignment currentRole={UserRole.TEAM_MEMBER} onChange={() => {}} error="Invalid role" />);

    // Verify that the error message is displayed in the component
    const errorMessage = screen.getByText('Invalid role');
    expect(errorMessage).toBeInTheDocument();
  });

  it("filters available roles based on current user's role", async () => {
    // Individual test case for specific component behavior
    // Tests that users can only assign roles equal to or lower than their own role

    // Mock the auth context with a user having a specific role
    const mockAuthContext = {
      state: {
        user: createMockAuthUser({ role: UserRole.LEADERSHIP }),
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions: [Permission.MANAGE_ROLES],
      },
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithMicrosoft: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
      changePassword: vi.fn(),
      refreshToken: vi.fn(),
      hasPermission: vi.fn().mockReturnValue(true),
      hasRole: vi.fn().mockReturnValue(true),
    };

    // Render RoleAssignment with the mocked auth context
    renderWithProviders(<RoleAssignment currentRole={UserRole.TEAM_MEMBER} onChange={() => {}} />, { authContext: mockAuthContext });

    // Open the role dropdown
    const selectElement = screen.getByRole('combobox');
    await userEvent.click(selectElement);

    // Verify that only roles equal to or lower than the current user's role are available
    await waitFor(() => {
      expect(screen.getByRole('option', { name: ROLE_DISPLAY_NAMES[UserRole.LEADERSHIP] })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: ROLE_DISPLAY_NAMES[UserRole.TEAM_MEMBER] })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: ROLE_DISPLAY_NAMES[UserRole.VIEWER] })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: ROLE_DISPLAY_NAMES[UserRole.CEO] })).not.toBeInTheDocument();
      expect(screen.queryByRole('option', { name: ROLE_DISPLAY_NAMES[UserRole.COACH] })).not.toBeInTheDocument();
    });
  });

  it("disables the component when user doesn't have MANAGE_ROLES permission", async () => {
    // Individual test case for specific component behavior
    // Tests that the component is disabled when the user doesn't have the required permission

    // Mock the auth context with a user lacking the MANAGE_ROLES permission
    const mockAuthContext = {
      state: {
        user: createMockAuthUser(),
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
      hasPermission: vi.fn().mockReturnValue(false),
      hasRole: vi.fn().mockReturnValue(true),
    };

    // Render RoleAssignment with the mocked auth context
    renderWithProviders(<RoleAssignment currentRole={UserRole.TEAM_MEMBER} onChange={() => {}} />, { authContext: mockAuthContext });

    // Verify that the select element is disabled
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeDisabled();

    // Attempt to change the selection and verify onChange is not called
    const onChange = vi.fn();
    renderWithProviders(<RoleAssignment currentRole={UserRole.TEAM_MEMBER} onChange={onChange} />, { authContext: mockAuthContext });
    await userEvent.click(selectElement);
    expect(onChange).not.toHaveBeenCalled();
  });
});