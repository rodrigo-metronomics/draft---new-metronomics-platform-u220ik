/**
 * Common TypeScript types and interfaces used throughout the Metronomics Platform frontend.
 * This module provides reusable type definitions for consistent typing across the application.
 */

/**
 * Type alias for resource identifiers, typically string or number
 */
export type ID = string | number;

/**
 * Generic type for values that can be null
 */
export type Nullable<T> = T | null;

/**
 * Generic type for values that can be undefined
 */
export type Optional<T> = T | undefined;

/**
 * Generic type for values that can be null or undefined
 */
export type NullableOptional<T> = T | null | undefined;

/**
 * Generic type for key-value pairs with string keys
 */
export type Dictionary<T> = Record<string, T>;

/**
 * Interface for date range selections used in filters and reports
 */
export interface DateRange {
  startDate: Date | string;
  endDate: Date | string;
}

/**
 * Interface for pagination parameters used in list requests
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Generic interface for paginated data results
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Type for sort direction options (ascending or descending)
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Interface for sort options with field and direction
 */
export interface SortOption {
  field: string;
  direction: SortDirection;
}

/**
 * Interface for structured error objects with field, message, and code
 */
export interface ErrorObject {
  field: string | null;
  message: string;
  code: string | null;
}

/**
 * Interface for form validation rules used with validation helpers
 */
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  match?: string;
  custom?: (value: any, values: Record<string, any>) => string | null;
}

/**
 * Type for a collection of validation rules mapped to field names
 */
export type ValidationRules = Record<string, ValidationRule>;

/**
 * Type for form validation errors mapped to field names
 */
export type FormErrors = Record<string, string | null>;

/**
 * Type for tracking which form fields have been touched
 */
export type FormTouched = Record<string, boolean>;

/**
 * Interface for dropdown/select options used in form components
 */
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Interface for simple key-value pairs used in various components
 */
export interface KeyValuePair {
  key: string;
  value: any;
}

/**
 * Type for time range options (day, week, month, quarter, year, custom)
 */
export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Type for metric comparison options (previous period, year over year, target)
 */
export type ComparisonType = 'previous' | 'yoy' | 'target';

/**
 * Type for common status values (active, inactive, pending, completed, etc.)
 */
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'archived' | 'draft';

/**
 * Type for UI color variants (primary, secondary, success, warning, danger, info)
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Type for UI component sizes (small, medium, large)
 */
export type Size = 'small' | 'medium' | 'large';

/**
 * Type for positioning options (top, right, bottom, left, center)
 */
export type Position = 'top' | 'right' | 'bottom' | 'left' | 'center';

/**
 * Interface for 2D coordinates used in positioning and KFFM editor
 */
export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Interface for dimensions used in UI components and layout
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Type for responsive design breakpoints (xs, sm, md, lg, xl)
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Type for theme modes (light, dark, system)
 */
export type ThemeMode = 'light' | 'dark' | 'system';