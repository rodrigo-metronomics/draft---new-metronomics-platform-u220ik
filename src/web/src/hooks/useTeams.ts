import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query'; // react-query@^5.0.0
import { useState, useCallback, useEffect } from 'react'; // react@^18.0.0

import { teamApi } from '../services/api/teamApi';
import {
  Team,
  TeamWithMembers,
  TeamMemberWithUser,
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  UpdateTeamMemberRoleDto,
  TeamListParams,
  TeamMemberListParams,
  TeamRole,
} from '../types/team.types';
import { ID, PaginationParams } from '../types/common.types';
import { useOrganizationContext } from '../contexts/OrganizationContext';
import { useAuth } from './useAuth';
import { useForm } from './useForm';

/**
 * Custom hook that provides functionality for fetching, creating, updating, and managing
 * teams in the Metronomics Platform. This hook leverages React Query for efficient data
 * fetching, caching, and synchronization with the backend API.
 *
 * @param {UseQueryOptions<Team[]>} options - Optional configuration options for React Query.
 * @returns {object} An object containing various team-related queries, mutations, and utility functions.
 */
export const useTeams = (options?: UseQueryOptions<Team[]>) => {
  // Initialize React Query client for cache management
  const queryClient = useQueryClient();

  // Get current organization from organization context
  const { currentOrganization } = useOrganizationContext();

  // Get current user information from authentication state
  const { state: authState } = useAuth();

  // Define query key factory functions for consistent cache management
  const teamQueryKeys = {
    all: () => ['teams'] as const,
    lists: (filters: TeamListParams) => [...teamQueryKeys.all(), 'list', filters] as const,
    details: () => [...teamQueryKeys.all(), 'detail'] as const,
    detail: (id: ID) => [...teamQueryKeys.details(), id] as const,
    withMembers: () => [...teamQueryKeys.all(), 'withMembers'] as const,
    withMember: (id: ID) => [...teamQueryKeys.withMembers(), id] as const,
    members: () => [...teamQueryKeys.all(), 'members'] as const,
    member: (teamId: ID, filters: TeamMemberListParams) => [...teamQueryKeys.members(), teamId, filters] as const,
    summaries: () => [...teamQueryKeys.all(), 'summaries'] as const,
  };

  // Implement useGetTeams query for fetching teams with filters and pagination
  const useGetTeams = (filters: TeamListParams, queryOptions?: UseQueryOptions<Team[]>) => {
    const organizationId = currentOrganization?.id;
    return useQuery<Team[]>(
      teamQueryKeys.lists(filters),
      () => teamApi.getTeams({ ...filters, organizationId: organizationId }).then(res => res.data.items),
      {
        enabled: !!organizationId, // Only run query if organizationId is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetTeamById query for fetching a single team by ID
  const useGetTeamById = (id: ID, queryOptions?: UseQueryOptions<Team>) => {
    return useQuery<Team>(
      teamQueryKeys.detail(id),
      () => teamApi.getTeamById(id).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetTeamWithMembers query for fetching a team with its members
  const useGetTeamWithMembers = (id: ID, queryOptions?: UseQueryOptions<TeamWithMembers>) => {
    return useQuery<TeamWithMembers>(
      teamQueryKeys.withMember(id),
      () => teamApi.getTeamById(id).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetTeamMembers query for fetching team members with filters
  const useGetTeamMembers = (teamId: ID, filters: TeamMemberListParams, queryOptions?: UseQueryOptions<TeamMemberWithUser[]>) => {
    return useQuery<TeamMemberWithUser[]>(
      teamQueryKeys.member(teamId, filters),
      () => teamApi.getTeamMembers(teamId, filters).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetTeamSummaries query for fetching team summaries for the current organization
  const useGetTeamSummaries = (queryOptions?: UseQueryOptions<Team[]>) => {
    const organizationId = currentOrganization?.id;
    return useQuery<Team[]>(
      teamQueryKeys.summaries(),
      () => teamApi.getTeams({ organizationId: organizationId }).then(res => res.data.items),
      {
        enabled: !!organizationId, // Only run query if organizationId is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateTeam mutation for creating new teams
  const useCreateTeam = () => {
    return useMutation(
      (teamData: CreateTeamDto) => teamApi.createTeam(teamData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(teamQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateTeam mutation for updating existing teams
  const useUpdateTeam = () => {
    return useMutation(
      ({ id, teamData }: { id: ID, teamData: UpdateTeamDto }) =>
        teamApi.updateTeam(id, teamData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(teamQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeleteTeam mutation for deleting teams
  const useDeleteTeam = () => {
    return useMutation(
      (id: ID) => teamApi.deleteTeam(id).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(teamQueryKeys.all());
        },
      }
    );
  };

  // Implement useAddTeamMembers mutation for adding members to a team
  const useAddTeamMembers = () => {
    return useMutation(
      ({ teamId, memberData }: { teamId: ID, memberData: AddTeamMemberDto }) =>
        teamApi.addTeamMember(teamId, memberData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(teamQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateTeamMemberRole mutation for updating a team member's role
  const useUpdateTeamMemberRole = () => {
    return useMutation(
      ({ teamId, userId, roleData }: { teamId: ID, userId: ID, roleData: UpdateTeamMemberRoleDto }) =>
        teamApi.updateTeamMemberRole(teamId, userId, roleData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(teamQueryKeys.all());
        },
      }
    );
  };

  // Implement useRemoveTeamMember mutation for removing members from a team
  const useRemoveTeamMember = () => {
    return useMutation(
      ({ teamId, userId }: { teamId: ID, userId: ID }) =>
        teamApi.removeTeamMember(teamId, userId).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(teamQueryKeys.all());
        },
      }
    );
  };

  // Implement useTeamForm hook for team form state management
  const useTeamForm = (initialValues: CreateTeamDto | UpdateTeamDto) => {
    return useForm<CreateTeamDto | UpdateTeamDto>({
      initialValues,
      validationRules: {
        name: { required: true, minLength: 3 },
        description: { required: true, minLength: 10 },
      },
      onSubmit: async (values: CreateTeamDto | UpdateTeamDto) => {
        console.log('Team form submitted', values);
      },
    });
  };

    // Implement useTeamMemberForm hook for team member form state management
    const useTeamMemberForm = (initialValues: AddTeamMemberDto | UpdateTeamMemberRoleDto) => {
      return useForm<AddTeamMemberDto | UpdateTeamMemberRoleDto>({
        initialValues,
        validationRules: {
          role: { required: true },
        },
        onSubmit: async (values: AddTeamMemberDto | UpdateTeamMemberRoleDto) => {
          console.log('Team member form submitted', values);
        },
      });
    };

  // Return all queries, mutations, and utility functions
  return {
    teams: useGetTeams,
    isLoading: useGetTeams({} as TeamListParams).isLoading,
    isError: useGetTeams({} as TeamListParams).isError,
    error: useGetTeams({} as TeamListParams).error,
    refetch: useGetTeams({} as TeamListParams).refetch,
    getTeamById: useGetTeamById,
    getTeamWithMembers: useGetTeamWithMembers,
    getTeamMembers: useGetTeamMembers,
    getTeamSummaries: useGetTeamSummaries,
    createTeam: useCreateTeam,
    updateTeam: useUpdateTeam,
    deleteTeam: useDeleteTeam,
    addTeamMembers: useAddTeamMembers,
    updateTeamMemberRole: useUpdateTeamMemberRole,
    removeTeamMember: useRemoveTeamMember,
    useTeamForm: useTeamForm,
    useTeamMemberForm: useTeamMemberForm,
  };
};