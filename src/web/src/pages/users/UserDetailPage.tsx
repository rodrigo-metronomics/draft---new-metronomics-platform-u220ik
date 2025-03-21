import React, { useState, useEffect, useCallback, useRef } from 'react'; // React library for building user interfaces // v18.2.0
import styled from 'styled-components'; // For styling React components // v5.3.10
import { useParams, useNavigate } from 'react-router-dom'; // For handling routing and navigation // v6.8.0

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout component for dashboard pages
import Card from '../../components/common/Card'; // Container component for sections of the page
import Button from '../../components/common/Button'; // Button component for actions
import Tabs from '../../components/common/Tabs'; // Tabs component for organizing content
import Modal from '../../components/common/Modal'; // Modal component for confirmations and forms
import Spinner from '../../components/common/Spinner'; // Loading indicator component
import Toast from '../../components/common/Toast'; // Toast notification component
import UserForm from '../../components/users/UserForm'; // Form component for editing user details
import TeamMembersList from '../../components/users/TeamMembersList'; // Component for displaying and managing team memberships
import RoleAssignment from '../../components/users/RoleAssignment'; // Component for assigning user roles
import { useUsers } from '../../hooks/useUsers'; // Hook for user data and operations
import { useTeams } from '../../hooks/useTeams'; // Hook for team data and operations
import { useOrganization } from '../../hooks/useOrganization'; // Hook for organization data
import { useAuth } from '../../hooks/useAuth'; // Hook for authentication state and permissions
import {
  UserDetailResponse,
  UpdateUserDto,
  UserStatus,
} from '../../types/user.types'; // Type definitions for user data
import {
  TeamMemberWithUser,
  TeamRole,
  AddTeamMemberDto,
} from '../../types/team.types'; // Type definitions for team data
import { ID } from '../../types/common.types'; // Common type definitions
import { Permission } from '../../utils/constants/permissions'; // Permission constants for access control
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation
import { formatDateTime } from '../../utils/helpers/dateTimeHelper'; // Helper function for formatting dates

// Styled Components for layout and appearance
const PageContainer = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const UserInfoSection = styled.div`
  margin-bottom: 2rem;
`;

const UserInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
  margin-bottom: 1rem;
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  font-weight: 500;
`;

const TabContent = styled.div`
  padding: 1.5rem 0;
`;

const ModalContent = styled.div`
  padding: 1.5rem;
  min-width: 500px;
  max-width: 90vw;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--error-main);
`;

/**
 * Main component for displaying and managing user details
 */
const UserDetailPage: React.FC = () => {
  // Extract userId from URL parameters using useParams hook
  const { id: userId } = useParams<{ id: string }>();

  // Initialize navigation with useNavigate hook
  const navigate = useNavigate();

  // Initialize state for user data, loading states, active tab, and modals
  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Initialize toast reference for notifications
  const toast = useRef<Toast>(null);

  // Get user management functions from useUsers hook
  const {
    getUserById,
    updateUser,
    deactivateUser,
    activateUser,
    deleteUser,
  } = useUsers();

  // Get team management functions from useTeams hook
  const {
    getTeamMembers,
    addTeamMembers,
    updateTeamMemberRole,
    removeTeamMember,
  } = useTeams();

  // Get organization data from useOrganization hook
  const { organizations } = useOrganization();

  // Get permission checking from useAuth hook
  const { hasPermission } = useAuth();

  // Fetch user details when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      setLoading(true);
      getUserById(userId)
        .then((response) => {
          setUser(response);
        })
        .catch((error) => {
          console.error('Failed to fetch user:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load user details.',
            life: 3000,
          });
        })
        .finally(() => setLoading(false));
    }
  }, [userId, getUserById]);

  // Fetch teams data for the user's organization
  const { teams, isLoading: isTeamsLoading } = useTeams();

  // Handle tab changes with setActiveTab function
  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  // Implement handleEditUser function to show edit form modal
  const handleEditUser = () => {
    setShowEditModal(true);
  };

  // Implement handleUpdateUser function to save user changes
  const handleUpdateUser = async (userData: UpdateUserDto) => {
    if (userId) {
      try {
        await updateUser({ id: userId, userData });
        setUser((prevUser) => ({ ...prevUser, ...userData }));
        setShowEditModal(false);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User updated successfully.',
          life: 3000,
        });
      } catch (error) {
        console.error('Failed to update user:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update user.',
          life: 3000,
        });
      }
    }
  };

  // Implement handleActivateUser function to activate a deactivated user
  const handleActivateUser = async () => {
    if (userId) {
      try {
        await activateUser(userId);
        setUser((prevUser) => ({ ...prevUser, status: UserStatus.ACTIVE }));
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User activated successfully.',
          life: 3000,
        });
      } catch (error) {
        console.error('Failed to activate user:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to activate user.',
          life: 3000,
        });
      }
    }
  };

  // Implement handleDeactivateUser function to deactivate a user
  const handleDeactivateUser = async () => {
    if (userId) {
      try {
        await deactivateUser(userId);
        setUser((prevUser) => ({ ...prevUser, status: UserStatus.INACTIVE }));
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User deactivated successfully.',
          life: 3000,
        });
      } catch (error) {
        console.error('Failed to deactivate user:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to deactivate user.',
          life: 3000,
        });
      }
    }
  };

  // Implement handleDeleteUser function with confirmation modal
  const handleDeleteUser = () => {
    setShowConfirmation(true);
  };

  const confirmDeleteUser = async () => {
    if (userId) {
      try {
        await deleteUser(userId);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User deleted successfully.',
          life: 3000,
        });
        navigate(ROUTES.USERS.LIST);
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete user.',
          life: 3000,
        });
      } finally {
        setShowConfirmation(false);
      }
    }
  };

  // Implement handleAddTeam function to add user to a team
  const handleAddTeam = async (member: AddTeamMemberDto) => {
    try {
      await addTeamMembers({ teamId: member.userId, memberData: member });
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Team member added successfully.',
        life: 3000,
      });
    } catch (error) {
      console.error('Failed to add team member:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to add team member.',
        life: 3000,
      });
    }
  };

  // Implement handleUpdateTeamRole function to change user's role in a team
  const handleUpdateTeamRole = async (memberId: ID, role: TeamRole) => {
    try {
      await updateTeamMemberRole({ teamId: userId, userId: memberId, roleData: { role } });
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Team member role updated successfully.',
        life: 3000,
      });
    } catch (error) {
      console.error('Failed to update team member role:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update team member role.',
        life: 3000,
      });
    }
  };

  // Implement handleRemoveFromTeam function to remove user from a team
  const handleRemoveFromTeam = async (memberId: ID) => {
    try {
      await removeTeamMember({ teamId: userId, userId: memberId });
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Team member removed successfully.',
        life: 3000,
      });
    } catch (error) {
      console.error('Failed to remove team member:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to remove team member.',
        life: 3000,
      });
    }
  };

  // Render loading spinner while data is being fetched
  if (loading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <Spinner size="large" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Render error message if user not found
  if (!user) {
    return (
      <DashboardLayout>
        <PageContainer>
          <ErrorMessage>User not found</ErrorMessage>
        </PageContainer>
      </DashboardLayout>
    );
  }

  // Check permissions for actions
  const canEditUser = hasPermission(Permission.MANAGE_USERS);

  // Render user details with tabs for different sections
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader>
          <PageTitle>{user.firstName} {user.lastName}</PageTitle>
          <ActionButtons>
            {canEditUser && (
              <>
                {user.status === UserStatus.ACTIVE ? (
                  <Button
                    label="Deactivate"
                    onClick={handleDeactivateUser}
                    severity="WARNING"
                  />
                ) : (
                  <Button
                    label="Activate"
                    onClick={handleActivateUser}
                    severity="SUCCESS"
                  />
                )}
                <Button label="Edit" onClick={handleEditUser} />
                <Button
                  label="Delete"
                  onClick={handleDeleteUser}
                  severity="DANGER"
                />
              </>
            )}
          </ActionButtons>
        </PageHeader>

        <UserInfoSection>
          <UserInfoGrid>
            <InfoItem>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>{user.email}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Role</InfoLabel>
              <InfoValue>{user.role}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>{user.status}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Organization</InfoLabel>
              <InfoValue>{user.organization?.name}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Last Login</InfoLabel>
              <InfoValue>
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt, 'MMMM dd, yyyy hh:mm a') : 'Never'}
              </InfoValue>
            </InfoItem>
          </UserInfoGrid>
        </UserInfoSection>

        <Tabs onTabChange={handleTabChange}>
          <TabContent>
            <TeamMembersList
              teamId={userId}
              members={user.teams}
              onAddMember={handleAddTeam}
              onUpdateMember={handleUpdateTeamRole}
              onRemoveMember={handleRemoveFromTeam}
              loading={isTeamsLoading}
            />
          </TabContent>
        </Tabs>

        {/* Render modals for edit form, confirmations, etc. */}
        <Modal
          visible={showEditModal}
          onHide={() => setShowEditModal(false)}
          header="Edit User"
        >
          <ModalContent>
            <UserForm
              initialData={user}
              onSubmit={handleUpdateUser}
              isLoading={loading}
              organizations={organizations}
              teams={teams}
              mode="edit"
              onCancel={() => setShowEditModal(false)}
            />
          </ModalContent>
        </Modal>

        <Modal
          visible={showConfirmation}
          onHide={() => setShowConfirmation(false)}
          header="Confirm Delete"
        >
          <ModalContent>
            <p>Are you sure you want to delete this user?</p>
          </ModalContent>
          <ModalFooter>
            <Button
              label="Cancel"
              onClick={() => setShowConfirmation(false)}
              text
            />
            <Button label="Delete" onClick={confirmDeleteUser} severity="DANGER" />
          </ModalFooter>
        </Modal>
        <Toast ref={toast} />
      </PageContainer>
    </DashboardLayout>
  );
};

export default UserDetailPage;