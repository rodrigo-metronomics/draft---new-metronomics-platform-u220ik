import React, { useState, useCallback } from 'react'; // React library for component creation // v18.2.0
import { useNavigate } from 'react-router-dom'; // Hook for navigation // v6.10.0
import styled from 'styled-components'; // For styling components // v5.3.10
import { Toast } from 'primereact/toast'; // Toast component for displaying notifications // v10.0.0
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'; // Confirmation dialog for delete actions // v10.0.0

// Internal imports
import DashboardLayout from '../../layouts/DashboardLayout'; // Layout wrapper for dashboard pages with authentication check
import UserTable from '../../components/users/UserTable'; // Table component for displaying user data
import UserInvite from '../../components/users/UserInvite'; // Component for inviting new users
import Card from '../../components/common/Card'; // Container component for page sections
import Button from '../../components/common/Button'; // Button component for actions
import Input from '../../components/common/Input'; // Input component for search field
import Select from '../../components/common/Select'; // Select component for filter dropdowns
import Modal from '../../components/common/Modal'; // Modal component for user invite form
import { useUsers } from '../../hooks/useUsers'; // Custom hook for user data and operations
import { useAuth } from '../../hooks/useAuth'; // Custom hook for authentication state and permissions
import { useOrganizationContext } from '../../contexts/OrganizationContext'; // Access current organization context
import { UserRole, getRoleDisplayName } from '../../utils/constants/roles'; // Role definitions and helper functions
import { Permission } from '../../utils/constants/permissions'; // Permission constants for access control
import { UserStatus } from '../../types/user.types'; // User status enum for filtering
import { SortDirection } from '../../types/common.types'; // Sort direction type for table sorting
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const FilterItem = styled.div`
  flex: 1;
  min-width: 200px;
  max-width: 300px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
`;

const PaginationInfo = styled.div`
  font-size: 0.875rem;
  color: var(--text-color-secondary);
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

// Define the UserListPage component
const UserListPage: React.FC = () => {
  // Initialize navigate function for routing
  const navigate = useNavigate();

  // Initialize toast reference for notifications
  const toast = React.useRef<Toast>(null);

  // Get current organization from OrganizationContext
  const { currentOrganization } = useOrganizationContext();

  // Get authentication state and permission checking from useAuth
  const { hasPermission } = useAuth();

  // Set up state for search term, filters, pagination, and sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [inviteModalVisible, setInviteModalVisible] = useState<boolean>(false);

  // Fetch users data with useUsers hook, passing filters, pagination, and sorting parameters
  const { users, isLoading, error, pagination, refetch, deactivateUser, activateUser, deleteUser } = useUsers();

  // Handle search input changes by updating search term state
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  // Handle filter changes for role and status filters
  const handleFilterChange = (filterType: 'role' | 'status', value: UserRole | UserStatus | undefined) => {
    if (filterType === 'role') {
      setRoleFilter(value as UserRole);
    } else if (filterType === 'status') {
      setStatusFilter(value as UserStatus);
    }
    setPage(1); // Reset to first page on filter change
  };

  // Handle sort changes for table columns
  const handleSort = (field: string, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Handle pagination changes for page number and page size
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page on page size change
  };

  // Handle user actions (view, edit, activate, deactivate, delete)
  const handleViewUser = (userId: string) => {
    navigate(ROUTES.USERS.DETAIL.replace(':id', userId));
  };

  const handleEditUser = (userId: string) => {
    navigate(ROUTES.USERS.DETAIL.replace(':id', userId));
  };

  const handleActivateUser = (userId: string) => {
    confirmDialog({
      message: 'Are you sure you want to activate this user?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        activateUser.mutate(userId);
        toast.current?.show({ severity: 'success', summary: 'User Activated', detail: 'User has been successfully activated', life: 3000 });
      },
      reject: () => {
        toast.current?.show({ severity: 'info', summary: 'Activation Cancelled', detail: 'User activation cancelled', life: 3000 });
      }
    });
  };

  const handleDeactivateUser = (userId: string) => {
    confirmDialog({
      message: 'Are you sure you want to deactivate this user?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        deactivateUser.mutate(userId);
        toast.current?.show({ severity: 'success', summary: 'User Deactivated', detail: 'User has been successfully deactivated', life: 3000 });
      },
      reject: () => {
        toast.current?.show({ severity: 'info', summary: 'Deactivation Cancelled', detail: 'User deactivation cancelled', life: 3000 });
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    confirmDialog({
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        deleteUser.mutate(userId);
        toast.current?.show({ severity: 'success', summary: 'User Deleted', detail: 'User has been successfully deleted', life: 3000 });
      },
      reject: () => {
        toast.current?.show({ severity: 'info', summary: 'Deletion Cancelled', detail: 'User deletion cancelled', life: 3000 });
      }
    });
  };

  // Implement user invitation modal toggle
  const toggleInviteModal = () => {
    setInviteModalVisible((prev) => !prev);
  };

  // Render page with DashboardLayout wrapper
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader>
          <PageTitle>User Management</PageTitle>
          {hasPermission(Permission.MANAGE_USERS) && (
            <Button label="Invite User" icon="pi pi-user-plus" onClick={toggleInviteModal} />
          )}
        </PageHeader>

        <FiltersContainer>
          <FilterItem>
            <Input
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={handleSearchChange}
              fullWidth
            />
          </FilterItem>
          <FilterItem>
            <Select
              placeholder="Select Role"
              options={[
                { label: 'All Roles', value: '' },
                ...Object.values(UserRole).map((role) => ({
                  label: getRoleDisplayName(role),
                  value: role,
                })),
              ]}
              value={roleFilter || ''}
              onChange={(value) => handleFilterChange('role', value as UserRole)}
              fullWidth
            />
          </FilterItem>
          <FilterItem>
            <Select
              placeholder="Select Status"
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: UserStatus.ACTIVE },
                { label: 'Inactive', value: UserStatus.INACTIVE },
                { label: 'Pending', value: UserStatus.PENDING },
              ]}
              value={statusFilter || ''}
              onChange={(value) => handleFilterChange('status', value as UserStatus)}
              fullWidth
            />
          </FilterItem>
        </FiltersContainer>

        <UserTable
          users={users?.users || []}
          loading={isLoading}
          showActions={hasPermission(Permission.MANAGE_USERS)}
          sortable
          defaultSortField={sortField}
          defaultSortDirection={sortDirection}
          onSort={handleSort}
          paginated
          currentPage={page}
          pageSize={pageSize}
          totalRecords={pagination?.total || 0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onViewUser={handleViewUser}
          onEditUser={handleEditUser}
          onActivateUser={handleActivateUser}
          onDeactivateUser={handleDeactivateUser}
          onDeleteUser={handleDeleteUser}
        />

        <PaginationContainer>
          <PaginationInfo>
            {`Showing ${((page - 1) * pageSize) + 1} to ${Math.min(page * pageSize, pagination?.total || 0)} of ${pagination?.total || 0} users`}
          </PaginationInfo>
          <PaginationControls>
            <Button
              label="Previous"
              icon="pi pi-chevron-left"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            />
            <Button
              label="Next"
              icon="pi pi-chevron-right"
              iconPos="right"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === (pagination?.totalPages || 1)}
            />
          </PaginationControls>
        </PaginationContainer>

        <Modal
          header="Invite New User"
          visible={inviteModalVisible}
          onHide={toggleInviteModal}
          size="medium"
        >
          <UserInvite onHide={toggleInviteModal} />
        </Modal>

        <Toast ref={toast} />
        <ConfirmDialog />
      </PageContainer>
    </DashboardLayout>
  );
};

export default UserListPage;