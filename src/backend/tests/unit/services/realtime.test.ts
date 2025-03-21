import { jest } from 'jest';
import { RealtimeService, FirestoreService } from '../../../src/services/realtime';
import { ValidationError, NotFoundError } from '../../../src/utils/errors';
import { MeetingStatus, ParticipantStatus } from '../../../src/types/meeting.types';
import { firestore, resetMockFirestoreData } from '../../mocks/firebaseMock';

// Mock FirestoreService
jest.mock('../../../src/services/realtime/firestoreService', () => {
  return {
    FirestoreService: jest.fn().mockImplementation(() => ({
      listenToDocument: jest.fn().mockReturnValue(() => {}),
      listenToQuery: jest.fn().mockReturnValue(() => {}),
      updateDocument: jest.fn().mockResolvedValue(undefined),
      queryDocuments: jest.fn().mockResolvedValue([]),
      getDocument: jest.fn().mockResolvedValue(null),
      updateMeetingStage: jest.fn().mockResolvedValue(undefined),
      updateParticipantPresence: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

describe('RealtimeService', () => {
  // Test data
  const mockMeetingData = {
    id: 'meeting-123',
    title: 'Daily Huddle',
    status: MeetingStatus.ACTIVE,
    participants: [
      { userId: 'user-1', status: ParticipantStatus.ACTIVE },
      { userId: 'user-2', status: ParticipantStatus.ACTIVE }
    ],
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  };

  const mockParticipantData = [
    { 
      id: 'user-1', 
      status: ParticipantStatus.ACTIVE, 
      lastSeen: new Date().toISOString() 
    },
    { 
      id: 'user-2', 
      status: ParticipantStatus.INACTIVE, 
      lastSeen: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
    }
  ];

  const mockNotificationData = {
    id: 'notification-123',
    userId: 'user-1',
    type: 'MEETING_REMINDER',
    content: 'Meeting starts in 5 minutes',
    read: false,
    createdAt: 'timestamp'
  };

  // Service instance for testing
  let realtimeService: RealtimeService;
  // Mock FirestoreService instance
  let mockFirestoreService: jest.Mocked<FirestoreService>;
  
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockFirestoreData();
    
    realtimeService = new RealtimeService();
    mockFirestoreService = (realtimeService as any).firestoreService;
  });

  // Test initialization
  it('should initialize correctly', () => {
    expect(realtimeService).toBeDefined();
    expect(mockFirestoreService).toBeDefined();
  });

  describe('subscribeToMeeting', () => {
    const onUpdateMock = jest.fn();
    const onErrorMock = jest.fn();
    
    it('should throw ValidationError if meetingId is not provided', () => {
      expect(() => {
        realtimeService.subscribeToMeeting('', onUpdateMock, onErrorMock);
      }).toThrow(ValidationError);
    });
    
    it('should throw ValidationError if onUpdate callback is not provided', () => {
      expect(() => {
        realtimeService.subscribeToMeeting('meeting-123', null as any, onErrorMock);
      }).toThrow(ValidationError);
    });
    
    it('should throw ValidationError if onError callback is not provided', () => {
      expect(() => {
        realtimeService.subscribeToMeeting('meeting-123', onUpdateMock, null as any);
      }).toThrow(ValidationError);
    });
    
    it('should return a subscription ID when successful', () => {
      const subscriptionId = realtimeService.subscribeToMeeting('meeting-123', onUpdateMock, onErrorMock);
      expect(subscriptionId).toEqual(expect.any(String));
      expect(subscriptionId).toContain('meeting-123');
    });
    
    it('should call FirestoreService.listenToDocument', () => {
      realtimeService.subscribeToMeeting('meeting-123', onUpdateMock, onErrorMock);
      expect(mockFirestoreService.listenToDocument).toHaveBeenCalledWith(
        'active-meetings',
        'meeting-123',
        expect.any(Function)
      );
    });
    
    it('should store the subscription for later unsubscribe', () => {
      const subscriptionId = realtimeService.subscribeToMeeting('meeting-123', onUpdateMock, onErrorMock);
      
      // Access private property to check if subscription was stored
      const meetingSubscriptions = (realtimeService as any).activeSubscriptions.get('meeting');
      expect(meetingSubscriptions.has(subscriptionId)).toBe(true);
    });
  });

  describe('unsubscribeFromMeeting', () => {
    let subscriptionId: string;
    const onUpdateMock = jest.fn();
    const onErrorMock = jest.fn();
    const unsubscribeMock = jest.fn();
    
    beforeEach(() => {
      // Setup a subscription to test unsubscribe
      mockFirestoreService.listenToDocument.mockReturnValueOnce(unsubscribeMock);
      subscriptionId = realtimeService.subscribeToMeeting('meeting-123', onUpdateMock, onErrorMock);
    });
    
    it('should throw ValidationError if meetingId is not provided', () => {
      expect(() => {
        realtimeService.unsubscribeFromMeeting('', subscriptionId);
      }).toThrow(ValidationError);
    });
    
    it('should throw ValidationError if subscriptionId is not provided', () => {
      expect(() => {
        realtimeService.unsubscribeFromMeeting('meeting-123', '');
      }).toThrow(ValidationError);
    });
    
    it('should return false if subscription does not exist', () => {
      const result = realtimeService.unsubscribeFromMeeting('meeting-123', 'non-existent-id');
      expect(result).toBe(false);
    });
    
    it('should call the unsubscribe function and return true when successful', () => {
      const result = realtimeService.unsubscribeFromMeeting('meeting-123', subscriptionId);
      
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should remove the subscription from internal storage', () => {
      realtimeService.unsubscribeFromMeeting('meeting-123', subscriptionId);
      
      // Access private property to check if subscription was removed
      const meetingSubscriptions = (realtimeService as any).activeSubscriptions.get('meeting');
      expect(meetingSubscriptions.has(subscriptionId)).toBe(false);
    });
  });

  describe('updateMeetingData', () => {
    it('should throw ValidationError if meetingId is not provided', async () => {
      await expect(realtimeService.updateMeetingData('', mockMeetingData, 'user-1'))
        .rejects.toThrow(ValidationError);
    });
    
    it('should throw ValidationError if data is not provided', async () => {
      await expect(realtimeService.updateMeetingData('meeting-123', null as any, 'user-1'))
        .rejects.toThrow(ValidationError);
    });
    
    it('should throw ValidationError if userId is not provided', async () => {
      await expect(realtimeService.updateMeetingData('meeting-123', mockMeetingData, ''))
        .rejects.toThrow(ValidationError);
    });
    
    it('should call FirestoreService.updateDocument with correct parameters', async () => {
      await realtimeService.updateMeetingData('meeting-123', mockMeetingData, 'user-1');
      
      expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith(
        'active-meetings',
        'meeting-123',
        expect.objectContaining({
          ...mockMeetingData,
          lastUpdatedBy: 'user-1',
          lastActivity: expect.any(Date)
        })
      );
    });
  });

  describe('updateMeetingStage', () => {
    const mockStageData = { content: 'Updated stage content' };
    
    it('should throw ValidationError if required parameters are missing', async () => {
      await expect(realtimeService.updateMeetingStage('', 'stage-1', mockStageData, 'user-1'))
        .rejects.toThrow(ValidationError);
        
      await expect(realtimeService.updateMeetingStage('meeting-123', '', mockStageData, 'user-1'))
        .rejects.toThrow(ValidationError);
        
      await expect(realtimeService.updateMeetingStage('meeting-123', 'stage-1', null as any, 'user-1'))
        .rejects.toThrow(ValidationError);
        
      await expect(realtimeService.updateMeetingStage('meeting-123', 'stage-1', mockStageData, ''))
        .rejects.toThrow(ValidationError);
    });
    
    it('should call FirestoreService.updateMeetingStage with correct parameters', async () => {
      await realtimeService.updateMeetingStage('meeting-123', 'stage-1', mockStageData, 'user-1');
      
      expect(mockFirestoreService.updateMeetingStage).toHaveBeenCalledWith(
        'meeting-123',
        'stage-1',
        mockStageData,
        'user-1'
      );
    });
  });

  describe('broadcastUserActivity', () => {
    const mockActivityData = { message: 'User is typing' };
    
    it('should throw ValidationError if required parameters are missing', async () => {
      await expect(realtimeService.broadcastUserActivity('', 'user-1', 'TYPING'))
        .rejects.toThrow(ValidationError);
        
      await expect(realtimeService.broadcastUserActivity('meeting-123', '', 'TYPING'))
        .rejects.toThrow(ValidationError);
        
      await expect(realtimeService.broadcastUserActivity('meeting-123', 'user-1', ''))
        .rejects.toThrow(ValidationError);
    });
    
    it('should call FirestoreService.updateDocument with correct parameters', async () => {
      await realtimeService.broadcastUserActivity('meeting-123', 'user-1', 'TYPING', mockActivityData);
      
      expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith(
        `active-meetings/meeting-123/activities`,
        expect.any(String), // Dynamic ID
        expect.objectContaining({
          type: 'TYPING',
          userId: 'user-1',
          timestamp: expect.any(Date),
          data: mockActivityData
        })
      );
    });
  });

  describe('getActiveMeetingParticipants', () => {
    beforeEach(() => {
      mockFirestoreService.queryDocuments.mockResolvedValue(mockParticipantData);
    });
    
    it('should throw ValidationError if meetingId is not provided', async () => {
      await expect(realtimeService.getActiveMeetingParticipants(''))
        .rejects.toThrow(ValidationError);
    });
    
    it('should call FirestoreService.queryDocuments with correct parameters', async () => {
      await realtimeService.getActiveMeetingParticipants('meeting-123');
      
      expect(mockFirestoreService.queryDocuments).toHaveBeenCalledWith(
        `active-meetings/meeting-123/participants`,
        {},
        expect.objectContaining({
          orderBy: expect.arrayContaining([
            expect.objectContaining({
              field: 'lastSeen',
              direction: 'desc'
            })
          ])
        })
      );
    });
    
    it('should filter and transform participant data correctly', async () => {
      const result = await realtimeService.getActiveMeetingParticipants('meeting-123');
      
      // Should only include active participants (less than 5 minutes old)
      expect(result.length).toBe(1);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].status).toBe(mockParticipantData[0].status);
      expect(result[0].lastActive).toBeInstanceOf(Date);
    });
  });

  describe('subscribeToNotifications', () => {
    const onNotificationMock = jest.fn();
    const onErrorMock = jest.fn();
    
    it('should throw ValidationError if required parameters are missing', () => {
      expect(() => {
        realtimeService.subscribeToNotifications('', onNotificationMock, onErrorMock);
      }).toThrow(ValidationError);
      
      expect(() => {
        realtimeService.subscribeToNotifications('user-1', null as any, onErrorMock);
      }).toThrow(ValidationError);
      
      expect(() => {
        realtimeService.subscribeToNotifications('user-1', onNotificationMock, null as any);
      }).toThrow(ValidationError);
    });
    
    it('should call FirestoreService.listenToQuery with correct parameters', () => {
      realtimeService.subscribeToNotifications('user-1', onNotificationMock, onErrorMock);
      
      expect(mockFirestoreService.listenToQuery).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          userId: 'user-1',
          status: 'UNREAD'
        }),
        expect.any(Function),
        expect.objectContaining({
          orderBy: expect.arrayContaining([
            expect.objectContaining({
              field: 'createdAt',
              direction: 'desc'
            })
          ])
        })
      );
    });
    
    it('should return a subscription ID when successful', () => {
      const subscriptionId = realtimeService.subscribeToNotifications('user-1', onNotificationMock, onErrorMock);
      
      expect(subscriptionId).toEqual(expect.any(String));
      expect(subscriptionId).toContain('user-1');
      expect(subscriptionId).toContain('notifications');
    });
  });

  describe('unsubscribeFromNotifications', () => {
    let subscriptionId: string;
    const onNotificationMock = jest.fn();
    const onErrorMock = jest.fn();
    const unsubscribeMock = jest.fn();
    
    beforeEach(() => {
      // Setup a subscription to test unsubscribe
      mockFirestoreService.listenToQuery.mockReturnValueOnce(unsubscribeMock);
      subscriptionId = realtimeService.subscribeToNotifications('user-1', onNotificationMock, onErrorMock);
    });
    
    it('should throw ValidationError if required parameters are missing', () => {
      expect(() => {
        realtimeService.unsubscribeFromNotifications('', subscriptionId);
      }).toThrow(ValidationError);
      
      expect(() => {
        realtimeService.unsubscribeFromNotifications('user-1', '');
      }).toThrow(ValidationError);
    });
    
    it('should return false if subscription does not exist', () => {
      const result = realtimeService.unsubscribeFromNotifications('user-1', 'non-existent-id');
      expect(result).toBe(false);
    });
    
    it('should call the unsubscribe function and return true when successful', () => {
      const result = realtimeService.unsubscribeFromNotifications('user-1', subscriptionId);
      
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('trackUserPresence', () => {
    it('should throw ValidationError if required parameters are missing', async () => {
      await expect(realtimeService.trackUserPresence('', ParticipantStatus.ACTIVE, 'meeting-123'))
        .rejects.toThrow(ValidationError);
        
      await expect(realtimeService.trackUserPresence('user-1', '' as any, 'meeting-123'))
        .rejects.toThrow(ValidationError);
        
      await expect(realtimeService.trackUserPresence('user-1', ParticipantStatus.ACTIVE, ''))
        .rejects.toThrow(ValidationError);
    });
    
    it('should update internal presence map and call FirestoreService.updateParticipantPresence for meeting context', async () => {
      await realtimeService.trackUserPresence('user-1', ParticipantStatus.ACTIVE, 'meeting-123');
      
      // Check that internal map was updated
      const contextMap = (realtimeService as any).userPresenceMap.get('meeting-123');
      expect(contextMap.get('user-1')).toBeDefined();
      expect(contextMap.get('user-1').status).toBe(ParticipantStatus.ACTIVE);
      expect(contextMap.get('user-1').lastActive).toBeInstanceOf(Date);
      
      // Check that Firestore service was called
      expect(mockFirestoreService.updateParticipantPresence).toHaveBeenCalledWith(
        'meeting-123',
        'user-1',
        ParticipantStatus.ACTIVE
      );
    });
    
    it('should update internal presence map and call FirestoreService.updateDocument for global context', async () => {
      await realtimeService.trackUserPresence('user-1', 'online', 'global');
      
      // Check that internal map was updated
      const contextMap = (realtimeService as any).userPresenceMap.get('global');
      expect(contextMap.get('user-1')).toBeDefined();
      expect(contextMap.get('user-1').status).toBe('online');
      expect(contextMap.get('user-1').lastActive).toBeInstanceOf(Date);
      
      // Check that Firestore service was called
      expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith(
        'user-presence',
        'user-1',
        expect.objectContaining({
          status: 'online',
          lastSeen: expect.any(Date)
        })
      );
    });
  });

  describe('getUserPresence', () => {
    const mockPresenceData = {
      status: ParticipantStatus.ACTIVE,
      lastSeen: new Date().toISOString()
    };
    
    beforeEach(() => {
      // Setup some presence data in the internal map
      (realtimeService as any).userPresenceMap.set('meeting-123', new Map());
      (realtimeService as any).userPresenceMap.get('meeting-123').set('user-1', {
        status: ParticipantStatus.ACTIVE,
        lastActive: new Date()
      });
      
      // Mock Firestore response for when internal cache doesn't have data
      mockFirestoreService.getDocument.mockResolvedValue(mockPresenceData);
    });
    
    it('should throw ValidationError if required parameters are missing', async () => {
      await expect(realtimeService.getUserPresence('', 'meeting-123'))
        .rejects.toThrow(ValidationError);
        
      await expect(realtimeService.getUserPresence('user-1', ''))
        .rejects.toThrow(ValidationError);
    });
    
    it('should return presence from internal map if available', async () => {
      const result = await realtimeService.getUserPresence('user-1', 'meeting-123');
      
      expect(result).toBeDefined();
      expect(result?.status).toBe(ParticipantStatus.ACTIVE);
      expect(result?.lastActive).toBeInstanceOf(Date);
      
      // Should not have queried Firestore
      expect(mockFirestoreService.getDocument).not.toHaveBeenCalled();
    });
    
    it('should query Firestore if not in internal map', async () => {
      // Test with a user ID not in the internal map
      const result = await realtimeService.getUserPresence('other-user', 'meeting-123');
      
      expect(mockFirestoreService.getDocument).toHaveBeenCalledWith(
        `active-meetings/meeting-123/participants`,
        'other-user'
      );
      
      expect(result).toBeDefined();
      expect(result?.status).toBe(mockPresenceData.status);
    });
    
    it('should return null if user presence not found in Firestore', async () => {
      // Mock Firestore to return null for this test
      mockFirestoreService.getDocument.mockResolvedValueOnce(null);
      
      const result = await realtimeService.getUserPresence('not-found-user', 'meeting-123');
      expect(result).toBeNull();
    });
  });

  describe('subscribeToUserPresence', () => {
    const onPresenceChangeMock = jest.fn();
    const onErrorMock = jest.fn();
    
    it('should throw ValidationError if required parameters are missing', () => {
      expect(() => {
        realtimeService.subscribeToUserPresence('', 'meeting-123', onPresenceChangeMock, onErrorMock);
      }).toThrow(ValidationError);
      
      expect(() => {
        realtimeService.subscribeToUserPresence('user-1', '', onPresenceChangeMock, onErrorMock);
      }).toThrow(ValidationError);
      
      expect(() => {
        realtimeService.subscribeToUserPresence('user-1', 'meeting-123', null as any, onErrorMock);
      }).toThrow(ValidationError);
      
      expect(() => {
        realtimeService.subscribeToUserPresence('user-1', 'meeting-123', onPresenceChangeMock, null as any);
      }).toThrow(ValidationError);
    });
    
    it('should call FirestoreService.listenToDocument with correct parameters for meeting context', () => {
      realtimeService.subscribeToUserPresence('user-1', 'meeting-123', onPresenceChangeMock, onErrorMock);
      
      expect(mockFirestoreService.listenToDocument).toHaveBeenCalledWith(
        `active-meetings/meeting-123/participants`,
        'user-1',
        expect.any(Function)
      );
    });
    
    it('should call FirestoreService.listenToDocument with correct parameters for global context', () => {
      realtimeService.subscribeToUserPresence('user-1', 'global', onPresenceChangeMock, onErrorMock);
      
      expect(mockFirestoreService.listenToDocument).toHaveBeenCalledWith(
        'user-presence',
        'user-1',
        expect.any(Function)
      );
    });
    
    it('should return a subscription ID when successful', () => {
      const subscriptionId = realtimeService.subscribeToUserPresence(
        'user-1', 
        'meeting-123', 
        onPresenceChangeMock, 
        onErrorMock
      );
      
      expect(subscriptionId).toEqual(expect.any(String));
      expect(subscriptionId).toContain('user-1');
      expect(subscriptionId).toContain('meeting-123');
      expect(subscriptionId).toContain('presence');
    });
  });

  describe('resolveConflicts', () => {
    const currentData = {
      id: 'item-1',
      title: 'Original Title',
      updatedAt: new Date(2023, 0, 1).toISOString()
    };
    
    const newerData = {
      id: 'item-1',
      title: 'Updated Title',
      updatedAt: new Date(2023, 0, 2).toISOString()
    };
    
    const olderData = {
      id: 'item-1',
      title: 'Older Title',
      updatedAt: new Date(2022, 11, 31).toISOString()
    };
    
    it('should throw ValidationError if required parameters are missing', () => {
      expect(() => {
        realtimeService.resolveConflicts(null as any, newerData, 'entity');
      }).toThrow(ValidationError);
      
      expect(() => {
        realtimeService.resolveConflicts(currentData, null as any, 'entity');
      }).toThrow(ValidationError);
      
      expect(() => {
        realtimeService.resolveConflicts(currentData, newerData, '');
      }).toThrow(ValidationError);
    });
    
    it('should use last-write-wins strategy for general data', () => {
      // Newer data should win
      let result = realtimeService.resolveConflicts(currentData, newerData, 'entity');
      expect(result.title).toBe('Updated Title');
      
      // Older data should not win
      result = realtimeService.resolveConflicts(currentData, olderData, 'entity');
      expect(result.title).toBe('Original Title');
    });
    
    it('should merge participant lists for meeting data', () => {
      const currentMeeting = {
        ...currentData,
        participants: [
          { userId: 'user-1', status: 'ACTIVE' },
          { userId: 'user-2', status: 'ACTIVE' }
        ]
      };
      
      const newMeeting = {
        ...newerData,
        participants: [
          { userId: 'user-2', status: 'INACTIVE' }, // Updated status
          { userId: 'user-3', status: 'ACTIVE' }    // New participant
        ]
      };
      
      const result = realtimeService.resolveConflicts(currentMeeting, newMeeting, 'meeting');
      
      // Should have all 3 participants
      expect(result.participants.length).toBe(3);
      
      // Check user-2's status is updated (since new data is newer)
      const user2 = result.participants.find(p => p.userId === 'user-2');
      expect(user2?.status).toBe('INACTIVE');
      
      // Check user-3 was added
      const user3 = result.participants.find(p => p.userId === 'user-3');
      expect(user3).toBeDefined();
    });
    
    it('should preserve history for metric data', () => {
      const currentMetric = {
        ...currentData,
        value: 100,
        history: [
          { timestamp: '2023-01-01T00:00:00Z', value: 80 },
          { timestamp: '2023-01-02T00:00:00Z', value: 90 }
        ]
      };
      
      const newMetric = {
        ...newerData,
        value: 110,
        history: [
          { timestamp: '2023-01-02T00:00:00Z', value: 90 }, // Same as current
          { timestamp: '2023-01-03T00:00:00Z', value: 110 } // New entry
        ]
      };
      
      const result = realtimeService.resolveConflicts(currentMetric, newMetric, 'metric');
      
      // Value should be updated
      expect(result.value).toBe(110);
      
      // Should have 3 unique history entries (combined and sorted)
      expect(result.history.length).toBe(3);
      
      // First entry
      expect(result.history[0].timestamp).toBe('2023-01-01T00:00:00Z');
      expect(result.history[0].value).toBe(80);
      
      // Last entry
      expect(result.history[2].timestamp).toBe('2023-01-03T00:00:00Z');
      expect(result.history[2].value).toBe(110);
    });
  });

  describe('cleanup', () => {
    const unsubscribe1 = jest.fn();
    const unsubscribe2 = jest.fn();
    
    beforeEach(() => {
      // Setup multiple subscriptions for testing cleanup
      mockFirestoreService.listenToDocument.mockReturnValueOnce(unsubscribe1);
      mockFirestoreService.listenToDocument.mockReturnValueOnce(unsubscribe2);
      
      // Create subscriptions
      realtimeService.subscribeToMeeting('meeting-1', jest.fn(), jest.fn());
      realtimeService.subscribeToMeeting('meeting-2', jest.fn(), jest.fn());
    });
    
    it('should unsubscribe from all active subscriptions', async () => {
      await realtimeService.cleanup();
      
      expect(unsubscribe1).toHaveBeenCalled();
      expect(unsubscribe2).toHaveBeenCalled();
    });
    
    it('should clear internal subscription maps', async () => {
      await realtimeService.cleanup();
      
      // Check that maps are cleared
      expect((realtimeService as any).activeSubscriptions.size).toBe(0);
      expect((realtimeService as any).userPresenceMap.size).toBe(0);
    });
    
    it('should handle errors during unsubscribe gracefully', async () => {
      // Mock one unsubscribe to throw an error
      unsubscribe1.mockImplementationOnce(() => {
        throw new Error('Unsubscribe error');
      });
      
      // Cleanup should complete without throwing
      await expect(realtimeService.cleanup()).resolves.not.toThrow();
      
      // Second unsubscribe should still be called
      expect(unsubscribe2).toHaveBeenCalled();
    });
  });
});