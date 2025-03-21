import {
  format,
  parse,
  parseISO as parseISODateFns,
  isValid,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  isBefore,
  isAfter,
  isSameDay,
  formatDistance,
  formatDistanceToNow,
  getTime,
  isDate
} from 'date-fns'; // ^2.30.0
import { format as tzFormat, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'; // ^2.0.0
import { DateRange, TimeRange, ComparisonType } from '../../types';

/**
 * Formats a date object or string into a human-readable string using the specified format
 * 
 * @param date - The date to format
 * @param formatString - The format pattern to use (using date-fns format tokens)
 * @returns Formatted date string or empty string if date is invalid
 */
export const formatDate = (date: Date | string | number | null | undefined, formatString: string): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Parses a date string into a Date object using the specified format
 * 
 * @param dateString - The string to parse
 * @param formatString - The format pattern to use for parsing
 * @returns Parsed Date object or null if parsing fails
 */
export const parseDate = (dateString: string | null | undefined, formatString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    const parsedDate = parse(dateString, formatString, new Date());
    if (!isValid(parsedDate)) return null;
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Formats a date to ISO 8601 format (YYYY-MM-DDTHH:mm:ss.SSSZ)
 * 
 * @param date - The date to format
 * @returns ISO formatted date string or empty string if date is invalid
 */
export const formatToISO = (date: Date | string | number | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error formatting date to ISO:', error);
    return '';
  }
};

/**
 * Parses an ISO 8601 formatted date string into a Date object
 * 
 * @param isoString - The ISO date string to parse
 * @returns Parsed Date object or null if parsing fails
 */
export const parseISO = (isoString: string | null | undefined): Date | null => {
  if (!isoString) return null;
  
  try {
    const parsedDate = parseISODateFns(isoString);
    if (!isValid(parsedDate)) return null;
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing ISO date:', error);
    return null;
  }
};

/**
 * Returns the current date and time as a Date object
 * 
 * @returns Current date and time
 */
export const getCurrentDateTime = (): Date => {
  return new Date();
};

/**
 * Converts a date to the specified timezone
 * 
 * @param date - The date to convert
 * @param timeZone - The timezone to convert to (e.g., 'America/New_York')
 * @returns Date object in the specified timezone or null if date is invalid
 */
export const getDateTimeForTimeZone = (
  date: Date | string | number | null | undefined,
  timeZone: string
): Date | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    return utcToZonedTime(dateObj, timeZone);
  } catch (error) {
    console.error('Error converting date to timezone:', error);
    return null;
  }
};

/**
 * Formats a date for a specific timezone with the specified format
 * 
 * @param date - The date to format
 * @param formatString - The format pattern to use
 * @param timeZone - The timezone to format for
 * @returns Formatted date string for the specified timezone or empty string if date is invalid
 */
export const formatDateForTimeZone = (
  date: Date | string | number | null | undefined,
  formatString: string,
  timeZone: string
): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    
    return tzFormat(dateObj, formatString, { timeZone });
  } catch (error) {
    console.error('Error formatting date for timezone:', error);
    return '';
  }
};

/**
 * Adds a specified amount of time (days, months, years) to a date
 * 
 * @param date - The base date
 * @param amount - The amount to add
 * @param unit - The unit of time to add (days, months, or years)
 * @returns New date with added time or null if date is invalid
 */
export const addTimeToDate = (
  date: Date | string | number | null | undefined,
  amount: number,
  unit: 'days' | 'months' | 'years'
): Date | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    switch (unit) {
      case 'days':
        return addDays(dateObj, amount);
      case 'months':
        return addMonths(dateObj, amount);
      case 'years':
        return addYears(dateObj, amount);
      default:
        return dateObj;
    }
  } catch (error) {
    console.error('Error adding time to date:', error);
    return null;
  }
};

/**
 * Subtracts a specified amount of time (days, months, years) from a date
 * 
 * @param date - The base date
 * @param amount - The amount to subtract
 * @param unit - The unit of time to subtract (days, months, or years)
 * @returns New date with subtracted time or null if date is invalid
 */
export const subtractTimeFromDate = (
  date: Date | string | number | null | undefined,
  amount: number,
  unit: 'days' | 'months' | 'years'
): Date | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    switch (unit) {
      case 'days':
        return subDays(dateObj, amount);
      case 'months':
        return subMonths(dateObj, amount);
      case 'years':
        return subYears(dateObj, amount);
      default:
        return dateObj;
    }
  } catch (error) {
    console.error('Error subtracting time from date:', error);
    return null;
  }
};

/**
 * Calculates the difference between two dates in the specified unit
 * 
 * @param dateLeft - The later date
 * @param dateRight - The earlier date
 * @param unit - The unit to measure the difference in (days, months, or years)
 * @returns Difference in the specified unit or null if either date is invalid
 */
export const getTimeDifference = (
  dateLeft: Date | string | number | null | undefined,
  dateRight: Date | string | number | null | undefined,
  unit: 'days' | 'months' | 'years'
): number | null => {
  if (!dateLeft || !dateRight) return null;
  
  try {
    const dateLeftObj = typeof dateLeft === 'string' || typeof dateLeft === 'number' ? new Date(dateLeft) : dateLeft;
    const dateRightObj = typeof dateRight === 'string' || typeof dateRight === 'number' ? new Date(dateRight) : dateRight;
    
    if (!isValid(dateLeftObj) || !isValid(dateRightObj)) return null;
    
    switch (unit) {
      case 'days':
        return differenceInDays(dateLeftObj, dateRightObj);
      case 'months':
        return differenceInMonths(dateLeftObj, dateRightObj);
      case 'years':
        return differenceInYears(dateLeftObj, dateRightObj);
      default:
        return null;
    }
  } catch (error) {
    console.error('Error calculating time difference:', error);
    return null;
  }
};

/**
 * Returns the start of a time period (day, week, month, quarter, year) for a date
 * 
 * @param date - The reference date
 * @param unit - The unit of time (day, week, month, quarter, year)
 * @returns Start of the specified time period or null if date is invalid
 */
export const getStartOf = (
  date: Date | string | number | null | undefined,
  unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
): Date | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    switch (unit) {
      case 'day':
        return startOfDay(dateObj);
      case 'week':
        return startOfWeek(dateObj);
      case 'month':
        return startOfMonth(dateObj);
      case 'quarter':
        return startOfQuarter(dateObj);
      case 'year':
        return startOfYear(dateObj);
      default:
        return dateObj;
    }
  } catch (error) {
    console.error('Error getting start of time period:', error);
    return null;
  }
};

/**
 * Returns the end of a time period (day, week, month, quarter, year) for a date
 * 
 * @param date - The reference date
 * @param unit - The unit of time (day, week, month, quarter, year)
 * @returns End of the specified time period or null if date is invalid
 */
export const getEndOf = (
  date: Date | string | number | null | undefined,
  unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
): Date | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return null;
    
    switch (unit) {
      case 'day':
        return endOfDay(dateObj);
      case 'week':
        return endOfWeek(dateObj);
      case 'month':
        return endOfMonth(dateObj);
      case 'quarter':
        return endOfQuarter(dateObj);
      case 'year':
        return endOfYear(dateObj);
      default:
        return dateObj;
    }
  } catch (error) {
    console.error('Error getting end of time period:', error);
    return null;
  }
};

/**
 * Checks if the first date is before the second date
 * 
 * @param date - The date to check
 * @param dateToCompare - The date to compare against
 * @returns True if the first date is before the second date, false otherwise
 */
export const isDateBefore = (
  date: Date | string | number | null | undefined,
  dateToCompare: Date | string | number | null | undefined
): boolean => {
  if (!date || !dateToCompare) return false;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const dateToCompareObj = typeof dateToCompare === 'string' || typeof dateToCompare === 'number' 
      ? new Date(dateToCompare) 
      : dateToCompare;
    
    if (!isValid(dateObj) || !isValid(dateToCompareObj)) return false;
    
    return isBefore(dateObj, dateToCompareObj);
  } catch (error) {
    console.error('Error checking if date is before:', error);
    return false;
  }
};

/**
 * Checks if the first date is after the second date
 * 
 * @param date - The date to check
 * @param dateToCompare - The date to compare against
 * @returns True if the first date is after the second date, false otherwise
 */
export const isDateAfter = (
  date: Date | string | number | null | undefined,
  dateToCompare: Date | string | number | null | undefined
): boolean => {
  if (!date || !dateToCompare) return false;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const dateToCompareObj = typeof dateToCompare === 'string' || typeof dateToCompare === 'number' 
      ? new Date(dateToCompare) 
      : dateToCompare;
    
    if (!isValid(dateObj) || !isValid(dateToCompareObj)) return false;
    
    return isAfter(dateObj, dateToCompareObj);
  } catch (error) {
    console.error('Error checking if date is after:', error);
    return false;
  }
};

/**
 * Checks if two dates are the same day (ignoring time)
 * 
 * @param dateLeft - The first date
 * @param dateRight - The second date
 * @returns True if the dates are the same day, false otherwise
 */
export const isSameDate = (
  dateLeft: Date | string | number | null | undefined,
  dateRight: Date | string | number | null | undefined
): boolean => {
  if (!dateLeft || !dateRight) return false;
  
  try {
    const dateLeftObj = typeof dateLeft === 'string' || typeof dateLeft === 'number' ? new Date(dateLeft) : dateLeft;
    const dateRightObj = typeof dateRight === 'string' || typeof dateRight === 'number' ? new Date(dateRight) : dateRight;
    
    if (!isValid(dateLeftObj) || !isValid(dateRightObj)) return false;
    
    return isSameDay(dateLeftObj, dateRightObj);
  } catch (error) {
    console.error('Error checking if dates are the same:', error);
    return false;
  }
};

/**
 * Returns a date range (start and end dates) for a specified time range
 * 
 * @param timeRange - The type of time range (day, week, month, quarter, year, custom)
 * @param referenceDate - The reference date to calculate the range from (defaults to today)
 * @param customRange - Custom date range for 'custom' time range
 * @returns Date range with start and end dates
 */
export const getDateRangeForTimeRange = (
  timeRange: TimeRange,
  referenceDate?: Date | null | undefined,
  customRange?: DateRange | null | undefined
): DateRange => {
  const date = referenceDate || new Date();
  
  switch (timeRange) {
    case 'day':
      return {
        startDate: startOfDay(date),
        endDate: endOfDay(date)
      };
    case 'week':
      return {
        startDate: startOfWeek(date),
        endDate: endOfWeek(date)
      };
    case 'month':
      return {
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    case 'quarter':
      return {
        startDate: startOfQuarter(date),
        endDate: endOfQuarter(date)
      };
    case 'year':
      return {
        startDate: startOfYear(date),
        endDate: endOfYear(date)
      };
    case 'custom':
      if (customRange) {
        return customRange;
      }
      // Default to current month if custom range not provided
      return {
        startDate: startOfMonth(date),
        endDate: endOfMonth(date)
      };
    default:
      return {
        startDate: startOfDay(date),
        endDate: endOfDay(date)
      };
  }
};

/**
 * Returns a date range for comparison based on the specified comparison type
 * 
 * @param comparisonType - The type of comparison (previous, yoy, target)
 * @param currentRange - The current date range to compare against
 * @param customRange - Custom date range for comparison when needed
 * @returns Date range for comparison
 */
export const getDateRangeForComparison = (
  comparisonType: ComparisonType,
  currentRange: DateRange,
  customRange?: DateRange | null
): DateRange => {
  const { startDate: currentStart, endDate: currentEnd } = currentRange;
  const currentStartDate = typeof currentStart === 'string' ? new Date(currentStart) : currentStart;
  const currentEndDate = typeof currentEnd === 'string' ? new Date(currentEnd) : currentEnd;
  
  // Calculate the duration of the current range
  const durationInDays = differenceInDays(currentEndDate, currentStartDate);
  
  switch (comparisonType) {
    case 'previous':
      // Previous period of same duration
      return {
        startDate: subDays(currentStartDate, durationInDays + 1),
        endDate: subDays(currentEndDate, durationInDays + 1)
      };
    case 'yoy':
      // Same period last year
      return {
        startDate: subYears(currentStartDate, 1),
        endDate: subYears(currentEndDate, 1)
      };
    case 'target':
      // For target comparison, we use the current range
      // (targets are typically set for specific periods)
      return currentRange;
    default:
      // Use custom range if provided, otherwise use current range
      return customRange || currentRange;
  }
};

/**
 * Formats a duration in milliseconds to a human-readable string (e.g., '2h 30m')
 * 
 * @param milliseconds - The duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds <= 0) return '0s';
  
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  
  if (hours === 0 && minutes === 0) {
    return `${seconds}s`;
  } else if (hours === 0) {
    return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
  } else {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  }
};

/**
 * Formats a time range between two dates (e.g., '9:00 AM - 10:30 AM')
 * 
 * @param startDate - The start date/time
 * @param endDate - The end date/time
 * @param formatString - The format pattern to use for times
 * @returns Formatted time range string or empty string if dates are invalid
 */
export const formatTimeRange = (
  startDate: Date | string | number | null | undefined,
  endDate: Date | string | number | null | undefined,
  formatString: string = 'h:mm a'
): string => {
  if (!startDate || !endDate) return '';
  
  try {
    const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
    const endDateObj = typeof endDate === 'string' || typeof endDate === 'number' ? new Date(endDate) : endDate;
    
    if (!isValid(startDateObj) || !isValid(endDateObj)) return '';
    
    const formattedStart = format(startDateObj, formatString);
    const formattedEnd = format(endDateObj, formatString);
    
    return `${formattedStart} - ${formattedEnd}`;
  } catch (error) {
    console.error('Error formatting time range:', error);
    return '';
  }
};

/**
 * Generates a series of recurring dates based on a start date and recurrence pattern
 * 
 * @param startDate - The initial date in the series
 * @param count - The number of occurrences to generate
 * @param frequency - The frequency of recurrence (daily, weekly, monthly, yearly)
 * @param interval - The interval between occurrences (e.g., every 2 weeks)
 * @returns Array of recurring dates
 */
export const getRecurringDates = (
  startDate: Date | string | number | null | undefined,
  count: number,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number = 1
): Date[] => {
  if (!startDate || count <= 0 || interval <= 0) return [];
  
  try {
    const startDateObj = typeof startDate === 'string' || typeof startDate === 'number' ? new Date(startDate) : startDate;
    if (!isValid(startDateObj)) return [];
    
    const dates: Date[] = [new Date(startDateObj)];
    
    let addFn;
    switch (frequency) {
      case 'daily':
        addFn = (date: Date) => addDays(date, interval);
        break;
      case 'weekly':
        addFn = (date: Date) => addDays(date, interval * 7);
        break;
      case 'monthly':
        addFn = (date: Date) => addMonths(date, interval);
        break;
      case 'yearly':
        addFn = (date: Date) => addYears(date, interval);
        break;
      default:
        return [];
    }
    
    for (let i = 1; i < count; i++) {
      const previousDate = dates[i - 1];
      dates.push(addFn(previousDate));
    }
    
    return dates;
  } catch (error) {
    console.error('Error generating recurring dates:', error);
    return [];
  }
};

/**
 * Checks if a value is a valid date
 * 
 * @param value - The value to check
 * @returns True if the value is a valid date, false otherwise
 */
export const isValidDate = (value: any): boolean => {
  if (!value) return false;
  
  if (value instanceof Date) {
    return isDate(value) && isValid(value);
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isValid(date);
  }
  
  return false;
};

/**
 * Returns a relative time string (e.g., '2 days ago', 'in 3 hours')
 * 
 * @param date - The date to format
 * @param baseDate - The base date to compare against (defaults to now)
 * @returns Relative time string or empty string if date is invalid
 */
export const getRelativeTimeString = (
  date: Date | string | number | null | undefined,
  baseDate?: Date | null
): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const baseDateObj = baseDate || new Date();
    
    if (!isValid(dateObj)) return '';
    
    const distance = formatDistance(dateObj, baseDateObj);
    
    return isAfter(dateObj, baseDateObj) ? `in ${distance}` : `${distance} ago`;
  } catch (error) {
    console.error('Error generating relative time string:', error);
    return '';
  }
};

/**
 * Formats a date as a time string (e.g., '9:30 AM')
 * 
 * @param date - The date to format
 * @param formatString - The format pattern to use (defaults to 'h:mm a')
 * @returns Formatted time string or empty string if date is invalid
 */
export const formatTime = (
  date: Date | string | number | null | undefined,
  formatString: string = 'h:mm a'
): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};