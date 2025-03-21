import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as meetingCollaboration from '../meetingCollaboration';
import * as presenceTracker from '../presenceTracker';
import * as realtimeSync from '../realtimeSync';
import * as firebaseFirestore from '../../firebase/firebaseFirestore';
import * as firebaseAuth from '../../firebase/firebaseAuth';
import { FirestoreCollections } from '../../../types/firebase.types';
import { MeetingStatus, MeetingStageType, ParticipantRole, ParticipantStatus } from '../../../types/meeting.types';
import { ActionItemStatus } from '../../../types/action-item.types';
import { resetMockFirebase, setMockCurrentUser, triggerMockSnapshot } from '../../../../tests/mocks/firebaseMocks';

// Helper function to create a mock meeting
const createMockMeeting = (overrides = {}) => {
  return {
    id: 'test-meeting-id',
    title: 'Test Meeting',
    description: 'Test meeting description',
    status: MeetingStatus.SCHEDULED,
    currentStage: null,
    organizationId: 'test-org-id',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // 1 hour later
    createdById: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

// Helper function to create a mock meeting stage
const createMockMeetingStage = (overrides = {}) => {
  return {
    id: 'test-stage-id',
    meetingId: 'test-meeting-id',
    stageType: MeetingStageType.GOOD_NEWS,
    content: 'Test stage content',
    sequence: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
    ...overrides
  };
};

// Helper function to create a mock action item
const createMockActionItem = (overrides = {}) => {
  return {
    id: 'test-action-item-id',
    meetingId: 'test-meeting-id',
    description: 'Test action item',
    assigneeId: 'test-assignee-id',
    status: ActionItemStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    ...overrides
  };
};

// Helper function to create a mock participant
const createMockParticipant = (overrides = {}) => {
  return {
    userId: 'test-user-id',
    displayName: 'Test User',
    role: ParticipantRole.PARTICIPANT,
    status: ParticipantStatus.ONLINE,
    isTyping: false,
    lastActive: new Date(),
    ...overrides
  };
};

describe('Meeting Collaboration Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    resetMockFirebase();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe('joinMeeting', () => {
    it('should join a user to a meeting and update presence', async () => {
      // Mock dependencies
      const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
      vi.spyOn(firebaseAuth, 'getCurrentUser').mockReturnValue(mockUser);
      vi.spyOn(presenceTracker, 'updateMeetingPresence').mockResolvedValue();
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Call the function
      await meetingCollaboration.joinMeeting(
        'test-meeting-id',
        'test-user-id',
        ParticipantRole.PARTICIPANT
      );

      // Verify the correct functions were called
      expect(presenceTracker.updateMeetingPresence).toHaveBeenCalledWith(
        'test-meeting-id',
        'test-user-id',
        'online'
      );
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalled();
    });

    it('should throw an error if user authentication mismatch', async () => {
      // Mock getCurrentUser to return a different user
      vi.spyOn(firebaseAuth, 'getCurrentUser').mockReturnValue({ uid: 'different-user-id', email: 'different@example.com' });

      // Call the function and expect it to throw
      await expect(
        meetingCollaboration.joinMeeting(
          'test-meeting-id',
          'test-user-id',
          ParticipantRole.PARTICIPANT
        )
      ).rejects.toThrow('User authentication mismatch');
    });
  });

  describe('leaveMeeting', () => {
    it('should remove a user from a meeting and update presence', async () => {
      // Mock dependencies
      vi.spyOn(presenceTracker, 'updateMeetingPresence').mockResolvedValue();
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Call the function
      await meetingCollaboration.leaveMeeting('test-meeting-id', 'test-user-id');

      // Verify the correct functions were called
      expect(presenceTracker.updateMeetingPresence).toHaveBeenCalledWith(
        'test-meeting-id',
        'test-user-id',
        'offline'
      );
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalled();
    });
  });

  describe('updateUserPresence', () => {
    it('should update a user\'s presence status in a meeting', async () => {
      // Mock dependencies
      vi.spyOn(presenceTracker, 'updateMeetingPresence').mockResolvedValue();
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Call the function
      await meetingCollaboration.updateUserPresence(
        'test-meeting-id',
        'test-user-id',
        ParticipantStatus.AWAY
      );

      // Verify the correct functions were called
      expect(presenceTracker.updateMeetingPresence).toHaveBeenCalledWith(
        'test-meeting-id',
        'test-user-id',
        ParticipantStatus.AWAY
      );
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalled();
    });
  });

  describe('updateTypingStatus', () => {
    it('should update a user\'s typing status in a meeting', async () => {
      // Mock dependencies
      vi.spyOn(presenceTracker, 'updateTypingStatus').mockResolvedValue();

      // Call the function
      await meetingCollaboration.updateTypingStatus(
        'test-meeting-id',
        'test-user-id',
        true
      );

      // Verify the correct functions were called
      expect(presenceTracker.updateTypingStatus).toHaveBeenCalledWith(
        'test-meeting-id',
        'test-user-id',
        true
      );
    });
  });

  describe('subscribeToMeetingUpdates', () => {
    it('should subscribe to meeting updates and call callback on changes', () => {
      // Mock data and dependencies
      const mockMeeting = createMockMeeting();
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      vi.spyOn(firebaseFirestore, 'subscribeToMeeting').mockImplementation((meetingId, callback, errorCallback) => {
        callback(mockMeeting);
        return mockUnsubscribe;
      });

      // Call the function
      const unsubscribe = meetingCollaboration.subscribeToMeetingUpdates(
        'test-meeting-id',
        mockCallback,
        mockErrorCallback
      );

      // Verify the correct functions were called
      expect(firebaseFirestore.subscribeToMeeting).toHaveBeenCalledWith(
        'test-meeting-id',
        expect.any(Function),
        mockErrorCallback
      );
      expect(mockCallback).toHaveBeenCalledWith(mockMeeting);
      
      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle errors when subscribing to meeting updates', () => {
      // Mock dependencies
      const mockError = new Error('Subscription error');
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      
      vi.spyOn(firebaseFirestore, 'subscribeToMeeting').mockImplementation((meetingId, callback, errorCallback) => {
        errorCallback(mockError);
        return vi.fn();
      });

      // Call the function
      meetingCollaboration.subscribeToMeetingUpdates(
        'test-meeting-id',
        mockCallback,
        mockErrorCallback
      );

      // Verify error handling
      expect(mockErrorCallback).toHaveBeenCalledWith(mockError);
    });
  });

  describe('subscribeToMeetingStageUpdates', () => {
    it('should subscribe to meeting stage updates and call callback on changes', () => {
      // Mock data and dependencies
      const mockStages = [createMockMeetingStage(), createMockMeetingStage({ id: 'stage-2', sequence: 2 })];
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      vi.spyOn(firebaseFirestore, 'subscribeToMeetingStages').mockImplementation((meetingId, callback, errorCallback) => {
        callback(mockStages);
        return mockUnsubscribe;
      });

      // Call the function
      const unsubscribe = meetingCollaboration.subscribeToMeetingStageUpdates(
        'test-meeting-id',
        mockCallback,
        mockErrorCallback
      );

      // Verify the correct functions were called
      expect(firebaseFirestore.subscribeToMeetingStages).toHaveBeenCalledWith(
        'test-meeting-id',
        expect.any(Function),
        mockErrorCallback
      );
      expect(mockCallback).toHaveBeenCalledWith(mockStages);
      
      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('subscribeToActionItemUpdates', () => {
    it('should subscribe to action item updates and call callback on changes', () => {
      // Mock data and dependencies
      const mockActionItems = [createMockActionItem(), createMockActionItem({ id: 'action-2' })];
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      vi.spyOn(firebaseFirestore, 'subscribeToActionItems').mockImplementation((meetingId, callback, errorCallback) => {
        callback(mockActionItems);
        return mockUnsubscribe;
      });

      // Call the function
      const unsubscribe = meetingCollaboration.subscribeToActionItemUpdates(
        'test-meeting-id',
        mockCallback,
        mockErrorCallback
      );

      // Verify the correct functions were called
      expect(firebaseFirestore.subscribeToActionItems).toHaveBeenCalledWith(
        'test-meeting-id',
        expect.any(Function),
        mockErrorCallback
      );
      expect(mockCallback).toHaveBeenCalledWith(mockActionItems);
      
      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('subscribeToParticipantUpdates', () => {
    it('should subscribe to participant updates and call callback on changes', () => {
      // Mock data and dependencies
      const mockParticipants = [createMockParticipant(), createMockParticipant({ userId: 'user-2' })];
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      vi.spyOn(presenceTracker, 'subscribeMeetingPresence').mockImplementation((meetingId, callback, errorCallback) => {
        callback(mockParticipants);
        return mockUnsubscribe;
      });

      // Call the function
      const unsubscribe = meetingCollaboration.subscribeToParticipantUpdates(
        'test-meeting-id',
        mockCallback,
        mockErrorCallback
      );

      // Verify the correct functions were called
      expect(presenceTracker.subscribeMeetingPresence).toHaveBeenCalledWith(
        'test-meeting-id',
        expect.any(Function),
        mockErrorCallback
      );
      expect(mockCallback).toHaveBeenCalled();
      
      // Test unsubscribe
      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('updateMeetingStatus', () => {
    it('should update the status of a meeting', async () => {
      // Mock dependencies
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Call the function
      await meetingCollaboration.updateMeetingStatus('test-meeting-id', MeetingStatus.IN_PROGRESS);

      // Verify the correct functions were called
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTIVE_MEETINGS,
        'test-meeting-id',
        expect.objectContaining({
          status: MeetingStatus.IN_PROGRESS,
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  describe('updateCurrentStage', () => {
    it('should update the current stage of a meeting', async () => {
      // Mock dependencies
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();
      vi.spyOn(realtimeSync, 'syncDocument').mockResolvedValue(createMockMeeting());
      vi.spyOn(realtimeSync, 'syncCollection').mockResolvedValue([createMockMeetingStage()]);

      // Call the function
      await meetingCollaboration.updateCurrentStage('test-meeting-id', MeetingStageType.GOOD_NEWS);

      // Verify the correct functions were called
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTIVE_MEETINGS,
        'test-meeting-id',
        expect.objectContaining({
          currentStage: MeetingStageType.GOOD_NEWS,
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  describe('updateStageContent', () => {
    it('should update the content of a specific meeting stage', async () => {
      // Mock dependencies
      const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
      vi.spyOn(firebaseAuth, 'getCurrentUser').mockReturnValue(mockUser);
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Call the function
      await meetingCollaboration.updateStageContent(
        'test-meeting-id',
        'test-stage-id',
        'Updated content'
      );

      // Verify the correct functions were called
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.MEETING_STAGES,
        'test-stage-id',
        expect.objectContaining({
          content: 'Updated content',
          updatedAt: expect.any(Date),
          updatedBy: 'test-user-id'
        })
      );
    });

    it('should throw an error if no authenticated user is found', async () => {
      // Mock getCurrentUser to return null
      vi.spyOn(firebaseAuth, 'getCurrentUser').mockReturnValue(null);

      // Call the function and expect it to throw
      await expect(
        meetingCollaboration.updateStageContent(
          'test-meeting-id',
          'test-stage-id',
          'Updated content'
        )
      ).rejects.toThrow('No authenticated user found');
    });
  });

  describe('createActionItem', () => {
    it('should create a new action item in a meeting', async () => {
      // Mock dependencies
      const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
      vi.spyOn(firebaseAuth, 'getCurrentUser').mockReturnValue(mockUser);
      vi.spyOn(realtimeSync, 'createSyncedDocument').mockResolvedValue('new-action-item-id');

      // Create a mock action item
      const mockActionItem = {
        description: 'New action item',
        assigneeId: 'test-assignee-id'
      };

      // Call the function
      const result = await meetingCollaboration.createActionItem('test-meeting-id', mockActionItem);

      // Verify the correct functions were called
      expect(realtimeSync.createSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTION_ITEMS,
        expect.objectContaining({
          description: 'New action item',
          assigneeId: 'test-assignee-id',
          meetingId: 'test-meeting-id',
          status: ActionItemStatus.PENDING,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          createdBy: 'test-user-id'
        })
      );

      // Verify the result
      expect(result).toBe('new-action-item-id');
    });

    it('should throw an error if no authenticated user is found', async () => {
      // Mock getCurrentUser to return null
      vi.spyOn(firebaseAuth, 'getCurrentUser').mockReturnValue(null);

      // Call the function and expect it to throw
      await expect(
        meetingCollaboration.createActionItem('test-meeting-id', { description: 'Test' })
      ).rejects.toThrow('No authenticated user found');
    });
  });

  describe('updateActionItem', () => {
    it('should update an existing action item', async () => {
      // Mock dependencies
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Create update data
      const updateData = {
        description: 'Updated description',
        status: ActionItemStatus.IN_PROGRESS
      };

      // Call the function
      await meetingCollaboration.updateActionItem('test-action-item-id', updateData);

      // Verify the correct functions were called
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTION_ITEMS,
        'test-action-item-id',
        expect.objectContaining({
          description: 'Updated description',
          status: ActionItemStatus.IN_PROGRESS,
          updatedAt: expect.any(Date)
        })
      );
    });

    it('should add completedAt timestamp when status is updated to COMPLETED', async () => {
      // Mock dependencies
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Create update data with completed status
      const updateData = {
        status: ActionItemStatus.COMPLETED
      };

      // Call the function
      await meetingCollaboration.updateActionItem('test-action-item-id', updateData);

      // Verify the correct functions were called with completedAt timestamp
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTION_ITEMS,
        'test-action-item-id',
        expect.objectContaining({
          status: ActionItemStatus.COMPLETED,
          completedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  describe('deleteActionItem', () => {
    it('should delete an action item from a meeting', async () => {
      // Mock dependencies
      vi.spyOn(realtimeSync, 'deleteSyncedDocument').mockResolvedValue();

      // Call the function
      await meetingCollaboration.deleteActionItem('test-action-item-id');

      // Verify the correct functions were called
      expect(realtimeSync.deleteSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTION_ITEMS,
        'test-action-item-id'
      );
    });
  });

  describe('startMeeting', () => {
    it('should start a meeting and initialize real-time collaboration', async () => {
      // Mock dependencies
      const mockUser = { uid: 'test-user-id', email: 'test@example.com' };
      vi.spyOn(firebaseAuth, 'getCurrentUser').mockReturnValue(mockUser);
      vi.spyOn(meetingCollaboration, 'updateMeetingStatus').mockResolvedValue();
      vi.spyOn(meetingCollaboration, 'updateCurrentStage').mockResolvedValue();
      vi.spyOn(realtimeSync, 'syncCollection').mockResolvedValue([]);
      vi.spyOn(realtimeSync, 'createSyncedDocument').mockResolvedValue('stage-id');

      // Call the function
      await meetingCollaboration.startMeeting('test-meeting-id');

      // Verify the meeting status was updated
      expect(meetingCollaboration.updateMeetingStatus).toHaveBeenCalledWith(
        'test-meeting-id',
        MeetingStatus.IN_PROGRESS
      );

      // Verify the current stage was set
      expect(meetingCollaboration.updateCurrentStage).toHaveBeenCalledWith(
        'test-meeting-id',
        MeetingStageType.GOOD_NEWS
      );
    });
  });

  describe('endMeeting', () => {
    it('should end a meeting and finalize data', async () => {
      // Mock dependencies
      vi.spyOn(meetingCollaboration, 'updateMeetingStatus').mockResolvedValue();
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();
      vi.spyOn(realtimeSync, 'syncCollection').mockResolvedValue([createMockMeetingStage()]);

      // Call the function
      await meetingCollaboration.endMeeting('test-meeting-id');

      // Verify the meeting status was updated
      expect(meetingCollaboration.updateMeetingStatus).toHaveBeenCalledWith(
        'test-meeting-id',
        MeetingStatus.COMPLETED
      );

      // Verify completedAt timestamp was set
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTIVE_MEETINGS,
        'test-meeting-id',
        expect.objectContaining({
          completedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  describe('pauseMeeting', () => {
    it('should pause a meeting temporarily', async () => {
      // Mock dependencies
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Call the function
      await meetingCollaboration.pauseMeeting('test-meeting-id');

      // Verify the correct functions were called
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTIVE_MEETINGS,
        'test-meeting-id',
        expect.objectContaining({
          isPaused: true,
          pausedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  describe('resumeMeeting', () => {
    it('should resume a paused meeting', async () => {
      // Mock dependencies
      vi.spyOn(realtimeSync, 'updateSyncedDocument').mockResolvedValue();

      // Call the function
      await meetingCollaboration.resumeMeeting('test-meeting-id');

      // Verify the correct functions were called
      expect(realtimeSync.updateSyncedDocument).toHaveBeenCalledWith(
        FirestoreCollections.ACTIVE_MEETINGS,
        'test-meeting-id',
        expect.objectContaining({
          isPaused: false,
          resumedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      );
    });
  });

  // Error handling tests
  describe('error handling', () => {
    it('should handle errors when joining meetings', async () => {
      // Mock getCurrentUser to throw an error
      vi.spyOn(firebaseAuth, 'getCurrentUser').mockImplementation(() => {
        throw new Error('Authentication error');
      });

      // Call the function and expect it to throw
      await expect(
        meetingCollaboration.joinMeeting(
          'test-meeting-id',
          'test-user-id',
          ParticipantRole.PARTICIPANT
        )
      ).rejects.toThrow('Authentication error');
    });

    it('should handle errors when subscribing to updates', () => {
      // Mock subscribeToMeeting to throw an error
      vi.spyOn(firebaseFirestore, 'subscribeToMeeting').mockImplementation(() => {
        throw new Error('Subscription error');
      });

      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();

      // Call the function
      meetingCollaboration.subscribeToMeetingUpdates(
        'test-meeting-id',
        mockCallback,
        mockErrorCallback
      );

      // Verify the error was handled
      expect(mockErrorCallback).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});