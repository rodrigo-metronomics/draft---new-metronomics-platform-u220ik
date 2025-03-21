import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { 
  Meeting, 
  MeetingWithRelations, 
  MeetingFilters, 
  MeetingStatus,
  MeetingStageType,
  CreateMeetingDto
} from '../types/meeting.types';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/helpers/logger';

/**
 * Repository implementation for meeting-related database operations in the Metronomics Platform.
 * Provides specialized methods for querying, creating, and updating meetings, including
 * operations for managing meeting participants, stages, and calendar integration.
 */
export class MeetingRepository extends BaseRepository<Meeting> {
  /**
   * Initializes the MeetingRepository with the Meeting model
   */
  constructor() {
    super('meeting');
  }

  /**
   * Finds a meeting by its ID with optional relations
   * 
   * @param id The meeting ID
   * @param options Additional options like including relations
   * @returns The meeting if found, null otherwise
   */
  async findById(id: string, options: Record<string, any> = {}): Promise<Meeting | null> {
    try {
      this.validateId(id);
      
      const include: Record<string, any> = {};
      
      if (options.includeParticipants) {
        include.participants = {
          include: {
            user: true
          }
        };
      }
      
      if (options.includeStages) {
        include.stages = {
          orderBy: {
            sequence: 'asc'
          }
        };
      }
      
      if (options.includeActionItems) {
        include.actionItems = {
          include: {
            assignee: true
          }
        };
      }
      
      if (options.includeCreatedBy) {
        include.createdBy = true;
      }
      
      const includeOptions = Object.keys(include).length > 0 ? { include } : {};
      
      logger.debug('MeetingRepository.findById', { id, includeOptions });
      
      return super.findById(id, includeOptions);
    } catch (error) {
      logger.error('Error in MeetingRepository.findById', { id, error });
      throw error;
    }
  }

  /**
   * Finds a meeting by ID with its participants
   * 
   * @param id The meeting ID
   * @returns The meeting with participants if found, null otherwise
   */
  async findWithParticipants(id: string): Promise<MeetingWithRelations | null> {
    try {
      this.validateId(id);
      
      logger.debug('MeetingRepository.findWithParticipants', { id });
      
      const meeting = await prisma.meeting.findUnique({
        where: { id },
        include: {
          participants: {
            include: {
              user: true
            }
          },
          createdBy: true
        }
      });
      
      return meeting as unknown as MeetingWithRelations;
    } catch (error) {
      logger.error('Error in MeetingRepository.findWithParticipants', { id, error });
      throw error;
    }
  }

  /**
   * Finds meetings based on provided filters with pagination
   * 
   * @param filters Filters to apply to the query
   * @param pagination Pagination parameters
   * @param options Additional options like including relations
   * @returns Paginated meetings matching the filters
   */
  async findByFilters(
    filters: MeetingFilters,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Meeting[]; total: number }> {
    try {
      // Build where clause from filters
      const where: Record<string, any> = {
        organizationId: filters.organizationId
      };
      
      // Apply status filter if provided
      if (filters.status) {
        where.status = filters.status;
      }
      
      // Apply meeting type filter if provided
      if (filters.meetingType) {
        where.meetingType = filters.meetingType;
      }
      
      // Apply participant filter if provided
      if (filters.participantId) {
        where.participants = {
          some: {
            userId: filters.participantId
          }
        };
      }
      
      // Apply date range filters if provided
      if (filters.startDateFrom) {
        where.startTime = {
          ...where.startTime,
          gte: filters.startDateFrom
        };
      }
      
      if (filters.startDateTo) {
        where.startTime = {
          ...where.startTime,
          lte: filters.startDateTo
        };
      }
      
      // Apply search filter if provided
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      // Build include options
      const include: Record<string, any> = {};
      
      if (options.includeParticipants) {
        include.participants = {
          include: {
            user: true
          }
        };
      }
      
      if (options.includeStages) {
        include.stages = {
          orderBy: {
            sequence: 'asc'
          }
        };
      }
      
      if (options.includeActionItems) {
        include.actionItems = {
          include: {
            assignee: true
          }
        };
      }
      
      if (options.includeCreatedBy) {
        include.createdBy = true;
      }
      
      const includeOptions = Object.keys(include).length > 0 ? { include } : {};
      
      logger.debug('MeetingRepository.findByFilters', { where, pagination, includeOptions });
      
      // Call findMany with the where clause
      return await this.findMany(where, pagination, {
        ...options,
        ...includeOptions,
        sortBy: options.sortBy || 'startTime',
        sortOrder: options.sortOrder || 'asc'
      });
    } catch (error) {
      logger.error('Error in MeetingRepository.findByFilters', { filters, error });
      throw error;
    }
  }

  /**
   * Finds upcoming meetings for an organization
   * 
   * @param organizationId The organization ID
   * @param pagination Pagination parameters
   * @param options Additional options like including relations
   * @returns Paginated upcoming meetings
   */
  async findUpcoming(
    organizationId: string,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Meeting[]; total: number }> {
    try {
      // Build where clause for upcoming meetings
      const where: Record<string, any> = {
        organizationId,
        status: MeetingStatus.SCHEDULED,
        startTime: {
          gte: new Date() // Current date and time
        }
      };
      
      // Build include options
      const include: Record<string, any> = {};
      
      if (options.includeParticipants) {
        include.participants = {
          include: {
            user: true
          }
        };
      }
      
      if (options.includeCreatedBy) {
        include.createdBy = true;
      }
      
      const includeOptions = Object.keys(include).length > 0 ? { include } : {};
      
      logger.debug('MeetingRepository.findUpcoming', { where, pagination, includeOptions });
      
      // Call findMany with the where clause
      return await this.findMany(where, pagination, {
        ...options,
        ...includeOptions,
        sortBy: 'startTime',
        sortOrder: 'asc'
      });
    } catch (error) {
      logger.error('Error in MeetingRepository.findUpcoming', { organizationId, error });
      throw error;
    }
  }

  /**
   * Finds active (in-progress) meetings for an organization
   * 
   * @param organizationId The organization ID
   * @param pagination Pagination parameters
   * @param options Additional options like including relations
   * @returns Paginated active meetings
   */
  async findActive(
    organizationId: string,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Meeting[]; total: number }> {
    try {
      // Build where clause for active meetings
      const where: Record<string, any> = {
        organizationId,
        status: MeetingStatus.IN_PROGRESS
      };
      
      // Build include options
      const include: Record<string, any> = {};
      
      if (options.includeParticipants) {
        include.participants = {
          include: {
            user: true
          }
        };
      }
      
      if (options.includeStages) {
        include.stages = {
          orderBy: {
            sequence: 'asc'
          }
        };
      }
      
      if (options.includeCreatedBy) {
        include.createdBy = true;
      }
      
      const includeOptions = Object.keys(include).length > 0 ? { include } : {};
      
      logger.debug('MeetingRepository.findActive', { where, pagination, includeOptions });
      
      // Call findMany with the where clause
      return await this.findMany(where, pagination, {
        ...options,
        ...includeOptions,
        sortBy: 'startTime',
        sortOrder: 'asc'
      });
    } catch (error) {
      logger.error('Error in MeetingRepository.findActive', { organizationId, error });
      throw error;
    }
  }

  /**
   * Finds meetings where a specific user is a participant
   * 
   * @param userId The user ID
   * @param organizationId The organization ID
   * @param pagination Pagination parameters
   * @param options Additional options like including relations
   * @returns Paginated meetings for the user
   */
  async findByParticipant(
    userId: string,
    organizationId: string,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: Meeting[]; total: number }> {
    try {
      this.validateId(userId);
      
      // Build where clause with participant filter
      const where: Record<string, any> = {
        organizationId,
        participants: {
          some: {
            userId
          }
        }
      };
      
      // Add status filter if provided
      if (options.status) {
        where.status = options.status;
      }
      
      // Build include options
      const include: Record<string, any> = {};
      
      if (options.includeParticipants) {
        include.participants = {
          include: {
            user: true
          }
        };
      }
      
      if (options.includeStages) {
        include.stages = {
          orderBy: {
            sequence: 'asc'
          }
        };
      }
      
      if (options.includeCreatedBy) {
        include.createdBy = true;
      }
      
      const includeOptions = Object.keys(include).length > 0 ? { include } : {};
      
      logger.debug('MeetingRepository.findByParticipant', { userId, where, pagination, includeOptions });
      
      // Call findMany with the where clause
      return await this.findMany(where, pagination, {
        ...options,
        ...includeOptions,
        sortBy: options.sortBy || 'startTime',
        sortOrder: options.sortOrder || 'desc'
      });
    } catch (error) {
      logger.error('Error in MeetingRepository.findByParticipant', { userId, organizationId, error });
      throw error;
    }
  }

  /**
   * Creates a new meeting with participants
   * 
   * @param data Meeting creation data including participant IDs
   * @returns The created meeting with participants
   */
  async createWithParticipants(data: CreateMeetingDto): Promise<MeetingWithRelations> {
    try {
      if (!data || !data.title || !data.organizationId) {
        throw ValidationError.requiredField('data (title, organizationId)');
      }
      
      const { participantIds, moderatorIds, ...meetingData } = data;
      
      // Ensure we have participant IDs
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        throw ValidationError.requiredField('participantIds');
      }
      
      // Use transaction to create meeting and participants
      const result = await this.transaction(async (tx) => {
        // Create the meeting
        const meeting = await tx.meeting.create({
          data: {
            ...meetingData,
            status: MeetingStatus.SCHEDULED, // Default status
            createdById: moderatorIds && moderatorIds.length > 0 ? 
              moderatorIds[0] : participantIds[0], // First moderator or participant is the creator
          }
        });
        
        // Create participant records
        const participantData = participantIds.map(userId => ({
          userId,
          meetingId: meeting.id,
          role: moderatorIds && moderatorIds.includes(userId) ? 'MODERATOR' : 'PARTICIPANT',
          attendanceStatus: 'PENDING'
        }));
        
        await tx.meetingParticipant.createMany({
          data: participantData
        });
        
        // Return meeting with participants
        return tx.meeting.findUnique({
          where: { id: meeting.id },
          include: {
            participants: {
              include: {
                user: true
              }
            },
            createdBy: true
          }
        });
      });
      
      logger.debug('MeetingRepository.createWithParticipants completed', { meetingId: result?.id });
      
      return result as unknown as MeetingWithRelations;
    } catch (error) {
      logger.error('Error in MeetingRepository.createWithParticipants', { data, error });
      throw error;
    }
  }

  /**
   * Updates the status of a meeting
   * 
   * @param id The meeting ID
   * @param status The new meeting status
   * @param organizationId The organization ID (for verification)
   * @returns The updated meeting
   */
  async updateStatus(id: string, status: MeetingStatus, organizationId: string): Promise<Meeting> {
    try {
      this.validateId(id);
      
      // Verify organization ID
      const existingMeeting = await this.findById(id);
      if (!existingMeeting) {
        throw NotFoundError.resourceNotFound('Meeting', id);
      }
      
      if (existingMeeting.organizationId !== organizationId) {
        throw new ValidationError(`Meeting ${id} does not belong to organization ${organizationId}`);
      }
      
      // Build update data
      const updateData: Record<string, any> = {
        status
      };
      
      // Add timestamps based on status
      if (status === MeetingStatus.IN_PROGRESS && !existingMeeting.startTime) {
        updateData.startedAt = new Date();
      } else if (status === MeetingStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
      
      logger.debug('MeetingRepository.updateStatus', { id, status, updateData });
      
      // Update the meeting
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error in MeetingRepository.updateStatus', { id, status, organizationId, error });
      throw error;
    }
  }

  /**
   * Updates the current stage of a meeting
   * 
   * @param id The meeting ID
   * @param stageType The new meeting stage
   * @param organizationId The organization ID (for verification)
   * @returns The updated meeting
   */
  async updateCurrentStage(id: string, stageType: MeetingStageType, organizationId: string): Promise<Meeting> {
    try {
      this.validateId(id);
      
      // Verify organization ID
      const existingMeeting = await this.findById(id);
      if (!existingMeeting) {
        throw NotFoundError.resourceNotFound('Meeting', id);
      }
      
      if (existingMeeting.organizationId !== organizationId) {
        throw new ValidationError(`Meeting ${id} does not belong to organization ${organizationId}`);
      }
      
      logger.debug('MeetingRepository.updateCurrentStage', { id, stageType });
      
      // Update the meeting
      return await this.update(id, { currentStage: stageType });
    } catch (error) {
      logger.error('Error in MeetingRepository.updateCurrentStage', { id, stageType, organizationId, error });
      throw error;
    }
  }

  /**
   * Gets a comprehensive summary of a meeting with all related data
   * 
   * @param id The meeting ID
   * @param organizationId The organization ID (for verification)
   * @returns The meeting with all related data
   */
  async getMeetingSummary(id: string, organizationId: string): Promise<MeetingWithRelations | null> {
    try {
      this.validateId(id);
      
      logger.debug('MeetingRepository.getMeetingSummary', { id, organizationId });
      
      // Get meeting with all relations
      const meeting = await prisma.meeting.findUnique({
        where: { id },
        include: {
          participants: {
            include: {
              user: true
            }
          },
          stages: {
            orderBy: {
              sequence: 'asc'
            }
          },
          actionItems: {
            include: {
              assignee: true
            }
          },
          createdBy: true
        }
      });
      
      if (!meeting) {
        return null;
      }
      
      // Verify organization ID
      if (meeting.organizationId !== organizationId) {
        throw new ValidationError(`Meeting ${id} does not belong to organization ${organizationId}`);
      }
      
      return meeting as unknown as MeetingWithRelations;
    } catch (error) {
      logger.error('Error in MeetingRepository.getMeetingSummary', { id, organizationId, error });
      throw error;
    }
  }

  /**
   * Updates the calendar event IDs for a meeting
   * 
   * @param id The meeting ID
   * @param calendarInfo Object containing calendar event IDs
   * @param organizationId The organization ID (for verification)
   * @returns The updated meeting
   */
  async updateCalendarEventIds(
    id: string,
    calendarInfo: { googleCalendarEventId?: string; microsoftCalendarEventId?: string },
    organizationId: string
  ): Promise<Meeting> {
    try {
      this.validateId(id);
      
      // Verify organization ID
      const existingMeeting = await this.findById(id);
      if (!existingMeeting) {
        throw NotFoundError.resourceNotFound('Meeting', id);
      }
      
      if (existingMeeting.organizationId !== organizationId) {
        throw new ValidationError(`Meeting ${id} does not belong to organization ${organizationId}`);
      }
      
      // Build update data
      const updateData: Record<string, any> = {};
      
      if (calendarInfo.googleCalendarEventId !== undefined) {
        updateData.googleCalendarEventId = calendarInfo.googleCalendarEventId;
        updateData.calendarProvider = calendarInfo.googleCalendarEventId ? 'GOOGLE' : null;
      }
      
      if (calendarInfo.microsoftCalendarEventId !== undefined) {
        updateData.microsoftCalendarEventId = calendarInfo.microsoftCalendarEventId;
        updateData.calendarProvider = calendarInfo.microsoftCalendarEventId ? 'MICROSOFT' : null;
      }
      
      logger.debug('MeetingRepository.updateCalendarEventIds', { id, calendarInfo, updateData });
      
      // Update the meeting
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error in MeetingRepository.updateCalendarEventIds', { id, calendarInfo, organizationId, error });
      throw error;
    }
  }
}