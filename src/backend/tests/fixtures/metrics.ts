import { 
  Metric, MetricValue, MetricThreshold, 
  MetricType, ComparisonType, CalculationMethod, ThresholdType 
} from '../../src/types/metric.types';
import { METRIC_UNITS, METRIC_DEFAULT_COLORS } from '../../src/utils/constants/metricTypes';

/**
 * Helper function to generate a mock metric with customizable properties
 */
export function generateMockMetric(overrides?: Partial<Metric>): Metric {
  const defaultMetric = {
    id: 'metric-' + Math.random().toString(36).substring(2, 9),
    name: 'Sample Metric',
    description: 'A sample metric for testing purposes',
    type: MetricType.NUMBER,
    unit: METRIC_UNITS.COUNT,
    comparisonType: ComparisonType.YEAR_TO_DATE,
    calculationMethod: CalculationMethod.MANUAL,
    formula: null,
    organizationId: 'org-default',
    teamId: null,
  } as Metric;

  return { ...defaultMetric, ...overrides };
}

/**
 * Helper function to generate a mock metric value with customizable properties
 */
export function generateMockMetricValue(overrides?: Partial<MetricValue>): MetricValue {
  const defaultValue = {
    id: 'value-' + Math.random().toString(36).substring(2, 9),
    value: 100,
    timestamp: new Date(),
    metricId: 'metric-default',
    userId: 'user-default',
  } as MetricValue;

  return { ...defaultValue, ...overrides };
}

/**
 * Helper function to generate a mock metric threshold with customizable properties
 */
export function generateMockMetricThreshold(overrides?: Partial<MetricThreshold>): MetricThreshold {
  const defaultThreshold = {
    id: 'threshold-' + Math.random().toString(36).substring(2, 9),
    type: ThresholdType.TARGET,
    value: 100,
    color: METRIC_DEFAULT_COLORS.TARGET,
    metricId: 'metric-default',
  } as MetricThreshold;

  return { ...defaultThreshold, ...overrides };
}

/**
 * A mock revenue metric for financial testing
 */
export const mockRevenueMetric: Metric = generateMockMetric({
  id: 'metric-revenue',
  name: 'Revenue',
  description: 'Total revenue in USD',
  type: MetricType.CURRENCY,
  unit: METRIC_UNITS.CURRENCY_USD,
  comparisonType: ComparisonType.YEAR_TO_DATE,
  calculationMethod: CalculationMethod.MANUAL,
  organizationId: 'org-acme',
});

/**
 * A mock customer satisfaction metric (percentage-based)
 */
export const mockCustomerSatisfactionMetric: Metric = generateMockMetric({
  id: 'metric-csat',
  name: 'Customer Satisfaction',
  description: 'Customer satisfaction score based on surveys',
  type: MetricType.PERCENTAGE,
  unit: METRIC_UNITS.PERCENTAGE,
  comparisonType: ComparisonType.MONTH_TO_MONTH,
  calculationMethod: CalculationMethod.AVERAGE,
  organizationId: 'org-acme',
});

/**
 * A mock new customers metric (count-based)
 */
export const mockNewCustomersMetric: Metric = generateMockMetric({
  id: 'metric-new-customers',
  name: 'New Customers',
  description: 'Number of new customers acquired',
  type: MetricType.NUMBER,
  unit: METRIC_UNITS.COUNT,
  comparisonType: ComparisonType.MONTH_TO_MONTH,
  calculationMethod: CalculationMethod.SUM,
  organizationId: 'org-acme',
});

/**
 * A mock team-specific metric
 */
export const mockTeamMetric: Metric = generateMockMetric({
  id: 'metric-team',
  name: 'Team Productivity',
  description: 'Productivity index for the marketing team',
  type: MetricType.NUMBER,
  unit: METRIC_UNITS.COUNT,
  comparisonType: ComparisonType.MONTH_TO_MONTH,
  calculationMethod: CalculationMethod.MANUAL,
  organizationId: 'org-acme',
  teamId: 'team-marketing',
});

/**
 * A mock metric using formula calculation
 */
export const mockFormulaMetric: Metric = generateMockMetric({
  id: 'metric-formula',
  name: 'Customer Acquisition Cost',
  description: 'Average cost of acquiring a new customer',
  type: MetricType.CURRENCY,
  unit: METRIC_UNITS.CURRENCY_USD,
  comparisonType: ComparisonType.YEAR_TO_YEAR,
  calculationMethod: CalculationMethod.FORMULA,
  formula: '{{marketing-spend}} / {{new-customers}}',
  organizationId: 'org-acme',
});

/**
 * A mock metric with thresholds for testing threshold functionality
 */
export const mockMetricWithThresholds: Metric = generateMockMetric({
  id: 'metric-with-thresholds',
  name: 'Sales Growth',
  description: 'Year-over-year sales growth percentage',
  type: MetricType.PERCENTAGE,
  unit: METRIC_UNITS.PERCENTAGE,
  comparisonType: ComparisonType.YEAR_TO_YEAR,
  calculationMethod: CalculationMethod.MANUAL,
  organizationId: 'org-acme',
});

/**
 * Mock metric values for testing historical data and trends
 */
export const mockMetricValues: MetricValue[] = [
  // Revenue values
  generateMockMetricValue({
    id: 'value-revenue-1',
    metricId: 'metric-revenue',
    value: 1200000,
    timestamp: new Date(2023, 0, 15), // Jan 15, 2023
    userId: 'user-1',
  }),
  generateMockMetricValue({
    id: 'value-revenue-2',
    metricId: 'metric-revenue',
    value: 1250000,
    timestamp: new Date(2023, 1, 15), // Feb 15, 2023
    userId: 'user-1',
  }),
  generateMockMetricValue({
    id: 'value-revenue-3',
    metricId: 'metric-revenue',
    value: 1300000,
    timestamp: new Date(2023, 2, 15), // Mar 15, 2023
    userId: 'user-1',
  }),
  
  // Customer satisfaction values
  generateMockMetricValue({
    id: 'value-csat-1',
    metricId: 'metric-csat',
    value: 85,
    timestamp: new Date(2023, 0, 31), // Jan 31, 2023
    userId: 'user-2',
  }),
  generateMockMetricValue({
    id: 'value-csat-2',
    metricId: 'metric-csat',
    value: 87,
    timestamp: new Date(2023, 1, 28), // Feb 28, 2023
    userId: 'user-2',
  }),
  generateMockMetricValue({
    id: 'value-csat-3',
    metricId: 'metric-csat',
    value: 86,
    timestamp: new Date(2023, 2, 31), // Mar 31, 2023
    userId: 'user-2',
  }),
  
  // New customers values
  generateMockMetricValue({
    id: 'value-new-customers-1',
    metricId: 'metric-new-customers',
    value: 45,
    timestamp: new Date(2023, 0, 31), // Jan 31, 2023
    userId: 'user-3',
  }),
  generateMockMetricValue({
    id: 'value-new-customers-2',
    metricId: 'metric-new-customers',
    value: 52,
    timestamp: new Date(2023, 1, 28), // Feb 28, 2023
    userId: 'user-3',
  }),
  generateMockMetricValue({
    id: 'value-new-customers-3',
    metricId: 'metric-new-customers',
    value: 48,
    timestamp: new Date(2023, 2, 31), // Mar 31, 2023
    userId: 'user-3',
  }),
];

/**
 * Mock metric thresholds for testing threshold visualization and alerts
 */
export const mockMetricThresholds: MetricThreshold[] = [
  // Revenue thresholds
  generateMockMetricThreshold({
    id: 'threshold-revenue-target',
    metricId: 'metric-revenue',
    type: ThresholdType.TARGET,
    value: 1500000,
    color: METRIC_DEFAULT_COLORS.TARGET,
  }),
  generateMockMetricThreshold({
    id: 'threshold-revenue-warning',
    metricId: 'metric-revenue',
    type: ThresholdType.WARNING,
    value: 1200000,
    color: METRIC_DEFAULT_COLORS.WARNING,
  }),
  generateMockMetricThreshold({
    id: 'threshold-revenue-critical',
    metricId: 'metric-revenue',
    type: ThresholdType.CRITICAL,
    value: 1000000,
    color: METRIC_DEFAULT_COLORS.CRITICAL,
  }),
  
  // Customer satisfaction thresholds
  generateMockMetricThreshold({
    id: 'threshold-csat-target',
    metricId: 'metric-csat',
    type: ThresholdType.TARGET,
    value: 90,
    color: METRIC_DEFAULT_COLORS.TARGET,
  }),
  generateMockMetricThreshold({
    id: 'threshold-csat-warning',
    metricId: 'metric-csat',
    type: ThresholdType.WARNING,
    value: 85,
    color: METRIC_DEFAULT_COLORS.WARNING,
  }),
  generateMockMetricThreshold({
    id: 'threshold-csat-critical',
    metricId: 'metric-csat',
    type: ThresholdType.CRITICAL,
    value: 80,
    color: METRIC_DEFAULT_COLORS.CRITICAL,
  }),
  
  // Sales growth thresholds (for mockMetricWithThresholds)
  generateMockMetricThreshold({
    id: 'threshold-sales-target',
    metricId: 'metric-with-thresholds',
    type: ThresholdType.TARGET,
    value: 15,
    color: METRIC_DEFAULT_COLORS.TARGET,
  }),
  generateMockMetricThreshold({
    id: 'threshold-sales-warning',
    metricId: 'metric-with-thresholds',
    type: ThresholdType.WARNING,
    value: 10,
    color: METRIC_DEFAULT_COLORS.WARNING,
  }),
  generateMockMetricThreshold({
    id: 'threshold-sales-critical',
    metricId: 'metric-with-thresholds',
    type: ThresholdType.CRITICAL,
    value: 5,
    color: METRIC_DEFAULT_COLORS.CRITICAL,
  }),
];

/**
 * Collection of all mock metrics for testing lists, filtering, and dashboard functionality
 */
export const mockMetrics: Metric[] = [
  mockRevenueMetric,
  mockCustomerSatisfactionMetric,
  mockNewCustomersMetric,
  mockTeamMetric,
  mockFormulaMetric,
  mockMetricWithThresholds,
];