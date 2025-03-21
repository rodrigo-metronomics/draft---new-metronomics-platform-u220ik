import { METRIC_TYPES, METRIC_UNITS } from '../constants/metricTypes';

/**
 * Formats a number with the specified number of decimal places and optional grouping separators
 * @param value - The number to format
 * @param decimalPlaces - Number of decimal places to display (default: 2)
 * @param useGrouping - Whether to use thousand separators (default: true)
 * @returns Formatted number string or empty string if value is invalid
 */
export const formatNumber = (
  value: number | string | null | undefined,
  decimalPlaces: number = 2,
  useGrouping: boolean = true
): string => {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping
  }).format(numValue);
};

/**
 * Formats a number as a percentage with the specified number of decimal places
 * @param value - The number to format as percentage (0.75 becomes 75%)
 * @param decimalPlaces - Number of decimal places to display (default: 1)
 * @returns Formatted percentage string or empty string if value is invalid
 */
export const formatPercentage = (
  value: number | string | null | undefined,
  decimalPlaces: number = 1
): string => {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(numValue);
};

/**
 * Formats a number as currency with the specified currency code and decimal places
 * @param value - The number to format as currency
 * @param currencyCode - The ISO currency code (default: 'USD')
 * @param decimalPlaces - Number of decimal places to display (default: 2)
 * @returns Formatted currency string or empty string if value is invalid
 */
export const formatCurrency = (
  value: number | string | null | undefined,
  currencyCode: string = 'USD',
  decimalPlaces: number = 2
): string => {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(numValue);
};

/**
 * Formats a boolean value according to the specified format
 * @param value - The boolean value to format
 * @param format - The format to use (default: 'YES_NO')
 * @returns Formatted boolean string or empty string if value is invalid
 */
export const formatBoolean = (
  value: boolean | string | number | null | undefined,
  format: 'YES_NO' | 'TRUE_FALSE' | 'ON_OFF' | 'ENABLED_DISABLED' = 'YES_NO'
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to boolean
  const boolValue = typeof value === 'string' 
    ? value.toLowerCase() === 'true' || value === '1'
    : typeof value === 'number'
      ? value !== 0
      : value;

  switch (format) {
    case 'YES_NO':
      return boolValue ? 'Yes' : 'No';
    case 'TRUE_FALSE':
      return boolValue ? 'True' : 'False';
    case 'ON_OFF':
      return boolValue ? 'On' : 'Off';
    case 'ENABLED_DISABLED':
      return boolValue ? 'Enabled' : 'Disabled';
    default:
      return boolValue ? 'Yes' : 'No';
  }
};

/**
 * Formats a metric value based on its type
 * @param value - The value to format
 * @param metricType - The type of metric (from METRIC_TYPES)
 * @param metricUnit - The unit of the metric (from METRIC_UNITS)
 * @param decimalPlaces - Number of decimal places to display for numeric values (default: 2)
 * @returns Formatted metric value or empty string if value is invalid
 */
export const formatMetricValue = (
  value: number | string | boolean | null | undefined,
  metricType: string,
  metricUnit: string = '',
  decimalPlaces: number = 2
): string => {
  if (value === null || value === undefined) {
    return '';
  }

  switch (metricType) {
    case METRIC_TYPES.NUMBER:
      return formatNumber(value, decimalPlaces);
    
    case METRIC_TYPES.PERCENTAGE:
      // If the value is already in decimal form (0.xx), convert to percentage
      const numValue = typeof value === 'string' ? parseFloat(value) : (value as number);
      if (!isNaN(numValue) && numValue <= 1 && numValue >= 0) {
        return formatPercentage(numValue, decimalPlaces);
      }
      // Otherwise assume it's already in percentage form (xx) and should be divided by 100
      return formatPercentage(typeof value === 'string' ? parseFloat(value) / 100 : (value as number) / 100, decimalPlaces);
    
    case METRIC_TYPES.CURRENCY:
      const currencyCode = metricUnit || 'USD';
      return formatCurrency(value, currencyCode, decimalPlaces);
    
    case METRIC_TYPES.BOOLEAN:
      return formatBoolean(value);
    
    default:
      return typeof value === 'string' ? value : String(value);
  }
};

/**
 * Formats a number in compact notation (K for thousands, M for millions, etc.)
 * @param value - The number to format
 * @param decimalPlaces - Number of decimal places to display (default: 1)
 * @returns Formatted compact number string or empty string if value is invalid
 */
export const formatCompactNumber = (
  value: number | string | null | undefined,
  decimalPlaces: number = 1
): string => {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(numValue);
};

/**
 * Formats a number of bytes into a human-readable file size
 * @param bytes - The number of bytes to format
 * @param decimalPlaces - Number of decimal places to display (default: 2)
 * @returns Formatted file size string or empty string if value is invalid
 */
export const formatFileSize = (
  bytes: number | string | null | undefined,
  decimalPlaces: number = 2
): string => {
  if (bytes === null || bytes === undefined || (typeof bytes === 'number' && isNaN(bytes))) {
    return '';
  }

  const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  
  if (isNaN(numBytes)) {
    return '';
  }

  if (numBytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  
  return `${formatNumber(numBytes / Math.pow(k, i), decimalPlaces)} ${sizes[i]}`;
};

/**
 * Formats a phone number string according to common patterns
 * @param phoneNumber - The phone number to format
 * @param countryCode - The country code for formatting (default: 'US')
 * @returns Formatted phone number string or empty string if value is invalid
 */
export const formatPhoneNumber = (
  phoneNumber: string | null | undefined,
  countryCode: string = 'US'
): string => {
  if (!phoneNumber) {
    return '';
  }

  // Strip all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on country code
  switch (countryCode) {
    case 'US':
      // Format as (XXX) XXX-XXXX
      if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
      } else if (cleaned.length > 10) {
        // Include country code for longer numbers
        return `+${cleaned.substring(0, cleaned.length - 10)} (${cleaned.substring(cleaned.length - 10, cleaned.length - 7)}) ${cleaned.substring(cleaned.length - 7, cleaned.length - 4)}-${cleaned.substring(cleaned.length - 4)}`;
      }
      break;
    
    // Add more country formats as needed
    
    default:
      // Default international format
      if (cleaned.length >= 10) {
        return `+${cleaned.substring(0, cleaned.length - 10)} ${cleaned.substring(cleaned.length - 10)}`;
      }
      break;
  }
  
  // If no specific formatting applied, return the cleaned number
  return cleaned;
};

/**
 * Formats an email address with optional obfuscation for privacy
 * @param email - The email address to format
 * @param obfuscate - Whether to obfuscate part of the email (default: false)
 * @returns Formatted email string or empty string if value is invalid
 */
export const formatEmail = (
  email: string | null | undefined,
  obfuscate: boolean = false
): string => {
  if (!email) {
    return '';
  }

  if (!obfuscate) {
    return email;
  }

  // Obfuscate the email by hiding part of the username
  const [username, domain] = email.split('@');
  if (!domain) {
    return email; // Not a valid email format
  }
  
  if (username.length <= 2) {
    return email; // Too short to obfuscate
  }
  
  const visibleChars = Math.min(2, username.length);
  const obfuscatedUsername = 
    username.substring(0, visibleChars) + 
    '*'.repeat(username.length - visibleChars);
  
  return `${obfuscatedUsername}@${domain}`;
};

/**
 * Formats an array of items into a comma-separated list with conjunction
 * @param items - The array of items to format
 * @param conjunction - The conjunction to use (default: 'and')
 * @returns Formatted list string or empty string if items is invalid
 */
export const formatList = (
  items: Array<string> | null | undefined,
  conjunction: string = 'and'
): string => {
  if (!items || items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} ${conjunction} ${items[1]}`;
  }

  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, items.length - 1);
  
  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
};

/**
 * Truncates text to a specified maximum length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - The maximum length (default: 100)
 * @param ellipsis - The ellipsis to append (default: '...')
 * @returns Truncated text or original text if already shorter than maxLength
 */
export const truncateText = (
  text: string | null | undefined,
  maxLength: number = 100,
  ellipsis: string = '...'
): string => {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Formats a delta value (change) with appropriate sign and formatting based on metric type
 * @param value - The delta value to format
 * @param metricType - The type of metric (from METRIC_TYPES)
 * @param includeSign - Whether to include + sign for positive values (default: true)
 * @param decimalPlaces - Number of decimal places to display (default: 1)
 * @returns Formatted delta value with sign or empty string if value is invalid
 */
export const formatDeltaValue = (
  value: number | string | null | undefined,
  metricType: string,
  includeSign: boolean = true,
  decimalPlaces: number = 1
): string => {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
    return '';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }
  
  const isPositive = numValue > 0;
  const isZero = numValue === 0;
  
  // Format the absolute value based on metric type
  let formattedValue = '';
  
  switch (metricType) {
    case METRIC_TYPES.PERCENTAGE:
      formattedValue = formatPercentage(Math.abs(numValue) / 100, decimalPlaces);
      break;
    case METRIC_TYPES.CURRENCY:
      formattedValue = formatCurrency(Math.abs(numValue), 'USD', decimalPlaces);
      break;
    default:
      formattedValue = formatNumber(Math.abs(numValue), decimalPlaces);
      break;
  }
  
  // Add sign
  if (isZero) {
    return formattedValue;
  }
  
  if (includeSign) {
    return isPositive ? `+${formattedValue}` : `-${formattedValue}`;
  } else {
    return isPositive ? formattedValue : `-${formattedValue}`;
  }
};

/**
 * Formats a metric value with its unit appended
 * @param value - The value to format
 * @param metricType - The type of metric (from METRIC_TYPES)
 * @param metricUnit - The unit of the metric (from METRIC_UNITS)
 * @param decimalPlaces - Number of decimal places to display (default: 2)
 * @returns Formatted metric value with unit or empty string if value is invalid
 */
export const formatMetricValueWithUnit = (
  value: number | string | boolean | null | undefined,
  metricType: string,
  metricUnit: string = '',
  decimalPlaces: number = 2
): string => {
  const formattedValue = formatMetricValue(value, metricType, metricUnit, decimalPlaces);
  
  if (!formattedValue) {
    return '';
  }
  
  // For PERCENTAGE and CURRENCY, the unit is already included in the formatting
  if (metricType === METRIC_TYPES.PERCENTAGE || metricType === METRIC_TYPES.CURRENCY) {
    return formattedValue;
  }
  
  // For other types, append the unit if provided
  return metricUnit ? `${formattedValue} ${metricUnit}` : formattedValue;
};