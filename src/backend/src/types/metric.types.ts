/**
 * TypeScript type definitions for metrics in the Metronomics Platform.
 * This file defines interfaces, enums, and types related to metrics, metric values,
 * thresholds, and dashboard data structures for tracking and visualizing key
 * performance indicators across the organization.
 */

import { User } from './user.types';
import { Team } from './team.types';
import { Goal } from './goal.types';

/**
 * Enum defining the available metric data types for proper formatting and validation
 */
export enum MetricType {
  NUMBER = 'NUMBER',           // Regular numeric value (e.g., count of customers)
  PERCENTAGE = 'PERCENTAGE',   // Percentage value (e.g., 85% completion rate)
  CURRENCY = 'CURRENCY',       // Monetary value (e.g., $1.2M revenue)
  BOOLEAN = 'BOOLEAN'          // True/false value (e.g., compliance status)
}

/**
 * Enum defining the available comparison types for metric trend analysis
 */
export enum ComparisonType {
  YEAR_TO_DATE = 'YEAR_TO_DATE',     // Compare current value to same period last year
  MONTH_TO_MONTH = 'MONTH_TO_MONTH', // Compare to previous month
  YEAR_TO_YEAR = 'YEAR_TO_YEAR',     // Compare to same month last year
  CUSTOM = 'CUSTOM'                  // Custom date range comparison
}

/**
 * Enum defining the available calculation methods for derived metrics
 */
export enum CalculationMethod {
  MANUAL = 'MANUAL',   // Manually entered values
  SUM = 'SUM',         // Sum of other metrics or values
  AVERAGE = 'AVERAGE', // Average of other metrics or values
  FORMULA = 'FORMULA'  // Custom formula calculation
}

/**
 * Enum defining the available threshold types for metric alerts and visualization
 */
export enum ThresholdType {
  TARGET = 'TARGET',     // Goal value to achieve
  WARNING = 'WARNING',   // Warning threshold
  CRITICAL = 'CRITICAL'  // Critical threshold
}

/**
 * Enum defining the possible trend directions for metric value changes
 */
export enum TrendDirection {
  UP = 'UP',       // Value is increasing
  DOWN = 'DOWN',   // Value is decreasing
  FLAT = 'FLAT'    // Value is stable
}

/**
 * Interface to provide common base entity fields without circular dependency
 */
export interface BaseEntityFields {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface representing a metric entity with its properties and relationships
 */
export interface Metric extends BaseEntityFields {
  name: string;                                // Display name of the metric
  description: string;                         // Detailed description
  type: MetricType;                            // Data type of the metric
  unit: string;                                // Unit of measurement (e.g., "$", "%", "units")
  comparisonType: ComparisonType;              // How to compare this metric over time
  calculationMethod: CalculationMethod;        // How the metric is calculated
  formula: string | null;                      // Formula for calculated metrics
  organizationId: string;                      // Organization this metric belongs to
  teamId: string | null;                       // Team that owns this metric (optional)
  team: Team | null;                           // Associated team (populated)
  values: MetricValue[];                       // Historical values
  thresholds: MetricThreshold[];               // Thresholds for alerts and visualization
  goals: Goal[];                               // Strategic goals associated with this metric
}

/**
 * Interface representing a recorded value for a metric
 */
export interface MetricValue {
  id: string;                                  // Unique identifier
  value: number;                               // Recorded value
  timestamp: Date;                             // When this value was recorded
  note: string | null;                         // Optional note about this value
  metricId: string;                            // Associated metric ID
  metric: Metric;                              // Parent metric (populated)
  userId: string;                              // User who recorded this value
  user: User;                                  // User who recorded this value (populated)
  createdAt: Date;                             // When this record was created
}

/**
 * Interface representing a threshold for a metric
 */
export interface MetricThreshold extends BaseEntityFields {
  type: ThresholdType;                         // Type of threshold
  value: number;                               // Threshold value
  color: string;                               // Color for visualization (hex code)
  metricId: string;                            // Associated metric ID
  metric: Metric;                              // Parent metric (populated)
}

/**
 * Lightweight interface for referencing metrics from other entities
 */
export interface MetricReference {
  id: string;                                  // Unique identifier
  name: string;                                // Display name
  type: MetricType;                            // Data type
  unit: string;                                // Unit of measurement
}

/**
 * Data transfer object for creating a new metric
 */
export interface CreateMetricDto {
  name: string;                                // Display name
  description: string;                         // Detailed description
  type: MetricType;                            // Data type
  unit: string;                                // Unit of measurement
  comparisonType: ComparisonType;              // Comparison type
  calculationMethod: CalculationMethod;        // Calculation method
  formula: string | null;                      // Formula for calculated metrics
  organizationId: string;                      // Organization ID
  teamId: string | null;                       // Team ID (optional)
  thresholds: CreateMetricThresholdDto[];      // Initial thresholds
  goalIds: string[];                           // Goals to associate with this metric
}

/**
 * Data transfer object for updating an existing metric
 */
export interface UpdateMetricDto {
  name: string;                                // Updated name
  description: string;                         // Updated description
  type: MetricType;                            // Updated type
  unit: string;                                // Updated unit
  comparisonType: ComparisonType;              // Updated comparison type
  calculationMethod: CalculationMethod;        // Updated calculation method
  formula: string | null;                      // Updated formula
  teamId: string | null;                       // Updated team ID
}

/**
 * Data transfer object for creating a new metric value
 */
export interface CreateMetricValueDto {
  value: number;                               // Value to record
  timestamp: Date;                             // When the value was measured
  metricId: string;                            // Associated metric ID
  note: string | null;                         // Optional note
}

/**
 * Data transfer object for creating a new metric threshold
 */
export interface CreateMetricThresholdDto {
  type: ThresholdType;                         // Threshold type
  value: number;                               // Threshold value
  color: string;                               // Color for visualization
}

/**
 * Data transfer object for updating an existing metric threshold
 */
export interface UpdateMetricThresholdDto {
  value: number;                               // Updated threshold value
  color: string;                               // Updated color
}

/**
 * Interface for filtering metrics by organization, team, type, goal, and time range
 */
export interface MetricFilters {
  organizationId: string;                      // Organization ID to filter by
  teamId: string | null;                       // Optional team ID filter
  type: MetricType | null;                     // Optional metric type filter
  goalId: string | null;                       // Optional associated goal filter
  startDate: Date | null;                      // Optional start date for filtering values
  endDate: Date | null;                        // Optional end date for filtering values
}

/**
 * Interface for filtering metric values by metric ID and date range
 */
export interface MetricValueFilters {
  metricId: string;                            // Metric ID to filter by
  startDate: Date | null;                      // Optional start date
  endDate: Date | null;                        // Optional end date
}

/**
 * Interface representing trend data for a metric
 */
export interface MetricTrend {
  current: number | null;                      // Current value
  previous: number | null;                     // Previous value (for comparison)
  changePercentage: number | null;             // Percentage change
  trend: TrendDirection;                       // Direction of trend
}

/**
 * Interface representing a data point in a time series for charting
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;                             // Point in time
  value: number;                               // Value at that time
}

/**
 * Interface representing a metric with its values and calculated trends for dashboard display
 */
export interface MetricWithValues {
  id: string;                                  // Metric ID
  name: string;                                // Display name
  description: string;                         // Description
  type: MetricType;                            // Data type
  unit: string;                                // Unit of measurement
  comparisonType: ComparisonType;              // Comparison type
  calculationMethod: CalculationMethod;        // Calculation method
  currentValue: number | null;                 // Most recent value
  previousValue: number | null;                // Previous value for comparison
  changePercentage: number | null;             // Percentage change
  trend: TrendDirection;                       // Direction of trend
  thresholds: MetricThreshold[];               // Thresholds for visualization
  values: TimeSeriesDataPoint[];               // Time series data for charts
  teamId: string | null;                       // Team ID for filtering
  team: Team | null;                           // Team info for display
}

/**
 * Interface representing the data structure for the metrics dashboard
 */
export interface MetricDashboardData {
  metrics: MetricWithValues[];                 // All metrics in the dashboard
  timeRange: { startDate: Date; endDate: Date }; // Selected time range
  comparisonType: ComparisonType;              // Selected comparison type
  categories: { [key: string]: MetricWithValues[] }; // Metrics grouped by category
}

/**
 * Interface representing information about a threshold crossing event
 */
export interface ThresholdCrossing {
  thresholdId: string;                         // ID of the crossed threshold
  type: ThresholdType;                         // Type of threshold
  value: number;                               // Threshold value
  crossed: boolean;                            // Whether threshold was crossed
}