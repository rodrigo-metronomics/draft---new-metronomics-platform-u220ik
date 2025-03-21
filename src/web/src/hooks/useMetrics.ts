import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query'; // react-query@^5.0.0
import { useState, useCallback, useEffect } from 'react'; // react@^18.0.0

import { metricApi } from '../services/api/metricApi';
import {
  Metric,
  MetricWithValues,
  MetricValue,
  MetricThreshold,
  CreateMetricDto,
  UpdateMetricDto,
  CreateMetricValueDto,
  CreateMetricThresholdDto,
  UpdateMetricThresholdDto,
  MetricFilters,
  MetricValueFilters,
  MetricExportOptions,
  MetricDashboardData,
} from '../types/metric.types';
import { ID, DateRange, PaginationParams } from '../types/common.types';
import { useOrganizationContext } from '../contexts/OrganizationContext';
import { useAuth } from './useAuth';
import { useForm } from './useForm';

/**
 * Custom hook for managing metrics data and operations
 * @param options 
 * @returns Metrics data and operations including queries, mutations, and utility functions
 */
export const useMetrics = (options?: UseQueryOptions<Metric[]>) => {
  // Initialize React Query client for cache management
  const queryClient = useQueryClient();

  // Get current organization from organization context
  const { currentOrganization } = useOrganizationContext();

  // Get current user information from authentication state
  const { state: authState } = useAuth();

  // Define query key factory functions for consistent cache management
  const metricQueryKeys = {
    all: () => ['metrics'] as const,
    lists: (filters: MetricFilters, pagination: PaginationParams) =>
      [...metricQueryKeys.all(), 'list', filters, pagination] as const,
    details: () => [...metricQueryKeys.all(), 'detail'] as const,
    detail: (id: ID) => [...metricQueryKeys.details(), id] as const,
    values: (id: ID, filters: MetricValueFilters) => [...metricQueryKeys.detail(id), 'values', filters] as const,
    dashboard: (filters: MetricFilters) => [...metricQueryKeys.all(), 'dashboard', filters] as const,
    goal: (goalId: ID) => [...metricQueryKeys.all(), 'goal', goalId] as const,
    team: (teamId: ID) => [...metricQueryKeys.all(), 'team', teamId] as const,
  };

  // Implement useGetMetrics query for fetching metrics with filters and pagination
  const useGetMetrics = (filters: MetricFilters, pagination: PaginationParams, queryOptions?: UseQueryOptions<Metric[]>) => {
    return useQuery<Metric[]>(
      metricQueryKeys.lists(filters, pagination),
      () => metricApi.getMetrics({ ...filters, ...pagination }).then(res => res.data.items),
      {
        enabled: !!currentOrganization, // Only fetch if organization is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMetricById query for fetching a single metric by ID
  const useGetMetricById = (id: ID, queryOptions?: UseQueryOptions<Metric>) => {
    return useQuery<Metric>(
      metricQueryKeys.detail(id),
      () => metricApi.getMetricById(id).then(res => res.data),
      {
        enabled: !!currentOrganization, // Only fetch if organization is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMetricWithValues query for fetching a metric with its historical values
  const useGetMetricWithValues = (id: ID, filters: MetricValueFilters, queryOptions?: UseQueryOptions<MetricWithValues>) => {
    return useQuery<MetricWithValues>(
      metricQueryKeys.values(id, filters),
      () => metricApi.getMetricWithValues(id).then(res => res.data),
      {
        enabled: !!currentOrganization, // Only fetch if organization is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateMetric mutation for creating new metrics
  const useCreateMetric = () => {
    return useMutation(
      (metricData: CreateMetricDto) => metricApi.createMetric(metricData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(metricQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateMetric mutation for updating existing metrics
  const useUpdateMetric = () => {
    return useMutation(
      ({ id, metricData }: { id: ID, metricData: UpdateMetricDto }) =>
        metricApi.updateMetric(id, metricData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(metricQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeleteMetric mutation for deleting metrics
  const useDeleteMetric = () => {
    return useMutation(
      (id: ID) => metricApi.deleteMetric(id).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(metricQueryKeys.all());
        },
      }
    );
  };

  // Implement useRecordMetricValue mutation for recording new metric values
  const useRecordMetricValue = () => {
    return useMutation(
      ({ metricId, valueData }: { metricId: ID, valueData: CreateMetricValueDto }) =>
        metricApi.createMetricValue(metricId, valueData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(metricQueryKeys.all());
        },
      }
    );
  };

  // Implement useGetMetricValues query for fetching historical values for a metric
  const useGetMetricValues = (metricId: ID, filters: MetricValueFilters, queryOptions?: UseQueryOptions<MetricValue[]>) => {
    return useQuery<MetricValue[]>(
      metricQueryKeys.values(metricId, filters),
      () => metricApi.getMetricValues(metricId, filters).then(res => res.data),
      {
        enabled: !!currentOrganization, // Only fetch if organization is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useDeleteMetricValue mutation for deleting metric values
  const useDeleteMetricValue = () => {
    return useMutation(
      (valueId: ID) => metricApi.deleteMetricValue(valueId).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(metricQueryKeys.all());
        },
      }
    );
  };

  // Implement useCreateMetricThreshold mutation for creating new thresholds
  const useCreateMetricThreshold = () => {
    return useMutation(
      ({ metricId, thresholdData }: { metricId: ID, thresholdData: CreateMetricThresholdDto }) =>
        metricApi.createMetricThreshold(metricId, thresholdData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(metricQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateMetricThreshold mutation for updating existing thresholds
  const useUpdateMetricThreshold = () => {
    return useMutation(
      ({ thresholdId, thresholdData }: { thresholdId: ID, thresholdData: UpdateMetricThresholdDto }) =>
        metricApi.updateMetricThreshold(thresholdId, thresholdData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(metricQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeleteMetricThreshold mutation for deleting thresholds
  const useDeleteMetricThreshold = () => {
    return useMutation(
      (thresholdId: ID) => metricApi.deleteMetricThreshold(thresholdId).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(metricQueryKeys.all());
        },
      }
    );
  };

  // Implement useGetDashboardMetrics query for fetching metrics for dashboard display
  const useGetDashboardMetrics = (filters: MetricFilters, queryOptions?: UseQueryOptions<MetricDashboardData>) => {
    return useQuery<MetricDashboardData>(
      metricQueryKeys.dashboard(filters),
      () => metricApi.getDashboardMetrics(filters).then(res => res.data),
      {
        enabled: !!currentOrganization, // Only fetch if organization is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useExportMetrics mutation for exporting metrics data
  const useExportMetrics = () => {
    return useMutation(
      (options: MetricExportOptions) => metricApi.exportMetrics(options),
    );
  };

  // Implement useGetMetricsByGoal query for fetching metrics associated with a goal
  const useGetMetricsByGoal = (goalId: ID, queryOptions?: UseQueryOptions<Metric[]>) => {
    return useQuery<Metric[]>(
      metricQueryKeys.goal(goalId),
      () => metricApi.getMetricsByGoal(goalId).then(res => res.data),
      {
        enabled: !!currentOrganization, // Only fetch if organization is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMetricsByTeam query for fetching metrics associated with a team
  const useGetMetricsByTeam = (teamId: ID, queryOptions?: UseQueryOptions<Metric[]>) => {
    return useQuery<Metric[]>(
      metricQueryKeys.team(teamId),
      () => metricApi.getMetricsByTeam(teamId).then(res => res.data),
      {
        enabled: !!currentOrganization, // Only fetch if organization is available
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useMetricForm hook for metric form state management
  const useMetricForm = (initialValues: CreateMetricDto | UpdateMetricDto) => {
    return useForm<CreateMetricDto | UpdateMetricDto>({
      initialValues,
      validationRules: {
        name: { required: true, minLength: 3 },
        type: { required: true },
        unit: { required: true },
        comparisonType: { required: true },
        calculationMethod: { required: true },
      },
      onSubmit: async (values: CreateMetricDto | UpdateMetricDto) => {
        console.log('Metric form submitted', values);
      },
    });
  };

  // Implement useMetricValueForm hook for metric value form state management
  const useMetricValueForm = (initialValues: CreateMetricValueDto) => {
    return useForm<CreateMetricValueDto>({
      initialValues,
      validationRules: {
        value: { required: true },
        timestamp: { required: true },
      },
      onSubmit: async (values: CreateMetricValueDto) => {
        console.log('Metric value form submitted', values);
      },
    });
  };

  // Implement useMetricThresholdForm hook for threshold form state management
  const useMetricThresholdForm = (initialValues: CreateMetricThresholdDto | UpdateMetricThresholdDto) => {
    return useForm<CreateMetricThresholdDto | UpdateMetricThresholdDto>({
      initialValues,
      validationRules: {
        type: { required: true },
        value: { required: true },
        color: { required: true },
      },
      onSubmit: async (values: CreateMetricThresholdDto | UpdateMetricThresholdDto) => {
        console.log('Metric threshold form submitted', values);
      },
    });
  };

  // Return all queries, mutations, and utility functions
  return {
    metrics: useGetMetrics,
    isLoading: useGetMetrics(
      { organizationId: currentOrganization?.id || '', search: '', type: null, goalId: null, teamId: null, dateRange: null },
      { page: 1, pageSize: 10 }
    ).isLoading,
    isError: useGetMetrics(
      { organizationId: currentOrganization?.id || '', search: '', type: null, goalId: null, teamId: null, dateRange: null },
      { page: 1, pageSize: 10 }
    ).isError,
    error: useGetMetrics(
      { organizationId: currentOrganization?.id || '', search: '', type: null, goalId: null, teamId: null, dateRange: null },
      { page: 1, pageSize: 10 }
    ).error,
    refetch: useGetMetrics(
      { organizationId: currentOrganization?.id || '', search: '', type: null, goalId: null, teamId: null, dateRange: null },
      { page: 1, pageSize: 10 }
    ).refetch,
    getMetricById: useGetMetricById,
    getMetricWithValues: useGetMetricWithValues,
    createMetric: useCreateMetric,
    updateMetric: useUpdateMetric,
    deleteMetric: useDeleteMetric,
    recordMetricValue: useRecordMetricValue,
    getMetricValues: useGetMetricValues,
    deleteMetricValue: useDeleteMetricValue,
    createMetricThreshold: useCreateMetricThreshold,
    updateMetricThreshold: useUpdateMetricThreshold,
    deleteMetricThreshold: useDeleteMetricThreshold,
    getDashboardMetrics: useGetDashboardMetrics,
    exportMetrics: useExportMetrics,
    getMetricsByGoal: useGetMetricsByGoal,
    getMetricsByTeam: useGetMetricsByTeam,
    useMetricForm: useMetricForm,
    useMetricValueForm: useMetricValueForm,
    useMetricThresholdForm: useMetricThresholdForm,
  };
};