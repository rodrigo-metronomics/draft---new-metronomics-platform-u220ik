import { FirebaseApp } from 'firebase/app'; // Firebase v9.0.0
import { Auth, User, UserCredential } from 'firebase/auth'; // Firebase v9.0.0
import { 
  Firestore, 
  DocumentData, 
  QueryDocumentSnapshot, 
  Timestamp, 
  DocumentReference, 
  CollectionReference, 
  Query, 
  WhereFilterOp, 
  OrderByDirection 
} from 'firebase/firestore'; // Firebase v9.0.0
import { Messaging, MessagePayload } from 'firebase/messaging'; // Firebase v9.0.0

/**
 * Configuration interface for Firebase initialization
 * Contains all necessary keys and IDs for setting up Firebase services
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

/**
 * Interface representing all initialized Firebase services
 * Used to access Firebase services throughout the application
 */
export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  messaging: Messaging | null; // Can be null if messaging is not supported (e.g., in some browsers)
}

/**
 * Interface for Firebase authentication errors
 * Provides structure for handling and displaying auth-related errors
 */
export interface FirebaseAuthError {
  code: string;
  message: string;
  email?: string;
  credential?: any;
}

/**
 * Enum for Firestore collection names used in the application
 * Centralizes collection names to prevent typos and ensure consistency
 */
export enum FirestoreCollections {
  ORGANIZATIONS = 'organizations',
  USERS = 'users',
  ACTIVE_MEETINGS = 'active_meetings',
  MEETING_STAGES = 'meeting_stages',
  ACTION_ITEMS = 'action_items',
  USER_PRESENCE = 'user_presence',
  NOTIFICATIONS = 'notifications'
}

/**
 * Base interface for all Firestore documents
 * Contains common fields that all document types should have
 */
export interface FirestoreDocument {
  id: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Interface for Firestore query constraints
 * Used for building queries to filter Firestore collections
 */
export interface FirestoreQuery {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

/**
 * Interface for Firestore query options
 * Used for pagination, sorting, and limiting query results
 */
export interface FirestoreQueryOptions {
  orderBy: {
    field: string;
    direction: OrderByDirection;
  };
  limit: number;
  startAfter: DocumentData | QueryDocumentSnapshot<DocumentData>;
}

/**
 * Generic interface for Firestore data converters
 * Facilitates type-safe conversions between app models and Firestore data
 */
export interface FirestoreConverter<T> {
  toFirestore: (data: T) => DocumentData;
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>) => T;
}

/**
 * Interface for Firebase Cloud Messaging notification payload
 * Defines the structure of push notifications sent via FCM
 */
export interface FirebaseMessagingPayload {
  notification: {
    title: string;
    body: string;
    icon?: string;
  };
  data: { [key: string]: string };
  type: string;
  timestamp: number;
}

/**
 * Interface for Firebase Cloud Messaging device tokens
 * Used for targeting specific devices for push notifications
 */
export interface FirebaseMessagingToken {
  token: string;
  createdAt: Date;
}

/**
 * Enum for common Firebase error codes
 * Used for handling specific error cases in the application
 */
export enum FirebaseErrorCode {
  // Authentication error codes
  INVALID_EMAIL = 'auth/invalid-email',
  USER_DISABLED = 'auth/user-disabled',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  WEAK_PASSWORD = 'auth/weak-password',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  EXPIRED_ACTION_CODE = 'auth/expired-action-code',
  INVALID_ACTION_CODE = 'auth/invalid-action-code',
  
  // General error codes
  NETWORK_REQUEST_FAILED = 'auth/network-request-failed',
  POPUP_CLOSED_BY_USER = 'auth/popup-closed-by-user',
  QUOTA_EXCEEDED = 'auth/quota-exceeded'
}