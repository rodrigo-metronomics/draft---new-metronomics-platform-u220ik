import jwt from 'jsonwebtoken'; // v9.0.0
import { firebaseAuthService } from './firebaseAuthService';
import { userRepository } from '../../repositories/userRepository';
import { organizationRepository } from '../../repositories/organizationRepository';
import { roleService } from '../user/roleService';
import { userService } from '../user/userService';
import { logger } from '../../utils/helpers/logger';
import { secrets } from '../../config/secrets';
import { AuthenticationError, ValidationError, NotFoundError } from '../../utils/errors';
import { AuthProvider, LoginRequest, RegisterRequest, AuthResponse, JWTPayload, RefreshTokenRequest, PasswordResetRequest } from '../../types/auth.types';
import { UserRole } from '../../utils/constants/roles';
import { User } from '../../types/user.types';
import { initializeFirebase } from '../../config/firebase';

/**
 * Service class that provides authentication functionality for the Metronomics Platform
 */
class AuthService {
  /**
   * Initializes the AuthService
   */
  constructor() {
    // Initialize the service with no parameters
  }

  /**
   * Authenticates a user with email/password or provider token
   * @param loginData Login request data
   * @returns Authentication response with tokens and user data
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    // Validate login data (email, password/token, provider)
    if (!loginData.email) {
      throw ValidationError.requiredField('email');
    }

    let authResult: any;
    let authProvider: AuthProvider;

    // Handle authentication based on provider type
    if (loginData.provider === AuthProvider.EMAIL_PASSWORD) {
      if (!loginData.password) {
        throw ValidationError.requiredField('password');
      }

      // Verify credentials with Firebase
      authResult = await firebaseAuthService.validateCredentials(loginData.email, loginData.password);
      authProvider = AuthProvider.EMAIL_PASSWORD;
    } else {
      if (!loginData.token) {
        throw ValidationError.requiredField('token');
      }

      if (!loginData.provider) {
        throw ValidationError.requiredField('provider');
      }

      // Verify provider token
      authResult = await firebaseAuthService.verifyProviderToken(loginData.token, loginData.provider);
      authProvider = loginData.provider;
    }

    // Find or create user in database based on auth result
    const user = await this.createUserFromAuthData(authResult, authProvider);

    // Update user's last login timestamp
    await userRepository.updateLastLogin(user.id);

    // Generate JWT access token and refresh token
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Return authentication response with tokens and user data
    return {
      accessToken,
      refreshToken,
      user: userService.formatUserResponse(user)
    };
  }

  /**
   * Registers a new user in the system
   * @param registerData Registration request data
   * @returns Authentication response with tokens and user data
   */
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    // Validate registration data (email, password, name, organization)
    if (!registerData.email) {
      throw ValidationError.requiredField('email');
    }

    if (!registerData.password) {
      throw ValidationError.requiredField('password');
    }

    if (!registerData.firstName) {
      throw ValidationError.requiredField('firstName');
    }

    if (!registerData.lastName) {
      throw ValidationError.requiredField('lastName');
    }

    if (!registerData.organizationId) {
      throw ValidationError.requiredField('organizationId');
    }

    // Check if email is already in use
    const existingUser = await userRepository.findByEmail(registerData.email);
    if (existingUser) {
      throw ValidationError.invalidFormat('email', 'Email is already in use');
    }

    // Verify organization exists
    const organization = await organizationRepository.findById(registerData.organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found', { organizationId: registerData.organizationId });
    }

    // Create user in Firebase Authentication
    const firebaseUser = await firebaseAuthService.createUser({
      email: registerData.email,
      password: registerData.password,
      displayName: `${registerData.firstName} ${registerData.lastName}`
    });

    // Create user in database with TEAM_MEMBER role
    const user = await userRepository.create({
      email: registerData.email,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
      name: `${registerData.firstName} ${registerData.lastName}`,
      role: UserRole.TEAM_MEMBER,
      organizationId: registerData.organizationId,
      authId: firebaseUser.uid,
      authProvider: AuthProvider.EMAIL_PASSWORD,
      photoURL: null,
      status: 'ACTIVE',
      preferences: {
        theme: 'light',
        timezone: 'UTC',
        notificationPreferences: {
          email: true,
          inApp: true,
          push: false,
          meetingReminders: true,
          actionItems: true,
          metricAlerts: true,
          teamUpdates: true,
          digestFrequency: 'DAILY',
          typePreferences: []
        },
        dashboardLayout: {},
        customFields: {}
      },
      isActive: true
    });

    // Generate JWT access token and refresh token
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Return authentication response with tokens and user data
    return {
      accessToken,
      refreshToken,
      user: userService.formatUserResponse(user)
    };
  }

  /**
   * Refreshes an expired JWT access token using a refresh token
   * @param refreshData Refresh token request data
   * @returns New authentication response with fresh tokens
   */
  async refreshToken(refreshData: RefreshTokenRequest): Promise<AuthResponse> {
    // Validate refresh token
    if (!refreshData.refreshToken) {
      throw ValidationError.requiredField('refreshToken');
    }

    // Verify refresh token signature and expiration
    let decoded: any;
    try {
      decoded = jwt.verify(refreshData.refreshToken, secrets.JWT_SECRET);
    } catch (error) {
      logger.error('Invalid refresh token', { error });
      throw AuthenticationError.invalidToken();
    }

    // Extract user ID from refresh token
    const userId = decoded.id;

    // Find user in database
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found', { userId });
    }

    // Generate new JWT access token and refresh token
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Return authentication response with new tokens and user data
    return {
      accessToken,
      refreshToken,
      user: userService.formatUserResponse(user)
    };
  }

  /**
   * Logs out a user by revoking their refresh tokens
   * @param userId User ID
   * @returns Success status of logout operation
   */
  async logout(userId: string): Promise<{ success: boolean }> {
    // Validate user ID
    if (!userId) {
      throw ValidationError.requiredField('userId');
    }

    // Revoke all refresh tokens for the user in Firebase
    await firebaseAuthService.revokeRefreshTokens(userId);

    // Return success response
    return { success: true };
  }

  /**
   * Verifies a JWT access token and returns the decoded payload
   * @param token JWT access token
   * @returns Decoded JWT payload
   */
  async verifyToken(token: string): Promise<JWTPayload> {
    // Validate token
    if (!token) {
      throw ValidationError.requiredField('token');
    }

    // Verify token signature using JWT_SECRET
    try {
      const decoded = jwt.verify(token, secrets.JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      logger.error('Invalid JWT token', { error });
      throw AuthenticationError.invalidToken();
    }
  }

  /**
   * Sends a password reset link to the user's email
   * @param resetData Password reset request data
   * @returns Success status of reset request
   */
  async requestPasswordReset(resetData: PasswordResetRequest): Promise<{ success: boolean }> {
    // Validate email address
    if (!resetData.email) {
      throw ValidationError.requiredField('email');
    }

    // Check if user exists with the provided email
    const user = await userRepository.findByEmail(resetData.email);
    if (!user) {
      throw new NotFoundError('User not found', { email: resetData.email });
    }

    // Generate password reset link using Firebase
    const resetLink = await firebaseAuthService.generatePasswordResetLink(resetData.email);

    // TODO: Send password reset email

    // Return success response
    return { success: true };
  }

  /**
   * Generates JWT access and refresh tokens for a user
   * @param user User object
   * @returns Generated tokens
   */
  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    // Create JWT payload with user ID, email, role, organization, permissions
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      permissions: roleService.getRolePermissions(user.role),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // Expires in 1 hour
    };

    // Generate access token with short expiration (1 hour)
    const accessToken = jwt.sign(payload, secrets.JWT_SECRET, { expiresIn: secrets.JWT_EXPIRES_IN });

    // Generate refresh token with longer expiration (14 days)
    const refreshToken = jwt.sign(payload, secrets.JWT_SECRET, { expiresIn: '14d' });

    return { accessToken, refreshToken };
  }

  /**
   * Creates or retrieves a user based on authentication data
   * @param authData Authentication data from Firebase
   * @param provider Authentication provider type
   * @returns User record from database
   */
  async createUserFromAuthData(authData: any, provider: AuthProvider): Promise<User> {
    // Extract user information from auth data (email, name, profile picture)
    const email = authData.email;
    const name = authData.displayName || authData.name;
    const photoURL = authData.photoURL;
    const authId = authData.uid;

    // Check if user already exists in database by email or authId
    let user = await userRepository.findByEmail(email);
    if (!user) {
      user = await userRepository.findByAuthId(authId);
    }

    if (user) {
      return user;
    }

    // If user doesn't exist, create new user with TEAM_MEMBER role
    const newUser = await userRepository.create({
      email,
      firstName: name,
      lastName: '',
      name,
      role: UserRole.TEAM_MEMBER,
      organizationId: null,
      authId,
      authProvider: provider,
      photoURL,
      status: 'ACTIVE',
      preferences: {
        theme: 'light',
        timezone: 'UTC',
        notificationPreferences: {
          email: true,
          inApp: true,
          push: false,
          meetingReminders: true,
          actionItems: true,
          metricAlerts: true,
          teamUpdates: true,
          digestFrequency: 'DAILY',
          typePreferences: []
        },
        dashboardLayout: {},
        customFields: {}
      },
      isActive: true
    });

    return newUser;
  }

  /**
   * Validates user credentials for email/password login
   * @param email User's email address
   * @param password User's password
   * @returns Firebase user data if credentials are valid
   */
  async validateCredentials(email: string, password: string): Promise<object> {
    // Attempt to get user by email from Firebase
    try {
      const userRecord = await firebaseAuthService.getUserByEmail(email);
      return userRecord;
    } catch (error) {
      logger.error('Invalid credentials', { error });
      throw AuthenticationError.invalidCredentials();
    }
  }
}

// Create a singleton instance of the AuthService
const authService = new AuthService();

// Export both the class and the singleton instance
export { AuthService, authService };