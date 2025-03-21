import React from 'react'; // React library for component creation // v18.2.0
import { screen, waitFor, within, fireEvent } from '@testing-library/react'; // Testing utilities for component interaction // ^14.0.0
import userEvent from '@testing-library/user-event'; // Simulating user interactions in tests // ^14.0.0
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // Test runner and assertion library // ^0.34.0

import MetricsDashboardPage from '../MetricsDashboardPage'; // Component under test
import { renderWithProviders, renderWithRouter, waitForLoadingToFinish } from '../../../tests/testUtils'; // Test utilities for rendering components with necessary providers and waiting for loading states
import { setupAllMocks, mockMetric } from '../../../tests/mocks/apiMocks'; // Mock API responses for metrics data
import useMetrics from '../../../hooks/useMetrics'; // Hook for fetching and managing metrics data
import { MetricType, ComparisonType, TrendDirection } from '../../../types/metric.types'; // Type definitions for metrics data
import { ROUTES } from '../../../utils/constants/routes'; // Route constants for navigation testing

// Mock implementation of useMetrics hook
const mockUseMetrics = vi.fn();

// Mock implementation of useNavigate hook
const mockNavigate = vi.fn();

// Array of mock metric objects for testing
const mockMetrics = [
  {
    id: '1',
    name: 'Revenue',
    description: 'Monthly revenue',
    type: MetricType.CURRENCY,
    unit: 'USD',
    comparisonType: ComparisonType.YEAR_TO_YEAR,
    calculationMethod: 'manual',
    currentValue: 1200000,
    previousValue: 1100000,
    changePercentage: 0.0909,
    trend: TrendDirection.UP,
    thresholds: [],
    values: [],
    teamId: 'team1',
    team: { id: 'team1', name: 'Sales' }
  },
  {
    id: '2',
    name: 'Customer Acquisition Cost',
    description: 'Cost to acquire a new customer',
    type: MetricType.CURRENCY,
    unit: 'USD',
    comparisonType: ComparisonType.MONTH_TO_MONTH,
    calculationMethod: 'manual',
    currentValue: 150,
    previousValue: 160,
    changePercentage: -0.0625,
    trend: TrendDirection.DOWN,
    thresholds: [],
    values: [],
    teamId: 'team2',
    team: { id: 'team2', name: 'Marketing' }
  },
  {
    id: '3',
    name: 'Customer Churn Rate',
    description: 'Percentage of customers lost per month',
    type: MetricType.PERCENTAGE,
    unit: '%',
    comparisonType: ComparisonType.YEAR_TO_YEAR,
    calculationMethod: 'manual',
    currentValue: 0.02,
    previousValue: 0.025,
    changePercentage: -0.2000,
    trend: TrendDirection.DOWN,
    thresholds: [],
    values: [],
    teamId: 'team1',
    team: { id: 'team1', name: 'Sales' }
  },
];

describe('MetricsDashboardPage', () => { // Test suite for MetricsDashboardPage component
  beforeEach(() => { // Set up test environment before each test
    setupAllMocks(); // Set up API mocks
    vi.mock('../../../hooks/useMetrics', () => ({ // Mock useMetrics hook
      default: mockUseMetrics,
    }));
    vi.mock('react-router-dom', async () => { // Mock useNavigate hook
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });
    mockUseMetrics.mockReturnValue({ // Mock useMetrics hook to return mock metrics data
      metrics: { data: mockMetrics },
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => { // Clean up test environment after each test
    vi.restoreAllMocks(); // Reset all mocks
  });

  it('should render the metrics dashboard page', async () => { // Test that the metrics dashboard page renders correctly
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component with necessary providers
    await waitForLoadingToFinish(); // Wait for loading to finish
    expect(screen.getByText('Metrics Dashboard')).toBeInTheDocument(); // Verify that the page title is displayed
    expect(screen.getByText('Add Metric')).toBeInTheDocument(); // Verify that the 'Add Metric' button is displayed
    expect(screen.getByPlaceholderText('Select Team')).toBeInTheDocument(); // Verify that filter controls are displayed
  });

  it('should display loading state initially', () => { // Test that loading state is displayed while data is being fetched
    mockUseMetrics.mockReturnValue({ // Mock useMetrics hook to return loading state
      metrics: { data: null },
      isLoading: true,
      refetch: vi.fn(),
    });
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    expect(screen.getByRole('status')).toBeInTheDocument(); // Verify that loading spinner or indicator is displayed
    expect(screen.queryByText('Revenue')).not.toBeInTheDocument(); // Verify that metrics are not yet displayed
  });

  it('should display metrics when data is loaded', async () => { // Test that metrics are displayed after data is loaded
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    await waitForLoadingToFinish(); // Wait for loading to finish
    expect(screen.getByText('Revenue')).toBeInTheDocument(); // Verify that metrics are displayed
    expect(screen.getByText('$1,200,000.00')).toBeInTheDocument(); // Verify that each metric card contains expected information (name, value, trend)
    expect(screen.getByText('+9.1%')).toBeInTheDocument(); // Verify that each metric card contains expected information (name, value, trend)
  });

  it('should display empty state when no metrics are available', async () => { // Test that empty state is displayed when no metrics are available
    mockUseMetrics.mockReturnValue({ // Mock useMetrics hook to return empty metrics array
      metrics: { data: [] },
      isLoading: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    await waitForLoadingToFinish(); // Wait for loading to finish
    expect(screen.getByText('No metrics available. Please add some metrics to get started.')).toBeInTheDocument(); // Verify that empty state message is displayed
    expect(screen.getByText('Add Metric')).toBeInTheDocument(); // Verify that 'Add Metric' button is still available
  });

  it('should filter metrics based on search input', async () => { // Test that metrics are filtered when search input is used
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    await waitForLoadingToFinish(); // Wait for loading to finish
    const searchInput = screen.getByPlaceholderText('Search'); // Find the search input
    await userEvent.type(searchInput, 'Revenue'); // Type a search term that matches some metrics
    expect(screen.getByText('Revenue')).toBeInTheDocument(); // Verify that only matching metrics are displayed
    expect(screen.queryByText('Customer Acquisition Cost')).not.toBeInTheDocument(); // Verify that only matching metrics are displayed
    fireEvent.change(searchInput, { target: { value: '' } }); // Clear the search input
    await waitFor(() => { // Verify that all metrics are displayed again
      expect(screen.getByText('Customer Acquisition Cost')).toBeInTheDocument(); // Verify that all metrics are displayed again
    });
  });

  it('should filter metrics by team', async () => { // Test that metrics are filtered when team filter is applied
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    await waitForLoadingToFinish(); // Wait for loading to finish
    const teamDropdown = screen.getByPlaceholderText('Select Team'); // Find the team dropdown
    await userEvent.click(teamDropdown); // Select a specific team
    const teamOption = screen.getByText('Sales'); // Select a specific team
    await userEvent.click(teamOption); // Select a specific team
    expect(screen.getByText('Revenue')).toBeInTheDocument(); // Verify that only metrics for that team are displayed
    expect(screen.queryByText('Customer Acquisition Cost')).not.toBeInTheDocument(); // Verify that only metrics for that team are displayed
  });

  it('should filter metrics by type', async () => { // Test that metrics are filtered when type filter is applied
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    await waitForLoadingToFinish(); // Wait for loading to finish
    const typeDropdown = screen.getByPlaceholderText('Select Type'); // Find the metric type dropdown
    await userEvent.click(typeDropdown); // Select a specific metric type
    const typeOption = screen.getByText('currency'); // Select a specific metric type
    await userEvent.click(typeOption); // Select a specific metric type
    expect(screen.getByText('Revenue')).toBeInTheDocument(); // Verify that only metrics of that type are displayed
    expect(screen.queryByText('Customer Acquisition Cost')).not.toBeInTheDocument(); // Verify that only metrics of that type are displayed
  });

  it('should change view options', async () => { // Test that view options can be changed
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    await waitForLoadingToFinish(); // Wait for loading to finish
    const timeRangeDropdown = screen.getByPlaceholderText('Select Time Range'); // Find the time range dropdown
    await userEvent.click(timeRangeDropdown); // Select a different time range
    const timeRangeOption = screen.getByText('Last Quarter'); // Select a different time range
    await userEvent.click(timeRangeOption); // Select a different time range
    await waitFor(() => expect(mockUseMetrics().refetch).toHaveBeenCalled()); // Verify that the time range has been updated
    const comparisonTypeDropdown = screen.getByPlaceholderText('Select Comparison'); // Find the comparison type dropdown
    await userEvent.click(comparisonTypeDropdown); // Select a different comparison type
    const comparisonTypeOption = screen.getByText('Month to Month'); // Select a different comparison type
    await userEvent.click(comparisonTypeOption); // Select a different comparison type
    await waitFor(() => expect(mockUseMetrics().refetch).toHaveBeenCalled()); // Verify that the comparison type has been updated
    const viewTypeDropdown = screen.getByPlaceholderText('Select View'); // Find the view type dropdown
    await userEvent.click(viewTypeDropdown); // Select category view
    const viewTypeOption = screen.getByText('Category View'); // Select category view
    await userEvent.click(viewTypeOption); // Select category view
    expect(screen.getByText('Sales')).toBeInTheDocument(); // Verify that metrics are grouped by category
  });

  it('should navigate to metric detail page when metric is clicked', async () => { // Test that clicking a metric navigates to its detail page
    const routes = [{ path: ROUTES.METRICS.DETAIL, element: <div>Metric Detail</div> }]; // Render the MetricsDashboardPage component with router
    renderWithRouter(<MetricsDashboardPage />, routes); // Render the MetricsDashboardPage component with router
    await waitForLoadingToFinish(); // Wait for loading to finish
    const metricCard = screen.getByText('Revenue'); // Find a metric card
    await userEvent.click(metricCard); // Click on the metric card
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.METRICS.DETAIL.replace(':id', '1')); // Verify that navigation to metric detail page was triggered with correct metric ID
  });

  it('should navigate to new metric page when add metric button is clicked', async () => { // Test that clicking the add metric button navigates to the new metric page
    renderWithRouter(<MetricsDashboardPage />, [{ path: ROUTES.METRICS.NEW, element: <div>New Metric</div> }]); // Render the MetricsDashboardPage component with router
    await waitForLoadingToFinish(); // Wait for loading to finish
    const addMetricButton = screen.getByText('Add Metric'); // Find the add metric button
    await userEvent.click(addMetricButton); // Click the add metric button
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.METRICS.NEW); // Verify that navigation to new metric page was triggered
  });

  it('should handle metric edit action', async () => { // Test that edit action on a metric works correctly
    renderWithRouter(<MetricsDashboardPage />, [{ path: ROUTES.METRICS.DETAIL, element: <div>Metric Edit</div> }]); // Render the MetricsDashboardPage component with router
    await waitForLoadingToFinish(); // Wait for loading to finish
    const metricCard = screen.getByText('Revenue'); // Find a metric card
    const editButton = within(metricCard).getByText('Edit'); // Find and click the edit button on the metric card
    await userEvent.click(editButton); // Find and click the edit button on the metric card
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.METRICS.DETAIL.replace(':id', '1')); // Verify that navigation to metric edit page was triggered with correct metric ID
  });

  it('should handle metric export action', async () => { // Test that export action on a metric works correctly
    const exportMetrics = vi.fn(); // Mock the exportMetrics function
    mockUseMetrics.mockReturnValue({ // Mock the exportMetrics function
      metrics: { data: mockMetrics },
      isLoading: false,
      refetch: vi.fn(),
      exportMetrics: exportMetrics
    });
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    await waitForLoadingToFinish(); // Wait for loading to finish
    const metricCard = screen.getByText('Revenue'); // Find a metric card
    const exportButton = within(metricCard).getByText('Export'); // Find and click the export button on the metric card
    await userEvent.click(exportButton); // Find and click the export button on the metric card
    expect(exportMetrics).toHaveBeenCalledWith(mockMetric); // Verify that exportMetrics function was called with correct parameters
  });

  it('should handle errors when loading metrics', async () => { // Test that errors are handled gracefully when loading metrics
    mockUseMetrics.mockReturnValue({ // Mock useMetrics hook to throw an error
      metrics: { data: null },
      isLoading: false,
      error: new Error('Failed to load metrics'),
      refetch: vi.fn(),
    });
    renderWithProviders(<MetricsDashboardPage />); // Render the MetricsDashboardPage component
    expect(screen.getByText('Failed to load metrics')).toBeInTheDocument(); // Verify that error state is displayed
    expect(screen.getByText('Retry')).toBeInTheDocument(); // Verify that retry option is available
  });
});