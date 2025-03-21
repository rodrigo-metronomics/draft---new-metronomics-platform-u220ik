import React from 'react'; // v18.2.0
import { render, screen, waitFor, fireEvent } from '@testing-library/react'; // v14.0.0
import userEvent from '@testing-library/user-event'; // v14.0.0
import { act } from 'react-dom/test-utils'; // v18.2.0

// Internal imports
import RegisterPage from '../RegisterPage';
import { renderWithRouter, createMockAuthUser, createMockOrganization, waitForLoadingToFinish } from '../../../tests/testUtils';
import { ROUTES } from '../../../utils/constants/routes';
import { mockOrganization, setupAuthMocks, setupOrganizationMocks, createMockAdapter } from '../../../tests/mocks/apiMocks';

describe('Test suite for RegisterPage component', () => {
  let mockAdapter: any;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    setupAuthMocks(mockAdapter);
    setupOrganizationMocks(mockAdapter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the register form', async () => {
    const { container } = renderWithRouter(
      <RegisterPage />,
      [{ path: ROUTES.AUTH.REGISTER, element: <RegisterPage /> }],
      ROUTES.AUTH.REGISTER
    );

    await waitForLoadingToFinish(container);

    expect(screen.getByText('Create an Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should validate form fields', async () => {
    const { container } = renderWithRouter(
      <RegisterPage />,
      [{ path: ROUTES.AUTH.REGISTER, element: <RegisterPage /> }],
      ROUTES.AUTH.REGISTER
    );

    await waitForLoadingToFinish(container);

    const registerButton = screen.getByRole('button', { name: 'Register' });
    await act(async () => {
      userEvent.click(registerButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Please select an organization')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText('Email');
    await act(async () => {
      userEvent.type(emailInput, 'invalid-email');
      userEvent.blur(emailInput);
    });

    await waitFor(() => {
      expect(screen.getByText('The email \'invalid-email\' is not a valid email address.')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Password');
    await act(async () => {
      userEvent.type(passwordInput, 'Weak1');
      userEvent.blur(passwordInput);
    });

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.')).toBeInTheDocument();
    });

    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    await act(async () => {
      userEvent.type(confirmPasswordInput, 'different');
      userEvent.blur(confirmPasswordInput);
    });

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
  });

  it('should submit registration data and redirect on success', async () => {
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    setupAuthMocks(mockAdapter, { register: mockRegister });

    const { container, history } = renderWithRouter(
      <RegisterPage />,
      [{ path: ROUTES.AUTH.REGISTER, element: <RegisterPage /> }],
      ROUTES.AUTH.REGISTER
    );

    await waitForLoadingToFinish(container);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const organizationSelect = screen.getByLabelText('Organization');
    const registerButton = screen.getByRole('button', { name: 'Register' });

    await act(async () => {
      userEvent.type(firstNameInput, 'Test');
      userEvent.type(lastNameInput, 'User');
      userEvent.type(emailInput, 'test@example.com');
      userEvent.type(passwordInput, 'Strong1!');
      userEvent.type(confirmPasswordInput, 'Strong1!');
      fireEvent.change(organizationSelect, { target: { value: mockOrganization.id } });
    });

    await act(async () => {
      userEvent.click(registerButton);
    });

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Strong1!',
      confirmPassword: 'Strong1!',
      organizationId: mockOrganization.id,
    });

    await waitFor(() => {
      expect(history.location.pathname).toBe(ROUTES.DASHBOARD.HOME);
    });
  });

  it('should display error message on registration failure', async () => {
    const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));
    setupAuthMocks(mockAdapter, { register: mockRegister });

    const { container } = renderWithRouter(
      <RegisterPage />,
      [{ path: ROUTES.AUTH.REGISTER, element: <RegisterPage /> }],
      ROUTES.AUTH.REGISTER
    );

    await waitForLoadingToFinish(container);

    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const organizationSelect = screen.getByLabelText('Organization');
    const registerButton = screen.getByRole('button', { name: 'Register' });

    await act(async () => {
      userEvent.type(firstNameInput, 'Test');
      userEvent.type(lastNameInput, 'User');
      userEvent.type(emailInput, 'test@example.com');
      userEvent.type(passwordInput, 'Strong1!');
      userEvent.type(confirmPasswordInput, 'Strong1!');
      fireEvent.change(organizationSelect, { target: { value: mockOrganization.id } });
    });

    await act(async () => {
      userEvent.click(registerButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Registration failed')).toBeInTheDocument();
    });
  });

  it('should redirect to dashboard if user is already authenticated', async () => {
    const { history } = renderWithRouter(
      <RegisterPage />,
      [{ path: ROUTES.AUTH.REGISTER, element: <RegisterPage /> }],
      ROUTES.AUTH.REGISTER,
      {
        authContext: createMockAuthContext({
          state: createMockAuthState({ isAuthenticated: true }),
        }),
      }
    );

    expect(history.location.pathname).toBe(ROUTES.DASHBOARD.HOME);
  });
});