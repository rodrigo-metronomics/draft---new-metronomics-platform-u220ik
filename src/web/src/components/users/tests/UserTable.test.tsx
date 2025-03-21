import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

import UserTable from '../UserTable'; // Component under test
import { renderWithProviders, createMockAuthUser } from '../../../tests/testUtils'; // Utility for rendering components with necessary providers
import { UserResponse } from '../../../types/user.types'; // Type definition for user data
import { UserRole, UserStatus } from '../../../utils/constants/roles'; // Role and status constants for test data
import { Permission } from '../../../utils/constants/permissions'; // Permission constants for testing access control
import { SortDirection } from '../../../types/common.types'; // Sort direction type for testing sorting functionality

/**
 * Creates an array of mock user data for testing
 * @param count The number of mock users to create
 * @returns An array of mock user objects
 */
const createMockUsers = (count: number): UserResponse[] => {
  const users: UserResponse[] = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: `user-${i}`,
      email: `test${i}@example.com`,
      firstName: `Test${i}`,
      lastName: 'User',
      name: `Test${i} User`,
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
      organizationId: 'test-org-id',
      photoURL: null,
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return users;
};

describe('UserTable component', () => {
  const mockUsers = createMockUsers(5);
  const onViewUser = vi.fn();
  const onEditUser = vi.fn();
  const onActivateUser = vi.fn();
  const onDeactivateUser = vi.fn();
  const onDeleteUser = vi.fn();
  const onSort = vi.fn();

  describe('rendering', () => {
    test('renders user data correctly', () => {
      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />);

      mockUsers.forEach((user) => {
        expect(screen.getByText(user.name)).toBeInTheDocument();
        expect(screen.getByText(user.email)).toBeInTheDocument();
      });
    });

    test('displays loading state', () => {
      renderWithProviders(<UserTable
        users={mockUsers}
        loading={true}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('shows empty message when no data', () => {
      renderWithProviders(<UserTable
        users={[]}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={0}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />);

      expect(screen.getByText('No records found')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    test('calls onSort when clicking sortable headers', async () => {
      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />);

      const nameHeader = screen.getByText('Name');
      await fireEvent.click(nameHeader);
      expect(onSort).toHaveBeenCalledWith('name', 'desc');

      await fireEvent.click(nameHeader);
      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });

    test('displays sort indicators correctly', () => {
      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />);

      const nameHeader = screen.getByText('Name');
      expect(nameHeader).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    test('displays action buttons based on permissions', () => {
      const authUserWithPermission = createMockAuthUser({ permissions: [Permission.MANAGE_USERS] });
      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />, { authContext: { state: { ...createMockAuthState(), user: authUserWithPermission, permissions: [Permission.MANAGE_USERS] } } });

      expect(screen.getAllByText('View User').length).toBe(mockUsers.length);
      expect(screen.getAllByText('Edit User').length).toBe(mockUsers.length);
      expect(screen.getAllByText('Delete User').length).toBe(mockUsers.length);

      const authUserWithoutPermission = createMockAuthUser({ permissions: [] });
      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />, { authContext: { state: { ...createMockAuthState(), user: authUserWithoutPermission, isAuthenticated: true, permissions: [] } } });

      expect(screen.getAllByText('View User').length).toBe(mockUsers.length);
      expect(() => screen.getByText('Edit User')).toThrowError();
      expect(() => screen.getByText('Delete User')).toThrowError();
    });

    test('calls action handlers when buttons are clicked', async () => {
      const authUserWithPermission = createMockAuthUser({ permissions: [Permission.MANAGE_USERS] });
      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />, { authContext: { state: { ...createMockAuthState(), user: authUserWithPermission, permissions: [Permission.MANAGE_USERS] } } });

      const viewButton = screen.getAllByText('View User')[0];
      await fireEvent.click(viewButton);
      expect(onViewUser).toHaveBeenCalledWith(mockUsers[0].id);

      const editButton = screen.getAllByText('Edit User')[0];
      await fireEvent.click(editButton);
      expect(onEditUser).toHaveBeenCalledWith(mockUsers[0].id);

      const deleteButton = screen.getAllByText('Delete User')[0];
      await fireEvent.click(deleteButton);
      expect(onDeleteUser).toHaveBeenCalledWith(mockUsers[0].id);
    });
  });

  describe('pagination', () => {
    test('displays pagination controls when paginated', () => {
      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={true}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();

      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={false}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />);

      expect(() => screen.getByRole('navigation')).toThrowError();
    });

    test('calls pagination callbacks correctly', async () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();

      renderWithProviders(<UserTable
        users={mockUsers}
        loading={false}
        showActions={true}
        sortable={true}
        defaultSortField="name"
        defaultSortDirection="ASC"
        onSort={onSort}
        paginated={true}
        currentPage={1}
        pageSize={10}
        totalRecords={mockUsers.length}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onViewUser={onViewUser}
        onEditUser={onEditUser}
        onActivateUser={onActivateUser}
        onDeactivateUser={onDeactivateUser}
        onDeleteUser={onDeleteUser}
      />);

      const nextPageButton = screen.getByRole('button', { name: 'Next page' });
      await fireEvent.click(nextPageButton);
      expect(onPageChange).toHaveBeenCalledWith(2);

      const pageSizeSelect = screen.getByLabelText('Select rows per page');
      await userEvent.selectOptions(pageSizeSelect, ['25']);
      expect(onPageSizeChange).toHaveBeenCalledWith(25);
    });
  });
});