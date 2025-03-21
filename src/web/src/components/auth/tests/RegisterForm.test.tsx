import React from 'react'; // version ^18.2.0
import { render, screen, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

// Internal imports
import RegisterForm from '../RegisterForm';
import { renderWithProviders, createMockOrganization } from '../../../tests/testUtils';
import { VALIDATION_ERRORS } from '../../../utils/constants/errorMessages';

// Define mock organization data for testing the organization dropdown
const mockOrganizations = [
  { id: 'org1', name: 'Acme Inc', description: 'Test organization 1' },
  { id: 'org2', name: 'Globex Corp', description: 'Test organization 2' },
];

// Define valid form data for testing successful form submission
const validFormData = {
  email: 'test@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  firstName: 'John',
  lastName: 'Doe',
  organizationId: 'org1',
};

// Define invalid email format for testing email validation
const invalidEmail = 'invalid-email';

// Define weak password for testing password complexity validation
const weakPassword = 'password';

describe('RegisterForm', () => {
  const setup = () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    const mockOnSuccess = vi.fn();

    return { user, mockRegister, mockOnSuccess };
  };

  it('renders the registration form correctly', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const { user, mockRegister } = setup();
    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Please select an organization')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email format', async () => {
    const { user, mockRegister } = setup();
    renderWithProviders(<RegisterForm />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, invalidEmail);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText(`The email '${invalidEmail}' is not a valid email address.`)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows validation error for weak password', async () => {
    const { user, mockRegister } = setup();
    renderWithProviders(<RegisterForm />);

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, weakPassword);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords don't match", async () => {
    const { user, mockRegister } = setup();
    renderWithProviders(<RegisterForm />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword!');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    const { user, mockRegister } = setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText('Email'), validFormData.email);
    await user.type(screen.getByLabelText('Password'), validFormData.password);
    await user.type(screen.getByLabelText('Confirm Password'), validFormData.confirmPassword);
    await user.type(screen.getByLabelText('First Name'), validFormData.firstName);
    await user.type(screen.getByLabelText('Last Name'), validFormData.lastName);
    await user.selectOptions(screen.getByLabelText('Organization'), validFormData.organizationId);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(mockRegister).toHaveBeenCalledWith(validFormData);
  });

  it('calls onSuccess callback after successful registration', async () => {
    const { user, mockRegister, mockOnSuccess } = setup();
    renderWithProviders(<RegisterForm onSuccess={mockOnSuccess} />);

    await user.type(screen.getByLabelText('Email'), validFormData.email);
    await user.type(screen.getByLabelText('Password'), validFormData.password);
    await user.type(screen.getByLabelText('Confirm Password'), validFormData.confirmPassword);
    await user.type(screen.getByLabelText('First Name'), validFormData.firstName);
    await user.type(screen.getByLabelText('Last Name'), validFormData.lastName);
    await user.selectOptions(screen.getByLabelText('Organization'), validFormData.organizationId);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
  });

  it('displays error message when registration fails', async () => {
    const { user, mockRegister } = setup();
    const errorMessage = 'Registration failed';
    mockRegister.mockRejectedValue(new Error(errorMessage));
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText('Email'), validFormData.email);
    await user.type(screen.getByLabelText('Password'), validFormData.password);
    await user.type(screen.getByLabelText('Confirm Password'), validFormData.confirmPassword);
    await user.type(screen.getByLabelText('First Name'), validFormData.firstName);
    await user.type(screen.getByLabelText('Last Name'), validFormData.lastName);
    await user.selectOptions(screen.getByLabelText('Organization'), validFormData.organizationId);
    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(screen.getByText(errorMessage)).toBeInTheDocument());
  });

  it('populates organization dropdown with available organizations', async () => {
    const { user } = setup();
    renderWithProviders(<RegisterForm />, {
      organizationContext: {
        organizations: mockOrganizations,
        currentOrganization: null,
        teams: [],
        loading: false,
        error: null,
        fetchOrganizations: vi.fn(),
        fetchCurrentOrganization: vi.fn(),
        switchOrganization: vi.fn(),
        updateOrganization: vi.fn(),
        updateOrganizationSettings: vi.fn(),
        fetchTeams: vi.fn(),
      },
    });

    await user.click(screen.getByLabelText('Organization'));

    expect(screen.getByText(mockOrganizations[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizations[1].name)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Organization'), mockOrganizations[1].id);
    expect((screen.getByLabelText('Organization') as HTMLSelectElement).value).toBe(mockOrganizations[1].id);
  });
});