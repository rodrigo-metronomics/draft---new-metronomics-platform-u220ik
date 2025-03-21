import axios, { AxiosError } from 'axios'; // v1.4.0
import { 
  ApiResponse, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest,
  PasswordResetRequest,
  ChangePasswordRequest,
  ApiError,
  ApiErrorType
} from '../../types/api.types';
import { AuthProvider } from '../../types/auth.types';
import apiClient from './index';

/**
 * Authentication API endpoints for the Metronomics Platform.
 * These endpoints handle user authentication, registration, and account management.
 */
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/logout',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password'
};

/**
 * Authenticates a user with email and password credentials
 * 
 * @param credentials - User login credentials including email, password, and provider
 * @returns Promise that resolves to the authentication response containing tokens and user data
 */
export const login = async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  try {
    return await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Authenticates a user using a Firebase ID token (for SSO with Google or Microsoft)
 * 
 * @param token - Firebase ID token from the authentication provider
 * @param provider - The authentication provider (Google or Microsoft)
 * @returns Promise that resolves to the authentication response containing tokens and user data
 */
export const loginWithFirebaseToken = async (
  token: string,
  provider: AuthProvider.GOOGLE | AuthProvider.MICROSOFT
): Promise<ApiResponse<AuthResponse>> => {
  try {
    const loginRequest: LoginRequest = {
      email: '', // Email will be extracted from the token on the server
      password: '', // Password not needed for SSO
      provider,
      token
    };

    return await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.LOGIN,
      loginRequest
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Registers a new user with the provided information
 * 
 * @param userData - User registration data including email, password, name, and organization
 * @param firebaseToken - Firebase token for verification
 * @returns Promise that resolves to the authentication response for the new user
 */
export const register = async (
  userData: RegisterRequest,
  firebaseToken: string
): Promise<ApiResponse<AuthResponse>> => {
  try {
    const headers = {
      Authorization: `Bearer ${firebaseToken}`
    };

    return await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.REGISTER,
      userData,
      headers
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Refreshes the access token using a refresh token
 * 
 * @param refreshToken - The refresh token used to obtain a new access token
 * @returns Promise that resolves to the authentication response with new tokens
 */
export const refreshToken = async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
  try {
    const refreshTokenRequest: RefreshTokenRequest = {
      refreshToken
    };

    return await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.REFRESH_TOKEN,
      refreshTokenRequest
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Logs out the current user by invalidating their refresh token
 * 
 * @param refreshToken - The refresh token to invalidate
 * @returns Promise that resolves to a success response
 */
export const logout = async (refreshToken: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    return await apiClient.post<{ success: boolean }>(
      AUTH_ENDPOINTS.LOGOUT,
      { refreshToken }
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Initiates a password reset process for the specified email
 * 
 * @param email - Email address of the user requesting password reset
 * @returns Promise that resolves to a success response
 */
export const resetPassword = async (email: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const passwordResetRequest: PasswordResetRequest = {
      email
    };

    return await apiClient.post<{ success: boolean }>(
      AUTH_ENDPOINTS.RESET_PASSWORD,
      passwordResetRequest
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Changes the password for the current user
 * 
 * @param passwordData - Object containing current and new password
 * @param accessToken - Current valid access token for authorization
 * @returns Promise that resolves to a success response
 */
export const changePassword = async (
  passwordData: ChangePasswordRequest,
  accessToken: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`
    };

    return await apiClient.post<{ success: boolean }>(
      AUTH_ENDPOINTS.CHANGE_PASSWORD,
      passwordData,
      headers
    );
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Transforms API errors into a standardized format
 * 
 * @param error - Error object from a failed API request
 * @throws Standardized ApiError with appropriate type and details
 */
const handleApiError = (error: any): never => {
  // Default error values
  let errorType = ApiErrorType.UNKNOWN_ERROR;
  let message = 'An unexpected error occurred during authentication';
  let errors = null;
  let statusCode = null;
  
  // Check if the error is an Axios error with a response
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      statusCode = axiosError.response.status;
      
      // Extract error details from the response
      const responseData = axiosError.response.data as any;
      message = responseData?.message || axiosError.message;
      errors = responseData?.errors || null;
      
      // Map HTTP status codes to error types
      switch (statusCode) {
        case 400:
          errorType = ApiErrorType.VALIDATION_ERROR;
          break;
        case 401:
          errorType = ApiErrorType.AUTHENTICATION_ERROR;
          break;
        case 403:
          errorType = ApiErrorType.AUTHORIZATION_ERROR;
          break;
        case 404:
          errorType = ApiErrorType.RESOURCE_NOT_FOUND;
          break;
        case 409:
          errorType = ApiErrorType.CONFLICT_ERROR;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = ApiErrorType.SERVER_ERROR;
          break;
        default:
          errorType = ApiErrorType.UNKNOWN_ERROR;
      }
    } else if (axiosError.request) {
      // Request was made but no response received
      errorType = ApiErrorType.NETWORK_ERROR;
      message = 'Authentication failed: Network error or server unreachable';
    }
  }

  // Create a standardized error object
  const apiError: ApiError = {
    type: errorType,
    message,
    errors,
    statusCode,
    originalError: error
  };

  throw apiError;
};