/**
 * TypeScript type definitions for strategic goals and milestones in the Metronomics Platform frontend.
 * Defines interfaces, enums, and types for managing strategic goals (BHAG, 3HAG, 1HAG, Quarterly)
 * and their associated milestones, supporting the strategic roadmap visualization and management features.
 */

import { ID, DateRange } from './common.types';

/**
 * Enum representing the types of strategic goals in the Metronomics framework
 */
export enum GoalType {
  BHAG = 'BHAG',                 // Big Hairy Audacious Goal (long-term vision)
  THREE_HAG = 'THREE_HAG',       // 3-Year Highly Achievable Goal
  ONE_HAG = 'ONE_HAG',           // 1-Year Highly Achievable Goal
  QUARTERLY = 'QUARTERLY'        // Quarterly Goal
}

/**
 * Enum representing the possible statuses of a strategic goal
 */
export enum GoalStatus {
  DRAFT = 'DRAFT',               // Goal is in draft/planning phase
  ACTIVE = 'ACTIVE',             // Goal is currently active and being pursued
  AT_RISK = 'AT_RISK',           // Goal is active but at risk of not being achieved
  COMPLETED = 'COMPLETED',       // Goal has been successfully completed
  ARCHIVED = 'ARCHIVED'          // Goal is no longer active or relevant
}

/**
 * Enum representing the possible statuses of a milestone
 */
export enum MilestoneStatus {
  PENDING = 'PENDING',           // Milestone is scheduled but not yet started
  IN_PROGRESS = 'IN_PROGRESS',   // Milestone is currently being worked on
  COMPLETED = 'COMPLETED',       // Milestone has been completed successfully
  MISSED = 'MISSED'              // Milestone deadline was missed
}

/**
 * Interface representing a strategic goal entity
 */
export interface Goal {
  id: ID;                        // Unique identifier
  type: GoalType;                // Type of goal (BHAG, 3HAG, 1HAG, Quarterly)
  title: string;                 // Title/name of the goal
  description: string;           // Detailed description of the goal
  startDate: string;             // Start date in ISO format
  endDate: string;               // End date in ISO format
  status: GoalStatus;            // Current status of the goal
  progress: number;              // Progress as a percentage (0-100)
  organizationId: ID;            // Organization this goal belongs to
  createdAt: string;             // Creation timestamp in ISO format
  updatedAt: string;             // Last update timestamp in ISO format
}

/**
 * Interface representing a milestone entity for tracking progress towards a goal
 */
export interface Milestone {
  id: ID;                        // Unique identifier
  title: string;                 // Title/name of the milestone
  description: string;           // Detailed description of the milestone
  dueDate: string;               // Due date in ISO format
  status: MilestoneStatus;       // Current status of the milestone
  goalId: ID;                    // ID of the parent goal
  createdAt: string;             // Creation timestamp in ISO format
  updatedAt: string;             // Last update timestamp in ISO format
}

/**
 * Interface extending Goal to include its associated milestones
 */
export interface GoalWithMilestones extends Goal {
  milestones: Milestone[];       // Array of milestones associated with this goal
}

/**
 * Interface for a lightweight reference to a metric associated with a goal
 */
export interface MetricReference {
  id: ID;                        // Unique identifier of the metric
  name: string;                  // Name of the metric
}

/**
 * Interface extending Goal to include its associated metrics
 */
export interface GoalWithMetrics extends Goal {
  metrics: MetricReference[];    // Array of metrics associated with this goal
}

/**
 * Interface extending Goal to include both milestones and metrics
 */
export interface GoalWithMilestonesAndMetrics extends Goal {
  milestones: Milestone[];       // Array of milestones associated with this goal
  metrics: MetricReference[];    // Array of metrics associated with this goal
}

/**
 * Interface for form data to create a new strategic goal
 */
export interface CreateGoalFormData {
  type: GoalType;                // Type of goal (BHAG, 3HAG, 1HAG, Quarterly)
  title: string;                 // Title/name of the goal
  description: string;           // Detailed description of the goal
  startDate: string;             // Start date in ISO format
  endDate: string;               // End date in ISO format
  organizationId: ID;            // Organization this goal belongs to
  metricIds: ID[];               // IDs of metrics to associate with the goal
}

/**
 * Interface for form data to update an existing strategic goal
 */
export interface UpdateGoalFormData {
  title: string;                 // Title/name of the goal
  description: string;           // Detailed description of the goal
  startDate: string;             // Start date in ISO format
  endDate: string;               // End date in ISO format
  status: GoalStatus;            // Status of the goal
  progress: number;              // Progress as a percentage (0-100)
  metricIds: ID[];               // IDs of metrics to associate with the goal
}

/**
 * Interface for form data to create a new milestone
 */
export interface CreateMilestoneFormData {
  title: string;                 // Title/name of the milestone
  description: string;           // Detailed description of the milestone
  dueDate: string;               // Due date in ISO format
  goalId: ID;                    // ID of the parent goal
}

/**
 * Interface for form data to update an existing milestone
 */
export interface UpdateMilestoneFormData {
  title: string;                 // Title/name of the milestone
  description: string;           // Detailed description of the milestone
  dueDate: string;               // Due date in ISO format
  status: MilestoneStatus;       // Status of the milestone
}

/**
 * Interface for filtering goals by various criteria
 */
export interface GoalFilters {
  type: GoalType | null;         // Filter by goal type
  status: GoalStatus | null;     // Filter by goal status
  organizationId: ID | null;     // Filter by organization
  search: string | null;         // Search term for title/description
  dateRange: DateRange | null;   // Filter by date range
}

/**
 * Interface for filtering milestones by various criteria
 */
export interface MilestoneFilters {
  goalId: ID | null;             // Filter by parent goal
  status: MilestoneStatus | null; // Filter by milestone status
  dateRange: DateRange | null;   // Filter by date range
}

/**
 * Interface for timeline visualization items representing goals and milestones
 */
export interface GoalTimelineItem {
  id: ID;                        // Unique identifier
  title: string;                 // Title/name of the item
  type: GoalType | 'MILESTONE';  // Type of item (goal type or milestone)
  startDate: string;             // Start date in ISO format
  endDate: string;               // End date in ISO format
  status: GoalStatus | MilestoneStatus; // Status of the item
  progress: number;              // Progress as a percentage (0-100)
  parentId: ID | null;           // Parent item ID (for milestones)
  color: string | null;          // Optional color for visual representation
}