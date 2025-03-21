import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { Link } from 'react-router-dom'; // version ^6.10.0

// Internal imports
import { useAuthContext } from '../../contexts/AuthContext';
import { useForm } from '../../hooks/useForm';
import Button from '../common/Button';
import Input from '../common/Input';
import FormField from '../common/FormField';
import SSOButtons from './SSOButtons';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from '../../utils/helpers/validationHelper';
import { useOrganization } from '../../hooks/useOrganization';

// Define the RegisterFormProps interface
interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

// Styled components for the RegisterForm
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  text-align: center;
  color: ${props => props.theme.neutral.medium};
  font-size: 0.875rem;

  &::before,
  &::after {
    flex-grow: 1;
    border-top: 1px solid ${props => props.theme.neutral.light};
    content: "";
  }

  &::before {
    margin-right: 0.5rem;
  }

  &::after {
    margin-left: 0.5rem;
  }
`;

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

const LoginLink = styled.div`
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
`;

const StyledLink = styled(Link)`
  color: ${props => props.theme.primary.main};
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const FieldRow = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;

  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

/**
 * A form component for user registration with email/password and organization selection
 */
const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, className, style }) => {
  // Destructure props to get onSuccess callback and any other props
  // Get register function and authentication state from useAuthContext hook
  const { register, state } = useAuthContext();

  // Initialize state for organizations list
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Use the useOrganization hook to fetch available organizations
  const { useGetOrganizations } = useOrganization();
  const { data: orgData, isLoading: orgLoading, error: orgError } = useGetOrganizations({}, { page: 1, pageSize: 1000 });

  // Fetch available organizations on component mount
  useEffect(() => {
    if (orgData) {
      setOrganizations(orgData);
    }
  }, [orgData]);

  // Set up form validation rules for email, password, confirmPassword, firstName, lastName, and organizationId fields
  const validationRules = {
    email: {
      required: 'Email is required',
      validate: validateEmail,
    },
    password: {
      required: 'Password is required',
      validate: validatePassword,
    },
    confirmPassword: {
      required: 'Please confirm your password',
      validate: (value: string, values: any) => validatePasswordMatch(values.password, value),
    },
    firstName: {
      required: 'First name is required',
    },
    lastName: {
      required: 'Last name is required',
    },
    organizationId: {
      required: 'Please select an organization',
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
      confirmPassword: '',
      firstName: '',
      lastName: '',
      organizationId: '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      // Define handleSubmit function that calls register with form values
      try {
        await register(formValues);
        // Handle successful registration by calling onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        // Error handling is managed by the AuthContext
        console.error('Registration error:', error);
      }
    },
  });

  return (
    <FormContainer className={className} style={style} onSubmit={handleSubmit}>
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
      <FieldRow>
        <FormField
          id="firstName"
          name="firstName"
          label="First Name"
          error={errors.firstName}
          touched={touched.firstName}
          required
        >
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={values.firstName}
            placeholder="Enter your first name"
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </FormField>
        <FormField
          id="lastName"
          name="lastName"
          label="Last Name"
          error={errors.lastName}
          touched={touched.lastName}
          required
        >
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={values.lastName}
            placeholder="Enter your last name"
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </FormField>
      </FieldRow>
      <FormField
        id="email"
        name="email"
        label="Email"
        error={errors.email}
        touched={touched.email}
        required
      >
        <Input
          id="email"
          name="email"
          type="email"
          value={values.email}
          placeholder="Enter your email"
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </FormField>
      <FormField
        id="password"
        name="password"
        label="Password"
        error={errors.password}
        touched={touched.password}
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          value={values.password}
          placeholder="Enter your password"
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </FormField>
      <FormField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        error={errors.confirmPassword}
        touched={touched.confirmPassword}
        required
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          placeholder="Confirm your password"
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </FormField>
      <FormField
        id="organizationId"
        name="organizationId"
        label="Organization"
        error={errors.organizationId}
        touched={touched.organizationId}
        required
      >
        <select
          id="organizationId"
          name="organizationId"
          value={values.organizationId}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            color: '#495057',
            backgroundColor: '#fff',
            border: '1px solid #ced4da',
            borderRadius: '0.25rem',
            transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          }}
        >
          <option value="">Select an organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </FormField>
      <Button type="submit" loading={isSubmitting} fullWidth>
        Register
      </Button>
      <Divider>OR</Divider>
      <SSOButtons onSuccess={onSuccess} />
      <LoginLink>
        Already have an account? <StyledLink to="/login">Login</StyledLink>
      </LoginLink>
    </FormContainer>
  );
};

export default RegisterForm;