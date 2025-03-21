/**
 * Firebase Authentication Service
 * 
 * Provides authentication functionality for the Metronomics Platform using Firebase Authentication.
 * Supports email/password login, social sign-in with Google and Microsoft, and user management.
 */

import { firebase } from './firebaseConfig';
import { FirebaseAuthError, FirebaseErrorCode } from '../../types/firebase.types';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  signOut as firebaseSignOut,
  User,
  UserCredential,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'; // Firebase v9.0.0

/**
 * Authenticates a user with email and password using Firebase Authentication
 * @param email The user's email address
 * @param password The user's password
 * @returns Promise resolving to the UserCredential on successful authentication
 * @throws FirebaseAuthError if authentication fails
 */
export const signInWithEmailPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(firebase.auth, email, password);
    return userCredential;
  } catch (error) {
    handleFirebaseAuthError(error);
  }
};

/**
 * Authenticates a user using Google OAuth provider via popup
 * @returns Promise resolving to the UserCredential on successful authentication
 * @throws FirebaseAuthError if authentication fails
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const googleProvider = new GoogleAuthProvider();
    // Add scopes for email and profile information
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    const userCredential = await signInWithPopup(firebase.auth, googleProvider);
    return userCredential;
  } catch (error) {
    handleFirebaseAuthError(error);
  }
};

/**
 * Authenticates a user using Microsoft OAuth provider via popup
 * @returns Promise resolving to the UserCredential on successful authentication
 * @throws FirebaseAuthError if authentication fails
 */
export const signInWithMicrosoft = async (): Promise<UserCredential> => {
  try {
    // Create a new OAuthProvider instance for Microsoft
    const microsoftProvider = new OAuthProvider('microsoft.com');
    // Add scopes for email and profile information
    microsoftProvider.addScope('email');
    microsoftProvider.addScope('profile');
    // Set custom parameters for prompt behavior
    microsoftProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const userCredential = await signInWithPopup(firebase.auth, microsoftProvider);
    return userCredential;
  } catch (error) {
    handleFirebaseAuthError(error);
  }
};

/**
 * Creates a new user account with email and password
 * @param email The user's email address
 * @param password The user's password
 * @returns Promise resolving to the UserCredential for the newly created user
 * @throws FirebaseAuthError if user creation fails
 */
export const createUser = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(firebase.auth, email, password);
    return userCredential;
  } catch (error) {
    handleFirebaseAuthError(error);
  }
};

/**
 * Signs out the currently authenticated user
 * @returns Promise that resolves when sign-out is complete
 * @throws FirebaseAuthError if sign-out fails
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(firebase.auth);
  } catch (error) {
    handleFirebaseAuthError(error);
  }
};

/**
 * Sends a password reset email to the specified email address
 * @param email The email address to send the password reset link to
 * @returns Promise that resolves when the password reset email is sent
 * @throws FirebaseAuthError if the process fails
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(firebase.auth, email);
  } catch (error) {
    handleFirebaseAuthError(error);
  }
};

/**
 * Changes the password for the current user
 * Requires recent authentication which is handled by re-authenticating with the current password
 * @param currentPassword The user's current password for verification
 * @param newPassword The new password to set
 * @returns Promise that resolves when the password is changed
 * @throws FirebaseAuthError if the password change fails
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const user = firebase.auth.currentUser;
    
    if (!user || !user.email) {
      throw new Error('No authenticated user found or user has no email');
    }
    
    // Re-authenticate the user with their current password to verify identity
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Call updatePassword from Firebase Auth with the new password
    await updatePassword(user, newPassword);
  } catch (error) {
    handleFirebaseAuthError(error);
  }
};

/**
 * Gets the currently authenticated Firebase user
 * @returns The current Firebase user or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  return firebase.auth.currentUser;
};

/**
 * Gets the ID token for the specified user or the current user
 * @param user The user to get the token for, or null to use the current user
 * @param forceRefresh Whether to force a token refresh
 * @returns Promise resolving to the ID token string, or null if no user is provided/authenticated
 */
export const getIdTokenForUser = async (
  user: User | null = null,
  forceRefresh: boolean = false
): Promise<string | null> => {
  try {
    // Check if a user object is provided, if not, get the current user
    const currentUser = user || firebase.auth.currentUser;
    
    // If no user is available, return null
    if (!currentUser) {
      return null;
    }
    
    // Call getIdToken on the user object with the forceRefresh parameter
    const token = await currentUser.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

/**
 * Transforms Firebase authentication errors into a standardized format
 * @param error The error thrown by Firebase
 * @throws Standardized FirebaseAuthError with appropriate code and message
 */
export const handleFirebaseAuthError = (error: any): never => {
  console.error('Firebase Auth Error:', error);
  
  let code = 'auth/unknown';
  let message = 'An unknown error occurred during authentication.';
  
  // Check if the error is a Firebase AuthError with a code property
  if (error.code) {
    code = error.code;
    
    // Map the Firebase error code to a user-friendly message
    switch (error.code) {
      case FirebaseErrorCode.INVALID_EMAIL:
        message = 'The email address is not valid.';
        break;
      case FirebaseErrorCode.USER_DISABLED:
        message = 'This user account has been disabled.';
        break;
      case FirebaseErrorCode.USER_NOT_FOUND:
        message = 'No user found with this email address.';
        break;
      case FirebaseErrorCode.WRONG_PASSWORD:
        message = 'The password is invalid for this email.';
        break;
      case FirebaseErrorCode.EMAIL_ALREADY_IN_USE:
        message = 'This email address is already in use.';
        break;
      case FirebaseErrorCode.WEAK_PASSWORD:
        message = 'The password is too weak. It should be at least 6 characters.';
        break;
      case FirebaseErrorCode.OPERATION_NOT_ALLOWED:
        message = 'This sign-in method is not allowed. Contact support.';
        break;
      case FirebaseErrorCode.EXPIRED_ACTION_CODE:
        message = 'The action code has expired. Please request a new one.';
        break;
      case FirebaseErrorCode.INVALID_ACTION_CODE:
        message = 'The action code is invalid. Please request a new one.';
        break;
      case FirebaseErrorCode.NETWORK_REQUEST_FAILED:
        message = 'A network error occurred. Please check your connection.';
        break;
      case FirebaseErrorCode.POPUP_CLOSED_BY_USER:
        message = 'The authentication popup was closed before completion.';
        break;
      case FirebaseErrorCode.QUOTA_EXCEEDED:
        message = 'Quota exceeded. Please try again later.';
        break;
      default:
        message = error.message || message;
    }
  }
  
  // Create a standardized FirebaseAuthError object
  const authError: FirebaseAuthError = {
    code,
    message,
    email: error.email,
    credential: error.credential
  };
  
  throw authError;
};