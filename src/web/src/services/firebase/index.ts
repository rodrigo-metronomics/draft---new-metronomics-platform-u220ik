/**
 * Firebase Service Integration Module
 * 
 * This module serves as the main entry point for all Firebase-related functionality in the Metronomics Platform.
 * It integrates authentication, real-time database, and messaging services from Firebase to support
 * user authentication, real-time collaboration, and notifications throughout the application.
 * 
 * @module firebase
 */

// Import Firebase service instances from firebaseConfig
import { firebase } from './firebaseConfig';

// Import authentication services
import * as authService from './firebaseAuth';

// Import Firestore database services
import * as firestoreService from './firebaseFirestore';

// Import messaging services
import * as messagingService from './firebaseMessaging';

// Re-export Firebase service instances
export { firebase };

// Re-export authentication functions
export const {
  signInWithEmailPassword,   // Authenticate with email and password
  signInWithGoogle,          // Authenticate with Google OAuth
  signInWithMicrosoft,       // Authenticate with Microsoft OAuth
  createUser,                // Create a new user account
  signOut,                   // Sign out the current user
  resetPassword,             // Send password reset email
  changePassword,            // Change user password
  getCurrentUser,            // Get the current authenticated user
  getIdTokenForUser          // Get ID token for the user
} = authService;

// Re-export Firestore functions
export const {
  getDocument,              // Get a single document
  getDocuments,             // Query for multiple documents
  createDocument,           // Create a new document
  updateDocument,           // Update an existing document
  deleteDocument,           // Delete a document
  subscribeToDocument,      // Listen for changes to a document
  subscribeToCollection,    // Listen for changes to a collection
  batchWrite,               // Perform multiple writes in a batch
  runTransaction,           // Execute a transaction
  createConverter,          // Create a data converter
  timestampToDate,          // Convert Firestore timestamp to Date
  dateToTimestamp,          // Convert Date to Firestore timestamp
  getServerTimestamp,       // Get server timestamp
  
  // Meeting-specific real-time functionality
  subscribeToMeeting,       // Listen for changes to a meeting
  subscribeToMeetingStages, // Listen for changes to meeting stages
  subscribeToActionItems,   // Listen for changes to action items
  updateMeetingPresence     // Update user presence in a meeting
} = firestoreService;

// Re-export messaging functions
export const {
  initializeMessaging,            // Initialize Firebase messaging
  requestNotificationPermission,  // Request permission for notifications
  getMessagingToken,              // Get FCM token for the device
  deleteMessagingToken,           // Delete FCM token
  onMessageReceived,              // Listen for incoming messages
  registerServiceWorker           // Register service worker for background notifications
} = messagingService;