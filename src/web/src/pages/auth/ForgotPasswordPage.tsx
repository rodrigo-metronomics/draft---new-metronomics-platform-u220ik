import React, { useState } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { Link } from 'react-router-dom'; // version ^6.10.0

import AuthLayout from '../../layouts/AuthLayout';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import { useForm } from '../../hooks/useForm';
import { validateEmail } from '../../utils/helpers/validationHelper';
import { resetPassword } from '../../services/firebase/firebaseAuth';
import { ROUTES } from '../../utils/constants/routes';

/**
 * Styled component for the form container
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
`;

/**
 * Styled component for the form actions
 */
const FormActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

/**
 * Styled component for the login link
 */
const LoginLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
`;

/**
 * Styled component for the link
 */
const StyledLink = styled(Link)`
  color: ${props => props.theme.colors.primary.main};
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.primary.dark};
    text-decoration: underline;
  }
`;

/**
 * Styled component for the success message
 */
const SuccessMessage = styled.div`
  background-color: ${props => props.theme.colors.success[50]};
  color: ${props => props.theme.colors.success[500]};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
`;

/**
 * Styled component for the error message
 */
const ErrorMessage = styled.div`
  background-color: ${props => props.theme.colors.error[50]};
  color: ${props => props.theme.colors.error[500]};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
`;

/**
 * ForgotPasswordPage Component
 *
 * This component renders a form that allows users to request a password reset email.
 * It includes form validation, submission handling, and displays success or error messages.
 */
const ForgotPasswordPage: React.FC = () => {
  // State variables for success and error messages
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial form values
  const initialValues = {
    email: '',
  };

  // Validation rules for the email field
  const validationRules = {
    email: {
      required: true,
      email: true,
    },
  };

  /**
   * Handles the form submission to request a password reset email
   * @param values - The form values containing the user's email
   */
  const onSubmit = async (values: typeof initialValues) => {
    try {
      // Call the resetPassword function from firebaseAuth service
      await resetPassword(values.email);
      // Set success state to true if the reset email is sent successfully
      setSuccess(true);
      // Clear any previous error messages
      setErrorMessage(null);
    } catch (error: any) {
      // Set error message if there was an error during form submission
      setSuccess(false);
      setErrorMessage(error.message || 'Failed to send reset email. Please try again.');
    }
  };

  // Use the useForm hook to manage form state, validation, and submission
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
  } = useForm({
    initialValues,
    validationRules,
    onSubmit,
  });

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset link"
    >
      {/* Display success message if reset email is sent successfully */}
      {success ? (
        <SuccessMessage>
          Password reset email sent! Check your inbox for instructions.
          <LoginLink>
            <StyledLink to={ROUTES.AUTH.LOGIN}>Back to Login</StyledLink>
          </LoginLink>
        </SuccessMessage>
      ) : (
        <FormContainer>
          {/* Render email input form with validation */}
          <FormField
            id="email"
            name="email"
            label="Email"
            error={errors.email}
            touched={touched.email}
          >
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email"
            />
          </FormField>

          <FormActions>
            {/* Render submit button with loading state */}
            <Button
              label="Send Reset Link"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
            />
          </FormActions>

          {/* Render error message if there was an error during form submission */}
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

          {/* Render link to return to login page */}
          <LoginLink>
            <StyledLink to={ROUTES.AUTH.LOGIN}>Back to Login</StyledLink>
          </LoginLink>
        </FormContainer>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;