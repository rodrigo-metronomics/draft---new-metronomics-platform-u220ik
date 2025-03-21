/**
 * Constants for metric types, units, comparison methods, calculation methods, and thresholds
 * 
 * This file provides centralized definitions for metric-related constants used throughout
 * the Metronomics Platform for consistent metric handling, validation, and display.
 */

/**
 * Available metric data types for proper formatting and validation
 */
export const METRIC_TYPES = {
  NUMBER: 'number',
  PERCENTAGE: 'percentage',
  CURRENCY: 'currency',
  BOOLEAN: 'boolean'
} as const;

/**
 * Available comparison types for metric trend analysis
 */
export const COMPARISON_TYPES = {
  YEAR_TO_DATE: 'ytd',
  MONTH_TO_MONTH: 'mom',
  YEAR_TO_YEAR: 'yoy',
  CUSTOM: 'custom'
} as const;

/**
 * Available calculation methods for derived metrics
 */
export const CALCULATION_METHODS = {
  MANUAL: 'manual',
  SUM: 'sum',
  AVERAGE: 'average',
  FORMULA: 'formula'
} as const;

/**
 * Available threshold types for metric alerts and visualization
 */
export const THRESHOLD_TYPES = {
  TARGET: 'target',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

/**
 * Available units for metrics to ensure consistent formatting
 */
export const METRIC_UNITS = {
  CURRENCY_USD: 'USD',
  CURRENCY_EUR: 'EUR',
  CURRENCY_GBP: 'GBP',
  PERCENTAGE: '%',
  COUNT: 'count',
  HOURS: 'hours',
  DAYS: 'days',
  CUSTOM: 'custom'
} as const;

/**
 * Display formats for different metric types
 */
export const METRIC_DISPLAY_FORMATS = {
  NUMBER: {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  },
  PERCENTAGE: {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    style: 'percent',
    multiplier: 0.01 // Convert from percentage to decimal for formatting
  },
  CURRENCY: {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currencyDisplay: 'symbol'
  },
  BOOLEAN: {
    true: 'Yes',
    false: 'No'
  }
} as const;

/**
 * Trend indicators for metric value changes
 */
export const TREND_INDICATORS = {
  UP: 'up',
  DOWN: 'down',
  FLAT: 'flat'
} as const;

/**
 * Default threshold configurations for new metrics
 */
export const DEFAULT_THRESHOLDS = {
  TARGET: {
    value: 100,
    color: '#4caf50' // Green
  },
  WARNING: {
    value: 80,
    color: '#ff9800' // Orange/Amber
  },
  CRITICAL: {
    value: 60,
    color: '#f44336' // Red
  }
} as const;

/**
 * Default time periods (in days) for different comparison types
 */
export const DEFAULT_COMPARISON_PERIODS = {
  YEAR_TO_DATE: 365,
  MONTH_TO_MONTH: 30,
  YEAR_TO_YEAR: 365
} as const;

/**
 * Minimum and maximum values for different metric types for validation
 */
export const METRIC_VALUE_LIMITS = {
  MIN_VALUE: -1000000000, // Negative 1 billion
  MAX_VALUE: 1000000000,  // Positive 1 billion
  MIN_PERCENTAGE: 0,      // 0%
  MAX_PERCENTAGE: 100     // 100%
} as const;