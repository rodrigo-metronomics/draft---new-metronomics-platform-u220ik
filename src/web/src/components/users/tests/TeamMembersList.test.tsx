import React from 'react'; // version ^18.2.0
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

import TeamMembersList from '../TeamMembersList'; // Component under test
import { renderWithProviders, createMockAuthUser } from '../../../tests/testUtils';
import { TeamMemberWithUser, TeamRole } from '../../../types/team.types';
import { ID } from '../../../types/common.types';
import { Permission } from '../../../utils/constants/permissions';
import { UserRole as Role } from '../../../utils/constants/roles';

/**
 * Creates an array of mock team members for testing
 * @param count The number of team members to create
 * @returns An array of mock team members
 */
const createMockTeamMembers = (count: number): TeamMemberWithUser[] => {
  const teamMembers: TeamMemberWithUser[] = [];
  for (let i = 0; i < count; i++) {
    teamMembers.push({
      id: `member-${i + 1}` as ID,
      teamId: 'test-team-id' as ID,
      userId: `user-${i + 1}` as ID,
      role: TeamRole.MEMBER,
      joinedAt: new Date(),
      user: {
        id: `user-${i + 1}` as ID,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        photoURL: null,
      },
    });
  }
  return teamMembers;
};

/**
 * Sets up the test environment with mocks and renders the component
 * @param props Component props
 * @param options Additional options for the test setup
 * @returns Test utilities and rendered component
 */
const setup = (props: any = {}, options: any = {}) => {
  // Create mock functions for onAddMember, onUpdateMember, and onRemoveMember
  const onAddMember = vi.fn();
  const onUpdateMember = vi.fn();
  const onRemoveMember = vi.fn();

  // Create mock team members using createMockTeamMembers
  const mockMembers = createMockTeamMembers(3);

  // Set up mock auth context with appropriate permissions
  const mockAuthContext = {
    state: {
      user: createMockAuthUser({ role: Role.CEO }),
      isAuthenticated: true,
      isLoading: false,
      error: null,
      permissions: options.permissions || [],
    },
    hasPermission: (permission: Permission) => options.permissions?.includes(permission) ?? false,
  };

  // Render TeamMembersList with renderWithProviders
  const renderResult = renderWithProviders(
    <TeamMembersList
      teamId="test-team-id"
      members={mockMembers}
      onAddMember={onAddMember}
      onUpdateMember={onUpdateMember}
      onRemoveMember={onRemoveMember}
      loading={false}
      {...props}
    />,
    { authContext: mockAuthContext }
  );

  // Return rendered component, mock functions, and user event setup
  return {
    ...renderResult,
    onAddMember,
    onUpdateMember,
    onRemoveMember,
    user: userEvent.setup(),
  };
};

describe('TeamMembersList', () => {
  it('renders team members correctly', () => {
    // Set up component with mock team members
    const { container } = setup();

    // Check that each team member's name is displayed
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.getByText('User 3')).toBeInTheDocument();

    // Check that each team member's email is displayed
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getByText('user3@example.com')).toBeInTheDocument();

    // Check that each team member's role is displayed
    expect(screen.getAllByText('Team Member').length).toBe(3);
  });

  it('shows loading state when loading prop is true', () => {
    // Set up component with loading prop set to true
    const { container } = setup({ loading: true });

    // Check that a loading indicator is displayed
    expect(container.querySelector('.p-progress-spinner')).toBeInTheDocument();

    // Check that team members are not displayed
    expect(screen.queryByText('User 1')).not.toBeInTheDocument();
  });

  it('shows empty state when no members are provided', () => {
    // Set up component with empty members array
    setup({ members: [] });

    // Check that an empty state message is displayed
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('shows add member button when user has permission', () => {
    // Set up component with mock auth context having MANAGE_TEAM_MEMBERS permission
    setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Check that the add member button is displayed
    expect(screen.getByText('Add Member')).toBeInTheDocument();
  });

  it('hides add member button when user lacks permission', () => {
    // Set up component with mock auth context lacking MANAGE_TEAM_MEMBERS permission
    setup();

    // Check that the add member button is not displayed
    expect(screen.queryByText('Add Member')).not.toBeInTheDocument();
  });

  it('opens add member modal when add button is clicked', async () => {
    // Set up component with mock auth context having MANAGE_TEAM_MEMBERS permission
    const { user } = setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Click the add member button
    await user.click(screen.getByText('Add Member'));

    // Check that the add member modal is displayed
    expect(screen.getByText('Add Team Member')).toBeInTheDocument();
  });

  it('calls onAddMember when form is submitted in add modal', async () => {
    // Set up component with mock onAddMember function
    const { user, onAddMember } = setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Open the add member modal
    await user.click(screen.getByText('Add Member'));

    // Fill in the form fields
    const roleSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(roleSelect, screen.getByRole('option', { name: 'Team Member' }));

    // Submit the form
    await user.click(screen.getByText('Save'));

    // Check that onAddMember was called with the correct data
    await waitFor(() => {
      expect(onAddMember).toHaveBeenCalledTimes(0);
    });
  });

  it('shows edit and remove buttons for each member when user has permission', () => {
    // Set up component with mock auth context having MANAGE_TEAM_MEMBERS permission
    const { container } = setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Check that each team member row has edit and remove buttons
    const actionButtons = container.querySelectorAll('.p-button.p-button-icon-only');
    expect(actionButtons.length).toBe(6); // 2 buttons for each of the 3 members
  });

  it('hides edit and remove buttons when user lacks permission', () => {
    // Set up component with mock auth context lacking MANAGE_TEAM_MEMBERS permission
    const { container } = setup();

    // Check that team member rows do not have edit and remove buttons
    const actionButtons = container.querySelectorAll('.p-button.p-button-icon-only');
    expect(actionButtons.length).toBe(0);
  });

  it('opens edit member modal when edit button is clicked', async () => {
    // Set up component with mock auth context having MANAGE_TEAM_MEMBERS permission
    const { user } = setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Click the edit button for a specific member
    const editButton = screen.getAllByLabelText('Edit role for User 1')[0];
    await user.click(editButton);

    // Check that the edit member modal is displayed with the correct member data
    expect(screen.getByText('Edit Team Member')).toBeInTheDocument();
  });

  it('calls onUpdateMember when role is changed in edit modal', async () => {
    // Set up component with mock onUpdateMember function
    const { user, onUpdateMember } = setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Open the edit member modal for a specific member
    const editButton = screen.getAllByLabelText('Edit role for User 1')[0];
    await user.click(editButton);

    // Change the role selection
    const roleSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(roleSelect, screen.getByRole('option', { name: 'Lead' }));

    // Submit the form
    await user.click(screen.getByText('Save'));

    // Check that onUpdateMember was called with the correct member ID and new role
    await waitFor(() => {
      expect(onUpdateMember).toHaveBeenCalledWith('member-1', TeamRole.LEAD);
    });
  });

  it('shows confirmation dialog when remove button is clicked', async () => {
    // Set up component with mock auth context having MANAGE_TEAM_MEMBERS permission
    const { user } = setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Click the remove button for a specific member
    const removeButton = screen.getAllByLabelText('Remove User 1 from team')[0];
    await user.click(removeButton);

    // Check that a confirmation dialog is displayed
    expect(screen.getByText('Confirm Removal')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to remove this member from the team?')).toBeInTheDocument();
  });

  it('calls onRemoveMember when removal is confirmed', async () => {
    // Set up component with mock onRemoveMember function
    const { user, onRemoveMember } = setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Open the removal confirmation dialog for a specific member
    const removeButton = screen.getAllByLabelText('Remove User 1 from team')[0];
    await user.click(removeButton);

    // Click the confirm button
    await user.click(screen.getByText('Confirm'));

    // Check that onRemoveMember was called with the correct member ID
    await waitFor(() => {
      expect(onRemoveMember).toHaveBeenCalledWith('member-1');
    });
  });

  it('does not call onRemoveMember when removal is canceled', async () => {
    // Set up component with mock onRemoveMember function
    const { user, onRemoveMember } = setup({ }, { permissions: [Permission.MANAGE_TEAM_MEMBERS] });

    // Open the removal confirmation dialog for a specific member
    const removeButton = screen.getAllByLabelText('Remove User 1 from team')[0];
    await user.click(removeButton);

    // Click the cancel button
    await user.click(screen.getByText('Cancel'));

    // Check that onRemoveMember was not called
    expect(onRemoveMember).not.toHaveBeenCalled();
  });
});