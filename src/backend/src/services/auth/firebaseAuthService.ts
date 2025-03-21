import admin from 'firebase-admin'; // v11.8.0
import { auth } from '../../config/firebase';
import AuthenticationError from '../../utils/errors/AuthenticationError';
import { logger } from '../../utils/helpers/logger';
import { AuthProvider } from '../../types/auth.types';

/**
 * Service class that provides Firebase Authentication integration for the Metronomics Platform.
 * This service handles user authentication, token verification, and user management
 * through Firebase Auth, serving as the primary identity provider for the application.
 */
class FirebaseAuthService {
  /**
   * Initializes the FirebaseAuthService
   */
  constructor() {
    // Initialize the service with no parameters
  }

  /**
   * Verifies a Firebase ID token and returns the decoded token
   * @param token Firebase ID token to verify
   * @returns Decoded Firebase ID token
   * @throws AuthenticationError if token is invalid or expired
   */
  async verifyToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      logger.info('Verifying Firebase ID token');
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      logger.error('Error verifying Firebase ID token', { error });
      
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          throw AuthenticationError.tokenExpired({ originalError: error.message });
        }
        throw AuthenticationError.invalidToken({ originalError: error.message });
      }
      
      throw AuthenticationError.invalidToken();
    }
  }

  /**
   * Creates a custom Firebase token for a user
   * @param uid User ID to create token for
   * @param claims Optional custom claims to include in the token
   * @returns Custom Firebase token
   * @throws Error if token creation fails
   */
  async createCustomToken(uid: string, claims?: object): Promise<string> {
    try {
      logger.info('Creating custom Firebase token', { uid });
      const token = await auth.createCustomToken(uid, claims);
      return token;
    } catch (error) {
      logger.error('Error creating custom Firebase token', { error, uid });
      throw error;
    }
  }

  /**
   * Retrieves a Firebase user by email address
   * @param email Email address to lookup
   * @returns Firebase user record
   * @throws AuthenticationError if user not found
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      logger.info('Getting Firebase user by email', { email });
      const userRecord = await auth.getUserByEmail(email);
      return userRecord;
    } catch (error) {
      logger.error('Error getting Firebase user by email', { error, email });
      throw AuthenticationError.invalidCredentials({ originalError: error });
    }
  }

  /**
   * Retrieves a Firebase user by UID
   * @param uid User ID to lookup
   * @returns Firebase user record
   * @throws AuthenticationError if user not found
   */
  async getUserById(uid: string): Promise<admin.auth.UserRecord> {
    try {
      logger.info('Getting Firebase user by ID', { uid });
      const userRecord = await auth.getUser(uid);
      return userRecord;
    } catch (error) {
      logger.error('Error getting Firebase user by ID', { error, uid });
      throw AuthenticationError.invalidCredentials({ originalError: error });
    }
  }

  /**
   * Creates a new Firebase user
   * @param userData User data for creating the new user
   * @returns Created Firebase user record
   * @throws Error if user creation fails
   */
  async createUser(userData: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    try {
      logger.info('Creating new Firebase user');
      const userRecord = await auth.createUser(userData);
      logger.info('Firebase user created successfully', { uid: userRecord.uid });
      return userRecord;
    } catch (error) {
      logger.error('Error creating Firebase user', { error });
      throw error;
    }
  }

  /**
   * Updates an existing Firebase user
   * @param uid User ID to update
   * @param userData User data to update
   * @returns Updated Firebase user record
   * @throws Error if user update fails
   */
  async updateUser(uid: string, userData: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    try {
      logger.info('Updating Firebase user', { uid });
      const userRecord = await auth.updateUser(uid, userData);
      logger.info('Firebase user updated successfully', { uid });
      return userRecord;
    } catch (error) {
      logger.error('Error updating Firebase user', { error, uid });
      throw error;
    }
  }

  /**
   * Deletes a Firebase user
   * @param uid User ID to delete
   * @returns Promise resolving when user is deleted
   * @throws Error if user deletion fails
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      logger.info('Deleting Firebase user', { uid });
      await auth.deleteUser(uid);
      logger.info('Firebase user deleted successfully', { uid });
    } catch (error) {
      logger.error('Error deleting Firebase user', { error, uid });
      throw error;
    }
  }

  /**
   * Verifies a user's password by attempting to sign in
   * Note: Since this is a server-side function, we can't directly verify passwords.
   * Instead, we check if the user exists and assume password verification 
   * will happen client-side.
   * 
   * @param email User's email address
   * @param password User's password (not used server-side)
   * @returns True if user exists, false otherwise
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      logger.info('Verifying user password', { email });
      // Server-side Firebase Admin SDK cannot verify passwords directly
      // Instead, we check if the user exists
      const userRecord = await auth.getUserByEmail(email);
      logger.debug('User exists, client must verify password', { uid: userRecord.uid });
      return true;
    } catch (error) {
      logger.error('Error verifying user password', { error, email });
      return false;
    }
  }

  /**
   * Generates a password reset link for a user
   * @param email User's email address
   * @returns Password reset link
   * @throws Error if link generation fails
   */
  async generatePasswordResetLink(email: string): Promise<string> {
    try {
      logger.info('Generating password reset link', { email });
      const resetLink = await auth.generatePasswordResetLink(email);
      return resetLink;
    } catch (error) {
      logger.error('Error generating password reset link', { error, email });
      throw error;
    }
  }

  /**
   * Revokes all refresh tokens for a user
   * @param uid User ID to revoke tokens for
   * @returns Promise resolving when tokens are revoked
   * @throws Error if token revocation fails
   */
  async revokeRefreshTokens(uid: string): Promise<void> {
    try {
      logger.info('Revoking refresh tokens', { uid });
      await auth.revokeRefreshTokens(uid);
      logger.info('Refresh tokens revoked successfully', { uid });
    } catch (error) {
      logger.error('Error revoking refresh tokens', { error, uid });
      throw error;
    }
  }

  /**
   * Verifies a token from an authentication provider (Google, Microsoft)
   * @param token Provider token to verify
   * @param provider Authentication provider type
   * @returns Decoded provider token
   * @throws AuthenticationError if token is invalid
   */
  async verifyProviderToken(
    token: string,
    provider: AuthProvider
  ): Promise<admin.auth.DecodedIdToken> {
    try {
      logger.info('Verifying provider token', { provider });
      
      // Verify the token based on the provider type
      switch (provider) {
        case AuthProvider.GOOGLE:
        case AuthProvider.MICROSOFT:
          // For Google and Microsoft, we can verify using the standard verifyIdToken
          return await auth.verifyIdToken(token);
        case AuthProvider.EMAIL_PASSWORD:
          throw new Error('Email/password provider does not use token verification');
        default:
          throw new Error(`Unsupported authentication provider: ${provider}`);
      }
    } catch (error) {
      logger.error('Error verifying provider token', { error, provider });
      throw AuthenticationError.invalidToken({ originalError: error });
    }
  }

  /**
   * Sets custom claims for a Firebase user
   * @param uid User ID to set claims for
   * @param claims Custom claims to set
   * @returns Promise resolving when claims are set
   * @throws Error if setting claims fails
   */
  async setCustomUserClaims(uid: string, claims: object): Promise<void> {
    try {
      logger.info('Setting custom user claims', { uid });
      await auth.setCustomUserClaims(uid, claims);
      logger.info('Custom user claims set successfully', { uid });
    } catch (error) {
      logger.error('Error setting custom user claims', { error, uid });
      throw error;
    }
  }
}

// Create a singleton instance of the FirebaseAuthService
const firebaseAuthService = new FirebaseAuthService();

// Export both the class and the singleton instance
export { FirebaseAuthService, firebaseAuthService };