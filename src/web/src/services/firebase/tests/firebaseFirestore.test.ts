import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'; // v0.34.0
import * as firestoreService from '../firebaseFirestore';
import { 
  FirestoreCollections, 
  FirestoreQuery,
  FirestoreQueryOptions 
} from '../../../types/firebase.types';
import {
  resetMockFirebase,
  setMockDocumentData,
  getMockDocumentData,
  triggerMockSnapshot,
  mockFirestore
} from '../../../../tests/mocks/firebaseMocks';

describe('Firebase Firestore Service', () => {
  beforeEach(() => {
    resetMockFirebase();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Document Operations', () => {
    it('getDocument should retrieve a document by ID', async () => {
      // Setup test data
      const testCollection = 'test_collection';
      const testDocId = 'test-doc-id';
      const testDocData = { name: 'Test Document', value: 123 };
      
      setMockDocumentData(testCollection, { [testDocId]: testDocData });
      
      // Execute the function
      const result = await firestoreService.getDocument(testCollection, testDocId);
      
      // Assertions
      expect(result).toEqual({ id: testDocId, ...testDocData });
    });
    
    it('getDocument should return null for non-existent documents', async () => {
      const testCollection = 'test_collection';
      const nonExistentDocId = 'non-existent-doc';
      
      // Execute the function
      const result = await firestoreService.getDocument(testCollection, nonExistentDocId);
      
      // Assertions
      expect(result).toBeNull();
    });
    
    it('getDocuments should retrieve multiple documents with query constraints', async () => {
      // Setup test data
      const testCollection = 'test_collection';
      const docs = {
        'doc1': { type: 'A', value: 10 },
        'doc2': { type: 'B', value: 20 },
        'doc3': { type: 'A', value: 30 }
      };
      
      setMockDocumentData(testCollection, docs);
      
      // Create query constraints
      const queries: FirestoreQuery[] = [
        { field: 'type', operator: '==', value: 'A' }
      ];
      
      // Execute the function
      const result = await firestoreService.getDocuments(testCollection, queries);
      
      // Assertions
      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'doc1', type: 'A', value: 10 }),
          expect.objectContaining({ id: 'doc3', type: 'A', value: 30 })
        ])
      );
    });
    
    it('createDocument should create a new document with provided data', async () => {
      const testCollection = 'test_collection';
      const testData = { name: 'New Document', value: 42 };
      
      // Execute the function
      const docId = await firestoreService.createDocument(testCollection, testData);
      
      // Get the created document to verify
      const createdDoc = await firestoreService.getDocument(testCollection, docId);
      
      // Assertions
      expect(docId).toBeDefined();
      expect(createdDoc).toMatchObject({
        id: docId,
        name: 'New Document',
        value: 42
      });
      expect(createdDoc?.createdAt).toBeDefined();
      expect(createdDoc?.updatedAt).toBeDefined();
    });
    
    it('createDocument should use provided document ID if specified', async () => {
      const testCollection = 'test_collection';
      const testDocId = 'custom-id';
      const testData = { name: 'Custom ID Document', value: 99 };
      
      // Execute the function
      const docId = await firestoreService.createDocument(testCollection, testData, testDocId);
      
      // Get the created document to verify
      const createdDoc = await firestoreService.getDocument(testCollection, docId);
      
      // Assertions
      expect(docId).toBe(testDocId);
      expect(createdDoc).toMatchObject({
        id: testDocId,
        name: 'Custom ID Document',
        value: 99
      });
    });
    
    it('updateDocument should update an existing document', async () => {
      // Setup test data
      const testCollection = 'test_collection';
      const testDocId = 'test-doc-id';
      const initialData = { name: 'Initial Document', value: 50 };
      
      setMockDocumentData(testCollection, { [testDocId]: initialData });
      
      // Update data
      const updateData = { value: 100, description: 'Updated' };
      
      // Execute the function
      await firestoreService.updateDocument(testCollection, testDocId, updateData);
      
      // Get the updated document to verify
      const updatedDoc = await firestoreService.getDocument(testCollection, testDocId);
      
      // Assertions
      expect(updatedDoc).toMatchObject({
        id: testDocId,
        name: 'Initial Document', // Unchanged field
        value: 100, // Updated field
        description: 'Updated' // New field
      });
      expect(updatedDoc?.updatedAt).toBeDefined();
    });
    
    it('deleteDocument should delete a document', async () => {
      // Setup test data
      const testCollection = 'test_collection';
      const testDocId = 'test-doc-id';
      const testData = { name: 'Document to Delete', value: 75 };
      
      setMockDocumentData(testCollection, { [testDocId]: testData });
      
      // Verify document exists before deletion
      const docBeforeDelete = await firestoreService.getDocument(testCollection, testDocId);
      expect(docBeforeDelete).not.toBeNull();
      
      // Execute the function
      await firestoreService.deleteDocument(testCollection, testDocId);
      
      // Verify document no longer exists
      const docAfterDelete = await firestoreService.getDocument(testCollection, testDocId);
      expect(docAfterDelete).toBeNull();
    });
  });

  describe('Real-time Updates', () => {
    it('subscribeToDocument should set up a listener for document changes', () => {
      // Setup test data
      const testCollection = 'test_collection';
      const testDocId = 'test-doc-id';
      const initialData = { name: 'Initial Document', value: 50 };
      
      setMockDocumentData(testCollection, { [testDocId]: initialData });
      
      // Create mock callback functions
      const onDataMock = vi.fn();
      const onErrorMock = vi.fn();
      
      // Subscribe to the document
      const unsubscribe = firestoreService.subscribeToDocument(
        testCollection,
        testDocId,
        onDataMock,
        onErrorMock
      );
      
      // Verify initial data callback
      expect(onDataMock).toHaveBeenCalledWith(expect.objectContaining({ id: testDocId, ...initialData }));
      
      // Update the document
      const updatedData = { name: 'Updated Document', value: 75 };
      setMockDocumentData(testCollection, { [testDocId]: updatedData });
      
      // Verify the callback was called with updated data
      expect(onDataMock).toHaveBeenCalledWith(expect.objectContaining({ id: testDocId, ...updatedData }));
      
      // Unsubscribe
      unsubscribe();
      
      // Update the document again
      const newData = { name: 'New Data', value: 100 };
      setMockDocumentData(testCollection, { [testDocId]: newData });
      
      // Verify callback calls count (should not increase after unsubscribe)
      const callCount = onDataMock.mock.calls.length;
      expect(onDataMock).toHaveBeenCalledTimes(callCount);
    });
    
    it('subscribeToCollection should set up a listener for collection changes', () => {
      // Setup test data
      const testCollection = 'test_collection';
      const initialDocs = {
        'doc1': { type: 'A', value: 10 },
        'doc2': { type: 'B', value: 20 }
      };
      
      setMockDocumentData(testCollection, initialDocs);
      
      // Create query constraints
      const queries: FirestoreQuery[] = [
        { field: 'type', operator: '==', value: 'A' }
      ];
      
      // Create mock callback functions
      const onDataMock = vi.fn();
      const onErrorMock = vi.fn();
      
      // Subscribe to the collection
      const unsubscribe = firestoreService.subscribeToCollection(
        testCollection,
        queries,
        onDataMock,
        onErrorMock
      );
      
      // Verify initial data callback with filtered documents
      expect(onDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'doc1', type: 'A', value: 10 })
        ])
      );
      
      // Add a new document that matches the query
      const newDocs = {
        ...initialDocs,
        'doc3': { type: 'A', value: 30 }
      };
      setMockDocumentData(testCollection, newDocs);
      
      // Verify the callback was called with updated collection data
      expect(onDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'doc1', type: 'A', value: 10 }),
          expect.objectContaining({ id: 'doc3', type: 'A', value: 30 })
        ])
      );
      
      // Unsubscribe
      unsubscribe();
      
      // Verify callback calls count (should not increase after unsubscribe)
      const callCount = onDataMock.mock.calls.length;
      
      // Add another document that matches the query
      const updatedDocs = {
        ...newDocs,
        'doc4': { type: 'A', value: 40 }
      };
      setMockDocumentData(testCollection, updatedDocs);
      
      // The callback should not be called again after unsubscribing
      expect(onDataMock).toHaveBeenCalledTimes(callCount);
    });
    
    it('subscribeToMeeting should set up a listener for meeting updates', () => {
      // Setup test data
      const meetingId = 'meeting-1';
      const meetingData = {
        title: 'Weekly Huddle',
        startTime: new Date(),
        status: 'active'
      };
      
      setMockDocumentData(FirestoreCollections.ACTIVE_MEETINGS, { [meetingId]: meetingData });
      
      // Create mock callback functions
      const onDataMock = vi.fn();
      const onErrorMock = vi.fn();
      
      // Subscribe to the meeting
      const unsubscribe = firestoreService.subscribeToMeeting(
        meetingId,
        onDataMock,
        onErrorMock
      );
      
      // Verify initial data callback
      expect(onDataMock).toHaveBeenCalledWith(expect.objectContaining({ id: meetingId, ...meetingData }));
      
      // Update the meeting
      const updatedMeetingData = {
        ...meetingData,
        status: 'completed'
      };
      setMockDocumentData(FirestoreCollections.ACTIVE_MEETINGS, { [meetingId]: updatedMeetingData });
      
      // Verify the callback was called with updated data
      expect(onDataMock).toHaveBeenCalledWith(expect.objectContaining({ id: meetingId, ...updatedMeetingData }));
      
      // Unsubscribe
      unsubscribe();
    });
    
    it('subscribeToMeetingStages should set up a listener for meeting stages', () => {
      // Setup test data
      const meetingId = 'meeting-1';
      const stages = {
        'stage1': { meetingId, type: 'goodNews', sequence: 1 },
        'stage2': { meetingId, type: 'priorities', sequence: 2 },
        'stage3': { meetingId: 'another-meeting', type: 'goodNews', sequence: 1 } // Different meeting
      };
      
      setMockDocumentData(FirestoreCollections.MEETING_STAGES, stages);
      
      // Create mock callback functions
      const onDataMock = vi.fn();
      const onErrorMock = vi.fn();
      
      // Subscribe to meeting stages
      const unsubscribe = firestoreService.subscribeToMeetingStages(
        meetingId,
        onDataMock,
        onErrorMock
      );
      
      // Verify callback was called with stages for this meeting only
      expect(onDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'stage1', meetingId, type: 'goodNews' }),
          expect.objectContaining({ id: 'stage2', meetingId, type: 'priorities' })
        ])
      );
      
      // Add a new stage for this meeting
      const updatedStages = {
        ...stages,
        'stage4': { meetingId, type: 'actionItems', sequence: 3 }
      };
      setMockDocumentData(FirestoreCollections.MEETING_STAGES, updatedStages);
      
      // Verify the callback was called with updated data
      expect(onDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'stage1', meetingId, type: 'goodNews' }),
          expect.objectContaining({ id: 'stage2', meetingId, type: 'priorities' }),
          expect.objectContaining({ id: 'stage4', meetingId, type: 'actionItems' })
        ])
      );
      
      // Unsubscribe
      unsubscribe();
    });
    
    it('subscribeToActionItems should set up a listener for action items', () => {
      // Setup test data
      const meetingId = 'meeting-1';
      const actionItems = {
        'item1': { meetingId, description: 'Task 1', assigneeId: 'user1', status: 'pending' },
        'item2': { meetingId, description: 'Task 2', assigneeId: 'user2', status: 'completed' },
        'item3': { meetingId: 'another-meeting', description: 'Task 3', assigneeId: 'user1', status: 'pending' } // Different meeting
      };
      
      setMockDocumentData(FirestoreCollections.ACTION_ITEMS, actionItems);
      
      // Create mock callback functions
      const onDataMock = vi.fn();
      const onErrorMock = vi.fn();
      
      // Subscribe to action items
      const unsubscribe = firestoreService.subscribeToActionItems(
        meetingId,
        onDataMock,
        onErrorMock
      );
      
      // Verify callback was called with action items for this meeting only
      expect(onDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'item1', meetingId, description: 'Task 1' }),
          expect.objectContaining({ id: 'item2', meetingId, description: 'Task 2' })
        ])
      );
      
      // Update an action item
      const updatedActionItems = {
        ...actionItems,
        'item1': { meetingId, description: 'Task 1 Updated', assigneeId: 'user1', status: 'inProgress' }
      };
      setMockDocumentData(FirestoreCollections.ACTION_ITEMS, updatedActionItems);
      
      // Verify the callback was called with updated data
      expect(onDataMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'item1', meetingId, description: 'Task 1 Updated', status: 'inProgress' }),
          expect.objectContaining({ id: 'item2', meetingId, description: 'Task 2' })
        ])
      );
      
      // Unsubscribe
      unsubscribe();
    });
    
    it('updateMeetingPresence should update user presence in a meeting', async () => {
      // Setup test parameters
      const meetingId = 'meeting-1';
      const userId = 'user-1';
      const status = 'online';
      const isTyping = true;
      
      // Execute the function
      await firestoreService.updateMeetingPresence(meetingId, userId, status, isTyping);
      
      // Verify the presence document was created/updated
      const presenceId = `${meetingId}_${userId}`;
      const presenceDoc = await firestoreService.getDocument(FirestoreCollections.USER_PRESENCE, presenceId);
      
      // Assertions
      expect(presenceDoc).toMatchObject({
        meetingId,
        userId,
        status,
        isTyping
      });
      expect(presenceDoc?.lastActive).toBeDefined();
    });
  });

  describe('Batch Operations and Transactions', () => {
    it('batchWrite should perform multiple operations in a single batch', async () => {
      // Setup test data
      const testCollection = 'test_collection';
      const existingDocId = 'existing-doc';
      const newDocId = 'new-doc';
      const customDocId = 'custom-doc';
      
      // Create an existing document to update and delete
      setMockDocumentData(testCollection, {
        [existingDocId]: { name: 'Existing Document', value: 50 }
      });
      
      // Define batch operations
      const operations = [
        {
          operation: 'create' as const,
          collectionName: testCollection,
          data: { name: 'New Document', value: 100 }
        },
        {
          operation: 'create' as const,
          collectionName: testCollection,
          documentId: customDocId,
          data: { name: 'Custom ID Document', value: 150 }
        },
        {
          operation: 'update' as const,
          collectionName: testCollection,
          documentId: existingDocId,
          data: { value: 200, updated: true }
        },
        {
          operation: 'delete' as const,
          collectionName: testCollection,
          documentId: existingDocId
        }
      ];
      
      // Execute the function
      await firestoreService.batchWrite(operations);
      
      // Verify the operations were performed
      const customIdDoc = await firestoreService.getDocument(testCollection, customDocId);
      const deletedDoc = await firestoreService.getDocument(testCollection, existingDocId);
      
      // Assertions
      expect(customIdDoc).toMatchObject({
        id: customDocId,
        name: 'Custom ID Document',
        value: 150
      });
      expect(deletedDoc).toBeNull(); // Should be deleted
    });
    
    it('runTransaction should execute a transaction function', async () => {
      // Setup test data
      const testCollection = 'test_collection';
      const docId = 'test-doc';
      const initialData = { counter: 5 };
      
      setMockDocumentData(testCollection, { [docId]: initialData });
      
      // Define transaction handler
      const transactionHandler = async (transaction: any) => {
        // Get the document
        const docRef = { path: `${testCollection}/${docId}` }; // Mock document reference
        const docSnapshot = await transaction.get(docRef);
        
        if (!docSnapshot.exists) {
          throw new Error('Document does not exist');
        }
        
        // Get current counter value
        const data = docSnapshot.data();
        const newCounter = data.counter + 10;
        
        // Update the document
        transaction.update(docRef, { counter: newCounter });
        
        return newCounter;
      };
      
      // Execute the function
      const result = await firestoreService.runTransaction(transactionHandler);
      
      // Verify the transaction result
      expect(result).toBe(15);
      
      // Verify the document was updated
      const updatedDoc = await firestoreService.getDocument(testCollection, docId);
      expect(updatedDoc).toMatchObject({
        id: docId,
        counter: 15
      });
    });
  });

  describe('Utility Functions', () => {
    it('createConverter should create a Firestore converter', () => {
      // Mock converter functions
      const toFirestore = (data: { name: string; age: number }) => ({
        displayName: data.name,
        userAge: data.age
      });
      
      const fromFirestore = (snapshot: any) => {
        const data = snapshot.data();
        return {
          name: data.displayName,
          age: data.userAge
        };
      };
      
      // Create the converter
      const converter = firestoreService.createConverter(toFirestore, fromFirestore);
      
      // Verify the converter structure
      expect(converter).toHaveProperty('toFirestore');
      expect(converter).toHaveProperty('fromFirestore');
      
      // Test the converter functions
      const testData = { name: 'Test User', age: 30 };
      const firestoreData = converter.toFirestore(testData);
      expect(firestoreData).toEqual({
        displayName: 'Test User',
        userAge: 30
      });
      
      const mockSnapshot = {
        data: () => ({ displayName: 'Test User', userAge: 30 })
      };
      const convertedData = converter.fromFirestore(mockSnapshot as any);
      expect(convertedData).toEqual({
        name: 'Test User',
        age: 30
      });
    });
    
    it('timestampToDate should convert Firestore Timestamp to Date', () => {
      // Create a test date
      const testDate = new Date('2023-01-15T12:30:00Z');
      
      // Create a mock Timestamp (in the test environment, we're treating dates as timestamps)
      const mockTimestamp = testDate;
      
      // Convert to Date
      const result = firestoreService.timestampToDate(mockTimestamp);
      
      // Assertions
      expect(result).toBeInstanceOf(Date);
      expect(result).toEqual(testDate);
      
      // Test with null/undefined values
      expect(firestoreService.timestampToDate(null)).toBeNull();
      expect(firestoreService.timestampToDate(undefined)).toBeNull();
    });
    
    it('dateToTimestamp should convert Date to Firestore Timestamp', () => {
      // Create a test date
      const testDate = new Date('2023-01-15T12:30:00Z');
      
      // Convert to Timestamp
      const result = firestoreService.dateToTimestamp(testDate);
      
      // In the test environment, we're using a simplified mock where Timestamps are just Dates
      expect(result).toEqual(testDate);
      
      // Test with null/undefined values
      expect(firestoreService.dateToTimestamp(null)).toBeNull();
      expect(firestoreService.dateToTimestamp(undefined)).toBeNull();
    });
    
    it('getServerTimestamp should return a server timestamp field value', () => {
      // Execute the function
      const result = firestoreService.getServerTimestamp();
      
      // In the test environment, serverTimestamp returns a Date
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('getDocument should handle errors gracefully', async () => {
      // Mock console.error to avoid polluting test output
      const originalConsoleError = console.error;
      console.error = vi.fn();
      
      // Mock a Firestore error
      const errorMessage = 'Firestore error';
      vi.spyOn(mockFirestore, 'collection').mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });
      
      // Execute the function and expect it to throw
      await expect(firestoreService.getDocument('test_collection', 'test-doc'))
        .rejects.toThrow(errorMessage);
      
      // Verify error logging
      expect(console.error).toHaveBeenCalled();
      
      // Restore console.error
      console.error = originalConsoleError;
    });
    
    it('subscribeToDocument should call error callback when an error occurs', () => {
      // Mock error for document subscription
      const errorMessage = 'Subscription error';
      const mockDocRef = {
        onSnapshot: (_: any, onError: any) => {
          onError(new Error(errorMessage));
          return () => {};
        }
      };
      
      vi.spyOn(mockFirestore, 'collection').mockImplementationOnce(() => ({
        doc: () => mockDocRef
      }));
      
      // Create mock callback functions
      const onDataMock = vi.fn();
      const onErrorMock = vi.fn();
      
      // Subscribe to the document
      firestoreService.subscribeToDocument(
        'test_collection',
        'test-doc',
        onDataMock,
        onErrorMock
      );
      
      // Verify error callback was called
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
      expect(onErrorMock).toHaveBeenCalledWith(expect.objectContaining({
        message: errorMessage
      }));
    });
  });
});