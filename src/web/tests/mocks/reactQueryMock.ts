import { QueryClient, UseQueryResult, UseMutationResult, QueryKey, MutationKey } from 'react-query'; // v5.0.0
import { vi } from 'vitest'; // v0.34.0

// Mock implementations of React Query hooks and methods
export const mockUseQuery = vi.fn();
export const mockUseMutation = vi.fn();
export const mockUseQueryClient = vi.fn();
export const mockInvalidateQueries = vi.fn();
export const mockSetQueryData = vi.fn();
export const mockGetQueryData = vi.fn();

/**
 * Creates a mock UseQueryResult object with customizable properties
 * @param options Optional properties to override default values
 * @returns A mock UseQueryResult object
 */
export function createMockQueryResult<TData = unknown, TError = Error>(
  options: Partial<UseQueryResult<TData, TError>> = {}
): UseQueryResult<TData, TError> {
  const defaultResult: UseQueryResult<TData, TError> = {
    data: undefined,
    dataUpdatedAt: Date.now(),
    error: null as unknown as TError,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null as unknown as TError,
    fetchStatus: 'idle',
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isPaused: false,
    isLoading: false,
    isInitialLoading: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    refetch: vi.fn().mockResolvedValue({ data: options.data }),
    remove: vi.fn(),
    status: 'success',
    ...options
  };

  return defaultResult;
}

/**
 * Creates a mock UseMutationResult object with customizable properties
 * @param options Optional properties to override default values
 * @returns A mock UseMutationResult object
 */
export function createMockMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: Partial<UseMutationResult<TData, TError, TVariables, TContext>> = {}
): UseMutationResult<TData, TError, TVariables, TContext> {
  const defaultMutate = vi.fn().mockImplementation((variables) => {
    return Promise.resolve(options.data);
  });

  const defaultResult: UseMutationResult<TData, TError, TVariables, TContext> = {
    data: undefined,
    error: null as unknown as TError,
    isError: false,
    isIdle: true,
    isLoading: false,
    isPaused: false,
    isSuccess: false,
    mutate: defaultMutate,
    mutateAsync: vi.fn().mockImplementation((variables) => Promise.resolve(options.data)),
    reset: vi.fn(),
    status: 'idle',
    variables: undefined as unknown as TVariables,
    context: undefined as unknown as TContext,
    failureCount: 0,
    failureReason: null as unknown as TError,
    ...options
  };

  return defaultResult;
}

/**
 * Creates a mock QueryClient with customizable behavior
 * @param options Optional properties to override default behavior
 * @returns A mock QueryClient object
 */
export function createMockQueryClient(options: Partial<QueryClient> = {}): QueryClient {
  const defaultClient = {
    invalidateQueries: mockInvalidateQueries.mockImplementation(() => Promise.resolve()),
    setQueryData: mockSetQueryData.mockImplementation((queryKey, updater) => {
      if (typeof updater === 'function') {
        return updater(undefined);
      }
      return updater;
    }),
    getQueryData: mockGetQueryData.mockImplementation(() => undefined),
    setQueriesData: vi.fn(),
    getQueriesData: vi.fn().mockReturnValue([]),
    fetchQuery: vi.fn().mockImplementation(() => Promise.resolve()),
    fetchInfiniteQuery: vi.fn().mockImplementation(() => Promise.resolve()),
    prefetchQuery: vi.fn().mockImplementation(() => Promise.resolve()),
    prefetchInfiniteQuery: vi.fn().mockImplementation(() => Promise.resolve()),
    cancelQueries: vi.fn().mockImplementation(() => Promise.resolve()),
    removeQueries: vi.fn(),
    resetQueries: vi.fn().mockImplementation(() => Promise.resolve()),
    isFetching: vi.fn().mockReturnValue(0),
    isMutating: vi.fn().mockReturnValue(0),
    getDefaultOptions: vi.fn().mockReturnValue({}),
    setDefaultOptions: vi.fn(),
    getQueryCache: vi.fn().mockReturnValue({}),
    getMutationCache: vi.fn().mockReturnValue({}),
    clear: vi.fn(),
    ...options
  };

  return defaultClient as unknown as QueryClient;
}

/**
 * Creates a mock query result specifically for metrics data
 * @param options Optional properties to override default values
 * @returns A mock UseQueryResult object with metrics data
 */
export function createMockMetricsQueryResult(
  options: Partial<UseQueryResult<any, Error>> = {}
): UseQueryResult<any, Error> {
  const defaultMetrics = [
    {
      id: '1',
      name: 'Revenue',
      description: 'Monthly revenue',
      value: 1200000,
      previousValue: 1100000,
      unit: 'currency',
      comparisonType: 'percentage',
      trend: 'up',
      createdAt: '2023-04-01T00:00:00Z',
      updatedAt: '2023-04-15T00:00:00Z'
    },
    {
      id: '2',
      name: 'NPS',
      description: 'Net Promoter Score',
      value: 78,
      previousValue: 72,
      unit: 'number',
      comparisonType: 'absolute',
      trend: 'up',
      createdAt: '2023-04-01T00:00:00Z',
      updatedAt: '2023-04-15T00:00:00Z'
    },
    {
      id: '3',
      name: 'Churn',
      description: 'Monthly customer churn rate',
      value: 2.1,
      previousValue: 2.4,
      unit: 'percentage',
      comparisonType: 'percentage',
      trend: 'down',
      createdAt: '2023-04-01T00:00:00Z',
      updatedAt: '2023-04-15T00:00:00Z'
    }
  ];

  return createMockQueryResult({
    data: defaultMetrics,
    ...options
  });
}

/**
 * Creates a mock query result specifically for meetings data
 * @param options Optional properties to override default values
 * @returns A mock UseQueryResult object with meetings data
 */
export function createMockMeetingsQueryResult(
  options: Partial<UseQueryResult<any, Error>> = {}
): UseQueryResult<any, Error> {
  const defaultMeetings = [
    {
      id: '1',
      title: 'Daily Huddle',
      meetingType: 'daily',
      startTime: '2023-04-15T09:00:00Z',
      endTime: '2023-04-15T09:15:00Z',
      status: 'scheduled',
      participants: [
        { id: '1', name: 'John Smith', role: 'moderator' },
        { id: '2', name: 'Sarah Johnson', role: 'participant' }
      ],
      createdAt: '2023-04-01T00:00:00Z',
      updatedAt: '2023-04-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Weekly Review',
      meetingType: 'weekly',
      startTime: '2023-04-17T14:00:00Z',
      endTime: '2023-04-17T15:00:00Z',
      status: 'scheduled',
      participants: [
        { id: '1', name: 'John Smith', role: 'moderator' },
        { id: '2', name: 'Sarah Johnson', role: 'participant' },
        { id: '3', name: 'Mike Brown', role: 'participant' }
      ],
      createdAt: '2023-04-01T00:00:00Z',
      updatedAt: '2023-04-01T00:00:00Z'
    },
    {
      id: '3',
      title: 'Sprint Planning',
      meetingType: 'planning',
      startTime: '2023-04-19T10:00:00Z',
      endTime: '2023-04-19T11:30:00Z',
      status: 'scheduled',
      participants: [
        { id: '1', name: 'John Smith', role: 'moderator' },
        { id: '2', name: 'Sarah Johnson', role: 'participant' },
        { id: '3', name: 'Mike Brown', role: 'participant' },
        { id: '4', name: 'Lisa Davis', role: 'participant' }
      ],
      createdAt: '2023-04-01T00:00:00Z',
      updatedAt: '2023-04-01T00:00:00Z'
    }
  ];

  return createMockQueryResult({
    data: defaultMeetings,
    ...options
  });
}

/**
 * Creates a mock query result specifically for goals data
 * @param options Optional properties to override default values
 * @returns A mock UseQueryResult object with goals data
 */
export function createMockGoalsQueryResult(
  options: Partial<UseQueryResult<any, Error>> = {}
): UseQueryResult<any, Error> {
  const defaultGoals = [
    {
      id: '1',
      title: '$50M annual revenue with 20% EBITDA by EOY 2025',
      type: '3HAG',
      description: 'Achieve $50M in annual revenue with 20% EBITDA by the end of 2025',
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      status: 'active',
      milestones: [
        { id: '1', title: '$20M revenue', dueDate: '2023-12-31T23:59:59Z', status: 'active' },
        { id: '2', title: '$35M revenue', dueDate: '2024-12-31T23:59:59Z', status: 'pending' },
        { id: '3', title: '$50M revenue', dueDate: '2025-12-31T23:59:59Z', status: 'pending' }
      ],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: '$100M valuation by 2030',
      type: 'BHAG',
      description: 'Achieve company valuation of $100M by 2030',
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2030-12-31T23:59:59Z',
      status: 'active',
      milestones: [
        { id: '4', title: '$20M valuation', dueDate: '2025-12-31T23:59:59Z', status: 'active' },
        { id: '5', title: '$50M valuation', dueDate: '2027-12-31T23:59:59Z', status: 'pending' },
        { id: '6', title: '$100M valuation', dueDate: '2030-12-31T23:59:59Z', status: 'pending' }
      ],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '3',
      title: 'Expand to 3 new markets by EOY',
      type: '1HAG',
      description: 'Enter and establish presence in 3 new geographic markets by end of year',
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2023-12-31T23:59:59Z',
      status: 'active',
      milestones: [
        { id: '7', title: 'Market research', dueDate: '2023-03-31T23:59:59Z', status: 'completed' },
        { id: '8', title: 'First market entry', dueDate: '2023-06-30T23:59:59Z', status: 'active' },
        { id: '9', title: 'All markets entered', dueDate: '2023-12-31T23:59:59Z', status: 'pending' }
      ],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ];

  return createMockQueryResult({
    data: defaultGoals,
    ...options
  });
}

/**
 * Creates a mock query result specifically for users data
 * @param options Optional properties to override default values
 * @returns A mock UseQueryResult object with users data
 */
export function createMockUsersQueryResult(
  options: Partial<UseQueryResult<any, Error>> = {}
): UseQueryResult<any, Error> {
  const defaultUsers = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@acmeinc.com',
      role: 'CEO',
      teams: [],
      status: 'active',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@acmeinc.com',
      role: 'Leadership',
      teams: ['Marketing', 'Strategy'],
      status: 'active',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Mike Brown',
      email: 'mike@acmeinc.com',
      role: 'Team Member',
      teams: ['Product'],
      status: 'active',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'Lisa Davis',
      email: 'lisa@acmeinc.com',
      role: 'Team Member',
      teams: ['Sales'],
      status: 'active',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    {
      id: '5',
      name: 'Alex Wilson',
      email: 'alex@acmeinc.com',
      role: 'Viewer',
      teams: [],
      status: 'active',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ];

  return createMockQueryResult({
    data: defaultUsers,
    ...options
  });
}

/**
 * Sets up all React Query mocks with default implementations
 */
export function setupReactQueryMocks(): void {
  // Set up default mock implementations
  mockUseQuery.mockImplementation(() => createMockQueryResult());
  
  mockUseMutation.mockImplementation(() => createMockMutationResult());
  
  mockUseQueryClient.mockImplementation(() => createMockQueryClient());
  
  mockInvalidateQueries.mockImplementation(() => Promise.resolve());
  
  mockSetQueryData.mockImplementation((queryKey, updater) => {
    if (typeof updater === 'function') {
      return updater(undefined);
    }
    return updater;
  });
  
  mockGetQueryData.mockImplementation(() => undefined);
}

/**
 * Resets all React Query mocks to their initial state
 */
export function resetReactQueryMocks(): void {
  mockUseQuery.mockReset();
  mockUseMutation.mockReset();
  mockUseQueryClient.mockReset();
  mockInvalidateQueries.mockReset();
  mockSetQueryData.mockReset();
  mockGetQueryData.mockReset();
}