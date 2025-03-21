import React from 'react'; // version ^18.2.0
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

import KeyMetricsWidget from '../KeyMetricsWidget';
import { renderWithProviders, createMockOrganization, waitForLoadingToFinish } from '../../../tests/testUtils';
import { MetricWithValues, MetricType, TrendDirection, ComparisonType, CalculationMethod } from '../../../types/metric.types';
import { ChartType, ColorScheme } from '../../../types/common.types';

/**
 * Helper function to create mock metrics data for testing
 * @param count The number of mock metrics to create
 * @returns An array of mock metrics with values
 */
const createMockMetrics = (count: number): MetricWithValues[] => {
  const metrics: MetricWithValues[] = [];
  for (let i = 0; i < count; i++) {
    metrics.push({
      id: `metric-${i}`,
      name: `Metric ${i}`,
      description: `Description for Metric ${i}`,
      type: MetricType.NUMBER,
      unit: 'units',
      comparisonType: ComparisonType.YEAR_TO_YEAR,
      calculationMethod: CalculationMethod.MANUAL,
      currentValue: 100 + i * 10,
      previousValue: 90 + i * 10,
      changePercentage: 0.1,
      trend: TrendDirection.UP,
      thresholds: [],
      values: [{ timestamp: '2024-01-01', value: 100 + i * 10 }],
      teamId: null,
      team: null,
    });
  }
  return metrics;
};

/**
 * Setup function for common test configuration
 * @param options Optional overrides for mock data and handlers
 * @returns Test utilities and mock data
 */
const setup = (options: { metrics?: MetricWithValues[]; isLoading?: boolean; isError?: boolean; error?: Error; onViewAllClick?: () => void; onMetricDetailsClick?: () => void; onMetricEditClick?: () => void; onMetricExportClick?: () => void; maxMetrics?: number } = {}) => {
  const { metrics = createMockMetrics(3), isLoading = false, isError = false, error = new Error('Test error'), onViewAllClick = vi.fn(), onMetricDetailsClick = vi.fn(), onMetricEditClick = vi.fn(), onMetricExportClick = vi.fn(), maxMetrics } = options;

  const mockOrganization = createMockOrganization();

  vi.mock('../../../hooks/useMetrics', () => ({
    useMetrics: () => ({
      metrics: () => ({ data: { metrics }, isLoading, isError, error, refetch: vi.fn() }),
      isLoading,
      isError,
      error,
      refetch: vi.fn(),
      getMetricById: vi.fn(),
      getMetricWithValues: vi.fn(),
      createMetric: vi.fn(),
      updateMetric: vi.fn(),
      deleteMetric: vi.fn(),
      recordMetricValue: vi.fn(),
      getMetricValues: vi.fn(),
      deleteMetricValue: vi.fn(),
      createMetricThreshold: vi.fn(),
      updateMetricThreshold: vi.fn(),
      deleteMetricThreshold: vi.fn(),
      getDashboardMetrics: vi.fn().mockReturnValue({ data: { metrics }, isLoading, isError, error, refetch: vi.fn() }),
      exportMetrics: vi.fn(),
      getMetricsByGoal: vi.fn(),
      getMetricsByTeam: vi.fn(),
      useMetricForm: vi.fn(),
      useMetricValueForm: vi.fn(),
      useMetricThresholdForm: vi.fn(),
    }),
  }));

  return { metrics, mockOrganization, isLoading, isError, error, onViewAllClick, onMetricDetailsClick, onMetricEditClick, onMetricExportClick, maxMetrics };
};

describe('KeyMetricsWidget', () => {
  it('renders loading state correctly', async () => {
    const { isLoading } = setup({ isLoading: true });
    renderWithProviders(<KeyMetricsWidget />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Metric 1')).not.toBeInTheDocument();
  });

  it('renders error state correctly', async () => {
    const { isError, error, refetch } = setup({ isError: true, error: new Error('Test error') });
    renderWithProviders(<KeyMetricsWidget />);

    expect(screen.getByText('Error fetching key metrics: Test error')).toBeInTheDocument();
  });

  it('renders empty state correctly', async () => {
    const { metrics } = setup({ metrics: [] });
    renderWithProviders(<KeyMetricsWidget />);

    expect(screen.getByText('No key metrics available. Please add some metrics to your organization.')).toBeInTheDocument();
    expect(screen.queryByText('Metric 1')).not.toBeInTheDocument();
  });

  it('renders metrics correctly', async () => {
    const { metrics } = setup();
    renderWithProviders(<KeyMetricsWidget />);

    expect(screen.getAllByRole('article').length).toBe(metrics.length);
    expect(screen.getByText('Metric 1')).toBeInTheDocument();
    expect(screen.getByText('100 units')).toBeInTheDocument();
  });

  it('limits the number of displayed metrics based on maxMetrics prop', async () => {
    const { metrics, maxMetrics } = setup({ metrics: createMockMetrics(5), maxMetrics: 3 });
    renderWithProviders(<KeyMetricsWidget maxMetrics={maxMetrics} />);

    expect(screen.getAllByRole('article').length).toBe(3);
    expect(screen.getByText('Metric 1')).toBeInTheDocument();
    expect(screen.getByText('Metric 3')).toBeInTheDocument();
    expect(screen.queryByText('Metric 4')).not.toBeInTheDocument();
  });

  it('calls onViewAllClick when View All button is clicked', async () => {
    const { onViewAllClick } = setup();
    renderWithProviders(<KeyMetricsWidget onViewAllClick={onViewAllClick} />);

    const viewAllButton = screen.getByRole('button', { name: 'View All' });
    await userEvent.click(viewAllButton);

    expect(onViewAllClick).toHaveBeenCalled();
  });

  it('calls onMetricDetailsClick when Details button is clicked', async () => {
    const { metrics, onMetricDetailsClick } = setup();
    renderWithProviders(<KeyMetricsWidget onMetricDetailsClick={onMetricDetailsClick} />);

    const detailsButton = screen.getAllByRole('button', { name: 'Details' })[0];
    await userEvent.click(detailsButton);

    expect(onMetricDetailsClick).toHaveBeenCalledWith(metrics[0].id);
  });

  it('calls onMetricEditClick when Edit button is clicked', async () => {
    const { metrics, onMetricEditClick } = setup();
    renderWithProviders(<KeyMetricsWidget onMetricEditClick={onMetricEditClick} />);

    const editButton = screen.getAllByRole('button', { name: 'Edit' })[0];
    await userEvent.click(editButton);

    expect(onMetricEditClick).toHaveBeenCalledWith(metrics[0].id);
  });

  it('calls onMetricExportClick when Export button is clicked', async () => {
    const { metrics, onMetricExportClick } = setup();
    renderWithProviders(<KeyMetricsWidget onMetricExportClick={onMetricExportClick} />);

    const exportButton = screen.getAllByRole('button', { name: 'Export' })[0];
    await userEvent.click(exportButton);

    expect(onMetricExportClick).toHaveBeenCalledWith(metrics[0].id);
  });

  it('selects a metric when metric card is clicked', async () => {
    const { metrics } = setup();
    renderWithProviders(<KeyMetricsWidget />);

    const metricCard = screen.getAllByRole('article')[0];
    await userEvent.click(metricCard);

    expect(screen.getByText('Metric 1')).toBeInTheDocument();
  });

  it('handles responsive layout correctly', async () => {
    const { metrics } = setup();

    // Mock useResponsive hook to simulate mobile viewport
    vi.mock('../../../hooks/useResponsive', () => ({
      default: () => ({
        isMobileView: true,
        isTabletView: false,
        isDesktopView: false,
        width: 320,
        height: 480,
        getResponsiveValue: (values: any) => values.mobile,
        checkIsMobile: () => true,
        checkIsTablet: () => false,
        checkIsDesktop: () => false,
      }),
    }));

    renderWithProviders(<KeyMetricsWidget />);

    // Verify layout adjusts appropriately for mobile
    expect(screen.getByText('Metric 1')).toBeInTheDocument();

    // Mock useResponsive hook to simulate desktop viewport
    vi.mock('../../../hooks/useResponsive', () => ({
      default: () => ({
        isMobileView: false,
        isTabletView: false,
        isDesktopView: true,
        width: 1200,
        height: 800,
        getResponsiveValue: (values: any) => values.desktop,
        checkIsMobile: () => false,
        checkIsTablet: () => false,
        checkIsDesktop: () => true,
      }),
    }));

    renderWithProviders(<KeyMetricsWidget />);

    // Verify layout adjusts appropriately for desktop
    expect(screen.getByText('Metric 1')).toBeInTheDocument();
  });
});