import React from 'react';
import styled from 'styled-components'; // version ^5.3.10
import { PrimeIcons } from 'primereact/api'; // version ^10.0.0

import Table from '../common/Table';
import Badge from '../common/Badge';
import IconButton from '../common/IconButton';
import {
  UserResponse,
  UserStatus,
} from '../../types/user.types';
import {
  UserRole,
  getRoleDisplayName,
} from '../../utils/constants/roles';
import { Permission } from '../../utils/constants/permissions';
import { SortDirection } from '../../types/common.types';
import { useAuth } from '../../hooks/useAuth';
import { formatRelativeTime } from '../../utils/helpers/dateTimeHelper';

/**
 * Interface defining the props for the UserTable component.
 * Extends the base TableProps with user-specific properties.
 */
interface UserTableProps {
  users: UserResponse[];
  loading: boolean;
  showActions: boolean;
  sortable: boolean;
  defaultSortField: string;
  defaultSortDirection: SortDirection;
  onSort: (sortField: string, sortDirection: SortDirection) => void;
  paginated: boolean;
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewUser: (userId: string) => void;
  onEditUser?: (userId: string) => void;
  onActivateUser?: (userId: string) => void;
  onDeactivateUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Styled component for the actions container to hold action buttons.
 * Uses flexbox for layout and spacing.
 */
const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
  align-items: center;
`;

/**
 * Main component function that renders the user table with data and actions.
 * @param props - The props for the UserTable component.
 * @returns Rendered user table component.
 */
const UserTable: React.FC<UserTableProps> = ({
  users = [],
  loading = false,
  showActions = true,
  sortable = true,
  defaultSortField = 'name',
  defaultSortDirection = 'ASC',
  onSort,
  paginated = false,
  currentPage = 1,
  pageSize = 10,
  totalRecords = 0,
  onPageChange,
  onPageSizeChange,
  onViewUser,
  onEditUser,
  onActivateUser,
  onDeactivateUser,
  onDeleteUser,
  className,
  style,
}) => {
  // Get authentication context using useAuth hook
  const auth = useAuth();

  // Define table columns with appropriate headers and cell templates
  const columns = React.useMemo(
    () => [
      { field: 'name', header: 'Name', sortable: true },
      { field: 'email', header: 'Email', sortable: true },
      {
        field: 'role',
        header: 'Role',
        sortable: true,
        body: (user: UserResponse) => renderRoleCell(user),
      },
      {
        field: 'isActive',
        header: 'Status',
        sortable: true,
        body: (user: UserResponse) => renderStatusCell(user),
      },
      {
        field: 'lastLoginAt',
        header: 'Last Login',
        sortable: true,
        body: (user: UserResponse) => renderLastLoginCell(user),
      },
      ...(showActions
        ? [
            {
              field: 'actions',
              header: 'Actions',
              body: (user: UserResponse) =>
                renderActionsCell(user, { onEditUser, onActivateUser, onDeactivateUser, onDeleteUser }, {auth}),
            },
          ]
        : []),
    ],
    [showActions, onEditUser, onActivateUser, onDeactivateUser, onDeleteUser, auth]
  );

  // Handle sort events by calling onSort with field and direction
  const handleSort = (field: string, direction: SortDirection) => {
    onSort(field, direction);
  };

  // Render Table component with columns, data, and event handlers
  return (
    <Table
      className={className}
      style={style}
      data={users}
      columns={columns}
      loading={loading}
      sortable={sortable}
      defaultSortField={defaultSortField}
      defaultSortDirection={defaultSortDirection}
      onSort={handleSort}
      paginated={paginated}
      currentPage={currentPage}
      pageSize={pageSize}
      totalRecords={totalRecords}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
};

/**
 * Renders a user role with appropriate badge styling.
 * @param user - The user object containing role information.
 * @returns Rendered role badge.
 */
const renderRoleCell = (user: UserResponse): JSX.Element => {
  // Get the display name for the user's role
  const roleDisplayName = getRoleDisplayName(user.role);

  // Determine badge severity based on role (CEO/COACH get success, others get info)
  let severity = 'info';
  if (user.role === UserRole.CEO || user.role === UserRole.COACH) {
    severity = 'success';
  }

  // Render Badge component with role display name and appropriate severity
  return <Badge value={roleDisplayName} severity={severity} />;
};

/**
 * Renders a user status with appropriate badge styling.
 * @param user - The user object containing status information.
 * @returns Rendered status badge.
 */
const renderStatusCell = (user: UserResponse): JSX.Element => {
  // Determine badge severity based on isActive status (active gets success, inactive gets error)
  const severity = user.isActive ? 'success' : 'error';

  // Render Badge component with 'Active' or 'Inactive' text and appropriate severity
  return <Badge value={user.isActive ? 'Active' : 'Inactive'} severity={severity} />;
};

/**
 * Renders a formatted last login date or 'Never' if null.
 * @param user - The user object containing last login information.
 * @returns Rendered last login text.
 */
const renderLastLoginCell = (user: UserResponse): JSX.Element => {
  // Check if lastLoginAt is null
  if (!user.lastLoginAt) {
    // If null, return 'Never' text
    return <span>Never</span>;
  }

  // If not null, format the date using formatRelativeTime helper
  const formattedDate = formatRelativeTime(user.lastLoginAt);
  return <span>{formattedDate}</span>;
};

/**
 * Renders action buttons based on user permissions.
 * @param user - The user object.
 * @param handlers - Object containing action handlers.
 * @param auth - Authentication context.
 * @returns Rendered action buttons.
 */
const renderActionsCell = (
  user: UserResponse,
  handlers: {
    onEditUser?: (userId: string) => void;
    onActivateUser?: (userId: string) => void;
    onDeactivateUser?: (userId: string) => void;
    onDeleteUser?: (userId: string) => void;
  },
  auth: { hasPermission: (permission: Permission) => boolean }
): JSX.Element => {
  const { onEditUser, onActivateUser, onDeactivateUser, onDeleteUser } = handlers;

  // Create ActionsContainer styled component to hold buttons
  return (
    <ActionsContainer>
      {/* Always include view button that calls onViewUser with user.id */}
      <IconButton
        icon={<i className="pi pi-eye" />}
        tooltip="View User"
        onClick={() => onViewUser(user.id)}
      />

      {/* Check if user has MANAGE_USERS permission to show edit button */}
      {auth.hasPermission(Permission.MANAGE_USERS) && onEditUser && (
        <IconButton
          icon={<i className="pi pi-pencil" />}
          tooltip="Edit User"
          onClick={() => onEditUser(user.id)}
        />
      )}

      {/* Check if user has MANAGE_USERS permission to show activate/deactivate button */}
      {auth.hasPermission(Permission.MANAGE_USERS) && (onActivateUser || onDeactivateUser) && (
        user.isActive ? (
          onDeactivateUser && <IconButton
            icon={<i className="pi pi-ban" />}
            tooltip="Deactivate User"
            onClick={() => onDeactivateUser(user.id)}
          />
        ) : (
          onActivateUser && <IconButton
            icon={<i className="pi pi-check" />}
            tooltip="Activate User"
            onClick={() => onActivateUser(user.id)}
          />
        )
      )}

      {/* Check if user has MANAGE_USERS permission to show delete button */}
      {auth.hasPermission(Permission.MANAGE_USERS) && onDeleteUser && (
        <IconButton
          icon={<i className="pi pi-trash" />}
          tooltip="Delete User"
          variant="danger"
          onClick={() => onDeleteUser(user.id)}
        />
      )}
    </ActionsContainer>
  );
};

export default UserTable;