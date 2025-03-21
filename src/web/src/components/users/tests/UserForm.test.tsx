import React from 'react';
import { screen, waitFor } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi, describe, it, expect, beforeEach } from 'vitest'; // ^0.34.0

// Internal imports
import UserForm from '../UserForm';
import { renderWithProviders } from '../../../tests/testUtils';
import { CreateUserDto, UpdateUserDto, UserStatus } from '../../../types/user.types';
import { UserRole, ROLE_DISPLAY_NAMES } from '../../../utils/constants/roles';

// Define mock data for testing
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: UserRole.TEAM_MEMBER,
  status: UserStatus.ACTIVE,
  organizationId: '1',
  isActive: true
};

const mockOrganizations = [
  { id: '1', name: 'Acme Inc.' },
  { id: '2', name: 'Example Corp' }
];

const mockTeams = [
  { id: '1', name: 'Engineering' },
  { id: '2', name: 'Marketing' }
];

describe('UserForm', () => {
  // Setup function that runs before each test
  beforeEach(() => {
    vi.clearAllMocks(); // Reset all mocks before each test
  });

  it('should render create form with empty fields', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component in create mode with no initial data
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={() => {}}
    />);

    // Verify that the form title contains 'Create User'
    expect(screen.getByText(/Create User/i)).toBeInTheDocument();

    // Verify that all form fields are empty
    expect((screen.getByLabelText(/First Name/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Last Name/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Email/i) as HTMLInputElement).value).toBe('');

    // Verify that the submit button says 'Create User'
    expect(screen.getByRole('button', { name: /Create User/i })).toBeInTheDocument();
  });

  it('should render edit form with user data', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component in edit mode with mockUser data
    renderWithProviders(<UserForm
      initialData={mockUser}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="edit"
      onCancel={() => {}}
    />);

    // Verify that the form title contains 'Edit User'
    expect(screen.getByText(/Update User/i)).toBeInTheDocument();

    // Verify that form fields are populated with user data
    expect((screen.getByLabelText(/First Name/i) as HTMLInputElement).value).toBe(mockUser.firstName);
    expect((screen.getByLabelText(/Last Name/i) as HTMLInputElement).value).toBe(mockUser.lastName);
    expect((screen.getByLabelText(/Email/i) as HTMLInputElement).value).toBe(mockUser.email);

    // Verify that the submit button says 'Update User'
    expect(screen.getByRole('button', { name: /Update User/i })).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component in create mode
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={() => {}}
    />);

    // Click the submit button without filling any fields
    await userEvent.click(screen.getByRole('button', { name: /Create User/i }));

    // Verify that validation error messages are displayed for required fields (first name, last name, email, role)
    await waitFor(() => {
      expect(screen.getByText(/First Name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Last Name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Role is required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component in create mode
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={() => {}}
    />);

    // Fill in all fields with valid data except email
    await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
    await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');
    await userEvent.selectOptions(screen.getByLabelText(/Role/i), 'TEAM_MEMBER');

    // Enter an invalid email format
    await userEvent.type(screen.getByLabelText(/Email/i), 'invalid-email');

    // Click the submit button
    await userEvent.click(screen.getByRole('button', { name: /Create User/i }));

    // Verify that an email format validation error is displayed
    await waitFor(() => {
      expect(screen.getByText(/is not a valid email address/i)).toBeInTheDocument();
    });

    // Change to a valid email format
    await userEvent.clear(screen.getByLabelText(/Email/i));
    await userEvent.type(screen.getByLabelText(/Email/i), 'john@example.com');

    // Click the submit button again
    await userEvent.click(screen.getByRole('button', { name: /Create User/i }));

    // Verify that the email validation error is no longer displayed
    await waitFor(() => {
      expect(screen.queryByText(/is not a valid email address/i)).toBeNull();
    });
  });

  it('should call onSubmit with correct data in create mode', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component in create mode
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={() => {}}
    />);

    // Fill in all form fields with valid data
    await userEvent.type(screen.getByLabelText(/First Name/i), 'John');
    await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/Email/i), 'john@example.com');
    await userEvent.selectOptions(screen.getByLabelText(/Role/i), 'TEAM_MEMBER');
    await userEvent.selectOptions(screen.getByLabelText(/Status/i), 'active');
    await userEvent.selectOptions(screen.getByLabelText(/Organization/i), mockOrganizations[0].id);

    // Click the submit button
    await userEvent.click(screen.getByRole('button', { name: /Create User/i }));

    // Verify that onSubmit was called with the correct CreateUserDto data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: UserRole.TEAM_MEMBER,
        organizationId: mockOrganizations[0].id,
        status: UserStatus.ACTIVE,
        authId: '',
        authProvider: 'EMAIL_PASSWORD',
        photoURL: null,
      });
    });
  });

  it('should call onSubmit with correct data in edit mode', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component in edit mode with mockUser data
    renderWithProviders(<UserForm
      initialData={mockUser}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="edit"
      onCancel={() => {}}
    />);

    // Modify some form fields
    await userEvent.type(screen.getByLabelText(/First Name/i), '123');
    await userEvent.selectOptions(screen.getByLabelText(/Role/i), 'CEO');

    // Click the submit button
    await userEvent.click(screen.getByRole('button', { name: /Update User/i }));

    // Verify that onSubmit was called with the correct UpdateUserDto data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'John123',
        lastName: 'Doe',
        role: UserRole.CEO,
        status: UserStatus.ACTIVE,
        photoURL: null,
      });
    });
  });

  it('should display organization and team dropdowns', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component with mockOrganizations and mockTeams
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={() => {}}
    />);

    // Verify that the organization dropdown contains the correct options
    const organizationOptions = screen.getAllByRole('option', { hidden: true, name: /Acme Inc\.|Example Corp/i });
    expect(organizationOptions).toHaveLength(2);
    expect(organizationOptions[0]).toHaveTextContent(/Acme Inc./i);
    expect(organizationOptions[1]).toHaveTextContent(/Example Corp/i);

    // Verify that the team dropdown contains the correct options
    const teamOptions = screen.getAllByRole('option', { hidden: true, name: /Engineering|Marketing/i });
    expect(teamOptions).toHaveLength(2);
    expect(teamOptions[0]).toHaveTextContent(/Engineering/i);
    expect(teamOptions[1]).toHaveTextContent(/Marketing/i);
  });

  it('should display role dropdown with correct options', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={() => {}}
    />);

    // Verify that the role dropdown contains all role options with correct display names
    Object.values(UserRole).forEach(role => {
      expect(screen.getByRole('option', { hidden: true, name: ROLE_DISPLAY_NAMES[role] })).toBeInTheDocument();
    });

    // Verify that the role options match the UserRole enum values
    const roleOptions = screen.getAllByRole('option', { hidden: true });
    expect(roleOptions.length).toBe(Object.keys(UserRole).length);
  });

  it('should display status dropdown with correct options', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={() => {}}
    />);

    // Verify that the status dropdown contains all status options
    const statusOptions = screen.getAllByRole('option', { hidden: true });
    expect(statusOptions.length).toBe(Object.keys(UserStatus).length);

    // Verify that the status options match the UserStatus enum values
    Object.values(UserStatus).forEach(status => {
      const displayName = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      expect(screen.getByRole('option', { hidden: true, name: displayName })).toBeInTheDocument();
    });
  });

  it('should show loading state when isLoading is true', async () => {
    const onSubmit = vi.fn(); // Create a mock onSubmit function

    // Render the UserForm component with isLoading set to true
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={true}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={() => {}}
    />);

    // Verify that the submit button shows a loading indicator
    expect(screen.getByRole('button', { name: /Create User/i })).toHaveClass('p-disabled');

    // Verify that the form fields are disabled during loading
    expect((screen.getByLabelText(/First Name/i) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/Last Name/i) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/Email/i) as HTMLInputElement).disabled).toBe(true);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const onSubmit = vi.fn(); // Create mock onSubmit function
    const onCancel = vi.fn(); // Create mock onCancel functions

    // Render the UserForm component with the mock handlers
    renderWithProviders(<UserForm
      initialData={null}
      onSubmit={onSubmit}
      isLoading={false}
      organizations={mockOrganizations}
      teams={mockTeams}
      mode="create"
      onCancel={onCancel}
    />);

    // Click the cancel button
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // Verify that onCancel was called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});