import React, { useState, useEffect, useCallback } from 'react'; // React library for building user interfaces // v18.2.0
import { useNavigate, useSearchParams } from 'react-router-dom'; // React Router for navigation // v6.10.0
import styled from 'styled-components'; // Styling components with CSS-in-JS // v5.3.10

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout for dashboard pages
import Table from '../../components/common/Table'; // Reusable table component
import Button from '../../components/common/Button'; // Reusable button component
import IconButton from '../../components/common/IconButton'; // Reusable icon button component
import Modal from '../../components/common/Modal'; // Reusable modal component
import Input from '../../components/common/Input'; // Reusable input component
import TextArea from '../../components/common/TextArea'; // Reusable text area component
import FormField from '../../components/common/FormField'; // Reusable form field component
import useTeams from '../../hooks/useTeams'; // Hook for team data and operations
import useAuth from '../../hooks/useAuth'; // Hook for authentication state and permissions
import { useOrganizationContext } from '../../contexts/OrganizationContext'; // Access current organization context
import useForm from '../../hooks/useForm'; // Form state management for team creation and editing
import {
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  TeamListParams,
} from '../../types/team.types'; // Type definitions for teams and related entities
import { ID } from '../../types/common.types'; // Type definition for ID fields
import { Permission } from '../../utils/constants/permissions'; // Permission constants for team management
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation

// Define the TeamFormData interface for form state
interface TeamFormData {
  name: string;
  description: string;
}

// Styled components for the TeamListPage
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

const SearchContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  width: 100%;
  max-width: 400px;
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

const ActionsContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
`;

/**
 * Main component function that renders the team list page
 */
const TeamListPage: React.FC = () => {
  // LD1: Get current organization from organization context
  const { currentOrganization } = useOrganizationContext();

  // LD1: Get authentication state and permissions from useAuth hook
  const { hasPermission } = useAuth();

  // LD1: Get team operations from useTeams hook
  const { teams, isLoading, isError, error, refetch, createTeam, updateTeam, deleteTeam, useTeamForm } = useTeams();

  // LD1: Set up state for search term, pagination, and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // LD1: Set up state for team creation/editing modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // LD1: Set up state for team deletion confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<ID | null>(null);

  // LD1: Initialize form state for team creation/editing using useForm
  const teamForm = useTeamForm({
    initialValues: {
      name: '',
      description: '',
    },
    onSubmit: async (values) => {
      if (editingTeam) {
        await updateTeam.mutateAsync({ id: editingTeam.id, teamData: values as UpdateTeamDto });
      } else {
        await createTeam.mutateAsync({
          ...values,
          organizationId: currentOrganization!.id,
        } as CreateTeamDto);
      }
      setIsModalOpen(false);
      setEditingTeam(null);
      refetch();
    },
  });

  // LD1: Set up URL search params for preserving filter and pagination state
  const [searchParams, setSearchParams] = useSearchParams();

  // LD1: Define table columns for team display (name, description, member count, actions)
  const columns = React.useMemo(
    () => [
      { field: 'name', header: 'Name', sortable: true },
      { field: 'description', header: 'Description', sortable: true },
      { field: 'memberCount', header: 'Members', sortable: false },
      {
        field: 'actions',
        header: 'Actions',
        sortable: false,
        body: renderActionButtons,
        style: { textAlign: 'right' },
      },
    ],
    [hasPermission, renderActionButtons]
  );

  // LD1: Implement fetchTeams function to load teams with filters and pagination
  const fetchTeams = useCallback(async () => {
    if (!currentOrganization) return;

    const params: TeamListParams = {
      organizationId: currentOrganization.id,
      search: searchTerm,
      page: currentPage,
      pageSize: pageSize,
      sortBy: sortField,
      sortDirection: sortDirection,
    };

    refetch(params);
  }, [currentOrganization, searchTerm, currentPage, pageSize, sortField, sortDirection, refetch]);

  // LD1: Implement handleCreateTeam function to open team creation modal
  const handleCreateTeam = () => {
    teamForm.resetForm();
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  // LD1: Implement handleEditTeam function to open team editing modal with selected team
  const handleEditTeam = (team: Team) => {
    teamForm.setFieldValue('name', team.name);
    teamForm.setFieldValue('description', team.description);
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  // LD1: Implement handleDeleteTeam function to open deletion confirmation modal
  const handleDeleteTeam = (teamId: ID) => {
    setDeletingTeamId(teamId);
    setIsDeleteModalOpen(true);
  };

  // LD1: Implement handleTeamSubmit function to create or update teams
  const handleTeamSubmit = async () => {
    await teamForm.handleSubmit({ preventDefault: () => {} } as any);
  };

  // LD1: Implement handleConfirmDelete function to execute team deletion
  const handleConfirmDelete = async () => {
    if (deletingTeamId) {
      await deleteTeam.mutateAsync(deletingTeamId);
      setIsDeleteModalOpen(false);
      setDeletingTeamId(null);
      refetch();
    }
  };

  // LD1: Implement handleRowClick function to navigate to team details page
  const navigate = useNavigate();
  const handleRowClick = (team: Team) => {
    navigate(ROUTES.ORGANIZATION.TEAM_DETAIL.replace(':id', team.id.toString()));
  };

  // LD1: Implement handleSearchChange function to update search filters
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // LD1: Implement handlePageChange function to update pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // LD1: Implement handleSortChange function to update sorting
  const handleSortChange = (field: string, direction: string) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // LD1: Use useEffect to fetch teams when filters or pagination changes
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // LD1: Render DashboardLayout with the team list content
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader>
          <PageTitle>Teams</PageTitle>
          {hasPermission(Permission.MANAGE_TEAMS) && (
            <Button label="Create Team" icon="pi pi-plus" onClick={handleCreateTeam} />
          )}
        </PageHeader>

        <SearchContainer>
          <Input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={handleSearchChange}
            fullWidth
          />
        </SearchContainer>

        <Table
          data={teams}
          columns={columns}
          loading={isLoading}
          sortable
          defaultSortField={sortField}
          defaultSortDirection={sortDirection}
          onSort={handleSortChange}
          paginated
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={teams?.length || 0}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          emptyMessage="No teams found."
        />

        <Modal
          visible={isModalOpen}
          onHide={() => setIsModalOpen(false)}
          header={editingTeam ? 'Edit Team' : 'Create Team'}
        >
          <ModalContent>
            <FormField label="Name" name="name" id="name">
              <Input
                id="name"
                name="name"
                value={teamForm.values.name}
                onChange={teamForm.handleChange}
                placeholder="Team Name"
                fullWidth
              />
            </FormField>
            <FormField label="Description" name="description" id="description">
              <TextArea
                id="description"
                name="description"
                value={teamForm.values.description}
                onChange={teamForm.handleChange}
                placeholder="Team Description"
                rows={5}
                fullWidth
              />
            </FormField>
          </ModalContent>
          <ModalFooter>
            <Button label="Cancel" onClick={() => setIsModalOpen(false)} />
            <Button label="Save" onClick={handleTeamSubmit} />
          </ModalFooter>
        </Modal>

        <Modal
          visible={isDeleteModalOpen}
          onHide={() => setIsDeleteModalOpen(false)}
          header="Confirm Delete"
        >
          <ModalContent>
            <p>Are you sure you want to delete this team?</p>
          </ModalContent>
          <ModalFooter>
            <Button label="Cancel" onClick={() => setIsDeleteModalOpen(false)} />
            <Button label="Delete" severity="danger" onClick={handleConfirmDelete} />
          </ModalFooter>
        </Modal>
      </PageContainer>
    </DashboardLayout>
  );

  // LD1: Implement renderActionButtons function to render action buttons for each team row
  function renderActionButtons(team: Team, rowIndex: number) {
    // Check if user has permission to manage teams
    if (!hasPermission(Permission.MANAGE_TEAMS)) {
      return null;
    }

    return (
      <ActionsContainer>
        <IconButton
          icon="pi pi-pencil"
          tooltip="Edit"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleEditTeam(team);
          }}
        />
        <IconButton
          icon="pi pi-trash"
          tooltip="Delete"
          severity="danger"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleDeleteTeam(team.id);
          }}
        />
      </ActionsContainer>
    );
  }
};

export default TeamListPage;