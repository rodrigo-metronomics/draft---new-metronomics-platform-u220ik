/**
 * Metronomics Platform - Realtime Service
 * 
 * This barrel file exports all real-time collaboration functionality from the realtime service modules.
 * It serves as the main entry point for real-time features in the Metronomics Platform,
 * including meeting collaboration, presence tracking, and data synchronization.
 */

// Import all service modules
import * as MeetingCollaboration from './meetingCollaboration';
import * as RealtimeSync from './realtimeSync';
import * as PresenceTracker from './presenceTracker';

// Re-export meeting collaboration functionality
export const joinMeeting = MeetingCollaboration.joinMeeting;
export const leaveMeeting = MeetingCollaboration.leaveMeeting;
export const updateUserPresence = MeetingCollaboration.updateUserPresence;
export const updateTypingStatus = MeetingCollaboration.updateTypingStatus;
export const subscribeToMeetingUpdates = MeetingCollaboration.subscribeToMeetingUpdates;
export const subscribeToMeetingStageUpdates = MeetingCollaboration.subscribeToMeetingStageUpdates;
export const subscribeToActionItemUpdates = MeetingCollaboration.subscribeToActionItemUpdates;
export const subscribeToParticipantUpdates = MeetingCollaboration.subscribeToParticipantUpdates;
export const updateMeetingStatus = MeetingCollaboration.updateMeetingStatus;
export const updateCurrentStage = MeetingCollaboration.updateCurrentStage;
export const updateStageContent = MeetingCollaboration.updateStageContent;
export const createActionItem = MeetingCollaboration.createActionItem;
export const updateActionItem = MeetingCollaboration.updateActionItem;
export const deleteActionItem = MeetingCollaboration.deleteActionItem;
export const startMeeting = MeetingCollaboration.startMeeting;
export const endMeeting = MeetingCollaboration.endMeeting;
export const pauseMeeting = MeetingCollaboration.pauseMeeting;
export const resumeMeeting = MeetingCollaboration.resumeMeeting;

// Re-export real-time synchronization functionality
export const syncDocument = RealtimeSync.syncDocument;
export const syncCollection = RealtimeSync.syncCollection;
export const updateSyncedDocument = RealtimeSync.updateSyncedDocument;
export const createSyncedDocument = RealtimeSync.createSyncedDocument;
export const deleteSyncedDocument = RealtimeSync.deleteSyncedDocument;
export const retryPendingOperations = RealtimeSync.retryPendingOperations;
export const resolveConflict = RealtimeSync.resolveConflict;
export const setupConnectionMonitoring = RealtimeSync.setupConnectionMonitoring;
export const clearCache = RealtimeSync.clearCache;

// Re-export presence tracking functionality
export const initializePresence = PresenceTracker.initializePresence;
export const updatePresence = PresenceTracker.updatePresence;
export const subscribeToUserPresence = PresenceTracker.subscribeToUserPresence;
export const subscribeToOrganizationPresence = PresenceTracker.subscribeToOrganizationPresence;
export const updateMeetingPresence = PresenceTracker.updateMeetingPresence;
export const subscribeMeetingPresence = PresenceTracker.subscribeMeetingPresence;
export const cleanupPresence = PresenceTracker.cleanupPresence;
export const isUserActive = PresenceTracker.isUserActive;