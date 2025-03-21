import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10

import Table from '../common/Table';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import Modal from '../common/Modal';
import RoleAssignment from './RoleAssignment';
import useTeams from '../../hooks/useTeams';
import useAuth from '../../hooks/useAuth';
import { TeamMemberWithUser, TeamRole } from '../../types/team.types';
import { ID } from '../../types/common.types';
import { Permission } from '../../utils/constants/permissions';
import { AddTeamMemberDto } from '../../types/team.types';

/**
 * Interface defining the props for the TeamMembersList component
 */
interface TeamMembersListProps {
  teamId: ID;
  members: TeamMemberWithUser[];
  onAddMember: (member: AddTeamMemberDto) => Promise<void>;
  onUpdateMember: (memberId: ID, role: TeamRole) => Promise<void>;
  onRemoveMember: (memberId: ID) => Promise<void>;
  loading: boolean;
  className?: string;
}

/**
 * Styled container for the TeamMembersList component
 */
const TeamMembersListContainer = styled.div`
  width: 100%;
  margin-bottom: 1.5rem;
`;

/**
 * Styled container for action buttons
 */
const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

/**
 * Styled container for the Add Member button
 */
const AddButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
`;

/**
 * Styled container for the modal content
 */
const ModalContent = styled.div`
  padding: 1rem;
  min-width: 400px;
`;

/**
 * Styled container for the modal footer
 */
const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
`;

/**
 * Component that displays and manages a list of team members
 */
const TeamMembersList: React.FC<TeamMembersListProps> = ({
  teamId,
  members,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  loading,
  className,
}) => {
  // State for controlling the visibility of the add/edit member modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  // State for storing the selected member to edit
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithUser | null>(null);
  // State for controlling the visibility of the confirmation dialog
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  // State for storing the member ID to remove
  const [memberToRemove, setMemberToRemove] = useState<ID | null>(null);

  // Access team operations from the useTeams hook
  const { useTeamMemberForm } = useTeams();

  // Access authentication state and permissions from the useAuth hook
  const { hasPermission } = useAuth();

  // Check if the user has permission to manage team members
  const canManageTeamMembers = hasPermission(Permission.MANAGE_TEAM_MEMBERS);

  // Form for adding and editing team members
  const {
    values: memberFormValues,
    handleChange: handleMemberFormChange,
    handleSubmit: handleMemberFormSubmit,
    errors: memberFormErrors,
    setFieldValue: setMemberFormFieldValue,
    setFieldTouched: setMemberFormFieldTouched,
    resetForm: resetMemberForm,
  } = useTeamMemberForm({
    initialValues: {
      role: TeamRole.MEMBER,
    },
    onSubmit: async (values) => {
      if (selectedMember) {
        // Update existing member
        await onUpdateMember(selectedMember.id, values.role);
      } else {
        // Add new member
        await onAddMember({ userId: values.userId, role: values.role });
      }
      handleCloseModal();
    },
  });

  // Table columns definition
  const columns = React.useMemo(
    () => [
      { field: 'user.name', header: 'Name', sortable: true },
      { field: 'user.email', header: 'Email', sortable: true },
      { field: 'role', header: 'Role', sortable: true },
      {
        header: 'Actions',
        body: renderActionButtons,
        style: { textAlign: 'right' },
      },
    ],
    [canManageTeamMembers, onRemoveMember, onUpdateMember]
  );

  /**
   * Opens the add member modal
   */
  const handleAddMember = () => {
    setSelectedMember(null);
    setIsModalVisible(true);
  };

  /**
   * Opens the edit member modal with the selected member's data
   */
  const handleEditMember = (member: TeamMemberWithUser) => {
    setSelectedMember(member);
    setMemberFormFieldValue('role', member.role);
    setIsModalVisible(true);
  };

  /**
   * Opens the confirmation dialog for removing a member
   */
  const handleRemoveMember = (memberId: ID) => {
    setMemberToRemove(memberId);
    setIsConfirmationVisible(true);
  };

  /**
   * Handles the role change event
   */
  const handleRoleChange = (role: TeamRole) => {
    if (selectedMember) {
      onUpdateMember(selectedMember.id, role);
    }
  };

  /**
   * Handles the confirmation of removing a member
   */
  const handleConfirmRemove = async () => {
    if (memberToRemove) {
      await onRemoveMember(memberToRemove);
      setMemberToRemove(null);
      setIsConfirmationVisible(false);
    }
  };

  /**
   * Closes the modal and resets the form
   */
  const handleCloseModal = () => {
    setIsModalVisible(false);
    resetMemberForm();
  };

  /**
   * Renders action buttons for each team member row
   */
  const renderActionButtons = useCallback(
    (member: TeamMemberWithUser, rowIndex: number) => {
      if (!canManageTeamMembers) return null;

      return (
        <ActionsContainer>
          <IconButton
            icon={<i className="pi pi-pencil" />}
            tooltip="Edit Role"
            ariaLabel={`Edit role for ${member.user.name}`}
            onClick={() => handleEditMember(member)}
          />
          <IconButton
            icon={<i className="pi pi-trash" />}
            tooltip="Remove Member"
            ariaLabel={`Remove ${member.user.name} from team`}
            onClick={() => handleRemoveMember(member.id)}
            variant="DANGER"
          />
        </ActionsContainer>
      );
    },
    [canManageTeamMembers, handleEditMember, handleRemoveMember]
  );

  return (
    <TeamMembersListContainer className={className}>
      {canManageTeamMembers && (
        <AddButtonContainer>
          <Button label="Add Member" icon="pi pi-user-plus" onClick={handleAddMember} />
        </AddButtonContainer>
      )}

      <Table
        data={members}
        columns={columns}
        loading={loading}
      />

      <Modal
        visible={isModalVisible}
        onHide={handleCloseModal}
        header={selectedMember ? 'Edit Team Member' : 'Add Team Member'}
      >
        <ModalContent>
          <RoleAssignment
            currentRole={memberFormValues.role}
            onChange={(role) => setMemberFormFieldValue('role', role)}
          />
        </ModalContent>
        <ModalFooter>
          <Button label="Cancel" onClick={handleCloseModal} />
          <Button label="Save" onClick={handleMemberFormSubmit} />
        </ModalFooter>
      </Modal>

      <Modal
        visible={isConfirmationVisible}
        onHide={() => setIsConfirmationVisible(false)}
        header="Confirm Removal"
      >
        <ModalContent>
          <p>Are you sure you want to remove this member from the team?</p>
        </ModalContent>
        <ModalFooter>
          <Button label="Cancel" onClick={() => setIsConfirmationVisible(false)} />
          <Button label="Confirm" onClick={handleConfirmRemove} severity="DANGER" />
        </ModalFooter>
      </Modal>
    </TeamMembersListContainer>
  );
};

export default TeamMembersList;