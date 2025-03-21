# src/backend/tests/unit/services/meeting.test.ts
```typescript
import { MeetingService } from '../../../src/services/meeting/meetingService';
import { MeetingRepository } from '../../../src/repositories/meetingRepository';
import { MeetingParticipantRepository } from '../../../src/repositories/meetingParticipantRepository';
import { MeetingStageService } from '../../../src/services/meeting/meetingStageService';
import { ActionItemService } from '../../../src/services/meeting/actionItemService';
import { MeetingCollaborationService } from '../../../src/services/meeting/meetingCollaborationService';
import { GoogleCalendarService } from '../../../src/services/calendar/googleCalendarService';
import { MicrosoftCalendarService } from '../../../src/services/calendar/microsoftCalendarService';
import { NotificationService } from '../../../src/services/notification/notificationService';
import { RealtimeService } from '../../../src/services/realtime/realtimeService';
import { UserRepository } from '../../../src/repositories/userRepository';
import { Meeting, MeetingWithRelations, MeetingType, MeetingStatus, MeetingStageType, CreateMeetingDto, UpdateMeetingDto, AddParticipantsDto, RemoveParticipantsDto, UpdateMeetingParticipantDto, ParticipantRole } from '../../../src/types/meeting.types';
import { NotFoundError, ValidationError, AuthorizationError } from '../../../src/utils/errors';
import { mockMeeting, mockMeetingWithRelations, mockDailyMeeting, mockWeeklyMeeting, mockScheduledMeeting, mockInProgressMeeting, mockCompletedMeeting, mockMeetingParticipant, mockMeetingParticipants, mockMeetingStage, mockMeetingStages, mockMeetings, generateMockMeeting, generateMockMeetingWithRelations } from '../../fixtures/meetings';
import { mockUser, mockUsers, mockOrganization } from '../../fixtures/users';
import { jest } from '@jest/globals'; // version: ^29.5.0

/**
 * Creates mock implementations for all dependencies of the MeetingService
 */
const createMeetingServiceMocks = () => {
  // Create mock implementations for all repository dependencies
  const meetingRepositoryMock = {
    findById: jest.fn(),
    findByFilters: jest.fn(),
    findUpcoming: jest.fn(),
    findActive: jest.fn(),
    findByParticipant: jest.fn(),
    createWithParticipants: jest.fn(),
    updateStatus: jest.fn(),
    updateCurrentStage: jest.fn(),
    getMeetingSummary: jest.fn(),
    updateCalendarEventIds: jest.fn()
  };

  const meetingParticipantRepositoryMock = {
    findByMeetingId: jest.fn(),
    addParticipants: jest.fn(),
    removeParticipants: jest.fn(),
    updateParticipant: jest.fn()
  };

  const meetingStageServiceMock = {
    createStagesForMeeting: jest.fn(),
    getStagesByMeetingId: jest.fn(),
    moveToNextStage: jest.fn(),
    moveToPreviousStage: jest.fn(),
    jumpToStage: jest.fn(),
    completeMeeting: jest.fn()
  };

  const actionItemServiceMock = {
    getActionItemsByMeeting: jest.fn(),
    createActionItem: jest.fn(),
    syncActionItemsWithRealtime: jest.fn()
  };

  const meetingCollaborationServiceMock = {
    initializeMeetingCollaboration: jest.fn(),
    joinMeeting: jest.fn(),
    leaveMeeting: jest.fn(),
    completeMeeting: jest.fn()
  };

  const googleCalendarServiceMock = {
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn()
  };

  const microsoftCalendarServiceMock = {
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn()
  };

  const notificationServiceMock = {
    createNotification: jest.fn(),
		sendHighPriorityNotification: jest.fn()
  };

  const realtimeServiceMock = {
    updateMeetingData: jest.fn()
  };

  const userRepositoryMock = {
    findById: jest.fn(),
    findByIds: jest.fn()
  };

  // Initialize a MeetingService instance with the mocked dependencies
  const meetingService = new MeetingService(
    meetingRepositoryMock as any,
    meetingParticipantRepositoryMock as any,
    meetingStageServiceMock as any,
    actionItemServiceMock as any,
    meetingCollaborationServiceMock as any,
    googleCalendarServiceMock as any,
    microsoftCalendarServiceMock as any,
    notificationServiceMock as any,
    realtimeServiceMock as any,
    userRepositoryMock as any
  );

  return {
    meetingRepositoryMock,
    meetingParticipantRepositoryMock,
    meetingStageServiceMock,
    actionItemServiceMock,
    meetingCollaborationServiceMock,
    googleCalendarServiceMock,
    microsoftCalendarServiceMock,
    notificationServiceMock,
    realtimeServiceMock,
    userRepositoryMock,
    meetingService
  };
};

describe('MeetingService', () => {
  describe('getMeetingById', () => {
    it('should return a meeting by ID', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);

      // Act
      const meeting = await meetingService.getMeetingById(mockMeeting.id, mockOrganization.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meeting).toEqual(mockMeeting);
    });

    it('should throw NotFoundError if meeting not found', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(meetingService.getMeetingById('non-existent-id', mockOrganization.id)).rejects.toThrow(NotFoundError);
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith('non-existent-id', {});
    });

    it('should throw NotFoundError if meeting belongs to different organization', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue({ ...mockMeeting, organizationId: 'different-org-id' });

      // Act & Assert
      await expect(meetingService.getMeetingById(mockMeeting.id, mockOrganization.id)).rejects.toThrow(AuthorizationError);
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
    });
  });

  describe('getMeetingWithDetails', () => {
    it('should return a meeting with all related details', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.getMeetingSummary.mockResolvedValue(mockMeetingWithRelations);

      // Act
      const meeting = await meetingService.getMeetingWithDetails(mockMeeting.id, mockOrganization.id);

      // Assert
      expect(meetingRepositoryMock.getMeetingSummary).toHaveBeenCalledWith(mockMeeting.id, mockOrganization.id);
      expect(meeting).toEqual(mockMeetingWithRelations);
    });
  });

  describe('getMeetings', () => {
    it('should return meetings based on filters with pagination', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findByFilters.mockResolvedValue({ data: mockMeetings, total: mockMeetings.length });

      // Act
      const filters = { organizationId: mockOrganization.id };
      const pagination = { page: 1, limit: 10, offset: 0 };
      const meetings = await meetingService.getMeetings(filters, pagination);

      // Assert
      expect(meetingRepositoryMock.findByFilters).toHaveBeenCalledWith(filters, pagination);
      expect(meetings.data).toEqual(mockMeetings);
      expect(meetings.total).toEqual(mockMeetings.length);
    });
  });

  describe('getUpcomingMeetings', () => {
    it('should return upcoming meetings for an organization', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findUpcoming.mockResolvedValue({ data: mockMeetings, total: mockMeetings.length });

      // Act
      const pagination = { page: 1, limit: 10, offset: 0 };
      const meetings = await meetingService.getUpcomingMeetings(mockOrganization.id, pagination);

      // Assert
      expect(meetingRepositoryMock.findUpcoming).toHaveBeenCalledWith(mockOrganization.id, pagination, {});
      expect(meetings.data).toEqual(mockMeetings);
      expect(meetings.total).toEqual(mockMeetings.length);
    });
  });

  describe('getActiveMeetings', () => {
    it('should return active meetings for an organization', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findActive.mockResolvedValue({ data: mockMeetings, total: mockMeetings.length });

      // Act
      const pagination = { page: 1, limit: 10, offset: 0 };
      const meetings = await meetingService.getActiveMeetings(mockOrganization.id, pagination);

      // Assert
      expect(meetingRepositoryMock.findActive).toHaveBeenCalledWith(mockOrganization.id, pagination, {});
      expect(meetings.data).toEqual(mockMeetings);
      expect(meetings.total).toEqual(mockMeetings.length);
    });
  });

  describe('getUserMeetings', () => {
    it('should return meetings where a user is a participant', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findByParticipant.mockResolvedValue({ data: mockMeetings, total: mockMeetings.length });

      // Act
      const pagination = { page: 1, limit: 10, offset: 0 };
      const meetings = await meetingService.getUserMeetings(mockUser.id, mockOrganization.id, pagination);

      // Assert
      expect(meetingRepositoryMock.findByParticipant).toHaveBeenCalledWith(mockUser.id, mockOrganization.id, pagination, {});
      expect(meetings.data).toEqual(mockMeetings);
      expect(meetings.total).toEqual(mockMeetings.length);
    });
  });

  describe('createMeeting', () => {
    it('should create a new meeting with participants and stages', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingStageServiceMock, userRepositoryMock, meetingCollaborationServiceMock, notificationServiceMock, meetingService } = createMeetingServiceMocks();
      userRepositoryMock.findById.mockResolvedValue(mockUser);
			userRepositoryMock.findByIds.mockResolvedValue(mockUsers);
      meetingRepositoryMock.createWithParticipants.mockResolvedValue(mockMeetingWithRelations);
      meetingStageServiceMock.createStagesForMeeting.mockResolvedValue(mockMeetingStages);
      meetingCollaborationServiceMock.initializeMeetingCollaboration.mockResolvedValue('firestore-doc-id');
			notificationServiceMock.createNotification.mockResolvedValue({});

      // Act
      const createMeetingDto: CreateMeetingDto = {
        title: 'New Meeting',
        description: 'Test meeting',
        meetingType: MeetingType.DAILY,
        startTime: new Date(),
        endTime: new Date(),
        organizationId: mockOrganization.id,
        participantIds: [mockUser.id],
        moderatorIds: [mockUser.id],
        recurrenceRule: null,
        location: null,
        virtualMeetingUrl: null,
        syncWithCalendar: false
      };
      const meeting = await meetingService.createMeeting(createMeetingDto, mockUser.id);

      // Assert
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(mockUser.id);
			expect(userRepositoryMock.findByIds).toHaveBeenCalledWith([mockUser.id]);
      expect(meetingRepositoryMock.createWithParticipants).toHaveBeenCalledWith(createMeetingDto);
      expect(meetingStageServiceMock.createStagesForMeeting).toHaveBeenCalledWith(mockMeetingWithRelations.id, MeetingType.DAILY);
      expect(meetingCollaborationServiceMock.initializeMeetingCollaboration).toHaveBeenCalledWith(mockMeetingWithRelations, mockMeetingWithRelations.participants);
			expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(meeting).toEqual(mockMeetingWithRelations);
    });
  });

  describe('updateMeeting', () => {
    it('should update an existing meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, notificationServiceMock, realtimeServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);
      meetingRepositoryMock.update.mockResolvedValue(mockMeeting);
			notificationServiceMock.createNotification.mockResolvedValue({});
      realtimeServiceMock.updateMeetingData.mockResolvedValue({});

      // Act
      const updateMeetingDto: UpdateMeetingDto = { title: 'Updated Meeting Title' };
      const meeting = await meetingService.updateMeeting(mockMeeting.id, updateMeetingDto, mockOrganization.id, mockUser.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meetingRepositoryMock.update).toHaveBeenCalledWith(mockMeeting.id, updateMeetingDto);
			expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(realtimeServiceMock.updateMeetingData).toHaveBeenCalledWith(mockMeeting.id, {}, mockUser.id);
      expect(meeting).toEqual(mockMeeting);
    });
  });

  describe('cancelMeeting', () => {
    it('should cancel a scheduled meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, notificationServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockScheduledMeeting);
      meetingRepositoryMock.updateStatus.mockResolvedValue(mockScheduledMeeting);
			notificationServiceMock.createNotification.mockResolvedValue({});

      // Act
      const meeting = await meetingService.cancelMeeting(mockScheduledMeeting.id, mockOrganization.id, mockUser.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockScheduledMeeting.id, {});
      expect(meetingRepositoryMock.updateStatus).toHaveBeenCalledWith(mockScheduledMeeting.id, MeetingStatus.CANCELLED, mockOrganization.id);
			expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(meeting).toEqual(mockScheduledMeeting);
    });
  });

  describe('startMeeting', () => {
    it('should start a scheduled meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, notificationServiceMock, realtimeServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockScheduledMeeting);
      meetingRepositoryMock.updateStatus.mockResolvedValue(mockInProgressMeeting);
      meetingRepositoryMock.updateCurrentStage.mockResolvedValue(mockInProgressMeeting);
			notificationServiceMock.createNotification.mockResolvedValue({});
      realtimeServiceMock.updateMeetingData.mockResolvedValue({});

      // Act
      const meeting = await meetingService.startMeeting(mockScheduledMeeting.id, mockOrganization.id, mockUser.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockScheduledMeeting.id, {});
      expect(meetingRepositoryMock.updateStatus).toHaveBeenCalledWith(mockScheduledMeeting.id, MeetingStatus.IN_PROGRESS, mockOrganization.id);
      expect(meetingRepositoryMock.updateCurrentStage).toHaveBeenCalled();
			expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(realtimeServiceMock.updateMeetingData).toHaveBeenCalledWith(mockScheduledMeeting.id, {}, mockUser.id);
      expect(meeting).toEqual(mockInProgressMeeting);
    });
  });

  describe('completeMeeting', () => {
    it('should complete an in-progress meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingStageServiceMock, meetingCollaborationServiceMock, notificationServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockInProgressMeeting);
      meetingStageServiceMock.completeMeeting.mockResolvedValue();
      meetingRepositoryMock.updateStatus.mockResolvedValue(mockCompletedMeeting);
      meetingCollaborationServiceMock.completeMeeting.mockResolvedValue();
			notificationServiceMock.createNotification.mockResolvedValue({});

      // Act
      const meeting = await meetingService.completeMeeting(mockInProgressMeeting.id, mockOrganization.id, mockUser.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockInProgressMeeting.id, {});
      expect(meetingStageServiceMock.completeMeeting).toHaveBeenCalledWith(mockInProgressMeeting.id, mockOrganization.id);
      expect(meetingRepositoryMock.updateStatus).toHaveBeenCalledWith(mockInProgressMeeting.id, MeetingStatus.COMPLETED, mockOrganization.id);
      expect(meetingCollaborationServiceMock.completeMeeting).toHaveBeenCalledWith(mockInProgressMeeting.id);
			expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(meeting).toEqual(mockCompletedMeeting);
    });
  });

  describe('addParticipants', () => {
    it('should add participants to a meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, userRepositoryMock, meetingParticipantRepositoryMock, notificationServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);
      userRepositoryMock.findByIds.mockResolvedValue(mockUsers);
      meetingParticipantRepositoryMock.addParticipants.mockResolvedValue(3);
			notificationServiceMock.createNotification.mockResolvedValue({});

      // Act
      const addParticipantsDto: AddParticipantsDto = { userIds: [mockUser.id], role: ParticipantRole.PARTICIPANT };
      const count = await meetingService.addParticipants(mockMeeting.id, addParticipantsDto, mockOrganization.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(userRepositoryMock.findByIds).toHaveBeenCalledWith(addParticipantsDto.userIds);
      expect(meetingParticipantRepositoryMock.addParticipants).toHaveBeenCalled();
			expect(notificationServiceMock.createNotification).toHaveBeenCalled();
      expect(count).toEqual(3);
    });
  });

  describe('removeParticipants', () => {
    it('should remove participants from a meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingParticipantRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);
      meetingParticipantRepositoryMock.removeParticipants.mockResolvedValue(2);

      // Act
      const removeParticipantsDto: RemoveParticipantsDto = { userIds: [mockUser.id] };
      const count = await meetingService.removeParticipants(mockMeeting.id, removeParticipantsDto, mockOrganization.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meetingParticipantRepositoryMock.removeParticipants).toHaveBeenCalledWith(mockMeeting.id, removeParticipantsDto.userIds);
      expect(count).toEqual(2);
    });
  });

  describe('updateParticipant', () => {
    it("should update a participant's role or status", async () => {
      // Arrange
      const { meetingRepositoryMock, meetingParticipantRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);
      meetingParticipantRepositoryMock.updateParticipant.mockResolvedValue(mockMeetingParticipant);

      // Act
      const updateMeetingParticipantDto: UpdateMeetingParticipantDto = { role: ParticipantRole.MODERATOR };
      const participant = await meetingService.updateParticipant(mockMeeting.id, mockMeetingParticipant.id, updateMeetingParticipantDto, mockOrganization.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meetingParticipantRepositoryMock.updateParticipant).toHaveBeenCalledWith(mockMeetingParticipant.id, updateMeetingParticipantDto);
      expect(participant).toEqual(mockMeetingParticipant);
    });
  });

  describe('joinMeeting', () => {
    it('should record a user joining an active meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingCollaborationServiceMock, meetingParticipantRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.getMeetingSummary.mockResolvedValue(mockMeetingWithRelations);
      meetingCollaborationServiceMock.joinMeeting.mockResolvedValue('firestore-doc-id');
      meetingParticipantRepositoryMock.updateParticipant.mockResolvedValue(mockMeetingParticipant);

      // Act
      const result = await meetingService.joinMeeting(mockMeeting.id, mockUser.id, mockOrganization.id);

      // Assert
      expect(meetingRepositoryMock.getMeetingSummary).toHaveBeenCalledWith(mockMeeting.id, mockOrganization.id);
      expect(meetingCollaborationServiceMock.joinMeeting).toHaveBeenCalledWith(mockMeeting.id, mockUser.id);
      expect(meetingParticipantRepositoryMock.updateParticipant).toHaveBeenCalled();
      expect(result).toEqual({ meeting: mockMeetingWithRelations, firestoreDocId: 'firestore-doc-id' });
    });
  });

  describe('leaveMeeting', () => {
    it('should record a user leaving an active meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingCollaborationServiceMock, meetingParticipantRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);
      meetingCollaborationServiceMock.leaveMeeting.mockResolvedValue();
      meetingParticipantRepositoryMock.updateParticipant.mockResolvedValue(mockMeetingParticipant);

      // Act
      await meetingService.leaveMeeting(mockMeeting.id, mockUser.id, mockOrganization.id, 'firestore-doc-id');

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meetingCollaborationServiceMock.leaveMeeting).toHaveBeenCalledWith(mockMeeting.id, mockUser.id, 'firestore-doc-id');
      expect(meetingParticipantRepositoryMock.updateParticipant).toHaveBeenCalled();
    });
  });

  describe('moveToNextStage', () => {
    it('should advance the meeting to the next stage', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingStageServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockInProgressMeeting);
      meetingStageServiceMock.moveToNextStage.mockResolvedValue(mockMeetingStage);

      // Act
      const stage = await meetingService.moveToNextStage(mockMeeting.id, mockOrganization.id, mockUser.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meetingStageServiceMock.moveToNextStage).toHaveBeenCalledWith(mockMeeting.id, mockOrganization.id);
      expect(stage).toEqual(mockMeetingStage);
    });
  });

  describe('moveToPreviousStage', () => {
    it('should move the meeting back to the previous stage', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingStageServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockInProgressMeeting);
      meetingStageServiceMock.moveToPreviousStage.mockResolvedValue(mockMeetingStage);

      // Act
      const stage = await meetingService.moveToPreviousStage(mockMeeting.id, mockOrganization.id, mockUser.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meetingStageServiceMock.moveToPreviousStage).toHaveBeenCalledWith(mockMeeting.id, mockOrganization.id);
      expect(stage).toEqual(mockMeetingStage);
    });
  });

  describe('jumpToStage', () => {
    it('should jump directly to a specific stage', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingStageServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockInProgressMeeting);
      meetingStageServiceMock.jumpToStage.mockResolvedValue(mockMeetingStage);

      // Act
      const stage = await meetingService.jumpToStage(mockMeetingStage.id, mockMeeting.id, mockOrganization.id, mockUser.id);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meetingStageServiceMock.jumpToStage).toHaveBeenCalledWith(mockMeetingStage.id, mockMeeting.id, mockOrganization.id);
      expect(stage).toEqual(mockMeetingStage);
    });
  });

  describe('syncWithCalendar', () => {
    it('should synchronize a meeting with external calendar systems', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingParticipantRepositoryMock, googleCalendarServiceMock, microsoftCalendarServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findById.mockResolvedValue(mockMeeting);
      meetingParticipantRepositoryMock.findByMeetingId.mockResolvedValue(mockMeetingParticipants);
      googleCalendarServiceMock.createEvent.mockResolvedValue('google-event-id');
      microsoftCalendarServiceMock.createEvent.mockResolvedValue('microsoft-event-id');
      meetingRepositoryMock.updateCalendarEventIds.mockResolvedValue(mockMeeting);

      // Act
      const accessTokens = { googleAccessToken: 'google-token', microsoftAccessToken: 'microsoft-token' };
      const calendarSyncResult = await meetingService.syncWithCalendar(mockMeeting.id, mockOrganization.id, accessTokens);

      // Assert
      expect(meetingRepositoryMock.findById).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(meetingParticipantRepositoryMock.findByMeetingId).toHaveBeenCalledWith(mockMeeting.id, {});
      expect(googleCalendarServiceMock.createEvent).toHaveBeenCalled();
      expect(microsoftCalendarServiceMock.createEvent).toHaveBeenCalled();
      expect(meetingRepositoryMock.updateCalendarEventIds).toHaveBeenCalledWith(mockMeeting.id, { googleCalendarEventId: 'google-event-id', microsoftCalendarEventId: 'microsoft-event-id' }, mockOrganization.id);
      expect(calendarSyncResult).toEqual({ googleCalendarEventId: 'google-event-id', microsoftCalendarEventId: 'microsoft-event-id' });
    });
  });

  describe('sendMeetingReminders', () => {
    it('should send reminders for upcoming meetings', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingParticipantRepositoryMock, notificationServiceMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.findByFilters.mockResolvedValue({ data: [mockScheduledMeeting], total: 1 });
      meetingParticipantRepositoryMock.findByMeetingId.mockResolvedValue(mockMeetingParticipants);
			notificationServiceMock.sendHighPriorityNotification.mockResolvedValue(true);

      // Act
      const remindersSent = await meetingService.sendMeetingReminders(15);

      // Assert
      expect(meetingRepositoryMock.findByFilters).toHaveBeenCalled();
      expect(meetingParticipantRepositoryMock.findByMeetingId).toHaveBeenCalled();
			expect(notificationServiceMock.sendHighPriorityNotification).toHaveBeenCalled();
      expect(remindersSent).toBe(1);
    });
  });

  describe('generateMeetingSummary', () => {
    it('should generate a summary of a completed meeting', async () => {
      // Arrange
      const { meetingRepositoryMock, meetingService } = createMeetingServiceMocks();
      meetingRepositoryMock.getMeetingSummary.mockResolvedValue(mockMeetingWithRelations);

      // Act
      const summary = await meetingService.generateMeetingSummary(mockMeeting.id, mockOrganization.id);

      // Assert
      expect(meetingRepositoryMock.getMeetingSummary).toHaveBeenCalledWith(mockMeeting.id, mockOrganization.id);
      expect(summary).toBeDefined();
    });
  });
});