/**
 * Validation helpers for the Metronomics Platform frontend
 * 
 * This module provides standardized validation functions for form inputs and data
 * validation across the application, ensuring consistent validation behavior and
 * error messages.
 */

import { 
  VALIDATION_ERRORS 
} from '../constants/errorMessages';
import { 
  ValidationRule, 
  ValidationRules, 
  FormErrors 
} from '../../types/common.types';
import { isValidDate } from './dateTimeHelper';

/**
 * Validates that a value is not empty, null, or undefined
 * 
 * @param value - The value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @returns Error message if validation fails, null otherwise
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return formatString(VALIDATION_ERRORS.REQUIRED_FIELD, [fieldName]);
  }
  return null;
};

/**
 * Validates that a value is a properly formatted email address
 * 
 * @param value - The email value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @returns Error message if validation fails, null otherwise
 */
export const validateEmail = (value: string, fieldName: string): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  // Email regex pattern - checks for basic email format
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(value)) {
    return formatString(VALIDATION_ERRORS.INVALID_EMAIL, [value]);
  }

  return null;
};

/**
 * Validates that a password meets complexity requirements
 * 
 * @param value - The password value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @returns Error message if validation fails, null otherwise
 */
export const validatePassword = (value: string, fieldName: string): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  // Minimum length check
  if (value.length < 8) {
    return VALIDATION_ERRORS.INVALID_PASSWORD;
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(value)) {
    return VALIDATION_ERRORS.INVALID_PASSWORD;
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(value)) {
    return VALIDATION_ERRORS.INVALID_PASSWORD;
  }

  // Check for numbers
  if (!/[0-9]/.test(value)) {
    return VALIDATION_ERRORS.INVALID_PASSWORD;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
    return VALIDATION_ERRORS.INVALID_PASSWORD;
  }

  return null;
};

/**
 * Validates that two password values match
 * 
 * @param password - The password value
 * @param confirmPassword - The confirmation password value
 * @returns Error message if validation fails, null otherwise
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (!password || !confirmPassword) {
    return VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'Password');
  }

  if (password !== confirmPassword) {
    return VALIDATION_ERRORS.PASSWORD_MISMATCH;
  }

  return null;
};

/**
 * Validates that a value is a valid date
 * 
 * @param value - The date value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @returns Error message if validation fails, null otherwise
 */
export const validateDate = (value: string | Date, fieldName: string): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  if (!isValidDate(value)) {
    return formatString(VALIDATION_ERRORS.INVALID_DATE, [String(value)]);
  }

  return null;
};

/**
 * Validates that a date is within a specified range
 * 
 * @param value - The date value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @param minDate - Minimum allowed date (optional)
 * @param maxDate - Maximum allowed date (optional)
 * @returns Error message if validation fails, null otherwise
 */
export const validateDateRange = (
  value: string | Date,
  fieldName: string,
  minDate: Date | null = null,
  maxDate: Date | null = null
): string | null => {
  const dateError = validateDate(value, fieldName);
  if (dateError) {
    return dateError;
  }

  // Convert value to Date object if it's a string
  const date = typeof value === 'string' ? new Date(value) : value;

  // Check if date is before minDate
  if (minDate && date < minDate) {
    return formatString(VALIDATION_ERRORS.INVALID_VALUE_RANGE, [
      fieldName,
      minDate.toLocaleDateString(),
      maxDate ? maxDate.toLocaleDateString() : 'onwards'
    ]);
  }

  // Check if date is after maxDate
  if (maxDate && date > maxDate) {
    return formatString(VALIDATION_ERRORS.INVALID_VALUE_RANGE, [
      fieldName,
      minDate ? minDate.toLocaleDateString() : 'any past date',
      maxDate.toLocaleDateString()
    ]);
  }

  return null;
};

/**
 * Validates that a string value meets minimum length requirements
 * 
 * @param value - The string value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @param minLength - Minimum required length
 * @returns Error message if validation fails, null otherwise
 */
export const validateMinLength = (value: string, fieldName: string, minLength: number): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  if (value.length < minLength) {
    return formatString(VALIDATION_ERRORS.MIN_LENGTH, [fieldName, minLength.toString()]);
  }

  return null;
};

/**
 * Validates that a string value does not exceed maximum length
 * 
 * @param value - The string value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @param maxLength - Maximum allowed length
 * @returns Error message if validation fails, null otherwise
 */
export const validateMaxLength = (value: string, fieldName: string, maxLength: number): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  if (value.length > maxLength) {
    return formatString(VALIDATION_ERRORS.MAX_LENGTH, [fieldName, maxLength.toString()]);
  }

  return null;
};

/**
 * Validates that a numeric value is within a specified range
 * 
 * @param value - The numeric value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns Error message if validation fails, null otherwise
 */
export const validateNumericRange = (
  value: number | string,
  fieldName: string,
  min: number | null = null,
  max: number | null = null
): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  // Convert value to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Check if value is a valid number
  if (isNaN(numValue)) {
    return formatString(VALIDATION_ERRORS.INVALID_FORMAT, [fieldName, 'numeric']);
  }

  // Check if value is less than min
  if (min !== null && numValue < min) {
    return formatString(VALIDATION_ERRORS.INVALID_VALUE_RANGE, [
      fieldName,
      min.toString(),
      max !== null ? max.toString() : 'any greater value'
    ]);
  }

  // Check if value is greater than max
  if (max !== null && numValue > max) {
    return formatString(VALIDATION_ERRORS.INVALID_VALUE_RANGE, [
      fieldName,
      min !== null ? min.toString() : 'any lesser value',
      max.toString()
    ]);
  }

  return null;
};

/**
 * Validates that a string value matches a specified regex pattern
 * 
 * @param value - The string value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @param pattern - RegExp pattern to test against
 * @param errorMessage - Optional custom error message
 * @returns Error message if validation fails, null otherwise
 */
export const validatePattern = (
  value: string,
  fieldName: string,
  pattern: RegExp,
  errorMessage?: string
): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  if (!pattern.test(value)) {
    return errorMessage || formatString(VALIDATION_ERRORS.INVALID_FORMAT, [fieldName, pattern.toString()]);
  }

  return null;
};

/**
 * Validates that a string value is a properly formatted URL
 * 
 * @param value - The URL value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @returns Error message if validation fails, null otherwise
 */
export const validateUrl = (value: string, fieldName: string): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  // URL regex pattern
  const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
  
  if (!urlPattern.test(value)) {
    return formatString(VALIDATION_ERRORS.INVALID_FORMAT, [fieldName, 'URL']);
  }

  return null;
};

/**
 * Validates that a string value is a properly formatted color (hex, rgb, or rgba)
 * 
 * @param value - The color value to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @returns Error message if validation fails, null otherwise
 */
export const validateColor = (value: string, fieldName: string): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) {
    return requiredError;
  }

  // Hex color pattern (3 or 6 digits, with optional # prefix)
  const hexPattern = /^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;
  
  // RGB pattern: rgb(0-255, 0-255, 0-255)
  const rgbPattern = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  
  // RGBA pattern: rgba(0-255, 0-255, 0-255, 0-1)
  const rgbaPattern = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]|0?\.\d+)\s*\)$/;

  if (!hexPattern.test(value) && !rgbPattern.test(value) && !rgbaPattern.test(value)) {
    return formatString(VALIDATION_ERRORS.INVALID_FORMAT, [fieldName, 'color (hex, rgb, or rgba)']);
  }

  return null;
};

/**
 * Utility function to replace placeholders in a string with provided values
 * 
 * @param template - The template string with {n} placeholders
 * @param args - Array of values to replace placeholders with
 * @returns Formatted string with placeholders replaced by values
 */
export const formatString = (template: string, args: any[]): string => {
  return template.replace(/{(\d+)}/g, (match, index) => {
    return typeof args[index] !== 'undefined' ? args[index] : match;
  });
};

/**
 * Validates an entire form against a set of validation rules
 * 
 * @param values - Form values to validate
 * @param rules - Validation rules to apply
 * @returns Object containing validation errors for each field that failed validation
 */
export const validateForm = (values: Record<string, any>, rules: ValidationRules): FormErrors => {
  const errors: FormErrors = {};

  // Iterate through each field in the validation rules
  Object.keys(rules).forEach(fieldName => {
    const rule = rules[fieldName];
    const value = values[fieldName];
    let error: string | null = null;

    // Required validation
    if (rule.required) {
      error = validateRequired(value, fieldName);
      if (error) {
        errors[fieldName] = error;
        return; // Skip remaining validations for this field
      }
    }

    // Skip further validation if the field is not required and the value is empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return;
    }

    // Email validation
    if (rule.email) {
      error = validateEmail(value, fieldName);
      if (error) {
        errors[fieldName] = error;
        return;
      }
    }

    // Min length validation
    if (rule.minLength !== undefined) {
      error = validateMinLength(value, fieldName, rule.minLength);
      if (error) {
        errors[fieldName] = error;
        return;
      }
    }

    // Max length validation
    if (rule.maxLength !== undefined) {
      error = validateMaxLength(value, fieldName, rule.maxLength);
      if (error) {
        errors[fieldName] = error;
        return;
      }
    }

    // Min value validation
    if (rule.min !== undefined) {
      error = validateNumericRange(value, fieldName, rule.min, rule.max);
      if (error) {
        errors[fieldName] = error;
        return;
      }
    }

    // Pattern validation
    if (rule.pattern) {
      error = validatePattern(value, fieldName, rule.pattern);
      if (error) {
        errors[fieldName] = error;
        return;
      }
    }

    // Match validation (typically for password confirmation)
    if (rule.match) {
      error = validatePasswordMatch(values[rule.match], value);
      if (error) {
        errors[fieldName] = error;
        return;
      }
    }

    // Custom validation function
    if (rule.custom) {
      error = rule.custom(value, values);
      if (error) {
        errors[fieldName] = error;
        return;
      }
    }
  });

  return errors;
};