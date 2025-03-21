import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as dateTimeHelper from '../helpers/dateTimeHelper';
import { DateRange, TimeRange, ComparisonType } from '../../types';
import { addDays, subDays, format, parseISO as dateFnsParseISO } from 'date-fns';

/**
 * Helper function to mock the Date object for consistent testing
 */
const mockDate = (mockDate: string | Date) => {
  // Store a fixed date for testing
  const fixedDate = typeof mockDate === 'string' ? new Date(mockDate) : mockDate;
  
  // Create a mock implementation for Date
  const originalDate = global.Date;
  const mockImplementation = class extends originalDate {
    constructor(...args: any[]) {
      // When called with no arguments, return the fixed date
      if (args.length === 0) {
        return new originalDate(fixedDate);
      }
      
      // Otherwise use the original Date with provided arguments
      return new originalDate(...args);
    }
  };
  
  // Apply the mock
  global.Date = mockImplementation as DateConstructor;
  
  // Also mock the Date.now method
  global.Date.now = () => fixedDate.getTime();
};

/**
 * Helper function to restore the original Date object after testing
 */
const restoreDate = () => {
  // Restore the original Date constructor
  vi.restoreAllMocks();
};

// Test constants
const TEST_DATE_STRING = '2023-04-15T09:30:00.000Z';
const TEST_DATE = new Date(TEST_DATE_STRING);
const TEST_DATE_ISO = '2023-04-15T09:30:00.000Z';

describe('dateTimeHelper', () => {
  // Test formatDate function
  describe('formatDate', () => {
    it('should format a date correctly with the given format', () => {
      const result = dateTimeHelper.formatDate(TEST_DATE, 'yyyy-MM-dd');
      expect(result).toBe('2023-04-15');
    });
    
    it('should handle string date input', () => {
      const result = dateTimeHelper.formatDate(TEST_DATE_STRING, 'yyyy-MM-dd');
      expect(result).toBe('2023-04-15');
    });
    
    it('should handle number timestamp input', () => {
      const timestamp = TEST_DATE.getTime();
      const result = dateTimeHelper.formatDate(timestamp, 'yyyy-MM-dd');
      expect(result).toBe('2023-04-15');
    });
    
    it('should return empty string for null input', () => {
      const result = dateTimeHelper.formatDate(null, 'yyyy-MM-dd');
      expect(result).toBe('');
    });
    
    it('should return empty string for undefined input', () => {
      const result = dateTimeHelper.formatDate(undefined, 'yyyy-MM-dd');
      expect(result).toBe('');
    });
    
    it('should return empty string for invalid date input', () => {
      const result = dateTimeHelper.formatDate('not-a-date', 'yyyy-MM-dd');
      expect(result).toBe('');
    });
  });
  
  // Test parseDate function
  describe('parseDate', () => {
    it('should parse a date string correctly with the given format', () => {
      const result = dateTimeHelper.parseDate('2023-04-15', 'yyyy-MM-dd');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(3); // April is month 3 (0-indexed)
      expect(result?.getDate()).toBe(15);
    });
    
    it('should return null for null input', () => {
      const result = dateTimeHelper.parseDate(null, 'yyyy-MM-dd');
      expect(result).toBeNull();
    });
    
    it('should return null for undefined input', () => {
      const result = dateTimeHelper.parseDate(undefined, 'yyyy-MM-dd');
      expect(result).toBeNull();
    });
    
    it('should return null for invalid date string', () => {
      const result = dateTimeHelper.parseDate('not-a-date', 'yyyy-MM-dd');
      expect(result).toBeNull();
    });
    
    it('should return null for mismatched format', () => {
      const result = dateTimeHelper.parseDate('2023/04/15', 'yyyy-MM-dd');
      expect(result).toBeNull();
    });
  });
  
  // Test formatToISO function
  describe('formatToISO', () => {
    it('should format a date to ISO format correctly', () => {
      const result = dateTimeHelper.formatToISO(TEST_DATE);
      expect(result).toBe(TEST_DATE_ISO);
    });
    
    it('should handle string date input', () => {
      const result = dateTimeHelper.formatToISO(TEST_DATE_STRING);
      expect(result).toBe(TEST_DATE_ISO);
    });
    
    it('should handle number timestamp input', () => {
      const timestamp = TEST_DATE.getTime();
      const result = dateTimeHelper.formatToISO(timestamp);
      expect(result).toBe(TEST_DATE_ISO);
    });
    
    it('should return empty string for null input', () => {
      const result = dateTimeHelper.formatToISO(null);
      expect(result).toBe('');
    });
    
    it('should return empty string for undefined input', () => {
      const result = dateTimeHelper.formatToISO(undefined);
      expect(result).toBe('');
    });
    
    it('should return empty string for invalid date input', () => {
      const result = dateTimeHelper.formatToISO('not-a-date');
      expect(result).toBe('');
    });
  });
  
  // Test parseISO function
  describe('parseISO', () => {
    it('should parse an ISO date string correctly', () => {
      const result = dateTimeHelper.parseISO(TEST_DATE_ISO);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(TEST_DATE_ISO);
    });
    
    it('should return null for null input', () => {
      const result = dateTimeHelper.parseISO(null);
      expect(result).toBeNull();
    });
    
    it('should return null for undefined input', () => {
      const result = dateTimeHelper.parseISO(undefined);
      expect(result).toBeNull();
    });
    
    it('should return null for invalid ISO string', () => {
      const result = dateTimeHelper.parseISO('not-an-iso-date');
      expect(result).toBeNull();
    });
  });
  
  // Test getCurrentDateTime function
  describe('getCurrentDateTime', () => {
    beforeEach(() => {
      mockDate(TEST_DATE);
    });
    
    afterEach(() => {
      restoreDate();
    });
    
    it('should return the current date and time', () => {
      const result = dateTimeHelper.getCurrentDateTime();
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(TEST_DATE_ISO);
    });
  });
  
  // Test getDateTimeForTimeZone function
  describe('getDateTimeForTimeZone', () => {
    it('should convert a date to the specified timezone', () => {
      // This test is limited because timezone conversion varies by environment
      const result = dateTimeHelper.getDateTimeForTimeZone(TEST_DATE, 'America/New_York');
      expect(result).toBeInstanceOf(Date);
    });
    
    it('should handle string date input', () => {
      const result = dateTimeHelper.getDateTimeForTimeZone(TEST_DATE_STRING, 'America/New_York');
      expect(result).toBeInstanceOf(Date);
    });
    
    it('should return null for null input', () => {
      const result = dateTimeHelper.getDateTimeForTimeZone(null, 'America/New_York');
      expect(result).toBeNull();
    });
    
    it('should return null for undefined input', () => {
      const result = dateTimeHelper.getDateTimeForTimeZone(undefined, 'America/New_York');
      expect(result).toBeNull();
    });
    
    it('should return null for invalid date input', () => {
      const result = dateTimeHelper.getDateTimeForTimeZone('not-a-date', 'America/New_York');
      expect(result).toBeNull();
    });
  });
  
  // Test formatDateForTimeZone function
  describe('formatDateForTimeZone', () => {
    it('should format a date for the specified timezone', () => {
      // Timezone formatting is environment-dependent
      const result = dateTimeHelper.formatDateForTimeZone(
        TEST_DATE, 
        'yyyy-MM-dd HH:mm', 
        'America/New_York'
      );
      expect(typeof result).toBe('string');
      expect(result).not.toBe('');
    });
    
    it('should return empty string for null input', () => {
      const result = dateTimeHelper.formatDateForTimeZone(null, 'yyyy-MM-dd', 'America/New_York');
      expect(result).toBe('');
    });
    
    it('should return empty string for undefined input', () => {
      const result = dateTimeHelper.formatDateForTimeZone(undefined, 'yyyy-MM-dd', 'America/New_York');
      expect(result).toBe('');
    });
    
    it('should return empty string for invalid date input', () => {
      const result = dateTimeHelper.formatDateForTimeZone('not-a-date', 'yyyy-MM-dd', 'America/New_York');
      expect(result).toBe('');
    });
  });
  
  // Test addTimeToDate function
  describe('addTimeToDate', () => {
    it('should add days correctly', () => {
      const result = dateTimeHelper.addTimeToDate(TEST_DATE, 5, 'days');
      const expected = addDays(TEST_DATE, 5);
      expect(result?.toISOString()).toBe(expected.toISOString());
    });
    
    it('should add months correctly', () => {
      const result = dateTimeHelper.addTimeToDate(TEST_DATE, 2, 'months');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe((TEST_DATE.getMonth() + 2) % 12);
    });
    
    it('should add years correctly', () => {
      const result = dateTimeHelper.addTimeToDate(TEST_DATE, 3, 'years');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(TEST_DATE.getFullYear() + 3);
    });
    
    it('should handle string date input', () => {
      const result = dateTimeHelper.addTimeToDate(TEST_DATE_STRING, 5, 'days');
      const expected = addDays(TEST_DATE, 5);
      expect(result?.toISOString()).toBe(expected.toISOString());
    });
    
    it('should return null for null input', () => {
      const result = dateTimeHelper.addTimeToDate(null, 5, 'days');
      expect(result).toBeNull();
    });
  });
  
  // Test subtractTimeFromDate function
  describe('subtractTimeFromDate', () => {
    it('should subtract days correctly', () => {
      const result = dateTimeHelper.subtractTimeFromDate(TEST_DATE, 5, 'days');
      const expected = subDays(TEST_DATE, 5);
      expect(result?.toISOString()).toBe(expected.toISOString());
    });
    
    it('should subtract months correctly', () => {
      const result = dateTimeHelper.subtractTimeFromDate(TEST_DATE, 2, 'months');
      expect(result).toBeInstanceOf(Date);
      // Handle month wrapping
      const expectedMonth = (TEST_DATE.getMonth() - 2 + 12) % 12;
      expect(result?.getMonth()).toBe(expectedMonth);
    });
    
    it('should subtract years correctly', () => {
      const result = dateTimeHelper.subtractTimeFromDate(TEST_DATE, 3, 'years');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(TEST_DATE.getFullYear() - 3);
    });
    
    it('should handle string date input', () => {
      const result = dateTimeHelper.subtractTimeFromDate(TEST_DATE_STRING, 5, 'days');
      const expected = subDays(TEST_DATE, 5);
      expect(result?.toISOString()).toBe(expected.toISOString());
    });
    
    it('should return null for null input', () => {
      const result = dateTimeHelper.subtractTimeFromDate(null, 5, 'days');
      expect(result).toBeNull();
    });
  });
  
  // Test getTimeDifference function
  describe('getTimeDifference', () => {
    it('should calculate difference in days correctly', () => {
      const laterDate = addDays(TEST_DATE, 10);
      const result = dateTimeHelper.getTimeDifference(laterDate, TEST_DATE, 'days');
      expect(result).toBe(10);
    });
    
    it('should calculate difference in months correctly', () => {
      // Create a date 2 months later
      const laterDate = new Date(TEST_DATE);
      laterDate.setMonth(TEST_DATE.getMonth() + 2);
      
      const result = dateTimeHelper.getTimeDifference(laterDate, TEST_DATE, 'months');
      expect(result).toBe(2);
    });
    
    it('should calculate difference in years correctly', () => {
      // Create a date 3 years later
      const laterDate = new Date(TEST_DATE);
      laterDate.setFullYear(TEST_DATE.getFullYear() + 3);
      
      const result = dateTimeHelper.getTimeDifference(laterDate, TEST_DATE, 'years');
      expect(result).toBe(3);
    });
    
    it('should handle string date inputs', () => {
      const laterDateStr = addDays(TEST_DATE, 10).toISOString();
      const result = dateTimeHelper.getTimeDifference(laterDateStr, TEST_DATE_STRING, 'days');
      expect(result).toBe(10);
    });
    
    it('should return null if either date is null', () => {
      const result = dateTimeHelper.getTimeDifference(null, TEST_DATE, 'days');
      expect(result).toBeNull();
    });
    
    it('should return null if either date is invalid', () => {
      const result = dateTimeHelper.getTimeDifference('not-a-date', TEST_DATE, 'days');
      expect(result).toBeNull();
    });
  });
  
  // Test getStartOf function
  describe('getStartOf', () => {
    it('should return start of day correctly', () => {
      const result = dateTimeHelper.getStartOf(TEST_DATE, 'day');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
      expect(result?.getSeconds()).toBe(0);
      expect(result?.getMilliseconds()).toBe(0);
    });
    
    it('should return start of month correctly', () => {
      const result = dateTimeHelper.getStartOf(TEST_DATE, 'month');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(1);
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
      expect(result?.getSeconds()).toBe(0);
      expect(result?.getMilliseconds()).toBe(0);
    });
    
    it('should return start of year correctly', () => {
      const result = dateTimeHelper.getStartOf(TEST_DATE, 'year');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(1);
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
      expect(result?.getSeconds()).toBe(0);
      expect(result?.getMilliseconds()).toBe(0);
    });
    
    it('should handle string date input', () => {
      const result = dateTimeHelper.getStartOf(TEST_DATE_STRING, 'day');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(0);
      expect(result?.getMinutes()).toBe(0);
      expect(result?.getSeconds()).toBe(0);
      expect(result?.getMilliseconds()).toBe(0);
    });
    
    it('should return null for null input', () => {
      const result = dateTimeHelper.getStartOf(null, 'day');
      expect(result).toBeNull();
    });
  });
  
  // Test getEndOf function
  describe('getEndOf', () => {
    it('should return end of day correctly', () => {
      const result = dateTimeHelper.getEndOf(TEST_DATE, 'day');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(23);
      expect(result?.getMinutes()).toBe(59);
      expect(result?.getSeconds()).toBe(59);
      // Milliseconds might be 999, but we won't be too strict
    });
    
    it('should return end of month correctly', () => {
      const result = dateTimeHelper.getEndOf(TEST_DATE, 'month');
      expect(result).toBeInstanceOf(Date);
      // April has 30 days
      expect(result?.getDate()).toBe(30);
      expect(result?.getHours()).toBe(23);
      expect(result?.getMinutes()).toBe(59);
      expect(result?.getSeconds()).toBe(59);
    });
    
    it('should return end of year correctly', () => {
      const result = dateTimeHelper.getEndOf(TEST_DATE, 'year');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(11); // December
      expect(result?.getDate()).toBe(31);
      expect(result?.getHours()).toBe(23);
      expect(result?.getMinutes()).toBe(59);
      expect(result?.getSeconds()).toBe(59);
    });
    
    it('should handle string date input', () => {
      const result = dateTimeHelper.getEndOf(TEST_DATE_STRING, 'day');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getHours()).toBe(23);
      expect(result?.getMinutes()).toBe(59);
      expect(result?.getSeconds()).toBe(59);
    });
    
    it('should return null for null input', () => {
      const result = dateTimeHelper.getEndOf(null, 'day');
      expect(result).toBeNull();
    });
  });
  
  // Test isDateBefore function
  describe('isDateBefore', () => {
    it('should return true if first date is before second date', () => {
      const earlierDate = subDays(TEST_DATE, 5);
      const result = dateTimeHelper.isDateBefore(earlierDate, TEST_DATE);
      expect(result).toBe(true);
    });
    
    it('should return false if first date is after second date', () => {
      const laterDate = addDays(TEST_DATE, 5);
      const result = dateTimeHelper.isDateBefore(laterDate, TEST_DATE);
      expect(result).toBe(false);
    });
    
    it('should return false if dates are the same', () => {
      const result = dateTimeHelper.isDateBefore(TEST_DATE, new Date(TEST_DATE_STRING));
      expect(result).toBe(false);
    });
    
    it('should handle string date inputs', () => {
      const earlierDateStr = subDays(TEST_DATE, 5).toISOString();
      const result = dateTimeHelper.isDateBefore(earlierDateStr, TEST_DATE_STRING);
      expect(result).toBe(true);
    });
    
    it('should return false if either date is null', () => {
      const result = dateTimeHelper.isDateBefore(null, TEST_DATE);
      expect(result).toBe(false);
      
      const result2 = dateTimeHelper.isDateBefore(TEST_DATE, null);
      expect(result2).toBe(false);
    });
  });
  
  // Test isDateAfter function
  describe('isDateAfter', () => {
    it('should return true if first date is after second date', () => {
      const laterDate = addDays(TEST_DATE, 5);
      const result = dateTimeHelper.isDateAfter(laterDate, TEST_DATE);
      expect(result).toBe(true);
    });
    
    it('should return false if first date is before second date', () => {
      const earlierDate = subDays(TEST_DATE, 5);
      const result = dateTimeHelper.isDateAfter(earlierDate, TEST_DATE);
      expect(result).toBe(false);
    });
    
    it('should return false if dates are the same', () => {
      const result = dateTimeHelper.isDateAfter(TEST_DATE, new Date(TEST_DATE_STRING));
      expect(result).toBe(false);
    });
    
    it('should handle string date inputs', () => {
      const laterDateStr = addDays(TEST_DATE, 5).toISOString();
      const result = dateTimeHelper.isDateAfter(laterDateStr, TEST_DATE_STRING);
      expect(result).toBe(true);
    });
    
    it('should return false if either date is null', () => {
      const result = dateTimeHelper.isDateAfter(null, TEST_DATE);
      expect(result).toBe(false);
      
      const result2 = dateTimeHelper.isDateAfter(TEST_DATE, null);
      expect(result2).toBe(false);
    });
  });
  
  // Test isSameDate function
  describe('isSameDate', () => {
    it('should return true if dates are the same day', () => {
      // Create another date object for the same day but different time
      const sameDay = new Date(TEST_DATE);
      sameDay.setHours(15, 45, 0);
      
      const result = dateTimeHelper.isSameDate(TEST_DATE, sameDay);
      expect(result).toBe(true);
    });
    
    it('should return false if dates are different days', () => {
      const differentDay = addDays(TEST_DATE, 1);
      const result = dateTimeHelper.isSameDate(TEST_DATE, differentDay);
      expect(result).toBe(false);
    });
    
    it('should handle string date inputs', () => {
      // Create a string with the same date but different time
      const sameDayStr = `2023-04-15T15:45:00.000Z`;
      const result = dateTimeHelper.isSameDate(TEST_DATE_STRING, sameDayStr);
      expect(result).toBe(true);
    });
    
    it('should return false if either date is null', () => {
      const result = dateTimeHelper.isSameDate(null, TEST_DATE);
      expect(result).toBe(false);
      
      const result2 = dateTimeHelper.isSameDate(TEST_DATE, null);
      expect(result2).toBe(false);
    });
  });
  
  // Test getDateRangeForTimeRange function
  describe('getDateRangeForTimeRange', () => {
    it('should return correct date range for day', () => {
      const result = dateTimeHelper.getDateRangeForTimeRange('day', TEST_DATE);
      
      expect(result.startDate.getFullYear()).toBe(TEST_DATE.getFullYear());
      expect(result.startDate.getMonth()).toBe(TEST_DATE.getMonth());
      expect(result.startDate.getDate()).toBe(TEST_DATE.getDate());
      expect(result.startDate.getHours()).toBe(0);
      
      expect(result.endDate.getFullYear()).toBe(TEST_DATE.getFullYear());
      expect(result.endDate.getMonth()).toBe(TEST_DATE.getMonth());
      expect(result.endDate.getDate()).toBe(TEST_DATE.getDate());
      expect(result.endDate.getHours()).toBe(23);
    });
    
    it('should return correct date range for month', () => {
      const result = dateTimeHelper.getDateRangeForTimeRange('month', TEST_DATE);
      
      expect(result.startDate.getFullYear()).toBe(TEST_DATE.getFullYear());
      expect(result.startDate.getMonth()).toBe(TEST_DATE.getMonth());
      expect(result.startDate.getDate()).toBe(1);
      
      expect(result.endDate.getFullYear()).toBe(TEST_DATE.getFullYear());
      expect(result.endDate.getMonth()).toBe(TEST_DATE.getMonth());
      // April has 30 days
      expect(result.endDate.getDate()).toBe(30);
    });
    
    it('should return correct date range for year', () => {
      const result = dateTimeHelper.getDateRangeForTimeRange('year', TEST_DATE);
      
      expect(result.startDate.getFullYear()).toBe(TEST_DATE.getFullYear());
      expect(result.startDate.getMonth()).toBe(0);
      expect(result.startDate.getDate()).toBe(1);
      
      expect(result.endDate.getFullYear()).toBe(TEST_DATE.getFullYear());
      expect(result.endDate.getMonth()).toBe(11);
      expect(result.endDate.getDate()).toBe(31);
    });
    
    it('should use current date when reference date is not provided', () => {
      // Mock current date
      mockDate(TEST_DATE);
      
      const result = dateTimeHelper.getDateRangeForTimeRange('day');
      
      expect(result.startDate.getFullYear()).toBe(TEST_DATE.getFullYear());
      expect(result.startDate.getMonth()).toBe(TEST_DATE.getMonth());
      expect(result.startDate.getDate()).toBe(TEST_DATE.getDate());
      
      restoreDate();
    });
    
    it('should use custom range when provided for custom time range', () => {
      const customRange: DateRange = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };
      
      const result = dateTimeHelper.getDateRangeForTimeRange('custom', TEST_DATE, customRange);
      
      expect(result.startDate).toEqual(customRange.startDate);
      expect(result.endDate).toEqual(customRange.endDate);
    });
  });
  
  // Test getDateRangeForComparison function
  describe('getDateRangeForComparison', () => {
    it('should return correct previous period range', () => {
      const currentRange: DateRange = {
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-30')
      };
      
      const result = dateTimeHelper.getDateRangeForComparison('previous', currentRange);
      
      // Should be March 1-30 (previous month of same duration)
      expect(result.startDate.getFullYear()).toBe(2023);
      expect(result.startDate.getMonth()).toBe(2); // March (0-indexed)
      expect(result.startDate.getDate()).toBe(1);
      
      expect(result.endDate.getFullYear()).toBe(2023);
      expect(result.endDate.getMonth()).toBe(2); // March
      expect(result.endDate.getDate()).toBe(30);
    });
    
    it('should return correct year-over-year range', () => {
      const currentRange: DateRange = {
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-30')
      };
      
      const result = dateTimeHelper.getDateRangeForComparison('yoy', currentRange);
      
      // Should be April 1-30 of previous year
      expect(result.startDate.getFullYear()).toBe(2022);
      expect(result.startDate.getMonth()).toBe(3); // April
      expect(result.startDate.getDate()).toBe(1);
      
      expect(result.endDate.getFullYear()).toBe(2022);
      expect(result.endDate.getMonth()).toBe(3); // April
      expect(result.endDate.getDate()).toBe(30);
    });
    
    it('should return current range for target comparison', () => {
      const currentRange: DateRange = {
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-30')
      };
      
      const result = dateTimeHelper.getDateRangeForComparison('target', currentRange);
      
      // Should be the same as current range
      expect(result).toEqual(currentRange);
    });
    
    it('should use custom range when provided', () => {
      const currentRange: DateRange = {
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-30')
      };
      
      const customRange: DateRange = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };
      
      // Using a comparison type that doesn't match the defined ones to force using the custom range
      const result = dateTimeHelper.getDateRangeForComparison(
        'custom' as ComparisonType, 
        currentRange, 
        customRange
      );
      
      expect(result).toEqual(customRange);
    });
  });
  
  // Test formatDuration function
  describe('formatDuration', () => {
    it('should format short durations with seconds only', () => {
      const duration = 45 * 1000; // 45 seconds
      const result = dateTimeHelper.formatDuration(duration);
      expect(result).toBe('45s');
    });
    
    it('should format minutes and seconds properly', () => {
      const duration = 2 * 60 * 1000 + 30 * 1000; // 2 minutes and 30 seconds
      const result = dateTimeHelper.formatDuration(duration);
      expect(result).toBe('2m 30s');
    });
    
    it('should format hours and minutes properly', () => {
      const duration = 3 * 60 * 60 * 1000 + 45 * 60 * 1000; // 3 hours and 45 minutes
      const result = dateTimeHelper.formatDuration(duration);
      expect(result).toBe('3h 45m');
    });
    
    it('should handle hours only correctly', () => {
      const duration = 5 * 60 * 60 * 1000; // 5 hours
      const result = dateTimeHelper.formatDuration(duration);
      expect(result).toBe('5h');
    });
    
    it('should handle zero duration correctly', () => {
      const result = dateTimeHelper.formatDuration(0);
      expect(result).toBe('0s');
    });
    
    it('should handle negative durations correctly', () => {
      const result = dateTimeHelper.formatDuration(-1000);
      expect(result).toBe('0s');
    });
  });
  
  // Test formatTimeRange function
  describe('formatTimeRange', () => {
    it('should format time range correctly with default format', () => {
      const start = new Date('2023-04-15T09:00:00.000Z');
      const end = new Date('2023-04-15T10:30:00.000Z');
      
      const result = dateTimeHelper.formatTimeRange(start, end);
      
      // The exact format might depend on the environment's locale
      expect(result).toContain('9:00');
      expect(result).toContain('10:30');
      expect(result).toContain(' - '); // The separator
    });
    
    it('should use custom format when provided', () => {
      const start = new Date('2023-04-15T09:00:00.000Z');
      const end = new Date('2023-04-15T10:30:00.000Z');
      
      const result = dateTimeHelper.formatTimeRange(start, end, 'HH:mm');
      
      // 24-hour format
      expect(result).toContain('09:00');
      expect(result).toContain('10:30');
      expect(result).toContain(' - '); // The separator
    });
    
    it('should handle string date inputs', () => {
      const start = '2023-04-15T09:00:00.000Z';
      const end = '2023-04-15T10:30:00.000Z';
      
      const result = dateTimeHelper.formatTimeRange(start, end);
      
      expect(result).toContain('9:00');
      expect(result).toContain('10:30');
      expect(result).toContain(' - '); // The separator
    });
    
    it('should return empty string if start date is null', () => {
      const end = new Date('2023-04-15T10:30:00.000Z');
      const result = dateTimeHelper.formatTimeRange(null, end);
      expect(result).toBe('');
    });
    
    it('should return empty string if end date is null', () => {
      const start = new Date('2023-04-15T09:00:00.000Z');
      const result = dateTimeHelper.formatTimeRange(start, null);
      expect(result).toBe('');
    });
  });
  
  // Test getRecurringDates function
  describe('getRecurringDates', () => {
    it('should generate daily recurring dates correctly', () => {
      const result = dateTimeHelper.getRecurringDates(TEST_DATE, 3, 'daily');
      
      expect(result).toHaveLength(3);
      expect(result[0].toISOString()).toBe(TEST_DATE.toISOString());
      expect(result[1].getDate()).toBe(TEST_DATE.getDate() + 1);
      expect(result[2].getDate()).toBe(TEST_DATE.getDate() + 2);
    });
    
    it('should generate weekly recurring dates correctly', () => {
      const result = dateTimeHelper.getRecurringDates(TEST_DATE, 3, 'weekly');
      
      expect(result).toHaveLength(3);
      expect(result[0].toISOString()).toBe(TEST_DATE.toISOString());
      expect(result[1].getDate()).toBe(TEST_DATE.getDate() + 7);
      expect(result[2].getDate()).toBe(TEST_DATE.getDate() + 14);
    });
    
    it('should generate monthly recurring dates correctly', () => {
      const result = dateTimeHelper.getRecurringDates(TEST_DATE, 3, 'monthly');
      
      expect(result).toHaveLength(3);
      expect(result[0].toISOString()).toBe(TEST_DATE.toISOString());
      expect(result[1].getMonth()).toBe((TEST_DATE.getMonth() + 1) % 12);
      expect(result[2].getMonth()).toBe((TEST_DATE.getMonth() + 2) % 12);
    });
    
    it('should generate yearly recurring dates correctly', () => {
      const result = dateTimeHelper.getRecurringDates(TEST_DATE, 3, 'yearly');
      
      expect(result).toHaveLength(3);
      expect(result[0].toISOString()).toBe(TEST_DATE.toISOString());
      expect(result[1].getFullYear()).toBe(TEST_DATE.getFullYear() + 1);
      expect(result[2].getFullYear()).toBe(TEST_DATE.getFullYear() + 2);
    });
    
    it('should handle custom intervals correctly', () => {
      // Every 2 days
      const result = dateTimeHelper.getRecurringDates(TEST_DATE, 3, 'daily', 2);
      
      expect(result).toHaveLength(3);
      expect(result[0].toISOString()).toBe(TEST_DATE.toISOString());
      expect(result[1].getDate()).toBe(TEST_DATE.getDate() + 2);
      expect(result[2].getDate()).toBe(TEST_DATE.getDate() + 4);
    });
    
    it('should handle string date input', () => {
      const result = dateTimeHelper.getRecurringDates(TEST_DATE_STRING, 2, 'daily');
      
      expect(result).toHaveLength(2);
      expect(result[0].toISOString()).toBe(TEST_DATE.toISOString());
      expect(result[1].getDate()).toBe(TEST_DATE.getDate() + 1);
    });
    
    it('should return empty array for invalid count', () => {
      const result = dateTimeHelper.getRecurringDates(TEST_DATE, 0, 'daily');
      expect(result).toEqual([]);
    });
    
    it('should return empty array for null date', () => {
      const result = dateTimeHelper.getRecurringDates(null, 3, 'daily');
      expect(result).toEqual([]);
    });
  });
  
  // Test isValidDate function
  describe('isValidDate', () => {
    it('should return true for valid Date object', () => {
      const result = dateTimeHelper.isValidDate(TEST_DATE);
      expect(result).toBe(true);
    });
    
    it('should return true for valid date string', () => {
      const result = dateTimeHelper.isValidDate(TEST_DATE_STRING);
      expect(result).toBe(true);
    });
    
    it('should return true for valid timestamp', () => {
      const result = dateTimeHelper.isValidDate(TEST_DATE.getTime());
      expect(result).toBe(true);
    });
    
    it('should return false for invalid date string', () => {
      const result = dateTimeHelper.isValidDate('not-a-date');
      expect(result).toBe(false);
    });
    
    it('should return false for null', () => {
      const result = dateTimeHelper.isValidDate(null);
      expect(result).toBe(false);
    });
    
    it('should return false for undefined', () => {
      const result = dateTimeHelper.isValidDate(undefined);
      expect(result).toBe(false);
    });
    
    it('should return false for non-date objects', () => {
      const result = dateTimeHelper.isValidDate({});
      expect(result).toBe(false);
    });
  });
  
  // Test getRelativeTimeString function
  describe('getRelativeTimeString', () => {
    it('should generate "ago" string for past date', () => {
      const pastDate = subDays(new Date(), 2);
      const result = dateTimeHelper.getRelativeTimeString(pastDate);
      
      expect(result).toContain('ago');
      expect(result).toContain('2 days');
    });
    
    it('should generate "in" string for future date', () => {
      const futureDate = addDays(new Date(), 3);
      const result = dateTimeHelper.getRelativeTimeString(futureDate);
      
      expect(result).toContain('in');
      expect(result).toContain('3 days');
    });
    
    it('should handle custom base date', () => {
      const date = new Date('2023-04-15');
      const baseDate = new Date('2023-04-10');
      
      const result = dateTimeHelper.getRelativeTimeString(date, baseDate);
      
      expect(result).toContain('in');
      expect(result).toContain('5 days');
    });
    
    it('should handle string date input', () => {
      const pastDate = subDays(new Date(), 2).toISOString();
      const result = dateTimeHelper.getRelativeTimeString(pastDate);
      
      expect(result).toContain('ago');
      expect(result).toContain('2 days');
    });
    
    it('should return empty string for null input', () => {
      const result = dateTimeHelper.getRelativeTimeString(null);
      expect(result).toBe('');
    });
    
    it('should return empty string for invalid date', () => {
      const result = dateTimeHelper.getRelativeTimeString('not-a-date');
      expect(result).toBe('');
    });
  });
  
  // Test formatTime function
  describe('formatTime', () => {
    it('should format time correctly with default format', () => {
      const date = new Date('2023-04-15T14:30:00.000Z');
      const result = dateTimeHelper.formatTime(date);
      
      expect(result).toContain('2:30');
      // Could be PM or pm depending on locale
      expect(result.toLowerCase()).toContain('pm');
    });
    
    it('should use custom format when provided', () => {
      const date = new Date('2023-04-15T14:30:00.000Z');
      const result = dateTimeHelper.formatTime(date, 'HH:mm');
      
      // 24-hour format
      expect(result).toBe('14:30');
    });
    
    it('should handle string date input', () => {
      const dateStr = '2023-04-15T14:30:00.000Z';
      const result = dateTimeHelper.formatTime(dateStr);
      
      expect(result).toContain('2:30');
      expect(result.toLowerCase()).toContain('pm');
    });
    
    it('should return empty string for null input', () => {
      const result = dateTimeHelper.formatTime(null);
      expect(result).toBe('');
    });
    
    it('should return empty string for undefined input', () => {
      const result = dateTimeHelper.formatTime(undefined);
      expect(result).toBe('');
    });
    
    it('should return empty string for invalid date', () => {
      const result = dateTimeHelper.formatTime('not-a-date');
      expect(result).toBe('');
    });
  });
});