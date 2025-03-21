import { AuthService } from '../../../src/services/auth/authService';
import { firebaseAuthService } from '../../../src/services/auth/firebaseAuthService';
import { userRepository } from '../../../src/repositories/userRepository';
import { organizationRepository } from '../../../src/repositories/organizationRepository';
import { roleService } from '../../../src/services/user/roleService';
import { userService } from '../../../src/services/user/userService';
import { AuthProvider, LoginRequest, RegisterRequest, RefreshTokenRequest, PasswordResetRequest } from '../../../src/types/auth.types';
import { UserRole } from '../../../src/utils/constants/roles';
import { AuthenticationError, ValidationError, NotFoundError } from '../../../src/utils/errors';
import jwt from 'jsonwebtoken'; // v9.0.0
import { User } from '@prisma/client';
import { Permission } from '../../../src/utils/constants/permissions';

/**
 * Mocks the JWT verify function to return a predictable payload
 * @param token 
 * @param secret 
 * @param options 
 * @returns Decoded JWT payload
 */
const mockJwtVerify = (token: string, secret: string, options: object): object => {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    role: UserRole.TEAM_MEMBER,
    organizationId: 'test-org-id',
    permissions: [Permission.VIEW_DASHBOARD],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
  };
};

/**
 * Mocks the JWT sign function to return a predictable token
 * @param payload 
 * @param secret 
 * @param options 
 * @returns JWT token string
 */
const mockJwtSign = (payload: object, secret: string, options: object): string => {
  return 'mock-jwt-token';
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('AuthService', () => {
    it('should be defined', () => {
      // Create a new instance of AuthService
      // Assert that the instance is defined
      expect(authService).toBeDefined();
    });
  });

  describe('login', () => {
    it('should login with email and password successfully', async () => {
      // Mock firebaseAuthService.getUserByEmail to return a user
      firebaseAuthService.getUserByEmail = jest.fn().mockResolvedValue({ uid: 'test-auth-id', email: 'test@example.com' });
      // Mock userRepository.findByEmail to return a user
      userRepository.findByEmail = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock userRepository.updateLastLogin to return the updated user
      userRepository.updateLastLogin = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock roleService.getUserPermissions to return permissions
      roleService.getUserPermissions = jest.fn().mockReturnValue([Permission.VIEW_DASHBOARD]);
      // Mock userService.formatUserResponse to return formatted user data
      userService.formatUserResponse = jest.fn().mockReturnValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock jwt.sign to return tokens
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      // Call authService.login with email and password
      const loginData: LoginRequest = { email: 'test@example.com', password: 'password', provider: AuthProvider.EMAIL_PASSWORD, token: '' };
      const response = await authService.login(loginData);

      // Assert that the response contains tokens and user data
      expect(response).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
        user: { id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' }
      });

      // Verify that all mocks were called with correct parameters
      expect(firebaseAuthService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith('test-user-id');
      expect(roleService.getUserPermissions).toHaveBeenCalledWith(UserRole.TEAM_MEMBER);
      expect(userService.formatUserResponse).toHaveBeenCalledWith({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('should login with Google provider token successfully', async () => {
      // Mock firebaseAuthService.verifyProviderToken to return a decoded token
      firebaseAuthService.verifyProviderToken = jest.fn().mockResolvedValue({ uid: 'test-auth-id', email: 'test@example.com' });
      // Mock userRepository.findByAuthId to return a user
      userRepository.findByAuthId = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock userRepository.updateLastLogin to return the updated user
      userRepository.updateLastLogin = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock roleService.getUserPermissions to return permissions
      roleService.getUserPermissions = jest.fn().mockReturnValue([Permission.VIEW_DASHBOARD]);
      // Mock userService.formatUserResponse to return formatted user data
      userService.formatUserResponse = jest.fn().mockReturnValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock jwt.sign to return tokens
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      // Call authService.login with Google provider token
      const loginData: LoginRequest = { email: 'test@example.com', password: '', provider: AuthProvider.GOOGLE, token: 'google-token' };
      const response = await authService.login(loginData);

      // Assert that the response contains tokens and user data
      expect(response).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
        user: { id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' }
      });

      // Verify that all mocks were called with correct parameters
      expect(firebaseAuthService.verifyProviderToken).toHaveBeenCalledWith('google-token', AuthProvider.GOOGLE);
      expect(userRepository.findByAuthId).toHaveBeenCalledWith('test-auth-id');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith('test-user-id');
      expect(roleService.getUserPermissions).toHaveBeenCalledWith(UserRole.TEAM_MEMBER);
      expect(userService.formatUserResponse).toHaveBeenCalledWith({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('should login with Microsoft provider token successfully', async () => {
      // Mock firebaseAuthService.verifyProviderToken to return a decoded token
      firebaseAuthService.verifyProviderToken = jest.fn().mockResolvedValue({ uid: 'test-auth-id', email: 'test@example.com' });
      // Mock userRepository.findByAuthId to return a user
      userRepository.findByAuthId = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock userRepository.updateLastLogin to return the updated user
      userRepository.updateLastLogin = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock roleService.getUserPermissions to return permissions
      roleService.getUserPermissions = jest.fn().mockReturnValue([Permission.VIEW_DASHBOARD]);
      // Mock userService.formatUserResponse to return formatted user data
      userService.formatUserResponse = jest.fn().mockReturnValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock jwt.sign to return tokens
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      // Call authService.login with Microsoft provider token
      const loginData: LoginRequest = { email: 'test@example.com', password: '', provider: AuthProvider.MICROSOFT, token: 'microsoft-token' };
      const response = await authService.login(loginData);

      // Assert that the response contains tokens and user data
      expect(response).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
        user: { id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' }
      });

      // Verify that all mocks were called with correct parameters
      expect(firebaseAuthService.verifyProviderToken).toHaveBeenCalledWith('microsoft-token', AuthProvider.MICROSOFT);
      expect(userRepository.findByAuthId).toHaveBeenCalledWith('test-auth-id');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith('test-user-id');
      expect(roleService.getUserPermissions).toHaveBeenCalledWith(UserRole.TEAM_MEMBER);
      expect(userService.formatUserResponse).toHaveBeenCalledWith({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('should create a new user if not found during provider login', async () => {
      // Mock firebaseAuthService.verifyProviderToken to return a decoded token
      firebaseAuthService.verifyProviderToken = jest.fn().mockResolvedValue({ uid: 'test-auth-id', email: 'test@example.com', name: 'Test User' });
      // Mock userRepository.findByAuthId to return null (user not found)
      userRepository.findByAuthId = jest.fn().mockResolvedValue(null);
      // Mock userRepository.findByEmail to return null (user not found)
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);
      // Mock userRepository.create to return a new user
      userRepository.create = jest.fn().mockResolvedValue({ id: 'new-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: null, authId: 'test-auth-id' });
      // Mock userRepository.updateLastLogin to return the updated user
      userRepository.updateLastLogin = jest.fn().mockResolvedValue({ id: 'new-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: null, authId: 'test-auth-id' });
      // Mock roleService.getUserPermissions to return permissions
      roleService.getUserPermissions = jest.fn().mockReturnValue([Permission.VIEW_DASHBOARD]);
      // Mock userService.formatUserResponse to return formatted user data
      userService.formatUserResponse = jest.fn().mockReturnValue({ id: 'new-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: null });
      // Mock jwt.sign to return tokens
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      // Call authService.login with provider token
      const loginData: LoginRequest = { email: 'test@example.com', password: '', provider: AuthProvider.GOOGLE, token: 'google-token' };
      const response = await authService.login(loginData);

      // Assert that the response contains tokens and user data
      expect(response).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
        user: { id: 'new-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: null }
      });

      // Verify that userRepository.create was called with correct parameters
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        authId: 'test-auth-id',
        role: UserRole.TEAM_MEMBER,
        authProvider: AuthProvider.GOOGLE
      }));
    });

    it('should throw AuthenticationError for invalid credentials', async () => {
      // Mock firebaseAuthService.getUserByEmail to throw an error
      firebaseAuthService.getUserByEmail = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

      // Call authService.login with invalid credentials
      const loginData: LoginRequest = { email: 'test@example.com', password: 'wrong-password', provider: AuthProvider.EMAIL_PASSWORD, token: '' };
      
      // Assert that AuthenticationError is thrown
      await expect(authService.login(loginData)).rejects.toThrow(AuthenticationError);
    });

    it('should throw ValidationError for missing required fields', async () => {
      // Call authService.login with incomplete data
      const loginData: LoginRequest = { email: '', password: '', provider: AuthProvider.EMAIL_PASSWORD, token: '' };

      // Assert that ValidationError is thrown
      await expect(authService.login(loginData)).rejects.toThrow(ValidationError);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock userRepository.findByEmail to return null (email not in use)
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);
      // Mock organizationRepository.findById to return an organization
      organizationRepository.findById = jest.fn().mockResolvedValue({ id: 'test-org-id', name: 'Test Org' });
      // Mock firebaseAuthService.createUser to return a new Firebase user
      firebaseAuthService.createUser = jest.fn().mockResolvedValue({ uid: 'test-auth-id' });
      // Mock userRepository.create to return a new user
      userRepository.create = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id', authId: 'test-auth-id' });
      // Mock roleService.getUserPermissions to return permissions
      roleService.getUserPermissions = jest.fn().mockReturnValue([Permission.VIEW_DASHBOARD]);
      // Mock userService.formatUserResponse to return formatted user data
      userService.formatUserResponse = jest.fn().mockReturnValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock jwt.sign to return tokens
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      // Call authService.register with valid registration data
      const registerData: RegisterRequest = { email: 'test@example.com', password: 'password', firstName: 'Test', lastName: 'User', organizationId: 'test-org-id' };
      const response = await authService.register(registerData);

      // Assert that the response contains tokens and user data
      expect(response).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
        user: { id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' }
      });

      // Verify that all mocks were called with correct parameters
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(organizationRepository.findById).toHaveBeenCalledWith('test-org-id');
      expect(firebaseAuthService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        displayName: 'Test User'
      });
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.TEAM_MEMBER,
        organizationId: 'test-org-id',
        authId: 'test-auth-id'
      }));
      expect(roleService.getUserPermissions).toHaveBeenCalledWith(UserRole.TEAM_MEMBER);
      expect(userService.formatUserResponse).toHaveBeenCalledWith({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id', authId: 'test-auth-id' } as any);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw ValidationError if email is already in use', async () => {
      // Mock userRepository.findByEmail to return an existing user
      userRepository.findByEmail = jest.fn().mockResolvedValue({ id: 'existing-user-id', email: 'test@example.com' });

      // Call authService.register with an email that's already in use
      const registerData: RegisterRequest = { email: 'test@example.com', password: 'password', firstName: 'Test', lastName: 'User', organizationId: 'test-org-id' };

      // Assert that ValidationError is thrown
      await expect(authService.register(registerData)).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError if organization doesn't exist", async () => {
      // Mock userRepository.findByEmail to return null (email not in use)
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);
      // Mock organizationRepository.findById to return null (organization not found)
      organizationRepository.findById = jest.fn().mockResolvedValue(null);

      // Call authService.register with non-existent organization ID
      const registerData: RegisterRequest = { email: 'test@example.com', password: 'password', firstName: 'Test', lastName: 'User', organizationId: 'non-existent-org-id' };

      // Assert that NotFoundError is thrown
      await expect(authService.register(registerData)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for missing required fields', async () => {
      // Call authService.register with incomplete data
      const registerData: RegisterRequest = { email: '', password: '', firstName: '', lastName: '', organizationId: '' };

      // Assert that ValidationError is thrown
      await expect(authService.register(registerData)).rejects.toThrow(ValidationError);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      // Mock jwt.verify to return a decoded refresh token
      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ id: 'test-user-id' });
      // Mock userRepository.findById to return a user
      userRepository.findById = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock roleService.getUserPermissions to return permissions
      roleService.getUserPermissions = jest.fn().mockReturnValue([Permission.VIEW_DASHBOARD]);
      // Mock userService.formatUserResponse to return formatted user data
      userService.formatUserResponse = jest.fn().mockReturnValue({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' });
      // Mock jwt.sign to return new tokens
      jwt.sign = jest.fn().mockReturnValue('new-mock-jwt-token');

      // Call authService.refreshToken with a valid refresh token
      const refreshData: RefreshTokenRequest = { refreshToken: 'valid-refresh-token' };
      const response = await authService.refreshToken(refreshData);

      // Assert that the response contains new tokens and user data
      expect(response).toEqual({
        accessToken: 'new-mock-jwt-token',
        refreshToken: 'new-mock-jwt-token',
        user: { id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' }
      });

      // Verify that all mocks were called with correct parameters
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(String));
      expect(userRepository.findById).toHaveBeenCalledWith('test-user-id');
      expect(roleService.getUserPermissions).toHaveBeenCalledWith(UserRole.TEAM_MEMBER);
      expect(userService.formatUserResponse).toHaveBeenCalledWith({ id: 'test-user-id', email: 'test@example.com', role: UserRole.TEAM_MEMBER, organizationId: 'test-org-id' } as any);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw AuthenticationError for invalid refresh token', async () => {
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock) = jest.fn().mockImplementation(() => { throw new Error('Invalid token'); });

      // Call authService.refreshToken with an invalid refresh token
      const refreshData: RefreshTokenRequest = { refreshToken: 'invalid-refresh-token' };

      // Assert that AuthenticationError is thrown
      await expect(authService.refreshToken(refreshData)).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError if user not found', async () => {
      // Mock jwt.verify to return a decoded refresh token
      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ id: 'test-user-id' });
      // Mock userRepository.findById to return null (user not found)
      userRepository.findById = jest.fn().mockResolvedValue(null);

      // Call authService.refreshToken with a refresh token for a non-existent user
      const refreshData: RefreshTokenRequest = { refreshToken: 'valid-refresh-token' };

      // Assert that NotFoundError is thrown
      await expect(authService.refreshToken(refreshData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Mock firebaseAuthService.revokeRefreshTokens to resolve successfully
      firebaseAuthService.revokeRefreshTokens = jest.fn().mockResolvedValue(undefined);

      // Call authService.logout with a user ID
      const response = await authService.logout('test-user-id');

      // Assert that the response indicates success
      expect(response).toEqual({ success: true });

      // Verify that firebaseAuthService.revokeRefreshTokens was called with the user ID
      expect(firebaseAuthService.revokeRefreshTokens).toHaveBeenCalledWith('test-user-id');
    });

    it('should throw ValidationError for missing user ID', async () => {
      // Call authService.logout with no user ID
      // Assert that ValidationError is thrown
      await expect(authService.logout(undefined as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token successfully', async () => {
      // Mock jwt.verify to return a decoded token
      (jwt.verify as jest.Mock) = jest.fn().mockReturnValue({ id: 'test-user-id' });

      // Call authService.verifyToken with a valid token
      const token = 'valid-token';
      const response = await authService.verifyToken(token);

      // Assert that the response contains the decoded payload
      expect(response).toEqual({ id: 'test-user-id' });

      // Verify that jwt.verify was called with the token
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
    });

    it('should throw AuthenticationError for invalid token', async () => {
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock) = jest.fn().mockImplementation(() => { throw new Error('Invalid token'); });

      // Call authService.verifyToken with an invalid token
      const token = 'invalid-token';

      // Assert that AuthenticationError is thrown
      await expect(authService.verifyToken(token)).rejects.toThrow(AuthenticationError);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      // Mock userRepository.findByEmail to return a user
      userRepository.findByEmail = jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' });
      // Mock firebaseAuthService.generatePasswordResetLink to return a reset link
      firebaseAuthService.generatePasswordResetLink = jest.fn().mockResolvedValue('reset-link');

      // Call authService.requestPasswordReset with a valid email
      const resetData: PasswordResetRequest = { email: 'test@example.com' };
      const response = await authService.requestPasswordReset(resetData);

      // Assert that the response indicates success
      expect(response).toEqual({ success: true });

      // Verify that firebaseAuthService.generatePasswordResetLink was called with the email
      expect(firebaseAuthService.generatePasswordResetLink).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw NotFoundError if user not found', async () => {
      // Mock userRepository.findByEmail to return null (user not found)
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);

      // Call authService.requestPasswordReset with a non-existent email
      const resetData: PasswordResetRequest = { email: 'nonexistent@example.com' };

      // Assert that NotFoundError is thrown
      await expect(authService.requestPasswordReset(resetData)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid email', async () => {
      // Call authService.requestPasswordReset with an invalid email
      const resetData: PasswordResetRequest = { email: 'invalid-email' };

      // Assert that ValidationError is thrown
      await expect(authService.requestPasswordReset(resetData)).rejects.toThrow(ValidationError);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      // Mock roleService.getUserPermissions to return permissions
      roleService.getUserPermissions = jest.fn().mockReturnValue([Permission.VIEW_DASHBOARD]);
      // Mock jwt.sign to return tokens
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      // Call authService.generateTokens with user data
      const user: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        role: UserRole.TEAM_MEMBER,
        status: 'ACTIVE',
        organizationId: 'test-org-id',
        authId: 'test-auth-id',
        authProvider: AuthProvider.EMAIL_PASSWORD,
        photoURL: null,
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
        lastLoginAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const { accessToken, refreshToken } = authService.generateTokens(user);

      // Assert that the response contains access and refresh tokens
      expect(accessToken).toBe('mock-jwt-token');
      expect(refreshToken).toBe('mock-jwt-token');

      // Verify that jwt.sign was called twice with correct parameters
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-user-id',
          email: 'test@example.com',
          role: UserRole.TEAM_MEMBER,
          organizationId: 'test-org-id',
          permissions: [Permission.VIEW_DASHBOARD]
        }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });
});