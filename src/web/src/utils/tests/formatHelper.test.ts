import { describe, it, expect, vi } from 'vitest';
import * as formatHelper from '../helpers/formatHelper';
import { METRIC_TYPES, METRIC_UNITS } from '../constants/metricTypes';

describe('formatNumber', () => {
  it('should format numbers with default parameters', () => {
    expect(formatHelper.formatNumber(1234.567)).toBe('1,234.57');
    expect(formatHelper.formatNumber(0)).toBe('0.00');
    expect(formatHelper.formatNumber(-1234.567)).toBe('-1,234.57');
  });

  it('should format numbers with custom decimal places', () => {
    expect(formatHelper.formatNumber(1234.567, 0)).toBe('1,235');
    expect(formatHelper.formatNumber(1234.567, 1)).toBe('1,234.6');
    expect(formatHelper.formatNumber(1234.567, 3)).toBe('1,234.567');
  });

  it('should format numbers with or without grouping separators', () => {
    expect(formatHelper.formatNumber(1234567, 2, true)).toBe('1,234,567.00');
    expect(formatHelper.formatNumber(1234567, 2, false)).toBe('1234567.00');
  });

  it('should handle null, undefined, and NaN values', () => {
    expect(formatHelper.formatNumber(null)).toBe('');
    expect(formatHelper.formatNumber(undefined)).toBe('');
    expect(formatHelper.formatNumber(NaN)).toBe('');
  });

  it('should handle string number values', () => {
    expect(formatHelper.formatNumber('1234.567')).toBe('1,234.57');
    expect(formatHelper.formatNumber('invalid')).toBe('');
  });

  it('should handle negative numbers', () => {
    expect(formatHelper.formatNumber(-1234.567)).toBe('-1,234.57');
  });
});

describe('formatPercentage', () => {
  it('should format percentages with default parameters', () => {
    expect(formatHelper.formatPercentage(0.75)).toBe('75.0%');
    expect(formatHelper.formatPercentage(0)).toBe('0.0%');
    expect(formatHelper.formatPercentage(1)).toBe('100.0%');
  });

  it('should format percentages with custom decimal places', () => {
    expect(formatHelper.formatPercentage(0.75, 0)).toBe('75%');
    expect(formatHelper.formatPercentage(0.75, 2)).toBe('75.00%');
  });

  it('should handle null, undefined, and NaN values', () => {
    expect(formatHelper.formatPercentage(null)).toBe('');
    expect(formatHelper.formatPercentage(undefined)).toBe('');
    expect(formatHelper.formatPercentage(NaN)).toBe('');
  });

  it('should handle string percentage values', () => {
    expect(formatHelper.formatPercentage('0.75')).toBe('75.0%');
    expect(formatHelper.formatPercentage('invalid')).toBe('');
  });

  it('should handle negative percentages', () => {
    expect(formatHelper.formatPercentage(-0.75)).toBe('-75.0%');
  });

  it('should handle decimal values (0.5 should be 50%)', () => {
    expect(formatHelper.formatPercentage(0.5)).toBe('50.0%');
  });
});

describe('formatCurrency', () => {
  it('should format currency with default parameters (USD)', () => {
    expect(formatHelper.formatCurrency(1234.567)).toBe('$1,234.57');
    expect(formatHelper.formatCurrency(0)).toBe('$0.00');
    expect(formatHelper.formatCurrency(-1234.567)).toBe('-$1,234.57');
  });

  it('should format currency with different currency codes', () => {
    expect(formatHelper.formatCurrency(1234.567, 'EUR')).toBe('€1,234.57');
    expect(formatHelper.formatCurrency(1234.567, 'GBP')).toBe('£1,234.57');
    expect(formatHelper.formatCurrency(1234.567, 'JPY')).toBe('¥1,235'); // JPY typically has 0 decimal places
  });

  it('should format currency with custom decimal places', () => {
    expect(formatHelper.formatCurrency(1234.567, 'USD', 0)).toBe('$1,235');
    expect(formatHelper.formatCurrency(1234.567, 'USD', 3)).toBe('$1,234.567');
  });

  it('should handle null, undefined, and NaN values', () => {
    expect(formatHelper.formatCurrency(null)).toBe('');
    expect(formatHelper.formatCurrency(undefined)).toBe('');
    expect(formatHelper.formatCurrency(NaN)).toBe('');
  });

  it('should handle string currency values', () => {
    expect(formatHelper.formatCurrency('1234.567')).toBe('$1,234.57');
    expect(formatHelper.formatCurrency('invalid')).toBe('');
  });

  it('should handle negative currency values', () => {
    expect(formatHelper.formatCurrency(-1234.567)).toBe('-$1,234.57');
  });
});

describe('formatBoolean', () => {
  it('should format boolean with default format (YES_NO)', () => {
    expect(formatHelper.formatBoolean(true)).toBe('Yes');
    expect(formatHelper.formatBoolean(false)).toBe('No');
  });

  it('should format boolean with YES_NO format', () => {
    expect(formatHelper.formatBoolean(true, 'YES_NO')).toBe('Yes');
    expect(formatHelper.formatBoolean(false, 'YES_NO')).toBe('No');
  });

  it('should format boolean with TRUE_FALSE format', () => {
    expect(formatHelper.formatBoolean(true, 'TRUE_FALSE')).toBe('True');
    expect(formatHelper.formatBoolean(false, 'TRUE_FALSE')).toBe('False');
  });

  it('should format boolean with ON_OFF format', () => {
    expect(formatHelper.formatBoolean(true, 'ON_OFF')).toBe('On');
    expect(formatHelper.formatBoolean(false, 'ON_OFF')).toBe('Off');
  });

  it('should format boolean with ENABLED_DISABLED format', () => {
    expect(formatHelper.formatBoolean(true, 'ENABLED_DISABLED')).toBe('Enabled');
    expect(formatHelper.formatBoolean(false, 'ENABLED_DISABLED')).toBe('Disabled');
  });

  it('should handle null and undefined values', () => {
    expect(formatHelper.formatBoolean(null)).toBe('');
    expect(formatHelper.formatBoolean(undefined)).toBe('');
  });

  it('should handle string boolean values', () => {
    expect(formatHelper.formatBoolean('true')).toBe('Yes');
    expect(formatHelper.formatBoolean('false')).toBe('No');
    expect(formatHelper.formatBoolean('1')).toBe('Yes');
    expect(formatHelper.formatBoolean('0')).toBe('No');
  });

  it('should handle numeric boolean values', () => {
    expect(formatHelper.formatBoolean(1)).toBe('Yes');
    expect(formatHelper.formatBoolean(0)).toBe('No');
  });
});

describe('formatMetricValue', () => {
  it('should format NUMBER type metrics', () => {
    expect(formatHelper.formatMetricValue(1234.567, METRIC_TYPES.NUMBER)).toBe('1,234.57');
    expect(formatHelper.formatMetricValue(1234.567, METRIC_TYPES.NUMBER, '', 1)).toBe('1,234.6');
  });

  it('should format PERCENTAGE type metrics', () => {
    // Value as decimal (0.xx)
    expect(formatHelper.formatMetricValue(0.75, METRIC_TYPES.PERCENTAGE)).toBe('75.0%');
    
    // Value as percentage (xx)
    expect(formatHelper.formatMetricValue(75, METRIC_TYPES.PERCENTAGE)).toBe('75.0%');
  });

  it('should format CURRENCY type metrics with different currency units', () => {
    expect(formatHelper.formatMetricValue(1234.567, METRIC_TYPES.CURRENCY, 'USD')).toBe('$1,234.57');
    expect(formatHelper.formatMetricValue(1234.567, METRIC_TYPES.CURRENCY, 'EUR')).toBe('€1,234.57');
    expect(formatHelper.formatMetricValue(1234.567, METRIC_TYPES.CURRENCY, 'GBP')).toBe('£1,234.57');
  });

  it('should format BOOLEAN type metrics', () => {
    expect(formatHelper.formatMetricValue(true, METRIC_TYPES.BOOLEAN)).toBe('Yes');
    expect(formatHelper.formatMetricValue(false, METRIC_TYPES.BOOLEAN)).toBe('No');
  });

  it('should handle null, undefined, and invalid values', () => {
    expect(formatHelper.formatMetricValue(null, METRIC_TYPES.NUMBER)).toBe('');
    expect(formatHelper.formatMetricValue(undefined, METRIC_TYPES.PERCENTAGE)).toBe('');
    expect(formatHelper.formatMetricValue('invalid', METRIC_TYPES.NUMBER)).toBe('');
  });

  it('should handle different decimal place configurations', () => {
    expect(formatHelper.formatMetricValue(1234.567, METRIC_TYPES.NUMBER, '', 0)).toBe('1,235');
    expect(formatHelper.formatMetricValue(0.75, METRIC_TYPES.PERCENTAGE, '', 2)).toBe('75.00%');
  });
});

describe('formatCompactNumber', () => {
  it('should format thousands with K suffix', () => {
    expect(formatHelper.formatCompactNumber(1234)).toBe('1.2K');
    expect(formatHelper.formatCompactNumber(5678)).toBe('5.7K');
  });

  it('should format millions with M suffix', () => {
    expect(formatHelper.formatCompactNumber(1234567)).toBe('1.2M');
    expect(formatHelper.formatCompactNumber(5678901)).toBe('5.7M');
  });

  it('should format billions with B suffix', () => {
    expect(formatHelper.formatCompactNumber(1234567890)).toBe('1.2B');
    expect(formatHelper.formatCompactNumber(5678901234)).toBe('5.7B');
  });

  it('should format with custom decimal places', () => {
    expect(formatHelper.formatCompactNumber(1234, 0)).toBe('1K');
    expect(formatHelper.formatCompactNumber(1234, 2)).toBe('1.23K');
  });

  it('should handle null, undefined, and NaN values', () => {
    expect(formatHelper.formatCompactNumber(null)).toBe('');
    expect(formatHelper.formatCompactNumber(undefined)).toBe('');
    expect(formatHelper.formatCompactNumber(NaN)).toBe('');
  });

  it('should handle small numbers (no compact notation)', () => {
    expect(formatHelper.formatCompactNumber(123)).toBe('123.0');
    expect(formatHelper.formatCompactNumber(12)).toBe('12.0');
  });

  it('should handle negative numbers', () => {
    expect(formatHelper.formatCompactNumber(-1234)).toBe('-1.2K');
    expect(formatHelper.formatCompactNumber(-1234567)).toBe('-1.2M');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatHelper.formatFileSize(123)).toBe('123.00 Bytes');
  });

  it('should format kilobytes (KB)', () => {
    expect(formatHelper.formatFileSize(1234)).toBe('1.21 KB');
  });

  it('should format megabytes (MB)', () => {
    expect(formatHelper.formatFileSize(1234567)).toBe('1.18 MB');
  });

  it('should format gigabytes (GB)', () => {
    expect(formatHelper.formatFileSize(1234567890)).toBe('1.15 GB');
  });

  it('should format terabytes (TB)', () => {
    expect(formatHelper.formatFileSize(1234567890123)).toBe('1.12 TB');
  });

  it('should format with custom decimal places', () => {
    expect(formatHelper.formatFileSize(1234, 0)).toBe('1 KB');
    expect(formatHelper.formatFileSize(1234567, 3)).toBe('1.177 MB');
  });

  it('should handle null, undefined, and NaN values', () => {
    expect(formatHelper.formatFileSize(null)).toBe('');
    expect(formatHelper.formatFileSize(undefined)).toBe('');
    expect(formatHelper.formatFileSize(NaN)).toBe('');
  });

  it('should handle string byte values', () => {
    expect(formatHelper.formatFileSize('1234')).toBe('1.21 KB');
    expect(formatHelper.formatFileSize('invalid')).toBe('');
  });

  it('should handle zero value', () => {
    expect(formatHelper.formatFileSize(0)).toBe('0 Bytes');
  });

  it('should handle negative values', () => {
    expect(formatHelper.formatFileSize(-1234)).toBe('-1.21 KB');
  });
});

describe('formatPhoneNumber', () => {
  it('should format US phone numbers (default)', () => {
    expect(formatHelper.formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    expect(formatHelper.formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890');
  });

  it('should format international phone numbers', () => {
    expect(formatHelper.formatPhoneNumber('441234567890', 'UK')).toBe('+44 1234567890');
  });

  it('should handle different input formats (with/without separators)', () => {
    expect(formatHelper.formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    expect(formatHelper.formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
    expect(formatHelper.formatPhoneNumber('123.456.7890')).toBe('(123) 456-7890');
  });

  it('should handle null, undefined, and empty values', () => {
    expect(formatHelper.formatPhoneNumber(null)).toBe('');
    expect(formatHelper.formatPhoneNumber(undefined)).toBe('');
    expect(formatHelper.formatPhoneNumber('')).toBe('');
  });

  it('should handle invalid phone numbers', () => {
    expect(formatHelper.formatPhoneNumber('123')).toBe('123');
    expect(formatHelper.formatPhoneNumber('12345')).toBe('12345');
  });
});

describe('formatEmail', () => {
  it('should format without obfuscation', () => {
    expect(formatHelper.formatEmail('test@example.com')).toBe('test@example.com');
  });

  it('should format with obfuscation', () => {
    expect(formatHelper.formatEmail('test@example.com', true)).toBe('te**@example.com');
    expect(formatHelper.formatEmail('a@example.com', true)).toBe('a@example.com');
    expect(formatHelper.formatEmail('ab@example.com', true)).toBe('ab@example.com');
    expect(formatHelper.formatEmail('abc@example.com', true)).toBe('ab*@example.com');
  });

  it('should handle null, undefined, and empty values', () => {
    expect(formatHelper.formatEmail(null)).toBe('');
    expect(formatHelper.formatEmail(undefined)).toBe('');
    expect(formatHelper.formatEmail('')).toBe('');
  });

  it('should handle invalid email formats', () => {
    expect(formatHelper.formatEmail('invalid-email')).toBe('invalid-email');
    expect(formatHelper.formatEmail('invalid-email', true)).toBe('invalid-email');
  });
});

describe('formatList', () => {
  it('should format single item lists', () => {
    expect(formatHelper.formatList(['apple'])).toBe('apple');
  });

  it('should format two item lists', () => {
    expect(formatHelper.formatList(['apple', 'banana'])).toBe('apple and banana');
  });

  it('should format multi-item lists', () => {
    expect(formatHelper.formatList(['apple', 'banana', 'cherry'])).toBe('apple, banana, and cherry');
    expect(formatHelper.formatList(['apple', 'banana', 'cherry', 'date'])).toBe('apple, banana, cherry, and date');
  });

  it('should format with different conjunctions', () => {
    expect(formatHelper.formatList(['apple', 'banana'], 'or')).toBe('apple or banana');
    expect(formatHelper.formatList(['apple', 'banana', 'cherry'], 'or')).toBe('apple, banana, or cherry');
  });

  it('should handle null, undefined, and empty arrays', () => {
    expect(formatHelper.formatList(null)).toBe('');
    expect(formatHelper.formatList(undefined)).toBe('');
    expect(formatHelper.formatList([])).toBe('');
  });
});

describe('truncateText', () => {
  it('should truncate text longer than maxLength', () => {
    expect(formatHelper.truncateText('This is a long text that should be truncated', 20)).toBe('This is a long tex...');
  });

  it('should not truncate text shorter than maxLength', () => {
    expect(formatHelper.truncateText('Short text', 20)).toBe('Short text');
  });

  it('should truncate with custom ellipsis', () => {
    expect(formatHelper.truncateText('This is a long text that should be truncated', 20, '[...]')).toBe('This is a long t[...]');
  });

  it('should handle null, undefined, and empty values', () => {
    expect(formatHelper.truncateText(null)).toBe('');
    expect(formatHelper.truncateText(undefined)).toBe('');
    expect(formatHelper.truncateText('')).toBe('');
  });

  it('should handle edge cases', () => {
    expect(formatHelper.truncateText('Text', 0, '...')).toBe('');
    expect(formatHelper.truncateText('Text', 2, '...')).toBe('');  // maxLength < ellipsis.length
  });
});

describe('formatDeltaValue', () => {
  it('should format positive delta values with sign', () => {
    expect(formatHelper.formatDeltaValue(10, METRIC_TYPES.NUMBER)).toBe('+10.0');
    expect(formatHelper.formatDeltaValue(10.5, METRIC_TYPES.NUMBER)).toBe('+10.5');
  });

  it('should format negative delta values with sign', () => {
    expect(formatHelper.formatDeltaValue(-10, METRIC_TYPES.NUMBER)).toBe('-10.0');
    expect(formatHelper.formatDeltaValue(-10.5, METRIC_TYPES.NUMBER)).toBe('-10.5');
  });

  it('should format zero delta values', () => {
    expect(formatHelper.formatDeltaValue(0, METRIC_TYPES.NUMBER)).toBe('0.0');
  });

  it('should format with different metric types', () => {
    expect(formatHelper.formatDeltaValue(10, METRIC_TYPES.NUMBER)).toBe('+10.0');
    expect(formatHelper.formatDeltaValue(10, METRIC_TYPES.PERCENTAGE)).toBe('+10.0%');
    expect(formatHelper.formatDeltaValue(10, METRIC_TYPES.CURRENCY)).toBe('+$10.0');
  });

  it('should format without sign', () => {
    expect(formatHelper.formatDeltaValue(10, METRIC_TYPES.NUMBER, false)).toBe('10.0');
    expect(formatHelper.formatDeltaValue(-10, METRIC_TYPES.NUMBER, false)).toBe('-10.0');
  });

  it('should handle null, undefined, and NaN values', () => {
    expect(formatHelper.formatDeltaValue(null, METRIC_TYPES.NUMBER)).toBe('');
    expect(formatHelper.formatDeltaValue(undefined, METRIC_TYPES.NUMBER)).toBe('');
    expect(formatHelper.formatDeltaValue(NaN, METRIC_TYPES.NUMBER)).toBe('');
  });
});

describe('formatMetricValueWithUnit', () => {
  it('should format NUMBER type metrics with units', () => {
    expect(formatHelper.formatMetricValueWithUnit(10, METRIC_TYPES.NUMBER, 'days')).toBe('10.00 days');
    expect(formatHelper.formatMetricValueWithUnit(10.5, METRIC_TYPES.NUMBER, 'hours')).toBe('10.50 hours');
  });

  it('should format PERCENTAGE type metrics (unit already included)', () => {
    expect(formatHelper.formatMetricValueWithUnit(75, METRIC_TYPES.PERCENTAGE)).toBe('75.0%');
    expect(formatHelper.formatMetricValueWithUnit(0.75, METRIC_TYPES.PERCENTAGE)).toBe('75.0%');
  });

  it('should format CURRENCY type metrics (unit already included)', () => {
    expect(formatHelper.formatMetricValueWithUnit(100, METRIC_TYPES.CURRENCY, 'USD')).toBe('$100.00');
    expect(formatHelper.formatMetricValueWithUnit(100, METRIC_TYPES.CURRENCY, 'EUR')).toBe('€100.00');
  });

  it('should format BOOLEAN type metrics with units', () => {
    expect(formatHelper.formatMetricValueWithUnit(true, METRIC_TYPES.BOOLEAN, 'status')).toBe('Yes status');
    expect(formatHelper.formatMetricValueWithUnit(false, METRIC_TYPES.BOOLEAN, 'status')).toBe('No status');
  });

  it('should handle null, undefined, and invalid values', () => {
    expect(formatHelper.formatMetricValueWithUnit(null, METRIC_TYPES.NUMBER, 'days')).toBe('');
    expect(formatHelper.formatMetricValueWithUnit(undefined, METRIC_TYPES.NUMBER, 'days')).toBe('');
    expect(formatHelper.formatMetricValueWithUnit('invalid', METRIC_TYPES.NUMBER, 'days')).toBe('');
  });

  it('should handle empty unit values', () => {
    expect(formatHelper.formatMetricValueWithUnit(10, METRIC_TYPES.NUMBER)).toBe('10.00');
    expect(formatHelper.formatMetricValueWithUnit(10, METRIC_TYPES.NUMBER, '')).toBe('10.00');
  });
});