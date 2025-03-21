import { FirestoreService } from './firestoreService';
import { logger } from '../../utils/helpers/logger';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { MeetingStatus, ParticipantStatus } from '../../types/meeting.types';

/**
 * Service for managing real-time communication and synchronization
 * across the Metronomics Platform. This service orchestrates real-time
 * collaboration for meetings, user presence tracking, and notification
 * delivery using Firebase Firestore as the underlying real-time database.
 */
export class RealtimeService {
  private firestoreService: FirestoreService;
  private activeSubscriptions: Map<string, Map<string, Function>>;
  private userPresenceMap: Map<string, Map<string, { status: string, lastActive: Date }>>;

  /**
   * Initializes the RealtimeService with required dependencies
   */
  constructor() {
    this.firestoreService = new FirestoreService();
    this.activeSubscriptions = new Map();
    this.userPresenceMap = new Map();
    logger.info('RealtimeService initialized');
  }

  /**
   * Sets up real-time subscription to meeting updates
   * 
   * @param meetingId ID of the meeting to subscribe to
   * @param onUpdate Callback function when meeting data is updated
   * @param onError Callback function when an error occurs
   * @returns Subscription ID that can be used to unsubscribe
   */
  subscribeToMeeting(meetingId: string, onUpdate: (data: any) => void, onError: (error: Error) => void): string {
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!onUpdate || typeof onUpdate !== 'function') {
      throw new ValidationError('Update callback function is required');
    }

    if (!onError || typeof onError !== 'function') {
      throw new ValidationError('Error callback function is required');
    }

    // Generate a unique subscription ID
    const subscriptionId = `meeting_${meetingId}_${Date.now()}`;

    // Start listening to the meeting document
    const unsubscribe = this.firestoreService.listenToDocument(
      'active-meetings',
      meetingId,
      (data) => {
        try {
          onUpdate(data);
        } catch (error) {
          logger.error('Error in meeting update handler', { 
            meetingId, 
            error: error instanceof Error ? error.message : String(error) 
          });
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    );

    // Store the subscription
    if (!this.activeSubscriptions.has('meeting')) {
      this.activeSubscriptions.set('meeting', new Map());
    }
    this.activeSubscriptions.get('meeting')!.set(subscriptionId, unsubscribe);

    logger.info('Subscribed to meeting', { meetingId, subscriptionId });
    return subscriptionId;
  }

  /**
   * Removes a real-time subscription to meeting updates
   * 
   * @param meetingId ID of the meeting
   * @param subscriptionId ID of the subscription to remove
   * @returns True if unsubscribed successfully, false if subscription not found
   */
  unsubscribeFromMeeting(meetingId: string, subscriptionId: string): boolean {
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!subscriptionId) {
      throw new ValidationError('Subscription ID is required');
    }

    const meetingSubscriptions = this.activeSubscriptions.get('meeting');
    if (meetingSubscriptions && meetingSubscriptions.has(subscriptionId)) {
      // Call the unsubscribe function
      const unsubscribe = meetingSubscriptions.get(subscriptionId) as Function;
      unsubscribe();

      // Remove the subscription from our tracking
      meetingSubscriptions.delete(subscriptionId);

      logger.info('Unsubscribed from meeting', { meetingId, subscriptionId });
      return true;
    }

    logger.warn('Subscription not found', { meetingId, subscriptionId });
    return false;
  }

  /**
   * Updates meeting data in real-time for all participants
   * 
   * @param meetingId ID of the meeting to update
   * @param data Updated meeting data
   * @param userId ID of the user making the update
   * @returns Promise that resolves when update is complete
   */
  async updateMeetingData(meetingId: string, data: Record<string, any>, userId: string): Promise<void> {
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!data || typeof data !== 'object') {
      throw new ValidationError('Meeting data must be a valid object');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Add metadata about who updated and when
    const updateData = {
      ...data,
      lastUpdatedBy: userId,
      lastActivity: new Date()
    };

    // Update the meeting document in Firestore
    await this.firestoreService.updateDocument('active-meetings', meetingId, updateData);

    logger.info('Meeting data updated', { meetingId, userId });
  }

  /**
   * Updates a specific stage of a meeting in real-time
   * 
   * @param meetingId ID of the meeting
   * @param stageId ID of the meeting stage
   * @param stageData Updated stage data
   * @param userId ID of the user making the update
   * @returns Promise that resolves when update is complete
   */
  async updateMeetingStage(meetingId: string, stageId: string, stageData: Record<string, any>, userId: string): Promise<void> {
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

    // Update the meeting stage in Firestore
    await this.firestoreService.updateMeetingStage(meetingId, stageId, stageData, userId);

    logger.info('Meeting stage updated', { meetingId, stageId, userId });
  }

  /**
   * Broadcasts user activity in a meeting to all participants
   * 
   * @param meetingId ID of the meeting
   * @param userId ID of the user performing the activity
   * @param activityType Type of activity
   * @param activityData Additional data about the activity
   * @returns Promise that resolves when broadcast is complete
   */
  async broadcastUserActivity(meetingId: string, userId: string, activityType: string, activityData: Record<string, any> = {}): Promise<void> {
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!activityType) {
      throw new ValidationError('Activity type is required');
    }

    // Create activity object
    const activity = {
      type: activityType,
      userId,
      timestamp: new Date(),
      data: activityData
    };

    // Add to meeting activities collection
    await this.firestoreService.updateDocument(
      `active-meetings/${meetingId}/activities`,
      `${Date.now()}_${userId}`,
      activity
    );

    logger.debug('User activity broadcast', { meetingId, userId, activityType });
  }

  /**
   * Gets the list of currently active participants in a meeting
   * 
   * @param meetingId ID of the meeting
   * @returns Array of active participants with their status
   */
  async getActiveMeetingParticipants(meetingId: string): Promise<Array<{userId: string, status: string, lastActive: Date}>> {
    if (!meetingId) {
      throw new ValidationError('Meeting ID is required');
    }

    // Query participant presence data
    const participants = await this.firestoreService.queryDocuments(
      `active-meetings/${meetingId}/participants`,
      {},
      { orderBy: [{ field: 'lastSeen', direction: 'desc' }] }
    );

    // Filter for active participants (active within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeParticipants = participants
      .filter(p => p.lastSeen && new Date(p.lastSeen) > fiveMinutesAgo)
      .map(p => ({
        userId: p.id,
        status: p.status,
        lastActive: new Date(p.lastSeen)
      }));

    logger.debug('Retrieved active meeting participants', {
      meetingId,
      count: activeParticipants.length
    });

    return activeParticipants;
  }

  /**
   * Sets up real-time subscription to user notifications
   * 
   * @param userId ID of the user to get notifications for
   * @param onNotification Callback when a notification is received
   * @param onError Callback when an error occurs
   * @returns Subscription ID that can be used to unsubscribe
   */
  subscribeToNotifications(userId: string, onNotification: (notifications: any[]) => void, onError: (error: Error) => void): string {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!onNotification || typeof onNotification !== 'function') {
      throw new ValidationError('Notification callback function is required');
    }

    if (!onError || typeof onError !== 'function') {
      throw new ValidationError('Error callback function is required');
    }

    // Generate a unique subscription ID
    const subscriptionId = `notifications_${userId}_${Date.now()}`;

    // Start listening to the user's notifications
    const unsubscribe = this.firestoreService.listenToQuery(
      'notifications',
      { userId, status: 'UNREAD' },
      (data) => {
        try {
          onNotification(data);
        } catch (error) {
          logger.error('Error in notification handler', { 
            userId, 
            error: error instanceof Error ? error.message : String(error) 
          });
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      },
      { orderBy: [{ field: 'createdAt', direction: 'desc' }] }
    );

    // Store the subscription
    if (!this.activeSubscriptions.has('notifications')) {
      this.activeSubscriptions.set('notifications', new Map());
    }
    this.activeSubscriptions.get('notifications')!.set(subscriptionId, unsubscribe);

    logger.info('Subscribed to notifications', { userId, subscriptionId });
    return subscriptionId;
  }

  /**
   * Removes a real-time subscription to user notifications
   * 
   * @param userId ID of the user
   * @param subscriptionId ID of the subscription to remove
   * @returns True if unsubscribed successfully, false if subscription not found
   */
  unsubscribeFromNotifications(userId: string, subscriptionId: string): boolean {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!subscriptionId) {
      throw new ValidationError('Subscription ID is required');
    }

    const notificationSubscriptions = this.activeSubscriptions.get('notifications');
    if (notificationSubscriptions && notificationSubscriptions.has(subscriptionId)) {
      // Call the unsubscribe function
      const unsubscribe = notificationSubscriptions.get(subscriptionId) as Function;
      unsubscribe();

      // Remove the subscription from our tracking
      notificationSubscriptions.delete(subscriptionId);

      logger.info('Unsubscribed from notifications', { userId, subscriptionId });
      return true;
    }

    logger.warn('Notification subscription not found', { userId, subscriptionId });
    return false;
  }

  /**
   * Tracks a user's online presence status
   * 
   * @param userId ID of the user
   * @param status Status string (online, away, offline)
   * @param contextId Context ID (like meetingId) or 'global'
   * @returns Promise that resolves when presence is updated
   */
  async trackUserPresence(userId: string, status: string, contextId: string = 'global'): Promise<void> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!status) {
      throw new ValidationError('Status is required');
    }

    if (!contextId) {
      throw new ValidationError('Context ID is required');
    }

    // Update internal tracking
    if (!this.userPresenceMap.has(contextId)) {
      this.userPresenceMap.set(contextId, new Map());
    }
    
    const contextMap = this.userPresenceMap.get(contextId)!;
    contextMap.set(userId, {
      status,
      lastActive: new Date()
    });

    // Determine the correct Firestore path based on context
    let collectionPath = 'user-presence';
    let documentId = userId;

    if (contextId !== 'global') {
      // This is a meeting-specific presence
      const participantStatus = status as ParticipantStatus;
      await this.firestoreService.updateParticipantPresence(contextId, userId, participantStatus);
    } else {
      // Global user presence
      await this.firestoreService.updateDocument(collectionPath, documentId, {
        status,
        lastSeen: new Date()
      });
    }

    logger.debug('User presence updated', { userId, status, contextId });
  }

  /**
   * Gets the current presence status of a user
   * 
   * @param userId ID of the user
   * @param contextId Context ID (like meetingId) or 'global'
   * @returns User's presence status or null if not found
   */
  async getUserPresence(userId: string, contextId: string = 'global'): Promise<{status: string, lastActive: Date} | null> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!contextId) {
      throw new ValidationError('Context ID is required');
    }

    // Check internal map first for better performance
    const contextMap = this.userPresenceMap.get(contextId);
    if (contextMap && contextMap.has(userId)) {
      return contextMap.get(userId)!;
    }

    // If not in memory, check Firestore
    let collectionPath = 'user-presence';
    let documentId = userId;

    if (contextId !== 'global') {
      // This is a meeting-specific presence
      collectionPath = `active-meetings/${contextId}/participants`;
      documentId = userId;
    }

    const presenceDoc = await this.firestoreService.getDocument(collectionPath, documentId);
    
    if (presenceDoc) {
      const presence = {
        status: presenceDoc.status,
        lastActive: new Date(presenceDoc.lastSeen)
      };

      // Update our local cache
      if (!this.userPresenceMap.has(contextId)) {
        this.userPresenceMap.set(contextId, new Map());
      }
      this.userPresenceMap.get(contextId)!.set(userId, presence);

      return presence;
    }

    return null;
  }

  /**
   * Sets up real-time subscription to user presence changes
   * 
   * @param userId ID of the user to track
   * @param contextId Context ID (like meetingId) or 'global'
   * @param onPresenceChange Callback when presence changes
   * @param onError Callback when an error occurs
   * @returns Subscription ID that can be used to unsubscribe
   */
  subscribeToUserPresence(userId: string, contextId: string, onPresenceChange: (presence: any) => void, onError: (error: Error) => void): string {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!contextId) {
      throw new ValidationError('Context ID is required');
    }

    if (!onPresenceChange || typeof onPresenceChange !== 'function') {
      throw new ValidationError('Presence change callback function is required');
    }

    if (!onError || typeof onError !== 'function') {
      throw new ValidationError('Error callback function is required');
    }

    // Generate a unique subscription ID
    const subscriptionId = `presence_${userId}_${contextId}_${Date.now()}`;

    // Determine the correct Firestore path based on context
    let collectionPath = 'user-presence';
    let documentId = userId;

    if (contextId !== 'global') {
      // This is a meeting-specific presence
      collectionPath = `active-meetings/${contextId}/participants`;
      documentId = userId;
    }

    // Start listening to the user's presence
    const unsubscribe = this.firestoreService.listenToDocument(
      collectionPath,
      documentId,
      (data) => {
        try {
          if (data) {
            onPresenceChange({
              status: data.status,
              lastActive: new Date(data.lastSeen)
            });
          } else {
            onPresenceChange(null);
          }
        } catch (error) {
          logger.error('Error in presence change handler', { 
            userId, 
            contextId, 
            error: error instanceof Error ? error.message : String(error) 
          });
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    );

    // Store the subscription
    if (!this.activeSubscriptions.has('presence')) {
      this.activeSubscriptions.set('presence', new Map());
    }
    this.activeSubscriptions.get('presence')!.set(subscriptionId, unsubscribe);

    logger.info('Subscribed to user presence', { userId, contextId, subscriptionId });
    return subscriptionId;
  }

  /**
   * Resolves conflicts in concurrent edits using last-write-wins strategy
   * with entity-specific customizations
   * 
   * @param currentData Current data object
   * @param newData New data object with changes
   * @param entityType Type of entity being updated (meeting, metric, etc.)
   * @returns Resolved data after conflict resolution
   */
  resolveConflicts(currentData: Record<string, any>, newData: Record<string, any>, entityType: string): Record<string, any> {
    if (!currentData || typeof currentData !== 'object') {
      throw new ValidationError('Current data must be a valid object');
    }

    if (!newData || typeof newData !== 'object') {
      throw new ValidationError('New data must be a valid object');
    }

    if (!entityType) {
      throw new ValidationError('Entity type is required');
    }

    // Start with the current data
    const resolvedData = { ...currentData };

    // Get timestamps to determine which is newer
    const currentTimestamp = currentData.updatedAt ? new Date(currentData.updatedAt) : new Date(0);
    const newTimestamp = newData.updatedAt ? new Date(newData.updatedAt) : new Date();

    // Implement entity-specific conflict resolution logic
    switch (entityType) {
      case 'meeting':
        // For meetings, preserve the full participant list from both sources
        if (currentData.participants && newData.participants) {
          // Combine participants from both lists (based on userId as unique identifier)
          const participantMap = new Map();
          
          // Add current participants to map
          currentData.participants.forEach((p: any) => {
            participantMap.set(p.userId, p);
          });
          
          // Add or update with new participants
          newData.participants.forEach((p: any) => {
            // If the participant exists and the new data is newer, update
            if (participantMap.has(p.userId) && newTimestamp > currentTimestamp) {
              participantMap.set(p.userId, p);
            }
            // If the participant doesn't exist yet, add them
            else if (!participantMap.has(p.userId)) {
              participantMap.set(p.userId, p);
            }
          });
          
          resolvedData.participants = Array.from(participantMap.values());
        }
        
        // If newer, use the newer meeting status
        if (newData.status && newTimestamp > currentTimestamp) {
          resolvedData.status = newData.status;
        }
        
        // For other meeting fields, use newer values
        if (newTimestamp > currentTimestamp) {
          ['title', 'description', 'currentStage', 'endTime'].forEach(field => {
            if (newData[field] !== undefined) {
              resolvedData[field] = newData[field];
            }
          });
        }
        break;
      
      case 'metric':
        // For metrics, use the latest value but preserve history
        if (newData.value !== undefined && newTimestamp > currentTimestamp) {
          resolvedData.value = newData.value;
        }
        
        // Preserve historical values by combining arrays
        if (currentData.history && newData.history) {
          // Create a map of historical values by timestamp
          const historyMap = new Map();
          
          // Add current history to map
          currentData.history.forEach((h: any) => {
            historyMap.set(h.timestamp, h);
          });
          
          // Add new history entries that don't exist yet
          newData.history.forEach((h: any) => {
            if (!historyMap.has(h.timestamp)) {
              historyMap.set(h.timestamp, h);
            }
          });
          
          // Convert back to array and sort by timestamp
          resolvedData.history = Array.from(historyMap.values())
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
        break;
      
      default:
        // For general entities, use last-write-wins strategy
        if (newTimestamp > currentTimestamp) {
          // If new data is newer, apply all changes
          Object.assign(resolvedData, newData);
        }
        break;
    }

    logger.debug('Conflicts resolved', { entityType });
    return resolvedData;
  }

  /**
   * Cleans up all active subscriptions and resources
   * 
   * @returns Promise that resolves when cleanup is complete
   */
  async cleanup(): Promise<void> {
    // Unsubscribe from all active subscriptions
    this.activeSubscriptions.forEach((subscriptionMap) => {
      subscriptionMap.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (error) {
          logger.error('Error unsubscribing', { 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      });
      subscriptionMap.clear();
    });
    
    this.activeSubscriptions.clear();
    this.userPresenceMap.clear();
    
    logger.info('RealtimeService cleaned up');
  }
}