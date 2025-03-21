import { firebase } from './firebaseConfig';
import { 
  FirestoreCollections, 
  FirestoreDocument, 
  FirestoreQuery, 
  FirestoreQueryOptions,
  FirestoreConverter
} from '../../types/firebase.types';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction as firestoreRunTransaction,
  DocumentData,
  QueryDocumentSnapshot,
  CollectionReference,
  DocumentReference,
  Query,
  WhereFilterOp,
  OrderByDirection,
  Transaction
} from 'firebase/firestore'; // Firebase v9.0.0

// Type for unsubscribe function returned by onSnapshot
type Unsubscribe = () => void;

/**
 * Retrieves a document from Firestore by ID
 * @param collectionName Collection to retrieve the document from
 * @param documentId ID of the document to retrieve
 * @returns Promise that resolves to the document data or null if not found
 */
export const getDocument = async (
  collectionName: string,
  documentId: string
): Promise<DocumentData | null> => {
  try {
    const docRef = doc(firebase.firestore, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Retrieves multiple documents from Firestore with optional query constraints
 * @param collectionName Collection to retrieve documents from
 * @param queries Array of query constraints to apply
 * @param options Query options for ordering, pagination, and limits
 * @returns Promise that resolves to an array of document data
 */
export const getDocuments = async (
  collectionName: string,
  queries: FirestoreQuery[] = [],
  options?: FirestoreQueryOptions
): Promise<DocumentData[]> => {
  try {
    const collectionRef = collection(firebase.firestore, collectionName);
    
    // Start building the query with the collection reference
    let queryRef: Query = collectionRef;
    
    // Apply query constraints if provided
    if (queries && queries.length > 0) {
      queries.forEach((q) => {
        queryRef = query(queryRef, where(q.field, q.operator, q.value));
      });
    }
    
    // Apply ordering, pagination, and limits if specified in options
    if (options) {
      if (options.orderBy) {
        queryRef = query(
          queryRef, 
          orderBy(options.orderBy.field, options.orderBy.direction)
        );
      }
      
      if (options.startAfter) {
        queryRef = query(queryRef, startAfter(options.startAfter));
      }
      
      if (options.limit) {
        queryRef = query(queryRef, limit(options.limit));
      }
    }
    
    // Execute the query
    const querySnapshot = await getDocs(queryRef);
    
    // Transform the query snapshot into an array of documents
    const documents: DocumentData[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Creates a new document in Firestore
 * @param collectionName Collection to create the document in
 * @param data Document data to create
 * @param documentId Optional document ID, if not provided, a new ID will be generated
 * @returns Promise that resolves to the ID of the created document
 */
export const createDocument = async (
  collectionName: string,
  data: DocumentData,
  documentId?: string
): Promise<string> => {
  try {
    const collectionRef = collection(firebase.firestore, collectionName);
    let docRef: DocumentReference;
    
    if (documentId) {
      docRef = doc(collectionRef, documentId);
    } else {
      docRef = doc(collectionRef);
    }
    
    // Add timestamps
    const timestampedData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(docRef, timestampedData);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Updates an existing document in Firestore
 * @param collectionName Collection containing the document
 * @param documentId ID of the document to update
 * @param data Document data to update
 * @returns Promise that resolves when the update is complete
 */
export const updateDocument = async (
  collectionName: string,
  documentId: string,
  data: DocumentData
): Promise<void> => {
  try {
    const docRef = doc(firebase.firestore, collectionName, documentId);
    
    // Add updatedAt timestamp
    const timestampedData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, timestampedData);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Deletes a document from Firestore
 * @param collectionName Collection containing the document
 * @param documentId ID of the document to delete
 * @returns Promise that resolves when the deletion is complete
 */
export const deleteDocument = async (
  collectionName: string,
  documentId: string
): Promise<void> => {
  try {
    const docRef = doc(firebase.firestore, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Sets up a real-time listener for a specific document
 * @param collectionName Collection containing the document
 * @param documentId ID of the document to listen to
 * @param onData Callback function to handle document updates
 * @param onError Callback function to handle errors
 * @returns Function to unsubscribe from the real-time updates
 */
export const subscribeToDocument = (
  collectionName: string,
  documentId: string,
  onData: (data: DocumentData | null) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const docRef = doc(firebase.firestore, collectionName, documentId);
  
  return onSnapshot(
    docRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        onData({ id: docSnapshot.id, ...docSnapshot.data() });
      } else {
        onData(null);
      }
    },
    onError
  );
};

/**
 * Sets up a real-time listener for a collection with optional query constraints
 * @param collectionName Collection to listen to
 * @param queries Array of query constraints to apply
 * @param onData Callback function to handle collection updates
 * @param onError Callback function to handle errors
 * @param options Query options for ordering, pagination, and limits
 * @returns Function to unsubscribe from the real-time updates
 */
export const subscribeToCollection = (
  collectionName: string,
  queries: FirestoreQuery[] = [],
  onData: (data: DocumentData[]) => void,
  onError: (error: Error) => void,
  options?: FirestoreQueryOptions
): Unsubscribe => {
  const collectionRef = collection(firebase.firestore, collectionName);
  
  // Start building the query with the collection reference
  let queryRef: Query = collectionRef;
  
  // Apply query constraints if provided
  if (queries && queries.length > 0) {
    queries.forEach((q) => {
      queryRef = query(queryRef, where(q.field, q.operator, q.value));
    });
  }
  
  // Apply ordering, limits, and pagination if provided in options
  if (options) {
    if (options.orderBy) {
      queryRef = query(
        queryRef, 
        orderBy(options.orderBy.field, options.orderBy.direction)
      );
    }
    
    if (options.startAfter) {
      queryRef = query(queryRef, startAfter(options.startAfter));
    }
    
    if (options.limit) {
      queryRef = query(queryRef, limit(options.limit));
    }
  }
  
  return onSnapshot(
    queryRef,
    (querySnapshot) => {
      const documents: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      onData(documents);
    },
    onError
  );
};

/**
 * Performs multiple write operations as a single batch
 * @param operations Array of batch operations to perform
 * @returns Promise that resolves when the batch operation is complete
 */
export const batchWrite = async (
  operations: Array<{
    operation: 'create' | 'update' | 'delete';
    collectionName: string;
    documentId?: string;
    data?: DocumentData;
  }>
): Promise<void> => {
  try {
    const batch = writeBatch(firebase.firestore);
    
    for (const op of operations) {
      const { operation, collectionName, documentId, data } = op;
      
      if (operation === 'delete') {
        if (!documentId) {
          throw new Error('Document ID is required for delete operations');
        }
        
        const docRef = doc(firebase.firestore, collectionName, documentId);
        batch.delete(docRef);
      } else if (operation === 'create' || operation === 'update') {
        if (!data) {
          throw new Error('Data is required for create and update operations');
        }
        
        const collectionRef = collection(firebase.firestore, collectionName);
        let docRef: DocumentReference;
        
        if (documentId) {
          docRef = doc(collectionRef, documentId);
        } else {
          docRef = doc(collectionRef);
        }
        
        if (operation === 'create') {
          // Add timestamps for create operations
          const timestampedData = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          batch.set(docRef, timestampedData, { merge: false });
        } else {
          // Add updatedAt timestamp for update operations
          const timestampedData = {
            ...data,
            updatedAt: serverTimestamp()
          };
          
          batch.update(docRef, timestampedData);
        }
      }
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error performing batch write:', error);
    throw error;
  }
};

/**
 * Executes a transaction that can read and write data atomically
 * @param transactionHandler Function that performs the transaction operations
 * @returns Promise that resolves with the result of the transaction
 */
export const runTransaction = async <T>(
  transactionHandler: (transaction: Transaction) => Promise<T>
): Promise<T> => {
  try {
    return await firestoreRunTransaction(firebase.firestore, transactionHandler);
  } catch (error) {
    console.error('Error running transaction:', error);
    throw error;
  }
};

/**
 * Creates a Firestore converter for a specific data type
 * @param toFirestore Function to convert the data type to Firestore data
 * @param fromFirestore Function to convert Firestore data to the data type
 * @returns Firestore converter object with toFirestore and fromFirestore methods
 */
export const createConverter = <T>(
  toFirestore: (data: T) => DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>) => T
): FirestoreConverter<T> => {
  return {
    toFirestore,
    fromFirestore
  };
};

/**
 * Converts a Firestore Timestamp to a JavaScript Date
 * @param timestamp Firestore Timestamp to convert
 * @returns JavaScript Date object or null if the timestamp is null or undefined
 */
export const timestampToDate = (
  timestamp: Timestamp | null | undefined
): Date | null => {
  if (!timestamp) {
    return null;
  }
  
  return timestamp.toDate();
};

/**
 * Converts a JavaScript Date to a Firestore Timestamp
 * @param date JavaScript Date to convert
 * @returns Firestore Timestamp or null if the date is null or undefined
 */
export const dateToTimestamp = (
  date: Date | null | undefined
): Timestamp | null => {
  if (!date) {
    return null;
  }
  
  return Timestamp.fromDate(date);
};

/**
 * Gets a server timestamp for document operations
 * @returns Server timestamp field value
 */
export const getServerTimestamp = (): any => {
  return serverTimestamp();
};

/**
 * Sets up a real-time listener for a specific meeting
 * @param meetingId ID of the meeting to listen to
 * @param onData Callback function to handle meeting updates
 * @param onError Callback function to handle errors
 * @returns Function to unsubscribe from the real-time updates
 */
export const subscribeToMeeting = (
  meetingId: string,
  onData: (data: DocumentData | null) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  return subscribeToDocument(
    FirestoreCollections.ACTIVE_MEETINGS,
    meetingId,
    onData,
    onError
  );
};

/**
 * Sets up a real-time listener for meeting stages
 * @param meetingId ID of the meeting to get stages for
 * @param onData Callback function to handle stage updates
 * @param onError Callback function to handle errors
 * @returns Function to unsubscribe from the real-time updates
 */
export const subscribeToMeetingStages = (
  meetingId: string,
  onData: (data: DocumentData[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const queries: FirestoreQuery[] = [
    {
      field: 'meetingId',
      operator: '==',
      value: meetingId
    }
  ];
  
  return subscribeToCollection(
    FirestoreCollections.MEETING_STAGES,
    queries,
    onData,
    onError
  );
};

/**
 * Sets up a real-time listener for meeting action items
 * @param meetingId ID of the meeting to get action items for
 * @param onData Callback function to handle action item updates
 * @param onError Callback function to handle errors
 * @returns Function to unsubscribe from the real-time updates
 */
export const subscribeToActionItems = (
  meetingId: string,
  onData: (data: DocumentData[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const queries: FirestoreQuery[] = [
    {
      field: 'meetingId',
      operator: '==',
      value: meetingId
    }
  ];
  
  return subscribeToCollection(
    FirestoreCollections.ACTION_ITEMS,
    queries,
    onData,
    onError
  );
};

/**
 * Updates the presence status of a user in a meeting
 * @param meetingId ID of the meeting
 * @param userId ID of the user
 * @param status Status of the user (e.g., 'online', 'away')
 * @param isTyping Whether the user is currently typing
 * @returns Promise that resolves when the presence has been updated
 */
export const updateMeetingPresence = async (
  meetingId: string,
  userId: string,
  status: string,
  isTyping: boolean
): Promise<void> => {
  try {
    const presenceId = `${meetingId}_${userId}`;
    const presenceData = {
      meetingId,
      userId,
      status,
      isTyping,
      lastActive: getServerTimestamp()
    };
    
    await updateDocument(
      FirestoreCollections.USER_PRESENCE,
      presenceId,
      presenceData
    );
  } catch (error) {
    console.error('Error updating meeting presence:', error);
    throw error;
  }
};