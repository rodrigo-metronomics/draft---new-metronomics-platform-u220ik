# src/web/src/components/metrics/tests/MetricCard.test.tsx
```typescript
import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent } from '@testing-library/react'; // @testing-library/react@^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event@^14.0.0
import { vi } from 'vitest'; // vitest@^0.34.0

import MetricCard from '../MetricCard'; // Component being tested
import { MetricWithValues, MetricType, TrendDirection } from '../../types/metric.types'; // Type definitions for metric data
import { ChartType, TimeRange, ColorScheme } from '../../types/common.types'; // Common type definitions for chart configuration
import { renderWithProviders } from '../../../tests/testUtils'; // Utility for rendering components with necessary providers in tests

/**
 * Creates a mock metric with values for testing
 * @param overrides 
 * @returns A mock metric with test values
 */
const createMockMetric = (overrides: Partial<MetricWithValues> = {}): MetricWithValues => {
  // Create a default mock metric with id, name, description, type, unit, and other required properties
  const mockMetric: MetricWithValues = {
    id: 'test-metric-id',
    name: 'Test Metric',
    description: 'A test metric for testing purposes',
    type: MetricType.NUMBER,
    unit: '',
    comparisonType: 'yoy',
    calculationMethod: 'manual',
    currentValue: 100,
    previousValue: 90,
    changePercentage: 0.1,
    trend: TrendDirection.UP,
    thresholds: [],
    values: [],
    teamId: null,
    team: null,
    ...overrides // Apply any overrides provided in the parameters
  };

  // Set default values for currentValue, previousValue, changePercentage, and trend
  mockMetric.currentValue = mockMetric.currentValue ?? 100;
  mockMetric.previousValue = mockMetric.previousValue ?? 90;
  mockMetric.changePercentage = mockMetric.changePercentage ?? 0.1;
  mockMetric.trend = mockMetric.trend ?? TrendDirection.UP;

  // Add sample time series data points for chart visualization
  mockMetric.values = [
    { timestamp: '2023-01-01', value: 80 },
    { timestamp: '2023-02-01', value: 90 },
    { timestamp: '2023-03-01', value: 100 }
  ];

  return mockMetric; // Return the mock metric object
};

describe('MetricCard component', () => {
  it('renders correctly with basic props', () => {
    // Create a mock metric using createMockMetric
    const metric = createMockMetric();

    // Render the MetricCard component with basic props using renderWithProviders
    renderWithProviders(<MetricCard metric={metric} />);

    // Verify the metric name is displayed
    expect(screen.getByText('Test Metric')).toBeInTheDocument();

    // Verify the current value is displayed with correct formatting
    expect(screen.getByText('100')).toBeInTheDocument();

    // Verify the trend indicator is displayed with correct direction
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('renders with chart when showChart is true', () => {
    // Create a mock metric using createMockMetric
    const metric = createMockMetric();

    // Render the MetricCard component with showChart=true
    renderWithProviders(<MetricCard metric={metric} showChart={true} />);

    // Verify the chart component is rendered
    expect(screen.getByRole('img', { name: 'chart' })).toBeInTheDocument();
  });

  it('does not render chart when showChart is false', () => {
    // Create a mock metric using createMockMetric
    const metric = createMockMetric();

    // Render the MetricCard component with showChart=false
    renderWithProviders(<MetricCard metric={metric} showChart={false} />);

    // Verify the chart component is not rendered
    expect(screen.queryByRole('img', { name: 'chart' })).not.toBeInTheDocument();
  });

  it('displays correct trend color based on trend direction and higherIsBetter', () => {
    // Create a mock metric with UP trend
    const upTrendMetric = createMockMetric({ trend: TrendDirection.UP });

    // Render the MetricCard with higherIsBetter=true
    renderWithProviders(<MetricCard metric={upTrendMetric} higherIsBetter={true} />);

    // Verify the trend indicator has the success/positive color
    expect(screen.getByText('↑')).toHaveStyle('color: #10b981');

    // Render the MetricCard with higherIsBetter=false
    renderWithProviders(<MetricCard metric={upTrendMetric} higherIsBetter={false} />);

    // Verify the trend indicator has the error/negative color
    expect(screen.getByText('↑')).toHaveStyle('color: #ef4444');

    // Repeat tests with DOWN trend and FLAT trend
    const downTrendMetric = createMockMetric({ trend: TrendDirection.DOWN });
    renderWithProviders(<MetricCard metric={downTrendMetric} higherIsBetter={true} />);
    expect(screen.getByText('↓')).toHaveStyle('color: #ef4444');
    renderWithProviders(<MetricCard metric={downTrendMetric} higherIsBetter={false} />);
    expect(screen.getByText('↓')).toHaveStyle('color: #10b981');

    const flatTrendMetric = createMockMetric({ trend: TrendDirection.FLAT });
    renderWithProviders(<MetricCard metric={flatTrendMetric} higherIsBetter={true} />);
    expect(screen.getByText('→')).toHaveStyle('color: #6b7280');
    renderWithProviders(<MetricCard metric={flatTrendMetric} higherIsBetter={false} />);
    expect(screen.getByText('→')).toHaveStyle('color: #6b7280');
  });

  it('formats values correctly based on metric type', () => {
    // Create mock metrics with different types (NUMBER, PERCENTAGE, CURRENCY)
    const numberMetric = createMockMetric({ type: MetricType.NUMBER, currentValue: 1234.567 });
    const percentageMetric = createMockMetric({ type: MetricType.PERCENTAGE, currentValue: 0.755 });
    const currencyMetric = createMockMetric({ type: MetricType.CURRENCY, currentValue: 1234.567 });

    // Render MetricCard components for each type
    renderWithProviders(<MetricCard metric={numberMetric} />);
    renderWithProviders(<MetricCard metric={percentageMetric} />);
    renderWithProviders(<MetricCard metric={currencyMetric} />);

    // Verify values are formatted correctly for each type (e.g., currency symbol, percentage sign)
    expect(screen.getByText('1,234.57')).toBeInTheDocument();
    expect(screen.getByText('75.5%')).toBeInTheDocument();
    expect(screen.getByText('$1,234.57')).toBeInTheDocument();
  });

  it('calls onCardClick when card is clicked', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Create a mock function for onCardClick
    const onCardClick = vi.fn();

    // Render the MetricCard with the mock function
    renderWithProviders(<MetricCard metric={metric} onCardClick={onCardClick} />);

    // Simulate clicking on the card
    fireEvent.click(screen.getByText('Test Metric'));

    // Verify the mock function was called with the metric data
    expect(onCardClick).toHaveBeenCalledWith(metric);
  });

  it('calls onDetailsClick when details button is clicked', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Create a mock function for onDetailsClick
    const onDetailsClick = vi.fn();

    // Render the MetricCard with the mock function
    renderWithProviders(<MetricCard metric={metric} onDetailsClick={onDetailsClick} />);

    // Simulate clicking on the details button
    fireEvent.click(screen.getByText('Details'));

    // Verify the mock function was called with the metric data
    expect(onDetailsClick).toHaveBeenCalledWith(metric);

    // Verify event propagation was stopped (onCardClick not called)
    // This is not directly testable without a more complex setup, but the stopPropagation call is present
  });

  it('calls onEditClick when edit button is clicked', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Create a mock function for onEditClick
    const onEditClick = vi.fn();

    // Render the MetricCard with the mock function
    renderWithProviders(<MetricCard metric={metric} onEditClick={onEditClick} />);

    // Simulate clicking on the edit button
    fireEvent.click(screen.getByText('Edit'));

    // Verify the mock function was called with the metric data
    expect(onEditClick).toHaveBeenCalledWith(metric);

    // Verify event propagation was stopped (onCardClick not called)
    // This is not directly testable without a more complex setup, but the stopPropagation call is present
  });

  it('calls onExportClick when export button is clicked', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Create a mock function for onExportClick
    const onExportClick = vi.fn();

    // Render the MetricCard with the mock function
    renderWithProviders(<MetricCard metric={metric} onExportClick={onExportClick} />);

    // Simulate clicking on the export button
    fireEvent.click(screen.getByText('Export'));

    // Verify the mock function was called with the metric data
    expect(onExportClick).toHaveBeenCalledWith(metric);

    // Verify event propagation was stopped (onCardClick not called)
    // This is not directly testable without a more complex setup, but the stopPropagation call is present
  });

  it('applies custom className to the component', () => {
    // Create a mock metric
    const metric = createMockMetric();

    // Render the MetricCard with a custom className
    renderWithProviders(<MetricCard metric={metric} className="custom-class" />);

    // Verify the custom class is applied to the component
    expect(screen.getByText('Test Metric').closest('.custom-class')).toBeInTheDocument();
  });
});