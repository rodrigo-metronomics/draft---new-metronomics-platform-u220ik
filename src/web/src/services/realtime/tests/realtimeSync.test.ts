import { 
  syncDocument, 
  syncCollection, 
  updateSyncedDocument, 
  createSyncedDocument, 
  deleteSyncedDocument, 
  retryPendingOperations, 
  resolveConflict, 
  setupConnectionMonitoring, 
  clearCache 
} from '../realtimeSync';
import { FirestoreCollections } from '../../types/firebase.types';
import {
  mockGetDocument,
  mockGetDocuments,
  mockCreateDocument,
  mockUpdateDocument,
  mockDeleteDocument,
  mockSubscribeToDocument,
  mockSubscribeToCollection,
  resetMockFirebase,
  setMockDocumentData,
  getMockDocumentData,
  triggerMockSnapshot
} from '../../../tests/mocks/firebaseMocks';

// Mock the firebase functions
jest.mock('../../services/firebase/firebaseFirestore', () => ({
  getDocument: jest.fn().mockImplementation(mockGetDocument),
  getDocuments: jest.fn().mockImplementation(mockGetDocuments),
  createDocument: jest.fn().mockImplementation(mockCreateDocument),
  updateDocument: jest.fn().mockImplementation(mockUpdateDocument),
  deleteDocument: jest.fn().mockImplementation(mockDeleteDocument),
  subscribeToDocument: jest.fn().mockImplementation(mockSubscribeToDocument),
  subscribeToCollection: jest.fn().mockImplementation(mockSubscribeToCollection)
}));

// Mock callback functions
const mockOnDataCallback = jest.fn();
const mockOnErrorCallback = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  resetMockFirebase();
  mockOnDataCallback.mockClear();
  mockOnErrorCallback.mockClear();
  
  // Mock window.navigator.onLine
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: true,
    writable: true
  });
});

describe('syncDocument', () => {
  test('should subscribe to document changes and call onData with the document data', () => {
    // Set up mock document data
    const documentData = { id: 'doc1', title: 'Test Document', content: 'Test content', updatedAt: new Date() };
    
    // Mock subscribeToDocument
    mockSubscribeToDocument.mockImplementation((collectionName, docId, onData) => {
      onData(documentData);
      return jest.fn(); // Return mock unsubscribe function
    });
    
    // Call syncDocument
    const unsubscribe = syncDocument('test_collection', 'doc1', mockOnDataCallback, mockOnErrorCallback);
    
    // Verify subscribeToDocument was called with correct parameters
    expect(mockSubscribeToDocument).toHaveBeenCalledWith(
      'test_collection',
      'doc1',
      expect.any(Function),
      expect.any(Function)
    );
    
    // Verify onData callback was called with document data
    expect(mockOnDataCallback).toHaveBeenCalledWith(documentData);
    
    // Verify unsubscribe function is returned
    expect(typeof unsubscribe).toBe('function');
  });
  
  test('should handle errors and call onError callback', () => {
    const error = new Error('Test error');
    
    // Mock subscribeToDocument to trigger error
    mockSubscribeToDocument.mockImplementation((collectionName, docId, onData, onError) => {
      onError(error);
      return jest.fn();
    });
    
    // Call syncDocument
    syncDocument('test_collection', 'doc1', mockOnDataCallback, mockOnErrorCallback);
    
    // Verify onError callback was called with the error
    expect(mockOnErrorCallback).toHaveBeenCalledWith(error);
  });
  
  test('should return an unsubscribe function', () => {
    const mockUnsubscribe = jest.fn();
    
    // Mock subscribeToDocument to return unsubscribe function
    mockSubscribeToDocument.mockImplementation(() => mockUnsubscribe);
    
    // Call syncDocument
    const unsubscribe = syncDocument('test_collection', 'doc1', mockOnDataCallback, mockOnErrorCallback);
    
    // Verify the returned function is the same as our mock
    expect(unsubscribe).toBe(mockUnsubscribe);
    
    // Call the unsubscribe function
    unsubscribe();
    
    // Verify our mock was called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
  
  test('should serve data from local cache when offline', () => {
    const documentData = { id: 'doc1', title: 'Test Document', content: 'Test content', updatedAt: new Date() };
    
    // First call to populate cache
    mockSubscribeToDocument.mockImplementationOnce((collectionName, docId, onData) => {
      onData(documentData);
      return jest.fn();
    });
    
    syncDocument('test_collection', 'doc1', mockOnDataCallback, mockOnErrorCallback);
    
    // Clear mocks
    mockOnDataCallback.mockClear();
    mockOnErrorCallback.mockClear();
    
    // Second call with network error
    const networkError = new Error('network error');
    
    mockSubscribeToDocument.mockImplementationOnce((collectionName, docId, onData, onError) => {
      onError(networkError);
      return jest.fn();
    });
    
    // Set navigator.onLine to false
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false
    });
    
    // Call syncDocument again
    syncDocument('test_collection', 'doc1', mockOnDataCallback, mockOnErrorCallback);
    
    // Verify onData was called with cached data
    expect(mockOnDataCallback).toHaveBeenCalledWith(documentData);
    
    // Verify onError was not called
    expect(mockOnErrorCallback).not.toHaveBeenCalled();
  });
});

describe('syncCollection', () => {
  test('should subscribe to collection changes and call onData with the collection data', () => {
    const collectionData = [
      { id: 'doc1', title: 'Document 1', content: 'Content 1', updatedAt: new Date() },
      { id: 'doc2', title: 'Document 2', content: 'Content 2', updatedAt: new Date() }
    ];
    
    // Mock subscribeToCollection
    mockSubscribeToCollection.mockImplementation((collectionName, queries, onData) => {
      onData(collectionData);
      return jest.fn();
    });
    
    // Call syncCollection
    const unsubscribe = syncCollection('test_collection', [], mockOnDataCallback, mockOnErrorCallback);
    
    // Verify subscribeToCollection was called with correct parameters
    expect(mockSubscribeToCollection).toHaveBeenCalledWith(
      'test_collection',
      [],
      expect.any(Function),
      expect.any(Function),
      undefined
    );
    
    // Verify onData callback was called with collection data
    expect(mockOnDataCallback).toHaveBeenCalledWith(collectionData);
    
    // Verify unsubscribe function is returned
    expect(typeof unsubscribe).toBe('function');
  });
  
  test('should handle errors and call onError callback', () => {
    const error = new Error('Test error');
    
    // Mock subscribeToCollection to trigger error
    mockSubscribeToCollection.mockImplementation((collectionName, queries, onData, onError) => {
      onError(error);
      return jest.fn();
    });
    
    // Call syncCollection
    syncCollection('test_collection', [], mockOnDataCallback, mockOnErrorCallback);
    
    // Verify onError callback was called with the error
    expect(mockOnErrorCallback).toHaveBeenCalledWith(error);
  });
  
  test('should apply query filters correctly', () => {
    const collectionData = [
      { id: 'doc1', category: 'A', content: 'Content 1', updatedAt: new Date() },
      { id: 'doc2', category: 'B', content: 'Content 2', updatedAt: new Date() }
    ];
    
    const filteredData = [collectionData[0]]; // Just the first document with category A
    const queries = [{ field: 'category', operator: '==', value: 'A' }];
    
    // Mock subscribeToCollection to return filtered data
    mockSubscribeToCollection.mockImplementation((collectionName, queryParams, onData) => {
      onData(filteredData);
      return jest.fn();
    });
    
    // Call syncCollection with queries
    syncCollection('test_collection', queries, mockOnDataCallback, mockOnErrorCallback);
    
    // Verify subscribeToCollection was called with queries
    expect(mockSubscribeToCollection).toHaveBeenCalledWith(
      'test_collection',
      queries,
      expect.any(Function),
      expect.any(Function),
      undefined
    );
    
    // Verify onData was called with filtered data
    expect(mockOnDataCallback).toHaveBeenCalledWith(filteredData);
  });
  
  test('should return an unsubscribe function', () => {
    const mockUnsubscribe = jest.fn();
    
    // Mock subscribeToCollection to return unsubscribe function
    mockSubscribeToCollection.mockImplementation(() => mockUnsubscribe);
    
    // Call syncCollection
    const unsubscribe = syncCollection('test_collection', [], mockOnDataCallback, mockOnErrorCallback);
    
    // Verify the returned function is the same as our mock
    expect(unsubscribe).toBe(mockUnsubscribe);
    
    // Call the unsubscribe function
    unsubscribe();
    
    // Verify our mock was called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('updateSyncedDocument', () => {
  test('should update document in Firestore and local cache', async () => {
    // Mock updateDocument to resolve successfully
    mockUpdateDocument.mockResolvedValue(undefined);
    
    // Document data for update
    const updateData = { title: 'Updated Title' };
    
    // Call updateSyncedDocument
    await updateSyncedDocument('test_collection', 'doc1', updateData);
    
    // Verify updateDocument was called with correct parameters
    expect(mockUpdateDocument).toHaveBeenCalledWith('test_collection', 'doc1', updateData);
  });
  
  test('should retry on failure up to MAX_RETRY_ATTEMPTS', async () => {
    // Mock updateDocument to reject
    mockUpdateDocument.mockRejectedValue(new Error('Update failed'));
    
    // Document data for update
    const updateData = { title: 'Updated Title' };
    
    // Call updateSyncedDocument
    await updateSyncedDocument('test_collection', 'doc1', updateData);
    
    // The MAX_RETRY_ATTEMPTS is 3 in the module, so it should be called 1 + 3 = 4 times
    expect(mockUpdateDocument).toHaveBeenCalledTimes(4);
  });
  
  test('should store operation in pendingOperations on failure', async () => {
    // Mock updateDocument to reject initially then resolve on retry
    mockUpdateDocument
      .mockRejectedValueOnce(new Error('Update failed'))
      .mockResolvedValue(undefined);
    
    // Document data for update
    const updateData = { title: 'Updated Title' };
    
    // Call updateSyncedDocument which should fail
    await updateSyncedDocument('test_collection', 'doc1', updateData);
    
    // Clear the mock to track new calls
    mockUpdateDocument.mockClear();
    
    // Now call retryPendingOperations to retry the failed operation
    await retryPendingOperations();
    
    // Verify updateDocument was called again during retry
    expect(mockUpdateDocument).toHaveBeenCalled();
  });
});

describe('createSyncedDocument', () => {
  test('should create document in Firestore and local cache', async () => {
    // Mock createDocument to resolve with document ID
    mockCreateDocument.mockResolvedValue('new-doc-id');
    
    // Document data to create
    const documentData = { title: 'New Document', content: 'New content' };
    
    // Call createSyncedDocument
    const docId = await createSyncedDocument('test_collection', documentData);
    
    // Verify createDocument was called with correct parameters
    expect(mockCreateDocument).toHaveBeenCalledWith('test_collection', documentData, undefined);
    
    // Verify function returns the document ID
    expect(docId).toBe('new-doc-id');
  });
  
  test('should use provided document ID if available', async () => {
    // Mock createDocument to resolve with the provided ID
    mockCreateDocument.mockResolvedValue('custom-id');
    
    // Document data to create
    const documentData = { title: 'New Document', content: 'New content' };
    
    // Call createSyncedDocument with custom ID
    const docId = await createSyncedDocument('test_collection', documentData, 'custom-id');
    
    // Verify createDocument was called with the custom ID
    expect(mockCreateDocument).toHaveBeenCalledWith('test_collection', documentData, 'custom-id');
    
    // Verify function returns the custom ID
    expect(docId).toBe('custom-id');
  });
  
  test('should retry on failure up to MAX_RETRY_ATTEMPTS', async () => {
    // Mock createDocument to reject
    mockCreateDocument.mockRejectedValue(new Error('Create failed'));
    
    // Document data to create
    const documentData = { title: 'New Document', content: 'New content' };
    
    // Call createSyncedDocument
    await createSyncedDocument('test_collection', documentData);
    
    // The MAX_RETRY_ATTEMPTS is 3 in the module, so it should be called 1 + 3 = 4 times
    expect(mockCreateDocument).toHaveBeenCalledTimes(4);
  });
  
  test('should store operation in pendingOperations on failure', async () => {
    // Mock createDocument to reject initially then resolve on retry
    mockCreateDocument
      .mockRejectedValueOnce(new Error('Create failed'))
      .mockResolvedValue('new-doc-id');
    
    // Document data to create
    const documentData = { title: 'New Document', content: 'New content' };
    
    // Call createSyncedDocument which should fail
    await createSyncedDocument('test_collection', documentData);
    
    // Clear the mock to track new calls
    mockCreateDocument.mockClear();
    
    // Now call retryPendingOperations to retry the failed operation
    await retryPendingOperations();
    
    // Verify createDocument was called again during retry
    expect(mockCreateDocument).toHaveBeenCalled();
  });
});

describe('deleteSyncedDocument', () => {
  test('should delete document from Firestore and local cache', async () => {
    // Mock deleteDocument to resolve successfully
    mockDeleteDocument.mockResolvedValue(undefined);
    
    // Call deleteSyncedDocument
    await deleteSyncedDocument('test_collection', 'doc1');
    
    // Verify deleteDocument was called with correct parameters
    expect(mockDeleteDocument).toHaveBeenCalledWith('test_collection', 'doc1');
  });
  
  test('should retry on failure up to MAX_RETRY_ATTEMPTS', async () => {
    // Mock deleteDocument to reject
    mockDeleteDocument.mockRejectedValue(new Error('Delete failed'));
    
    // Call deleteSyncedDocument
    await deleteSyncedDocument('test_collection', 'doc1');
    
    // The MAX_RETRY_ATTEMPTS is 3 in the module, so it should be called 1 + 3 = 4 times
    expect(mockDeleteDocument).toHaveBeenCalledTimes(4);
  });
  
  test('should store operation in pendingOperations on failure', async () => {
    // Mock deleteDocument to reject initially then resolve on retry
    mockDeleteDocument
      .mockRejectedValueOnce(new Error('Delete failed'))
      .mockResolvedValue(undefined);
    
    // Call deleteSyncedDocument which should fail
    await deleteSyncedDocument('test_collection', 'doc1');
    
    // Clear the mock to track new calls
    mockDeleteDocument.mockClear();
    
    // Now call retryPendingOperations to retry the failed operation
    await retryPendingOperations();
    
    // Verify deleteDocument was called again during retry
    expect(mockDeleteDocument).toHaveBeenCalled();
  });
});

describe('retryPendingOperations', () => {
  test('should retry all pending operations', async () => {
    // Mock operations to first fail and then succeed on retry
    mockCreateDocument
      .mockRejectedValueOnce(new Error('Create failed'))
      .mockResolvedValue('doc1');
      
    mockUpdateDocument
      .mockRejectedValueOnce(new Error('Update failed'))
      .mockResolvedValue(undefined);
      
    mockDeleteDocument
      .mockRejectedValueOnce(new Error('Delete failed'))
      .mockResolvedValue(undefined);
    
    // Perform operations that will fail and be added to pendingOperations
    await createSyncedDocument('test_collection', { title: 'New Document' });
    await updateSyncedDocument('test_collection', 'doc2', { title: 'Updated Title' });
    await deleteSyncedDocument('test_collection', 'doc3');
    
    // Clear mocks to track retry calls
    mockCreateDocument.mockClear();
    mockUpdateDocument.mockClear();
    mockDeleteDocument.mockClear();
    
    // Call retryPendingOperations
    await retryPendingOperations();
    
    // Verify operations were retried
    expect(mockCreateDocument).toHaveBeenCalled();
    expect(mockUpdateDocument).toHaveBeenCalled();
    expect(mockDeleteDocument).toHaveBeenCalled();
  });
  
  test('should handle errors during retry', async () => {
    // Mock operations to fail initially, then one continues to fail while others succeed
    mockCreateDocument
      .mockRejectedValueOnce(new Error('Create failed'))
      .mockResolvedValue('doc1');
      
    mockUpdateDocument
      .mockRejectedValue(new Error('Update always fails'));
      
    mockDeleteDocument
      .mockRejectedValueOnce(new Error('Delete failed'))
      .mockResolvedValue(undefined);
    
    // Perform operations that will fail and be added to pendingOperations
    await createSyncedDocument('test_collection', { title: 'New Document' });
    await updateSyncedDocument('test_collection', 'doc2', { title: 'Updated Title' });
    await deleteSyncedDocument('test_collection', 'doc3');
    
    // Clear mocks to track retry calls
    mockCreateDocument.mockClear();
    mockUpdateDocument.mockClear();
    mockDeleteDocument.mockClear();
    
    // Call retryPendingOperations
    await retryPendingOperations();
    
    // Verify all operations were attempted
    expect(mockCreateDocument).toHaveBeenCalled();
    expect(mockUpdateDocument).toHaveBeenCalled();
    expect(mockDeleteDocument).toHaveBeenCalled();
    
    // Clear mocks again
    mockUpdateDocument.mockClear();
    
    // Call retryPendingOperations again
    await retryPendingOperations();
    
    // Verify the failing operation was retried again
    expect(mockUpdateDocument).toHaveBeenCalled();
  });
});

describe('resolveConflict', () => {
  test('should use remote data when remote is newer', () => {
    // Create test data with timestamps
    const localData = {
      id: 'doc1',
      title: 'Local Title',
      content: 'Local Content',
      updatedAt: new Date(2023, 0, 1) // January 1, 2023
    };
    
    const remoteData = {
      id: 'doc1',
      title: 'Remote Title',
      content: 'Remote Content',
      updatedAt: new Date(2023, 0, 2) // January 2, 2023 (newer)
    };
    
    // Call resolveConflict
    const result = resolveConflict(localData, remoteData);
    
    // Verify remote data was used for conflicting fields
    expect(result.title).toBe('Remote Title');
    expect(result.content).toBe('Remote Content');
    expect(result.updatedAt).toEqual(remoteData.updatedAt);
  });
  
  test('should use local data when local is newer', () => {
    // Create test data with timestamps
    const localData = {
      id: 'doc1',
      title: 'Local Title',
      content: 'Local Content',
      updatedAt: new Date(2023, 0, 2) // January 2, 2023 (newer)
    };
    
    const remoteData = {
      id: 'doc1',
      title: 'Remote Title',
      content: 'Remote Content',
      updatedAt: new Date(2023, 0, 1) // January 1, 2023
    };
    
    // Call resolveConflict
    const result = resolveConflict(localData, remoteData);
    
    // Verify local data was used for conflicting fields
    expect(result.title).toBe('Local Title');
    expect(result.content).toBe('Local Content');
    expect(result.updatedAt).toEqual(localData.updatedAt);
  });
  
  test('should merge non-conflicting fields from both versions', () => {
    // Create test data with unique fields
    const localData = {
      id: 'doc1',
      title: 'Local Title',
      localOnlyField: 'Local Only',
      updatedAt: new Date(2023, 0, 1)
    };
    
    const remoteData = {
      id: 'doc1',
      title: 'Remote Title',
      remoteOnlyField: 'Remote Only',
      updatedAt: new Date(2023, 0, 2) // Remote is newer
    };
    
    // Call resolveConflict
    const result = resolveConflict(localData, remoteData);
    
    // Verify remote data was used for conflicting fields (title)
    expect(result.title).toBe('Remote Title');
    
    // Verify unique fields from both were preserved
    expect(result.localOnlyField).toBe('Local Only');
    expect(result.remoteOnlyField).toBe('Remote Only');
  });
});

describe('setupConnectionMonitoring', () => {
  test('should set up online and offline event listeners', () => {
    // Spy on addEventListener
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    
    // Call setupConnectionMonitoring
    setupConnectionMonitoring();
    
    // Verify addEventListener was called for online and offline events
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
  
  test('should call retryPendingOperations when online event fires', async () => {
    // Create spy for retryPendingOperations
    const retryPendingOperationsSpy = jest.spyOn({ retryPendingOperations }, 'retryPendingOperations');
    
    // Mock implementation of addEventListener to capture the online handler
    let onlineHandler: EventListener;
    jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'online') {
        onlineHandler = handler as EventListener;
      }
      return undefined;
    });
    
    // Call setupConnectionMonitoring
    setupConnectionMonitoring();
    
    // Trigger the online event
    if (onlineHandler) {
      onlineHandler(new Event('online'));
    }
    
    // Verify retryPendingOperations was called
    expect(retryPendingOperationsSpy).toHaveBeenCalled();
  });
  
  test('should return cleanup function that removes event listeners', () => {
    // Spy on removeEventListener
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    // Call setupConnectionMonitoring
    const cleanup = setupConnectionMonitoring();
    
    // Call the returned cleanup function
    cleanup();
    
    // Verify removeEventListener was called for online and offline events
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});

describe('clearCache', () => {
  test('should clear specific cache entry when cacheKey is provided', async () => {
    // First populate the cache with document data
    const document1 = { id: 'doc1', title: 'Document 1', content: 'Content 1', updatedAt: new Date() };
    
    // Mock subscribeToDocument to populate cache
    mockSubscribeToDocument.mockImplementation((collectionName, docId, onData) => {
      onData(document1);
      return jest.fn();
    });
    
    // Call syncDocument to populate cache
    syncDocument('test_collection', 'doc1', jest.fn(), jest.fn());
    
    // Now clear specific cache entry
    clearCache('test_collection_doc1');
    
    // Reset mocks to track new calls
    mockGetDocument.mockClear();
    mockSubscribeToDocument.mockClear();
    
    // Mock subscribeToDocument for next sync
    mockSubscribeToDocument.mockImplementation(() => jest.fn());
    
    // Call syncDocument again
    syncDocument('test_collection', 'doc1', jest.fn(), jest.fn());
    
    // If cache was cleared, getDocument should be called to try to populate cache
    expect(mockGetDocument).toHaveBeenCalledWith('test_collection', 'doc1');
  });
  
  test('should clear entire cache when cacheKey is not provided', async () => {
    // Populate cache with multiple documents
    const document1 = { id: 'doc1', title: 'Document 1', content: 'Content 1', updatedAt: new Date() };
    const document2 = { id: 'doc2', title: 'Document 2', content: 'Content 2', updatedAt: new Date() };
    
    // Mock subscribeToDocument to populate cache
    mockSubscribeToDocument
      .mockImplementationOnce((collectionName, docId, onData) => {
        onData(document1);
        return jest.fn();
      })
      .mockImplementationOnce((collectionName, docId, onData) => {
        onData(document2);
        return jest.fn();
      });
    
    // Call syncDocument to populate cache
    syncDocument('test_collection', 'doc1', jest.fn(), jest.fn());
    syncDocument('test_collection', 'doc2', jest.fn(), jest.fn());
    
    // Clear the entire cache
    clearCache();
    
    // Reset mocks to track new calls
    mockGetDocument.mockClear();
    mockSubscribeToDocument.mockClear();
    
    // Mock subscribeToDocument for next syncs
    mockSubscribeToDocument.mockImplementation(() => jest.fn());
    
    // Call syncDocument again for both documents
    syncDocument('test_collection', 'doc1', jest.fn(), jest.fn());
    syncDocument('test_collection', 'doc2', jest.fn(), jest.fn());
    
    // If cache was cleared, getDocument should be called for both documents
    expect(mockGetDocument).toHaveBeenCalledWith('test_collection', 'doc1');
    expect(mockGetDocument).toHaveBeenCalledWith('test_collection', 'doc2');
  });
});