import { UserRole } from '../utils/constants/roles';
import { Permission } from '../utils/constants/permissions';

/**
 * Enum defining the supported authentication providers in the Metronomics Platform.
 * Used to specify which authentication method is being used during login.
 */
export enum AuthProvider {
  /** Standard email and password authentication */
  EMAIL_PASSWORD = 'email_password',
  /** Google OAuth authentication */
  GOOGLE = 'google',
  /** Microsoft OAuth authentication */
  MICROSOFT = 'microsoft'
}

/**
 * Interface for login request data with support for different authentication methods.
 * Contains all necessary information to authenticate a user with any supported provider.
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  /** User's password (only required for EMAIL_PASSWORD provider) */
  password: string;
  /** Authentication provider to use */
  provider: AuthProvider;
  /** OAuth token (only required for GOOGLE or MICROSOFT providers) */
  token?: string;
}

/**
 * Interface for user registration request data.
 * Contains all necessary information to create a new user account.
 */
export interface RegisterRequest {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** ID of the organization the user belongs to */
  organizationId: string;
}

/**
 * Interface for authenticated user data returned after successful authentication.
 * Contains user profile information and metadata.
 */
export interface AuthUser {
  /** Unique identifier for the user in our system */
  id: string;
  /** User's email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's role in the system determining their permissions */
  role: UserRole;
  /** ID of the organization the user belongs to */
  organizationId: string;
  /** External authentication provider's user ID (e.g., Firebase UID) */
  authId: string;
  /** URL to the user's profile image, if available */
  profileImageUrl: string | null;
  /** Timestamp of the user's last successful login */
  lastLogin: Date;
  /** Timestamp when the user account was created */
  createdAt: Date;
  /** Timestamp when the user account was last updated */
  updatedAt: Date;
}

/**
 * Interface for authentication response data containing tokens and user information.
 * Returned after successful authentication to establish a user session.
 */
export interface AuthResponse {
  /** JWT access token for authenticating API requests */
  accessToken: string;
  /** Refresh token for obtaining a new access token when it expires */
  refreshToken: string;
  /** Token expiration time in seconds */
  expiresIn: number;
  /** Authenticated user information */
  user: AuthUser;
}

/**
 * Interface for JWT token payload structure containing user identity and permissions.
 * This represents the decoded content of the JWT access token.
 */
export interface JWTPayload {
  /** User's unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's role in the system */
  role: UserRole;
  /** ID of the organization the user belongs to */
  organizationId: string;
  /** Array of permissions granted to the user */
  permissions: Permission[];
  /** Token issued at timestamp (Unix time) */
  iat: number;
  /** Token expiration timestamp (Unix time) */
  exp: number;
}

/**
 * Interface for refresh token request data.
 * Used to obtain a new access token when the current one expires.
 */
export interface RefreshTokenRequest {
  /** The refresh token obtained during authentication */
  refreshToken: string;
}

/**
 * Interface for password reset request data.
 * Used to initiate the password reset process.
 */
export interface PasswordResetRequest {
  /** Email address of the account to reset password for */
  email: string;
}

/**
 * Interface for password change request data.
 * Used when a user wants to change their password while logged in.
 */
export interface ChangePasswordRequest {
  /** User's current password for verification */
  currentPassword: string;
  /** New password to set */
  newPassword: string;
}

/**
 * Interface for authentication state in the application.
 * Represents the current authentication status and user information.
 */
export interface AuthState {
  /** Currently authenticated user, or null if not authenticated */
  user: AuthUser | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether authentication operations are in progress */
  isLoading: boolean;
  /** Error message from the last authentication operation, or null if no error */
  error: string | null;
  /** Array of permissions granted to the current user */
  permissions: Permission[];
}

/**
 * Interface for the authentication context providing state and methods for authentication operations.
 * Used to provide authentication functionality throughout the application.
 */
export interface AuthContextType {
  /** Current authentication state */
  state: AuthState;
  /** Login with email/password or SSO token */
  login: (credentials: LoginRequest) => Promise<void>;
  /** Initiate Google OAuth authentication flow */
  loginWithGoogle: () => Promise<void>;
  /** Initiate Microsoft OAuth authentication flow */
  loginWithMicrosoft: () => Promise<void>;
  /** Register a new user account */
  register: (userData: RegisterRequest) => Promise<void>;
  /** Log out the current user */
  logout: () => Promise<void>;
  /** Initiate password reset process for a given email */
  resetPassword: (email: string) => Promise<void>;
  /** Change the current user's password */
  changePassword: (passwordData: ChangePasswordRequest) => Promise<void>;
  /** Refresh the access token using the refresh token */
  refreshToken: () => Promise<void>;
  /** Check if the current user has a specific permission */
  hasPermission: (permission: Permission) => boolean;
  /** Check if the current user has a specific role */
  hasRole: (role: UserRole) => boolean;
}