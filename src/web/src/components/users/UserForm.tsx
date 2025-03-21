import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useForm } from '../../hooks/useForm';
import { validateRequired, validateEmail } from '../../utils/helpers/validationHelper';
import { UserRole, ROLE_DISPLAY_NAMES } from '../../utils/constants/roles';
import { UserStatus, CreateUserDto, UpdateUserDto, User } from '../../types/user.types';
import { ID } from '../../types/common.types';

/**
 * Interface for UserForm component props
 */
interface UserFormProps {
  initialData: User | null;
  onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
  isLoading: boolean;
  organizations: Array<{ id: ID, name: string }>;
  teams: Array<{ id: ID, name: string }>;
  mode: 'create' | 'edit';
  onCancel: () => void;
}

/**
 * Styled container for the entire form
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 600px;
`;

/**
 * Styled container for form rows with responsive behavior
 */
const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

/**
 * Styled container for form buttons
 */
const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

/**
 * A reusable form component for creating and editing users in the Metronomics Platform.
 * Handles user data input, validation, and submission, supporting both create and update operations.
 *
 * @param initialData - Pre-filled user data for editing, or null for create mode
 * @param onSubmit - Function to call when form is submitted and valid
 * @param isLoading - Whether the form submission is in progress
 * @param organizations - Array of available organizations for dropdown
 * @param teams - Array of available teams for dropdown
 * @param mode - Whether the form is in 'create' or 'edit' mode
 * @param onCancel - Function to call when form is cancelled
 */
const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  organizations,
  teams,
  mode,
  onCancel,
}) => {
  // Set up validation rules
  const validationRules = {
    firstName: { required: true },
    lastName: { required: true },
    email: { required: true, email: true },
    role: { required: true },
    status: { required: true },
    organizationId: { required: true },
  };

  // Set up initial form values
  const initialValues = {
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    role: initialData?.role || UserRole.TEAM_MEMBER,
    status: initialData?.status || UserStatus.ACTIVE,
    organizationId: initialData?.organizationId || '',
    teamIds: initialData?.teams?.map(team => team.id) || [],
    photoURL: initialData?.photoURL || '',
  };

  // Initialize form with useForm hook
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    isSubmitting,
  } = useForm({
    initialValues,
    validationRules,
    onSubmit: async (formValues) => {
      // Transform form values to appropriate DTO based on mode
      if (mode === 'create') {
        const createDto: CreateUserDto = {
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          role: formValues.role as UserRole,
          organizationId: formValues.organizationId ? formValues.organizationId : null,
          status: formValues.status as UserStatus,
          authId: '', // This would typically be set by the backend
          authProvider: 'EMAIL_PASSWORD', // Default provider for newly created users
          photoURL: formValues.photoURL || null,
        };
        await onSubmit(createDto);
      } else if (initialData) {
        const updateDto: UpdateUserDto = {
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          role: formValues.role as UserRole,
          status: formValues.status as UserStatus,
          photoURL: formValues.photoURL || null,
        };
        await onSubmit(updateDto);
      }
    },
  });

  // Create role options from UserRole enum
  const roleOptions = Object.values(UserRole).map(role => ({
    value: role,
    label: ROLE_DISPLAY_NAMES[role],
  }));

  // Create status options from UserStatus enum
  const statusOptions = Object.values(UserStatus).map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
  }));

  // Create organization options
  const organizationOptions = organizations.map(org => ({
    value: org.id,
    label: org.name,
  }));

  // Create team options
  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.name,
  }));

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <FormField
            id="firstName"
            name="firstName"
            label="First Name"
            required
            error={errors.firstName}
            touched={touched.firstName}
            fullWidth
          >
            <Input
              id="firstName"
              name="firstName"
              value={values.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              hasError={!!errors.firstName && touched.firstName}
              placeholder="Enter first name"
            />
          </FormField>

          <FormField
            id="lastName"
            name="lastName"
            label="Last Name"
            required
            error={errors.lastName}
            touched={touched.lastName}
            fullWidth
          >
            <Input
              id="lastName"
              name="lastName"
              value={values.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              hasError={!!errors.lastName && touched.lastName}
              placeholder="Enter last name"
            />
          </FormField>
        </FormRow>

        <FormField
          id="email"
          name="email"
          label="Email"
          required
          error={errors.email}
          touched={touched.email}
          fullWidth
        >
          <Input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            hasError={!!errors.email && touched.email}
            disabled={mode === 'edit'} // Email cannot be changed in edit mode
            placeholder="user@example.com"
          />
        </FormField>

        <FormRow>
          <FormField
            id="role"
            name="role"
            label="Role"
            required
            error={errors.role}
            touched={touched.role}
            fullWidth
          >
            <Select
              id="role"
              name="role"
              value={values.role}
              options={roleOptions}
              onChange={(value) => setFieldValue('role', value)}
              onBlur={handleBlur}
              hasError={!!errors.role && touched.role}
            />
          </FormField>

          <FormField
            id="status"
            name="status"
            label="Status"
            required
            error={errors.status}
            touched={touched.status}
            fullWidth
          >
            <Select
              id="status"
              name="status"
              value={values.status}
              options={statusOptions}
              onChange={(value) => setFieldValue('status', value)}
              onBlur={handleBlur}
              hasError={!!errors.status && touched.status}
            />
          </FormField>
        </FormRow>

        <FormField
          id="organizationId"
          name="organizationId"
          label="Organization"
          required
          error={errors.organizationId}
          touched={touched.organizationId}
          fullWidth
        >
          <Select
            id="organizationId"
            name="organizationId"
            value={values.organizationId}
            options={organizationOptions}
            onChange={(value) => setFieldValue('organizationId', value)}
            onBlur={handleBlur}
            hasError={!!errors.organizationId && touched.organizationId}
            disabled={mode === 'edit'} // Organization cannot be changed in edit mode
            placeholder="Select an organization"
          />
        </FormField>

        <FormField
          id="teamIds"
          name="teamIds"
          label="Teams"
          error={errors.teamIds}
          touched={touched.teamIds}
          helpText="Select a team for the user"
          fullWidth
        >
          {/* In a real implementation, this would be a multi-select component */}
          <Select
            id="teamIds"
            name="teamIds"
            value={values.teamIds[0] || ''}
            options={teamOptions}
            onChange={(value) => setFieldValue('teamIds', [value])}
            onBlur={handleBlur}
            hasError={!!errors.teamIds && touched.teamIds}
            placeholder="Select a team"
          />
        </FormField>

        <FormField
          id="photoURL"
          name="photoURL"
          label="Profile Photo URL"
          error={errors.photoURL}
          touched={touched.photoURL}
          helpText="Enter URL for user's profile photo (optional)"
          fullWidth
        >
          <Input
            id="photoURL"
            name="photoURL"
            value={values.photoURL}
            onChange={handleChange}
            onBlur={handleBlur}
            hasError={!!errors.photoURL && touched.photoURL}
            placeholder="https://example.com/photo.jpg"
          />
        </FormField>

        <ButtonContainer>
          <Button
            onClick={onCancel}
            text={true}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading || isSubmitting}
          >
            {mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </ButtonContainer>
      </form>
    </FormContainer>
  );
};

export default UserForm;