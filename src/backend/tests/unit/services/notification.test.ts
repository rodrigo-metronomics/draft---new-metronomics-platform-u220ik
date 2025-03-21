import { NotificationService } from '../../../src/services/notification/notificationService';
import { FirebaseNotificationService } from '../../../src/services/notification/firebaseNotificationService';
import { EmailNotificationService } from '../../../src/services/notification/emailNotificationService';
import { NotificationRepository } from '../../../src/repositories/notificationRepository';
import { UserRepository } from '../../../src/repositories/userRepository';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationDigestFrequency,
  CreateNotificationDto,
  NotificationPreferences
} from '../../../src/types/notification.types';
import { ValidationError, NotFoundError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('../../../src/repositories/notificationRepository');
jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/services/notification/firebaseNotificationService');
jest.mock('../../../src/services/notification/emailNotificationService');
jest.mock('../../../src/utils/helpers/logger');

// Helper functions to create mock objects
function createMockNotification(overrides = {}) {
  return {
    id: 'mock-notification-id',
    type: NotificationType.MEETING_REMINDER,
    title: 'Meeting Reminder',
    content: 'You have a meeting in 15 minutes',
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    userId: 'user-123',
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function createMockNotificationDelivery(overrides = {}) {
  return {
    id: 'mock-delivery-id',
    notificationId: 'mock-notification-id',
    channel: NotificationChannel.IN_APP,
    status: NotificationDeliveryStatus.PENDING,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    role: 'TEAM_MEMBER',
    preferences: {
      notificationPreferences: {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        digestFrequency: NotificationDigestFrequency.DAILY,
        typePreferences: []
      }
    },
    ...overrides
  };
}

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let notificationRepositoryMock: jest.Mocked<NotificationRepository>;
  let userRepositoryMock: jest.Mocked<UserRepository>;
  let firebaseNotificationServiceMock: jest.Mocked<FirebaseNotificationService>;
  let emailNotificationServiceMock: jest.Mocked<EmailNotificationService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create fresh mocks for each test
    notificationRepositoryMock = new NotificationRepository() as jest.Mocked<NotificationRepository>;
    userRepositoryMock = new UserRepository() as jest.Mocked<UserRepository>;
    firebaseNotificationServiceMock = new FirebaseNotificationService() as jest.Mocked<FirebaseNotificationService>;
    emailNotificationServiceMock = new EmailNotificationService() as jest.Mocked<EmailNotificationService>;
    
    // Inject mocks into the service
    notificationService = new NotificationService();
    (notificationService as any).notificationRepository = notificationRepositoryMock;
    (notificationService as any).userRepository = userRepositoryMock;
    (notificationService as any).firebaseNotificationService = firebaseNotificationServiceMock;
    (notificationService as any).emailNotificationService = emailNotificationServiceMock;
  });

  it('should be defined', () => {
    expect(notificationService).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      // Arrange
      const mockNotification = createMockNotification();
      notificationRepositoryMock.createWithDeliveries = jest.fn().mockResolvedValue(mockNotification);
      
      const notificationData: CreateNotificationDto = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Meeting Reminder',
        content: 'You have a meeting in 15 minutes',
        priority: NotificationPriority.MEDIUM,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: [NotificationChannel.IN_APP]
      };
      
      // Act
      const result = await notificationService.createNotification(notificationData);
      
      // Assert
      expect(result).toEqual(mockNotification);
      expect(notificationRepositoryMock.createWithDeliveries).toHaveBeenCalledWith(
        notificationData,
        [NotificationChannel.IN_APP]
      );
    });

    it('should determine default channels based on user preferences', async () => {
      // Arrange
      const mockNotification = createMockNotification();
      const mockUser = createMockUser();
      
      notificationRepositoryMock.createWithDeliveries = jest.fn().mockResolvedValue(mockNotification);
      userRepositoryMock.findById = jest.fn().mockResolvedValue(mockUser);
      
      const notificationData: CreateNotificationDto = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Meeting Reminder',
        content: 'You have a meeting in 15 minutes',
        priority: NotificationPriority.MEDIUM,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: [] // No channels specified
      };
      
      // Act
      const result = await notificationService.createNotification(notificationData);
      
      // Assert
      expect(result).toEqual(mockNotification);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-123');
      expect(notificationRepositoryMock.createWithDeliveries).toHaveBeenCalledWith(
        notificationData,
        expect.arrayContaining([NotificationChannel.IN_APP, NotificationChannel.EMAIL]) // Default channels from preferences
      );
    });

    it('should send high priority notifications immediately', async () => {
      // Arrange
      const mockNotification = createMockNotification({
        priority: NotificationPriority.HIGH,
        deliveries: [createMockNotificationDelivery({ channel: NotificationChannel.PUSH })]
      });
      
      notificationRepositoryMock.createWithDeliveries = jest.fn().mockResolvedValue(mockNotification);
      firebaseNotificationServiceMock.sendHighPriorityNotification = jest.fn().mockResolvedValue(true);
      
      const notificationData: CreateNotificationDto = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Meeting Reminder',
        content: 'You have a meeting in 15 minutes',
        priority: NotificationPriority.HIGH,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: [NotificationChannel.PUSH]
      };
      
      // Act
      const result = await notificationService.createNotification(notificationData);
      
      // Assert
      expect(result).toEqual(mockNotification);
      expect(firebaseNotificationServiceMock.sendHighPriorityNotification).toHaveBeenCalledWith(
        notificationData,
        'mock-delivery-id'
      );
    });

    it('should throw ValidationError for missing required fields', async () => {
      // Act & Assert
      await expect(notificationService.createNotification(null as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with pagination', async () => {
      // Arrange
      const mockNotifications = [createMockNotification(), createMockNotification()];
      const mockPagination = { page: 1, limit: 10, offset: 0 };
      
      notificationRepositoryMock.findByUserId = jest.fn().mockResolvedValue({
        data: mockNotifications,
        total: 2
      });
      
      // Act
      const result = await notificationService.getUserNotifications('user-123', {}, mockPagination);
      
      // Assert
      expect(result).toEqual({
        data: mockNotifications,
        total: 2
      });
      expect(notificationRepositoryMock.findByUserId).toHaveBeenCalledWith(
        'user-123',
        {},
        mockPagination
      );
    });

    it('should apply filters from query parameters', async () => {
      // Arrange
      const mockNotifications = [createMockNotification()];
      const mockPagination = { page: 1, limit: 10, offset: 0 };
      const mockFilters = {
        status: NotificationStatus.UNREAD,
        type: NotificationType.MEETING_REMINDER,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      };
      
      notificationRepositoryMock.findByUserId = jest.fn().mockResolvedValue({
        data: mockNotifications,
        total: 1
      });
      
      // Act
      const result = await notificationService.getUserNotifications('user-123', mockFilters, mockPagination);
      
      // Assert
      expect(result).toEqual({
        data: mockNotifications,
        total: 1
      });
      expect(notificationRepositoryMock.findByUserId).toHaveBeenCalledWith(
        'user-123',
        mockFilters,
        mockPagination
      );
    });

    it('should throw ValidationError for invalid user ID', async () => {
      // Arrange
      const mockPagination = { page: 1, limit: 10, offset: 0 };
      
      // Act & Assert
      await expect(notificationService.getUserNotifications('', {}, mockPagination)).rejects.toThrow(ValidationError);
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count for user', async () => {
      // Arrange
      const mockCount = { total: 10, unread: 5 };
      notificationRepositoryMock.countUnreadByUserId = jest.fn().mockResolvedValue(mockCount);
      
      // Act
      const result = await notificationService.getUnreadCount('user-123');
      
      // Assert
      expect(result).toEqual(mockCount);
      expect(notificationRepositoryMock.countUnreadByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should throw ValidationError for invalid user ID', async () => {
      // Act & Assert
      await expect(notificationService.getUnreadCount('')).rejects.toThrow(ValidationError);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      // Arrange
      const mockNotification = createMockNotification({ status: NotificationStatus.READ });
      notificationRepositoryMock.markAsRead = jest.fn().mockResolvedValue(mockNotification);
      
      // Act
      const result = await notificationService.markAsRead('notification-123');
      
      // Assert
      expect(result).toEqual(mockNotification);
      expect(notificationRepositoryMock.markAsRead).toHaveBeenCalledWith('notification-123');
    });

    it('should throw ValidationError for invalid notification ID', async () => {
      // Act & Assert
      await expect(notificationService.markAsRead('')).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError if notification doesn't exist", async () => {
      // Arrange
      notificationRepositoryMock.markAsRead = jest.fn().mockRejectedValue(
        NotFoundError.resourceNotFound('Notification', 'non-existent-id')
      );
      
      // Act & Assert
      await expect(notificationService.markAsRead('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      // Arrange
      const mockResult = { count: 5 };
      notificationRepositoryMock.markAllAsRead = jest.fn().mockResolvedValue(mockResult);
      
      // Act
      const result = await notificationService.markAllAsRead('user-123');
      
      // Assert
      expect(result).toEqual(mockResult);
      expect(notificationRepositoryMock.markAllAsRead).toHaveBeenCalledWith('user-123');
    });

    it('should throw ValidationError for invalid user ID', async () => {
      // Act & Assert
      await expect(notificationService.markAllAsRead('')).rejects.toThrow(ValidationError);
    });
  });

  describe('processDeliveries', () => {
    it('should process pending deliveries across all channels', async () => {
      // Arrange
      const mockFirebaseResult = { processed: 5, successful: 4, failed: 1 };
      const mockEmailResult = { processed: 3, successful: 3, failed: 0 };
      
      firebaseNotificationServiceMock.processPendingDeliveries = jest.fn().mockResolvedValue(mockFirebaseResult);
      emailNotificationServiceMock.processPendingDeliveries = jest.fn().mockResolvedValue(mockEmailResult);
      
      // Act
      const result = await notificationService.processDeliveries(10);
      
      // Assert
      expect(result).toEqual({
        push: mockFirebaseResult,
        email: mockEmailResult
      });
      expect(firebaseNotificationServiceMock.processPendingDeliveries).toHaveBeenCalledWith(10);
      expect(emailNotificationServiceMock.processPendingDeliveries).toHaveBeenCalledWith(10);
    });

    it('should handle errors in individual channel processing', async () => {
      // Arrange
      const mockEmailResult = { processed: 3, successful: 3, failed: 0 };
      
      firebaseNotificationServiceMock.processPendingDeliveries = jest.fn().mockRejectedValue(new Error('Firebase error'));
      emailNotificationServiceMock.processPendingDeliveries = jest.fn().mockResolvedValue(mockEmailResult);
      
      // Act & Assert
      await expect(notificationService.processDeliveries(10)).rejects.toThrow('Firebase error');
    });
  });

  describe('sendHighPriorityNotification', () => {
    it('should send high priority notification immediately', async () => {
      // Arrange
      const mockNotification = createMockNotification({
        priority: NotificationPriority.HIGH,
        deliveries: [createMockNotificationDelivery({ channel: NotificationChannel.PUSH })]
      });
      
      notificationRepositoryMock.createWithDeliveries = jest.fn().mockResolvedValue(mockNotification);
      firebaseNotificationServiceMock.sendHighPriorityNotification = jest.fn().mockResolvedValue(true);
      
      const notificationData: CreateNotificationDto = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Meeting Reminder',
        content: 'You have a meeting in 15 minutes',
        priority: NotificationPriority.HIGH,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: [NotificationChannel.PUSH]
      };
      
      // Act
      const result = await notificationService.sendHighPriorityNotification(notificationData);
      
      // Assert
      expect(result).toBe(true);
      expect(notificationRepositoryMock.createWithDeliveries).toHaveBeenCalledWith(
        notificationData,
        [NotificationChannel.PUSH]
      );
      expect(firebaseNotificationServiceMock.sendHighPriorityNotification).toHaveBeenCalledWith(
        notificationData,
        'mock-delivery-id'
      );
    });

    it('should throw ValidationError if notification is not high priority', async () => {
      // Arrange
      const notificationData: CreateNotificationDto = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Meeting Reminder',
        content: 'You have a meeting in 15 minutes',
        priority: NotificationPriority.MEDIUM,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: [NotificationChannel.PUSH]
      };
      
      // Act & Assert
      await expect(notificationService.sendHighPriorityNotification(notificationData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing required fields', async () => {
      // Act & Assert
      await expect(notificationService.sendHighPriorityNotification(null as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('sendDigestEmails', () => {
    it('should send digest emails to users with matching frequency', async () => {
      // Arrange
      const mockUsers = [
        createMockUser({ 
          id: 'user-1',
          preferences: {
            notificationPreferences: {
              enabled: true,
              channels: [NotificationChannel.EMAIL],
              digestFrequency: NotificationDigestFrequency.DAILY,
              typePreferences: []
            }
          }
        }),
        createMockUser({ 
          id: 'user-2',
          preferences: {
            notificationPreferences: {
              enabled: true,
              channels: [NotificationChannel.EMAIL],
              digestFrequency: NotificationDigestFrequency.DAILY,
              typePreferences: []
            }
          }
        })
      ];
      
      userRepositoryMock.findMany = jest.fn().mockResolvedValue({ data: mockUsers, total: mockUsers.length });
      emailNotificationServiceMock.sendDigestEmail = jest.fn().mockResolvedValue(true);
      
      // Act
      const result = await notificationService.sendDigestEmails(NotificationDigestFrequency.DAILY);
      
      // Assert
      expect(result).toEqual({ sent: 2, failed: 0 });
      expect(emailNotificationServiceMock.sendDigestEmail).toHaveBeenCalledTimes(2);
      expect(emailNotificationServiceMock.sendDigestEmail).toHaveBeenCalledWith(
        mockUsers[0],
        NotificationDigestFrequency.DAILY
      );
      expect(emailNotificationServiceMock.sendDigestEmail).toHaveBeenCalledWith(
        mockUsers[1],
        NotificationDigestFrequency.DAILY
      );
    });

    it('should handle failures in individual digest email sending', async () => {
      // Arrange
      const mockUsers = [
        createMockUser({ 
          id: 'user-1',
          preferences: {
            notificationPreferences: {
              enabled: true,
              channels: [NotificationChannel.EMAIL],
              digestFrequency: NotificationDigestFrequency.DAILY,
              typePreferences: []
            }
          }
        }),
        createMockUser({ 
          id: 'user-2',
          preferences: {
            notificationPreferences: {
              enabled: true,
              channels: [NotificationChannel.EMAIL],
              digestFrequency: NotificationDigestFrequency.DAILY,
              typePreferences: []
            }
          }
        }),
        createMockUser({ 
          id: 'user-3',
          preferences: {
            notificationPreferences: {
              enabled: true,
              channels: [NotificationChannel.EMAIL],
              digestFrequency: NotificationDigestFrequency.DAILY,
              typePreferences: []
            }
          }
        })
      ];
      
      userRepositoryMock.findMany = jest.fn().mockResolvedValue({ data: mockUsers, total: mockUsers.length });
      
      // First and third users succeed, second user fails
      emailNotificationServiceMock.sendDigestEmail = jest.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      
      // Act
      const result = await notificationService.sendDigestEmails(NotificationDigestFrequency.DAILY);
      
      // Assert
      expect(result).toEqual({ sent: 2, failed: 1 });
      expect(emailNotificationServiceMock.sendDigestEmail).toHaveBeenCalledTimes(3);
    });
  });

  describe('getUserPreferences', () => {
    it('should get user notification preferences', async () => {
      // Arrange
      const mockUser = createMockUser();
      userRepositoryMock.findById = jest.fn().mockResolvedValue(mockUser);
      
      // Act
      const result = await notificationService.getUserPreferences('user-123');
      
      // Assert
      expect(result).toEqual(mockUser.preferences.notificationPreferences);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-123');
    });

    it('should return default preferences if user has none', async () => {
      // Arrange
      const mockUser = createMockUser({ preferences: {} });
      userRepositoryMock.findById = jest.fn().mockResolvedValue(mockUser);
      
      const defaultPreferences = {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        digestFrequency: NotificationDigestFrequency.DAILY,
        typePreferences: expect.any(Array)
      };
      
      // Act
      const result = await notificationService.getUserPreferences('user-123');
      
      // Assert
      expect(result).toMatchObject(defaultPreferences);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-123');
    });

    it("should throw NotFoundError if user doesn't exist", async () => {
      // Arrange
      userRepositoryMock.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(notificationService.getUserPreferences('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid user ID', async () => {
      // Act & Assert
      await expect(notificationService.getUserPreferences('')).rejects.toThrow(ValidationError);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user notification preferences', async () => {
      // Arrange
      const mockUser = createMockUser();
      const updatedUser = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          notificationPreferences: {
            enabled: false,
            channels: [NotificationChannel.EMAIL],
            digestFrequency: NotificationDigestFrequency.WEEKLY,
            typePreferences: []
          }
        }
      };
      
      userRepositoryMock.findById = jest.fn().mockResolvedValue(mockUser);
      userRepositoryMock.update = jest.fn().mockResolvedValue(updatedUser);
      
      const newPreferences = {
        enabled: false,
        channels: [NotificationChannel.EMAIL],
        digestFrequency: NotificationDigestFrequency.WEEKLY,
        typePreferences: []
      };
      
      // Act
      const result = await notificationService.updateUserPreferences('user-123', newPreferences);
      
      // Assert
      expect(result).toEqual(newPreferences);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-123');
      expect(userRepositoryMock.update).toHaveBeenCalledWith('user-123', {
        preferences: {
          ...mockUser.preferences,
          notificationPreferences: newPreferences
        }
      });
    });

    it("should throw NotFoundError if user doesn't exist", async () => {
      // Arrange
      userRepositoryMock.findById = jest.fn().mockResolvedValue(null);
      
      const newPreferences = {
        enabled: false,
        channels: [NotificationChannel.EMAIL],
        digestFrequency: NotificationDigestFrequency.WEEKLY,
        typePreferences: []
      };
      
      // Act & Assert
      await expect(notificationService.updateUserPreferences('non-existent-id', newPreferences)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid preferences data', async () => {
      // Arrange
      const mockUser = createMockUser();
      userRepositoryMock.findById = jest.fn().mockResolvedValue(mockUser);
      
      // Act & Assert
      await expect(notificationService.updateUserPreferences('user-123', null as any)).rejects.toThrow(ValidationError);
    });
  });

  describe('getDefaultChannelsForNotification', () => {
    it('should use channels specified in notification', () => {
      // Arrange
      const notification = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Test',
        content: 'Test content',
        priority: NotificationPriority.MEDIUM,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: [NotificationChannel.PUSH]
      };
      
      const preferences = {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        digestFrequency: NotificationDigestFrequency.DAILY,
        typePreferences: []
      };
      
      // Act
      const result = notificationService.getDefaultChannelsForNotification(notification, preferences);
      
      // Assert
      expect(result).toEqual([NotificationChannel.PUSH]);
    });

    it('should use channels from type preferences if available', () => {
      // Arrange
      const notification = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Test',
        content: 'Test content',
        priority: NotificationPriority.MEDIUM,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: []
      };
      
      const preferences = {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        digestFrequency: NotificationDigestFrequency.DAILY,
        typePreferences: [
          {
            type: NotificationType.MEETING_REMINDER,
            enabled: true,
            channels: [NotificationChannel.PUSH]
          }
        ]
      };
      
      // Act
      const result = notificationService.getDefaultChannelsForNotification(notification, preferences);
      
      // Assert
      expect(result).toEqual([NotificationChannel.PUSH]);
    });

    it('should use default channels if no type preferences', () => {
      // Arrange
      const notification = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Test',
        content: 'Test content',
        priority: NotificationPriority.MEDIUM,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: []
      };
      
      const preferences = {
        enabled: true,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        digestFrequency: NotificationDigestFrequency.DAILY,
        typePreferences: []
      };
      
      // Act
      const result = notificationService.getDefaultChannelsForNotification(notification, preferences);
      
      // Assert
      expect(result).toEqual([NotificationChannel.IN_APP, NotificationChannel.EMAIL]);
    });

    it('should include immediate channels for high priority notifications', () => {
      // Arrange
      const notification = {
        type: NotificationType.MEETING_REMINDER,
        title: 'Test',
        content: 'Test content',
        priority: NotificationPriority.HIGH,
        userId: 'user-123',
        organizationId: 'org-123',
        channels: []
      };
      
      const preferences = {
        enabled: true,
        channels: [NotificationChannel.EMAIL],
        digestFrequency: NotificationDigestFrequency.DAILY,
        typePreferences: []
      };
      
      // Act
      const result = notificationService.getDefaultChannelsForNotification(notification, preferences);
      
      // Assert
      expect(result).toContain(NotificationChannel.EMAIL);
      expect(result).toContain(NotificationChannel.PUSH);
      expect(result).toContain(NotificationChannel.IN_APP);
    });
  });

  describe('getDefaultPreferences', () => {
    it('should return default notification preferences', () => {
      // Act
      const result = notificationService.getDefaultPreferences();
      
      // Assert
      expect(result).toMatchObject({
        enabled: true,
        channels: expect.arrayContaining([NotificationChannel.IN_APP, NotificationChannel.EMAIL]),
        digestFrequency: NotificationDigestFrequency.DAILY,
        typePreferences: expect.any(Array)
      });
      
      // Verify that all notification types have preferences defined
      const typesWithPreferences = result.typePreferences.map(pref => pref.type);
      const allNotificationTypes = Object.values(NotificationType);
      
      allNotificationTypes.forEach(type => {
        expect(typesWithPreferences).toContain(type);
      });
    });
  });
});