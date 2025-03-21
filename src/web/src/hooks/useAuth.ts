import { useAuthContext } from '../contexts/AuthContext';
import { AuthContextType } from '../types/auth.types';

/**
 * Custom hook that provides access to authentication state and methods from the AuthContext.
 * 
 * This hook simplifies authentication operations throughout the application by exposing
 * login, logout, registration, and permission checking functionality. It serves as a convenient
 * access point to the authentication system based on Firebase Authentication with support
 * for multiple authentication methods including Google and Microsoft SSO.
 * 
 * @returns {AuthContextType} Authentication context value containing:
 *   - state: Current authentication state (user, isAuthenticated, isLoading, error, permissions)
 *   - login: Function to authenticate with email/password or token
 *   - loginWithGoogle: Function to initiate Google OAuth authentication
 *   - loginWithMicrosoft: Function to initiate Microsoft OAuth authentication
 *   - register: Function to create a new user account
 *   - logout: Function to sign out the current user
 *   - resetPassword: Function to initiate the password reset process
 *   - changePassword: Function to change the current user's password
 *   - refreshToken: Function to refresh the authentication token
 *   - hasPermission: Function to check if the user has a specific permission
 *   - hasRole: Function to check if the user has a specific role or higher in the RBAC hierarchy
 */
export const useAuth = (): AuthContextType => {
  return useAuthContext();
};