import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query'; // react-query@5.x
import { useState, useCallback, useEffect } from 'react'; // react@18.x

import {
  Goal,
  GoalWithMetrics,
  GoalWithMilestones,
  GoalWithMilestonesAndMetrics,
  GoalType,
  GoalStatus,
  GoalFilters,
  CreateGoalFormData,
  UpdateGoalFormData,
  Milestone,
  MilestoneStatus,
  CreateMilestoneFormData,
  UpdateMilestoneFormData,
  GoalTimelineItem
} from '../types/goal.types';
import { ID, DateRange } from '../types/common.types';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { goalApi } from '../services/api/goalApi';
import { useOrganizationContext } from '../contexts/OrganizationContext';
import { useForm } from './useForm';

/**
 * Custom hook for managing strategic goals data and operations
 * @param options 
 * @returns Goals data and operations including queries, mutations, and utility functions
 */
export const useGoals = (options?: UseQueryOptions<Goal[]>) => {
  // Initialize React Query client for cache management
  const queryClient = useQueryClient();

  // Get current organization ID from organization context
  const { currentOrganization } = useOrganizationContext();
  const organizationId = currentOrganization?.id;

  // Define query key factory functions for consistent cache management
  const goalQueryKeys = {
    all: () => ['goals', organizationId] as const,
    lists: (filters: GoalFilters, pagination: { page: number; pageSize: number }) =>
      [...goalQueryKeys.all(), 'list', filters, pagination] as const,
    details: () => [...goalQueryKeys.all(), 'detail'] as const,
    detail: (id: ID) => [...goalQueryKeys.details(), id] as const,
    timeline: (organizationId: ID, goalType?: GoalType) =>
      [...goalQueryKeys.all(), 'timeline', organizationId, goalType] as const,
  };

  // Implement useGetGoals query for fetching goals with filters
  const useGetGoals = (filters: GoalFilters, pagination: { page: number; pageSize: number }, queryOptions?: UseQueryOptions<PaginatedResponse<Goal[]>>) => {
    const enabled = !!organizationId; // Only enable if organizationId is available
    return useQuery<PaginatedResponse<Goal[]>>(
      goalQueryKeys.lists(filters, pagination),
      () => goalApi.getGoals(filters, pagination.page, pagination.pageSize),
      {
        ...options,
        enabled: enabled && (options?.enabled !== false), // Respect existing enabled option
        ...queryOptions,
      }
    );
  };

  // Implement useGetGoalsByType query for fetching goals filtered by type
  const useGetGoalsByType = (type: GoalType, queryOptions?: UseQueryOptions<ApiResponse<Goal[]>>) => {
    const enabled = !!organizationId; // Only enable if organizationId is available
    return useQuery<ApiResponse<Goal[]>>(
      [...goalQueryKeys.all(), 'type', type],
      () => goalApi.getGoalsByType(type, organizationId as ID),
      {
        ...options,
        enabled: enabled && (options?.enabled !== false), // Respect existing enabled option
        ...queryOptions,
      }
    );
  };

  // Implement useGetGoal query for fetching a single goal by ID
  const useGetGoal = (id: ID, queryOptions?: UseQueryOptions<ApiResponse<Goal>>) => {
    return useQuery<ApiResponse<Goal>>(
      goalQueryKeys.detail(id),
      () => goalApi.getGoalById(id),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetGoalWithMetrics query for fetching a goal with its associated metrics
  const useGetGoalWithMetrics = (id: ID, queryOptions?: UseQueryOptions<ApiResponse<GoalWithMetrics>>) => {
    return useQuery<ApiResponse<GoalWithMetrics>>(
      [...goalQueryKeys.all(), 'withMetrics', id],
      () => goalApi.getGoalWithMetrics(id),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetGoalWithMilestones query for fetching a goal with its milestones
  const useGetGoalWithMilestones = (id: ID, queryOptions?: UseQueryOptions<ApiResponse<GoalWithMilestones>>) => {
    return useQuery<ApiResponse<GoalWithMilestones>>(
      [...goalQueryKeys.all(), 'withMilestones', id],
      () => goalApi.getGoalWithMilestones(id),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetGoalWithMilestonesAndMetrics query for fetching a goal with both milestones and metrics
  const useGetGoalWithMilestonesAndMetrics = (id: ID, queryOptions?: UseQueryOptions<ApiResponse<GoalWithMilestonesAndMetrics>>) => {
    return useQuery<ApiResponse<GoalWithMilestonesAndMetrics>>(
      [...goalQueryKeys.all(), 'withMilestonesAndMetrics', id],
      () => goalApi.getGoalWithMilestonesAndMetrics(id),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateGoal mutation for creating new goals
  const useCreateGoal = () => {
    return useMutation(
      (data: CreateGoalFormData) => goalApi.createGoal(data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(goalQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateGoal mutation for updating existing goals
  const useUpdateGoal = () => {
    return useMutation(
      ({ id, data }: { id: ID; data: UpdateGoalFormData }) => goalApi.updateGoal(id, data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(goalQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeleteGoal mutation for deleting goals
  const useDeleteGoal = () => {
    return useMutation(
      (id: ID) => goalApi.deleteGoal(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(goalQueryKeys.all());
        },
      }
    );
  };

  // Implement useGetMilestones query for fetching milestones for a specific goal
  const useGetMilestones = (goalId: ID, queryOptions?: UseQueryOptions<ApiResponse<Milestone[]>>) => {
    return useQuery<ApiResponse<Milestone[]>>(
      [...goalQueryKeys.all(), 'milestones', goalId],
      () => goalApi.getMilestones(goalId),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMilestone query for fetching a single milestone by ID
  const useGetMilestone = (id: ID, queryOptions?: UseQueryOptions<ApiResponse<Milestone>>) => {
    return useQuery<ApiResponse<Milestone>>(
      ['milestone', id],
      () => goalApi.getMilestoneById(id),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateMilestone mutation for creating new milestones
  const useCreateMilestone = () => {
    return useMutation(
      (data: CreateMilestoneFormData) => goalApi.createMilestone(data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(goalQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateMilestone mutation for updating existing milestones
  const useUpdateMilestone = () => {
    return useMutation(
      ({ id, data }: { id: ID; data: UpdateMilestoneFormData }) => goalApi.updateMilestone(id, data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(goalQueryKeys.all());
        },
      }
    );
  };

    // Implement useUpdateMilestoneStatus mutation for updating only the status of a milestone
    const useUpdateMilestoneStatus = () => {
      return useMutation(
        ({ id, status }: { id: ID; status: MilestoneStatus }) => goalApi.updateMilestoneStatus(id, status),
        {
          onSuccess: () => {
            queryClient.invalidateQueries(goalQueryKeys.all());
          },
        }
      );
    };

  // Implement useDeleteMilestone mutation for deleting milestones
  const useDeleteMilestone = () => {
    return useMutation(
      (id: ID) => goalApi.deleteMilestone(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(goalQueryKeys.all());
        },
      }
    );
  };

  // Implement useGetTimelineItems query for fetching timeline visualization items
  const useGetTimelineItems = (goalType?: GoalType, queryOptions?: UseQueryOptions<ApiResponse<GoalTimelineItem[]>>) => {
    const enabled = !!organizationId; // Only enable if organizationId is available
    return useQuery<ApiResponse<GoalTimelineItem[]>>(
      goalQueryKeys.timeline(organizationId as ID, goalType),
      () => goalApi.getTimelineItems(organizationId as ID, goalType),
      {
        ...options,
        enabled: enabled && (options?.enabled !== false), // Respect existing enabled option
        ...queryOptions,
      }
    );
  };

  // Implement useGoalForm hook for goal form state management
  const useGoalForm = (initialValues: CreateGoalFormData | UpdateGoalFormData) => {
    return useForm<CreateGoalFormData | UpdateGoalFormData>({
      initialValues,
      validationRules: {
        title: { required: true, minLength: 3 },
        description: { required: true, minLength: 10 },
        startDate: { required: true },
        endDate: { required: true },
      },
      onSubmit: async (values: CreateGoalFormData | UpdateGoalFormData) => {
        console.log('Goal form submitted', values);
      },
    });
  };

  // Implement useMilestoneForm hook for milestone form state management
  const useMilestoneForm = (initialValues: CreateMilestoneFormData | UpdateMilestoneFormData) => {
    return useForm<CreateMilestoneFormData | UpdateMilestoneFormData>({
      initialValues,
      validationRules: {
        title: { required: true, minLength: 3 },
        description: { required: true, minLength: 10 },
        dueDate: { required: true },
      },
      onSubmit: async (values: CreateMilestoneFormData | UpdateMilestoneFormData) => {
        console.log('Milestone form submitted', values);
      },
    });
  };

  // Return all queries, mutations, and utility functions
  return {
    goals: useGetGoals,
    getGoalsByType: useGetGoalsByType,
    getGoal: useGetGoal,
    getGoalWithMetrics: useGetGoalWithMetrics,
    getGoalWithMilestones: useGetGoalWithMilestones,
    getGoalWithMilestonesAndMetrics: useGetGoalWithMilestonesAndMetrics,
    createGoal: useCreateGoal,
    updateGoal: useUpdateGoal,
    deleteGoal: useDeleteGoal,
    getMilestones: useGetMilestones,
    getMilestone: useGetMilestone,
    createMilestone: useCreateMilestone,
    updateMilestone: useUpdateMilestone,
    updateMilestoneStatus: useUpdateMilestoneStatus,
    deleteMilestone: useDeleteMilestone,
    getTimelineItems: useGetTimelineItems,
    useGoalForm,
    useMilestoneForm,
  };
};