/**
 * Constants defining the structure and default configuration for meeting stages
 * in the Metronomics Platform. This file supports the dynamic meeting moderator
 * feature by providing standardized stage definitions and sequences.
 * 
 * The meeting stages follow the Metronomics framework and are designed to facilitate
 * efficient and productive meetings with clear structure and purpose.
 */

import { MeetingType, MeetingStageType } from '../../types/meeting.types';

/**
 * Defines detailed information for each meeting stage type, including
 * title, description, and prompt text that guides facilitators.
 * 
 * These prompts are displayed in the meeting interface to help the moderator
 * guide the meeting effectively through each stage.
 */
export const MEETING_STAGES: Record<MeetingStageType, { title: string; description: string; prompt: string }> = {
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
 * Defines the default sequence of stages for each meeting type.
 * 
 * These configurations determine which stages are included in each meeting type
 * and their sequence, supporting different meeting templates:
 * 
 * - Daily meetings: Focused on quick updates, priorities, and blockers
 * - Weekly meetings: Include metrics review in addition to daily meeting elements
 * - Quarterly meetings: Similar to weekly but with deeper strategic focus
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