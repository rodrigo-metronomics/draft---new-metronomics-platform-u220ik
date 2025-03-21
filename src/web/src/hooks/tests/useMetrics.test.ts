import { renderHook, act } from '@testing-library/react-hooks'; // @testing-library/react-hooks@^8.0.0
import { useQuery, useMutation, useQueryClient } from 'react-query'; // react-query@^5.0.0
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // vitest@^0.34.0

import { useMetrics } from '../useMetrics';
import { renderHookWithProviders } from '../../tests/testUtils';
import { createMockAuthUser, createMockOrganization } from '../../tests/testUtils';
import { mockMetric } from '../../tests/mocks/apiMocks';
import { createMockMetricsQueryResult, createMockMutationResult, mockUseQuery, mockUseMutation, mockUseQueryClient } from '../../tests/mocks/reactQueryMock';
import { Metric, MetricWithValues, MetricValue, MetricThreshold, CreateMetricDto, UpdateMetricDto, CreateMetricValueDto, CreateMetricThresholdDto, UpdateMetricThresholdDto, MetricFilters, MetricValueFilters, MetricExportOptions } from '../../src/types/metric.types';
import { metricApi } from '../../src/services/api/metricApi';

// Mock React Query hooks
vi.mock('react-query', async () => {
  const actual = await vi.importActual('react-query');
  return {
    ...(actual as any),
    useQuery: mockUseQuery,
    useMutation: mockUseMutation,
    useQueryClient: mockUseQueryClient,
  };
});

// Mock internal modules
vi.mock('../../src/services/api/metricApi');

describe('useMetrics Hook', () => {
  beforeEach(() => {
    // Setup: Configure mocks before each test
    mockUseQuery.mockClear();
    mockUseMutation.mockClear();
    mockUseQueryClient.mockClear();
  });

  afterEach(() => {
    // Cleanup: Reset mocks after each test
    vi.clearAllMocks();
  });

  it('should return correct data and functions', () => {
    const { result } = renderHookWithProviders(() => useMetrics());

    expect(result.current).toBeDefined();
    expect(typeof result.current.metrics).toBe('function');
    expect(typeof result.current.getMetricById).toBe('function');
  });

  it('should call useGetMetrics with correct parameters', () => {
    const mockFilters: MetricFilters = { organizationId: 'test', search: '', type: null, goalId: null, teamId: null, dateRange: null };
    const mockPagination = { page: 1, pageSize: 10 };
    renderHookWithProviders(() => useMetrics().metrics(mockFilters, mockPagination));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.arrayContaining([
        'metrics',
        'list',
        mockFilters,
        mockPagination
      ]),
      expect.any(Function),
      expect.any(Object)
    );
  });
});