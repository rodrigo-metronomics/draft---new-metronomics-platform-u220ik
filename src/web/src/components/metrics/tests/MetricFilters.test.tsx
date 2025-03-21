import React from 'react'; // version ^18.2.0
import { render, screen, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi, describe, it, expect, beforeEach } from 'vitest'; // version ^0.34.0

import MetricFilters from '../MetricFilters';
import { renderWithProviders } from '../../../tests/testUtils';
import { createMockOrganization } from '../../../tests/testUtils';
import { MetricFilters as MetricFiltersType, MetricType } from '../../../types/metric.types';
import { METRIC_TYPES } from '../../../utils/constants/metricTypes';

// Mock the useTeams hook to return predefined teams data
vi.mock('../../../hooks/useTeams', () => ({ default: () => ({ teams: mockTeams, isLoading: false }) }));

// Mock the useGoals hook to return predefined goals data
vi.mock('../../../hooks/useGoals', () => ({ default: () => ({ goals: mockGoals, isLoading: false }) }));

// Mock the useOrganization hook to return a predefined organization
vi.mock('../../../hooks/useOrganization', () => ({ default: () => ({ currentOrganization: mockOrganization }) }));

// Mock organization data for testing
const mockOrganization = createMockOrganization({ id: 'org-1', name: 'Test Organization' });

// Mock teams data for testing team filter options
const mockTeams = [{ id: 'team-1', name: 'Engineering' }, { id: 'team-2', name: 'Marketing' }];

// Mock goals data for testing goal filter options
const mockGoals = [{ id: 'goal-1', name: 'Increase Revenue' }, { id: 'goal-2', name: 'Reduce Churn' }];

// Initial filter values for testing
const initialFilters = { organizationId: 'org-1', teamId: null, type: null, goalId: null, search: null, dateRange: null };

interface SetupResult {
  onFilterChange: vi.Mock<any, any>;
}

/**
 * Setup function to create common test variables and mocks
 */
const setup = (): SetupResult => {
  // Create a mock onFilterChange handler with vi.fn()
  const onFilterChange = vi.fn();

  return {
    onFilterChange,
  };
};

describe('MetricFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    // Arrange
    const { onFilterChange } = setup();

    // Act
    renderWithProviders(<MetricFilters filters={initialFilters} onFilterChange={onFilterChange} />);

    // Assert
    expect(screen.getByPlaceholderText('Select Team')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Goal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    // Arrange
    const { onFilterChange } = setup();
    const className = 'custom-class';

    // Act
    renderWithProviders(<MetricFilters filters={initialFilters} onFilterChange={onFilterChange} className={className} />);

    // Assert
    const filterContainer = screen.getByRole('generic');
    expect(filterContainer).toHaveClass(className);
  });

  it('displays initial filter values', () => {
    // Arrange
    const { onFilterChange } = setup();
    const initialFiltersWithValues: MetricFiltersType = {
      organizationId: 'org-1',
      teamId: 'team-1',
      type: MetricType.CURRENCY,
      goalId: 'goal-2',
      search: 'test search',
      dateRange: null,
    };

    // Act
    renderWithProviders(<MetricFilters filters={initialFiltersWithValues} onFilterChange={onFilterChange} />);

    // Assert
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText(METRIC_TYPES.CURRENCY)).toBeInTheDocument();
    expect(screen.getByText('Reduce Churn')).toBeInTheDocument();
    expect((screen.getByPlaceholderText('Search') as HTMLInputElement).value).toBe('test search');
  });

  it('calls onFilterChange when team filter changes', async () => {
    // Arrange
    const { onFilterChange } = setup();
    renderWithProviders(<MetricFilters filters={initialFilters} onFilterChange={onFilterChange} />);
    const teamDropdown = screen.getByPlaceholderText('Select Team');

    // Act
    await userEvent.click(teamDropdown);
    await userEvent.click(screen.getByText('Engineering'));

    // Assert
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ ...initialFilters, teamId: 'team-1' });
  });

  it('calls onFilterChange when metric type filter changes', async () => {
    // Arrange
    const { onFilterChange } = setup();
    renderWithProviders(<MetricFilters filters={initialFilters} onFilterChange={onFilterChange} />);
    const typeDropdown = screen.getByPlaceholderText('Select Type');

    // Act
    await userEvent.click(typeDropdown);
    await userEvent.click(screen.getByText(METRIC_TYPES.CURRENCY));

    // Assert
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ ...initialFilters, type: MetricType.CURRENCY });
  });

  it('calls onFilterChange when goal filter changes', async () => {
    // Arrange
    const { onFilterChange } = setup();
    renderWithProviders(<MetricFilters filters={initialFilters} onFilterChange={onFilterChange} />);
    const goalDropdown = screen.getByPlaceholderText('Select Goal');

    // Act
    await userEvent.click(goalDropdown);
    await userEvent.click(screen.getByText('Increase Revenue'));

    // Assert
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith({ ...initialFilters, goalId: 'goal-1' });
  });

  it('calls onFilterChange when search input changes', async () => {
    // Arrange
    const { onFilterChange } = setup();
    renderWithProviders(<MetricFilters filters={initialFilters} onFilterChange={onFilterChange} />);
    const searchInput = screen.getByPlaceholderText('Search');

    // Act
    await userEvent.type(searchInput, 'test');
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });

    // Assert
    expect(onFilterChange).toHaveBeenCalledWith({ ...initialFilters, search: 'test' });
  });

  it('shows loading state when teams are loading', () => {
    // Arrange
    vi.mock('../../../hooks/useTeams', () => ({ default: () => ({ teams: [], isLoading: true }) }));

    // Act
    renderWithProviders(<MetricFilters filters={initialFilters} onFilterChange={() => { }} />);

    // Assert
    expect(screen.getByPlaceholderText('Select Team')).toBeDisabled();
  });

  it('shows loading state when goals are loading', () => {
    // Arrange
    vi.mock('../../../hooks/useGoals', () => ({ default: () => ({ goals: [], isLoading: true }) }));

    // Act
    renderWithProviders(<MetricFilters filters={initialFilters} onFilterChange={() => { }} />);

    // Assert
    expect(screen.getByPlaceholderText('Select Type')).toBeDisabled();
  });
});