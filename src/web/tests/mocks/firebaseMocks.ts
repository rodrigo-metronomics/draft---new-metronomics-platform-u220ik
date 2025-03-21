import { vi } from 'vitest'; // v0.34.0
import {
  FirebaseConfig,
  FirebaseServices,
  FirebaseAuthError,
  FirebaseErrorCode,
  FirestoreCollections,
  FirestoreDocument,
  FirebaseMessagingPayload,
  FirebaseMessagingToken
} from '../../src/types/firebase.types';
import { AuthUser } from '../../src/types/auth.types';

// Mock data store for Firestore collections
type MockFirestoreData = {
  [collection: string]: {
    [docId: string]: any;
  };
};

// Mock data store for Firestore
const mockFirestoreData: MockFirestoreData = {};

// Mock Firebase configuration
export const mockFirebaseConfig: FirebaseConfig = {
  apiKey: 'mock-api-key',
  authDomain: 'mock-metronomics.firebaseapp.com',
  projectId: 'mock-metronomics',
  storageBucket: 'mock-metronomics.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
  measurementId: 'G-ABCDEFGHIJ'
};

// Mock document and collection subscriptions for real-time updates
const documentSubscriptions: { [key: string]: Array<(data: any) => void> } = {};
const collectionSubscriptions: { [key: string]: Array<(data: any[]) => void> } = {};

/**
 * Resets all Firebase mocks to their initial state between tests
 */
export function resetMockFirebase(): void {
  // Reset all mock implementations
  vi.resetAllMocks();
  
  // Clear mock firestore data
  Object.keys(mockFirestoreData).forEach(collection => {
    delete mockFirestoreData[collection];
  });
  
  // Clear all subscriptions
  Object.keys(documentSubscriptions).forEach(key => {
    documentSubscriptions[key] = [];
  });
  
  Object.keys(collectionSubscriptions).forEach(key => {
    collectionSubscriptions[key] = [];
  });
  
  // Reset mock auth state
  mockAuth.currentUser = null;
}

/**
 * Creates a mock Firebase app instance
 */
function createMockFirebaseApp() {
  return {
    name: '[DEFAULT]',
    options: { ...mockFirebaseConfig },
    delete: vi.fn().mockResolvedValue(undefined),
    automaticDataCollectionEnabled: false
  };
}

// Mock Firebase Auth instance
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    // Call the callback immediately with current user
    callback(mockAuth.currentUser);
    // Return unsubscribe function
    return vi.fn();
  }),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  updatePassword: vi.fn().mockResolvedValue(undefined),
  verifyPasswordResetCode: vi.fn().mockResolvedValue('mock-email@example.com'),
  confirmPasswordReset: vi.fn().mockResolvedValue(undefined)
};

/**
 * Creates a mock Firebase Auth instance with all necessary methods
 */
function createMockAuth() {
  return mockAuth;
}

/**
 * Creates a mock Firebase Firestore instance with all necessary methods
 */
function createMockFirestore() {
  return {
    collection: vi.fn((collectionName: string) => ({
      doc: vi.fn((docId: string = `mock-${Date.now()}`) => ({
        id: docId,
        path: `${collectionName}/${docId}`,
        get: vi.fn().mockImplementation(() => {
          const collection = mockFirestoreData[collectionName] || {};
          const doc = collection[docId];
          return Promise.resolve({
            exists: !!doc,
            data: () => doc || null,
            id: docId
          });
        }),
        set: vi.fn().mockImplementation((data: any) => {
          if (!mockFirestoreData[collectionName]) {
            mockFirestoreData[collectionName] = {};
          }
          mockFirestoreData[collectionName][docId] = {
            ...data,
            updatedAt: new Date()
          };
          
          // Trigger document subscribers
          const key = `${collectionName}/${docId}`;
          if (documentSubscriptions[key]) {
            const updatedDoc = { id: docId, ...mockFirestoreData[collectionName][docId] };
            documentSubscriptions[key].forEach(callback => callback(updatedDoc));
          }
          
          return Promise.resolve();
        }),
        update: vi.fn().mockImplementation((data: any) => {
          if (!mockFirestoreData[collectionName] || !mockFirestoreData[collectionName][docId]) {
            return Promise.reject(new Error('Document not found'));
          }
          mockFirestoreData[collectionName][docId] = {
            ...mockFirestoreData[collectionName][docId],
            ...data,
            updatedAt: new Date()
          };
          
          // Trigger document subscribers
          const key = `${collectionName}/${docId}`;
          if (documentSubscriptions[key]) {
            const updatedDoc = { id: docId, ...mockFirestoreData[collectionName][docId] };
            documentSubscriptions[key].forEach(callback => callback(updatedDoc));
          }
          
          return Promise.resolve();
        }),
        delete: vi.fn().mockImplementation(() => {
          if (mockFirestoreData[collectionName] && mockFirestoreData[collectionName][docId]) {
            delete mockFirestoreData[collectionName][docId];
            
            // Trigger document subscribers with null (document deleted)
            const key = `${collectionName}/${docId}`;
            if (documentSubscriptions[key]) {
              documentSubscriptions[key].forEach(callback => callback(null));
            }
          }
          return Promise.resolve();
        }),
        onSnapshot: vi.fn().mockImplementation((callback) => {
          const key = `${collectionName}/${docId}`;
          if (!documentSubscriptions[key]) {
            documentSubscriptions[key] = [];
          }
          
          documentSubscriptions[key].push(callback);
          
          // Trigger initial callback
          const collection = mockFirestoreData[collectionName] || {};
          const doc = collection[docId];
          callback(doc ? { id: docId, ...doc } : null);
          
          // Return unsubscribe function
          return () => {
            documentSubscriptions[key] = documentSubscriptions[key].filter(cb => cb !== callback);
          };
        })
      })),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn().mockImplementation(() => {
        const collection = mockFirestoreData[collectionName] || {};
        const docs = Object.entries(collection).map(([id, data]) => ({
          id,
          data: () => data,
          exists: true
        }));
        return Promise.resolve({
          docs,
          empty: docs.length === 0,
          size: docs.length
        });
      }),
      onSnapshot: vi.fn().mockImplementation((callback) => {
        if (!collectionSubscriptions[collectionName]) {
          collectionSubscriptions[collectionName] = [];
        }
        
        collectionSubscriptions[collectionName].push(callback);
        
        // Trigger initial callback
        const collection = mockFirestoreData[collectionName] || {};
        const docs = Object.entries(collection).map(([id, data]) => ({
          id,
          data: () => data,
          exists: true
        }));
        
        callback({
          docs,
          empty: docs.length === 0,
          size: docs.length
        });
        
        // Return unsubscribe function
        return () => {
          collectionSubscriptions[collectionName] = collectionSubscriptions[collectionName].filter(cb => cb !== callback);
        };
      })
    })),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined)
    })),
    runTransaction: vi.fn().mockImplementation(async (transactionFn) => {
      const transaction = {
        get: vi.fn().mockImplementation(async (docRef) => {
          const pathParts = docRef.path.split('/');
          const collectionName = pathParts[0];
          const docId = pathParts[1];
          const collection = mockFirestoreData[collectionName] || {};
          const doc = collection[docId];
          return {
            exists: !!doc,
            data: () => doc || null,
            id: docId
          };
        }),
        set: vi.fn().mockImplementation((docRef, data) => {
          const pathParts = docRef.path.split('/');
          const collectionName = pathParts[0];
          const docId = pathParts[1];
          if (!mockFirestoreData[collectionName]) {
            mockFirestoreData[collectionName] = {};
          }
          mockFirestoreData[collectionName][docId] = {
            ...data,
            updatedAt: new Date()
          };
        }),
        update: vi.fn().mockImplementation((docRef, data) => {
          const pathParts = docRef.path.split('/');
          const collectionName = pathParts[0];
          const docId = pathParts[1];
          if (!mockFirestoreData[collectionName] || !mockFirestoreData[collectionName][docId]) {
            throw new Error('Document not found');
          }
          mockFirestoreData[collectionName][docId] = {
            ...mockFirestoreData[collectionName][docId],
            ...data,
            updatedAt: new Date()
          };
        }),
        delete: vi.fn().mockImplementation((docRef) => {
          const pathParts = docRef.path.split('/');
          const collectionName = pathParts[0];
          const docId = pathParts[1];
          if (mockFirestoreData[collectionName] && mockFirestoreData[collectionName][docId]) {
            delete mockFirestoreData[collectionName][docId];
          }
        })
      };
      
      return await transactionFn(transaction);
    }),
    Timestamp: {
      now: vi.fn().mockImplementation(() => new Date()),
      fromDate: vi.fn().mockImplementation((date) => date),
      serverTimestamp: vi.fn().mockImplementation(() => new Date())
    }
  };
}

/**
 * Creates a mock Firebase Cloud Messaging instance
 */
function createMockMessaging() {
  return {
    isSupported: vi.fn().mockResolvedValue(true),
    getToken: vi.fn().mockResolvedValue('mock-messaging-token'),
    deleteToken: vi.fn().mockResolvedValue(true),
    onMessage: vi.fn((callback) => {
      // Return unsubscribe function
      return vi.fn();
    })
  };
}

// Create mock Firebase services
export const mockFirebase: FirebaseServices = {
  app: createMockFirebaseApp(),
  auth: createMockAuth(),
  firestore: createMockFirestore(),
  messaging: createMockMessaging()
};

/**
 * Mock implementation of signInWithEmailPassword function
 */
export function mockSignInWithEmailPassword(email: string, password: string): Promise<object> {
  // Simulate successful login with mock credentials
  if (email === 'test@example.com' && password === 'password123') {
    const user = {
      uid: 'mock-user-id',
      email: email,
      displayName: 'Test User',
      photoURL: null,
      emailVerified: true
    };
    mockAuth.currentUser = user;
    return Promise.resolve({ user });
  }
  
  // Simulate authentication error
  return Promise.reject({
    code: FirebaseErrorCode.WRONG_PASSWORD,
    message: 'The password is invalid or the user does not have a password.'
  });
}

/**
 * Mock implementation of signInWithGoogle function
 */
export function mockSignInWithGoogle(): Promise<object> {
  const user = {
    uid: 'google-user-id',
    email: 'google-user@example.com',
    displayName: 'Google User',
    photoURL: 'https://example.com/photo.jpg',
    emailVerified: true
  };
  mockAuth.currentUser = user;
  return Promise.resolve({ user });
}

/**
 * Mock implementation of signInWithMicrosoft function
 */
export function mockSignInWithMicrosoft(): Promise<object> {
  const user = {
    uid: 'microsoft-user-id',
    email: 'microsoft-user@example.com',
    displayName: 'Microsoft User',
    photoURL: 'https://example.com/photo.jpg',
    emailVerified: true
  };
  mockAuth.currentUser = user;
  return Promise.resolve({ user });
}

/**
 * Mock implementation of createUser function
 */
export function mockCreateUser(email: string, password: string): Promise<object> {
  // Check if email already exists
  if (email === 'existing@example.com') {
    return Promise.reject({
      code: FirebaseErrorCode.EMAIL_ALREADY_IN_USE,
      message: 'The email address is already in use by another account.'
    });
  }
  
  const user = {
    uid: 'new-user-id',
    email: email,
    displayName: null,
    photoURL: null,
    emailVerified: false
  };
  mockAuth.currentUser = user;
  return Promise.resolve({ user });
}

/**
 * Mock implementation of signOut function
 */
export function mockSignOut(): Promise<void> {
  mockAuth.currentUser = null;
  return Promise.resolve();
}

/**
 * Mock implementation of getDocument function
 */
export function mockGetDocument(collectionName: string, documentId: string): Promise<object | null> {
  const collection = mockFirestoreData[collectionName] || {};
  const doc = collection[documentId];
  return Promise.resolve(doc ? { id: documentId, ...doc } : null);
}

/**
 * Mock implementation of getDocuments function
 */
export function mockGetDocuments(collectionName: string, queries = [], options = {}): Promise<any[]> {
  const collection = mockFirestoreData[collectionName] || {};
  let docs = Object.entries(collection).map(([id, data]) => ({ id, ...data }));
  
  // Apply filtering if queries are provided
  if (queries.length > 0) {
    docs = docs.filter(doc => {
      return queries.every(query => {
        const { field, operator, value } = query;
        switch (operator) {
          case '==': return doc[field] === value;
          case '!=': return doc[field] !== value;
          case '>': return doc[field] > value;
          case '>=': return doc[field] >= value;
          case '<': return doc[field] < value;
          case '<=': return doc[field] <= value;
          case 'array-contains': return Array.isArray(doc[field]) && doc[field].includes(value);
          default: return true;
        }
      });
    });
  }
  
  // Apply sorting if orderBy is provided
  if (options.orderBy) {
    const { field, direction } = options.orderBy;
    docs.sort((a, b) => {
      if (direction === 'asc') {
        return a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      } else {
        return a[field] > b[field] ? -1 : a[field] < b[field] ? 1 : 0;
      }
    });
  }
  
  // Apply pagination if limit is provided
  if (options.limit) {
    docs = docs.slice(0, options.limit);
  }
  
  return Promise.resolve(docs);
}

/**
 * Mock implementation of createDocument function
 */
export function mockCreateDocument(collectionName: string, data: any, documentId?: string): Promise<string> {
  const id = documentId || `mock-doc-${Date.now()}`;
  if (!mockFirestoreData[collectionName]) {
    mockFirestoreData[collectionName] = {};
  }
  
  const now = new Date();
  const document = {
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: now
  };
  
  mockFirestoreData[collectionName][id] = document;
  
  // Trigger collection subscribers
  if (collectionSubscriptions[collectionName]) {
    const docs = Object.entries(mockFirestoreData[collectionName]).map(([docId, docData]) => ({
      id: docId,
      data: () => docData,
      exists: true
    }));
    
    collectionSubscriptions[collectionName].forEach(callback => {
      callback({
        docs,
        empty: docs.length === 0,
        size: docs.length
      });
    });
  }
  
  return Promise.resolve(id);
}

/**
 * Mock implementation of updateDocument function
 */
export function mockUpdateDocument(collectionName: string, documentId: string, data: any): Promise<void> {
  if (!mockFirestoreData[collectionName] || !mockFirestoreData[collectionName][documentId]) {
    return Promise.reject(new Error('Document not found'));
  }
  
  mockFirestoreData[collectionName][documentId] = {
    ...mockFirestoreData[collectionName][documentId],
    ...data,
    updatedAt: new Date()
  };
  
  // Trigger document subscribers
  const key = `${collectionName}/${documentId}`;
  if (documentSubscriptions[key]) {
    const updatedDoc = { id: documentId, ...mockFirestoreData[collectionName][documentId] };
    documentSubscriptions[key].forEach(callback => callback(updatedDoc));
  }
  
  // Trigger collection subscribers
  if (collectionSubscriptions[collectionName]) {
    const docs = Object.entries(mockFirestoreData[collectionName]).map(([docId, docData]) => ({
      id: docId,
      data: () => docData,
      exists: true
    }));
    
    collectionSubscriptions[collectionName].forEach(callback => {
      callback({
        docs,
        empty: docs.length === 0,
        size: docs.length
      });
    });
  }
  
  return Promise.resolve();
}

/**
 * Mock implementation of deleteDocument function
 */
export function mockDeleteDocument(collectionName: string, documentId: string): Promise<void> {
  if (mockFirestoreData[collectionName] && mockFirestoreData[collectionName][documentId]) {
    delete mockFirestoreData[collectionName][documentId];
    
    // Trigger document subscribers
    const key = `${collectionName}/${documentId}`;
    if (documentSubscriptions[key]) {
      documentSubscriptions[key].forEach(callback => callback(null));
    }
    
    // Trigger collection subscribers
    if (collectionSubscriptions[collectionName]) {
      const docs = Object.entries(mockFirestoreData[collectionName]).map(([docId, docData]) => ({
        id: docId,
        data: () => docData,
        exists: true
      }));
      
      collectionSubscriptions[collectionName].forEach(callback => {
        callback({
          docs,
          empty: docs.length === 0,
          size: docs.length
        });
      });
    }
  }
  
  return Promise.resolve();
}

/**
 * Mock implementation of subscribeToDocument function
 */
export function mockSubscribeToDocument(collectionName: string, documentId: string, onData, onError): Function {
  const key = `${collectionName}/${documentId}`;
  if (!documentSubscriptions[key]) {
    documentSubscriptions[key] = [];
  }
  
  documentSubscriptions[key].push(onData);
  
  // Trigger initial callback
  const collection = mockFirestoreData[collectionName] || {};
  const doc = collection[documentId];
  onData(doc ? { id: documentId, ...doc } : null);
  
  // Return unsubscribe function
  return () => {
    documentSubscriptions[key] = documentSubscriptions[key].filter(callback => callback !== onData);
  };
}

/**
 * Mock implementation of subscribeToCollection function
 */
export function mockSubscribeToCollection(collectionName: string, queries = [], onData, onError, options = {}): Function {
  if (!collectionSubscriptions[collectionName]) {
    collectionSubscriptions[collectionName] = [];
  }
  
  collectionSubscriptions[collectionName].push(onData);
  
  // Trigger initial callback
  const collection = mockFirestoreData[collectionName] || {};
  let docs = Object.entries(collection).map(([id, data]) => ({ id, ...data }));
  
  // Apply filtering if queries are provided
  if (queries.length > 0) {
    docs = docs.filter(doc => {
      return queries.every(query => {
        const { field, operator, value } = query;
        switch (operator) {
          case '==': return doc[field] === value;
          case '!=': return doc[field] !== value;
          case '>': return doc[field] > value;
          case '>=': return doc[field] >= value;
          case '<': return doc[field] < value;
          case '<=': return doc[field] <= value;
          case 'array-contains': return Array.isArray(doc[field]) && doc[field].includes(value);
          default: return true;
        }
      });
    });
  }
  
  // Apply sorting if orderBy is provided
  if (options.orderBy) {
    const { field, direction } = options.orderBy;
    docs.sort((a, b) => {
      if (direction === 'asc') {
        return a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
      } else {
        return a[field] > b[field] ? -1 : a[field] < b[field] ? 1 : 0;
      }
    });
  }
  
  // Apply pagination if limit is provided
  if (options.limit) {
    docs = docs.slice(0, options.limit);
  }
  
  onData(docs);
  
  // Return unsubscribe function
  return () => {
    collectionSubscriptions[collectionName] = collectionSubscriptions[collectionName].filter(callback => callback !== onData);
  };
}

/**
 * Mock implementation of initializeMessaging function
 */
export function mockInitializeMessaging(): Promise<boolean> {
  return Promise.resolve(true);
}

/**
 * Mock implementation of getMessagingToken function
 */
export function mockGetMessagingToken(): Promise<object | null> {
  return Promise.resolve({
    token: 'mock-messaging-token',
    createdAt: new Date()
  });
}

/**
 * Helper function to set the current authenticated user for testing
 */
export function setMockAuthUser(user: any): void {
  mockAuth.currentUser = user;
  
  // Trigger auth state change listeners
  if (mockAuth.onAuthStateChanged.mock.calls.length > 0) {
    mockAuth.onAuthStateChanged.mock.calls.forEach(call => {
      const callback = call[0];
      if (typeof callback === 'function') {
        callback(user);
      }
    });
  }
}

/**
 * Helper function to set mock Firestore data for testing
 */
export function setMockFirestoreData(collectionName: string, data: { [docId: string]: any }): void {
  mockFirestoreData[collectionName] = { ...data };
  
  // Trigger collection subscribers
  if (collectionSubscriptions[collectionName]) {
    const docs = Object.entries(data).map(([id, docData]) => ({
      id,
      data: () => docData,
      exists: true
    }));
    
    collectionSubscriptions[collectionName].forEach(callback => {
      callback({
        docs,
        empty: docs.length === 0,
        size: docs.length
      });
    });
  }
  
  // Trigger document subscribers
  Object.entries(data).forEach(([docId, docData]) => {
    const key = `${collectionName}/${docId}`;
    if (documentSubscriptions[key]) {
      documentSubscriptions[key].forEach(callback => {
        callback({ id: docId, ...docData });
      });
    }
  });
}

// Export mock Firebase services functions
export const signInWithEmailPassword = mockSignInWithEmailPassword;
export const signInWithGoogle = mockSignInWithGoogle;
export const signInWithMicrosoft = mockSignInWithMicrosoft;
export const createUser = mockCreateUser;
export const signOut = mockSignOut;
export const resetPassword = vi.fn().mockResolvedValue(undefined);
export const changePassword = vi.fn().mockResolvedValue(undefined);
export const getCurrentUser = vi.fn().mockImplementation(() => mockAuth.currentUser);
export const getIdTokenForUser = vi.fn().mockResolvedValue('mock-id-token');

// Export mock Firestore functions
export const getDocument = mockGetDocument;
export const getDocuments = mockGetDocuments;
export const createDocument = mockCreateDocument;
export const updateDocument = mockUpdateDocument;
export const deleteDocument = mockDeleteDocument;
export const subscribeToDocument = mockSubscribeToDocument;
export const subscribeToCollection = mockSubscribeToCollection;
export const batchWrite = vi.fn().mockResolvedValue(undefined);
export const runTransaction = vi.fn().mockImplementation(async (transactionFn) => {
  return await transactionFn({
    get: mockGetDocument,
    set: mockCreateDocument,
    update: mockUpdateDocument,
    delete: mockDeleteDocument
  });
});
export const createConverter = vi.fn().mockImplementation((toFirestore, fromFirestore) => ({
  toFirestore,
  fromFirestore
}));
export const timestampToDate = vi.fn().mockImplementation(timestamp => 
  timestamp instanceof Date ? timestamp : new Date(timestamp)
);
export const dateToTimestamp = vi.fn().mockImplementation(date => 
  date instanceof Date ? date : new Date(date)
);
export const getServerTimestamp = vi.fn().mockImplementation(() => new Date());

// Export mock meeting-specific functions
export const subscribeToMeeting = vi.fn().mockImplementation((meetingId, onData, onError) => 
  subscribeToDocument(FirestoreCollections.ACTIVE_MEETINGS, meetingId, onData, onError)
);
export const subscribeToMeetingStages = vi.fn().mockImplementation((meetingId, onData, onError) => 
  subscribeToCollection(
    FirestoreCollections.MEETING_STAGES,
    [{ field: 'meetingId', operator: '==', value: meetingId }],
    onData,
    onError
  )
);
export const subscribeToActionItems = vi.fn().mockImplementation((meetingId, onData, onError) => 
  subscribeToCollection(
    FirestoreCollections.ACTION_ITEMS,
    [{ field: 'meetingId', operator: '==', value: meetingId }],
    onData,
    onError
  )
);
export const updateMeetingPresence = vi.fn().mockImplementation((meetingId, userId, status) => {
  const presenceId = `${meetingId}_${userId}`;
  return createDocument(
    FirestoreCollections.USER_PRESENCE,
    {
      meetingId,
      userId,
      status,
      lastUpdated: new Date()
    },
    presenceId
  );
});

// Export mock messaging functions
export const initializeMessaging = mockInitializeMessaging;
export const requestNotificationPermission = vi.fn().mockResolvedValue('granted');
export const getMessagingToken = mockGetMessagingToken;
export const deleteMessagingToken = vi.fn().mockResolvedValue(true);
export const onMessageReceived = vi.fn().mockImplementation((callback) => {
  // Return unsubscribe function
  return () => {};
});