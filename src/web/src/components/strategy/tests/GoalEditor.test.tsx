# src/web/src/components/strategy/tests/GoalEditor.test.tsx
```typescript
import React from 'react'; // react@^18.2.0
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'; // @testing-library/react@^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event@^14.0.0
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // vitest@^0.34.0

import GoalEditor from '../GoalEditor';
import { renderWithProviders, waitForLoadingToFinish } from '../../../tests/testUtils';
import { Goal, GoalType, GoalStatus, CreateGoalFormData, UpdateGoalFormData } from '../../../types/goal.types';
import { ID } from '../../../types/common.types';
import * as useGoalsHook from '../../../hooks/useGoals';
import * as useMetricsHook from '../../../hooks/useMetrics';
import * as useOrganizationContextHook from '../../../contexts/OrganizationContext';

// Mock implementations for React Query hooks
vi.mock('../../../hooks/useGoals');
vi.mock('../../../hooks/useMetrics');
vi.mock('../../../contexts/OrganizationContext');

// Setup function to configure mocks before each test
const setup = () => {
  // Mock useGoals hook to return test data and mock functions
  vi.mocked(useGoalsHook.useGoals).mockReturnValue({
    getGoal: { getGoal: vi.fn().mockResolvedValue(null) },
    createGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
    updateGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
  } as any);

  // Mock useMetrics hook to return test metrics and mock functions
  vi.mocked(useMetricsHook.useMetrics).mockReturnValue({
    metrics: mockMetrics,
    getMetrics: vi.fn().mockResolvedValue(mockMetrics),
  } as any);

  // Mock useOrganizationContext to return a test organization
  vi.mocked(useOrganizationContextHook.useOrganizationContext).mockReturnValue({
    currentOrganization: mockOrganization,
  } as any);
};

// Cleanup function to reset mocks after each test
const cleanup = () => {
  // Reset all mocks to their original implementation
  vi.restoreAllMocks();

  // Clear all mock instances and results
  vi.clearAllMocks();
};

// Helper function to create a mock goal for testing
const createMockGoal = (overrides: Partial<Goal> = {}): Goal => {
  // Create a default mock goal with all required properties
  const defaultGoal: Goal = {
    id: 'goal-1',
    type: GoalType.ONE_HAG,
    title: 'Test Goal',
    description: 'Test goal description',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: GoalStatus.ACTIVE,
    progress: 0,
    organizationId: 'org-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  // Apply any overrides provided in the parameters
  return { ...defaultGoal, ...overrides };
};

// Helper function to create a mock metric for testing
const createMockMetric = (overrides: Partial<any> = {}) => {
  // Create a default mock metric with all required properties
  const defaultMetric = {
    id: 'metric-1',
    name: 'Test Metric',
    description: 'Test metric description',
    unit: 'count',
    organizationId: 'org-1',
  };

  // Apply any overrides provided in the parameters
  return { ...defaultMetric, ...overrides };
};

// Test data
const mockGoal: Goal = createMockGoal();
const mockMetrics = [createMockMetric({ id: 'metric-1', name: 'Test Metric 1' }), createMockMetric({ id: 'metric-2', name: 'Test Metric 2' })];
const mockOrganization = { id: 'org-1', name: 'Test Organization', description: 'Test organization description' };

// Test suite for the GoalEditor component
describe('GoalEditor Component', () => {
  // Setup mocks before each test
  beforeEach(() => {
    setup();
  });

  // Cleanup mocks after each test
  afterEach(() => {
    cleanup();
  });

  // Test case: renders create goal form correctly
  it('renders create goal form correctly', () => {
    // Render GoalEditor component in create mode
    renderWithProviders(<GoalEditor />);

    // Verify title field is present
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();

    // Verify description field is present
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();

    // Verify goal type dropdown is present
    expect(screen.getByLabelText(/Goal Type/i)).toBeInTheDocument();

    // Verify date fields are present
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();

    // Verify metrics multi-select is present
    expect(screen.getByLabelText(/Linked Metrics/i)).toBeInTheDocument();

    // Verify submit button is present
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
  });

  // Test case: renders edit goal form correctly
  it('renders edit goal form correctly', async () => {
    // Setup mock goal data
    const getGoalWithMetricsMock = vi.fn().mockResolvedValue({ data: mockGoal });
    vi.mocked(useGoalsHook.useGoals).mockReturnValue({
      getGoal: { getGoal: getGoalWithMetricsMock },
      createGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
      updateGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
    } as any);

    // Render GoalEditor component in edit mode with goalId
    renderWithProviders(<GoalEditor goalId="goal-1" isEdit />);

    // Wait for data to load
    await waitForLoadingToFinish();

    // Verify form fields are populated with goal data
    expect(screen.getByLabelText(/Title/i)).toHaveValue(mockGoal.title);
    expect(screen.getByLabelText(/Description/i)).toHaveValue(mockGoal.description);

    // Verify status dropdown is present (only in edit mode)
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();

    // Verify submit button is present
    expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
  });

  // Test case: shows validation errors when submitting empty form
  it('shows validation errors when submitting empty form', async () => {
    // Render GoalEditor component in create mode
    renderWithProviders(<GoalEditor />);

    // Submit the form without entering any data
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    // Verify validation error messages are displayed for required fields
    await waitFor(() => {
      expect(screen.getByText(/The field 'Title' is required./i)).toBeInTheDocument();
      expect(screen.getByText(/The field 'Description' is required./i)).toBeInTheDocument();
      expect(screen.getByText(/The field 'Goal Type' is required./i)).toBeInTheDocument();
      expect(screen.getByText(/The field 'Start Date' is required./i)).toBeInTheDocument();
      expect(screen.getByText(/The field 'End Date' is required./i)).toBeInTheDocument();
    });
  });

  // Test case: handles form submission for creating a goal
  it('handles form submission for creating a goal', async () => {
    // Mock createGoal function
    const createGoalMock = vi.fn().mockResolvedValue(null);
    vi.mocked(useGoalsHook.useGoals).mockReturnValue({
      getGoal: { getGoal: vi.fn().mockResolvedValue(null) },
      createGoal: { mutateAsync: createGoalMock },
      updateGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
    } as any);

    // Render GoalEditor component in create mode
    renderWithProviders(<GoalEditor />);

    // Fill in all required fields with valid data
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Goal' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'New goal description' } });
    fireEvent.click(screen.getByLabelText(/Goal Type/i));
    fireEvent.click(within(screen.getByRole('listbox')).getByText(/1HAG/i));
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '01/01/2024' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '12/31/2024' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    // Verify createGoal function was called with correct data
    await waitFor(() => {
      expect(createGoalMock).toHaveBeenCalled();
    });
  });

  // Test case: handles form submission for updating a goal
  it('handles form submission for updating a goal', async () => {
    // Mock updateGoal function
    const updateGoalMock = vi.fn().mockResolvedValue(null);
    const getGoalWithMetricsMock = vi.fn().mockResolvedValue({ data: mockGoal });
    vi.mocked(useGoalsHook.useGoals).mockReturnValue({
      getGoal: { getGoal: getGoalWithMetricsMock },
      createGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
      updateGoal: { mutateAsync: updateGoalMock },
    } as any);

    // Render GoalEditor component in edit mode with goalId
    renderWithProviders(<GoalEditor goalId="goal-1" isEdit />);

    // Wait for data to load
    await waitForLoadingToFinish();

    // Modify some form fields
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Updated Goal' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Update/i }));

    // Verify updateGoal function was called with correct data
    await waitFor(() => {
      expect(updateGoalMock).toHaveBeenCalled();
    });
  });

  // Test case: loads and displays metrics in multi-select
  it('loads and displays metrics in multi-select', async () => {
    // Render GoalEditor component in create mode
    renderWithProviders(<GoalEditor />);

    // Wait for metrics to load
    await waitForLoadingToFinish();

    // Open metrics dropdown
    fireEvent.focus(screen.getByLabelText(/Linked Metrics/i));
    fireEvent.keyDown(screen.getByLabelText(/Linked Metrics/i), { code: 'Space', key: ' ' });

    // Verify all mock metrics are displayed in the dropdown
    await waitFor(() => {
      expect(screen.getByText(/Test Metric 1/i)).toBeVisible();
      expect(screen.getByText(/Test Metric 2/i)).toBeVisible();
    });
  });

  // Test case: handles cancel button click
  it('handles cancel button click', () => {
    // Create mock onCancel function
    const onCancelMock = vi.fn();

    // Render GoalEditor component with the mock onCancel prop
    renderWithProviders(<GoalEditor onCancel={onCancelMock} />);

    // Click the cancel button
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // Verify onCancel function was called
    expect(onCancelMock).toHaveBeenCalled();
  });

  // Test case: handles loading state correctly
  it('handles loading state correctly', async () => {
    // Mock getGoalWithMetrics to return a delayed promise
    let resolve: (value: { data: Goal }) => void;
    const delayedPromise = new Promise<{ data: Goal }>(res => {
      resolve = res;
    });
    const getGoalWithMetricsMock = vi.fn().mockReturnValue(delayedPromise);
    vi.mocked(useGoalsHook.useGoals).mockReturnValue({
      getGoal: { getGoal: getGoalWithMetricsMock },
      createGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
      updateGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
    } as any);

    // Render GoalEditor component in edit mode with goalId
    renderWithProviders(<GoalEditor goalId="goal-1" isEdit />);

    // Verify loading indicator is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve the promise
    resolve!({ data: mockGoal });
    await waitForLoadingToFinish();

    // Verify loading indicator is no longer displayed
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // Verify form is rendered with data
    expect(screen.getByLabelText(/Title/i)).toHaveValue(mockGoal.title);
  });

  // Test case: handles error state correctly
  it('handles error state correctly', async () => {
    // Mock getGoalWithMetrics to reject with an error
    vi.mocked(useGoalsHook.useGoals).mockReturnValue({
      getGoal: { getGoal: vi.fn().mockRejectedValue(new Error('Failed to load goal')) },
      createGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
      updateGoal: { mutateAsync: vi.fn().mockResolvedValue(null) },
    } as any);

    // Render GoalEditor component in edit mode with goalId
    renderWithProviders(<GoalEditor goalId="goal-1" isEdit />);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load goal data/i)).toBeInTheDocument();
    });

    // Verify retry button is present
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});