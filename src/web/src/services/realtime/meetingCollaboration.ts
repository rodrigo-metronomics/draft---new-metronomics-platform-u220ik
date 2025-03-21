/**
 * Metronomics Platform - Meeting Collaboration Service
 * 
 * This service provides real-time meeting collaboration functionality, enabling synchronous 
 * updates for meeting participants, managing meeting stages, action items, and participant presence
 * during collaborative sessions in the Metronomics Platform.
 */

import { 
  syncDocument, 
  syncCollection, 
  updateSyncedDocument, 
  createSyncedDocument, 
  deleteSyncedDocument 
} from './realtimeSync';

import { 
  updatePresence, 
  updateMeetingPresence, 
  updateTypingStatus as updateUserTypingStatus,
  subscribeMeetingPresence 
} from './presenceTracker';

import { 
  subscribeToMeeting, 
  subscribeToMeetingStages, 
  subscribeToActionItems 
} from '../firebase/firebaseFirestore';

import { getCurrentUser } from '../firebase/firebaseAuth';

import { FirestoreCollections } from '../../types/firebase.types';

import { 
  Meeting, 
  MeetingStatus, 
  MeetingStageType, 
  MeetingStage, 
  MeetingParticipant, 
  ParticipantRole, 
  ParticipantStatus 
} from '../../types/meeting.types';

import { 
  ActionItem, 
  ActionItemStatus 
} from '../../types/action-item.types';

import { Unsubscribe } from 'firebase/firestore'; // Firebase v9.0.0

/**
 * Joins a user to a meeting and sets up real-time presence tracking
 * 
 * @param meetingId ID of the meeting to join
 * @param userId ID of the user joining the meeting
 * @param role Role of the user in the meeting (moderator, participant, observer)
 * @returns Promise that resolves when the user has joined the meeting
 */
export const joinMeeting = async (
  meetingId: string,
  userId: string,
  role: ParticipantRole
): Promise<void> => {
  try {
    // Get current authenticated user to verify
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('User authentication mismatch');
    }

    // Update the user's presence status to online
    await updatePresence(userId, 'online');

    // Update user's meeting presence with their role
    await updateMeetingPresence(meetingId, userId, 'online');

    // Update the meeting participant record with joinedAt timestamp
    const participantUpdate = {
      joinedAt: new Date(),
      role,
      attendanceStatus: 'accepted',
      isOnline: true
    };

    await updateSyncedDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      `${meetingId}_participants`,
      { [userId]: participantUpdate }
    );

    console.log(`User ${userId} joined meeting ${meetingId}`);
  } catch (error) {
    console.error('Error joining meeting:', error);
    throw error;
  }
};

/**
 * Removes a user from a meeting and cleans up presence data
 * 
 * @param meetingId ID of the meeting to leave
 * @param userId ID of the user leaving the meeting
 * @returns Promise that resolves when the user has left the meeting
 */
export const leaveMeeting = async (
  meetingId: string,
  userId: string
): Promise<void> => {
  try {
    // Update user's presence status to indicate they're no longer in the meeting
    await updateMeetingPresence(meetingId, userId, 'offline');

    // Update the meeting participant record with leftAt timestamp
    const participantUpdate = {
      leftAt: new Date(),
      isOnline: false
    };

    await updateSyncedDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      `${meetingId}_participants`,
      { [userId]: participantUpdate }
    );

    console.log(`User ${userId} left meeting ${meetingId}`);
  } catch (error) {
    console.error('Error leaving meeting:', error);
    throw error;
  }
};

/**
 * Updates a user's presence status in a meeting
 * 
 * @param meetingId ID of the meeting
 * @param userId ID of the user
 * @param status New presence status (online, away, offline)
 * @returns Promise that resolves when the presence has been updated
 */
export const updateUserPresence = async (
  meetingId: string,
  userId: string,
  status: ParticipantStatus
): Promise<void> => {
  try {
    await updateMeetingPresence(meetingId, userId, status);
    
    // Update isOnline based on status
    const isOnline = status !== 'offline';
    
    await updateSyncedDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      `${meetingId}_participants`,
      { [userId]: { isOnline } }
    );
    
    console.log(`Updated user ${userId} presence to ${status} in meeting ${meetingId}`);
  } catch (error) {
    console.error('Error updating user presence:', error);
    throw error;
  }
};

/**
 * Updates a user's typing status in a meeting
 * 
 * @param meetingId ID of the meeting
 * @param userId ID of the user
 * @param isTyping Whether the user is currently typing
 * @returns Promise that resolves when the typing status has been updated
 */
export const updateTypingStatus = async (
  meetingId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  try {
    await updateUserTypingStatus(meetingId, userId, isTyping);
    console.log(`Updated user ${userId} typing status to ${isTyping ? 'typing' : 'not typing'} in meeting ${meetingId}`);
  } catch (error) {
    console.error('Error updating typing status:', error);
    throw error;
  }
};

/**
 * Subscribes to real-time updates for a meeting
 * 
 * @param meetingId ID of the meeting to subscribe to
 * @param onMeetingUpdate Callback function to handle meeting updates
 * @param onError Callback function to handle errors
 * @returns Function to unsubscribe from meeting updates
 */
export const subscribeToMeetingUpdates = (
  meetingId: string,
  onMeetingUpdate: (meeting: Meeting | null) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  try {
    return subscribeToMeeting(
      meetingId,
      (meetingData) => {
        if (meetingData) {
          // Transform meetingData to Meeting type if needed
          const meeting = meetingData as unknown as Meeting;
          onMeetingUpdate(meeting);
        } else {
          onMeetingUpdate(null);
        }
      },
      onError
    );
  } catch (error) {
    const typedError = error as Error;
    console.error('Error subscribing to meeting updates:', typedError);
    onError(typedError);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Subscribes to real-time updates for meeting stages
 * 
 * @param meetingId ID of the meeting to get stages for
 * @param onStagesUpdate Callback function to handle stage updates
 * @param onError Callback function to handle errors
 * @returns Function to unsubscribe from meeting stage updates
 */
export const subscribeToMeetingStageUpdates = (
  meetingId: string,
  onStagesUpdate: (stages: MeetingStage[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  try {
    return subscribeToMeetingStages(
      meetingId,
      (stagesData) => {
        if (stagesData && Array.isArray(stagesData)) {
          // Transform stagesData to MeetingStage type array
          const stages = stagesData as unknown as MeetingStage[];
          
          // Sort stages by sequence
          stages.sort((a, b) => a.sequence - b.sequence);
          
          onStagesUpdate(stages);
        } else {
          onStagesUpdate([]);
        }
      },
      onError
    );
  } catch (error) {
    const typedError = error as Error;
    console.error('Error subscribing to meeting stage updates:', typedError);
    onError(typedError);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Subscribes to real-time updates for action items in a meeting
 * 
 * @param meetingId ID of the meeting to get action items for
 * @param onActionItemsUpdate Callback function to handle action item updates
 * @param onError Callback function to handle errors
 * @returns Function to unsubscribe from action item updates
 */
export const subscribeToActionItemUpdates = (
  meetingId: string,
  onActionItemsUpdate: (actionItems: ActionItem[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  try {
    return subscribeToActionItems(
      meetingId,
      (actionItemsData) => {
        if (actionItemsData && Array.isArray(actionItemsData)) {
          // Transform actionItemsData to ActionItem type array
          const actionItems = actionItemsData as unknown as ActionItem[];
          onActionItemsUpdate(actionItems);
        } else {
          onActionItemsUpdate([]);
        }
      },
      onError
    );
  } catch (error) {
    const typedError = error as Error;
    console.error('Error subscribing to action item updates:', typedError);
    onError(typedError);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Subscribes to real-time updates for participant presence in a meeting
 * 
 * @param meetingId ID of the meeting to track participants for
 * @param onParticipantsUpdate Callback function to handle participant updates
 * @param onError Callback function to handle errors
 * @returns Function to unsubscribe from participant updates
 */
export const subscribeToParticipantUpdates = (
  meetingId: string,
  onParticipantsUpdate: (participants: MeetingParticipant[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  try {
    return subscribeMeetingPresence(
      meetingId,
      (presenceData) => {
        if (presenceData && Array.isArray(presenceData)) {
          // Transform presence data to MeetingParticipant array
          const participants = presenceData.map(presence => {
            return {
              userId: presence.userId,
              meetingId,
              isOnline: presence.status === 'online',
              role: presence.role || ParticipantRole.PARTICIPANT,
              attendanceStatus: 'accepted',
              lastActivity: presence.lastActive,
              isTyping: presence.isTyping || false
            } as unknown as MeetingParticipant;
          });
          
          onParticipantsUpdate(participants);
        } else {
          onParticipantsUpdate([]);
        }
      },
      onError
    );
  } catch (error) {
    const typedError = error as Error;
    console.error('Error subscribing to participant updates:', typedError);
    onError(typedError);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Updates the status of a meeting
 * 
 * @param meetingId ID of the meeting to update
 * @param status New meeting status
 * @returns Promise that resolves when the status has been updated
 */
export const updateMeetingStatus = async (
  meetingId: string,
  status: MeetingStatus
): Promise<void> => {
  try {
    // Update the meeting status
    await updateSyncedDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      meetingId,
      { 
        status,
        updatedAt: new Date()
      }
    );
    
    console.log(`Updated meeting ${meetingId} status to ${status}`);
  } catch (error) {
    console.error('Error updating meeting status:', error);
    throw error;
  }
};

/**
 * Updates the current stage of a meeting
 * 
 * @param meetingId ID of the meeting to update
 * @param stageType Type of stage to set as current
 * @returns Promise that resolves when the current stage has been updated
 */
export const updateCurrentStage = async (
  meetingId: string,
  stageType: MeetingStageType
): Promise<void> => {
  try {
    // Get the meeting to determine previous stage
    const meetingRef = `${FirestoreCollections.ACTIVE_MEETINGS}/${meetingId}`;
    const meeting = await syncDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      meetingId,
      (data) => {}, // No-op callback since we're using the promise
      (error) => console.error('Error fetching meeting:', error)
    );

    // Update the meeting with the new current stage
    await updateSyncedDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      meetingId,
      { 
        currentStage: stageType,
        updatedAt: new Date()
      }
    );
    
    // Find the stage document for the new stage
    const stagesQuery = await syncCollection(
      FirestoreCollections.MEETING_STAGES,
      [{ field: 'meetingId', operator: '==', value: meetingId }],
      (data) => {}, // No-op callback since we're using the promise
      (error) => console.error('Error fetching stages:', error)
    );
    
    const newStageDoc = stagesQuery.find(
      stage => stage.stageType === stageType
    );
    
    if (newStageDoc) {
      // Update the new stage with startedAt timestamp
      await updateSyncedDocument(
        FirestoreCollections.MEETING_STAGES,
        newStageDoc.id,
        {
          startedAt: new Date(),
          updatedAt: new Date()
        }
      );
    }
    
    // If there was a previous stage, mark it as completed
    if (meeting?.currentStage && meeting.currentStage !== stageType) {
      const previousStageDoc = stagesQuery.find(
        stage => stage.stageType === meeting.currentStage
      );
      
      if (previousStageDoc && !previousStageDoc.completedAt) {
        await updateSyncedDocument(
          FirestoreCollections.MEETING_STAGES,
          previousStageDoc.id,
          {
            completedAt: new Date(),
            updatedAt: new Date()
          }
        );
      }
    }
    
    console.log(`Updated meeting ${meetingId} current stage to ${stageType}`);
  } catch (error) {
    console.error('Error updating current stage:', error);
    throw error;
  }
};

/**
 * Updates the content of a specific meeting stage
 * 
 * @param meetingId ID of the meeting
 * @param stageId ID of the stage to update
 * @param content New content for the stage
 * @returns Promise that resolves when the stage content has been updated
 */
export const updateStageContent = async (
  meetingId: string,
  stageId: string,
  content: string
): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    await updateSyncedDocument(
      FirestoreCollections.MEETING_STAGES,
      stageId,
      {
        content,
        updatedAt: new Date(),
        updatedBy: currentUser.uid
      }
    );
    
    console.log(`Updated content for stage ${stageId} in meeting ${meetingId}`);
  } catch (error) {
    console.error('Error updating stage content:', error);
    throw error;
  }
};

/**
 * Creates a new action item in a meeting
 * 
 * @param meetingId ID of the meeting
 * @param actionItem Action item data to create
 * @returns Promise that resolves with the ID of the created action item
 */
export const createActionItem = async (
  meetingId: string,
  actionItem: Partial<ActionItem>
): Promise<string> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // Prepare action item data
    const actionItemData = {
      ...actionItem,
      meetingId,
      status: actionItem.status || ActionItemStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUser.uid
    };
    
    // Create the action item document
    const actionItemId = await createSyncedDocument(
      FirestoreCollections.ACTION_ITEMS,
      actionItemData
    );
    
    console.log(`Created action item ${actionItemId} in meeting ${meetingId}`);
    return actionItemId;
  } catch (error) {
    console.error('Error creating action item:', error);
    throw error;
  }
};

/**
 * Updates an existing action item
 * 
 * @param actionItemId ID of the action item to update
 * @param updates Updates to apply to the action item
 * @returns Promise that resolves when the action item has been updated
 */
export const updateActionItem = async (
  actionItemId: string,
  updates: Partial<ActionItem>
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };
    
    // If status is being updated to COMPLETED, add completedAt timestamp
    if (updates.status === ActionItemStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }
    
    await updateSyncedDocument(
      FirestoreCollections.ACTION_ITEMS,
      actionItemId,
      updateData
    );
    
    console.log(`Updated action item ${actionItemId}`);
  } catch (error) {
    console.error('Error updating action item:', error);
    throw error;
  }
};

/**
 * Deletes an action item from a meeting
 * 
 * @param actionItemId ID of the action item to delete
 * @returns Promise that resolves when the action item has been deleted
 */
export const deleteActionItem = async (
  actionItemId: string
): Promise<void> => {
  try {
    await deleteSyncedDocument(
      FirestoreCollections.ACTION_ITEMS,
      actionItemId
    );
    
    console.log(`Deleted action item ${actionItemId}`);
  } catch (error) {
    console.error('Error deleting action item:', error);
    throw error;
  }
};

/**
 * Starts a meeting and initializes real-time collaboration
 * 
 * @param meetingId ID of the meeting to start
 * @returns Promise that resolves when the meeting has been started
 */
export const startMeeting = async (
  meetingId: string
): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // Update meeting status to IN_PROGRESS
    await updateMeetingStatus(meetingId, MeetingStatus.IN_PROGRESS);
    
    // Set the current stage to the first stage (SETUP or GOOD_NEWS)
    const initialStage = MeetingStageType.GOOD_NEWS;
    
    // Get existing stages
    const existingStages = await syncCollection(
      FirestoreCollections.MEETING_STAGES,
      [{ field: 'meetingId', operator: '==', value: meetingId }],
      (data) => {}, // No-op callback since we're using the promise
      (error) => console.error('Error fetching stages:', error)
    );
    
    // If no stages exist yet, create them
    if (!existingStages || existingStages.length === 0) {
      // Define standard meeting stages for the meeting type
      const stages = [
        { 
          meetingId, 
          stageType: MeetingStageType.GOOD_NEWS, 
          content: '', 
          sequence: 1 
        },
        { 
          meetingId, 
          stageType: MeetingStageType.PREVIOUS_ACTIONS, 
          content: '', 
          sequence: 2 
        },
        { 
          meetingId, 
          stageType: MeetingStageType.METRICS, 
          content: '', 
          sequence: 3 
        },
        { 
          meetingId, 
          stageType: MeetingStageType.PRIORITIES, 
          content: '', 
          sequence: 4 
        },
        { 
          meetingId, 
          stageType: MeetingStageType.BLOCKERS, 
          content: '', 
          sequence: 5 
        },
        { 
          meetingId, 
          stageType: MeetingStageType.NEW_ACTIONS, 
          content: '', 
          sequence: 6 
        },
        { 
          meetingId, 
          stageType: MeetingStageType.SUMMARY, 
          content: '', 
          sequence: 7 
        }
      ];
      
      // Create each stage
      for (const stage of stages) {
        await createSyncedDocument(
          FirestoreCollections.MEETING_STAGES,
          {
            ...stage,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: currentUser.uid
          }
        );
      }
    }
    
    // Set the current stage
    await updateCurrentStage(meetingId, initialStage);
    
    console.log(`Started meeting ${meetingId}`);
  } catch (error) {
    console.error('Error starting meeting:', error);
    throw error;
  }
};

/**
 * Ends a meeting and finalizes data
 * 
 * @param meetingId ID of the meeting to end
 * @returns Promise that resolves when the meeting has been ended
 */
export const endMeeting = async (
  meetingId: string
): Promise<void> => {
  try {
    // Update meeting status to COMPLETED
    await updateMeetingStatus(meetingId, MeetingStatus.COMPLETED);
    
    // Set completedAt timestamp
    await updateSyncedDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      meetingId,
      {
        completedAt: new Date(),
        updatedAt: new Date()
      }
    );
    
    // Finalize any incomplete meeting stages
    const stages = await syncCollection(
      FirestoreCollections.MEETING_STAGES,
      [{ field: 'meetingId', operator: '==', value: meetingId }],
      (data) => {}, // No-op callback since we're using the promise
      (error) => console.error('Error fetching stages:', error)
    );
    
    // Mark any incomplete stages as completed
    for (const stage of stages) {
      if (!stage.completedAt) {
        await updateSyncedDocument(
          FirestoreCollections.MEETING_STAGES,
          stage.id,
          {
            completedAt: new Date(),
            updatedAt: new Date()
          }
        );
      }
    }
    
    console.log(`Ended meeting ${meetingId}`);
  } catch (error) {
    console.error('Error ending meeting:', error);
    throw error;
  }
};

/**
 * Pauses a meeting temporarily
 * 
 * @param meetingId ID of the meeting to pause
 * @returns Promise that resolves when the meeting has been paused
 */
export const pauseMeeting = async (
  meetingId: string
): Promise<void> => {
  try {
    // Save the current meeting state with a paused flag
    await updateSyncedDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      meetingId,
      {
        isPaused: true,
        pausedAt: new Date(),
        updatedAt: new Date()
      }
    );
    
    console.log(`Paused meeting ${meetingId}`);
  } catch (error) {
    console.error('Error pausing meeting:', error);
    throw error;
  }
};

/**
 * Resumes a paused meeting
 * 
 * @param meetingId ID of the meeting to resume
 * @returns Promise that resolves when the meeting has been resumed
 */
export const resumeMeeting = async (
  meetingId: string
): Promise<void> => {
  try {
    // Remove the paused flag and add resumedAt timestamp
    await updateSyncedDocument(
      FirestoreCollections.ACTIVE_MEETINGS,
      meetingId,
      {
        isPaused: false,
        resumedAt: new Date(),
        updatedAt: new Date()
      }
    );
    
    console.log(`Resumed meeting ${meetingId}`);
  } catch (error) {
    console.error('Error resuming meeting:', error);
    throw error;
  }
};