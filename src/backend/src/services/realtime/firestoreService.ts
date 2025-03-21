import * as admin from 'firebase-admin'; // ^11.8.0
import { logger } from '../../utils/helpers/logger';
import { ValidationError, NotFoundError, ApiError } from '../../utils/errors';
import { firestore } from '../../config/firebase';
import { MeetingStatus, ParticipantStatus } from '../../types';

/**
 * Creates a new document in the specified Firestore collection
 * 
 * @param collection The collection name where document will be created
 * @param data Document data to be stored
 * @param documentId Optional document ID (if not provided, Firestore will generate one)
 * @returns Promise resolving to the created document ID
 * @throws ValidationError if collection or data is invalid
 */
export const createDocument = async (
  collection: string,
  data: Record<string, any>,
  documentId?: string
): Promise<string> => {
  try {
    // Validate inputs
    if (!collection) {
      throw new ValidationError('Collection name is required');
    }

    if (!data || typeof data !== 'object') {
      throw new ValidationError('Document data must be a valid object');
    }

    // Add timestamps
    const docData = {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    let docRef: admin.firestore.DocumentReference;
    
    // Create the document with the provided ID or let Firestore generate one
    if (documentId) {
      docRef = firestore.collection(collection).doc(documentId);
      await docRef.set(docData);
    } else {
      docRef = await firestore.collection(collection).add(docData);
    }

    logger.info('Document created successfully', { 
      collection, 
      documentId: docRef.id 
    });

    return docRef.id;
  } catch (error) {
    logger.error('Failed to create document', { 
      collection, 
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to create document in ${collection}: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Retrieves a document from the specified Firestore collection
 * 
 * @param collection The collection name to retrieve from
 * @param documentId ID of the document to retrieve
 * @returns Promise resolving to the document data or null if not found
 * @throws ValidationError if collection or documentId is invalid
 */
export const getDocument = async (
  collection: string,
  documentId: string
): Promise<any | null> => {
  try {
    // Validate inputs
    if (!collection) {
      throw new ValidationError('Collection name is required');
    }

    if (!documentId) {
      throw new ValidationError('Document ID is required');
    }

    // Get document reference and fetch the document
    const docRef = firestore.collection(collection).doc(documentId);
    const doc = await docRef.get();

    // If document exists, return data with ID
    if (doc.exists) {
      const data = doc.data();
      
      logger.debug('Document retrieved successfully', { 
        collection, 
        documentId 
      });
      
      return {
        id: doc.id,
        ...data
      };
    }
    
    logger.debug('Document not found', { 
      collection, 
      documentId 
    });
    
    return null;
  } catch (error) {
    logger.error('Failed to retrieve document', { 
      collection,
      documentId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to retrieve document from ${collection}: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Updates an existing document in the specified Firestore collection
 * 
 * @param collection The collection name where document exists
 * @param documentId ID of the document to update
 * @param data The data to update in the document
 * @returns Promise resolving when update is complete
 * @throws ValidationError if collection, documentId, or data is invalid
 */
export const updateDocument = async (
  collection: string,
  documentId: string,
  data: Record<string, any>
): Promise<void> => {
  try {
    // Validate inputs
    if (!collection) {
      throw new ValidationError('Collection name is required');
    }

    if (!documentId) {
      throw new ValidationError('Document ID is required');
    }

    if (!data || typeof data !== 'object') {
      throw new ValidationError('Update data must be a valid object');
    }

    // Add updated timestamp
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update the document
    const docRef = firestore.collection(collection).doc(documentId);
    await docRef.update(updateData);

    logger.info('Document updated successfully', {
      collection,
      documentId
    });
  } catch (error) {
    logger.error('Failed to update document', {
      collection,
      documentId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    // Check for document not found error
    if (error instanceof Error && error.message.includes('No document to update')) {
      throw new NotFoundError(`Document with ID ${documentId} not found in collection ${collection}`);
    }
    
    throw new ApiError(`Failed to update document in ${collection}: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Deletes a document from the specified Firestore collection
 * 
 * @param collection The collection name where document exists
 * @param documentId ID of the document to delete
 * @returns Promise resolving when deletion is complete
 * @throws ValidationError if collection or documentId is invalid
 */
export const deleteDocument = async (
  collection: string,
  documentId: string
): Promise<void> => {
  try {
    // Validate inputs
    if (!collection) {
      throw new ValidationError('Collection name is required');
    }

    if (!documentId) {
      throw new ValidationError('Document ID is required');
    }

    // Delete the document
    const docRef = firestore.collection(collection).doc(documentId);
    await docRef.delete();

    logger.info('Document deleted successfully', {
      collection,
      documentId
    });
  } catch (error) {
    logger.error('Failed to delete document', {
      collection,
      documentId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to delete document from ${collection}: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Queries documents from a collection based on filters
 * 
 * @param collection The collection name to query
 * @param filters Optional query filters (field-value pairs)
 * @param options Optional query options for ordering and pagination
 * @returns Promise resolving to an array of matching documents
 * @throws ValidationError if collection is invalid
 */
export const queryDocuments = async (
  collection: string,
  filters: Record<string, any> = {},
  options: {
    orderBy?: { field: string; direction: 'asc' | 'desc' }[];
    limit?: number;
    startAfter?: any;
  } = {}
): Promise<any[]> => {
  try {
    // Validate inputs
    if (!collection) {
      throw new ValidationError('Collection name is required');
    }

    // Start with the base collection query
    let query: admin.firestore.Query = firestore.collection(collection);

    // Apply filters if provided
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value) && value.length === 2 && value[0] === '>' && typeof value[1] !== 'undefined') {
            query = query.where(field, '>', value[1]);
          } else if (Array.isArray(value) && value.length === 2 && value[0] === '<' && typeof value[1] !== 'undefined') {
            query = query.where(field, '<', value[1]);
          } else if (Array.isArray(value) && value.length === 2 && value[0] === '>=' && typeof value[1] !== 'undefined') {
            query = query.where(field, '>=', value[1]);
          } else if (Array.isArray(value) && value.length === 2 && value[0] === '<=' && typeof value[1] !== 'undefined') {
            query = query.where(field, '<=', value[1]);
          } else if (Array.isArray(value) && value.length === 2 && value[0] === '!=' && typeof value[1] !== 'undefined') {
            query = query.where(field, '!=', value[1]);
          } else if (Array.isArray(value) && value.length > 0) {
            query = query.where(field, 'in', value);
          } else {
            query = query.where(field, '==', value);
          }
        }
      });
    }

    // Apply ordering if provided
    if (options.orderBy && options.orderBy.length > 0) {
      options.orderBy.forEach(({ field, direction }) => {
        query = query.orderBy(field, direction);
      });
    }

    // Apply pagination if provided
    if (options.startAfter) {
      query = query.startAfter(options.startAfter);
    }

    if (options.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    // Execute the query
    const querySnapshot = await query.get();
    
    // Transform query snapshot to array of documents with IDs
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logger.debug('Query executed successfully', {
      collection,
      documentCount: documents.length,
      hasFilters: Object.keys(filters).length > 0
    });

    return documents;
  } catch (error) {
    logger.error('Failed to query documents', {
      collection,
      filters,
      options,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to query documents from ${collection}: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Performs multiple write operations as a batch
 * 
 * @param operations Array of batch operations with operation type, collection, document ID, and optional data
 * @returns Promise resolving when the batch is committed
 * @throws ValidationError if operations array is invalid
 */
export const batchWrite = async (
  operations: Array<{
    operation: 'create' | 'update' | 'delete';
    collection: string;
    documentId: string;
    data?: Record<string, any>;
  }>
): Promise<void> => {
  try {
    // Validate inputs
    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      throw new ValidationError('Operations array is required and must not be empty');
    }

    // Create batch
    const batch = firestore.batch();

    // Process each operation
    for (const op of operations) {
      const { operation, collection, documentId, data } = op;
      const docRef = firestore.collection(collection).doc(documentId);

      if (operation === 'create' && data) {
        batch.set(docRef, {
          ...data,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (operation === 'update' && data) {
        batch.update(docRef, {
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (operation === 'delete') {
        batch.delete(docRef);
      } else {
        throw new ValidationError(`Invalid operation type: ${operation} or missing required data`);
      }
    }

    // Commit the batch
    await batch.commit();

    logger.info('Batch operation completed successfully', {
      operationCount: operations.length
    });
  } catch (error) {
    logger.error('Failed to execute batch operation', {
      operationCount: operations.length,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to execute batch operation: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Executes a transaction function
 * 
 * @param transactionFn Function to execute within the transaction
 * @returns Promise resolving to the result of the transaction
 * @throws ValidationError if transaction function is invalid
 */
export const runTransaction = async <T>(
  transactionFn: (transaction: admin.firestore.Transaction) => Promise<T>
): Promise<T> => {
  try {
    // Validate inputs
    if (!transactionFn || typeof transactionFn !== 'function') {
      throw new ValidationError('Transaction function is required');
    }

    // Run the transaction
    const result = await firestore.runTransaction(transactionFn);

    logger.info('Transaction completed successfully');
    
    return result;
  } catch (error) {
    logger.error('Failed to execute transaction', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Sets up a real-time listener for a document
 * 
 * @param collection The collection name to listen to
 * @param documentId ID of the document to listen to
 * @param callback Function to call when document changes
 * @returns Function to unsubscribe the listener
 * @throws ValidationError if collection, documentId or callback is invalid
 */
export const listenToDocument = (
  collection: string,
  documentId: string,
  callback: (data: any | null) => void
): () => void => {
  try {
    // Validate inputs
    if (!collection) {
      throw new ValidationError('Collection name is required');
    }

    if (!documentId) {
      throw new ValidationError('Document ID is required');
    }

    if (!callback || typeof callback !== 'function') {
      throw new ValidationError('Callback function is required');
    }

    // Set up the document listener
    const docRef = firestore.collection(collection).doc(documentId);
    const unsubscribe = docRef.onSnapshot(
      (doc) => {
        if (doc.exists) {
          const data = doc.data();
          callback({
            id: doc.id,
            ...data
          });
        } else {
          callback(null);
        }
      },
      (error) => {
        logger.error('Error in document listener', {
          collection,
          documentId,
          error: error.message
        });
        
        // Notify with null on error
        callback(null);
      }
    );

    logger.debug('Document listener set up successfully', {
      collection,
      documentId
    });

    return unsubscribe;
  } catch (error) {
    logger.error('Failed to set up document listener', {
      collection,
      documentId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to set up document listener: ${error instanceof Error ? error.message : String(error)}`, 500);
    
    // Return a no-op function in case of error
    return () => {};
  }
};

/**
 * Sets up a real-time listener for a query
 * 
 * @param collection The collection name to query
 * @param filters Optional query filters
 * @param callback Function to call when query results change
 * @param options Optional query options for ordering and pagination
 * @returns Function to unsubscribe the listener
 * @throws ValidationError if collection or callback is invalid
 */
export const listenToQuery = (
  collection: string,
  filters: Record<string, any> = {},
  callback: (data: any[]) => void,
  options: {
    orderBy?: { field: string; direction: 'asc' | 'desc' }[];
    limit?: number;
  } = {}
): () => void => {
  try {
    // Validate inputs
    if (!collection) {
      throw new ValidationError('Collection name is required');
    }

    if (!callback || typeof callback !== 'function') {
      throw new ValidationError('Callback function is required');
    }

    // Start with the base query
    let query: admin.firestore.Query = firestore.collection(collection);

    // Apply filters if provided
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value) && value.length === 2 && value[0] === '>' && typeof value[1] !== 'undefined') {
            query = query.where(field, '>', value[1]);
          } else if (Array.isArray(value) && value.length === 2 && value[0] === '<' && typeof value[1] !== 'undefined') {
            query = query.where(field, '<', value[1]);
          } else if (Array.isArray(value) && value.length === 2 && value[0] === '>=' && typeof value[1] !== 'undefined') {
            query = query.where(field, '>=', value[1]);
          } else if (Array.isArray(value) && value.length === 2 && value[0] === '<=' && typeof value[1] !== 'undefined') {
            query = query.where(field, '<=', value[1]);
          } else if (Array.isArray(value) && value.length === 2 && value[0] === '!=' && typeof value[1] !== 'undefined') {
            query = query.where(field, '!=', value[1]);
          } else if (Array.isArray(value) && value.length > 0) {
            query = query.where(field, 'in', value);
          } else {
            query = query.where(field, '==', value);
          }
        }
      });
    }

    // Apply ordering if provided
    if (options.orderBy && options.orderBy.length > 0) {
      options.orderBy.forEach(({ field, direction }) => {
        query = query.orderBy(field, direction);
      });
    }

    // Apply limit if provided
    if (options.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    // Set up the query listener
    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(documents);
      },
      (error) => {
        logger.error('Error in query listener', {
          collection,
          error: error.message
        });
        
        // Notify with empty array on error
        callback([]);
      }
    );

    logger.debug('Query listener set up successfully', {
      collection,
      hasFilters: Object.keys(filters).length > 0
    });

    return unsubscribe;
  } catch (error) {
    logger.error('Failed to set up query listener', {
      collection,
      filters,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to set up query listener: ${error instanceof Error ? error.message : String(error)}`, 500);
    
    // Return a no-op function in case of error
    return () => {};
  }
};

/**
 * Creates a Firestore document for meeting collaboration
 * 
 * @param meetingId ID of the meeting (should match PostgreSQL meeting ID)
 * @param meetingData Meeting data to be stored
 * @returns Promise resolving to the created document ID
 * @throws ValidationError if meetingId or meetingData is invalid
 */
export const createMeetingDocument = async (
  meetingId: string,
  meetingData: Record<string, any>
): Promise<string> => {
  try {
    // Validate inputs
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!meetingData || typeof meetingData !== 'object') {
      throw new ValidationError('Meeting data must be a valid object');
    }

    // Format the meeting data for Firestore
    const formattedData = {
      ...meetingData,
      status: meetingData.status || MeetingStatus.SCHEDULED,
      currentStage: meetingData.currentStage || null,
      participants: meetingData.participants || [],
      startTime: meetingData.startTime || admin.firestore.Timestamp.now(),
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Create the meeting document
    const docId = await createDocument('active-meetings', formattedData, meetingId);

    logger.info('Meeting document created successfully', {
      meetingId: docId
    });

    return docId;
  } catch (error) {
    logger.error('Failed to create meeting document', {
      meetingId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to create meeting document: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Updates a specific stage of an active meeting
 * 
 * @param meetingId ID of the meeting
 * @param stageId ID of the meeting stage
 * @param stageData Updated stage data
 * @param userId ID of the user making the update
 * @returns Promise resolving when update is complete
 * @throws ValidationError if any required parameter is invalid
 */
export const updateMeetingStage = async (
  meetingId: string,
  stageId: string,
  stageData: Record<string, any>,
  userId: string
): Promise<void> => {
  try {
    // Validate inputs
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!stageId) {
      throw new ValidationError('Stage ID is required');
    }

    if (!stageData || typeof stageData !== 'object') {
      throw new ValidationError('Stage data must be a valid object');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Add metadata about who updated and when
    const formattedData = {
      ...stageData,
      lastUpdatedBy: userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update the stage document
    await updateDocument(`meeting-stages`, `${meetingId}_${stageId}`, formattedData);

    // Also update the meeting's lastActivity timestamp
    await updateDocument('active-meetings', meetingId, {
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info('Meeting stage updated successfully', {
      meetingId,
      stageId,
      userId
    });
  } catch (error) {
    logger.error('Failed to update meeting stage', {
      meetingId,
      stageId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to update meeting stage: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Updates the status of an active meeting
 * 
 * @param meetingId ID of the meeting
 * @param status New status for the meeting
 * @param userId ID of the user making the update
 * @returns Promise resolving when update is complete
 * @throws ValidationError if any required parameter is invalid
 */
export const updateMeetingStatus = async (
  meetingId: string,
  status: MeetingStatus,
  userId: string
): Promise<void> => {
  try {
    // Validate inputs
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!status || !Object.values(MeetingStatus).includes(status)) {
      throw new ValidationError('Valid meeting status is required');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      status,
      lastUpdatedBy: userId,
      lastActivity: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add completedAt timestamp if status is COMPLETED
    if (status === MeetingStatus.COMPLETED) {
      updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // Update the meeting document
    await updateDocument('active-meetings', meetingId, updateData);

    logger.info('Meeting status updated successfully', {
      meetingId,
      status,
      userId
    });
  } catch (error) {
    logger.error('Failed to update meeting status', {
      meetingId,
      status,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to update meeting status: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Updates the presence status of a meeting participant
 * 
 * @param meetingId ID of the meeting
 * @param userId ID of the participant
 * @param status Presence status of the participant
 * @returns Promise resolving when update is complete
 * @throws ValidationError if any required parameter is invalid
 */
export const updateParticipantPresence = async (
  meetingId: string,
  userId: string,
  status: ParticipantStatus
): Promise<void> => {
  try {
    // Validate inputs
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!status || !Object.values(ParticipantStatus).includes(status)) {
      throw new ValidationError('Valid participant status is required');
    }

    // Create the path to update the participant's presence
    const presencePath = `active-meetings/${meetingId}/participants/${userId}`;
    
    // Update the participant's presence
    await firestore.doc(presencePath).set({
      status,
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    logger.debug('Participant presence updated', {
      meetingId,
      userId,
      status
    });
  } catch (error) {
    logger.error('Failed to update participant presence', {
      meetingId,
      userId,
      status,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ApiError(`Failed to update participant presence: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Closes an active meeting document and archives it
 * 
 * @param meetingId ID of the meeting to close
 * @param userId ID of the user closing the meeting
 * @returns Promise resolving when closure is complete
 * @throws ValidationError if meetingId or userId is invalid
 * @throws NotFoundError if meeting document is not found
 */
export const closeMeetingDocument = async (
  meetingId: string,
  userId: string
): Promise<void> => {
  try {
    // Validate inputs
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Get the active meeting document
    const meetingDoc = await getDocument('active-meetings', meetingId);
    
    if (!meetingDoc) {
      throw new NotFoundError(`Meeting document with ID ${meetingId} not found`);
    }

    // Create a copy in the archived-meetings collection
    const archiveData = {
      ...meetingDoc,
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      archivedBy: userId
    };
    
    await createDocument('archived-meetings', archiveData, meetingId);

    // Delete the active meeting document
    await deleteDocument('active-meetings', meetingId);

    logger.info('Meeting document closed and archived', {
      meetingId,
      userId
    });
  } catch (error) {
    logger.error('Failed to close meeting document', {
      meetingId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    
    throw new ApiError(`Failed to close meeting document: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
};

/**
 * Service class for low-level Firebase Firestore operations
 */
export class FirestoreService {
  /**
   * Creates a new document in the specified Firestore collection
   */
  async createDocument(
    collection: string,
    data: Record<string, any>,
    documentId?: string
  ): Promise<string> {
    return createDocument(collection, data, documentId);
  }

  /**
   * Retrieves a document from the specified Firestore collection
   */
  async getDocument(
    collection: string,
    documentId: string
  ): Promise<any | null> {
    return getDocument(collection, documentId);
  }

  /**
   * Updates an existing document in the specified Firestore collection
   */
  async updateDocument(
    collection: string,
    documentId: string,
    data: Record<string, any>
  ): Promise<void> {
    return updateDocument(collection, documentId, data);
  }

  /**
   * Deletes a document from the specified Firestore collection
   */
  async deleteDocument(
    collection: string,
    documentId: string
  ): Promise<void> {
    return deleteDocument(collection, documentId);
  }

  /**
   * Queries documents from a collection based on filters
   */
  async queryDocuments(
    collection: string,
    filters: Record<string, any> = {},
    options: {
      orderBy?: { field: string; direction: 'asc' | 'desc' }[];
      limit?: number;
      startAfter?: any;
    } = {}
  ): Promise<any[]> {
    return queryDocuments(collection, filters, options);
  }

  /**
   * Performs multiple write operations as a batch
   */
  async batchWrite(
    operations: Array<{
      operation: 'create' | 'update' | 'delete';
      collection: string;
      documentId: string;
      data?: Record<string, any>;
    }>
  ): Promise<void> {
    return batchWrite(operations);
  }

  /**
   * Executes a transaction function
   */
  async runTransaction<T>(
    transactionFn: (transaction: admin.firestore.Transaction) => Promise<T>
  ): Promise<T> {
    return runTransaction(transactionFn);
  }

  /**
   * Sets up a real-time listener for a document
   */
  listenToDocument(
    collection: string,
    documentId: string,
    callback: (data: any | null) => void
  ): () => void {
    return listenToDocument(collection, documentId, callback);
  }

  /**
   * Sets up a real-time listener for a query
   */
  listenToQuery(
    collection: string,
    filters: Record<string, any> = {},
    callback: (data: any[]) => void,
    options: {
      orderBy?: { field: string; direction: 'asc' | 'desc' }[];
      limit?: number;
    } = {}
  ): () => void {
    return listenToQuery(collection, filters, callback, options);
  }

  /**
   * Creates a Firestore document for meeting collaboration
   */
  async createMeetingDocument(
    meetingId: string,
    meetingData: Record<string, any>
  ): Promise<string> {
    return createMeetingDocument(meetingId, meetingData);
  }

  /**
   * Updates a specific stage of an active meeting
   */
  async updateMeetingStage(
    meetingId: string,
    stageId: string,
    stageData: Record<string, any>,
    userId: string
  ): Promise<void> {
    return updateMeetingStage(meetingId, stageId, stageData, userId);
  }

  /**
   * Updates the status of an active meeting
   */
  async updateMeetingStatus(
    meetingId: string,
    status: MeetingStatus,
    userId: string
  ): Promise<void> {
    return updateMeetingStatus(meetingId, status, userId);
  }

  /**
   * Updates the presence status of a meeting participant
   */
  async updateParticipantPresence(
    meetingId: string,
    userId: string,
    status: ParticipantStatus
  ): Promise<void> {
    return updateParticipantPresence(meetingId, userId, status);
  }

  /**
   * Closes an active meeting document and archives it
   */
  async closeMeetingDocument(
    meetingId: string,
    userId: string
  ): Promise<void> {
    return closeMeetingDocument(meetingId, userId);
  }
}