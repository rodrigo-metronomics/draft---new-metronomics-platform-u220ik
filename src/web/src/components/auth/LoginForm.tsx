import React, { useState } from 'react'; // version ^18.2.0
import styled, { css } from 'styled-components'; // version ^5.3.10
import { useAuthContext } from '../../contexts/AuthContext';
import { useForm } from '../../hooks/useForm';
import Button from '../common/Button';
import Input from '../common/Input';
import FormField from '../common/FormField';
import SSOButtons from './SSOButtons';
import { AuthProvider } from '../../types/auth.types';

/**
 * Interface for LoginForm props defining onSuccess callback, className, and style
 */
interface LoginFormProps {
  /** Callback function called after successful login */
  onSuccess?: () => void;
  /** Additional CSS class to apply to the form container */
  className?: string;
  /** Additional inline styles to apply to the form container */
  style?: React.CSSProperties;
}

/**
 * Styled component for the form container with flex layout and styling
 */
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

/**
 * Styled component for a divider line with "OR" text
 */
const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  text-align: center;
  color: ${props => props.theme.neutral.medium};
  font-size: 0.875rem;

  &:before,
  &:after {
    flex-grow: 1;
    border-top: 1px solid ${props => props.theme.neutral.light};
    content: "";
  }

  &:before {
    margin-right: 0.5rem;
  }

  &:after {
    margin-left: 0.5rem;
  }
`;

/**
 * Styled component for displaying error messages
 */
const ErrorMessage = styled.div`
  color: ${props => props.theme.statusColors.error};
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
  background-color: ${props => props.theme.statusColors.errorLight};
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid ${props => props.theme.statusColors.error};
`;

/**
 * Styled component for the forgot password link
 */
const ForgotPasswordLink = styled.a`
  color: ${props => props.theme.primary.main};
  font-size: 0.875rem;
  text-align: right;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

/**
 * A form component for user authentication with email/password and SSO options
 */
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, className, style }) => {
  // Destructure props to get onSuccess callback and any other props
  // Get login function and authentication state from useAuthContext hook
  const { login, state } = useAuthContext();

  // Set up form validation rules for email and password fields
  const validationRules = {
    email: {
      required: 'Email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address',
      },
    },
    password: {
      required: 'Password is required',
      minLength: {
        value: 8,
        message: 'Password must be at least 8 characters',
      },
    },
  };

  // Initialize form state with useForm hook, providing initial values, validation rules, and submit handler
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      // Define handleSubmit function that calls login with form values and provider type
      try {
        await login({
          email: formValues.email,
          password: formValues.password,
          provider: AuthProvider.EMAIL_PASSWORD,
        });
        // Handle successful login by calling onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        // Error handling is managed by the AuthContext
        console.error('Login error:', error);
      }
    },
  });

  return (
    // Render form with email and password inputs, validation errors, and submit button
    <FormContainer className={className} style={style} onSubmit={handleSubmit}>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
      <FormField
        id="email"
        name="email"
        label="Email"
        error={errors.email}
        touched={touched.email}
      >
        <Input
          type="email"
          name="email"
          value={values.email}
          placeholder="Enter your email"
          onChange={handleChange}
          onBlur={handleBlur}
          fullWidth
        />
      </FormField>
      <FormField
        id="password"
        name="password"
        label="Password"
        error={errors.password}
        touched={touched.password}
      >
        <Input
          type="password"
          name="password"
          value={values.password}
          placeholder="Enter your password"
          onChange={handleChange}
          onBlur={handleBlur}
          fullWidth
        />
      </FormField>
      <ForgotPasswordLink href="/forgot-password">Forgot password?</ForgotPasswordLink>
      {/* Show loading state on the submit button during authentication */}
      <Button type="submit" fullWidth loading={state.isLoading}>
        Login
      </Button>
      {/* Display authentication error message if login fails */}
      <Divider>OR</Divider>
      {/* Include SSOButtons component for alternative login methods */}
      <SSOButtons onSuccess={onSuccess} />
    </FormContainer>
  );
};

export default LoginForm;