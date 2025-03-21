import React, { useState, useEffect } from 'react'; // React, useState, useEffect - v18.2.0
import { useNavigate } from 'react-router-dom'; // useNavigate - v6.10.0
import styled from 'styled-components'; // styled - v5.3.10

import { useAuthContext } from '../../contexts/AuthContext'; // Access authentication context for password reset functionality and state
import { useForm } from '../../hooks/useForm'; // Form state management, validation, and submission handling
import Button from '../../components/common/Button'; // Reusable button component for form submission
import Input from '../../components/common/Input'; // Reusable input component for email field
import FormField from '../../components/common/FormField'; // Reusable form field component for layout and error display
import { ROUTES } from '../../utils/constants/routes'; // Access route constants for navigation

/**
 * PageContainer: A styled div that centers the content vertically and horizontally,
 * filling the entire viewport height. It provides a consistent layout for authentication pages.
 */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: ${({ theme }) => theme.background.lightest};
`;

/**
 * FormContainer: A styled div that provides a card-like appearance for the form,
 * including a white background, rounded corners, and a subtle shadow.
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: ${({ theme }) => theme.surface.default};
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
`;

/**
 * Title: A styled h1 element that provides a consistent title style for the page.
 */
const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text.primary};
  margin-bottom: 1rem;
  text-align: center;
`;

/**
 * Description: A styled p element that provides a consistent description style for the page.
 */
const Description = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.text.secondary};
  margin-bottom: 1.5rem;
  text-align: center;
`;

/**
 * Form: A styled form element that provides a consistent layout for form fields.
 */
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

/**
 * ErrorMessage: A styled div that displays error messages with a consistent style.
 */
const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.statusColors.error};
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
  background-color: ${({ theme }) => theme.statusColors.errorLight};
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid ${({ theme }) => theme.statusColors.error};
`;

/**
 * SuccessMessage: A styled div that displays success messages with a consistent style.
 */
const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.statusColors.success};
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
  background-color: ${({ theme }) => theme.statusColors.successLight};
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid ${({ theme }) => theme.statusColors.success};
`;

/**
 * LoginLink: A styled a element that provides a consistent link style for the login page.
 */
const LoginLink = styled.a`
  color: ${({ theme }) => theme.primary.main};
  font-size: 0.875rem;
  text-align: center;
  margin-top: 1rem;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

/**
 * ResetPasswordPage: Page component for password reset functionality
 */
const ResetPasswordPage: React.FC = () => {
  const { resetPassword, state } = useAuthContext(); // Get resetPassword function and authentication state from useAuthContext hook
  const navigate = useNavigate(); // Initialize navigate function from useNavigate hook
  const [showSuccess, setShowSuccess] = useState(false); // Set up state for success message display

  // Set up form validation rules for email field
  const validationRules = {
    email: {
      required: 'Email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address',
      },
    },
  };

  // Initialize form state with useForm hook, providing initial values, validation rules, and submit handler
  const { values, errors, touched, isSubmitting, handleSubmit, handleChange } = useForm({
    initialValues: {
      email: '',
    },
    validationRules,
    onSubmit: async () => {
      if (values.email) {
        await resetPassword(values.email);
        setShowSuccess(true);
      }
    },
  });

  // Handle successful password reset by showing success message and redirecting to login after delay
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        navigate(ROUTES.AUTH.LOGIN);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  return (
    <PageContainer>
      <FormContainer>
        <Title>Reset Password</Title>
        <Description>Enter your email to receive a password reset link.</Description>

        <Form onSubmit={handleSubmit}>
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
              value={values.email || ''}
              placeholder="Your email address"
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </FormField>

          <Button type="submit" loading={isSubmitting} fullWidth>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </Form>

        {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
        {showSuccess && <SuccessMessage>Reset link sent! Redirecting...</SuccessMessage>}

        <LoginLink to={ROUTES.AUTH.LOGIN}>Back to Login</LoginLink>
      </FormContainer>
    </PageContainer>
  );
};

export default ResetPasswordPage;