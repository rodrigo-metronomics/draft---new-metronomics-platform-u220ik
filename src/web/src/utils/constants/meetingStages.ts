/**
 * Constants defining meeting stages and their configurations for the Metronomics Platform.
 * This file provides standardized stage definitions, prompts, and sequences for different
 * meeting types (daily, weekly, quarterly) to support the dynamic meeting moderator feature.
 */
import { MeetingType, MeetingStageType } from '../../types/meeting.types';

/**
 * Interface defining the structure of meeting stage information
 */
export interface MeetingStageInfo {
  title: string;
  description: string;
  prompt: string;
}

/**
 * Defines detailed information for each meeting stage type, including title, description, and prompt text
 */
export const MEETING_STAGES: Record<MeetingStageType, MeetingStageInfo> = {
  [MeetingStageType.SETUP]: {
    title: 'Meeting Setup',
    description: 'Prepare for the meeting by reviewing the agenda and confirming participants',
    prompt: 'Review the meeting agenda and ensure all participants are present before starting.'
  },
  [MeetingStageType.GOOD_NEWS]: {
    title: 'Good News',
    description: 'Share positive updates or achievements since the last meeting',
    prompt: 'Take a moment to share any good news or positive updates with the team.'
  },
  [MeetingStageType.PREVIOUS_ACTIONS]: {
    title: 'Previous Action Items',
    description: 'Review action items from the previous meeting',
    prompt: "Let's review the action items from our previous meeting and update their status."
  },
  [MeetingStageType.METRICS]: {
    title: 'Metrics Review',
    description: 'Review key performance indicators and metrics',
    prompt: "Let's review our key metrics and discuss any significant changes or trends."
  },
  [MeetingStageType.PRIORITIES]: {
    title: "Today's Priorities",
    description: 'Discuss priorities and focus areas for the day/week',
    prompt: 'What are your top priorities for today/this week? What are you focusing on?'
  },
  [MeetingStageType.BLOCKERS]: {
    title: 'Blockers',
    description: 'Identify any obstacles or challenges that need to be addressed',
    prompt: 'Are there any blockers or challenges preventing you from making progress?'
  },
  [MeetingStageType.NEW_ACTIONS]: {
    title: 'New Action Items',
    description: 'Create new action items based on the discussion',
    prompt: "Let's create action items based on our discussion today. Who will take ownership of each item?"
  },
  [MeetingStageType.SUMMARY]: {
    title: 'Meeting Summary',
    description: 'Summarize key points and decisions from the meeting',
    prompt: "Let's summarize the key points and decisions from today's meeting."
  }
};

/**
 * Defines the default sequence of stages for each meeting type (daily, weekly, quarterly)
 */
export const DEFAULT_MEETING_STAGES: Record<MeetingType, { stageType: MeetingStageType; sequence: number }[]> = {
  [MeetingType.DAILY]: [
    { stageType: MeetingStageType.SETUP, sequence: 0 },
    { stageType: MeetingStageType.GOOD_NEWS, sequence: 1 },
    { stageType: MeetingStageType.PREVIOUS_ACTIONS, sequence: 2 },
    { stageType: MeetingStageType.PRIORITIES, sequence: 3 },
    { stageType: MeetingStageType.BLOCKERS, sequence: 4 },
    { stageType: MeetingStageType.NEW_ACTIONS, sequence: 5 },
    { stageType: MeetingStageType.SUMMARY, sequence: 6 }
  ],
  [MeetingType.WEEKLY]: [
    { stageType: MeetingStageType.SETUP, sequence: 0 },
    { stageType: MeetingStageType.GOOD_NEWS, sequence: 1 },
    { stageType: MeetingStageType.PREVIOUS_ACTIONS, sequence: 2 },
    { stageType: MeetingStageType.METRICS, sequence: 3 },
    { stageType: MeetingStageType.PRIORITIES, sequence: 4 },
    { stageType: MeetingStageType.BLOCKERS, sequence: 5 },
    { stageType: MeetingStageType.NEW_ACTIONS, sequence: 6 },
    { stageType: MeetingStageType.SUMMARY, sequence: 7 }
  ],
  [MeetingType.QUARTERLY]: [
    { stageType: MeetingStageType.SETUP, sequence: 0 },
    { stageType: MeetingStageType.GOOD_NEWS, sequence: 1 },
    { stageType: MeetingStageType.PREVIOUS_ACTIONS, sequence: 2 },
    { stageType: MeetingStageType.METRICS, sequence: 3 },
    { stageType: MeetingStageType.PRIORITIES, sequence: 4 },
    { stageType: MeetingStageType.BLOCKERS, sequence: 5 },
    { stageType: MeetingStageType.NEW_ACTIONS, sequence: 6 },
    { stageType: MeetingStageType.SUMMARY, sequence: 7 }
  ]
};

/**
 * Helper function to get the sequence number of a stage for a specific meeting type
 * 
 * @param meetingType - The type of meeting (daily, weekly, quarterly)
 * @param stageType - The type of stage to find the sequence for
 * @returns The sequence number of the stage, or -1 if not found
 */
export function getStageSequence(meetingType: MeetingType, stageType: MeetingStageType): number {
  const stages = DEFAULT_MEETING_STAGES[meetingType];
  const stage = stages.find(s => s.stageType === stageType);
  return stage ? stage.sequence : -1;
}