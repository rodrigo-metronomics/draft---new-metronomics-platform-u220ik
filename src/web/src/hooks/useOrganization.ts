import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query'; // react-query@^5.0.0
import { useState, useCallback, useEffect } from 'react'; // react@^18.0.0

import { organizationApi } from '../services/api/organizationApi';
import {
  Organization,
  OrganizationWithTeams,
  OrganizationSummary,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateOrganizationSettingsDto,
  OrganizationFilters,
  OrganizationListParams,
} from '../types/organization.types';
import { ID, PaginationParams } from '../types/common.types';
import { useAuth } from './useAuth';
import { useForm } from './useForm';
import { setItem, getItem, removeItem } from '../utils/helpers/localStorageHelper';

const CURRENT_ORG_STORAGE_KEY = "metronomics_current_org";

/**
 * Custom hook for managing organization data and operations
 * @param options 
 * @returns Organization data and operations including queries, mutations, and utility functions
 */
export const useOrganization = (options?: UseQueryOptions<Organization[]>) => {
  const queryClient = useQueryClient();
  const { state: authState } = useAuth();

  // Define query key factory functions for consistent cache management
  const organizationQueryKeys = {
    all: () => ['organizations'] as const,
    lists: (filters: OrganizationFilters, pagination: PaginationParams) =>
      [...organizationQueryKeys.all(), 'list', filters, pagination] as const,
    details: () => [...organizationQueryKeys.all(), 'detail'] as const,
    detail: (id: ID) => [...organizationQueryKeys.details(), id] as const,
    summaries: () => [...organizationQueryKeys.all(), 'summaries'] as const,
    current: () => [...organizationQueryKeys.all(), 'current'] as const,
  };

  // Implement useGetOrganizations query for fetching organizations with filters and pagination
  const useGetOrganizations = (filters: OrganizationFilters, pagination: PaginationParams, queryOptions?: UseQueryOptions<Organization[]>) => {
    return useQuery<Organization[]>(
      organizationQueryKeys.lists(filters, pagination),
      () => organizationApi.getOrganizations({ ...filters, ...pagination }).then(res => res.data.items),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetOrganizationById query for fetching a single organization by ID
  const useGetOrganizationById = (id: ID, queryOptions?: UseQueryOptions<Organization>) => {
    return useQuery<Organization>(
      organizationQueryKeys.detail(id),
      () => organizationApi.getOrganizationById(id).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetOrganizationWithTeams query for fetching an organization with its teams
  const useGetOrganizationWithTeams = (id: ID, queryOptions?: UseQueryOptions<OrganizationWithTeams>) => {
    return useQuery<OrganizationWithTeams>(
      organizationQueryKeys.detail(id),
      () => organizationApi.getOrganizationWithTeams(id).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateOrganization mutation for creating new organizations
  const useCreateOrganization = () => {
    return useMutation(
      (organizationData: CreateOrganizationDto) => organizationApi.createOrganization(organizationData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(organizationQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateOrganization mutation for updating existing organizations
  const useUpdateOrganization = () => {
    return useMutation(
      ({ id, organizationData }: { id: ID, organizationData: UpdateOrganizationDto }) =>
        organizationApi.updateOrganization(id, organizationData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(organizationQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateOrganizationSettings mutation for updating only organization settings
  const useUpdateOrganizationSettings = () => {
    return useMutation(
      ({ id, settingsData }: { id: ID, settingsData: UpdateOrganizationSettingsDto }) =>
        organizationApi.updateOrganizationSettings(id, settingsData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(organizationQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeleteOrganization mutation for deleting organizations
  const useDeleteOrganization = () => {
    return useMutation(
      (id: ID) => organizationApi.deleteOrganization(id).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(organizationQueryKeys.all());
        },
      }
    );
  };

  // Implement useGetCurrentOrganization query for fetching the current user's active organization
  const useGetCurrentOrganization = (queryOptions?: UseQueryOptions<Organization>) => {
    return useQuery<Organization>(
      organizationQueryKeys.current(),
      () => organizationApi.getCurrentOrganization().then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useSwitchOrganization mutation for changing the current active organization
  const useSwitchOrganization = () => {
    return useMutation(
      (organizationId: ID) => organizationApi.switchOrganization(organizationId).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(organizationQueryKeys.all());
        },
      }
    );
  };

  // Implement useGetOrganizationSummaries query for fetching organization summaries for coaches
  const useGetOrganizationSummaries = (queryOptions?: UseQueryOptions<OrganizationSummary[]>) => {
    return useQuery<OrganizationSummary[]>(
      organizationQueryKeys.summaries(),
      () => organizationApi.getOrganizationSummaries().then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useUploadOrganizationLogo mutation for uploading organization logos
  const useUploadOrganizationLogo = () => {
    return useMutation(
      ({ id, logoFile }: { id: ID, logoFile: File }) => organizationApi.uploadOrganizationLogo(id, logoFile).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(organizationQueryKeys.all());
        },
      }
    );
  };

  // Implement useOrganizationForm hook for organization form state management
  const useOrganizationForm = (initialValues: CreateOrganizationDto) => {
    return useForm<CreateOrganizationDto>({
      initialValues,
      validationRules: {
        name: { required: true, minLength: 3 },
      },
      onSubmit: async (values: CreateOrganizationDto) => {
        console.log('Organization form submitted', values);
      },
    });
  };

  // Implement useOrganizationSettingsForm hook for organization settings form state management
  const useOrganizationSettingsForm = (initialValues: UpdateOrganizationSettingsDto) => {
    return useForm<UpdateOrganizationSettingsDto>({
      initialValues,
      validationRules: {
        'settings.theme': { required: false },
        'settings.timezone': { required: false },
      },
      onSubmit: async (values: UpdateOrganizationSettingsDto) => {
        console.log('Organization settings form submitted', values);
      },
    });
  };

  // Implement persistCurrentOrganization function to save current organization to local storage
  const persistCurrentOrganization = useCallback((organizationId: ID) => {
    setItem(CURRENT_ORG_STORAGE_KEY, organizationId);
  }, []);

  // Implement getPersistedOrganization function to retrieve saved organization from local storage
  const getPersistedOrganization = useCallback(() => {
    return getItem(CURRENT_ORG_STORAGE_KEY) as ID | null;
  }, []);

  // Return all queries, mutations, and utility functions
  return {
    useGetOrganizations,
    useGetOrganizationById,
    useGetOrganizationWithTeams,
    useCreateOrganization,
    useUpdateOrganization,
    useUpdateOrganizationSettings,
    useDeleteOrganization,
    useGetCurrentOrganization,
    useSwitchOrganization,
    useGetOrganizationSummaries,
    useUploadOrganizationLogo,
    useOrganizationForm,
    useOrganizationSettingsForm,
    persistCurrentOrganization,
    getPersistedOrganization,
  };
};