import {
  createMeetingDocument,
  updateMeetingStage,
  updateMeetingStatus,
  updateParticipantPresence,
  closeMeetingDocument,
  listenToDocument,
  listenToQuery,
  queryDocuments
} from '../realtime/firestoreService';
import {
  Meeting,
  MeetingParticipant,
  MeetingStageType,
  MeetingStatus,
  ActionItemReference
} from '../../types/meeting.types';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/helpers/logger';

/**
 * Service class for managing real-time collaboration in meetings using Firebase Firestore.
 * Handles participant presence tracking, real-time updates during meetings, and 
 * synchronization of meeting data between participants.
 */
export class MeetingCollaborationService {
  private meetingListeners: Map<string, Map<string, () => void>>;
  private participantPresenceStatus: Map<string, Map<string, string>>;

  /**
   * Initializes the MeetingCollaborationService with required dependencies
   */
  constructor() {
    // Initialize meetingListeners Map to track active listeners
    this.meetingListeners = new Map<string, Map<string, () => void>>();
    
    // Initialize participantPresenceStatus Map to track participant presence
    this.participantPresenceStatus = new Map<string, Map<string, string>>();
  }

  /**
   * Initializes real-time collaboration for a new meeting by creating a Firestore document
   * 
   * @param meeting Meeting data from the database
   * @param participants List of meeting participants
   * @returns Firestore document ID for the meeting
   * @throws ValidationError if meeting or participants data is invalid
   */
  async initializeMeetingCollaboration(
    meeting: Meeting,
    participants: MeetingParticipant[]
  ): Promise<string> {
    // Validate meeting data
    if (!meeting || !meeting.id) {
      throw new ValidationError('Valid meeting data is required');
    }

    // Validate participants data
    if (!participants || !Array.isArray(participants)) {
      throw new ValidationError('Valid participants array is required');
    }

    try {
      // Format participant data for Firestore
      const formattedParticipants = participants.map(participant => ({
        userId: participant.userId,
        role: participant.role,
        status: 'INACTIVE', // Using string literal as ParticipantStatus might not be directly imported
        lastSeen: null
      }));

      // Create a new meeting document in Firestore
      const firestoreDocumentId = await createMeetingDocument(meeting.id, {
        title: meeting.title,
        description: meeting.description,
        status: meeting.status,
        meetingType: meeting.meetingType,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        organizationId: meeting.organizationId,
        participants: formattedParticipants,
        actionItems: [],
        currentStage: meeting.currentStage
      });

      logger.info('Real-time collaboration initialized for meeting', {
        meetingId: meeting.id,
        firestoreDocumentId
      });

      return firestoreDocumentId;
    } catch (error) {
      logger.error('Failed to initialize real-time collaboration for meeting', {
        meetingId: meeting.id,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to initialize real-time collaboration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Records a user joining a meeting and updates their presence status
   * 
   * @param userId ID of the user joining the meeting
   * @param meetingId ID of the meeting
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @throws ValidationError if parameters are invalid
   */
  async joinMeeting(
    userId: string,
    meetingId: string,
    firestoreDocumentId: string
  ): Promise<void> {
    // Validate input parameters
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    try {
      // Update participant presence in Firestore
      await updateParticipantPresence(firestoreDocumentId, userId, 'ACTIVE');

      // Update the local tracking map
      if (!this.participantPresenceStatus.has(meetingId)) {
        this.participantPresenceStatus.set(meetingId, new Map<string, string>());
      }
      
      this.participantPresenceStatus.get(meetingId)?.set(userId, 'ACTIVE');

      logger.info('User joined meeting', {
        userId,
        meetingId,
        firestoreDocumentId
      });
    } catch (error) {
      logger.error('Failed to record user joining meeting', {
        userId,
        meetingId,
        firestoreDocumentId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to record user joining meeting: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Records a user leaving a meeting and updates their presence status
   * 
   * @param userId ID of the user leaving the meeting
   * @param meetingId ID of the meeting
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @throws ValidationError if parameters are invalid
   */
  async leaveMeeting(
    userId: string,
    meetingId: string,
    firestoreDocumentId: string
  ): Promise<void> {
    // Validate input parameters
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    try {
      // Update participant presence in Firestore
      await updateParticipantPresence(firestoreDocumentId, userId, 'INACTIVE');

      // Update the local tracking map
      if (this.participantPresenceStatus.has(meetingId)) {
        this.participantPresenceStatus.get(meetingId)?.set(userId, 'INACTIVE');
      }

      logger.info('User left meeting', {
        userId,
        meetingId,
        firestoreDocumentId
      });
    } catch (error) {
      logger.error('Failed to record user leaving meeting', {
        userId,
        meetingId,
        firestoreDocumentId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to record user leaving meeting: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Updates the content of a specific meeting stage in real-time
   * 
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @param stageId ID of the meeting stage
   * @param content New content for the stage
   * @param userId ID of the user making the update
   * @throws ValidationError if parameters are invalid
   */
  async updateMeetingStageContent(
    firestoreDocumentId: string,
    stageId: string,
    content: string,
    userId: string
  ): Promise<void> {
    // Validate input parameters
    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    if (!stageId) {
      throw new ValidationError('Stage ID is required');
    }

    if (content === undefined || content === null) {
      throw new ValidationError('Stage content is required');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    try {
      // Update the stage content in Firestore
      await updateMeetingStage(firestoreDocumentId, stageId, { content }, userId);

      logger.info('Meeting stage content updated', {
        firestoreDocumentId,
        stageId,
        userId
      });
    } catch (error) {
      logger.error('Failed to update meeting stage content', {
        firestoreDocumentId,
        stageId,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to update meeting stage content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Updates the status of a meeting stage (started, completed)
   * 
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @param stageId ID of the meeting stage
   * @param stageType Type of the meeting stage being updated
   * @param userId ID of the user making the update
   * @throws ValidationError if parameters are invalid
   */
  async updateMeetingStageStatus(
    firestoreDocumentId: string,
    stageId: string,
    stageType: MeetingStageType,
    userId: string
  ): Promise<void> {
    // Validate input parameters
    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    if (!stageId) {
      throw new ValidationError('Stage ID is required');
    }

    if (!stageType || !Object.values(MeetingStageType).includes(stageType)) {
      throw new ValidationError('Valid stage type is required');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    try {
      // Update the meeting status in Firestore to reflect the current stage
      await updateMeetingStatus(firestoreDocumentId, MeetingStatus.IN_PROGRESS, userId);
      
      // Update the meeting to indicate which stage is active
      await updateMeetingStage(firestoreDocumentId, stageId, { 
        active: true,
        startedAt: new Date()
      }, userId);

      logger.info('Meeting stage status updated', {
        firestoreDocumentId,
        stageId,
        stageType,
        userId
      });
    } catch (error) {
      logger.error('Failed to update meeting stage status', {
        firestoreDocumentId,
        stageId,
        stageType,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to update meeting stage status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Marks a meeting as completed and archives the real-time data
   * 
   * @param meetingId ID of the meeting
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @throws ValidationError if parameters are invalid
   * @throws NotFoundError if meeting document is not found
   */
  async completeMeeting(
    meetingId: string,
    firestoreDocumentId: string
  ): Promise<void> {
    // Validate input parameters
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    try {
      // Close and archive the meeting document in Firestore
      // Using 'system' as the userId since the method doesn't accept one in its parameters
      await closeMeetingDocument(firestoreDocumentId, 'system');

      // Remove any active listeners for this meeting
      this.removeListeners(meetingId);

      // Clear participant presence data for this meeting
      this.participantPresenceStatus.delete(meetingId);

      logger.info('Meeting completed and archived', {
        meetingId,
        firestoreDocumentId
      });
    } catch (error) {
      logger.error('Failed to complete meeting', {
        meetingId,
        firestoreDocumentId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      throw new Error(`Failed to complete meeting: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the list of currently active participants in a meeting
   * 
   * @param meetingId ID of the meeting
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @returns Array of active meeting participants with their status
   * @throws ValidationError if parameters are invalid
   */
  async getActiveMeetingParticipants(
    meetingId: string,
    firestoreDocumentId: string
  ): Promise<Array<{userId: string, status: string}>> {
    // Validate input parameters
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    try {
      // Query the active participants from Firestore
      const meetingDoc = await queryDocuments('active-meetings', { id: firestoreDocumentId }, {});
      
      if (!meetingDoc || meetingDoc.length === 0) {
        return [];
      }

      // Extract participants data from the document
      const meeting = meetingDoc[0];
      const participants = meeting.participants || [];

      // Convert to the expected format
      const activeParticipants = participants.map((participant: any) => ({
        userId: participant.userId,
        status: participant.status || 'INACTIVE'
      }));

      logger.debug('Retrieved active meeting participants', {
        meetingId,
        firestoreDocumentId,
        participantCount: activeParticipants.length
      });

      return activeParticipants;
    } catch (error) {
      logger.error('Failed to get active meeting participants', {
        meetingId,
        firestoreDocumentId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to get active meeting participants: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Synchronizes action items to the real-time meeting document
   * 
   * @param meetingId ID of the meeting
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @param actionItems Array of action items to synchronize
   * @throws ValidationError if parameters are invalid
   */
  async syncActionItems(
    meetingId: string,
    firestoreDocumentId: string,
    actionItems: ActionItemReference[]
  ): Promise<void> {
    // Validate input parameters
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    if (!actionItems || !Array.isArray(actionItems)) {
      throw new ValidationError('Valid action items array is required');
    }

    try {
      // Format action items for Firestore storage
      const formattedActionItems = actionItems.map(item => ({
        id: item.id,
        description: item.description,
        assigneeId: item.assigneeId,
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate,
        meetingId: item.meetingId
      }));

      // Update the meeting document with the latest action items
      await updateMeetingStage(firestoreDocumentId, 'action-items', { actionItems: formattedActionItems }, 'system');

      logger.info('Action items synchronized to meeting document', {
        meetingId,
        firestoreDocumentId,
        actionItemCount: actionItems.length
      });
    } catch (error) {
      logger.error('Failed to synchronize action items', {
        meetingId,
        firestoreDocumentId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to synchronize action items: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Sets up a real-time listener for changes to a meeting document
   * 
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @param onUpdate Callback function called when meeting data is updated
   * @param onError Callback function called when an error occurs
   * @returns Unsubscribe function to stop listening
   * @throws ValidationError if parameters are invalid
   */
  setupMeetingListener(
    firestoreDocumentId: string,
    onUpdate: (data: any) => void,
    onError: (error: Error) => void
  ): () => void {
    // Validate input parameters
    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    if (!onUpdate || typeof onUpdate !== 'function') {
      throw new ValidationError('onUpdate callback function is required');
    }

    if (!onError || typeof onError !== 'function') {
      throw new ValidationError('onError callback function is required');
    }

    try {
      // Set up a Firestore listener for the meeting document
      const unsubscribe = listenToDocument(
        'active-meetings',
        firestoreDocumentId,
        (data) => {
          if (data) {
            onUpdate(data);
          } else {
            onError(new Error('Meeting document not found'));
          }
        }
      );

      // Store the unsubscribe function in the meetingListeners map
      const meetingId = firestoreDocumentId;
      if (!this.meetingListeners.has(meetingId)) {
        this.meetingListeners.set(meetingId, new Map<string, () => void>());
      }
      
      this.meetingListeners.get(meetingId)?.set('meeting', unsubscribe);

      logger.debug('Meeting listener setup', {
        firestoreDocumentId
      });

      return unsubscribe;
    } catch (error) {
      logger.error('Failed to setup meeting listener', {
        firestoreDocumentId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      onError(new Error(`Failed to setup meeting listener: ${error instanceof Error ? error.message : String(error)}`));
      
      // Return a no-op function in case of error
      return () => {};
    }
  }

  /**
   * Sets up a real-time listener for changes to a specific meeting stage
   * 
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @param stageId ID of the meeting stage
   * @param onUpdate Callback function called when stage data is updated
   * @param onError Callback function called when an error occurs
   * @returns Unsubscribe function to stop listening
   * @throws ValidationError if parameters are invalid
   */
  setupStageListener(
    firestoreDocumentId: string,
    stageId: string,
    onUpdate: (data: any) => void,
    onError: (error: Error) => void
  ): () => void {
    // Validate input parameters
    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    if (!stageId) {
      throw new ValidationError('Stage ID is required');
    }

    if (!onUpdate || typeof onUpdate !== 'function') {
      throw new ValidationError('onUpdate callback function is required');
    }

    if (!onError || typeof onError !== 'function') {
      throw new ValidationError('onError callback function is required');
    }

    try {
      // Set up a Firestore listener for the specific stage
      const unsubscribe = listenToDocument(
        'meeting-stages',
        `${firestoreDocumentId}_${stageId}`,
        (data) => {
          if (data) {
            onUpdate(data);
          } else {
            onError(new Error(`Stage ${stageId} not found`));
          }
        }
      );

      // Store the unsubscribe function in the meetingListeners map
      const meetingId = firestoreDocumentId;
      if (!this.meetingListeners.has(meetingId)) {
        this.meetingListeners.set(meetingId, new Map<string, () => void>());
      }
      
      this.meetingListeners.get(meetingId)?.set(`stage-${stageId}`, unsubscribe);

      logger.debug('Stage listener setup', {
        firestoreDocumentId,
        stageId
      });

      return unsubscribe;
    } catch (error) {
      logger.error('Failed to setup stage listener', {
        firestoreDocumentId,
        stageId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      onError(new Error(`Failed to setup stage listener: ${error instanceof Error ? error.message : String(error)}`));
      
      // Return a no-op function in case of error
      return () => {};
    }
  }

  /**
   * Sets up a real-time listener for changes to meeting participants
   * 
   * @param firestoreDocumentId Firestore document ID for the meeting
   * @param onUpdate Callback function called when participant data is updated
   * @param onError Callback function called when an error occurs
   * @returns Unsubscribe function to stop listening
   * @throws ValidationError if parameters are invalid
   */
  setupParticipantsListener(
    firestoreDocumentId: string,
    onUpdate: (data: any[]) => void,
    onError: (error: Error) => void
  ): () => void {
    // Validate input parameters
    if (!firestoreDocumentId) {
      throw new ValidationError('Firestore document ID is required');
    }

    if (!onUpdate || typeof onUpdate !== 'function') {
      throw new ValidationError('onUpdate callback function is required');
    }

    if (!onError || typeof onError !== 'function') {
      throw new ValidationError('onError callback function is required');
    }

    try {
      // Set up a Firestore listener for the participants subcollection
      const unsubscribe = listenToQuery(
        `active-meetings/${firestoreDocumentId}/participants`,
        {},
        (data) => {
          if (data) {
            onUpdate(data);
          } else {
            onUpdate([]);
          }
        }
      );

      // Store the unsubscribe function in the meetingListeners map
      const meetingId = firestoreDocumentId;
      if (!this.meetingListeners.has(meetingId)) {
        this.meetingListeners.set(meetingId, new Map<string, () => void>());
      }
      
      this.meetingListeners.get(meetingId)?.set('participants', unsubscribe);

      logger.debug('Participants listener setup', {
        firestoreDocumentId
      });

      return unsubscribe;
    } catch (error) {
      logger.error('Failed to setup participants listener', {
        firestoreDocumentId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      onError(new Error(`Failed to setup participants listener: ${error instanceof Error ? error.message : String(error)}`));
      
      // Return a no-op function in case of error
      return () => {};
    }
  }

  /**
   * Removes all active listeners for a meeting
   * 
   * @param meetingId ID of the meeting
   */
  removeListeners(meetingId: string): void {
    // Validate the meetingId parameter
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    try {
      // Get all listeners for the meeting from the meetingListeners map
      const listeners = this.meetingListeners.get(meetingId);
      
      if (listeners) {
        // Call each unsubscribe function to remove the listeners
        for (const [key, unsubscribe] of listeners.entries()) {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
            logger.debug(`Removed listener: ${key}`, { meetingId });
          }
        }
        
        // Remove the meeting entry from the meetingListeners map
        this.meetingListeners.delete(meetingId);
      }

      logger.info('Removed all listeners for meeting', { meetingId });
    } catch (error) {
      logger.error('Failed to remove listeners for meeting', {
        meetingId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // No need to throw here as this is a cleanup function
    }
  }
}