import React from 'react';
import styled from 'styled-components';
import Select from '../common/Select';
import FormField from '../common/FormField';
import { UserRole, ROLE_DISPLAY_NAMES, isRoleAtLeast } from '../../utils/constants/roles';
import { Permission } from '../../utils/constants/permissions';
import useAuth from '../../hooks/useAuth';
import { SelectOption } from '../../types/common.types';

/**
 * Props for the RoleAssignment component
 */
interface RoleAssignmentProps {
  /** The current role assigned to the user */
  currentRole: UserRole;
  /** Callback function when role selection changes */
  onChange: (role: UserRole) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Error message to display if validation fails */
  error?: string;
  /** Label text for the form field */
  label?: string;
}

/**
 * Styled container for the role assignment component
 */
const StyledRoleAssignment = styled.div`
  width: 100%;
  margin-bottom: 1rem;
`;

/**
 * A specialized component for assigning and managing user roles within the Metronomics Platform.
 * This component provides a user-friendly interface for administrators to change user roles
 * with appropriate validation and permission checks.
 * 
 * Features:
 * - Enforces role hierarchy (users can't assign roles higher than their own)
 * - Requires MANAGE_ROLES permission
 * - Integrates with form validation system
 */
const RoleAssignment: React.FC<RoleAssignmentProps> = ({
  currentRole,
  onChange,
  disabled = false,
  error = '',
  label = 'Role'
}) => {
  // Get current user and permission checking function from auth context
  const { state: { user }, hasPermission } = useAuth();
  
  // Check if user has permission to manage roles
  const canManageRoles = hasPermission(Permission.MANAGE_ROLES);
  
  // Disable component if user doesn't have permission to manage roles
  // or if it's explicitly disabled by parent component
  const isDisabled = disabled || !canManageRoles;
  
  // Create role options from UserRole enum and role display names
  const roleOptions: SelectOption[] = Object.values(UserRole).map(role => ({
    value: role,
    label: ROLE_DISPLAY_NAMES[role]
  }));
  
  // Filter available roles based on user's role
  // Users can only assign roles that are at or below their own level in the hierarchy
  const availableRoles = user ? roleOptions.filter(option => 
    isRoleAtLeast(user.role, option.value as UserRole)
  ) : roleOptions;
  
  // Handle role change event
  const handleRoleChange = (value: string | number): void => {
    onChange(value as UserRole);
  };
  
  return (
    <StyledRoleAssignment>
      <FormField
        id="role-assignment"
        name="role"
        label={label}
        error={error}
        touched={!!error}
      >
        <Select
          options={availableRoles}
          value={currentRole}
          onChange={handleRoleChange}
          disabled={isDisabled}
          hasError={!!error}
          placeholder="Select a role"
          fullWidth
        />
      </FormField>
    </StyledRoleAssignment>
  );
};

export default RoleAssignment;