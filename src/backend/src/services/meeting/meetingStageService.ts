import { MeetingStageRepository } from '../../repositories/meetingStageRepository';
import { MeetingRepository } from '../../repositories/meetingRepository';
import { updateMeetingStage, updateMeetingStatus } from '../realtime/firestoreService';
import { 
  MeetingStage, 
  MeetingStageType, 
  UpdateMeetingStageDto 
} from '../../types/meeting.types';
import { MEETING_STAGES } from '../../utils/constants/meetingStages';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors';
import { logger } from '../../utils/helpers/logger';

/**
 * Service class for managing meeting stages in the Metronomics Platform
 */
export class MeetingStageService {
  private meetingStageRepository: MeetingStageRepository;
  private meetingRepository: MeetingRepository;

  /**
   * Initializes the MeetingStageService with required dependencies
   * @param meetingStageRepository Repository for meeting stage data access
   * @param meetingRepository Repository for meeting data access
   */
  constructor(
    meetingStageRepository: MeetingStageRepository,
    meetingRepository: MeetingRepository
  ) {
    this.meetingStageRepository = meetingStageRepository;
    this.meetingRepository = meetingRepository;
  }

  /**
   * Creates the default stages for a new meeting based on meeting type
   * @param meetingId The meeting ID
   * @param meetingType The type of meeting (DAILY, WEEKLY, QUARTERLY)
   * @returns The created meeting stages
   */
  async createStagesForMeeting(meetingId: string, meetingType: string): Promise<MeetingStage[]> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!meetingType) {
        throw ValidationError.requiredField('meetingType');
      }

      logger.info('Creating stages for meeting', { meetingId, meetingType });
      
      // Create stages for the meeting using the repository
      const stages = await this.meetingStageRepository.createStagesForMeeting(meetingId, meetingType);
      
      logger.info('Successfully created stages for meeting', { meetingId, stageCount: stages.length });
      
      return stages;
    } catch (error) {
      logger.error('Failed to create stages for meeting', { meetingId, meetingType, error });
      throw error;
    }
  }

  /**
   * Retrieves all stages for a specific meeting
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @returns Array of meeting stages ordered by sequence
   */
  async getStagesByMeetingId(meetingId: string, organizationId: string): Promise<MeetingStage[]> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Getting stages for meeting', { meetingId, organizationId });
      
      // Get stages for the meeting
      const stages = await this.meetingStageRepository.findByMeetingId(meetingId);
      
      return stages;
    } catch (error) {
      logger.error('Failed to get stages for meeting', { meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Retrieves a specific stage by ID
   * @param stageId The stage ID
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @returns The meeting stage if found
   */
  async getStageById(stageId: string, meetingId: string, organizationId: string): Promise<MeetingStage> {
    try {
      if (!stageId) {
        throw ValidationError.requiredField('stageId');
      }
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Getting stage by ID', { stageId, meetingId, organizationId });
      
      // Get the stage by ID
      const stage = await this.meetingStageRepository.findById(stageId);
      
      if (!stage) {
        throw NotFoundError.resourceNotFound('MeetingStage', stageId);
      }
      
      // Verify the stage belongs to the specified meeting
      if (stage.meetingId !== meetingId) {
        throw ValidationError.invalidFormat('stageId', `Stage does not belong to meeting ${meetingId}`);
      }
      
      return stage;
    } catch (error) {
      logger.error('Failed to get stage by ID', { stageId, meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Retrieves a specific stage by its type for a meeting
   * @param meetingId The meeting ID
   * @param stageType The type of stage to retrieve
   * @param organizationId The organization ID (for access control)
   * @returns The meeting stage or null if not found
   */
  async getStageByType(meetingId: string, stageType: MeetingStageType, organizationId: string): Promise<MeetingStage | null> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (stageType === undefined) {
        throw ValidationError.requiredField('stageType');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Getting stage by type', { meetingId, stageType, organizationId });
      
      // Get the stage by type
      const stage = await this.meetingStageRepository.findByMeetingIdAndType(meetingId, stageType);
      
      return stage;
    } catch (error) {
      logger.error('Failed to get stage by type', { meetingId, stageType, organizationId, error });
      throw error;
    }
  }

  /**
   * Gets the current active stage for a meeting
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @returns The current active stage or null if no active stage
   */
  async getCurrentStage(meetingId: string, organizationId: string): Promise<MeetingStage | null> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Getting current stage for meeting', { meetingId, organizationId });
      
      // Get the current active stage
      const currentStage = await this.meetingStageRepository.getCurrentStage(meetingId);
      
      return currentStage;
    } catch (error) {
      logger.error('Failed to get current stage for meeting', { meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Updates the content of a specific meeting stage
   * @param stageId The stage ID
   * @param content The new content
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @param userId The user ID making the update
   * @returns The updated meeting stage
   */
  async updateStageContent(
    stageId: string, 
    content: string, 
    meetingId: string, 
    organizationId: string,
    userId: string
  ): Promise<MeetingStage> {
    try {
      if (!stageId) {
        throw ValidationError.requiredField('stageId');
      }
      if (content === undefined) {
        throw ValidationError.requiredField('content');
      }
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }
      if (!userId) {
        throw ValidationError.requiredField('userId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Updating stage content', { stageId, meetingId, organizationId, userId, contentLength: content.length });
      
      // Update the stage content
      const updatedStage = await this.meetingStageRepository.updateStageContent(stageId, content, meetingId);
      
      // Synchronize the update to Firestore for real-time collaboration
      await updateMeetingStage(meetingId, stageId, { content, updatedAt: new Date() }, userId);
      
      logger.info('Successfully updated stage content', { stageId, meetingId, userId });
      
      return updatedStage;
    } catch (error) {
      logger.error('Failed to update stage content', { stageId, meetingId, organizationId, userId, error });
      throw error;
    }
  }

  /**
   * Advances the meeting to the next stage in sequence
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @returns The next stage or null if meeting completed
   */
  async moveToNextStage(meetingId: string, organizationId: string): Promise<MeetingStage | null> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Moving to next stage', { meetingId, organizationId });
      
      // Get current active stage
      let currentStage = await this.meetingStageRepository.getCurrentStage(meetingId);
      
      // If no current stage (e.g., meeting just started), start with the first stage
      if (!currentStage) {
        const stages = await this.meetingStageRepository.findByMeetingId(meetingId);
        if (stages.length === 0) {
          logger.warn('No stages found for meeting', { meetingId });
          return null;
        }
        
        // Find the first stage by sequence
        const firstStage = stages.reduce((prev, curr) => 
          (prev.sequence < curr.sequence) ? prev : curr
        );
        
        // Mark the first stage as started
        currentStage = await this.meetingStageRepository.updateStageStatus(
          firstStage.id, 
          { startedAt: new Date() }, 
          meetingId
        );
        
        // Update the meeting's current stage
        await this.meetingRepository.updateCurrentStage(meetingId, firstStage.stageType, organizationId);
        
        // Sync the stage transition to Firestore for real-time collaboration
        await updateMeetingStatus(meetingId, meeting.status, 'system');
        
        return currentStage;
      }
      
      // Mark the current stage as completed
      await this.meetingStageRepository.updateStageStatus(
        currentStage.id,
        { completedAt: new Date() },
        meetingId
      );
      
      // Get the next stage
      const nextStage = await this.meetingStageRepository.getNextStage(meetingId, currentStage.sequence);
      
      // If there's a next stage, mark it as started and update the meeting's current stage
      if (nextStage) {
        // Mark the next stage as started
        await this.meetingStageRepository.updateStageStatus(
          nextStage.id,
          { startedAt: new Date() },
          meetingId
        );
        
        // Update the meeting's current stage
        await this.meetingRepository.updateCurrentStage(meetingId, nextStage.stageType, organizationId);
        
        // Sync the stage transition to Firestore for real-time collaboration
        await updateMeetingStatus(meetingId, meeting.status, 'system');
        
        logger.info('Successfully moved to next stage', { 
          meetingId, 
          previousStage: currentStage.stageType, 
          nextStage: nextStage.stageType 
        });
        
        return nextStage;
      } else {
        logger.info('Meeting reached final stage', { meetingId });
        
        // No next stage - we're at the end
        // Update the meeting to set the current stage to null
        await this.meetingRepository.updateCurrentStage(meetingId, null, organizationId);
        
        // Sync the completion to Firestore
        await updateMeetingStatus(meetingId, meeting.status, 'system');
        
        return null;
      }
    } catch (error) {
      logger.error('Failed to move to next stage', { meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Moves the meeting back to the previous stage in sequence
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @returns The previous stage or null if no previous stage
   */
  async moveToPreviousStage(meetingId: string, organizationId: string): Promise<MeetingStage | null> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Moving to previous stage', { meetingId, organizationId });
      
      // Get current active stage
      const currentStage = await this.meetingStageRepository.getCurrentStage(meetingId);
      
      // If no current stage, we can't go back
      if (!currentStage) {
        logger.warn('No current stage to move back from', { meetingId });
        return null;
      }
      
      // Reset the current stage (clear startedAt and completedAt)
      await this.meetingStageRepository.updateStageStatus(
        currentStage.id,
        { startedAt: null, completedAt: null },
        meetingId
      );
      
      // Get the previous stage
      const previousStage = await this.meetingStageRepository.getPreviousStage(meetingId, currentStage.sequence);
      
      // If there's a previous stage, mark it as started and not completed
      if (previousStage) {
        // Mark the previous stage as active (started but not completed)
        await this.meetingStageRepository.updateStageStatus(
          previousStage.id,
          { startedAt: new Date(), completedAt: null },
          meetingId
        );
        
        // Update the meeting's current stage
        await this.meetingRepository.updateCurrentStage(meetingId, previousStage.stageType, organizationId);
        
        // Sync the stage transition to Firestore for real-time collaboration
        await updateMeetingStatus(meetingId, meeting.status, 'system');
        
        logger.info('Successfully moved to previous stage', { 
          meetingId, 
          previousStage: currentStage.stageType, 
          newStage: previousStage.stageType 
        });
        
        return previousStage;
      } else {
        logger.warn('No previous stage to move to', { meetingId, currentStage: currentStage.stageType });
        
        return null;
      }
    } catch (error) {
      logger.error('Failed to move to previous stage', { meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Jumps directly to a specific stage in the meeting
   * @param stageId The target stage ID
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @returns The target stage
   */
  async jumpToStage(stageId: string, meetingId: string, organizationId: string): Promise<MeetingStage> {
    try {
      if (!stageId) {
        throw ValidationError.requiredField('stageId');
      }
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Jumping to stage', { stageId, meetingId, organizationId });
      
      // Get current active stage
      const currentStage = await this.meetingStageRepository.getCurrentStage(meetingId);
      
      // Get the target stage
      const targetStage = await this.meetingStageRepository.findById(stageId);
      if (!targetStage) {
        throw NotFoundError.resourceNotFound('MeetingStage', stageId);
      }
      
      // Verify the target stage belongs to the meeting
      if (targetStage.meetingId !== meetingId) {
        throw ValidationError.invalidFormat('stageId', `Stage does not belong to meeting ${meetingId}`);
      }
      
      // If there's a current stage, reset it
      if (currentStage && currentStage.id !== stageId) {
        await this.meetingStageRepository.updateStageStatus(
          currentStage.id,
          { startedAt: null, completedAt: null },
          meetingId
        );
      }
      
      // Mark the target stage as started
      await this.meetingStageRepository.updateStageStatus(
        targetStage.id,
        { startedAt: new Date(), completedAt: null },
        meetingId
      );
      
      // Update the meeting's current stage
      await this.meetingRepository.updateCurrentStage(meetingId, targetStage.stageType, organizationId);
      
      // Sync the stage transition to Firestore for real-time collaboration
      await updateMeetingStatus(meetingId, meeting.status, 'system');
      
      logger.info('Successfully jumped to stage', { 
        meetingId, 
        fromStage: currentStage?.stageType, 
        toStage: targetStage.stageType 
      });
      
      return targetStage;
    } catch (error) {
      logger.error('Failed to jump to stage', { stageId, meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Gets the progress of stages for a meeting
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @returns Object with total stages, completed stages, current stage, and completion percentage
   */
  async getStageProgress(meetingId: string, organizationId: string): Promise<{ 
    total: number; 
    completed: number; 
    current: MeetingStage | null;
    percentage: number;
  }> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Getting stage progress', { meetingId, organizationId });
      
      // Get the stage progress data
      const progress = await this.meetingStageRepository.getStageProgress(meetingId);
      
      // Calculate completion percentage
      const percentage = progress.total > 0 
        ? Math.round((progress.completed / progress.total) * 100) 
        : 0;
      
      return { ...progress, percentage };
    } catch (error) {
      logger.error('Failed to get stage progress', { meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Resets all stages for a meeting to their initial state
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   * @returns The number of stages reset
   */
  async resetStages(meetingId: string, organizationId: string): Promise<number> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Resetting stages for meeting', { meetingId, organizationId });
      
      // Reset all stages
      const count = await this.meetingStageRepository.resetStages(meetingId);
      
      // Update the meeting to clear the current stage
      await this.meetingRepository.updateCurrentStage(meetingId, null, organizationId);
      
      // Sync the reset to Firestore for real-time collaboration
      await updateMeetingStatus(meetingId, meeting.status, 'system');
      
      logger.info('Successfully reset stages for meeting', { meetingId, stageCount: count });
      
      return count;
    } catch (error) {
      logger.error('Failed to reset stages for meeting', { meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Marks all stages as completed for a finished meeting
   * @param meetingId The meeting ID
   * @param organizationId The organization ID (for access control)
   */
  async completeMeeting(meetingId: string, organizationId: string): Promise<void> {
    try {
      if (!meetingId) {
        throw ValidationError.requiredField('meetingId');
      }
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      // Verify the meeting exists and belongs to the organization
      const meeting = await this.meetingRepository.findById(meetingId);
      if (!meeting) {
        throw NotFoundError.resourceNotFound('Meeting', meetingId);
      }
      if (meeting.organizationId !== organizationId) {
        throw new AuthorizationError(`Meeting ${meetingId} does not belong to organization ${organizationId}`);
      }

      logger.debug('Completing all stages for meeting', { meetingId, organizationId });
      
      // Get all incomplete stages
      const incompleteStages = await this.meetingStageRepository.getIncompleteStages(meetingId);
      
      // Mark all stages as completed with the current timestamp
      const now = new Date();
      for (const stage of incompleteStages) {
        await this.meetingStageRepository.updateStageStatus(
          stage.id,
          { 
            startedAt: stage.startedAt || now, 
            completedAt: now 
          },
          meetingId
        );
      }
      
      // Update the meeting to set the current stage to null
      await this.meetingRepository.updateCurrentStage(meetingId, null, organizationId);
      
      // Sync the completion to Firestore for real-time collaboration
      await updateMeetingStatus(meetingId, meeting.status, 'system');
      
      logger.info('Successfully completed all stages for meeting', { 
        meetingId, 
        stageCount: incompleteStages.length 
      });
    } catch (error) {
      logger.error('Failed to complete stages for meeting', { meetingId, organizationId, error });
      throw error;
    }
  }

  /**
   * Gets detailed information about a stage including its title, description, and prompt
   * @param stageType The stage type to get details for
   * @returns Stage details from constants
   */
  getStageDetails(stageType: MeetingStageType): { title: string; description: string; prompt: string } {
    try {
      const stageDetails = MEETING_STAGES[stageType];
      if (!stageDetails) {
        throw ValidationError.invalidFormat('stageType', 'Invalid meeting stage type');
      }
      
      return stageDetails;
    } catch (error) {
      logger.error('Failed to get stage details', { stageType, error });
      throw error;
    }
  }
}