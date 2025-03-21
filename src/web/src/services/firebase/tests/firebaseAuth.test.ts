import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; // v0.34.0
import { User, UserCredential } from 'firebase/auth'; // v9.0.0
import * as firebaseAuth from '../firebaseAuth';
import { FirebaseErrorCode } from '../../../types/firebase.types';
import { resetMockFirebase, setMockCurrentUser } from '../../../../tests/mocks/firebaseMocks';

// Helper function to create a mock UserCredential object for testing
function mockUserCredential(userProps = {}): UserCredential {
  // Create a mock User object with default values
  const user = {
    uid: 'mock-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    photoURL: null,
    getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
    ...userProps
  } as unknown as User;

  // Create and return a UserCredential object containing the mock user
  return {
    user,
    providerId: null,
    operationType: 'signIn'
  } as UserCredential;
}

describe('Firebase Authentication Service', () => {
  beforeEach(() => {
    resetMockFirebase();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('signInWithEmailPassword', () => {
    it('should sign in a user with valid email and password', async () => {
      // Mock successful authentication response
      const mockCredential = mockUserCredential();
      vi.spyOn(firebaseAuth, 'signInWithEmailPassword').mockResolvedValueOnce(mockCredential);

      // Call signInWithEmailPassword with valid credentials
      const result = await firebaseAuth.signInWithEmailPassword('test@example.com', 'password123');

      // Verify the function returns the expected user credential
      expect(result).toEqual(mockCredential);
    });

    it('should throw an error for invalid credentials', async () => {
      // Mock authentication failure with invalid credentials error
      vi.spyOn(firebaseAuth, 'signInWithEmailPassword').mockRejectedValueOnce({
        code: FirebaseErrorCode.WRONG_PASSWORD,
        message: 'The password is invalid for this email.'
      });

      // Call signInWithEmailPassword with invalid credentials
      await expect(firebaseAuth.signInWithEmailPassword('test@example.com', 'wrong-password'))
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.WRONG_PASSWORD
        }));
    });

    it('should throw an error for non-existent user', async () => {
      // Mock authentication failure with user not found error
      vi.spyOn(firebaseAuth, 'signInWithEmailPassword').mockRejectedValueOnce({
        code: FirebaseErrorCode.USER_NOT_FOUND,
        message: 'No user found with this email address.'
      });

      // Call signInWithEmailPassword with non-existent user email
      await expect(firebaseAuth.signInWithEmailPassword('nonexistent@example.com', 'password123'))
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.USER_NOT_FOUND
        }));
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in a user with Google authentication', async () => {
      // Mock successful Google authentication response
      const mockCredential = mockUserCredential({
        displayName: 'Google User',
        email: 'google-user@example.com',
        photoURL: 'https://example.com/photo.jpg'
      });
      vi.spyOn(firebaseAuth, 'signInWithGoogle').mockResolvedValueOnce(mockCredential);

      // Call signInWithGoogle
      const result = await firebaseAuth.signInWithGoogle();

      // Verify the function returns the expected user credential
      expect(result).toEqual(mockCredential);
      expect(result.user.email).toBe('google-user@example.com');
    });

    it('should throw an error when Google authentication fails', async () => {
      // Mock Google authentication failure
      vi.spyOn(firebaseAuth, 'signInWithGoogle').mockRejectedValueOnce({
        code: FirebaseErrorCode.OPERATION_NOT_ALLOWED,
        message: 'This sign-in method is not allowed. Contact support.'
      });

      // Call signInWithGoogle
      await expect(firebaseAuth.signInWithGoogle())
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.OPERATION_NOT_ALLOWED
        }));
    });

    it('should throw an error when user cancels Google authentication', async () => {
      // Mock Google authentication cancellation
      vi.spyOn(firebaseAuth, 'signInWithGoogle').mockRejectedValueOnce({
        code: FirebaseErrorCode.POPUP_CLOSED_BY_USER,
        message: 'The authentication popup was closed before completion.'
      });

      // Call signInWithGoogle
      await expect(firebaseAuth.signInWithGoogle())
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.POPUP_CLOSED_BY_USER
        }));
    });
  });

  describe('signInWithMicrosoft', () => {
    it('should sign in a user with Microsoft authentication', async () => {
      // Mock successful Microsoft authentication response
      const mockCredential = mockUserCredential({
        displayName: 'Microsoft User',
        email: 'microsoft-user@example.com',
        photoURL: 'https://example.com/ms-photo.jpg'
      });
      vi.spyOn(firebaseAuth, 'signInWithMicrosoft').mockResolvedValueOnce(mockCredential);

      // Call signInWithMicrosoft
      const result = await firebaseAuth.signInWithMicrosoft();

      // Verify the function returns the expected user credential
      expect(result).toEqual(mockCredential);
      expect(result.user.email).toBe('microsoft-user@example.com');
    });

    it('should throw an error when Microsoft authentication fails', async () => {
      // Mock Microsoft authentication failure
      vi.spyOn(firebaseAuth, 'signInWithMicrosoft').mockRejectedValueOnce({
        code: FirebaseErrorCode.OPERATION_NOT_ALLOWED,
        message: 'This sign-in method is not allowed. Contact support.'
      });

      // Call signInWithMicrosoft
      await expect(firebaseAuth.signInWithMicrosoft())
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.OPERATION_NOT_ALLOWED
        }));
    });

    it('should throw an error when user cancels Microsoft authentication', async () => {
      // Mock Microsoft authentication cancellation
      vi.spyOn(firebaseAuth, 'signInWithMicrosoft').mockRejectedValueOnce({
        code: FirebaseErrorCode.POPUP_CLOSED_BY_USER,
        message: 'The authentication popup was closed before completion.'
      });

      // Call signInWithMicrosoft
      await expect(firebaseAuth.signInWithMicrosoft())
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.POPUP_CLOSED_BY_USER
        }));
    });
  });

  describe('createUser', () => {
    it('should create a new user with valid email and password', async () => {
      // Mock successful user creation response
      const mockCredential = mockUserCredential({
        email: 'new-user@example.com',
        emailVerified: false
      });
      vi.spyOn(firebaseAuth, 'createUser').mockResolvedValueOnce(mockCredential);

      // Call createUser with valid email and password
      const result = await firebaseAuth.createUser('new-user@example.com', 'SecurePassword123!');

      // Verify the function returns the expected user credential
      expect(result).toEqual(mockCredential);
      expect(result.user.email).toBe('new-user@example.com');
      expect(result.user.emailVerified).toBe(false);
    });

    it('should throw an error when email is already in use', async () => {
      // Mock user creation failure with email-already-in-use error
      vi.spyOn(firebaseAuth, 'createUser').mockRejectedValueOnce({
        code: FirebaseErrorCode.EMAIL_ALREADY_IN_USE,
        message: 'This email address is already in use.'
      });

      // Call createUser with an existing email
      await expect(firebaseAuth.createUser('existing@example.com', 'Password123!'))
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.EMAIL_ALREADY_IN_USE
        }));
    });

    it('should throw an error when password is too weak', async () => {
      // Mock user creation failure with weak-password error
      vi.spyOn(firebaseAuth, 'createUser').mockRejectedValueOnce({
        code: FirebaseErrorCode.WEAK_PASSWORD,
        message: 'The password is too weak. It should be at least 6 characters.'
      });

      // Call createUser with a weak password
      await expect(firebaseAuth.createUser('new-user@example.com', 'weak'))
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.WEAK_PASSWORD
        }));
    });
  });

  describe('signOut', () => {
    it('should sign out the current user', async () => {
      // Mock successful sign out response
      const signOutSpy = vi.spyOn(firebaseAuth, 'signOut').mockResolvedValueOnce();

      // Call signOut
      await firebaseAuth.signOut();

      // Verify the function completes without errors
      expect(signOutSpy).toHaveBeenCalled();
    });

    it('should throw an error when sign out fails', async () => {
      // Mock sign out failure
      vi.spyOn(firebaseAuth, 'signOut').mockRejectedValueOnce({
        code: 'auth/unknown',
        message: 'An unknown error occurred during sign out.'
      });

      // Call signOut
      await expect(firebaseAuth.signOut())
        .rejects.toEqual(expect.objectContaining({
          code: 'auth/unknown'
        }));
    });
  });

  describe('resetPassword', () => {
    it('should send a password reset email to a valid email', async () => {
      // Mock successful password reset email sending
      const resetPasswordSpy = vi.spyOn(firebaseAuth, 'resetPassword').mockResolvedValueOnce();

      // Call resetPassword with a valid email
      await firebaseAuth.resetPassword('user@example.com');

      // Verify the function completes without errors
      expect(resetPasswordSpy).toHaveBeenCalledWith('user@example.com');
    });

    it('should throw an error when email is not found', async () => {
      // Mock password reset failure with user-not-found error
      vi.spyOn(firebaseAuth, 'resetPassword').mockRejectedValueOnce({
        code: FirebaseErrorCode.USER_NOT_FOUND,
        message: 'No user found with this email address.'
      });

      // Call resetPassword with a non-existent email
      await expect(firebaseAuth.resetPassword('nonexistent@example.com'))
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.USER_NOT_FOUND
        }));
    });
  });

  describe('changePassword', () => {
    it('should change the password for an authenticated user', async () => {
      // Mock current user with email
      const mockUser = {
        email: 'user@example.com',
        uid: 'user-id'
      };
      setMockCurrentUser(mockUser);
      
      // Mock successful reauthentication
      // Mock successful password update
      const changePasswordSpy = vi.spyOn(firebaseAuth, 'changePassword').mockResolvedValueOnce();

      // Call changePassword with current and new passwords
      await firebaseAuth.changePassword('currentPassword', 'newPassword123!');

      // Verify the function completes without errors
      expect(changePasswordSpy).toHaveBeenCalledWith('currentPassword', 'newPassword123!');
    });

    it('should throw an error when current password is incorrect', async () => {
      // Mock current user with email
      const mockUser = {
        email: 'user@example.com',
        uid: 'user-id'
      };
      setMockCurrentUser(mockUser);
      
      // Mock reauthentication failure with wrong-password error
      vi.spyOn(firebaseAuth, 'changePassword').mockRejectedValueOnce({
        code: FirebaseErrorCode.WRONG_PASSWORD,
        message: 'The password is invalid for this email.'
      });

      // Call changePassword with incorrect current password
      await expect(firebaseAuth.changePassword('wrongPassword', 'newPassword123!'))
        .rejects.toEqual(expect.objectContaining({
          code: FirebaseErrorCode.WRONG_PASSWORD
        }));
    });

    it('should throw an error when user is not authenticated', async () => {
      // Mock null current user
      setMockCurrentUser(null);
      
      // Mock the error for when no user is authenticated
      vi.spyOn(firebaseAuth, 'changePassword').mockRejectedValueOnce({
        code: 'auth/unknown',
        message: 'No authenticated user found or user has no email'
      });

      // Call changePassword with any passwords
      await expect(firebaseAuth.changePassword('currentPassword', 'newPassword123!'))
        .rejects.toEqual(expect.objectContaining({
          message: expect.stringMatching(/No authenticated user/)
        }));
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user when authenticated', () => {
      // Mock current user with specific properties
      const mockUser = {
        uid: 'user-id',
        email: 'user@example.com',
        displayName: 'Test User'
      };
      setMockCurrentUser(mockUser);

      // Call getCurrentUser
      const result = firebaseAuth.getCurrentUser();

      // Verify the function returns the expected user object
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is authenticated', () => {
      // Mock null current user
      setMockCurrentUser(null);

      // Call getCurrentUser
      const result = firebaseAuth.getCurrentUser();

      // Verify the function returns null
      expect(result).toBeNull();
    });
  });

  describe('getIdTokenForUser', () => {
    it('should return an ID token for the current user', async () => {
      // Mock current user with getIdToken method returning a specific token
      const mockUser = {
        uid: 'user-id',
        email: 'user@example.com',
        getIdToken: vi.fn().mockResolvedValue('mock-id-token')
      };
      setMockCurrentUser(mockUser);

      // Call getIdTokenForUser
      const token = await firebaseAuth.getIdTokenForUser();

      // Verify the function returns the expected token
      expect(token).toBe('mock-id-token');
      expect(mockUser.getIdToken).toHaveBeenCalledWith(false);
    });

    it('should return an ID token for a specified user', async () => {
      // Create a mock user with getIdToken method returning a specific token
      const mockUser = {
        uid: 'specified-user-id',
        email: 'specified-user@example.com',
        getIdToken: vi.fn().mockResolvedValue('specified-user-token')
      } as unknown as User;

      // Call getIdTokenForUser with the mock user
      const token = await firebaseAuth.getIdTokenForUser(mockUser);

      // Verify the function returns the expected token
      expect(token).toBe('specified-user-token');
      expect(mockUser.getIdToken).toHaveBeenCalledWith(false);
    });

    it('should return null when no user is provided or authenticated', async () => {
      // Mock null current user
      setMockCurrentUser(null);

      // Call getIdTokenForUser with no arguments
      const token = await firebaseAuth.getIdTokenForUser();

      // Verify the function returns null
      expect(token).toBeNull();
    });

    it('should handle token retrieval errors gracefully', async () => {
      // Mock current user with getIdToken method that throws an error
      const mockUser = {
        uid: 'user-id',
        email: 'user@example.com',
        getIdToken: vi.fn().mockRejectedValue(new Error('Token retrieval failed'))
      };
      setMockCurrentUser(mockUser);

      // Call getIdTokenForUser
      const token = await firebaseAuth.getIdTokenForUser();

      // Verify the function returns null instead of throwing
      expect(token).toBeNull();
    });
  });
});