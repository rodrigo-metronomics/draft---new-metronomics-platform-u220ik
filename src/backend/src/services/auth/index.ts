/**
 * Index file that exports the authentication services for the Metronomics Platform.
 * This file serves as the entry point for the auth module, exporting both the AuthService and FirebaseAuthService implementations to provide a unified interface for authentication functionality throughout the application.
 */

import { AuthService, authService } from './authService';
import { FirebaseAuthService, firebaseAuthService } from './firebaseAuthService';

export {
  AuthService,
  authService,
  FirebaseAuthService,
  firebaseAuthService
};