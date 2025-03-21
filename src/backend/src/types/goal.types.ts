/**
 * TypeScript type definitions for strategic goals and milestones in the Metronomics Platform.
 * This file defines interfaces, enums, and DTOs for managing strategic goals (BHAG, 3HAG, 1HAG, Quarterly)
 * and their associated milestones.
 */

/**
 * Enum representing the types of strategic goals in the Metronomics framework
 */
export enum GoalType {
  BHAG = 'BHAG',                // Big Hairy Audacious Goal (long-term)
  THREE_HAG = 'THREE_HAG',      // 3-Year Highly Achievable Goal
  ONE_HAG = 'ONE_HAG',          // 1-Year Highly Achievable Goal
  QUARTERLY = 'QUARTERLY'       // Quarterly Goal
}

/**
 * Enum representing the possible statuses of a strategic goal
 */
export enum GoalStatus {
  DRAFT = 'DRAFT',              // Initial status for goals being defined
  ACTIVE = 'ACTIVE',            // Current, in-progress goal
  AT_RISK = 'AT_RISK',          // Goal that may not be achieved on schedule
  COMPLETED = 'COMPLETED',      // Successfully completed goal
  ARCHIVED = 'ARCHIVED'         // Historical goal no longer active
}

/**
 * Enum representing the possible statuses of a milestone
 */
export enum MilestoneStatus {
  PENDING = 'PENDING',          // Future milestone not yet started
  IN_PROGRESS = 'IN_PROGRESS',  // Currently in progress milestone
  COMPLETED = 'COMPLETED',      // Successfully completed milestone
  MISSED = 'MISSED'             // Milestone that wasn't completed on time
}

/**
 * Interface representing a strategic goal entity
 */
export interface Goal {
  id: string;                   // Unique identifier
  type: GoalType;               // Type of strategic goal (BHAG, 3HAG, etc.)
  title: string;                // Short title of the goal
  description: string;          // Detailed description of the goal
  startDate: Date;              // When the goal begins
  endDate: Date;                // Target completion date
  status: GoalStatus;           // Current status of the goal
  progress: number;             // Progress percentage (0-100)
  organizationId: string;       // Organization this goal belongs to
  createdAt: Date;              // When the goal was created
  updatedAt: Date;              // When the goal was last updated
}

/**
 * Interface representing a milestone entity for tracking progress towards a goal
 */
export interface Milestone {
  id: string;                   // Unique identifier
  title: string;                // Short title of the milestone
  description: string;          // Detailed description of the milestone
  dueDate: Date;                // Target completion date
  status: MilestoneStatus;      // Current status of the milestone
  goalId: string;               // Associated goal ID
  createdAt: Date;              // When the milestone was created
  updatedAt: Date;              // When the milestone was last updated
}

/**
 * Interface extending Goal to include its associated milestones
 */
export interface GoalWithMilestones extends Goal {
  milestones: Milestone[];      // Array of associated milestones
}

/**
 * Interface for a lightweight reference to a metric associated with a goal
 */
export interface MetricReference {
  id: string;                   // Unique identifier of the metric
  name: string;                 // Name of the metric
}

/**
 * Interface extending Goal to include its associated metrics
 */
export interface GoalWithMetrics extends Goal {
  metrics: MetricReference[];   // Array of associated metrics
}

/**
 * Interface extending Goal to include both milestones and metrics
 */
export interface GoalWithMilestonesAndMetrics extends Goal {
  milestones: Milestone[];      // Array of associated milestones
  metrics: MetricReference[];   // Array of associated metrics
}

/**
 * Data transfer object for creating a new strategic goal
 */
export interface CreateGoalDto {
  type: GoalType;               // Type of strategic goal
  title: string;                // Short title of the goal
  description: string;          // Detailed description of the goal
  startDate: Date;              // When the goal begins
  endDate: Date;                // Target completion date
  organizationId: string;       // Organization this goal belongs to
  metricIds?: string[];         // Optional array of metric IDs to associate with the goal
}

/**
 * Data transfer object for updating an existing strategic goal
 */
export interface UpdateGoalDto {
  title?: string;               // Updated title (optional)
  description?: string;         // Updated description (optional)
  startDate?: Date;             // Updated start date (optional)
  endDate?: Date;               // Updated end date (optional)
  status?: GoalStatus;          // Updated status (optional)
  progress?: number;            // Updated progress percentage (optional)
  metricIds?: string[];         // Updated metric associations (optional)
}

/**
 * Data transfer object for creating a new milestone
 */
export interface CreateMilestoneDto {
  title: string;                // Short title of the milestone
  description: string;          // Detailed description of the milestone
  dueDate: Date;                // Target completion date
  goalId: string;               // Associated goal ID
}

/**
 * Data transfer object for updating an existing milestone
 */
export interface UpdateMilestoneDto {
  title?: string;               // Updated title (optional)
  description?: string;         // Updated description (optional)
  dueDate?: Date;               // Updated due date (optional)
  status?: MilestoneStatus;     // Updated status (optional)
}

/**
 * Interface for filtering goals by various criteria
 */
export interface GoalFilters {
  type?: GoalType;              // Filter by goal type
  status?: GoalStatus;          // Filter by goal status
  organizationId?: string;      // Filter by organization
  startDateFrom?: Date;         // Filter by start date range (from)
  startDateTo?: Date;           // Filter by start date range (to)
  endDateFrom?: Date;           // Filter by end date range (from)
  endDateTo?: Date;             // Filter by end date range (to)
}

/**
 * Interface for filtering milestones by various criteria
 */
export interface MilestoneFilters {
  goalId?: string;              // Filter by associated goal
  status?: MilestoneStatus;     // Filter by milestone status
  dueDateStart?: Date;          // Filter by due date range (from)
  dueDateEnd?: Date;            // Filter by due date range (to)
}