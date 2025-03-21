/**
 * TypeScript type definitions for metrics in the Metronomics Platform frontend.
 * This file defines interfaces, enums, and types related to metrics, metric values,
 * thresholds, and dashboard data structures for use in the React application.
 */

import { ID, DateRange, Nullable, Optional, PaginationParams } from './common.types';
import { Team, TeamSummary } from './team.types';
import { User } from './user.types';
import { GoalType, Goal } from './goal.types';
import { ApiResponse, PaginatedApiResponse } from './api.types';
import { 
  METRIC_TYPES, 
  COMPARISON_TYPES, 
  CALCULATION_METHODS, 
  THRESHOLD_TYPES, 
  TREND_INDICATORS 
} from '../utils/constants/metricTypes';
import { Chart } from 'chart.js'; // v4.3.0

/**
 * Enum defining the available metric data types for proper formatting and validation
 */
export enum MetricType {
  NUMBER = METRIC_TYPES.NUMBER,
  PERCENTAGE = METRIC_TYPES.PERCENTAGE,
  CURRENCY = METRIC_TYPES.CURRENCY,
  BOOLEAN = METRIC_TYPES.BOOLEAN
}

/**
 * Enum defining the available comparison types for metric trend analysis
 */
export enum ComparisonType {
  YEAR_TO_DATE = COMPARISON_TYPES.YEAR_TO_DATE,
  MONTH_TO_MONTH = COMPARISON_TYPES.MONTH_TO_MONTH,
  YEAR_TO_YEAR = COMPARISON_TYPES.YEAR_TO_YEAR,
  CUSTOM = COMPARISON_TYPES.CUSTOM
}

/**
 * Enum defining the available calculation methods for derived metrics
 */
export enum CalculationMethod {
  MANUAL = CALCULATION_METHODS.MANUAL,
  SUM = CALCULATION_METHODS.SUM,
  AVERAGE = CALCULATION_METHODS.AVERAGE,
  FORMULA = CALCULATION_METHODS.FORMULA
}

/**
 * Enum defining the available threshold types for metric alerts and visualization
 */
export enum ThresholdType {
  TARGET = THRESHOLD_TYPES.TARGET,
  WARNING = THRESHOLD_TYPES.WARNING,
  CRITICAL = THRESHOLD_TYPES.CRITICAL
}

/**
 * Enum defining the possible trend directions for metric value changes
 */
export enum TrendDirection {
  UP = TREND_INDICATORS.UP,
  DOWN = TREND_INDICATORS.DOWN,
  FLAT = TREND_INDICATORS.FLAT
}

/**
 * Interface representing a metric entity with its properties
 */
export interface Metric {
  id: ID;
  name: string;
  description: string;
  type: MetricType;
  unit: string;
  comparisonType: ComparisonType;
  calculationMethod: CalculationMethod;
  formula: string | null;
  organizationId: ID;
  teamId: ID | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface representing a recorded value for a metric
 */
export interface MetricValue {
  id: ID;
  value: number;
  timestamp: string;
  note: string | null;
  metricId: ID;
  userId: ID;
  createdAt: string;
}

/**
 * Interface representing a threshold for a metric
 */
export interface MetricThreshold {
  id: ID;
  type: ThresholdType;
  value: number;
  color: string;
  metricId: ID;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface extending Metric to include its related entities like values, thresholds, team, and goals
 */
export interface MetricWithRelations extends Metric {
  team: TeamSummary | null;
  values: MetricValue[];
  thresholds: MetricThreshold[];
  goals: { id: ID; name: string; type: GoalType }[];
}

/**
 * Lightweight interface for referencing metrics from other entities
 */
export interface MetricReference {
  id: ID;
  name: string;
  type: MetricType;
  unit: string;
}

/**
 * Data transfer object for creating a new metric
 */
export interface CreateMetricDto {
  name: string;
  description: string;
  type: MetricType;
  unit: string;
  comparisonType: ComparisonType;
  calculationMethod: CalculationMethod;
  formula: string | null;
  organizationId: ID;
  teamId: ID | null;
  thresholds: CreateMetricThresholdDto[];
  goalIds: ID[];
}

/**
 * Data transfer object for updating an existing metric
 */
export interface UpdateMetricDto {
  name: string;
  description: string;
  type: MetricType;
  unit: string;
  comparisonType: ComparisonType;
  calculationMethod: CalculationMethod;
  formula: string | null;
  teamId: ID | null;
  goalIds: ID[];
}

/**
 * Data transfer object for creating a new metric value
 */
export interface CreateMetricValueDto {
  value: number;
  timestamp: string;
  metricId: ID;
  note: string | null;
}

/**
 * Data transfer object for creating a new metric threshold
 */
export interface CreateMetricThresholdDto {
  type: ThresholdType;
  value: number;
  color: string;
}

/**
 * Data transfer object for updating an existing metric threshold
 */
export interface UpdateMetricThresholdDto {
  value: number;
  color: string;
}

/**
 * Interface for filtering metrics by various criteria
 */
export interface MetricFilters {
  organizationId: ID;
  teamId: ID | null;
  type: MetricType | null;
  goalId: ID | null;
  search: string | null;
  dateRange: DateRange | null;
}

/**
 * Interface for filtering metric values by metric ID and date range
 */
export interface MetricValueFilters {
  metricId: ID;
  startDate: string | null;
  endDate: string | null;
}

/**
 * Interface representing trend data for a metric
 */
export interface MetricTrend {
  current: number | null;
  previous: number | null;
  changePercentage: number | null;
  trend: TrendDirection;
}

/**
 * Interface representing a data point in a time series for charting
 */
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

/**
 * Interface representing a metric with its values and calculated trends for dashboard display
 */
export interface MetricWithValues {
  id: ID;
  name: string;
  description: string;
  type: MetricType;
  unit: string;
  comparisonType: ComparisonType;
  calculationMethod: CalculationMethod;
  currentValue: number | null;
  previousValue: number | null;
  changePercentage: number | null;
  trend: TrendDirection;
  thresholds: MetricThreshold[];
  values: TimeSeriesDataPoint[];
  teamId: ID | null;
  team: TeamSummary | null;
}

/**
 * Interface representing the data structure for the metrics dashboard
 */
export interface MetricDashboardData {
  metrics: MetricWithValues[];
  timeRange: DateRange;
  comparisonType: ComparisonType;
  categories: Record<string, MetricWithValues[]>;
}

/**
 * Interface representing information about a threshold crossing event
 */
export interface ThresholdCrossing {
  thresholdId: ID;
  type: ThresholdType;
  value: number;
  crossed: boolean;
}

/**
 * Interface for configuring metric chart display options
 */
export interface MetricChartOptions {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
  height: number;
  showLegend: boolean;
  showGrid: boolean;
  showTooltips: boolean;
  showThresholds: boolean;
  timeUnit: 'day' | 'week' | 'month' | 'quarter' | 'year';
  chartConfig: Partial<Chart.ChartConfiguration>;
}

/**
 * Parameters for paginated metric lists with filtering
 */
export interface MetricListParams extends MetricFilters, PaginationParams {}

/**
 * API response type for a single metric
 */
export interface MetricResponse extends ApiResponse<Metric> {}

/**
 * API response type for a metric with its relations
 */
export interface MetricWithRelationsResponse extends ApiResponse<MetricWithRelations> {}

/**
 * API response type for a paginated list of metrics
 */
export interface MetricListResponse extends PaginatedApiResponse<Metric> {}

/**
 * API response type for metric dashboard data
 */
export interface MetricDashboardResponse extends ApiResponse<MetricDashboardData> {}

/**
 * API response type for a single metric value
 */
export interface MetricValueResponse extends ApiResponse<MetricValue> {}

/**
 * API response type for multiple metric values
 */
export interface MetricValuesResponse extends ApiResponse<MetricValue[]> {}

/**
 * Interface for metric data export options
 */
export interface MetricExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  includeValues: boolean;
  dateRange: DateRange | null;
  filters: MetricFilters | null;
}