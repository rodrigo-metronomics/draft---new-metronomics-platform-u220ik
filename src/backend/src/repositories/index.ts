import { BaseRepository } from './baseRepository';
import { ActionItemRepository } from './actionItemRepository';
import { GoalRepository } from './goalRepository';
import { KFFMRepository } from './kffmRepository';
import { KFFMNodeRepository } from './kffmNodeRepository';
import { KFFMConnectionRepository } from './kffmConnectionRepository';
import { MeetingRepository } from './meetingRepository';
import { MeetingParticipantRepository } from './meetingParticipantRepository';
import { MeetingStageRepository } from './meetingStageRepository';
import { MetricRepository } from './metricRepository';
import { MetricValueRepository } from './metricValueRepository';
import { MetricThresholdRepository } from './metricThresholdRepository';
import { MilestoneRepository } from './milestoneRepository';
import { NotificationRepository } from './notificationRepository';
import { OrganizationRepository } from './organizationRepository';
import { TeamRepository } from './teamRepository';
import { TeamMemberRepository } from './teamMemberRepository';
import { UserRepository } from './userRepository';

// Export all repository classes
export {
  BaseRepository,
  ActionItemRepository,
  GoalRepository,
  KFFMRepository,
  KFFMNodeRepository,
  KFFMConnectionRepository,
  MeetingRepository,
  MeetingParticipantRepository,
  MeetingStageRepository,
  MetricRepository,
  MetricValueRepository,
  MetricThresholdRepository,
  MilestoneRepository,
  NotificationRepository,
  OrganizationRepository,
  TeamRepository,
  TeamMemberRepository,
  UserRepository,
};

// Create and export instances of each repository
export const actionItemRepository = new ActionItemRepository();
export const goalRepository = new GoalRepository();
export const kffmRepository = new KFFMRepository();
export const kffmNodeRepository = new KFFMNodeRepository();
export const kffmConnectionRepository = new KFFMConnectionRepository();
export const meetingRepository = new MeetingRepository();
export const meetingParticipantRepository = new MeetingParticipantRepository();
export const meetingStageRepository = new MeetingStageRepository();
export const metricRepository = new MetricRepository();
export const metricValueRepository = new MetricValueRepository();
export const metricThresholdRepository = new MetricThresholdRepository();
export const milestoneRepository = new MilestoneRepository();
export const notificationRepository = new NotificationRepository();
export const organizationRepository = new OrganizationRepository();
export const teamRepository = new TeamRepository();
export const teamMemberRepository = new TeamMemberRepository();
export const userRepository = new UserRepository();