/**
 * Authentication types and interfaces for the Metronomics Platform.
 * Defines data structures for authentication flows, user credentials, 
 * and token management throughout the application.
 */

import { UserRole } from '../utils/constants/roles';
import { Permission } from '../utils/constants/permissions';

/**
 * Enum defining the supported authentication providers in the Metronomics Platform.
 * - EMAIL_PASSWORD: Traditional username/password authentication
 * - GOOGLE: Single sign-on with Google accounts
 * - MICROSOFT: Single sign-on with Microsoft accounts
 */
export enum AuthProvider {
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT'
}

/**
 * Interface for login request data.
 * Supports multiple authentication methods with different required fields:
 * - Email/password: requires email and password
 * - SSO providers: requires provider and token (from OAuth flow)
 */
export interface LoginRequest {
  email: string;
  password: string;
  provider: AuthProvider;
  token: string;
}

/**
 * Interface for user registration request data.
 * Basic information required to create a new user account.
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
}

/**
 * Interface for authenticated user data.
 * Contains user profile information returned after successful authentication.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  authId: string;
  profileImageUrl: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for authentication response data.
 * Contains tokens and user information returned after successful authentication.
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/**
 * Interface for JWT token payload structure.
 * Contains user identity and permissions encoded in the JWT.
 * Includes standard JWT fields like issued at (iat) and expiration (exp) timestamps.
 */
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  permissions: Permission[];
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

/**
 * Interface for refresh token request data.
 * Used to obtain a new access token using a valid refresh token.
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Interface for password reset request data.
 * Used to initiate a password reset process via email.
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Interface for password change request data.
 * Used to change a user's password when they know their current password.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}