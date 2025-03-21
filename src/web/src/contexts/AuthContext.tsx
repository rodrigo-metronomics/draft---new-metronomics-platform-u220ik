import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import jwtDecode from 'jwt-decode'; // v3.1.2
import { onAuthStateChanged } from 'firebase/auth'; // v9.0.0

// Types
import {
  AuthState, AuthContextType, LoginRequest, RegisterRequest, ChangePasswordRequest,
  AuthResponse, AuthUser, AuthProvider as AuthProviderEnum, Permission, JWTPayload
} from '../types/auth.types';

// Constants and Helpers
import { UserRole, isRoleAtLeast } from '../utils/constants/roles';
import { DEFAULT_PERMISSIONS, hasPermission } from '../utils/constants/permissions';

// Firebase Authentication
import {
  signInWithEmailPassword, signInWithGoogle, signInWithMicrosoft,
  createUser, signOut, resetPassword as resetPasswordFirebase, changePassword as changePasswordFirebase,
  getCurrentUser, getIdTokenForUser
} from '../services/firebase/firebaseAuth';

// API Service
import {
  login as loginApi, loginWithFirebaseToken, register as registerApi, refreshToken as refreshTokenApi,
  logout as logoutApi, resetPassword as resetPasswordApi, changePassword as changePasswordApi
} from '../services/api/authApi';

// Local Storage
import {
  setItemWithPrefix, getItemWithPrefix, removeItemWithPrefix
} from '../utils/helpers/localStorageHelper';

/**
 * Key used for storing authentication data in local storage
 */
const AUTH_STORAGE_KEY = 'auth_session';

/**
 * Interval in milliseconds for refreshing the authentication token
 * Set to 5 minutes (300,000ms) to refresh tokens before they expire
 */
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;

/**
 * React Context for authentication state and methods.
 * Provides authentication functionality throughout the application.
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Initial authentication state with no user and no authentication
 */
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: []
};

/**
 * Authentication Provider Component
 * 
 * Manages authentication state and provides authentication-related
 * functionality throughout the Metronomics Platform.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to the auth context
 */
const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  /**
   * Effect for initializing authentication state from local storage
   * Runs once on component mount
   */
  useEffect(() => {
    const initAuth = async () => {
      // Check for stored session
      const storedAuth = getItemWithPrefix(AUTH_STORAGE_KEY);
      if (storedAuth) {
        try {
          // Set authenticated state from storage
          setAuthState({
            user: storedAuth.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            permissions: storedAuth.permissions || []
          });
        } catch (error) {
          console.error('Error restoring authentication state:', error);
          // Clear invalid storage and reset to initial state
          removeItemWithPrefix(AUTH_STORAGE_KEY);
          setAuthState(initialAuthState);
        }
      }
    };

    initAuth();
  }, []);

  /**
   * Effect for setting up token refresh interval
   * Runs when authentication state changes
   */
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;

    if (authState.isAuthenticated) {
      refreshInterval = setInterval(() => {
        refreshTokenHandler();
      }, TOKEN_REFRESH_INTERVAL);
    }

    // Clean up interval on unmount or when auth state changes
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [authState.isAuthenticated]);

  /**
   * Handles successful authentication by storing tokens and updating state
   * 
   * @param {AuthResponse} authResponse - Authentication response from the API
   */
  const handleAuthSuccess = (authResponse: AuthResponse) => {
    try {
      const { accessToken, refreshToken, expiresIn, user } = authResponse;
      
      // Extract permissions from JWT
      const decodedToken = jwtDecode<JWTPayload>(accessToken);
      const permissions = decodedToken.permissions || [];

      // Create auth data for storage
      const authData = {
        accessToken,
        refreshToken,
        expiresIn,
        user,
        permissions
      };

      // Store in local storage
      setItemWithPrefix(AUTH_STORAGE_KEY, authData);

      // Update state
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions
      });
    } catch (error) {
      console.error('Error handling authentication success:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to process authentication response'
      }));
    }
  };

  /**
   * Authenticates a user with email/password or token
   * 
   * @param {LoginRequest} credentials - User login credentials
   * @returns {Promise<void>} Promise that resolves when authentication is complete
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      let firebaseToken: string | null = null;

      // If token is provided (for SSO flow), use it directly
      if (credentials.token) {
        // For SSO login with token
        const tokenResponse = await loginWithFirebaseToken(
          credentials.token,
          credentials.provider as AuthProviderEnum.GOOGLE | AuthProviderEnum.MICROSOFT
        );
        
        if (tokenResponse.success) {
          handleAuthSuccess(tokenResponse.data);
        } else {
          throw new Error(tokenResponse.message || 'Authentication failed');
        }
      } else {
        // For email/password login
        const userCredential = await signInWithEmailPassword(
          credentials.email,
          credentials.password
        );

        // Get Firebase ID token
        firebaseToken = await getIdTokenForUser(userCredential.user);

        if (!firebaseToken) {
          throw new Error('Failed to get authentication token');
        }

        // Login to our backend API with the Firebase token
        const response = await loginApi({
          email: credentials.email,
          password: '', // Not needed when using token
          provider: AuthProviderEnum.EMAIL_PASSWORD,
          token: firebaseToken
        });

        if (response.success) {
          handleAuthSuccess(response.data);
        } else {
          throw new Error(response.message || 'Authentication failed');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  };

  /**
   * Authenticates a user using Google SSO
   * 
   * @returns {Promise<void>} Promise that resolves when authentication is complete
   */
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Sign in with Google via Firebase
      const userCredential = await signInWithGoogle();

      // Get Firebase ID token
      const firebaseToken = await getIdTokenForUser(userCredential.user);

      if (!firebaseToken) {
        throw new Error('Failed to get authentication token');
      }

      // Login to our backend API with the Firebase token
      const response = await loginWithFirebaseToken(firebaseToken, AuthProviderEnum.GOOGLE);

      if (response.success) {
        handleAuthSuccess(response.data);
      } else {
        throw new Error(response.message || 'Google authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  };

  /**
   * Authenticates a user using Microsoft SSO
   * 
   * @returns {Promise<void>} Promise that resolves when authentication is complete
   */
  const loginWithMicrosoft = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Sign in with Microsoft via Firebase
      const userCredential = await signInWithMicrosoft();

      // Get Firebase ID token
      const firebaseToken = await getIdTokenForUser(userCredential.user);

      if (!firebaseToken) {
        throw new Error('Failed to get authentication token');
      }

      // Login to our backend API with the Firebase token
      const response = await loginWithFirebaseToken(firebaseToken, AuthProviderEnum.MICROSOFT);

      if (response.success) {
        handleAuthSuccess(response.data);
      } else {
        throw new Error(response.message || 'Microsoft authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Microsoft authentication failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  };

  /**
   * Registers a new user with the provided information
   * 
   * @param {RegisterRequest} userData - User registration data
   * @returns {Promise<void>} Promise that resolves when registration is complete
   */
  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Create user in Firebase
      const userCredential = await createUser(userData.email, userData.password);

      // Get Firebase ID token
      const firebaseToken = await getIdTokenForUser(userCredential.user);

      if (!firebaseToken) {
        throw new Error('Failed to get authentication token');
      }

      // Register with our backend API
      const response = await registerApi(userData, firebaseToken);

      if (response.success) {
        handleAuthSuccess(response.data);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      
      // Attempt to clean up Firebase user if backend registration fails
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          await signOut();
        }
      } catch (cleanupError) {
        console.error('Failed to clean up Firebase user after registration error:', cleanupError);
      }
    }
  };

  /**
   * Logs out the current user
   * 
   * @returns {Promise<void>} Promise that resolves when logout is complete
   */
  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get the refresh token to invalidate on the server
      const storedAuth = getItemWithPrefix(AUTH_STORAGE_KEY);
      const refreshToken = storedAuth?.refreshToken;

      if (refreshToken) {
        // Logout from backend to invalidate token
        await logoutApi(refreshToken);
      }

      // Sign out from Firebase
      await signOut();

      // Clear local storage and reset state
      removeItemWithPrefix(AUTH_STORAGE_KEY);
      setAuthState(initialAuthState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      
      // Force logout even if the API call fails
      removeItemWithPrefix(AUTH_STORAGE_KEY);
      setAuthState(initialAuthState);
    }
  };

  /**
   * Initiates a password reset process for the specified email
   * 
   * @param {string} email - Email address to send the password reset link to
   * @returns {Promise<void>} Promise that resolves when password reset is initiated
   */
  const resetPasswordHandler = async (email: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Send password reset email via Firebase
      await resetPasswordFirebase(email);
      
      // Call backend to ensure any additional backend processes run
      await resetPasswordApi(email);

      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  };

  /**
   * Changes the password for the current user
   * 
   * @param {ChangePasswordRequest} passwordData - Object containing current and new password
   * @returns {Promise<void>} Promise that resolves when password is changed
   */
  const changePasswordHandler = async (passwordData: ChangePasswordRequest): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if user is authenticated
      if (!authState.isAuthenticated || !authState.user) {
        throw new Error('User not authenticated');
      }

      // Change password in Firebase
      await changePasswordFirebase(passwordData.currentPassword, passwordData.newPassword);

      // Get token for API call
      const storedAuth = getItemWithPrefix(AUTH_STORAGE_KEY);
      const accessToken = storedAuth?.accessToken;

      if (!accessToken) {
        throw new Error('Authentication token not found');
      }

      // Change password in backend
      await changePasswordApi(passwordData, accessToken);

      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  };

  /**
   * Refreshes the access token using the refresh token
   * 
   * @returns {Promise<void>} Promise that resolves when token is refreshed
   */
  const refreshTokenHandler = async (): Promise<void> => {
    try {
      // Skip if not authenticated
      if (!authState.isAuthenticated) {
        return;
      }

      const storedAuth = getItemWithPrefix(AUTH_STORAGE_KEY);
      const currentRefreshToken = storedAuth?.refreshToken;

      if (!currentRefreshToken) {
        console.error('Refresh token not found');
        return;
      }

      // Call API to refresh token
      const response = await refreshTokenApi(currentRefreshToken);

      if (response.success) {
        // Update state and storage with new tokens
        const { accessToken, refreshToken, expiresIn, user } = response.data;
        
        // Extract permissions from JWT
        const decodedToken = jwtDecode<JWTPayload>(accessToken);
        const permissions = decodedToken.permissions || [];

        // Create updated auth data
        const updatedAuthData = {
          accessToken,
          refreshToken,
          expiresIn,
          user,
          permissions
        };

        // Update local storage
        setItemWithPrefix(AUTH_STORAGE_KEY, updatedAuthData);

        // Update state
        setAuthState(prev => ({
          ...prev,
          user,
          permissions,
          isAuthenticated: true
        }));
      } else {
        // If refresh fails, log user out
        console.error('Token refresh failed:', response.message);
        logout();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Depending on the error, may want to log the user out
      // logout();
    }
  };

  /**
   * Checks if the current user has a specific permission
   * 
   * @param {Permission} permission - The permission to check
   * @returns {boolean} True if the user has the permission, false otherwise
   */
  const hasPermissionCheck = useCallback(
    (permission: Permission): boolean => {
      if (!authState.isAuthenticated) {
        return false;
      }
      return hasPermission(authState.permissions, permission);
    },
    [authState.isAuthenticated, authState.permissions]
  );

  /**
   * Checks if the current user has a specific role or higher
   * 
   * @param {UserRole} role - The role to check
   * @returns {boolean} True if the user has the role or higher, false otherwise
   */
  const hasRoleCheck = useCallback(
    (role: UserRole): boolean => {
      if (!authState.isAuthenticated || !authState.user) {
        return false;
      }
      return isRoleAtLeast(authState.user.role, role);
    },
    [authState.isAuthenticated, authState.user]
  );

  // Context value object with current auth state and all auth methods
  const contextValue: AuthContextType = {
    state: authState,
    login,
    loginWithGoogle,
    loginWithMicrosoft,
    register,
    logout,
    resetPassword: resetPasswordHandler,
    changePassword: changePasswordHandler,
    refreshToken: refreshTokenHandler,
    hasPermission: hasPermissionCheck,
    hasRole: hasRoleCheck
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook that provides access to the authentication context
 * 
 * @returns {AuthContextType} Authentication context value containing state and methods
 * @throws {Error} If used outside of an AuthProvider
 */
const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext, AuthProvider, useAuthContext };