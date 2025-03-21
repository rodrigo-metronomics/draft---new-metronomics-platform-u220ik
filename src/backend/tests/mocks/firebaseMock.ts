import { jest } from 'jest'; // jest version ^29.5.0
import * as admin from 'firebase-admin'; // firebase-admin version ^11.8.0

// In-memory data stores for mocks
interface MockFirestoreData {
  [collectionName: string]: {
    [documentId: string]: any;
  };
}

interface MockAuthData {
  users: {
    [uid: string]: admin.auth.UserRecord;
  };
  emailToUid: {
    [email: string]: string;
  };
}

export const mockFirestoreData: MockFirestoreData = {};
export const mockAuthData: MockAuthData = {
  users: {},
  emailToUid: {}
};

// Helper function to reset the mock Firestore data between tests
export const resetMockFirestoreData = (): void => {
  Object.keys(mockFirestoreData).forEach(key => {
    delete mockFirestoreData[key];
  });
};

// Helper function to reset the mock Auth data between tests
export const resetMockAuthData = (): void => {
  mockAuthData.users = {};
  mockAuthData.emailToUid = {};
};

/**
 * Creates a mock Firestore collection with basic CRUD functionality
 * @returns Mock Firestore collection object
 */
export function createMockFirestoreCollection() {
  const collectionStore: { [docId: string]: any } = {};
  
  const collection = {
    add: jest.fn((data: any) => {
      const id = Math.random().toString(36).substring(2, 15);
      collectionStore[id] = { ...data };
      return createMockFirestoreDocument(id, data, collectionStore);
    }),
    
    doc: jest.fn((id: string) => {
      return createMockFirestoreDocument(id, collectionStore[id] || {}, collectionStore);
    }),
    
    where: jest.fn(() => collection),
    orderBy: jest.fn(() => collection),
    limit: jest.fn(() => collection),
    
    get: jest.fn(async () => {
      const docs = Object.entries(collectionStore).map(([id, data]) => {
        return createMockFirestoreSnapshot({ id, ...data }, true);
      });
      
      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach: (callback: (doc: any) => void) => docs.forEach(callback)
      };
    })
  };
  
  return collection;
}

/**
 * Creates a mock Firestore document reference with CRUD operations
 * @param id - Document ID
 * @param data - Document data
 * @param collectionStore - Reference to the collection's data store
 * @returns Mock Firestore document reference
 */
export function createMockFirestoreDocument(id: string, data: any, collectionStore: { [docId: string]: any }) {
  const docRef = {
    id,
    
    get: jest.fn(async () => {
      const exists = id in collectionStore;
      return createMockFirestoreSnapshot({ id, ...collectionStore[id] }, exists);
    }),
    
    set: jest.fn(async (newData: any, options: any = {}) => {
      if (options.merge) {
        collectionStore[id] = { ...(collectionStore[id] || {}), ...newData };
      } else {
        collectionStore[id] = { ...newData };
      }
      return Promise.resolve();
    }),
    
    update: jest.fn(async (newData: any) => {
      if (!(id in collectionStore)) {
        throw new Error(`Document ${id} not found`);
      }
      collectionStore[id] = { ...collectionStore[id], ...newData };
      return Promise.resolve();
    }),
    
    delete: jest.fn(async () => {
      delete collectionStore[id];
      return Promise.resolve();
    }),
    
    collection: jest.fn((collectionPath: string) => {
      return createMockFirestoreCollection();
    })
  };
  
  return docRef;
}

/**
 * Creates a mock Firestore document or query snapshot
 * @param data - Document data
 * @param exists - Whether the document exists
 * @returns Mock Firestore snapshot
 */
export function createMockFirestoreSnapshot(data: any, exists: boolean) {
  return {
    exists,
    id: data.id,
    data: () => {
      const { id, ...rest } = data;
      return rest;
    },
    get: (field: string) => data[field],
    forEach: (callback: (doc: any) => void) => {
      if (Array.isArray(data)) {
        data.forEach(callback);
      }
    }
  };
}

// Mock Firebase Auth implementation
export const auth = {
  verifyIdToken: jest.fn(async (token: string) => {
    // Return a mock decoded token
    return Promise.resolve({
      uid: 'mock-uid',
      email: 'mock-user@example.com',
      email_verified: true,
      auth_time: Date.now() / 1000,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
      sub: 'mock-uid',
      firebase: {
        identities: {
          email: ['mock-user@example.com']
        },
        sign_in_provider: 'password'
      },
      claims: {}
    } as admin.auth.DecodedIdToken);
  }),
  
  createCustomToken: jest.fn(async (uid: string, claims?: object) => {
    return Promise.resolve(`mock-custom-token-for-${uid}`);
  }),
  
  getUserByEmail: jest.fn(async (email: string) => {
    const uid = mockAuthData.emailToUid[email];
    if (!uid || !mockAuthData.users[uid]) {
      throw new Error(`User with email ${email} not found`);
    }
    return Promise.resolve(mockAuthData.users[uid]);
  }),
  
  getUserByUid: jest.fn(async (uid: string) => {
    if (!mockAuthData.users[uid]) {
      throw new Error(`User with uid ${uid} not found`);
    }
    return Promise.resolve(mockAuthData.users[uid]);
  }),
  
  createUser: jest.fn(async (properties: admin.auth.CreateRequest) => {
    const uid = properties.uid || Math.random().toString(36).substring(2, 15);
    const userRecord = {
      uid,
      email: properties.email,
      emailVerified: properties.emailVerified || false,
      displayName: properties.displayName,
      photoURL: properties.photoURL,
      phoneNumber: properties.phoneNumber,
      disabled: properties.disabled || false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
        toJSON: () => ({
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        })
      },
      providerData: [],
      customClaims: {},
      toJSON: () => ({
        uid,
        email: properties.email,
        emailVerified: properties.emailVerified || false,
        displayName: properties.displayName,
        photoURL: properties.photoURL,
        phoneNumber: properties.phoneNumber,
        disabled: properties.disabled || false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        },
        providerData: [],
        customClaims: {}
      })
    } as unknown as admin.auth.UserRecord;
    
    mockAuthData.users[uid] = userRecord;
    if (properties.email) {
      mockAuthData.emailToUid[properties.email] = uid;
    }
    
    return Promise.resolve(userRecord);
  }),
  
  updateUser: jest.fn(async (uid: string, properties: admin.auth.UpdateRequest) => {
    if (!mockAuthData.users[uid]) {
      throw new Error(`User with uid ${uid} not found`);
    }
    
    const currentEmail = mockAuthData.users[uid].email;
    if (currentEmail && properties.email && currentEmail !== properties.email) {
      delete mockAuthData.emailToUid[currentEmail];
      mockAuthData.emailToUid[properties.email] = uid;
    }
    
    mockAuthData.users[uid] = {
      ...mockAuthData.users[uid],
      ...properties,
      toJSON: () => ({
        ...mockAuthData.users[uid].toJSON(),
        ...properties
      })
    } as unknown as admin.auth.UserRecord;
    
    return Promise.resolve(mockAuthData.users[uid]);
  }),
  
  deleteUser: jest.fn(async (uid: string) => {
    if (!mockAuthData.users[uid]) {
      throw new Error(`User with uid ${uid} not found`);
    }
    
    const userEmail = mockAuthData.users[uid].email;
    if (userEmail) {
      delete mockAuthData.emailToUid[userEmail];
    }
    
    delete mockAuthData.users[uid];
    return Promise.resolve();
  }),
  
  generatePasswordResetLink: jest.fn(async (email: string, actionCodeSettings?: admin.auth.ActionCodeSettings) => {
    return Promise.resolve(`https://example.com/reset-password?email=${email}`);
  }),
  
  revokeRefreshTokens: jest.fn(async (uid: string) => {
    if (!mockAuthData.users[uid]) {
      throw new Error(`User with uid ${uid} not found`);
    }
    return Promise.resolve();
  }),
  
  setCustomUserClaims: jest.fn(async (uid: string, claims: object | null) => {
    if (!mockAuthData.users[uid]) {
      throw new Error(`User with uid ${uid} not found`);
    }
    
    mockAuthData.users[uid].customClaims = claims || {};
    return Promise.resolve();
  })
};

// Mock Firebase Firestore implementation
export const firestore = {
  collection: jest.fn((path: string) => {
    if (!mockFirestoreData[path]) {
      mockFirestoreData[path] = {};
    }
    
    return {
      add: jest.fn(async (data: any) => {
        const id = Math.random().toString(36).substring(2, 15);
        mockFirestoreData[path][id] = { ...data };
        return Promise.resolve({
          id,
          path: `${path}/${id}`,
          get: async () => createMockFirestoreSnapshot({ id, ...data }, true)
        });
      }),
      
      doc: jest.fn((id: string) => {
        return firestore.doc(`${path}/${id}`);
      }),
      
      where: jest.fn(() => {
        // Return a filtered query mock that maintains the same interface
        return {
          get: jest.fn(async () => {
            // Implement basic filtering logic if needed for specific tests
            const docs = Object.entries(mockFirestoreData[path] || {})
              .map(([id, data]) => createMockFirestoreSnapshot({ id, ...data }, true));
            
            return {
              docs,
              empty: docs.length === 0,
              size: docs.length,
              forEach: (callback: (doc: any) => void) => docs.forEach(callback)
            };
          }),
          where: jest.fn(function() { return this; }),
          orderBy: jest.fn(function() { return this; }),
          limit: jest.fn(function() { return this; })
        };
      }),
      
      orderBy: jest.fn(() => {
        // Similar to where, return a query mock
        return {
          get: jest.fn(async () => {
            const docs = Object.entries(mockFirestoreData[path] || {})
              .map(([id, data]) => createMockFirestoreSnapshot({ id, ...data }, true));
            
            return {
              docs,
              empty: docs.length === 0,
              size: docs.length,
              forEach: (callback: (doc: any) => void) => docs.forEach(callback)
            };
          }),
          where: jest.fn(function() { return this; }),
          orderBy: jest.fn(function() { return this; }),
          limit: jest.fn(function() { return this; })
        };
      }),
      
      limit: jest.fn(() => {
        // Similar to where and orderBy, return a query mock
        return {
          get: jest.fn(async () => {
            const docs = Object.entries(mockFirestoreData[path] || {})
              .map(([id, data]) => createMockFirestoreSnapshot({ id, ...data }, true));
            
            return {
              docs,
              empty: docs.length === 0,
              size: docs.length,
              forEach: (callback: (doc: any) => void) => docs.forEach(callback)
            };
          }),
          where: jest.fn(function() { return this; }),
          orderBy: jest.fn(function() { return this; }),
          limit: jest.fn(function() { return this; })
        };
      }),
      
      get: jest.fn(async () => {
        const docs = Object.entries(mockFirestoreData[path] || {})
          .map(([id, data]) => createMockFirestoreSnapshot({ id, ...data }, true));
        
        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
          forEach: (callback: (doc: any) => void) => docs.forEach(callback)
        };
      })
    };
  }),
  
  doc: jest.fn((path: string) => {
    const pathParts = path.split('/');
    const docId = pathParts.pop() || '';
    const collectionPath = pathParts.join('/');
    
    if (!mockFirestoreData[collectionPath]) {
      mockFirestoreData[collectionPath] = {};
    }
    
    return {
      id: docId,
      path,
      
      get: jest.fn(async () => {
        const exists = mockFirestoreData[collectionPath] && docId in mockFirestoreData[collectionPath];
        const data = exists ? mockFirestoreData[collectionPath][docId] : null;
        return createMockFirestoreSnapshot({ id: docId, ...data }, exists);
      }),
      
      set: jest.fn(async (data: any, options: any = {}) => {
        if (options.merge) {
          mockFirestoreData[collectionPath][docId] = { 
            ...(mockFirestoreData[collectionPath][docId] || {}), 
            ...data 
          };
        } else {
          mockFirestoreData[collectionPath][docId] = { ...data };
        }
        return Promise.resolve();
      }),
      
      update: jest.fn(async (data: any) => {
        if (!(docId in mockFirestoreData[collectionPath])) {
          throw new Error(`Document ${docId} not found in ${collectionPath}`);
        }
        mockFirestoreData[collectionPath][docId] = { 
          ...mockFirestoreData[collectionPath][docId], 
          ...data 
        };
        return Promise.resolve();
      }),
      
      delete: jest.fn(async () => {
        if (mockFirestoreData[collectionPath] && mockFirestoreData[collectionPath][docId]) {
          delete mockFirestoreData[collectionPath][docId];
        }
        return Promise.resolve();
      }),
      
      collection: jest.fn((subCollectionPath: string) => {
        return firestore.collection(`${path}/${subCollectionPath}`);
      })
    };
  }),
  
  batch: jest.fn(() => {
    const operations: { type: string; ref: any; data?: any; options?: any }[] = [];
    
    const batchObj = {
      set: jest.fn((docRef: any, data: any, options: any = {}) => {
        operations.push({ type: 'set', ref: docRef, data, options });
        return batchObj;
      }),
      
      update: jest.fn((docRef: any, data: any) => {
        operations.push({ type: 'update', ref: docRef, data });
        return batchObj;
      }),
      
      delete: jest.fn((docRef: any) => {
        operations.push({ type: 'delete', ref: docRef });
        return batchObj;
      }),
      
      commit: jest.fn(async () => {
        // Execute all the batched operations
        for (const op of operations) {
          if (op.type === 'set') {
            await op.ref.set(op.data, op.options);
          } else if (op.type === 'update') {
            await op.ref.update(op.data);
          } else if (op.type === 'delete') {
            await op.ref.delete();
          }
        }
        
        operations.length = 0; // Clear the operations array
        return Promise.resolve();
      })
    };
    
    return batchObj;
  }),
  
  runTransaction: jest.fn(async (updateFunction: (transaction: any) => Promise<any>) => {
    const transaction = {
      get: jest.fn(async (docRef: any) => {
        return docRef.get();
      }),
      
      set: jest.fn((docRef: any, data: any, options: any = {}) => {
        docRef.set(data, options);
        return transaction;
      }),
      
      update: jest.fn((docRef: any, data: any) => {
        docRef.update(data);
        return transaction;
      }),
      
      delete: jest.fn((docRef: any) => {
        docRef.delete();
        return transaction;
      })
    };
    
    try {
      return await updateFunction(transaction);
    } catch (error) {
      throw error;
    }
  })
};

// Mock Firebase Cloud Messaging implementation
export const messaging = {
  send: jest.fn(async (message: admin.messaging.Message) => {
    return Promise.resolve(`mock-message-id-${Date.now()}`);
  }),
  
  sendMulticast: jest.fn(async (message: admin.messaging.MulticastMessage) => {
    const successCount = message.tokens?.length || 0;
    return Promise.resolve({
      successCount,
      failureCount: 0,
      responses: Array(successCount).fill({
        success: true,
        messageId: `mock-message-id-${Date.now()}`
      })
    } as admin.messaging.BatchResponse);
  }),
  
  sendToTopic: jest.fn(async (topic: string, message: admin.messaging.Message) => {
    return Promise.resolve(`mock-topic-message-id-${Date.now()}`);
  })
};