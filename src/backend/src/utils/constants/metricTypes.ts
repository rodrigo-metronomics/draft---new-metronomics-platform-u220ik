/**
 * Constants for metric units used throughout the Metronomics Platform
 * These units define the standard options available when creating metrics
 */
export const METRIC_UNITS = {
  // Currency units
  CURRENCY_USD: 'USD',
  CURRENCY_EUR: 'EUR',
  CURRENCY_GBP: 'GBP',
  
  // Common measurement units
  PERCENTAGE: 'percentage',
  COUNT: 'count',
  HOURS: 'hours',
  DAYS: 'days',
  
  // For user-defined units
  CUSTOM: 'custom'
};

/**
 * Display format strings for metrics
 * These formats are used to ensure consistent presentation of metric values
 */
export const METRIC_DISPLAY_FORMATS = {
  // Currency formats
  CURRENCY_USD: '$#,##0.00',
  CURRENCY_EUR: '€#,##0.00',
  CURRENCY_GBP: '£#,##0.00',
  
  // Other formats
  PERCENTAGE: '#0.0%',
  NUMBER: '#,##0',
  BOOLEAN: 'Yes/No'
};

/**
 * Default colors for metric visualization based on threshold type
 * These colors ensure consistent visual indicators across the platform
 */
export const METRIC_DEFAULT_COLORS = {
  TARGET: '#4caf50',   // Green for targets met
  WARNING: '#ff9800',  // Amber for warning thresholds
  CRITICAL: '#f44336' // Red for critical thresholds
};

/**
 * Icons to represent metric trend directions
 * These identifiers map to icon components in the frontend
 */
export const METRIC_TREND_ICONS = {
  UP: 'trending_up',    // For positive/increasing trends
  DOWN: 'trending_down', // For negative/decreasing trends
  FLAT: 'trending_flat'  // For stable/unchanged trends
};

/**
 * Default comparison periods in days for different time comparisons
 * These values set standard time windows for metric comparisons
 */
export const DEFAULT_COMPARISON_PERIODS = {
  YEAR_TO_DATE: 365,   // Days for year-to-date comparison
  MONTH_TO_MONTH: 30,  // Days for month-to-month comparison
  YEAR_TO_YEAR: 365    // Days for year-over-year comparison
};

/**
 * System-enforced limits for metric values
 * These values are used for validation when updating metrics
 */
export const METRIC_VALUE_LIMITS = {
  MIN_VALUE: -1000000000,  // Minimum allowed numeric value
  MAX_VALUE: 1000000000,   // Maximum allowed numeric value
  MIN_PERCENTAGE: 0,       // Minimum allowed percentage value
  MAX_PERCENTAGE: 100      // Maximum allowed percentage value
};