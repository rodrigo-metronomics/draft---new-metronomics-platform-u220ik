import { BaseRepository } from './baseRepository';
import { MeetingStage, MeetingStageType, MeetingType } from '../types/meeting.types';
import { DEFAULT_MEETING_STAGES } from '../utils/constants/meetingStages';
import { NotFoundError, ValidationError } from '../utils/errors';
import { prisma } from '../config/database';
import { logger } from '../utils/helpers/logger';

/**
 * Repository class for managing meeting stage entities in the database
 * Provides specialized data access methods for meeting stages, supporting the dynamic
 * meeting moderator feature with stage progression, content management, and status tracking.
 */
export class MeetingStageRepository extends BaseRepository<MeetingStage> {
  /**
   * Initializes the repository with the MeetingStage model
   */
  constructor() {
    super('meetingStage');
  }

  /**
   * Finds all stages for a specific meeting ordered by sequence
   * @param meetingId The ID of the meeting
   * @returns Array of meeting stages ordered by sequence
   */
  async findByMeetingId(meetingId: string): Promise<MeetingStage[]> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }

    logger.debug('MeetingStageRepository.findByMeetingId', { meetingId });

    return this.model.findMany({
      where: { meetingId },
      orderBy: { sequence: 'asc' }
    });
  }

  /**
   * Finds a specific stage by meeting ID and stage type
   * @param meetingId The ID of the meeting
   * @param stageType The type of stage to find
   * @returns The meeting stage or null if not found
   */
  async findByMeetingIdAndType(meetingId: string, stageType: MeetingStageType): Promise<MeetingStage | null> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }
    if (stageType === undefined) {
      throw ValidationError.requiredField('stageType');
    }

    logger.debug('MeetingStageRepository.findByMeetingIdAndType', { meetingId, stageType });

    return this.model.findFirst({
      where: {
        meetingId,
        stageType
      }
    });
  }

  /**
   * Creates all required stages for a new meeting based on meeting type
   * @param meetingId The ID of the meeting
   * @param meetingType The type of meeting (DAILY, WEEKLY, QUARTERLY)
   * @returns The created meeting stages
   */
  async createStagesForMeeting(meetingId: string, meetingType: string): Promise<MeetingStage[]> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }
    if (!meetingType) {
      throw ValidationError.requiredField('meetingType');
    }

    logger.debug('MeetingStageRepository.createStagesForMeeting', { meetingId, meetingType });

    const stagesConfig = DEFAULT_MEETING_STAGES[meetingType as MeetingType];
    if (!stagesConfig) {
      throw ValidationError.invalidFormat('meetingType', 'Must be one of: DAILY, WEEKLY, QUARTERLY');
    }

    const stageData = stagesConfig.map(config => ({
      meetingId,
      stageType: config.stageType,
      sequence: config.sequence,
      content: ''
    }));

    // Use a transaction to create all stages at once
    return this.transaction(async (tx) => {
      const createdStages = [];
      for (const stage of stageData) {
        const createdStage = await tx.meetingStage.create({
          data: stage
        });
        createdStages.push(createdStage);
      }
      return createdStages;
    });
  }

  /**
   * Updates the content of a specific meeting stage
   * @param stageId The ID of the stage
   * @param content The new content
   * @param meetingId The ID of the meeting (for validation)
   * @returns The updated meeting stage
   */
  async updateStageContent(stageId: string, content: string, meetingId: string): Promise<MeetingStage> {
    if (!stageId) {
      throw ValidationError.requiredField('stageId');
    }
    if (content === undefined) {
      throw ValidationError.requiredField('content');
    }
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }

    logger.debug('MeetingStageRepository.updateStageContent', { stageId, meetingId, contentLength: content.length });

    // Verify the stage exists and belongs to the meeting
    const existingStage = await this.model.findFirst({
      where: {
        id: stageId,
        meetingId
      }
    });

    if (!existingStage) {
      throw NotFoundError.resourceNotFound('MeetingStage', stageId, { meetingId });
    }

    return this.update(stageId, { content });
  }

  /**
   * Updates the status (startedAt, completedAt) of a meeting stage
   * @param stageId The ID of the stage
   * @param updateData Object containing startedAt and/or completedAt fields
   * @param meetingId The ID of the meeting (for validation)
   * @returns The updated meeting stage
   */
  async updateStageStatus(
    stageId: string, 
    updateData: { startedAt?: Date | null; completedAt?: Date | null }, 
    meetingId: string
  ): Promise<MeetingStage> {
    if (!stageId) {
      throw ValidationError.requiredField('stageId');
    }
    if (!updateData) {
      throw ValidationError.requiredField('updateData');
    }
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }
    
    // Validate the update data structure
    const validKeys = ['startedAt', 'completedAt'];
    const invalidKeys = Object.keys(updateData).filter(key => !validKeys.includes(key));
    
    if (invalidKeys.length > 0) {
      throw ValidationError.invalidFormat('updateData', `Only 'startedAt' and 'completedAt' fields are allowed. Invalid fields: ${invalidKeys.join(', ')}`);
    }

    logger.debug('MeetingStageRepository.updateStageStatus', { stageId, meetingId, updateData });

    // Verify the stage exists and belongs to the meeting
    const existingStage = await this.model.findFirst({
      where: {
        id: stageId,
        meetingId
      }
    });

    if (!existingStage) {
      throw NotFoundError.resourceNotFound('MeetingStage', stageId, { meetingId });
    }

    return this.update(stageId, updateData);
  }

  /**
   * Gets the current active stage for a meeting (started but not completed)
   * @param meetingId The ID of the meeting
   * @returns The current stage or null if no active stage
   */
  async getCurrentStage(meetingId: string): Promise<MeetingStage | null> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }

    logger.debug('MeetingStageRepository.getCurrentStage', { meetingId });

    return this.model.findFirst({
      where: {
        meetingId,
        startedAt: { not: null },
        completedAt: null
      }
    });
  }

  /**
   * Gets the next stage in sequence after the current stage
   * @param meetingId The ID of the meeting
   * @param currentSequence The sequence number of the current stage
   * @returns The next stage or null if no more stages
   */
  async getNextStage(meetingId: string, currentSequence: number): Promise<MeetingStage | null> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }
    if (currentSequence === undefined) {
      throw ValidationError.requiredField('currentSequence');
    }

    logger.debug('MeetingStageRepository.getNextStage', { meetingId, currentSequence });

    return this.model.findFirst({
      where: {
        meetingId,
        sequence: { gt: currentSequence }
      },
      orderBy: {
        sequence: 'asc'
      }
    });
  }

  /**
   * Gets the previous stage in sequence before the current stage
   * @param meetingId The ID of the meeting
   * @param currentSequence The sequence number of the current stage
   * @returns The previous stage or null if no previous stages
   */
  async getPreviousStage(meetingId: string, currentSequence: number): Promise<MeetingStage | null> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }
    if (currentSequence === undefined) {
      throw ValidationError.requiredField('currentSequence');
    }

    logger.debug('MeetingStageRepository.getPreviousStage', { meetingId, currentSequence });

    return this.model.findFirst({
      where: {
        meetingId,
        sequence: { lt: currentSequence }
      },
      orderBy: {
        sequence: 'desc'
      }
    });
  }

  /**
   * Gets the progress of stages for a meeting
   * @param meetingId The ID of the meeting
   * @returns Object with total stages, completed stages, and current active stage
   */
  async getStageProgress(meetingId: string): Promise<{ total: number; completed: number; current: MeetingStage | null }> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }

    logger.debug('MeetingStageRepository.getStageProgress', { meetingId });

    // Get all stages for the meeting
    const stages = await this.findByMeetingId(meetingId);
    
    // Count total and completed stages
    const total = stages.length;
    const completed = stages.filter(stage => stage.completedAt !== null).length;
    
    // Get current active stage
    const current = await this.getCurrentStage(meetingId);
    
    return { total, completed, current };
  }

  /**
   * Resets all stages for a meeting (clears startedAt and completedAt)
   * @param meetingId The ID of the meeting
   * @returns The number of stages reset
   */
  async resetStages(meetingId: string): Promise<number> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }

    logger.debug('MeetingStageRepository.resetStages', { meetingId });

    const result = await this.model.updateMany({
      where: { meetingId },
      data: {
        startedAt: null,
        completedAt: null
      }
    });

    return result.count;
  }

  /**
   * Gets all incomplete stages for a meeting
   * @param meetingId The ID of the meeting
   * @returns Array of incomplete meeting stages
   */
  async getIncompleteStages(meetingId: string): Promise<MeetingStage[]> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }

    logger.debug('MeetingStageRepository.getIncompleteStages', { meetingId });

    return this.model.findMany({
      where: {
        meetingId,
        completedAt: null
      },
      orderBy: {
        sequence: 'asc'
      }
    });
  }

  /**
   * Gets all stages between two sequence numbers for a meeting
   * @param meetingId The ID of the meeting
   * @param startSequence The starting sequence number (inclusive)
   * @param endSequence The ending sequence number (inclusive)
   * @returns Array of meeting stages between the sequences
   */
  async getStagesBetweenSequences(meetingId: string, startSequence: number, endSequence: number): Promise<MeetingStage[]> {
    if (!meetingId) {
      throw ValidationError.requiredField('meetingId');
    }
    if (startSequence === undefined) {
      throw ValidationError.requiredField('startSequence');
    }
    if (endSequence === undefined) {
      throw ValidationError.requiredField('endSequence');
    }

    logger.debug('MeetingStageRepository.getStagesBetweenSequences', { meetingId, startSequence, endSequence });

    return this.model.findMany({
      where: {
        meetingId,
        sequence: {
          gte: startSequence,
          lte: endSequence
        }
      },
      orderBy: {
        sequence: 'asc'
      }
    });
  }
}