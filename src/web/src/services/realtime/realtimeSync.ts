import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  subscribeToDocument,
  subscribeToCollection
} from '../firebase/firebaseFirestore';
import { 
  FirestoreCollections, 
  FirestoreDocument, 
  FirestoreQuery, 
  FirestoreQueryOptions 
} from '../../types/firebase.types';
import { Unsubscribe, DocumentData } from 'firebase/firestore'; // Firebase v9.0.0
import Logger from 'loglevel'; // v1.8.1

// Configure logger
Logger.setLevel(process.env.NODE_ENV === 'development' ? Logger.levels.DEBUG : Logger.levels.WARN);

// Constants for retry mechanism
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Local cache for storing document data
const localCache = new Map<string, DocumentData>();

// Pending operations that need to be retried when connection is restored
const pendingOperations = new Map<string, { 
  operation: 'update' | 'create' | 'delete', 
  data?: DocumentData,
  collectionName: string,
  documentId: string 
}>();

/**
 * Synchronizes a document between client and Firestore with error handling
 * @param collectionName Collection name containing the document
 * @param documentId ID of the document to synchronize
 * @param onData Callback function for data updates
 * @param onError Callback function for error handling
 * @returns Function to unsubscribe from real-time updates
 */
export const syncDocument = (
  collectionName: string,
  documentId: string,
  onData: (data: DocumentData | null) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  // Create a cache key by combining collectionName and documentId
  const cacheKey = `${collectionName}_${documentId}`;
  
  try {
    // Check if there's a pending operation for this document
    const pendingOp = pendingOperations.get(cacheKey);
    
    // If there's a pending operation, apply it to the local cache
    if (pendingOp) {
      if (pendingOp.operation === 'delete') {
        localCache.delete(cacheKey);
      } else if (pendingOp.data) {
        localCache.set(cacheKey, pendingOp.data);
      }
    }
    
    // Set up a subscription to the document using subscribeToDocument
    const unsubscribe = subscribeToDocument(
      collectionName,
      documentId,
      (documentData) => {
        if (documentData) {
          // When data changes, check for conflicts with local data
          const cachedData = localCache.get(cacheKey);
          
          if (cachedData && cachedData.updatedAt && documentData.updatedAt) {
            // If there's both local and remote data, check for conflicts
            const resolvedData = resolveConflict(cachedData, documentData);
            localCache.set(cacheKey, resolvedData);
            onData(resolvedData);
          } else {
            // No conflict, just update the cache and notify
            localCache.set(cacheKey, documentData);
            onData(documentData);
          }
        } else {
          // Document doesn't exist remotely
          if (localCache.has(cacheKey)) {
            // If it exists locally, keep serving the local version
            onData(localCache.get(cacheKey) || null);
          } else {
            // Otherwise, it's truly gone
            localCache.delete(cacheKey);
            onData(null);
          }
        }
      },
      (error) => {
        Logger.error(`Error syncing document ${documentId} from ${collectionName}:`, error);
        
        // If offline, serve data from local cache if available
        if (error.message.includes('network') && localCache.has(cacheKey)) {
          Logger.warn(`Network error, serving ${documentId} from local cache`);
          onData(localCache.get(cacheKey) || null);
        } else {
          onError(error);
        }
      }
    );
    
    // Initial fetch to populate cache if needed and we're online
    if (!localCache.has(cacheKey) && window.navigator.onLine) {
      getDocument(collectionName, documentId)
        .then((data) => {
          if (data) {
            localCache.set(cacheKey, data);
          }
        })
        .catch((error) => {
          Logger.error(`Error fetching initial document ${documentId}:`, error);
        });
    }
    
    return unsubscribe;
  } catch (error) {
    // Handle unexpected errors
    const typedError = error as Error;
    Logger.error(`Unexpected error in syncDocument for ${documentId}:`, typedError);
    onError(typedError);
    
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Synchronizes a collection between client and Firestore with error handling
 * @param collectionName Collection name to synchronize
 * @param queries Optional query constraints
 * @param onData Callback function for data updates
 * @param onError Callback function for error handling
 * @param options Optional query options
 * @returns Function to unsubscribe from real-time updates
 */
export const syncCollection = (
  collectionName: string,
  queries: FirestoreQuery[] = [],
  onData: (data: DocumentData[]) => void,
  onError: (error: Error) => void,
  options?: FirestoreQueryOptions
): Unsubscribe => {
  // Create a cache key based on collectionName and queries
  const queriesString = JSON.stringify(queries);
  const optionsString = options ? JSON.stringify(options) : '';
  const cacheKey = `${collectionName}_${queriesString}_${optionsString}`;
  
  try {
    // Set up a subscription to the collection
    const unsubscribe = subscribeToCollection(
      collectionName,
      queries,
      (collectionData) => {
        // Process each document in the collection
        const processedData = collectionData.map(doc => {
          const docCacheKey = `${collectionName}_${doc.id}`;
          
          // Check for pending operations
          const pendingOp = pendingOperations.get(docCacheKey);
          
          if (pendingOp) {
            if (pendingOp.operation === 'delete') {
              return null; // Document is pending deletion
            } else if (pendingOp.data) {
              // Apply pending update/create
              localCache.set(docCacheKey, pendingOp.data);
              return pendingOp.data;
            }
          }
          
          // Check for conflicts with cached data
          const cachedDoc = localCache.get(docCacheKey);
          if (cachedDoc && cachedDoc.updatedAt && doc.updatedAt) {
            // Resolve conflicts if they exist
            const resolvedData = resolveConflict(cachedDoc, doc);
            localCache.set(docCacheKey, resolvedData);
            return resolvedData;
          }
          
          // No conflicts or pending operations
          localCache.set(docCacheKey, doc);
          return doc;
        });
        
        // Filter out null values (deleted docs)
        const filteredData = processedData.filter(Boolean) as DocumentData[];
        
        // Update local cache for the entire collection result
        localCache.set(cacheKey, filteredData);
        
        // Call onData with the updated collection data
        onData(filteredData);
      },
      (error) => {
        Logger.error(`Error syncing collection ${collectionName}:`, error);
        
        // If offline, serve data from local cache if available
        if (error.message.includes('network') && localCache.has(cacheKey)) {
          Logger.warn(`Network error, serving ${collectionName} from local cache`);
          onData(localCache.get(cacheKey) as DocumentData[] || []);
        } else {
          onError(error);
        }
      },
      options
    );
    
    // Initial fetch to populate cache if needed and we're online
    if (!localCache.has(cacheKey) && window.navigator.onLine) {
      getDocuments(collectionName, queries, options)
        .then((data) => {
          // Cache individual documents
          data.forEach(doc => {
            const docCacheKey = `${collectionName}_${doc.id}`;
            localCache.set(docCacheKey, doc);
          });
          
          // Cache the entire collection result
          localCache.set(cacheKey, data);
        })
        .catch((error) => {
          Logger.error(`Error fetching initial collection ${collectionName}:`, error);
        });
    }
    
    return unsubscribe;
  } catch (error) {
    // Handle unexpected errors
    const typedError = error as Error;
    Logger.error(`Unexpected error in syncCollection for ${collectionName}:`, typedError);
    onError(typedError);
    
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Updates a document in Firestore with error handling and retry logic
 * @param collectionName Collection name containing the document
 * @param documentId ID of the document to update
 * @param data Document data to update
 * @param retryCount Current retry attempt (used internally)
 * @returns Promise that resolves when the update is complete
 */
export const updateSyncedDocument = async (
  collectionName: string,
  documentId: string,
  data: DocumentData,
  retryCount = 0
): Promise<void> => {
  // Create a cache key by combining collectionName and documentId
  const cacheKey = `${collectionName}_${documentId}`;
  
  try {
    // Update the local cache with the new data
    const currentData = localCache.get(cacheKey) || {};
    const newData = { ...currentData, ...data, id: documentId };
    localCache.set(cacheKey, newData);
    
    // Store the operation in pendingOperations
    pendingOperations.set(cacheKey, { 
      operation: 'update', 
      data: newData,
      collectionName,
      documentId 
    });
    
    // Try to update the document in Firestore
    await updateDocument(collectionName, documentId, data);
    
    // If successful, remove the operation from pendingOperations
    pendingOperations.delete(cacheKey);
    Logger.debug(`Document ${documentId} updated successfully`);
    
  } catch (error) {
    const typedError = error as Error;
    Logger.error(`Error updating document ${documentId}:`, typedError);
    
    // Check if retry is possible
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      Logger.info(`Retrying update for ${documentId} (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
      
      // Retry after delay with exponential backoff
      const retryDelay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Recursive retry
      return updateSyncedDocument(collectionName, documentId, data, retryCount + 1);
    } else {
      // If max retries reached, log error but keep in pendingOperations
      Logger.warn(`Max retries reached for updating ${documentId}. Will retry when connection is restored.`);
      
      // When connection is restored, retry pending operations
    }
  }
};

/**
 * Creates a document in Firestore with error handling and retry logic
 * @param collectionName Collection name to create the document in
 * @param data Document data to create
 * @param documentId Optional document ID
 * @param retryCount Current retry attempt (used internally)
 * @returns Promise that resolves with the ID of the created document
 */
export const createSyncedDocument = async (
  collectionName: string,
  data: DocumentData,
  documentId?: string,
  retryCount = 0
): Promise<string> => {
  // Generate a temporary ID if documentId is not provided
  const tempId = documentId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const cacheKey = `${collectionName}_${tempId}`;
  
  try {
    // Update the local cache with the new document
    const newData = { ...data, id: tempId };
    localCache.set(cacheKey, newData);
    
    // Store the operation in pendingOperations
    pendingOperations.set(cacheKey, { 
      operation: 'create', 
      data: newData,
      collectionName,
      documentId: tempId 
    });
    
    // Try to create the document in Firestore
    const createdId = await createDocument(collectionName, data, documentId);
    
    // If ID changed (server generated), update local cache
    if (createdId !== tempId) {
      // Move the cached data to the new ID
      localCache.set(`${collectionName}_${createdId}`, { ...newData, id: createdId });
      localCache.delete(cacheKey);
      
      // Update pending operations
      pendingOperations.delete(cacheKey);
    } else {
      // ID didn't change, just remove from pending operations
      pendingOperations.delete(cacheKey);
    }
    
    Logger.debug(`Document created successfully with ID: ${createdId}`);
    return createdId;
    
  } catch (error) {
    const typedError = error as Error;
    Logger.error(`Error creating document in ${collectionName}:`, typedError);
    
    // Check if retry is possible
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      Logger.info(`Retrying create in ${collectionName} (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
      
      // Retry after delay with exponential backoff
      const retryDelay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Recursive retry
      return createSyncedDocument(collectionName, data, documentId, retryCount + 1);
    } else {
      // If max retries reached, return the temporary ID
      Logger.warn(`Max retries reached for creating document. Will retry when connection is restored.`);
      
      // When connection is restored, retry pending operations
      return tempId;
    }
  }
};

/**
 * Deletes a document from Firestore with error handling and retry logic
 * @param collectionName Collection name containing the document
 * @param documentId ID of the document to delete
 * @param retryCount Current retry attempt (used internally)
 * @returns Promise that resolves when the deletion is complete
 */
export const deleteSyncedDocument = async (
  collectionName: string,
  documentId: string,
  retryCount = 0
): Promise<void> => {
  // Create a cache key by combining collectionName and documentId
  const cacheKey = `${collectionName}_${documentId}`;
  
  try {
    // Remove the document from local cache
    localCache.delete(cacheKey);
    
    // Store the operation in pendingOperations
    pendingOperations.set(cacheKey, { 
      operation: 'delete',
      collectionName,
      documentId 
    });
    
    // Try to delete the document from Firestore
    await deleteDocument(collectionName, documentId);
    
    // If successful, remove the operation from pendingOperations
    pendingOperations.delete(cacheKey);
    Logger.debug(`Document ${documentId} deleted successfully`);
    
  } catch (error) {
    const typedError = error as Error;
    Logger.error(`Error deleting document ${documentId}:`, typedError);
    
    // Check if retry is possible
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      Logger.info(`Retrying delete for ${documentId} (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
      
      // Retry after delay with exponential backoff
      const retryDelay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Recursive retry
      return deleteSyncedDocument(collectionName, documentId, retryCount + 1);
    } else {
      // If max retries reached, log error but keep in pendingOperations
      Logger.warn(`Max retries reached for deleting ${documentId}. Will retry when connection is restored.`);
      
      // When connection is restored, retry pending operations
    }
  }
};

/**
 * Retries all pending operations when connection is restored
 * @returns Promise that resolves when all operations have been retried
 */
export const retryPendingOperations = async (): Promise<void> => {
  if (pendingOperations.size === 0) {
    Logger.debug('No pending operations to retry');
    return;
  }
  
  Logger.info(`Retrying ${pendingOperations.size} pending operations`);
  
  const operations = Array.from(pendingOperations.entries());
  const results = await Promise.allSettled(
    operations.map(async ([cacheKey, operation]) => {
      const { collectionName, documentId, operation: opType, data } = operation;
      
      try {
        Logger.debug(`Retrying ${opType} operation for ${documentId} in ${collectionName}`);
        
        switch (opType) {
          case 'update':
            if (data) {
              await updateDocument(collectionName, documentId, data);
            }
            break;
          case 'create':
            if (data) {
              await createDocument(collectionName, documentId, data);
            }
            break;
          case 'delete':
            await deleteDocument(collectionName, documentId);
            break;
        }
        
        // If successful, remove from pendingOperations
        pendingOperations.delete(cacheKey);
        Logger.debug(`Successfully retried ${opType} for ${documentId}`);
        return { success: true, documentId, operation: opType };
      } catch (error) {
        const typedError = error as Error;
        Logger.error(`Failed to retry ${opType} for ${documentId}:`, typedError);
        return { success: false, documentId, operation: opType, error: typedError };
      }
    })
  );
  
  // Log the results
  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  Logger.info(`Retry results: ${successful.length} succeeded, ${failed.length} failed`);
  
  if (failed.length > 0) {
    Logger.warn('Some operations could not be retried and will remain pending');
  }
};

/**
 * Resolves conflicts between local and remote document versions
 * @param localData Local version of the document
 * @param remoteData Remote version of the document
 * @returns Resolved document data
 */
export const resolveConflict = (
  localData: DocumentData,
  remoteData: DocumentData
): DocumentData => {
  // If one doesn't have timestamps, prefer the one that does
  if (!localData.updatedAt) return remoteData;
  if (!remoteData.updatedAt) return localData;
  
  // Convert Firestore timestamps to milliseconds for comparison
  let localTimestamp: number;
  let remoteTimestamp: number;
  
  if (typeof localData.updatedAt === 'object' && localData.updatedAt.toMillis) {
    localTimestamp = localData.updatedAt.toMillis();
  } else if (localData.updatedAt instanceof Date) {
    localTimestamp = localData.updatedAt.getTime();
  } else {
    localTimestamp = 0;
  }
  
  if (typeof remoteData.updatedAt === 'object' && remoteData.updatedAt.toMillis) {
    remoteTimestamp = remoteData.updatedAt.toMillis();
  } else if (remoteData.updatedAt instanceof Date) {
    remoteTimestamp = remoteData.updatedAt.getTime();
  } else {
    remoteTimestamp = 0;
  }
  
  // If timestamps are equal, merge the data
  // If one is newer, use that as the base
  const base = localTimestamp > remoteTimestamp ? localData : remoteData;
  const other = localTimestamp > remoteTimestamp ? remoteData : localData;
  
  // Start with the newer version
  const resolved = { ...base };
  
  // For fields in the older version that don't exist in the newer version,
  // copy them over
  Object.keys(other).forEach(key => {
    if (key !== 'updatedAt' && key !== 'id' && !(key in resolved)) {
      resolved[key] = other[key];
    }
  });
  
  return resolved;
};

/**
 * Sets up monitoring for connection status to handle offline/online transitions
 * @returns Function to remove event listeners
 */
export const setupConnectionMonitoring = (): (() => void) => {
  const handleOnline = async () => {
    Logger.info('Connection restored, retrying pending operations');
    try {
      await retryPendingOperations();
    } catch (error) {
      Logger.error('Error retrying pending operations:', error);
    }
  };
  
  const handleOffline = () => {
    Logger.info('Connection lost, operations will be queued');
  };
  
  // Set up event listeners for online and offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return a cleanup function to remove event listeners
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Clears the local cache for a specific document or collection
 * @param cacheKey Optional cache key to clear specific entry
 */
export const clearCache = (cacheKey?: string): void => {
  if (cacheKey) {
    // If cacheKey is provided, remove that specific entry from localCache
    localCache.delete(cacheKey);
    Logger.debug(`Cleared cache for key: ${cacheKey}`);
  } else {
    // If cacheKey is not provided, clear the entire localCache
    localCache.clear();
    Logger.debug('Cleared entire cache');
  }
};