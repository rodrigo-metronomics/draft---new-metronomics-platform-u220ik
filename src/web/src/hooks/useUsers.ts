import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query'; // react-query@^5.0.0
import { useState, useCallback, useEffect } from 'react'; // react@^18.0.0

import { userApi } from '../services/api/userApi';
import {
  User,
  UserWithRelations,
  UserResponse,
  UserDetailResponse,
  UserListResponse,
  UserListParams,
  UserFilters,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
  UserInviteDto,
  UserProfileResponse,
  UserStatus,
} from '../types/user.types';
import { ID, PaginationParams } from '../types/common.types';
import { useOrganizationContext } from '../contexts/OrganizationContext';
import { useAuth } from './useAuth';
import { useForm } from './useForm';

/**
 * Custom hook for managing users data and operations
 * @param options - Optional React Query options for the underlying queries
 * @returns Object containing users data and operations including queries, mutations, and utility functions
 */
export const useUsers = (options?: UseQueryOptions<User[]>) => {
  // Initialize React Query client for cache management
  const queryClient = useQueryClient();

  // Get current organization from organization context
  const { currentOrganization } = useOrganizationContext();

  // Get current user information from authentication state
  const { state: authState, hasPermission } = useAuth();

  // Define query key factory functions for consistent cache management
  const userQueryKeys = {
    all: () => ['users'] as const,
    lists: (filters: UserFilters, pagination: PaginationParams) =>
      [...userQueryKeys.all(), 'list', filters, pagination] as const,
    details: () => [...userQueryKeys.all(), 'detail'] as const,
    detail: (id: ID) => [...userQueryKeys.details(), id] as const,
    teamUsers: (teamId: ID) => [...userQueryKeys.all(), 'team', teamId] as const,
    currentUser: () => [...userQueryKeys.all(), 'current'] as const,
    pendingInvitations: () => [...userQueryKeys.all(), 'invitations', 'pending'] as const,
  };

  // Implement useGetUsers query for fetching users with filters and pagination
  const useGetUsers = (filters: UserFilters, pagination: PaginationParams, queryOptions?: UseQueryOptions<UserListResponse>) => {
    return useQuery<UserListResponse>(
      userQueryKeys.lists(filters, pagination),
      () => userApi.getUsers({ ...filters, ...pagination }),
      {
        ...options,
        ...queryOptions,
        select: (data) => data?.data,
      }
    );
  };

  // Implement useGetUserById query for fetching a single user by ID
  const useGetUserById = (id: ID, queryOptions?: UseQueryOptions<UserDetailResponse>) => {
    return useQuery<UserDetailResponse>(
      userQueryKeys.detail(id),
      () => userApi.getUserById(id),
      {
        ...options,
        ...queryOptions,
        select: (data) => data?.data,
      }
    );
  };

  // Implement useGetCurrentUser query for fetching the current user's profile
  const useGetCurrentUser = (queryOptions?: UseQueryOptions<UserProfileResponse>) => {
    return useQuery<UserProfileResponse>(
      userQueryKeys.currentUser(),
      () => userApi.getCurrentUser(),
      {
        ...options,
        ...queryOptions,
        select: (data) => data?.data,
      }
    );
  };

  // Implement useCreateUser mutation for creating new users
  const useCreateUser = () => {
    return useMutation(
      (userData: CreateUserDto) => userApi.createUser(userData),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateUser mutation for updating existing users
  const useUpdateUser = () => {
    return useMutation(
      ({ id, userData }: { id: ID; userData: UpdateUserDto }) =>
        userApi.updateUser(id, userData),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeactivateUser mutation for deactivating users
  const useDeactivateUser = () => {
    return useMutation(
      (id: ID) => userApi.deactivateUser(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.all());
        },
      }
    );
  };

  // Implement useActivateUser mutation for activating users
  const useActivateUser = () => {
    return useMutation(
      (id: ID) => userApi.activateUser(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeleteUser mutation for deleting users
  const useDeleteUser = () => {
    return useMutation(
      (id: ID) => userApi.deleteUser(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.all());
        },
      }
    );
  };

  // Implement useInviteUser mutation for inviting new users
  const useInviteUser = () => {
    return useMutation(
      (inviteData: UserInviteDto) => userApi.inviteUser(inviteData),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.all());
          queryClient.invalidateQueries(userQueryKeys.pendingInvitations());
        },
      }
    );
  };

  // Implement useResendInvitation mutation for resending invitations
  const useResendInvitation = () => {
    return useMutation(
      (invitationId: ID) => userApi.resendInvitation(invitationId),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.pendingInvitations());
        },
      }
    );
  };

  // Implement useCancelInvitation mutation for canceling invitations
  const useCancelInvitation = () => {
    return useMutation(
      (invitationId: ID) => userApi.cancelInvitation(invitationId),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.pendingInvitations());
        },
      }
    );
  };

  // Implement useGetPendingInvitations query for fetching pending invitations
  const useGetPendingInvitations = (queryOptions?: UseQueryOptions<{ invitations: Array<{ id: ID; email: string; role: string; createdAt: string }> }>) => {
    return useQuery<{ invitations: Array<{ id: ID; email: string; role: string; createdAt: string }> }>(
      userQueryKeys.pendingInvitations(),
      () => userApi.getPendingInvitations({ organizationId: currentOrganization?.id }).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useUploadProfileImage mutation for uploading user profile images
  const useUploadProfileImage = () => {
    return useMutation(
      (formData: FormData) => userApi.uploadProfileImage(formData),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(userQueryKeys.currentUser());
        },
      }
    );
  };

  // Implement useGetUsersByTeam query for fetching users by team
  const useGetUsersByTeam = (teamId: ID, queryOptions?: UseQueryOptions<UserListResponse>) => {
    return useQuery<UserListResponse>(
      userQueryKeys.teamUsers(teamId),
      () => userApi.getUsersByTeam(teamId),
      {
        ...options,
        ...queryOptions,
        select: (data) => data?.data,
      }
    );
  };

  // Implement useUserForm hook for user form state management
  const useUserForm = (initialValues: CreateUserDto) => {
    return useForm<CreateUserDto>({
      initialValues,
      validationRules: {
        email: { required: true, email: true },
        firstName: { required: true },
        lastName: { required: true },
        role: { required: true },
        organizationId: { required: true },
      },
      onSubmit: async (values: CreateUserDto) => {
        console.log('User form submitted', values);
      },
    });
  };

  // Implement useUserInviteForm hook for user invitation form state management
  const useUserInviteForm = (initialValues: UserInviteDto) => {
      return useForm<UserInviteDto>({
          initialValues,
          validationRules: {
              email: { required: true, email: true },
              firstName: { required: true },
              lastName: { required: true },
              role: { required: true },
              organizationId: { required: true },
              teamIds: { required: false }
          },
          onSubmit: async (values: UserInviteDto) => {
              console.log('User invite form submitted', values);
          },
      });
  };

  // Return all queries, mutations, and utility functions
  return {
    users: useGetUsers,
    isLoading: useGetUsers({} as UserFilters, {} as PaginationParams).isLoading,
    isError: useGetUsers({} as UserFilters, {} as PaginationParams).isError,
    error: useGetUsers({} as UserFilters, {} as PaginationParams).error,
    pagination: useGetUsers({} as UserFilters, {} as PaginationParams).data,
    refetch: useGetUsers({} as UserFilters, {} as PaginationParams).refetch,
    getUserById: useGetUserById,
    getCurrentUser: useGetCurrentUser,
    createUser: useCreateUser,
    updateUser: useUpdateUser,
    deactivateUser: useDeactivateUser,
    activateUser: useActivateUser,
    deleteUser: useDeleteUser,
    inviteUser: useInviteUser,
    resendInvitation: useResendInvitation,
    cancelInvitation: useCancelInvitation,
    getPendingInvitations: useGetPendingInvitations,
    uploadProfileImage: useUploadProfileImage,
    getUsersByTeam: useGetUsersByTeam,
    useUserForm: useUserForm,
    useUserInviteForm: useUserInviteForm
  };
};