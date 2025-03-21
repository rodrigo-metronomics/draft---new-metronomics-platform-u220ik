import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Unsubscribe } from 'firebase/firestore'; // v9.0.0

// Import core real-time synchronization functions
import { 
  syncDocument, 
  syncCollection, 
  updateSyncedDocument, 
  createSyncedDocument, 
  deleteSyncedDocument 
} from '../services/realtime/realtimeSync';

// Import meeting collaboration functions
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
  deleteActionItem, 
  startMeeting, 
  endMeeting, 
  pauseMeeting, 
  resumeMeeting 
} from '../services/realtime/meetingCollaboration';

// Import presence tracking functions
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

// Import Firebase type definitions
import { 
  FirestoreCollections, 
  FirebaseRealtimeOptions, 
  FirestoreQuery 
} from '../types/firebase.types';

// Import meeting and action item type definitions
import { 
  RealtimeMeeting, 
  RealtimeMeetingStage, 
  MeetingPresence, 
  MeetingStageType, 
  ParticipantStatus, 
  ActionItem, 
  ActionItemStatus, 
  ActionItemPriority, 
  MeetingStatus 
} from '../types/meeting.types';

// Access authentication state and user information
import { useAuthContext } from './AuthContext';

// Global constants for configuration
const PRESENCE_UPDATE_INTERVAL = 60000; // Update presence every 60 seconds
const CONNECTION_ERROR_RETRY_LIMIT = 5; // Maximum number of retry attempts for connection errors

// Interface for tracking the real-time connection state
interface ConnectionState {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastConnected: Date | null;
  retryCount: number;
}

// Interface for the real-time context values and methods
interface RealtimeContextType {
  // Connection state
  connectionState: ConnectionState;
  error: Error | null;
  
  // Core document sync methods
  syncDocument: (collectionName: string, documentId: string, onData: (data: any | null) => void, onError: (error: Error) => void) => Unsubscribe;
  syncCollection: (collectionName: string, queries?: FirestoreQuery[], onData: (data: any[]) => void, onError: (error: Error) => void, options?: any) => Unsubscribe;
  updateDocument: (collectionName: string, documentId: string, data: any) => Promise<void>;
  createDocument: (collectionName: string, data: any, documentId?: string) => Promise<string>;
  deleteDocument: (collectionName: string, documentId: string) => Promise<void>;
  
  // Meeting collaboration methods
  joinMeeting: (meetingId: string, userId: string, displayName: string, role: string) => Promise<void>;
  leaveMeeting: (meetingId: string, userId: string) => Promise<void>;
  updateUserPresence: (meetingId: string, userId: string, status: ParticipantStatus) => Promise<void>;
  updateTypingStatus: (meetingId: string, userId: string, isTyping: boolean) => Promise<void>;
  subscribeToMeeting: (meetingId: string, onMeetingUpdate: (meeting: RealtimeMeeting | null) => void, onError: (error: Error) => void) => Unsubscribe;
  subscribeToMeetingStages: (meetingId: string, onStagesUpdate: (stages: RealtimeMeetingStage[]) => void, onError: (error: Error) => void) => Unsubscribe;
  subscribeToActionItems: (meetingId: string, onActionItemsUpdate: (actionItems: ActionItem[]) => void, onError: (error: Error) => void) => Unsubscribe;
  subscribeToParticipants: (meetingId: string, onParticipantsUpdate: (participants: MeetingPresence[]) => void, onError: (error: Error) => void) => Unsubscribe;
  updateMeetingStatus: (meetingId: string, status: MeetingStatus, userId: string) => Promise<void>;
  updateCurrentStage: (meetingId: string, stageType: MeetingStageType, userId: string) => Promise<void>;
  updateStageContent: (meetingId: string, stageId: string, content: string, userId: string) => Promise<void>;
  createActionItem: (meetingId: string, actionItem: Partial<ActionItem>, userId: string) => Promise<string>;
  updateActionItem: (actionItemId: string, updates: Partial<ActionItem>, userId: string) => Promise<void>;
  deleteActionItem: (actionItemId: string) => Promise<void>;
  startMeeting: (meetingId: string, userId: string) => Promise<void>;
  endMeeting: (meetingId: string, userId: string) => Promise<void>;
  pauseMeeting: (meetingId: string, userId: string) => Promise<void>;
  resumeMeeting: (meetingId: string, userId: string) => Promise<void>;
  
  // Presence tracking methods
  subscribeToUserPresence: (userId: string, onPresenceChange: (presence: any) => void, onError: (error: Error) => void) => Unsubscribe;
  subscribeToOrganizationPresence: (organizationId: string, onPresenceChange: (presences: any[]) => void, onError: (error: Error) => void) => Unsubscribe;
  isUserActive: (presence: any) => boolean;
}

// Create the React context with null as the default value
const RealtimeContext = createContext<RealtimeContextType | null>(null);

/**
 * React context provider component that manages real-time state and provides real-time methods
 */
const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get authentication state from AuthContext
  const { state: authState } = useAuthContext();
  
  // State for connection status and errors
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastConnected: null,
    retryCount: 0
  });
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for interval cleanup
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Effect hook that initializes presence tracking when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      // Initialize presence for the current user
      initializePresence(authState.user.id, authState.user.organizationId)
        .catch(err => {
          console.error('Failed to initialize presence:', err);
          setError(err instanceof Error ? err : new Error('Failed to initialize presence'));
        });
      
      // Set up interval to update presence periodically
      presenceIntervalRef.current = setInterval(() => {
        if (authState.user) {
          updatePresence(authState.user.id, 'online')
            .catch(err => {
              console.error('Failed to update presence:', err);
            });
        }
      }, PRESENCE_UPDATE_INTERVAL);
      
      // Set connection state to connected
      setConnectionState({
        status: 'connected',
        lastConnected: new Date(),
        retryCount: 0
      });
    }
    
    // Cleanup function to clear interval and presence data
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      
      if (authState.user) {
        cleanupPresence(authState.user.id)
          .catch(err => {
            console.error('Failed to cleanup presence:', err);
          });
      }
    };
  }, [authState.isAuthenticated, authState.user]);
  
  // Effect hook that monitors online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionState(prev => ({
        ...prev,
        status: 'connected',
        lastConnected: new Date(),
        retryCount: 0
      }));
    };
    
    const handleOffline = () => {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected'
      }));
    };
    
    // Add event listeners for online and offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status based on navigator.onLine
    setConnectionState(prev => ({
      ...prev,
      status: navigator.onLine ? 'connected' : 'disconnected'
    }));
    
    // Cleanup function to remove event listeners when component unmounts
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Implement wrapper functions for all real-time operations with error handling
  
  // Synchronizes a document between the client and Firestore with error handling
  const syncDocumentWithErrorHandling = useCallback(
    (collectionName: string, documentId: string, onData: (data: any | null) => void, onError: (error: Error) => void): Unsubscribe => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          onError(new Error('Connection error: Max retry limit reached'));
          return () => {};
        }
        
        // Call syncDocument from realtimeSync service
        return syncDocument(
          collectionName,
          documentId,
          onData,
          (error) => {
            // Handle any errors by updating the error state and connection state
            setError(error);
            setConnectionState(prev => ({
              ...prev,
              status: 'error',
              retryCount: prev.retryCount + 1
            }));
            onError(error);
          }
        );
      } catch (error) {
        // Handle any unexpected errors
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        onError(typedError);
        return () => {};
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Synchronizes a collection between the client and Firestore with error handling
  const syncCollectionWithErrorHandling = useCallback(
    (collectionName: string, queries: FirestoreQuery[] = [], onData: (data: any[]) => void, onError: (error: Error) => void, options?: FirebaseRealtimeOptions): Unsubscribe => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          onError(new Error('Connection error: Max retry limit reached'));
          return () => {};
        }
        
        // Call syncCollection from realtimeSync service
        return syncCollection(
          collectionName,
          queries,
          onData,
          (error) => {
            // Handle any errors by updating the error state and connection state
            setError(error);
            setConnectionState(prev => ({
              ...prev,
              status: 'error',
              retryCount: prev.retryCount + 1
            }));
            onError(error);
          },
          options
        );
      } catch (error) {
        // Handle any unexpected errors
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        onError(typedError);
        return () => {};
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Updates a document in Firestore with error handling
  const updateDocumentWithErrorHandling = useCallback(
    async (collectionName: string, documentId: string, data: any): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call updateSyncedDocument from realtimeSync service
        await updateSyncedDocument(collectionName, documentId, data);
      } catch (error) {
        // Handle any errors by updating the error state and connection state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Creates a document in Firestore with error handling
  const createDocumentWithErrorHandling = useCallback(
    async (collectionName: string, data: any, documentId?: string): Promise<string> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call createSyncedDocument from realtimeSync service
        return await createSyncedDocument(collectionName, data, documentId);
      } catch (error) {
        // Handle any errors by updating the error state and connection state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Deletes a document from Firestore with error handling
  const deleteDocumentWithErrorHandling = useCallback(
    async (collectionName: string, documentId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call deleteSyncedDocument from realtimeSync service
        await deleteSyncedDocument(collectionName, documentId);
      } catch (error) {
        // Handle any errors by updating the error state and connection state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Joins a user to a meeting and sets up real-time presence
  const joinMeetingWithErrorHandling = useCallback(
    async (meetingId: string, userId: string, displayName: string, role: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call joinMeeting from meetingCollaboration service
        await joinMeeting(meetingId, userId, role as any);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Removes a user from a meeting and cleans up presence data
  const leaveMeetingWithErrorHandling = useCallback(
    async (meetingId: string, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call leaveMeeting from meetingCollaboration service
        await leaveMeeting(meetingId, userId);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Updates a user's presence status in a meeting
  const updateUserPresenceWithErrorHandling = useCallback(
    async (meetingId: string, userId: string, status: ParticipantStatus): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call updateUserPresence from meetingCollaboration service
        await updateUserPresence(meetingId, userId, status);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Updates a user's typing status in a meeting
  const updateTypingStatusWithErrorHandling = useCallback(
    async (meetingId: string, userId: string, isTyping: boolean): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call updateTypingStatus from meetingCollaboration service
        await updateTypingStatus(meetingId, userId, isTyping);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Sets up a subscription to real-time meeting updates
  const subscribeToMeetingWithErrorHandling = useCallback(
    (meetingId: string, onMeetingUpdate: (meeting: RealtimeMeeting | null) => void, onError: (error: Error) => void): Unsubscribe => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          onError(new Error('Connection error: Max retry limit reached'));
          return () => {};
        }
        
        // Call subscribeToMeetingUpdates from meetingCollaboration service
        return subscribeToMeetingUpdates(
          meetingId,
          onMeetingUpdate,
          (error) => {
            // Handle any errors by updating the error state and connection state
            setError(error);
            setConnectionState(prev => ({
              ...prev,
              status: 'error',
              retryCount: prev.retryCount + 1
            }));
            onError(error);
          }
        );
      } catch (error) {
        // Handle any unexpected errors
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        onError(typedError);
        return () => {};
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Sets up a subscription to real-time meeting stage updates
  const subscribeToMeetingStagesWithErrorHandling = useCallback(
    (meetingId: string, onStagesUpdate: (stages: RealtimeMeetingStage[]) => void, onError: (error: Error) => void): Unsubscribe => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          onError(new Error('Connection error: Max retry limit reached'));
          return () => {};
        }
        
        // Call subscribeToMeetingStageUpdates from meetingCollaboration service
        return subscribeToMeetingStageUpdates(
          meetingId,
          onStagesUpdate,
          (error) => {
            // Handle any errors by updating the error state and connection state
            setError(error);
            setConnectionState(prev => ({
              ...prev,
              status: 'error',
              retryCount: prev.retryCount + 1
            }));
            onError(error);
          }
        );
      } catch (error) {
        // Handle any unexpected errors
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        onError(typedError);
        return () => {};
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Sets up a subscription to real-time action item updates
  const subscribeToActionItemsWithErrorHandling = useCallback(
    (meetingId: string, onActionItemsUpdate: (actionItems: ActionItem[]) => void, onError: (error: Error) => void): Unsubscribe => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          onError(new Error('Connection error: Max retry limit reached'));
          return () => {};
        }
        
        // Call subscribeToActionItemUpdates from meetingCollaboration service
        return subscribeToActionItemUpdates(
          meetingId,
          onActionItemsUpdate,
          (error) => {
            // Handle any errors by updating the error state and connection state
            setError(error);
            setConnectionState(prev => ({
              ...prev,
              status: 'error',
              retryCount: prev.retryCount + 1
            }));
            onError(error);
          }
        );
      } catch (error) {
        // Handle any unexpected errors
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        onError(typedError);
        return () => {};
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Sets up a subscription to real-time participant presence updates
  const subscribeToParticipantsWithErrorHandling = useCallback(
    (meetingId: string, onParticipantsUpdate: (participants: MeetingPresence[]) => void, onError: (error: Error) => void): Unsubscribe => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          onError(new Error('Connection error: Max retry limit reached'));
          return () => {};
        }
        
        // Call subscribeToParticipantUpdates from meetingCollaboration service
        return subscribeToParticipantUpdates(
          meetingId,
          onParticipantsUpdate,
          (error) => {
            // Handle any errors by updating the error state and connection state
            setError(error);
            setConnectionState(prev => ({
              ...prev,
              status: 'error',
              retryCount: prev.retryCount + 1
            }));
            onError(error);
          }
        );
      } catch (error) {
        // Handle any unexpected errors
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        onError(typedError);
        return () => {};
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Updates the status of a meeting
  const updateMeetingStatusWithErrorHandling = useCallback(
    async (meetingId: string, status: MeetingStatus, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call updateMeetingStatus from meetingCollaboration service
        await updateMeetingStatus(meetingId, status);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Updates the current stage of a meeting
  const updateCurrentStageWithErrorHandling = useCallback(
    async (meetingId: string, stageType: MeetingStageType, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call updateCurrentStage from meetingCollaboration service
        await updateCurrentStage(meetingId, stageType);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Updates the content of a specific meeting stage
  const updateStageContentWithErrorHandling = useCallback(
    async (meetingId: string, stageId: string, content: string, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call updateStageContent from meetingCollaboration service
        await updateStageContent(meetingId, stageId, content);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Creates a new action item in a meeting
  const createActionItemWithErrorHandling = useCallback(
    async (meetingId: string, actionItem: Partial<ActionItem>, userId: string): Promise<string> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call createActionItem from meetingCollaboration service
        return await createActionItem(meetingId, actionItem);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Updates an existing action item
  const updateActionItemWithErrorHandling = useCallback(
    async (actionItemId: string, updates: Partial<ActionItem>, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call updateActionItem from meetingCollaboration service
        await updateActionItem(actionItemId, updates);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Deletes an action item from a meeting
  const deleteActionItemWithErrorHandling = useCallback(
    async (actionItemId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call deleteActionItem from meetingCollaboration service
        await deleteActionItem(actionItemId);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Starts a meeting by updating its status and initializing real-time collaboration
  const startMeetingWithErrorHandling = useCallback(
    async (meetingId: string, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call startMeeting from meetingCollaboration service
        await startMeeting(meetingId);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Ends a meeting by updating its status and finalizing data
  const endMeetingWithErrorHandling = useCallback(
    async (meetingId: string, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call endMeeting from meetingCollaboration service
        await endMeeting(meetingId);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Pauses a meeting by updating its status
  const pauseMeetingWithErrorHandling = useCallback(
    async (meetingId: string, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call pauseMeeting from meetingCollaboration service
        await pauseMeeting(meetingId);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Resumes a paused meeting by updating its status
  const resumeMeetingWithErrorHandling = useCallback(
    async (meetingId: string, userId: string): Promise<void> => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          throw new Error('Connection error: Max retry limit reached');
        }
        
        // Call resumeMeeting from meetingCollaboration service
        await resumeMeeting(meetingId);
      } catch (error) {
        // Handle any errors by updating the error state
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        throw typedError;
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Subscribes to presence updates for a specific user
  const subscribeToUserPresenceWithErrorHandling = useCallback(
    (userId: string, onPresenceChange: (presence: any) => void, onError: (error: Error) => void): Unsubscribe => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          onError(new Error('Connection error: Max retry limit reached'));
          return () => {};
        }
        
        // Call subscribeToUserPresence from presenceTracker service
        return subscribeToUserPresence(
          userId,
          onPresenceChange,
          (error) => {
            // Handle any errors by updating the error state and connection state
            setError(error);
            setConnectionState(prev => ({
              ...prev,
              status: 'error',
              retryCount: prev.retryCount + 1
            }));
            onError(error);
          }
        );
      } catch (error) {
        // Handle any unexpected errors
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        onError(typedError);
        return () => {};
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Subscribes to presence updates for all users in an organization
  const subscribeToOrganizationPresenceWithErrorHandling = useCallback(
    (organizationId: string, onPresenceChange: (presences: any[]) => void, onError: (error: Error) => void): Unsubscribe => {
      try {
        // Check if connection state is not in error
        if (connectionState.status === 'error' && connectionState.retryCount >= CONNECTION_ERROR_RETRY_LIMIT) {
          onError(new Error('Connection error: Max retry limit reached'));
          return () => {};
        }
        
        // Call subscribeToOrganizationPresence from presenceTracker service
        return subscribeToOrganizationPresence(
          organizationId,
          onPresenceChange,
          (error) => {
            // Handle any errors by updating the error state and connection state
            setError(error);
            setConnectionState(prev => ({
              ...prev,
              status: 'error',
              retryCount: prev.retryCount + 1
            }));
            onError(error);
          }
        );
      } catch (error) {
        // Handle any unexpected errors
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        onError(typedError);
        return () => {};
      }
    },
    [connectionState.status, connectionState.retryCount]
  );
  
  // Determines if a user is active based on their last seen timestamp
  const isUserActiveWithErrorHandling = useCallback(
    (presence: any): boolean => {
      try {
        return isUserActive(presence);
      } catch (error) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        setError(typedError);
        return false;
      }
    },
    []
  );
  
  // Create the context value with all methods and state
  const contextValue: RealtimeContextType = {
    // Connection state
    connectionState,
    error,
    
    // Core document sync methods
    syncDocument: syncDocumentWithErrorHandling,
    syncCollection: syncCollectionWithErrorHandling,
    updateDocument: updateDocumentWithErrorHandling,
    createDocument: createDocumentWithErrorHandling,
    deleteDocument: deleteDocumentWithErrorHandling,
    
    // Meeting collaboration methods
    joinMeeting: joinMeetingWithErrorHandling,
    leaveMeeting: leaveMeetingWithErrorHandling,
    updateUserPresence: updateUserPresenceWithErrorHandling,
    updateTypingStatus: updateTypingStatusWithErrorHandling,
    subscribeToMeeting: subscribeToMeetingWithErrorHandling,
    subscribeToMeetingStages: subscribeToMeetingStagesWithErrorHandling,
    subscribeToActionItems: subscribeToActionItemsWithErrorHandling,
    subscribeToParticipants: subscribeToParticipantsWithErrorHandling,
    updateMeetingStatus: updateMeetingStatusWithErrorHandling,
    updateCurrentStage: updateCurrentStageWithErrorHandling,
    updateStageContent: updateStageContentWithErrorHandling,
    createActionItem: createActionItemWithErrorHandling,
    updateActionItem: updateActionItemWithErrorHandling,
    deleteActionItem: deleteActionItemWithErrorHandling,
    startMeeting: startMeetingWithErrorHandling,
    endMeeting: endMeetingWithErrorHandling,
    pauseMeeting: pauseMeetingWithErrorHandling,
    resumeMeeting: resumeMeetingWithErrorHandling,
    
    // Presence tracking methods
    subscribeToUserPresence: subscribeToUserPresenceWithErrorHandling,
    subscribeToOrganizationPresence: subscribeToOrganizationPresenceWithErrorHandling,
    isUserActive: isUserActiveWithErrorHandling,
  };
  
  // Render the RealtimeContext.Provider with the current realtime state and methods
  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};

/**
 * Custom hook that provides access to the realtime context
 * 
 * @returns Realtime context value containing state and methods
 * @throws Error if used outside of a RealtimeProvider
 */
const useRealtimeContext = (): RealtimeContextType => {
  // Get the realtime context using useContext(RealtimeContext)
  const context = useContext(RealtimeContext);
  
  // Check if the context exists (not null or undefined)
  if (!context) {
    // If context doesn't exist, throw an error indicating the hook must be used within a RealtimeProvider
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  
  // Return the context value if it exists
  return context;
};

// Export the context, provider, and hook
export { RealtimeContext, RealtimeProvider, useRealtimeContext };