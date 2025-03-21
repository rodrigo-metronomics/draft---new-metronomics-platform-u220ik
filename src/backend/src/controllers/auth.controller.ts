# src/backend/src/controllers/auth.controller.ts
```typescript
import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import { authService } from '../services/auth';
import { userService } from '../services/user';
import { successResponse, errorResponse, createdResponse } from '../utils/helpers/responseHelper';
import { logger } from '../utils/helpers/logger';
import { AuthenticationError, ValidationError } from '../utils/errors';
import { LoginRequest, RegisterRequest, RefreshTokenRequest, PasswordResetRequest, ChangePasswordRequest } from '../types/auth.types';

/**
 * Controller that handles authentication-related HTTP requests in the Metronomics Platform.
 * This controller implements endpoints for user login, registration, token refresh, logout,
 * password reset, and password change operations, interfacing with the authentication service.
 */
export default {
  /**
   * Handles user login requests with email/password or SSO providers
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<Response> HTTP response with authentication data or error
   */
  login: async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    try {
      // Extract login credentials from request body (email, password/token, provider)
      const loginData: LoginRequest = req.body;

      logger.info('Login attempt', { email: loginData.email, provider: loginData.provider });

      // Call authService.login with credentials
      const authResponse = await authService.login(loginData);

      logger.info('Login successful', { userId: authResponse.user.id });

      // Return success response with authentication data (tokens and user info)
      return successResponse(res, authResponse, 'Login successful');
    } catch (error) {
      logger.error('Login failed', { error });

      // Handle authentication errors and return appropriate error responses
      if (error instanceof AuthenticationError) {
        return errorResponse(res, error.message, error.details, error.statusCode);
      } else if (error instanceof ValidationError) {
        return errorResponse(res, error.message, error.details, error.statusCode);
      } else {
        return errorResponse(res, 'Login failed due to an unexpected error', null, 500);
      }
    }
  },

  /**
   * Handles user registration requests
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<Response> HTTP response with newly created user data or error
   */
  register: async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    try {
      // Extract registration data from request body (email, password, name, organization)
      const registerData: RegisterRequest = req.body;

      logger.info('Registration attempt', { email: registerData.email });

      // Call authService.register with registration data
      const authResponse = await authService.register(registerData);

      logger.info('Registration successful', { userId: authResponse.user.id });

      // Return created response with authentication data (tokens and user info)
      return createdResponse(res, authResponse, 'Registration successful');
    } catch (error) {
      logger.error('Registration failed', { error });

      // Handle validation and registration errors with appropriate error responses
      if (error instanceof ValidationError) {
        return errorResponse(res, error.message, error.details, error.statusCode);
      } else {
        return errorResponse(res, 'Registration failed due to an unexpected error', null, 500);
      }
    }
  },

  /**
   * Handles token refresh requests to issue new access tokens
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<Response> HTTP response with new tokens or error
   */
  refreshToken: async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    try {
      // Extract refresh token from request body
      const refreshData: RefreshTokenRequest = req.body;

      logger.info('Token refresh request');

      // Call authService.refreshToken with the refresh token
      const authResponse = await authService.refreshToken(refreshData);

      logger.info('Token refresh successful', { userId: authResponse.user.id });

      // Return success response with new authentication data (tokens and user info)
      return successResponse(res, authResponse, 'Token refresh successful');
    } catch (error) {
      logger.error('Token refresh failed', { error });

      // Handle token validation errors with appropriate error responses
      if (error instanceof AuthenticationError) {
        return errorResponse(res, error.message, error.details, error.statusCode);
      } else if (error instanceof ValidationError) {
        return errorResponse(res, error.message, error.details, error.statusCode);
      } else {
        return errorResponse(res, 'Token refresh failed due to an unexpected error', null, 500);
      }
    }
  },

  /**
   * Handles user logout requests by invalidating tokens
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<Response> HTTP response confirming successful logout or error
   */
  logout: async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    try {
      // Extract user ID from authenticated request
      const userId = req.body.userId; // Assuming userId is passed in the request body

      logger.info('Logout request', { userId });

      // Call authService.logout with the user ID
      await authService.logout(userId);

      logger.info('Logout successful', { userId });

      // Return success response confirming logout
      return successResponse(res, { success: true }, 'Logout successful');
    } catch (error) {
      logger.error('Logout failed', { error });

      // Handle logout errors with appropriate error responses
      if (error instanceof ValidationError) {
        return errorResponse(res, error.message, error.details, error.statusCode);
      } else {
        return errorResponse(res, 'Logout failed due to an unexpected error', null, 500);
      }
    }
  },

  /**
   * Handles password reset requests by sending reset links
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<Response> HTTP response confirming reset email sent or error
   */
  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    try {
      // Extract email from request body
      const resetData: PasswordResetRequest = req.body;

      logger.info('Password reset request', { email: resetData.email });

      // Call authService.requestPasswordReset with the email
      await authService.requestPasswordReset(resetData);

      logger.info('Password reset email sent', { email: resetData.email });

      // Return success response confirming reset email sent
      return successResponse(res, { success: true }, 'Password reset email sent');
    } catch (error) {
      logger.error('Password reset request failed', { error });

      // Handle reset request errors with appropriate error responses
      if (error instanceof ValidationError) {
        return errorResponse(res, error.message, error.details, error.statusCode);
      } else {
        return errorResponse(res, 'Password reset request failed due to an unexpected error', null, 500);
      }
    }
  },

  /**
   * Handles password change requests for authenticated users
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<Response> HTTP response confirming password change or error
   */
  changePassword: async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    try {
      // Extract current password and new password from request body
      const changePasswordData: ChangePasswordRequest = req.body;

      // Extract user ID from authenticated request
      const userId = req.body.userId; // Assuming userId is passed in the request body

      logger.info('Password change request', { userId });

      // Call userService.changePassword with user ID, current password, and new password
      await userService.changePassword(userId, changePasswordData.currentPassword, changePasswordData.newPassword);

      logger.info('Password change successful', { userId });

      // Return success response confirming password change
      return successResponse(res, { success: true }, 'Password changed successfully');
    } catch (error) {
      logger.error('Password change failed', { error });

      // Handle password change errors with appropriate error responses
      if (error instanceof ValidationError) {
        return errorResponse(res, error.message, error.details, error.statusCode);
      } else {
        return errorResponse(res, 'Password change failed due to an unexpected error', null, 500);
      }
    }
  }
};