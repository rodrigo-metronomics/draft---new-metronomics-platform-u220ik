import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { MeetingParticipant, ParticipantRole, AttendanceStatus } from '../types/meeting.types';
import { logger } from '../utils/helpers/logger';
import { NotFoundError } from '../utils/errors';

/**
 * Repository for managing meeting participants in the Metronomics Platform.
 * Provides CRUD operations and specialized queries for meeting participants,
 * handling the relationship between users and meetings.
 */
export class MeetingParticipantRepository extends BaseRepository<MeetingParticipant> {
  /**
   * Initializes the MeetingParticipantRepository with the meetingParticipant model
   */
  constructor() {
    super('meetingParticipant');
  }

  /**
   * Finds all participants for a specific meeting
   * @param meetingId The ID of the meeting
   * @param options Additional query options such as includes
   * @returns Array of meeting participants
   */
  async findByMeetingId(
    meetingId: string,
    options: Record<string, any> = {}
  ): Promise<MeetingParticipant[]> {
    try {
      this.validateId(meetingId);
      
      logger.debug('MeetingParticipantRepository.findByMeetingId', { meetingId });
      
      const include = this.buildInclude(options);
      
      const participants = await this.model.findMany({
        where: { meetingId },
        ...include
      });
      
      return participants;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.findByMeetingId', { meetingId, error });
      throw error;
    }
  }

  /**
   * Finds a participant by user ID and meeting ID
   * @param userId The ID of the user
   * @param meetingId The ID of the meeting
   * @returns Meeting participant or null if not found
   */
  async findByUserAndMeeting(
    userId: string,
    meetingId: string
  ): Promise<MeetingParticipant | null> {
    try {
      this.validateId(userId);
      this.validateId(meetingId);
      
      logger.debug('MeetingParticipantRepository.findByUserAndMeeting', { userId, meetingId });
      
      const participant = await this.model.findFirst({
        where: {
          userId,
          meetingId
        }
      });
      
      return participant;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.findByUserAndMeeting', { userId, meetingId, error });
      throw error;
    }
  }

  /**
   * Finds a participant by user ID and meeting ID or throws an error if not found
   * @param userId The ID of the user
   * @param meetingId The ID of the meeting
   * @returns Meeting participant
   * @throws NotFoundError if participant not found
   */
  async findByUserAndMeetingOrThrow(
    userId: string,
    meetingId: string
  ): Promise<MeetingParticipant> {
    const participant = await this.findByUserAndMeeting(userId, meetingId);
    
    if (!participant) {
      throw NotFoundError.resourceNotFound('MeetingParticipant', `userId:${userId}-meetingId:${meetingId}`);
    }
    
    return participant;
  }

  /**
   * Finds all meeting participations for a specific user
   * @param userId The ID of the user
   * @param options Additional query options such as includes
   * @returns Array of meeting participants
   */
  async findByUserId(
    userId: string,
    options: Record<string, any> = {}
  ): Promise<MeetingParticipant[]> {
    try {
      this.validateId(userId);
      
      logger.debug('MeetingParticipantRepository.findByUserId', { userId });
      
      const include = this.buildInclude(options);
      
      const participants = await this.model.findMany({
        where: { userId },
        ...include
      });
      
      return participants;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.findByUserId', { userId, error });
      throw error;
    }
  }

  /**
   * Creates multiple meeting participants in a single transaction
   * @param participantData Array of participant data to create
   * @returns Array of created meeting participants
   */
  async createMany(
    participantData: Record<string, any>[]
  ): Promise<MeetingParticipant[]> {
    try {
      if (!participantData || !Array.isArray(participantData) || participantData.length === 0) {
        throw new Error('Invalid participant data: expected non-empty array');
      }
      
      logger.debug('MeetingParticipantRepository.createMany', { count: participantData.length });
      
      const createdParticipants = await prisma.$transaction(async (tx) => {
        const participants = [];
        for (const data of participantData) {
          const participant = await tx.meetingParticipant.create({
            data
          });
          participants.push(participant);
        }
        return participants;
      });
      
      return createdParticipants;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.createMany', { error });
      throw error;
    }
  }

  /**
   * Updates the role of a meeting participant
   * @param id The ID of the meeting participant
   * @param role The new role to assign
   * @returns Updated meeting participant
   */
  async updateParticipantRole(
    id: string,
    role: ParticipantRole
  ): Promise<MeetingParticipant> {
    try {
      this.validateId(id);
      
      logger.debug('MeetingParticipantRepository.updateParticipantRole', { id, role });
      
      const updatedParticipant = await this.update(id, { role });
      
      return updatedParticipant;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.updateParticipantRole', { id, role, error });
      throw error;
    }
  }

  /**
   * Updates the attendance status of a meeting participant
   * @param id The ID of the meeting participant
   * @param status The new attendance status
   * @returns Updated meeting participant
   */
  async updateAttendanceStatus(
    id: string,
    status: AttendanceStatus
  ): Promise<MeetingParticipant> {
    try {
      this.validateId(id);
      
      logger.debug('MeetingParticipantRepository.updateAttendanceStatus', { id, status });
      
      const updatedParticipant = await this.update(id, { attendanceStatus: status });
      
      return updatedParticipant;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.updateAttendanceStatus', { id, status, error });
      throw error;
    }
  }

  /**
   * Records when a participant joins a meeting
   * @param id The ID of the meeting participant
   * @returns Updated meeting participant
   */
  async recordJoined(id: string): Promise<MeetingParticipant> {
    try {
      this.validateId(id);
      
      logger.debug('MeetingParticipantRepository.recordJoined', { id });
      
      const updatedParticipant = await this.update(id, { 
        joinedAt: new Date()
      });
      
      return updatedParticipant;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.recordJoined', { id, error });
      throw error;
    }
  }

  /**
   * Records when a participant leaves a meeting
   * @param id The ID of the meeting participant
   * @returns Updated meeting participant
   */
  async recordLeft(id: string): Promise<MeetingParticipant> {
    try {
      this.validateId(id);
      
      logger.debug('MeetingParticipantRepository.recordLeft', { id });
      
      const updatedParticipant = await this.update(id, { 
        leftAt: new Date()
      });
      
      return updatedParticipant;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.recordLeft', { id, error });
      throw error;
    }
  }

  /**
   * Deletes all participants for a specific meeting
   * @param meetingId The ID of the meeting
   * @returns Number of deleted participants
   */
  async deleteByMeetingId(meetingId: string): Promise<number> {
    try {
      this.validateId(meetingId);
      
      logger.debug('MeetingParticipantRepository.deleteByMeetingId', { meetingId });
      
      const result = await this.model.deleteMany({
        where: { meetingId }
      });
      
      return result.count;
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.deleteByMeetingId', { meetingId, error });
      throw error;
    }
  }

  /**
   * Deletes a participant by user ID and meeting ID
   * @param userId The ID of the user
   * @param meetingId The ID of the meeting
   * @returns Deleted meeting participant or null if not found
   */
  async deleteByUserAndMeeting(
    userId: string,
    meetingId: string
  ): Promise<MeetingParticipant | null> {
    try {
      this.validateId(userId);
      this.validateId(meetingId);
      
      logger.debug('MeetingParticipantRepository.deleteByUserAndMeeting', { userId, meetingId });
      
      const participant = await this.findByUserAndMeeting(userId, meetingId);
      
      if (!participant) {
        return null;
      }
      
      return await this.delete(participant.id);
    } catch (error) {
      logger.error('Error in MeetingParticipantRepository.deleteByUserAndMeeting', { userId, meetingId, error });
      throw error;
    }
  }
}