import {
  subscribeToDocument,
  subscribeToCollection,
  updateDocument,
  createDocument,
  deleteDocument
} from '../firebase/firebaseFirestore';
import { FirestoreCollections } from '../../types/firebase.types';
import { UserPresence } from '../../types/user.types';
import {
  syncDocument,
  syncCollection,
  updateSyncedDocument,
  createSyncedDocument
} from './realtimeSync';
import { Unsubscribe, onDisconnect, serverTimestamp } from 'firebase/firestore'; // Firebase v9.0.0
import { onAuthStateChanged } from 'firebase/auth'; // Firebase v9.0.0

// Constants for presence timeout and heartbeat interval
const PRESENCE_TIMEOUT_MS = 300000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 60000; // 1 minute

// Maps to store unsubscribe functions and heartbeat intervals
const presenceUnsubscribers = new Map<string, Unsubscribe>();
const heartbeatIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Initializes presence tracking for the current user
 * @param userId User ID to initialize presence for
 * @param organizationId Organization ID the user belongs to
 * @returns Promise that resolves when presence is initialized
 */
export const initializePresence = async (
  userId: string,
  organizationId: string
): Promise<void> => {
  try {
    // Create initial presence document
    const presenceData: Partial<UserPresence> = {
      userId,
      status: 'online',
      lastActive: serverTimestamp() as any,
      currentActivity: null,
      organizationId
    };

    // Use createSyncedDocument to ensure the document exists with offline support
    await createSyncedDocument(
      FirestoreCollections.USER_PRESENCE,
      presenceData,
      userId
    );

    // Set up onDisconnect handler to update status to offline when connection is lost
    // Dynamically import to avoid circular dependencies
    const { firebase } = await import('../firebase/firebaseConfig');
    const db = firebase.firestore;
    const presenceRef = doc(db, FirestoreCollections.USER_PRESENCE, userId);
    
    onDisconnect(presenceRef).update({
      status: 'offline',
      lastActive: serverTimestamp()
    });

    // Start heartbeat to periodically update lastActive timestamp
    startHeartbeat(userId);

    // Set up auth state change listener to clean up presence when user logs out
    const unsubscribeAuth = onAuthStateChanged(firebase.auth, (user) => {
      if (!user) {
        // User has logged out, clean up presence
        cleanupPresence(userId);
        unsubscribeAuth(); // Remove the auth listener
      }
    });
  } catch (error) {
    console.error('Error initializing presence:', error);
    throw error;
  }
};

/**
 * Updates the current user's presence status
 * @param userId User ID to update presence for
 * @param status New presence status ('online', 'away', 'offline')
 * @param currentActivity Optional description of current activity
 * @returns Promise that resolves when presence is updated
 */
export const updatePresence = async (
  userId: string,
  status: 'online' | 'away' | 'offline',
  currentActivity: string | null = null
): Promise<void> => {
  try {
    const presenceData = {
      status,
      currentActivity,
      lastActive: serverTimestamp()
    };

    // Update the presence document using updateSyncedDocument for offline support
    await updateSyncedDocument(
      FirestoreCollections.USER_PRESENCE,
      userId,
      presenceData
    );
  } catch (error) {
    console.error('Error updating presence:', error);
    throw error;
  }
};

/**
 * Subscribe to presence updates for a specific user
 * @param userId ID of the user to track
 * @param onPresenceChange Callback function to handle presence updates
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToUserPresence = (
  userId: string,
  onPresenceChange: (presence: UserPresence | null) => void
): Unsubscribe => {
  try {
    // Create a subscription to the user's presence document
    const unsubscribe = syncDocument(
      FirestoreCollections.USER_PRESENCE,
      userId,
      (data) => {
        if (data) {
          onPresenceChange(data as UserPresence);
        } else {
          onPresenceChange(null);
        }
      },
      (error) => {
        console.error(`Error subscribing to user presence for ${userId}:`, error);
        // Return null in case of error
        onPresenceChange(null);
      }
    );

    // Store the unsubscribe function for later cleanup
    presenceUnsubscribers.set(`user_${userId}`, unsubscribe);

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to user presence:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Subscribe to presence updates for all users in an organization
 * @param organizationId ID of the organization to track users for
 * @param onPresenceChange Callback function to handle presence updates
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToOrganizationPresence = (
  organizationId: string,
  onPresenceChange: (presences: UserPresence[]) => void
): Unsubscribe => {
  try {
    // Create a query for presence documents filtered by organizationId
    const queries = [
      {
        field: 'organizationId',
        operator: '==',
        value: organizationId
      }
    ];

    // Set up a subscription to the filtered collection
    const unsubscribe = syncCollection(
      FirestoreCollections.USER_PRESENCE,
      queries,
      (data) => {
        onPresenceChange(data as UserPresence[]);
      },
      (error) => {
        console.error(`Error subscribing to organization presence for ${organizationId}:`, error);
        // Return empty array in case of error
        onPresenceChange([]);
      }
    );

    // Store the unsubscribe function for later cleanup
    presenceUnsubscribers.set(`org_${organizationId}`, unsubscribe);

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to organization presence:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Update a user's presence status in a specific meeting
 * @param meetingId ID of the meeting
 * @param userId ID of the user
 * @param status Presence status ('online', 'away', 'offline')
 * @param isTyping Whether the user is currently typing
 * @returns Promise that resolves when meeting presence is updated
 */
export const updateMeetingPresence = async (
  meetingId: string,
  userId: string,
  status: 'online' | 'away' | 'offline',
  isTyping: boolean = false
): Promise<void> => {
  try {
    // Create a document ID by combining meetingId and userId
    const presenceId = `${meetingId}_${userId}`;
    
    // Prepare the presence data
    const presenceData = {
      meetingId,
      userId,
      status,
      isTyping,
      lastActive: serverTimestamp()
    };

    // Update the meeting presence document with sync support
    await updateSyncedDocument(
      FirestoreCollections.USER_PRESENCE,
      presenceId,
      presenceData
    );
  } catch (error) {
    console.error('Error updating meeting presence:', error);
    throw error;
  }
};

/**
 * Subscribe to presence updates for all participants in a meeting
 * @param meetingId ID of the meeting to track participants for
 * @param onPresenceChange Callback function to handle presence updates
 * @returns Unsubscribe function to stop listening
 */
export const subscribeMeetingPresence = (
  meetingId: string,
  onPresenceChange: (presences: UserPresence[]) => void
): Unsubscribe => {
  try {
    // Create a query for presence documents filtered by meetingId
    const queries = [
      {
        field: 'meetingId',
        operator: '==',
        value: meetingId
      }
    ];

    // Set up a subscription to the filtered collection
    const unsubscribe = syncCollection(
      FirestoreCollections.USER_PRESENCE,
      queries,
      (data) => {
        onPresenceChange(data as UserPresence[]);
      },
      (error) => {
        console.error(`Error subscribing to meeting presence for ${meetingId}:`, error);
        // Return empty array in case of error
        onPresenceChange([]);
      }
    );

    // Store the unsubscribe function for later cleanup
    presenceUnsubscribers.set(`meeting_${meetingId}`, unsubscribe);

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to meeting presence:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Clean up presence tracking when a user logs out
 * @param userId ID of the user to clean up presence for
 * @returns Promise that resolves when cleanup is complete
 */
export const cleanupPresence = async (userId: string): Promise<void> => {
  try {
    // Update user's presence status to offline
    await updatePresence(userId, 'offline');
    
    // Clear any heartbeat intervals
    stopHeartbeat(userId);
    
    // Unsubscribe from any active presence listeners
    for (const [key, unsubscribe] of presenceUnsubscribers.entries()) {
      if (key.includes(userId)) {
        unsubscribe();
        presenceUnsubscribers.delete(key);
      }
    }
  } catch (error) {
    console.error('Error cleaning up presence:', error);
    // Continue cleanup even if there's an error
  }
};

/**
 * Determine if a user is active based on their last seen timestamp
 * @param presence User presence object to check
 * @returns True if the user is considered active, false otherwise
 */
export const isUserActive = (presence: UserPresence): boolean => {
  // If the user is offline, they're not active
  if (presence.status === 'offline') {
    return false;
  }
  
  // Get the lastActive timestamp
  let lastActiveTime: number;
  
  if (typeof presence.lastActive === 'object' && presence.lastActive.toMillis) {
    // Firebase Timestamp
    lastActiveTime = presence.lastActive.toMillis();
  } else if (presence.lastActive instanceof Date) {
    // JavaScript Date
    lastActiveTime = presence.lastActive.getTime();
  } else {
    // Fallback to current time if lastActive is invalid
    lastActiveTime = Date.now();
  }
  
  // Calculate time difference between now and lastActive
  const timeDiff = Date.now() - lastActiveTime;
  
  // Return true if the time difference is less than the timeout
  return timeDiff < PRESENCE_TIMEOUT_MS;
};

/**
 * Start a heartbeat interval to keep presence active
 * @param userId ID of the user to start heartbeat for
 */
export const startHeartbeat = (userId: string): void => {
  // Clear any existing heartbeat interval
  stopHeartbeat(userId);
  
  // Set up a new interval to update lastActive timestamp periodically
  const interval = setInterval(async () => {
    try {
      // Update the lastActive timestamp
      await updateSyncedDocument(
        FirestoreCollections.USER_PRESENCE,
        userId,
        { lastActive: serverTimestamp() }
      );
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  }, HEARTBEAT_INTERVAL_MS);
  
  // Store the interval reference for later cleanup
  heartbeatIntervals.set(userId, interval);
};

/**
 * Stop the heartbeat interval for a user
 * @param userId ID of the user to stop heartbeat for
 */
export const stopHeartbeat = (userId: string): void => {
  // Get the interval reference
  const interval = heartbeatIntervals.get(userId);
  
  // If there's an active interval, clear it
  if (interval) {
    clearInterval(interval);
    heartbeatIntervals.delete(userId);
  }
};

// Export the functions to provide real-time presence tracking functionality
export {
  isUserActive,
  initializePresence,
  updatePresence,
  subscribeToUserPresence,
  subscribeToOrganizationPresence,
  updateMeetingPresence,
  subscribeMeetingPresence,
  cleanupPresence
};