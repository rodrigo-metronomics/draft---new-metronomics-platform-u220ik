import { useState, useEffect, useCallback, useRef } from 'react'; // React ^18.2.0
import { Unsubscribe } from 'firebase/firestore'; // Firebase ^9.0.0

import { 
  syncDocument, 
  syncCollection, 
  updateSyncedDocument, 
  createSyncedDocument, 
  deleteSyncedDocument 
} from '../services/realtime/realtimeSync';

import { 
  joinMeeting, 
  leaveMeeting, 
  updateUserPresence, 
  updateTypingStatus, 
  subscribeToMeetingUpdates, 
  subscribeToMeetingStageUpdates, 
  subscribeToActionItemUpdates, 
  subscribeToParticipantUpdates, 
  updateMeetingStatus, 
  updateCurrentStage, 
  updateStageContent, 
  createActionItem, 
  updateActionItem,
  deleteActionItem 
} from '../services/realtime/meetingCollaboration';

import { 
  initializePresence, 
  updatePresence, 
  subscribeToUserPresence, 
  subscribeToOrganizationPresence, 
  updateMeetingPresence, 
  subscribeMeetingPresence, 
  cleanupPresence, 
  isUserActive 
} from '../services/realtime/presenceTracker';

import { FirestoreCollections } from '../types/firebase.types';
import { 
  RealtimeMeeting, 
  RealtimeMeetingStage, 
  MeetingPresence, 
  MeetingStageType, 
  ParticipantStatus 
} from '../types/meeting.types';

import useAuth from './useAuth';

/**
 * Custom hook for real-time data synchronization with Firebase Firestore
 * 
 * This hook provides a generic interface for subscribing to real-time updates
 * from Firestore collections or documents with automatic state management,
 * error handling, and offline support.
 * 
 * @template T - The type of data being synchronized
 * @param {Object} options - Configuration options for the real-time subscription
 * @param {string} options.collectionName - Firestore collection name to sync with
 * @param {string} [options.documentId] - Specific document ID to sync (if omitted, syncs collection)
 * @param {Array} [options.queries] - Array of query constraints to filter collection data
 * @returns {Object} Real-time data state and management functions
 */
export const useRealtime = <T = any>(options: {
  collectionName: string;
  documentId?: string;
  queries?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}) => {
  // State for data, loading status, and error
  const [data, setData] = useState<T | T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for cleanup and mount status tracking
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  // Extract options for clarity
  const { collectionName, documentId, queries = [] } = options;

  /**
   * Updates a document in Firestore
   * @param {string} docId - Document ID to update (defaults to the subscribed document ID)
   * @param {Partial<T>} updates - Partial data to update
   * @returns {Promise<void>}
   */
  const updateData = useCallback(async (docId: string, updates: Partial<T>): Promise<void> => {
    try {
      const targetDocId = docId || documentId;
      if (!targetDocId) {
        throw new Error('Document ID is required for updates');
      }
      
      await updateSyncedDocument(collectionName, targetDocId, updates as any);
    } catch (err) {
      console.error('Error updating document:', err);
      throw err;
    }
  }, [collectionName, documentId]);

  /**
   * Creates a new document in Firestore
   * @param {Partial<T>} data - Document data to create
   * @param {string} [docId] - Optional document ID (if not provided, one will be generated)
   * @returns {Promise<string>} The ID of the created document
   */
  const createData = useCallback(async (data: Partial<T>, docId?: string): Promise<string> => {
    try {
      return await createSyncedDocument(collectionName, data as any, docId);
    } catch (err) {
      console.error('Error creating document:', err);
      throw err;
    }
  }, [collectionName]);

  /**
   * Deletes a document from Firestore
   * @param {string} docId - Document ID to delete
   * @returns {Promise<void>}
   */
  const deleteData = useCallback(async (docId: string): Promise<void> => {
    try {
      await deleteSyncedDocument(collectionName, docId);
    } catch (err) {
      console.error('Error deleting document:', err);
      throw err;
    }
  }, [collectionName]);

  // Effect to subscribe to Firestore data
  useEffect(() => {
    // Function to handle data updates
    const handleData = (newData: any) => {
      if (isMountedRef.current) {
        setData(newData);
        setLoading(false);
      }
    };
    
    // Function to handle errors
    const handleError = (err: Error) => {
      if (isMountedRef.current) {
        console.error(`Firestore sync error for ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    };
    
    // Clean up any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Set loading to true when subscription changes
    setLoading(true);
    
    try {
      // Subscribe to a specific document if documentId is provided
      if (documentId) {
        unsubscribeRef.current = syncDocument(
          collectionName,
          documentId,
          handleData,
          handleError
        );
      } 
      // Otherwise, subscribe to a collection with optional queries
      else {
        unsubscribeRef.current = syncCollection(
          collectionName,
          queries,
          handleData,
          handleError,
          {
            orderBy: options.orderBy,
            limit: options.limit
          }
        );
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during subscription');
      console.error('Error setting up Firestore subscription:', error);
      setError(error);
      setLoading(false);
    }
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [collectionName, documentId, JSON.stringify(queries), options.orderBy, options.limit]);

  return {
    data,
    loading,
    error,
    updateData,
    createData,
    deleteData
  };
};

/**
 * Custom hook for real-time synchronization of meeting data
 * 
 * Provides real-time updates for a specific meeting, including its status,
 * current stage, and other properties with automatic state management.
 * 
 * @param {string} meetingId - ID of the meeting to synchronize
 * @param {string} organizationId - ID of the organization the meeting belongs to
 * @returns {Object} Meeting data state and update function
 */
export const useMeetingRealtime = (meetingId: string, organizationId: string) => {
  const { user } = useAuth().state;
  
  // Create queries to filter by meetingId and organizationId
  const queries = [
    {
      field: 'id',
      operator: '==',
      value: meetingId
    },
    {
      field: 'organizationId',
      operator: '==',
      value: organizationId
    }
  ];
  
  // Use the generic useRealtime hook with meeting-specific configuration
  const { 
    data: meetingData, 
    loading, 
    error, 
    updateData 
  } = useRealtime<RealtimeMeeting>({
    collectionName: FirestoreCollections.ACTIVE_MEETINGS,
    documentId: meetingId,
    queries
  });
  
  /**
   * Updates properties of the meeting
   * @param {Partial<RealtimeMeeting>} updates - Partial meeting data to update
   * @returns {Promise<void>}
   */
  const updateMeeting = useCallback(async (updates: Partial<RealtimeMeeting>): Promise<void> => {
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    
    try {
      await updateData(meetingId, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error('Error updating meeting:', err);
      throw err;
    }
  }, [meetingId, updateData, user]);
  
  return {
    meeting: meetingData as RealtimeMeeting | null,
    loading,
    error,
    updateMeeting
  };
};

/**
 * Custom hook for real-time synchronization of meeting stages
 * 
 * Provides real-time updates for all stages of a specific meeting,
 * with functionality to update existing stages or create new ones.
 * 
 * @param {string} meetingId - ID of the meeting to get stages for
 * @returns {Object} Meeting stages data state and management functions
 */
export const useMeetingStagesRealtime = (meetingId: string) => {
  const { user } = useAuth().state;
  
  // Create query to filter by meetingId
  const queries = [
    {
      field: 'meetingId',
      operator: '==',
      value: meetingId
    }
  ];
  
  // Use the generic useRealtime hook with meeting stages configuration
  const { 
    data: stagesData, 
    loading, 
    error, 
    updateData, 
    createData 
  } = useRealtime<RealtimeMeetingStage[]>({
    collectionName: FirestoreCollections.MEETING_STAGES,
    queries,
    orderBy: {
      field: 'sequence',
      direction: 'asc'
    }
  });
  
  /**
   * Updates the content of a specific meeting stage
   * @param {string} stageId - ID of the stage to update
   * @param {string} content - New content for the stage
   * @returns {Promise<void>}
   */
  const updateStage = useCallback(async (stageId: string, content: string): Promise<void> => {
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    
    try {
      await updateData(stageId, {
        content,
        updatedAt: new Date(),
        updatedBy: user.id
      });
    } catch (err) {
      console.error('Error updating stage:', err);
      throw err;
    }
  }, [updateData, user]);
  
  /**
   * Creates a new meeting stage
   * @param {MeetingStageType} stageType - Type of stage to create
   * @param {number} sequence - Sequence order of the stage
   * @returns {Promise<string>} ID of the created stage
   */
  const createStage = useCallback(async (
    stageType: MeetingStageType, 
    sequence: number
  ): Promise<string> => {
    if (!user) {
      console.error('No authenticated user found');
      return '';
    }
    
    try {
      return await createData({
        meetingId,
        stageType,
        content: '',
        sequence,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id
      } as Partial<RealtimeMeetingStage>);
    } catch (err) {
      console.error('Error creating stage:', err);
      throw err;
    }
  }, [createData, meetingId, user]);
  
  return {
    stages: stagesData || [],
    loading,
    error,
    updateStage,
    createStage
  };
};

/**
 * Custom hook for real-time synchronization of action items
 * 
 * Provides real-time updates for action items associated with a specific meeting,
 * with functionality to create, update, and delete action items.
 * 
 * @param {string} meetingId - ID of the meeting to get action items for
 * @returns {Object} Action items data state and management functions
 */
export const useActionItemsRealtime = (meetingId: string) => {
  const { user } = useAuth().state;
  
  // Create query to filter by meetingId
  const queries = [
    {
      field: 'meetingId',
      operator: '==',
      value: meetingId
    }
  ];
  
  // Use the generic useRealtime hook with action items configuration
  const { 
    data: actionItemsData, 
    loading, 
    error, 
    updateData, 
    createData, 
    deleteData 
  } = useRealtime({
    collectionName: FirestoreCollections.ACTION_ITEMS,
    queries,
    orderBy: {
      field: 'createdAt',
      direction: 'desc'
    }
  });
  
  /**
   * Updates an existing action item
   * @param {string} actionItemId - ID of the action item to update
   * @param {Partial<any>} updates - Partial action item data to update
   * @returns {Promise<void>}
   */
  const updateActionItem = useCallback(async (
    actionItemId: string, 
    updates: Partial<any>
  ): Promise<void> => {
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    
    try {
      await updateData(actionItemId, {
        ...updates,
        updatedAt: new Date(),
        updatedBy: user.id
      });
    } catch (err) {
      console.error('Error updating action item:', err);
      throw err;
    }
  }, [updateData, user]);
  
  /**
   * Creates a new action item
   * @param {Partial<any>} actionItem - Action item data to create
   * @returns {Promise<string>} ID of the created action item
   */
  const createActionItemInMeeting = useCallback(async (actionItem: Partial<any>): Promise<string> => {
    if (!user) {
      console.error('No authenticated user found');
      return '';
    }
    
    try {
      return await createData({
        ...actionItem,
        meetingId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id
      });
    } catch (err) {
      console.error('Error creating action item:', err);
      throw err;
    }
  }, [createData, meetingId, user]);
  
  /**
   * Deletes an action item
   * @param {string} actionItemId - ID of the action item to delete
   * @returns {Promise<void>}
   */
  const deleteActionItemFromMeeting = useCallback(async (actionItemId: string): Promise<void> => {
    try {
      await deleteData(actionItemId);
    } catch (err) {
      console.error('Error deleting action item:', err);
      throw err;
    }
  }, [deleteData]);
  
  return {
    actionItems: actionItemsData || [],
    loading,
    error,
    updateActionItem,
    createActionItem: createActionItemInMeeting,
    deleteActionItem: deleteActionItemFromMeeting
  };
};

/**
 * Custom hook for real-time tracking of participant presence in meetings
 * 
 * Provides real-time updates on who is currently active in a meeting,
 * with functionality to update presence status and typing indicators.
 * Automatically handles joining and leaving the meeting.
 * 
 * @param {string} meetingId - ID of the meeting to track participants for
 * @param {string} userId - ID of the current user
 * @returns {Object} Participants data state and presence management functions
 */
export const usePresenceTracking = (meetingId: string, userId: string) => {
  const { user } = useAuth().state;
  
  // Create query to filter by meetingId
  const queries = [
    {
      field: 'meetingId',
      operator: '==',
      value: meetingId
    }
  ];
  
  // Use the generic useRealtime hook with user presence configuration
  const { 
    data: participantsData, 
    loading, 
    error 
  } = useRealtime<MeetingPresence[]>({
    collectionName: FirestoreCollections.USER_PRESENCE,
    queries
  });
  
  /**
   * Updates the user's presence status in the meeting
   * @param {ParticipantStatus} status - New presence status
   * @returns {Promise<void>}
   */
  const updatePresence = useCallback(async (status: ParticipantStatus): Promise<void> => {
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    
    try {
      await updateUserPresence(meetingId, userId, status);
    } catch (err) {
      console.error('Error updating presence:', err);
      throw err;
    }
  }, [meetingId, userId, user]);
  
  /**
   * Updates the user's typing status in the meeting
   * @param {boolean} isTyping - Whether the user is currently typing
   * @returns {Promise<void>}
   */
  const setTypingStatus = useCallback(async (isTyping: boolean): Promise<void> => {
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    
    try {
      await updateTypingStatus(meetingId, userId, isTyping);
    } catch (err) {
      console.error('Error updating typing status:', err);
      throw err;
    }
  }, [meetingId, userId, user]);
  
  // Effect to join meeting when component mounts
  useEffect(() => {
    if (!user || !meetingId || !userId) return;
    
    const handleJoinMeeting = async () => {
      try {
        await joinMeeting(meetingId, userId, 'participant');
        console.log(`Joined meeting ${meetingId}`);
      } catch (err) {
        console.error('Error joining meeting:', err);
      }
    };
    
    handleJoinMeeting();
    
    // Clean up by leaving meeting when component unmounts
    return () => {
      const handleLeaveMeeting = async () => {
        try {
          await leaveMeeting(meetingId, userId);
          console.log(`Left meeting ${meetingId}`);
        } catch (err) {
          console.error('Error leaving meeting:', err);
        }
      };
      
      handleLeaveMeeting();
    };
  }, [meetingId, userId, user]);
  
  return {
    participants: participantsData || [],
    loading,
    error,
    updatePresence,
    setTypingStatus
  };
};