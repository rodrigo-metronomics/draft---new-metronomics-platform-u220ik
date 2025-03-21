import {
  format,
  parse,
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
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfMonth,
  endOfYear,
  isValid,
  isBefore,
  isAfter,
  isSameDay,
  parseISO,
  formatISO,
} from 'date-fns'; // version ^2.30.0
import { format as formatTz, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'; // version ^2.0.0

/**
 * Formats a date into a string using the specified format
 * @param date The date to format
 * @param formatString The format string to use
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, formatString: string): string {
  // Convert string or number date to Date object if needed
  const dateObj = typeof date === 'string' || typeof date === 'number' ? parseISO(date.toString()) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    return '';
  }
  
  // Format the date with the provided format string
  return format(dateObj, formatString);
}

/**
 * Parses a date string into a Date object using the specified format
 * @param dateString The date string to parse
 * @param formatString The format string to use
 * @returns Parsed Date object or null if invalid
 */
export function parseDate(dateString: string, formatString: string): Date | null {
  try {
    // Parse the date string using date-fns parse function
    const parsedDate = parse(dateString, formatString, new Date());
    
    // Check if the resulting date is valid
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  } catch (error) {
    // Handle any parsing errors
    console.error('Error parsing date:', error);
  }
  
  return null;
}

/**
 * Returns the current date and time
 * @returns Current date and time
 */
export function getCurrentDateTime(): Date {
  return new Date();
}

/**
 * Returns the current date and time for a specific timezone
 * @param timeZone The timezone to use (e.g., 'America/New_York')
 * @returns Current date and time in the specified timezone
 */
export function getDateTimeForTimeZone(timeZone: string): Date {
  const date = new Date();
  return utcToZonedTime(date, timeZone);
}

/**
 * Adds a specified amount of time to a date
 * @param date The date to add time to
 * @param amount The amount of time to add
 * @param unit The unit of time to add (days, months, years)
 * @returns New date with the added time
 */
export function addTimeToDate(date: Date | string | number, amount: number, unit: string): Date {
  // Convert string or number date to Date object if needed
  const dateObj = typeof date === 'string' || typeof date === 'number' ? parseISO(date.toString()) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Add time based on the unit
  switch (unit.toLowerCase()) {
    case 'days':
    case 'day':
      return addDays(dateObj, amount);
    case 'months':
    case 'month':
      return addMonths(dateObj, amount);
    case 'years':
    case 'year':
      return addYears(dateObj, amount);
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 * Subtracts a specified amount of time from a date
 * @param date The date to subtract time from
 * @param amount The amount of time to subtract
 * @param unit The unit of time to subtract (days, months, years)
 * @returns New date with the subtracted time
 */
export function subtractTimeFromDate(date: Date | string | number, amount: number, unit: string): Date {
  // Convert string or number date to Date object if needed
  const dateObj = typeof date === 'string' || typeof date === 'number' ? parseISO(date.toString()) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Subtract time based on the unit
  switch (unit.toLowerCase()) {
    case 'days':
    case 'day':
      return subDays(dateObj, amount);
    case 'months':
    case 'month':
      return subMonths(dateObj, amount);
    case 'years':
    case 'year':
      return subYears(dateObj, amount);
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 * Calculates the difference between two dates in the specified unit
 * @param date1 The first date
 * @param date2 The second date
 * @param unit The unit to calculate the difference in (days, months, years)
 * @returns Difference between dates in the specified unit
 */
export function getTimeDifference(
  date1: Date | string | number,
  date2: Date | string | number,
  unit: string
): number {
  // Convert string or number dates to Date objects if needed
  const dateObj1 = typeof date1 === 'string' || typeof date1 === 'number' ? parseISO(date1.toString()) : date1;
  const dateObj2 = typeof date2 === 'string' || typeof date2 === 'number' ? parseISO(date2.toString()) : date2;
  
  // Check if both dates are valid
  if (!isValid(dateObj1) || !isValid(dateObj2)) {
    throw new Error('Invalid date provided');
  }
  
  // Calculate difference based on the unit
  switch (unit.toLowerCase()) {
    case 'days':
    case 'day':
      return differenceInDays(dateObj1, dateObj2);
    case 'months':
    case 'month':
      return differenceInMonths(dateObj1, dateObj2);
    case 'years':
    case 'year':
      return differenceInYears(dateObj1, dateObj2);
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 * Returns the start of a specified time unit (day, month, year) for a given date
 * @param date The date to get the start of
 * @param unit The unit to get the start of (day, month, year)
 * @returns Date representing the start of the specified unit
 */
export function getStartOf(date: Date | string | number, unit: string): Date {
  // Convert string or number date to Date object if needed
  const dateObj = typeof date === 'string' || typeof date === 'number' ? parseISO(date.toString()) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Get start based on the unit
  switch (unit.toLowerCase()) {
    case 'day':
      return startOfDay(dateObj);
    case 'month':
      return startOfMonth(dateObj);
    case 'year':
      return startOfYear(dateObj);
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 * Returns the end of a specified time unit (day, month, year) for a given date
 * @param date The date to get the end of
 * @param unit The unit to get the end of (day, month, year)
 * @returns Date representing the end of the specified unit
 */
export function getEndOf(date: Date | string | number, unit: string): Date {
  // Convert string or number date to Date object if needed
  const dateObj = typeof date === 'string' || typeof date === 'number' ? parseISO(date.toString()) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Get end based on the unit
  switch (unit.toLowerCase()) {
    case 'day':
      return endOfDay(dateObj);
    case 'month':
      return endOfMonth(dateObj);
    case 'year':
      return endOfYear(dateObj);
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 * Checks if a date is before another date
 * @param date The date to check
 * @param dateToCompare The date to compare against
 * @returns True if date is before dateToCompare
 */
export function isDateBefore(date: Date | string | number, dateToCompare: Date | string | number): boolean {
  // Convert string or number dates to Date objects if needed
  const dateObj = typeof date === 'string' || typeof date === 'number' ? parseISO(date.toString()) : date;
  const compareObj = typeof dateToCompare === 'string' || typeof dateToCompare === 'number'
    ? parseISO(dateToCompare.toString())
    : dateToCompare;
  
  // Check if both dates are valid
  if (!isValid(dateObj) || !isValid(compareObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Check if date is before dateToCompare
  return isBefore(dateObj, compareObj);
}

/**
 * Checks if a date is after another date
 * @param date The date to check
 * @param dateToCompare The date to compare against
 * @returns True if date is after dateToCompare
 */
export function isDateAfter(date: Date | string | number, dateToCompare: Date | string | number): boolean {
  // Convert string or number dates to Date objects if needed
  const dateObj = typeof date === 'string' || typeof date === 'number' ? parseISO(date.toString()) : date;
  const compareObj = typeof dateToCompare === 'string' || typeof dateToCompare === 'number'
    ? parseISO(dateToCompare.toString())
    : dateToCompare;
  
  // Check if both dates are valid
  if (!isValid(dateObj) || !isValid(compareObj)) {
    throw new Error('Invalid date provided');
  }
  
  // Check if date is after dateToCompare
  return isAfter(dateObj, compareObj);
}

/**
 * Checks if two dates are the same day
 * @param date1 The first date
 * @param date2 The second date
 * @returns True if dates are the same day
 */
export function isSameDate(date1: Date | string | number, date2: Date | string | number): boolean {
  // Convert string or number dates to Date objects if needed
  const dateObj1 = typeof date1 === 'string' || typeof date1 === 'number' ? parseISO(date1.toString()) : date1;
  const dateObj2 = typeof date2 === 'string' || typeof date2 === 'number' ? parseISO(date2.toString()) : date2;
  
  // Check if both dates are valid
  if (!isValid(dateObj1) || !isValid(dateObj2)) {
    throw new Error('Invalid date provided');
  }
  
  // Check if dates are the same day
  return isSameDay(dateObj1, dateObj2);
}

/**
 * Returns the start and end dates for a comparison type (YTD, M/M, Y/Y)
 * @param comparisonType The type of comparison (YEAR_TO_DATE, MONTH_TO_MONTH, YEAR_TO_YEAR, CUSTOM)
 * @param referenceDate The reference date for the comparison (defaults to current date)
 * @returns Object containing current and previous period date ranges
 */
export function getDateRangeForComparison(
  comparisonType: string,
  referenceDate?: Date | string | number
): {
  currentPeriod: { start: Date; end: Date };
  previousPeriod: { start: Date; end: Date };
} {
  // Convert string or number referenceDate to Date object if needed, or use current date
  const refDate = referenceDate
    ? (typeof referenceDate === 'string' || typeof referenceDate === 'number'
      ? parseISO(referenceDate.toString())
      : referenceDate)
    : new Date();
  
  // If referenceDate is invalid, use current date
  if (!isValid(refDate)) {
    throw new Error('Invalid reference date provided');
  }
  
  // Calculate date ranges based on comparison type
  switch (comparisonType.toUpperCase()) {
    case 'YEAR_TO_DATE': {
      const currentStart = startOfYear(refDate);
      const currentEnd = refDate;
      const previousStart = startOfYear(subYears(refDate, 1));
      const previousEnd = subYears(refDate, 1);
      
      return {
        currentPeriod: { start: currentStart, end: currentEnd },
        previousPeriod: { start: previousStart, end: previousEnd },
      };
    }
    
    case 'MONTH_TO_MONTH': {
      const currentStart = startOfMonth(refDate);
      const currentEnd = refDate;
      const previousStart = startOfMonth(subMonths(refDate, 1));
      const previousEnd = endOfMonth(subMonths(refDate, 1));
      
      return {
        currentPeriod: { start: currentStart, end: currentEnd },
        previousPeriod: { start: previousStart, end: previousEnd },
      };
    }
    
    case 'YEAR_TO_YEAR': {
      const currentStart = startOfYear(refDate);
      const currentEnd = refDate;
      const previousStart = startOfYear(subYears(refDate, 1));
      const previousEnd = subYears(refDate, 1);
      
      return {
        currentPeriod: { start: currentStart, end: currentEnd },
        previousPeriod: { start: previousStart, end: previousEnd },
      };
    }
    
    case 'CUSTOM':
    default:
      // For custom ranges, return null values to be set by the caller
      return {
        currentPeriod: { start: new Date(), end: new Date() },
        previousPeriod: { start: new Date(), end: new Date() },
      };
  }
}

/**
 * Formats a duration in milliseconds into a human-readable string
 * @param durationMs Duration in milliseconds
 * @returns Formatted duration string (e.g., '2h 30m')
 */
export function formatDuration(durationMs: number): string {
  // Calculate hours, minutes, and seconds
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  
  // Format the duration string
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Formats a time range between two dates
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @param formatString The format string to use
 * @returns Formatted time range string
 */
export function formatTimeRange(
  startDate: Date | string | number,
  endDate: Date | string | number,
  formatString: string
): string {
  // Convert string or number dates to Date objects if needed
  const startObj = typeof startDate === 'string' || typeof startDate === 'number'
    ? parseISO(startDate.toString())
    : startDate;
  const endObj = typeof endDate === 'string' || typeof endDate === 'number'
    ? parseISO(endDate.toString())
    : endDate;
  
  // Check if both dates are valid
  if (!isValid(startObj) || !isValid(endObj)) {
    return '';
  }
  
  // Format the start and end dates
  const formattedStart = formatDate(startObj, formatString);
  const formattedEnd = formatDate(endObj, formatString);
  
  // Return the formatted range
  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Generates a series of dates based on a recurring pattern
 * @param startDate The start date of the series
 * @param recurringPattern The pattern for recurrence (daily, weekly, monthly)
 * @param occurrences The number of occurrences to generate
 * @returns Array of dates based on the recurring pattern
 */
export function getRecurringDates(
  startDate: Date | string | number,
  recurringPattern: string,
  occurrences: number
): Array<Date> {
  // Convert string or number startDate to Date object if needed
  const start = typeof startDate === 'string' || typeof startDate === 'number'
    ? parseISO(startDate.toString())
    : startDate;
  
  // Check if startDate is valid
  if (!isValid(start)) {
    throw new Error('Invalid start date provided');
  }
  
  // Array to store the generated dates
  const dates: Date[] = [new Date(start)];
  
  // Generate dates based on the recurring pattern
  const pattern = recurringPattern.toLowerCase();
  
  for (let i = 1; i < occurrences; i++) {
    let nextDate: Date;
    
    if (pattern.includes('daily')) {
      nextDate = addDays(start, i);
    } else if (pattern.includes('weekly')) {
      nextDate = addDays(start, i * 7);
    } else if (pattern.includes('monthly')) {
      nextDate = addMonths(start, i);
    } else if (pattern.includes('yearly')) {
      nextDate = addYears(start, i);
    } else {
      throw new Error(`Unsupported recurring pattern: ${recurringPattern}`);
    }
    
    dates.push(nextDate);
  }
  
  return dates;
}