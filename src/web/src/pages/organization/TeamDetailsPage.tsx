import React, { useState, useEffect, useCallback } from 'react'; // React library for building user interfaces // v18.2.0
import { useParams, useNavigate } from 'react-router-dom'; // React Router hooks for accessing route parameters and navigation // v6.10.0
import styled from 'styled-components'; // For styling the component with CSS-in-JS // v5.3.10

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout wrapper for dashboard pages with navigation and authentication
import Button from '../../components/common/Button'; // Button component for actions like editing team details
import Card from '../../components/common/Card'; // Card component for displaying team information sections
import Modal from '../../components/common/Modal'; // Modal dialog for team editing and confirmation dialogs
import Input from '../../components/common/Input'; // Input component for form fields
import TextArea from '../../components/common/TextArea'; // Text area component for multi-line input fields
import FormField from '../../components/common/FormField'; // Form field wrapper with label and error handling
import Spinner from '../../components/common/Spinner'; // Loading indicator for async operations
import Breadcrumbs from '../../components/layout/Breadcrumbs'; // Navigation breadcrumbs for page hierarchy
import TeamMembersList from '../../components/users/TeamMembersList'; // Component for displaying and managing team members
import useTeams from '../../hooks/useTeams'; // Custom hook for team data and operations
import useAuth from '../../hooks/useAuth'; // Hook for authentication state and permissions
import { useOrganizationContext } from '../../contexts/OrganizationContext'; // Access current organization context
import useForm from '../../hooks/useForm'; // Form state management for team editing
import {
  Team,
  TeamWithMembers,
  TeamMemberWithUser,
  UpdateTeamDto,
  AddTeamMemberDto,
  TeamRole,
} from '../../types/team.types'; // Type definitions for teams and related entities
import { ID } from '../../types/common.types'; // Type definition for ID fields
import { Permission } from '../../utils/constants/permissions'; // Permission constants for team management
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation
import { formatDateTime } from '../../utils/helpers/dateTimeHelper'; // Format dates for display

// Styled Components
const PageContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
`;

const PageTitle = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0;
`;

const TeamDetailsSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const TeamMetadata = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const MetadataItem = styled.div`
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const MetadataLabel = styled.span`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.secondary};
  display: block;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const MetadataValue = styled.span`
  color: ${props => props.theme.colors.text.primary};
`;

const TeamDescription = styled.p`
  margin-top: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text.primary};
  line-height: 1.5;
`;

const TeamMembersSection = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ModalContent = styled.div`
  padding: ${props => props.theme.spacing.lg};
  min-width: 500px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.error.main};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

interface TeamFormData {
  name: string;
  description: string;
}

/**
 * Main component function that renders the team details page
 */
const TeamDetailsPage: React.FC = () => {
  // Get teamId from URL parameters using useParams hook
  const { id: teamId } = useParams<{ id: string }>();
  // Get navigation function from useNavigate hook
  const navigate = useNavigate();
  // Get current organization from organization context
  const { currentOrganization } = useOrganizationContext();
  // Get authentication state and permissions from useAuth hook
  const { hasPermission } = useAuth();
  // Get team operations from useTeams hook
  const { getTeamById, updateTeam, useTeamForm, getTeamMembers, useUpdateTeamMemberRole, useRemoveTeamMember, useAddTeamMembers } = useTeams();

  // Set up state for team data loading and error handling
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up state for team editing modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Set up state for member management (add, edit, remove)
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithUser[]>([]);
  const [isMemberLoading, setIsMemberLoading] = useState(false);

  // Initialize form state for team editing using useForm
  const {
    values: teamFormValues,
    handleChange: handleTeamFormChange,
    handleSubmit: handleTeamFormSubmit,
    errors: teamFormErrors,
    setFieldValue: setTeamFormFieldValue,
    setFieldTouched: setTeamFormFieldTouched,
    resetForm: resetTeamForm,
  } = useTeamForm({
    initialValues: {
      name: '',
      description: '',
    },
    onSubmit: async (values) => {
      if (teamId) {
        try {
          await updateTeam.mutateAsync({ id: teamId, teamData: values as UpdateTeamDto });
          setTeam(prevTeam => ({ ...prevTeam, ...values } as TeamWithMembers));
          setIsEditModalOpen(false);
        } catch (err: any) {
          setError(err.message || 'Failed to update team');
        }
      }
    },
  });

  // Implement fetchTeam function to load team details with members
  const fetchTeam = useCallback(async (teamId: string) => {
    setLoading(true);
    setError(null);
    try {
      const teamData = await getTeamById(teamId);
      setTeam(teamData.data);
      setTeamFormValues(teamData.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [getTeamById, setTeam, setTeamFormValues]);

  // Implement handleEditTeam function to open team editing modal
  const handleEditTeam = () => {
    setIsEditModalOpen(true);
  };

  // Implement handleTeamSubmit function to update team details
  const handleTeamSubmit = async () => {
    await handleTeamFormSubmit();
  };

  // Implement handleAddMember function to add a new team member
  const handleAddMember = async (member: AddTeamMemberDto) => {
    setIsMemberLoading(true);
    try {
      await useAddTeamMembers().mutateAsync({ teamId: teamId, memberData: member });
      await fetchTeamMembers(teamId);
    } catch (err: any) {
      setError(err.message || 'Failed to add team member');
    } finally {
      setIsMemberLoading(false);
    }
  };

  // Implement handleUpdateMemberRole function to change a member's role
  const handleUpdateMemberRole = async (memberId: ID, role: TeamRole) => {
    setIsMemberLoading(true);
    try {
      await useUpdateTeamMemberRole().mutateAsync({ teamId: teamId, userId: memberId, roleData: { role } });
      await fetchTeamMembers(teamId);
    } catch (err: any) {
      setError(err.message || 'Failed to update team member role');
    } finally {
      setIsMemberLoading(false);
    }
  };

  // Implement handleRemoveMember function to remove a member from the team
  const handleRemoveMember = async (memberId: ID) => {
    setIsMemberLoading(true);
    try {
      await useRemoveTeamMember().mutateAsync({ teamId: teamId, userId: memberId });
      await fetchTeamMembers(teamId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove team member');
    } finally {
      setIsMemberLoading(false);
    }
  };

  // Implement fetchTeamMembers function to load team members
  const fetchTeamMembers = useCallback(async (teamId: string) => {
    setIsMemberLoading(true);
    setError(null);
    try {
      const teamMembersData = await getTeamMembers(teamId, {});
      setTeamMembers(teamMembersData.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setIsMemberLoading(false);
    }
  }, [getTeamMembers]);

  // Use useEffect to fetch team data when teamId changes
  useEffect(() => {
    if (teamId) {
      fetchTeam(teamId);
      fetchTeamMembers(teamId);
    }
  }, [teamId, fetchTeam, fetchTeamMembers]);

  // Helper function to set team form values
  const setTeamFormValues = useCallback((team: TeamWithMembers) => {
    setTeamFormFieldValue('name', team.name);
    setTeamFormFieldValue('description', team.description);
  }, [setTeamFormFieldValue]);

  // Check if the user has permission to manage teams
  const canManageTeams = hasPermission(Permission.MANAGE_TEAMS);

  // Render DashboardLayout with the team details content
  return (
    <DashboardLayout>
      <PageContainer>
        {/* Render breadcrumbs for navigation hierarchy */}
        <Breadcrumbs />

        {loading && (
          <LoadingContainer>
            <Spinner size="medium" />
          </LoadingContainer>
        )}

        {error && (
          <ErrorContainer>
            <p>{error}</p>
          </ErrorContainer>
        )}

        {team && (
          <>
            {/* Render page header with team name and edit button if user has permission */}
            <PageHeader>
              <PageTitle>{team.name}</PageTitle>
              {canManageTeams && (
                <Button label="Edit Team" icon="pi pi-pencil" onClick={handleEditTeam} />
              )}
            </PageHeader>

            {/* Render team details card with description and metadata */}
            <TeamDetailsSection>
              <Card title="Team Details">
                <TeamDescription>{team.description}</TeamDescription>
                <TeamMetadata>
                  <MetadataItem>
                    <MetadataLabel>Organization</MetadataLabel>
                    <MetadataValue>{currentOrganization?.name}</MetadataValue>
                  </MetadataItem>
                  <MetadataItem>
                    <MetadataLabel>Created At</MetadataLabel>
                    <MetadataValue>{formatDateTime(team.createdAt, 'MM/dd/yyyy')}</MetadataValue>
                  </MetadataItem>
                </TeamMetadata>
              </Card>
            </TeamDetailsSection>

            {/* Render TeamMembersList component with team members and appropriate handlers */}
            <TeamMembersSection>
              <SectionTitle>Team Members</SectionTitle>
              <TeamMembersList
                teamId={teamId}
                members={teamMembers}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMemberRole}
                onRemoveMember={handleRemoveMember}
                loading={isMemberLoading}
              />
            </TeamMembersSection>
          </>
        )}

        {/* Render team editing modal when open */}
        <Modal
          visible={isEditModalOpen}
          onHide={() => setIsEditModalOpen(false)}
          header="Edit Team"
        >
          <ModalContent>
            <FormField
              id="name"
              name="name"
              label="Name"
              error={teamFormErrors.name}
              touched={teamFormErrors.name !== undefined}
            >
              <Input
                id="name"
                name="name"
                value={teamFormValues.name}
                onChange={handleTeamFormChange}
                fullWidth
              />
            </FormField>
            <FormField
              id="description"
              name="description"
              label="Description"
              error={teamFormErrors.description}
              touched={teamFormErrors.description !== undefined}
            >
              <TextArea
                id="description"
                name="description"
                value={teamFormValues.description}
                onChange={handleTeamFormChange}
                rows={5}
                fullWidth
              />
            </FormField>
          </ModalContent>
          <ModalFooter>
            <Button label="Cancel" onClick={() => setIsEditModalOpen(false)} />
            <Button label="Save" onClick={handleTeamSubmit} />
          </ModalFooter>
        </Modal>
      </PageContainer>
    </DashboardLayout>
  );
};

export default TeamDetailsPage;