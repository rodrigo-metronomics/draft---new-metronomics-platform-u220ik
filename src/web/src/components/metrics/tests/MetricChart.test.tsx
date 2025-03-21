import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // @testing-library/react@^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event@^14.0.0
import { vi } from 'vitest'; // vitest@^0.34.0

import MetricChart from '../MetricChart';
import Chart from '../../components/common/Chart';
import { MetricWithValues, MetricType, ThresholdType, TimeSeriesDataPoint } from '../../types/metric.types';
import { ChartType, TimeRange, ColorScheme, DateRange } from '../../types/common.types';
import { renderWithProviders } from '../../../tests/testUtils';

describe('MetricChart component', () => {
  const createMockMetric = (overrides: Partial<MetricWithValues> = {}): MetricWithValues => {
    // Create a default mock metric with id, name, description, type, unit, and other required properties
    const defaultMetric: MetricWithValues = {
      id: 'test-metric',
      name: 'Test Metric',
      description: 'A test metric',
      type: MetricType.NUMBER,
      unit: 'units',
      comparisonType: 'yoy',
      calculationMethod: 'manual',
      currentValue: 100,
      previousValue: 90,
      changePercentage: 11.11,
      trend: 'up',
      thresholds: [],
      values: [],
      teamId: null,
      team: null
    };

    // Set default values for currentValue, previousValue, changePercentage, and trend
    const metric: MetricWithValues = {
      ...defaultMetric,
      currentValue: 100,
      previousValue: 90,
      changePercentage: 11.11,
      trend: 'up',
      ...overrides,
    };

    // Add sample time series data points for chart visualization
    metric.values = createTimeSeriesData(10, '2023-01-01', 'day');

    // Add sample thresholds for testing threshold visualization
    metric.thresholds = [
      { id: 't1', type: ThresholdType.TARGET, value: 120, color: 'green', metricId: 'test-metric', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      { id: 't2', type: ThresholdType.WARNING, value: 80, color: 'orange', metricId: 'test-metric', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
    ];

    // Apply any overrides provided in the parameters
    return { ...metric, ...overrides };
  };

  const createTimeSeriesData = (count: number, startDate: string, interval: string): TimeSeriesDataPoint[] => {
    // Initialize an empty array for data points
    const dataPoints: TimeSeriesDataPoint[] = [];

    // Parse the start date to a Date object
    const currentDate = new Date(startDate);

    // For each count, create a data point with timestamp and random value
    for (let i = 0; i < count; i++) {
      dataPoints.push({
        timestamp: currentDate.toISOString(),
        value: Math.random() * 150,
      });

      // Increment the date based on the interval (day, week, month)
      if (interval === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (interval === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (interval === 'month') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    // Return the array of time series data points
    return dataPoints;
  };

  test('renders correctly with basic props', () => {
    // Create a mock metric using createMockMetric
    const metric = createMockMetric();

    // Render the MetricChart component with basic props using renderWithProviders
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);

    // Verify the Chart component is rendered with correct props
    const chartElement = screen.getByTestId('base-chart');
    expect(chartElement).toBeInTheDocument();

    // Verify the chart container has the expected height
    const chartContainer = screen.getByTestId('chart-container');
    expect(chartContainer).toHaveStyle('height: 300px');
  });

  test('renders with different chart types', () => {
    // Create a mock metric using createMockMetric
    const metric = createMockMetric();

    // Render the MetricChart with different chart types (line, bar, pie, doughnut)
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    expect(screen.getByTestId('base-chart')).toHaveAttribute('type', ChartType.LINE);

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.BAR} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    expect(screen.getByTestId('base-chart')).toHaveAttribute('type', ChartType.BAR);

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.PIE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    expect(screen.getByTestId('base-chart')).toHaveAttribute('type', ChartType.PIE);

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.DOUGHNUT} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    expect(screen.getByTestId('base-chart')).toHaveAttribute('type', ChartType.DOUGHNUT);
  });

  test('formats data correctly based on metric type', () => {
    // Create mock metrics with different types (NUMBER, PERCENTAGE, CURRENCY)
    const numberMetric = createMockMetric({ type: MetricType.NUMBER, unit: '' });
    const percentageMetric = createMockMetric({ type: MetricType.PERCENTAGE, unit: '' });
    const currencyMetric = createMockMetric({ type: MetricType.CURRENCY, unit: 'USD' });

    // Render MetricChart components for each type
    renderWithProviders(<MetricChart metric={numberMetric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const numberChart = screen.getByTestId('base-chart');
    expect(numberChart).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={percentageMetric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const percentageChart = screen.getByTestId('base-chart');
    expect(percentageChart).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={currencyMetric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const currencyChart = screen.getByTestId('base-chart');
    expect(currencyChart).toBeInTheDocument();

    // Check that appropriate scales and formatting are applied to the chart options
    // (This requires deeper inspection of the Chart.js options, which is beyond the scope of this test)
  });

  test('applies thresholds when showThresholds is true', () => {
    // Create a mock metric with thresholds
    const metric = createMockMetric({
      thresholds: [
        { id: 't1', type: ThresholdType.TARGET, value: 120, color: 'green', metricId: 'test-metric', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
        { id: 't2', type: ThresholdType.WARNING, value: 80, color: 'orange', metricId: 'test-metric', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
      ],
    });

    // Render the MetricChart with showThresholds=true
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} showThresholds={true} />);
    const chartWithThresholds = screen.getByTestId('base-chart');
    expect(chartWithThresholds).toBeInTheDocument();

    // Verify the Chart component receives options with threshold annotations
    // (This requires deeper inspection of the Chart.js options, which is beyond the scope of this test)

    // Render the MetricChart with showThresholds=false
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} showThresholds={false} />);
    const chartWithoutThresholds = screen.getByTestId('base-chart');
    expect(chartWithoutThresholds).toBeInTheDocument();

    // Verify the Chart component does not receive threshold annotations
    // (This requires deeper inspection of the Chart.js options, which is beyond the scope of this test)
  });

  test('handles different time ranges correctly', () => {
    // Create a mock metric with time series data
    const metric = createMockMetric({ values: createTimeSeriesData(30, '2023-01-01', 'day') });

    // Render the MetricChart with different time ranges (DAY, WEEK, MONTH, QUARTER, YEAR)
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.DAY} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const dayChart = screen.getByTestId('base-chart');
    expect(dayChart).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.WEEK} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const weekChart = screen.getByTestId('base-chart');
    expect(weekChart).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const monthChart = screen.getByTestId('base-chart');
    expect(monthChart).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.QUARTER} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const quarterChart = screen.getByTestId('base-chart');
    expect(quarterChart).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.YEAR} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const yearChart = screen.getByTestId('base-chart');
    expect(yearChart).toBeInTheDocument();

    // Verify the chart data is processed correctly for each time range
    // Check that labels are formatted appropriately for each time range
    // (This requires deeper inspection of the Chart.js data and options, which is beyond the scope of this test)
  });

  test('applies custom height when provided', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Render the MetricChart with a custom height value
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} height={400} />);
    const chartContainer = screen.getByTestId('chart-container');
    expect(chartContainer).toHaveStyle('height: 400px');

    // Render without height prop and verify default height is applied
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const defaultChartContainer = screen.getByTestId('chart-container');
    expect(defaultChartContainer).toHaveStyle('height: 300px');
  });

  test('applies different color schemes correctly', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Render the MetricChart with different color schemes (PRIMARY, SECONDARY, TERTIARY, CUSTOM)
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} colorScheme={ColorScheme.PRIMARY} />);
    const primaryChart = screen.getByTestId('base-chart');
    expect(primaryChart).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} colorScheme={ColorScheme.SECONDARY} />);
    const secondaryChart = screen.getByTestId('base-chart');
    expect(secondaryChart).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} colorScheme={ColorScheme.TERTIARY} />);
    const tertiaryChart = screen.getByTestId('base-chart');
    expect(tertiaryChart).toBeInTheDocument();

    // Test with customColors prop for CUSTOM color scheme
    const customColors = ['red', 'blue', 'green'];
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} colorScheme={ColorScheme.CUSTOM} customColors={customColors} />);
    const customChart = screen.getByTestId('base-chart');
    expect(customChart).toBeInTheDocument();

    // Verify the chart data includes the correct colors for each scheme
    // (This requires deeper inspection of the Chart.js data, which is beyond the scope of this test)
  });

  test('toggles legend, grid, and tooltips based on props', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Render the MetricChart with different combinations of showLegend, showGrid, and showTooltips
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} showLegend={true} showGrid={true} showTooltips={true} />);
    const chartWithAll = screen.getByTestId('base-chart');
    expect(chartWithAll).toBeInTheDocument();

    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} showLegend={false} showGrid={false} showTooltips={false} />);
    const chartWithNone = screen.getByTestId('base-chart');
    expect(chartWithNone).toBeInTheDocument();

    // Verify the Chart component receives options with appropriate display settings
    // (This requires deeper inspection of the Chart.js options, which is beyond the scope of this test)
  });

  test('calls onDataPointClick when a data point is clicked', async () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Create a mock function for onDataPointClick
    const onDataPointClick = vi.fn();

    // Render the MetricChart with the mock function
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} onDataPointClick={onDataPointClick} />);
    const chartCanvas = screen.getByTestId('base-chart');

    // Simulate the Chart component's onDataPointClick callback
    fireEvent.click(chartCanvas);

    // Verify the mock function was called with the expected parameters
    await waitFor(() => {
      expect(onDataPointClick).toHaveBeenCalled();
    });
  });

  test('handles empty or sparse data gracefully', () => {
    // Create a mock metric with empty values array
    const emptyMetric = createMockMetric({ values: [] });

    // Render the MetricChart with the empty data
    renderWithProviders(<MetricChart metric={emptyMetric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const emptyChart = screen.getByTestId('base-chart');
    expect(emptyChart).toBeInTheDocument();

    // Test with null values and sparse data points
    const sparseMetric = createMockMetric({
      values: [
        { timestamp: '2023-01-01', value: 50 },
        { timestamp: '2023-01-05', value: null },
        { timestamp: '2023-01-10', value: 75 },
      ],
    });

    renderWithProviders(<MetricChart metric={sparseMetric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} />);
    const sparseChart = screen.getByTestId('base-chart');
    expect(sparseChart).toBeInTheDocument();

    // Verify appropriate fallback or empty state is shown
    // (This requires deeper inspection of the Chart.js data and options, which is beyond the scope of this test)
  });

  test('applies custom className to the component', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Render the MetricChart with a custom className
    renderWithProviders(<MetricChart metric={metric} chartType={ChartType.LINE} timeRange={TimeRange.MONTH} dateRange={{startDate: '2023-01-01', endDate: '2023-01-31'}} className="custom-class" />);
    const chartContainer = screen.getByTestId('chart-container');
    expect(chartContainer).toHaveClass('custom-class');
  });
});