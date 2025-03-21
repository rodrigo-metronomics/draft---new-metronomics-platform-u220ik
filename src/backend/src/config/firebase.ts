/**
 * Firebase Configuration Module
 * 
 * Initializes and exports Firebase services for the Metronomics Platform.
 * This module sets up Firebase Admin SDK with appropriate credentials,
 * initializes Authentication, Firestore, and Cloud Messaging services,
 * and provides these services to the rest of the application.
 */
import admin from 'firebase-admin'; // v11.8.0
import { secrets } from './secrets';
import { env } from './environment';
import { logger } from '../utils/helpers/logger';

// Track Firebase initialization
let isInitialized = false;

/**
 * Initializes Firebase Admin SDK with appropriate credentials
 * @returns Promise that resolves when Firebase is successfully initialized
 */
export async function initializeFirebase(): Promise<void> {
  // Prevent multiple initializations
  if (isInitialized) {
    logger.info('Firebase already initialized.');
    return;
  }

  try {
    logger.info('Initializing Firebase Admin SDK...');
    
    // Create credential object
    const credential = admin.credential.cert({
      projectId: secrets.FIREBASE_PROJECT_ID,
      clientEmail: secrets.FIREBASE_CLIENT_EMAIL,
      privateKey: secrets.FIREBASE_PRIVATE_KEY,
    });

    // Initialize the app
    admin.initializeApp({
      credential,
      databaseURL: secrets.FIREBASE_DATABASE_URL,
    });

    isInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully.');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to initialize Firebase: ${errorMessage}`);
    throw err;
  }
}

/**
 * Gets the initialized Firebase app instance or initializes it if not already done
 * @returns Firebase app instance
 */
export function getFirebaseApp(): admin.app.App {
  if (!isInitialized) {
    try {
      // Initialize Firebase synchronously
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: secrets.FIREBASE_PROJECT_ID,
          clientEmail: secrets.FIREBASE_CLIENT_EMAIL,
          privateKey: secrets.FIREBASE_PRIVATE_KEY,
        }),
        databaseURL: secrets.FIREBASE_DATABASE_URL,
      });
      
      isInitialized = true;
      logger.info('Firebase Admin SDK initialized on first use.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to initialize Firebase on first use: ${errorMessage}`);
      throw err;
    }
  }
  
  return admin.app();
}

/**
 * Creates mock Firebase services for testing environments
 * @returns Mock Firebase services object
 */
function getMockFirebaseServices() {
  logger.info('Using mock Firebase services for testing environment');

  // Basic mock implementations with essential functions
  const mockAuth = {
    verifyIdToken: async () => ({ uid: 'test-uid' }),
    createCustomToken: async () => 'mock-custom-token',
    getUserByEmail: async () => ({ uid: 'test-uid', email: 'test@example.com' }),
    getUserByUid: async () => ({ uid: 'test-uid', email: 'test@example.com' }),
  };

  const mockFirestore = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async () => ({}),
      }),
      get: async () => ({ docs: [], empty: true }),
      add: async () => ({ id: 'mock-doc-id' }),
    }),
    doc: () => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
    }),
    batch: () => ({
      set: () => ({ commit: async () => ({}) }),
      update: () => ({ commit: async () => ({}) }),
      delete: () => ({ commit: async () => ({}) }),
      commit: async () => ({}),
    }),
    runTransaction: async (fn: Function) => fn({
      get: async () => ({ exists: false, data: () => null }),
      set: () => ({}),
      update: () => ({}),
      delete: () => ({}),
    }),
  };

  const mockMessaging = {
    send: async () => 'mock-message-id',
    sendMulticast: async () => ({ successCount: 1, failureCount: 0 }),
    sendToTopic: async () => 'mock-message-id',
  };

  return {
    auth: mockAuth,
    firestore: mockFirestore,
    messaging: mockMessaging,
  };
}

// Initialize services based on environment
let auth: admin.auth.Auth;
let firestore: admin.firestore.Firestore;
let messaging: admin.messaging.Messaging;

// Use mock services in test environment
if (env.isTest) {
  const mockServices = getMockFirebaseServices();
  auth = mockServices.auth as unknown as admin.auth.Auth;
  firestore = mockServices.firestore as unknown as admin.firestore.Firestore;
  messaging = mockServices.messaging as unknown as admin.messaging.Messaging;
} else {
  // Try to initialize Firebase during module loading in non-development environments
  if (!env.isDevelopment) {
    try {
      // Initialize Firebase
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: secrets.FIREBASE_PROJECT_ID,
          clientEmail: secrets.FIREBASE_CLIENT_EMAIL,
          privateKey: secrets.FIREBASE_PRIVATE_KEY,
        }),
        databaseURL: secrets.FIREBASE_DATABASE_URL,
      });
      
      isInitialized = true;
      logger.info('Firebase Admin SDK initialized during module loading.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to initialize Firebase during module loading: ${errorMessage}`);
      logger.info('Firebase services will attempt to initialize on first use.');
    }
  }
  
  // Get Firebase services
  auth = admin.auth();
  firestore = admin.firestore();
  messaging = admin.messaging();
}

// Export Firebase services
export { auth, firestore, messaging };