import express from 'express'; // version ^4.18.2
const router = express.Router();

import { authenticate, requestValidator } from '../middlewares';
import authController from '../../controllers';
import { loginSchema, registerSchema, refreshTokenSchema, passwordResetSchema, changePasswordSchema } from '../../utils/validation/userValidation';
import { logger } from '../../utils/helpers/logger';

/**
 * Express router configuration for authentication-related endpoints in the Metronomics Platform.
 * This file defines routes for user login, registration, token refresh, logout, password reset, and password change operations.
 */
export default (() => {
  // Initialize logger for auth routes
  logger.info('Initializing auth routes...');

  /**
   * @route   POST /api/auth/login
   * @desc    Authenticate user and return JWT token
   * @access  Public
   */
  router.post('/login', requestValidator.validateBody(loginSchema), authController.login);

  /**
   * @route   POST /api/auth/register
   * @desc    Register a new user and return JWT token
   * @access  Public
   */
  router.post('/register', requestValidator.validateBody(registerSchema), authController.register);

  /**
   * @route   POST /api/auth/refreshToken
   * @desc    Refresh JWT token
   * @access  Public
   */
  router.post('/refreshToken', requestValidator.validateBody(refreshTokenSchema), authController.refreshToken);

  /**
   * @route   POST /api/auth/logout
   * @desc    Logout user (invalidate token)
   * @access  Private
   */
  router.post('/logout', authenticate, authController.logout);

  /**
   * @route   POST /api/auth/resetPassword
   * @desc    Request password reset
   * @access  Public
   */
  router.post('/resetPassword', requestValidator.validateBody(passwordResetSchema), authController.resetPassword);

  /**
   * @route   POST /api/auth/changePassword
   * @desc    Change password
   * @access  Private
   */
  router.post('/changePassword', authenticate, requestValidator.validateBody(changePasswordSchema), authController.changePassword);

  // Log completion of route initialization
  logger.info('Auth routes initialized');

  return router;
})();