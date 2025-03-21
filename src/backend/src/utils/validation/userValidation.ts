import { z } from 'zod';
import { UserRole } from '../constants/roles';
import { AuthProvider } from '../../types/auth.types';
import { UserStatus } from '../../types/user.types';
import { VALIDATION_ERRORS } from '../constants/errorMessages';

/**
 * Validates email format using a regular expression pattern
 * @param email Email to validate
 * @returns True if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength and format according to security requirements
 * @param password Password to validate
 * @returns True if password meets requirements, false otherwise
 */
export function validatePassword(password: string): boolean {
  // Password must be at least 12 characters long
  if (password.length < 12) {
    return false;
  }

  // Password must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Password must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }

  // Password must contain at least one number
  if (!/[0-9]/.test(password)) {
    return false;
  }

  // Password must contain at least one special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return false;
  }

  return true;
}

// Helper function to create password validation schema
const createPasswordValidator = () => {
  return z.string()
    .min(12, 'Password must be at least 12 characters long')
    .refine(
      (password) => /[A-Z]/.test(password),
      'Password must contain at least one uppercase letter'
    )
    .refine(
      (password) => /[a-z]/.test(password),
      'Password must contain at least one lowercase letter'
    )
    .refine(
      (password) => /[0-9]/.test(password),
      'Password must contain at least one number'
    )
    .refine(
      (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      'Password must contain at least one special character'
    );
};

/**
 * Zod schema for validating email format
 */
export const emailSchema = z.object({
  email: z.string()
    .email(VALIDATION_ERRORS.INVALID_EMAIL.replace('{0}', 'email'))
    .trim()
});

/**
 * Zod schema for validating password format and strength
 */
export const passwordSchema = z.object({
  password: createPasswordValidator()
});

/**
 * Zod schema for validating user creation requests
 */
export const createUserSchema = z.object({
  email: z.string()
    .email(VALIDATION_ERRORS.INVALID_EMAIL.replace('{0}', 'email'))
    .trim(),
  firstName: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'firstName'))
    .trim(),
  lastName: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'lastName'))
    .trim(),
  role: z.nativeEnum(UserRole),
  organizationId: z.string().nullable(),
  authId: z.string(),
  authProvider: z.nativeEnum(AuthProvider),
  photoURL: z.string().nullable(),
  status: z.nativeEnum(UserStatus)
});

/**
 * Zod schema for validating user update requests
 */
export const updateUserSchema = z.object({
  firstName: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'firstName'))
    .trim(),
  lastName: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'lastName'))
    .trim(),
  role: z.nativeEnum(UserRole),
  photoURL: z.string().nullable(),
  status: z.nativeEnum(UserStatus)
});

/**
 * Zod schema for validating user invitation requests
 */
export const userInviteSchema = z.object({
  email: z.string()
    .email(VALIDATION_ERRORS.INVALID_EMAIL.replace('{0}', 'email'))
    .trim(),
  firstName: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'firstName'))
    .trim(),
  lastName: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'lastName'))
    .trim(),
  role: z.nativeEnum(UserRole),
  organizationId: z.string(),
  teamIds: z.array(z.string()).default([])
});

/**
 * Zod schema for validating user preferences update requests
 */
export const updateUserPreferencesSchema = z.object({
  preferences: z.record(z.any())
});

/**
 * Zod schema for validating user filtering parameters
 */
export const userFiltersSchema = z.object({
  organizationId: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  teamId: z.string().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional()
});

/**
 * Zod schema for validating password change requests
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: createPasswordValidator()
});

/**
 * Zod schema for validating password reset requests
 */
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: createPasswordValidator()
});