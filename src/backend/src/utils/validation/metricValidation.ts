import { z } from 'zod'; // zod v3.x
import { 
  MetricType, 
  ComparisonType, 
  CalculationMethod,
  ThresholdType
} from '../../types/metric.types';
import { 
  VALIDATION_ERRORS,
  METRIC_ERRORS
} from '../constants/errorMessages';
import {
  METRIC_VALUE_LIMITS,
  METRIC_UNITS
} from '../constants/metricTypes';
import ValidationError from '../errors/ValidationError';

/**
 * Validates that metric thresholds are in a valid range and properly ordered
 * 
 * @param thresholds - Array of threshold objects to validate
 * @param metricType - Type of the metric to determine validation rules
 * @returns true if valid, or error message if invalid
 */
export const validateMetricThresholds = (
  thresholds: any[],
  metricType: MetricType
): boolean | string => {
  // Check if at least one threshold exists
  if (!thresholds || thresholds.length === 0) {
    return true; // No thresholds is valid
  }

  // Extract values for each threshold type
  const targetThreshold = thresholds.find(t => t.type === ThresholdType.TARGET)?.value;
  const warningThreshold = thresholds.find(t => t.type === ThresholdType.WARNING)?.value;
  const criticalThreshold = thresholds.find(t => t.type === ThresholdType.CRITICAL)?.value;

  // Validate threshold values are within valid range
  const isPercentage = metricType === MetricType.PERCENTAGE;
  const minValue = isPercentage ? METRIC_VALUE_LIMITS.MIN_PERCENTAGE : METRIC_VALUE_LIMITS.MIN_VALUE;
  const maxValue = isPercentage ? METRIC_VALUE_LIMITS.MAX_PERCENTAGE : METRIC_VALUE_LIMITS.MAX_VALUE;

  for (const threshold of thresholds) {
    if (threshold.value < minValue || threshold.value > maxValue) {
      return VALIDATION_ERRORS.INVALID_VALUE_RANGE.replace('{0}', 'threshold').replace('{1}', minValue.toString()).replace('{2}', maxValue.toString());
    }
  }

  // If both target and warning thresholds exist, validate their relationship
  if (targetThreshold !== undefined && warningThreshold !== undefined) {
    if (targetThreshold < warningThreshold) {
      return METRIC_ERRORS.THRESHOLD_VIOLATION;
    }
  }

  // If both warning and critical thresholds exist, validate their relationship
  if (warningThreshold !== undefined && criticalThreshold !== undefined) {
    if (warningThreshold < criticalThreshold) {
      return METRIC_ERRORS.THRESHOLD_VIOLATION;
    }
  }

  // If both target and critical thresholds exist, validate their relationship
  if (targetThreshold !== undefined && criticalThreshold !== undefined) {
    if (targetThreshold < criticalThreshold) {
      return METRIC_ERRORS.THRESHOLD_VIOLATION;
    }
  }

  return true;
};

/**
 * Validates that a formula is provided when calculation method is FORMULA
 * 
 * @param calculationMethod - The calculation method to check
 * @param formula - The formula value to validate
 * @returns true if valid, or error message if invalid
 */
export const validateFormulaForCalculationMethod = (
  calculationMethod: CalculationMethod,
  formula: string | null
): boolean | string => {
  if (calculationMethod === CalculationMethod.FORMULA) {
    if (!formula || formula.trim() === '') {
      return VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'formula');
    }
  } else if (calculationMethod === CalculationMethod.MANUAL || 
             calculationMethod === CalculationMethod.SUM || 
             calculationMethod === CalculationMethod.AVERAGE) {
    if (formula && formula.trim() !== '') {
      return VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'formula').replace('{1}', 'empty for non-FORMULA calculation methods');
    }
  }
  return true;
};

/**
 * Validates that a metric value is within the valid range for its type
 * 
 * @param value - The metric value to validate
 * @param metricType - The type of the metric
 * @param unit - The unit of the metric
 * @returns true if valid, or error message if invalid
 */
export const validateMetricValueRange = (
  value: number,
  metricType: MetricType,
  unit: string
): boolean | string => {
  // Validate based on metric type
  switch (metricType) {
    case MetricType.PERCENTAGE:
      if (value < METRIC_VALUE_LIMITS.MIN_PERCENTAGE || value > METRIC_VALUE_LIMITS.MAX_PERCENTAGE) {
        return VALIDATION_ERRORS.INVALID_VALUE_RANGE
          .replace('{0}', 'percentage')
          .replace('{1}', METRIC_VALUE_LIMITS.MIN_PERCENTAGE.toString())
          .replace('{2}', METRIC_VALUE_LIMITS.MAX_PERCENTAGE.toString());
      }
      break;
    
    case MetricType.NUMBER:
      if (value < METRIC_VALUE_LIMITS.MIN_VALUE || value > METRIC_VALUE_LIMITS.MAX_VALUE) {
        return VALIDATION_ERRORS.INVALID_VALUE_RANGE
          .replace('{0}', 'number')
          .replace('{1}', METRIC_VALUE_LIMITS.MIN_VALUE.toString())
          .replace('{2}', METRIC_VALUE_LIMITS.MAX_VALUE.toString());
      }
      
      // Additional validation based on unit
      if (unit === METRIC_UNITS.COUNT && value % 1 !== 0) {
        return VALIDATION_ERRORS.INVALID_FORMAT
          .replace('{0}', 'count')
          .replace('{1}', 'integer');
      }
      break;
    
    case MetricType.CURRENCY:
      if (value < METRIC_VALUE_LIMITS.MIN_VALUE || value > METRIC_VALUE_LIMITS.MAX_VALUE) {
        return VALIDATION_ERRORS.INVALID_VALUE_RANGE
          .replace('{0}', 'currency')
          .replace('{1}', METRIC_VALUE_LIMITS.MIN_VALUE.toString())
          .replace('{2}', METRIC_VALUE_LIMITS.MAX_VALUE.toString());
      }
      
      // Additional validation for currency units
      if (![METRIC_UNITS.CURRENCY_USD, METRIC_UNITS.CURRENCY_EUR, METRIC_UNITS.CURRENCY_GBP, METRIC_UNITS.CUSTOM].includes(unit)) {
        return VALIDATION_ERRORS.INVALID_FORMAT
          .replace('{0}', 'currency unit')
          .replace('{1}', 'USD, EUR, GBP, or custom');
      }
      break;
    
    case MetricType.BOOLEAN:
      if (value !== 0 && value !== 1) {
        return VALIDATION_ERRORS.INVALID_FORMAT
          .replace('{0}', 'boolean')
          .replace('{1}', '0 or 1');
      }
      break;
    
    default:
      return METRIC_ERRORS.INVALID_TYPE;
  }
  
  return true;
};

// Create metric schema - For validating new metric creation requests
export const createMetricSchema = z.object({
  name: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'name')),
  description: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'description')),
  type: z.nativeEnum(MetricType, { 
    errorMap: () => ({ message: METRIC_ERRORS.INVALID_TYPE })
  }),
  unit: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'unit')),
  comparisonType: z.nativeEnum(ComparisonType),
  calculationMethod: z.nativeEnum(CalculationMethod),
  formula: z.string().nullable(),
  organizationId: z.string().uuid(),
  teamId: z.string().uuid().nullable(),
  thresholds: z.array(
    z.object({
      type: z.nativeEnum(ThresholdType),
      value: z.number(),
      color: z.string().regex(
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 
        VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'color').replace('{1}', 'hex code (#RRGGBB)')
      ),
    })
  ).optional(),
  goalIds: z.array(z.string().uuid()).optional()
}).refine(
  (data) => validateFormulaForCalculationMethod(data.calculationMethod, data.formula),
  {
    message: METRIC_ERRORS.CALCULATION_FAILED,
    path: ['formula']
  }
).refine(
  (data) => validateMetricThresholds(data.thresholds || [], data.type),
  {
    message: METRIC_ERRORS.THRESHOLD_VIOLATION,
    path: ['thresholds']
  }
);

// Update metric schema - For validating metric update requests
export const updateMetricSchema = z.object({
  name: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'name')),
  description: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'description')),
  type: z.nativeEnum(MetricType, { 
    errorMap: () => ({ message: METRIC_ERRORS.INVALID_TYPE })
  }),
  unit: z.string().min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'unit')),
  comparisonType: z.nativeEnum(ComparisonType),
  calculationMethod: z.nativeEnum(CalculationMethod),
  formula: z.string().nullable(),
  teamId: z.string().uuid().nullable(),
}).refine(
  (data) => validateFormulaForCalculationMethod(data.calculationMethod, data.formula),
  {
    message: METRIC_ERRORS.CALCULATION_FAILED,
    path: ['formula']
  }
);

// Create metric value schema - For validating metric value creation requests
export const createMetricValueSchema = z.object({
  value: z.number(),
  timestamp: z.date(),
  metricId: z.string().uuid(),
  note: z.string().nullable()
});

// Create metric threshold schema - For validating metric threshold creation requests
export const createMetricThresholdSchema = z.object({
  type: z.nativeEnum(ThresholdType),
  value: z.number(),
  color: z.string().regex(
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 
    VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'color').replace('{1}', 'hex code (#RRGGBB)')
  ),
  metricId: z.string().uuid()
});

// Update metric threshold schema - For validating metric threshold update requests
export const updateMetricThresholdSchema = z.object({
  value: z.number(),
  color: z.string().regex(
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 
    VALIDATION_ERRORS.INVALID_FORMAT.replace('{0}', 'color').replace('{1}', 'hex code (#RRGGBB)')
  )
});

// Metric filters schema - For validating metric filtering parameters
export const metricFiltersSchema = z.object({
  organizationId: z.string().uuid(),
  teamId: z.string().uuid().nullable().optional(),
  type: z.nativeEnum(MetricType).nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional()
});

// Metric value filters schema - For validating metric value filtering parameters
export const metricValueFiltersSchema = z.object({
  metricId: z.string().uuid(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional()
});