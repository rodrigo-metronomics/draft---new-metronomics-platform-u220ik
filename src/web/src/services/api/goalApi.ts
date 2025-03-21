import { get, post, put, patch, delete as deleteRequest } from './index';
import { ApiResponse, PaginatedApiResponse } from '../../types/api.types';
import {
  Goal,
  GoalWithMilestones,
  GoalWithMetrics,
  GoalWithMilestonesAndMetrics,
  GoalType,
  GoalStatus,
  GoalFilters,
  CreateGoalFormData,
  UpdateGoalFormData,
  Milestone,
  MilestoneStatus,
  CreateMilestoneFormData,
  UpdateMilestoneFormData,
  GoalTimelineItem
} from '../../types/goal.types';
import { ID } from '../../types/common.types';

/**
 * Fetches a paginated list of goals with optional filtering
 * 
 * @param filters - Optional filters to apply to the goals query
 * @param page - Page number for pagination
 * @param pageSize - Number of items per page
 * @returns Promise resolving to paginated goals data
 */
export const getGoals = async (
  filters?: GoalFilters,
  page?: number,
  pageSize?: number
): Promise<PaginatedApiResponse<Goal[]>> => {
  const queryParams: Record<string, any> = {
    ...(filters || {}),
    ...(page !== undefined ? { page } : {}),
    ...(pageSize !== undefined ? { pageSize } : {})
  };
  
  return get<Goal[]>('/goals', queryParams);
};

/**
 * Fetches a single goal by its ID
 * 
 * @param id - ID of the goal to fetch
 * @param includeMilestones - Whether to include milestone data
 * @param includeMetrics - Whether to include metric data
 * @returns Promise resolving to the goal data
 */
export const getGoalById = async (
  id: ID,
  includeMilestones?: boolean,
  includeMetrics?: boolean
): Promise<ApiResponse<Goal | GoalWithMilestones | GoalWithMetrics | GoalWithMilestonesAndMetrics>> => {
  const queryParams: Record<string, any> = {
    ...(includeMilestones ? { includeMilestones: true } : {}),
    ...(includeMetrics ? { includeMetrics: true } : {})
  };
  
  return get(`/goals/${id}`, queryParams);
};

/**
 * Fetches a goal with its associated milestones
 * 
 * @param id - ID of the goal to fetch
 * @returns Promise resolving to the goal with milestones
 */
export const getGoalWithMilestones = async (
  id: ID
): Promise<ApiResponse<GoalWithMilestones>> => {
  return getGoalById(id, true, false) as Promise<ApiResponse<GoalWithMilestones>>;
};

/**
 * Fetches a goal with its associated metrics
 * 
 * @param id - ID of the goal to fetch
 * @returns Promise resolving to the goal with metrics
 */
export const getGoalWithMetrics = async (
  id: ID
): Promise<ApiResponse<GoalWithMetrics>> => {
  return getGoalById(id, false, true) as Promise<ApiResponse<GoalWithMetrics>>;
};

/**
 * Fetches a goal with both its milestones and metrics
 * 
 * @param id - ID of the goal to fetch
 * @returns Promise resolving to the goal with milestones and metrics
 */
export const getGoalWithMilestonesAndMetrics = async (
  id: ID
): Promise<ApiResponse<GoalWithMilestonesAndMetrics>> => {
  return getGoalById(id, true, true) as Promise<ApiResponse<GoalWithMilestonesAndMetrics>>;
};

/**
 * Fetches goals filtered by type (BHAG, THREE_HAG, ONE_HAG, QUARTERLY)
 * 
 * @param type - Goal type to filter by
 * @param organizationId - ID of the organization
 * @returns Promise resolving to goals of the specified type
 */
export const getGoalsByType = async (
  type: GoalType,
  organizationId: ID
): Promise<ApiResponse<Goal[]>> => {
  return get(`/goals/type/${type}`, { organizationId });
};

/**
 * Fetches goals filtered by status (DRAFT, ACTIVE, AT_RISK, COMPLETED, ARCHIVED)
 * 
 * @param status - Goal status to filter by
 * @param organizationId - ID of the organization
 * @returns Promise resolving to goals with the specified status
 */
export const getGoalsByStatus = async (
  status: GoalStatus,
  organizationId: ID
): Promise<ApiResponse<Goal[]>> => {
  return get(`/goals/status/${status}`, { organizationId });
};

/**
 * Fetches all goals for a specific organization
 * 
 * @param organizationId - ID of the organization
 * @returns Promise resolving to all goals for the organization
 */
export const getOrganizationGoals = async (
  organizationId: ID
): Promise<ApiResponse<Goal[]>> => {
  return get(`/goals/organization/${organizationId}`);
};

/**
 * Creates a new strategic goal
 * 
 * @param data - Goal data to create
 * @returns Promise resolving to the created goal
 */
export const createGoal = async (
  data: CreateGoalFormData
): Promise<ApiResponse<Goal>> => {
  return post<Goal>('/goals', data);
};

/**
 * Updates an existing strategic goal
 * 
 * @param id - ID of the goal to update
 * @param data - Updated goal data
 * @returns Promise resolving to the updated goal
 */
export const updateGoal = async (
  id: ID,
  data: UpdateGoalFormData
): Promise<ApiResponse<Goal>> => {
  return put<Goal>(`/goals/${id}`, data);
};

/**
 * Updates the progress percentage of a goal
 * 
 * @param id - ID of the goal to update
 * @param progress - New progress percentage (0-100)
 * @returns Promise resolving to the updated goal
 */
export const updateGoalProgress = async (
  id: ID,
  progress: number
): Promise<ApiResponse<Goal>> => {
  return patch<Goal>(`/goals/${id}/progress`, { progress });
};

/**
 * Recalculates a goal's progress based on milestone completion
 * 
 * @param id - ID of the goal to recalculate progress for
 * @returns Promise resolving to the updated goal with recalculated progress
 */
export const recalculateGoalProgress = async (
  id: ID
): Promise<ApiResponse<Goal>> => {
  return patch<Goal>(`/goals/${id}/recalculate`, {});
};

/**
 * Deletes a strategic goal
 * 
 * @param id - ID of the goal to delete
 * @returns Promise resolving when the goal is deleted
 */
export const deleteGoal = async (
  id: ID
): Promise<ApiResponse<void>> => {
  return deleteRequest<void>(`/goals/${id}`);
};

/**
 * Links a metric to a goal for tracking progress
 * 
 * @param goalId - ID of the goal
 * @param metricId - ID of the metric to link
 * @returns Promise resolving to the updated goal with the linked metric
 */
export const linkMetricToGoal = async (
  goalId: ID,
  metricId: ID
): Promise<ApiResponse<Goal>> => {
  return post<Goal>(`/goals/${goalId}/metrics/${metricId}`);
};

/**
 * Unlinks a metric from a goal
 * 
 * @param goalId - ID of the goal
 * @param metricId - ID of the metric to unlink
 * @returns Promise resolving to the updated goal without the unlinked metric
 */
export const unlinkMetricFromGoal = async (
  goalId: ID,
  metricId: ID
): Promise<ApiResponse<Goal>> => {
  return deleteRequest<Goal>(`/goals/${goalId}/metrics/${metricId}`);
};

/**
 * Updates all metrics linked to a goal
 * 
 * @param goalId - ID of the goal
 * @param metricIds - Array of metric IDs to link to the goal
 * @returns Promise resolving to the updated goal with the new set of metrics
 */
export const updateGoalMetrics = async (
  goalId: ID,
  metricIds: ID[]
): Promise<ApiResponse<Goal>> => {
  return put<Goal>(`/goals/${goalId}/metrics`, { metricIds });
};

/**
 * Fetches all metrics linked to a specific goal
 * 
 * @param goalId - ID of the goal
 * @returns Promise resolving to the metrics linked to the goal
 */
export const getGoalMetrics = async (
  goalId: ID
): Promise<ApiResponse<any[]>> => {
  return get(`/goals/${goalId}/metrics`);
};

/**
 * Fetches milestones for a specific goal
 * 
 * @param goalId - ID of the goal
 * @returns Promise resolving to the goal's milestones
 */
export const getMilestones = async (
  goalId: ID
): Promise<ApiResponse<Milestone[]>> => {
  return get(`/milestones/goal/${goalId}`);
};

/**
 * Fetches a single milestone by its ID
 * 
 * @param id - ID of the milestone to fetch
 * @returns Promise resolving to the milestone data
 */
export const getMilestoneById = async (
  id: ID
): Promise<ApiResponse<Milestone>> => {
  return get(`/milestones/${id}`);
};

/**
 * Creates a new milestone for a goal
 * 
 * @param data - Milestone data to create
 * @returns Promise resolving to the created milestone
 */
export const createMilestone = async (
  data: CreateMilestoneFormData
): Promise<ApiResponse<Milestone>> => {
  return post<Milestone>('/milestones', data);
};

/**
 * Updates an existing milestone
 * 
 * @param id - ID of the milestone to update
 * @param data - Updated milestone data
 * @returns Promise resolving to the updated milestone
 */
export const updateMilestone = async (
  id: ID,
  data: UpdateMilestoneFormData
): Promise<ApiResponse<Milestone>> => {
  return put<Milestone>(`/milestones/${id}`, data);
};

/**
 * Updates the status of a milestone
 * 
 * @param id - ID of the milestone to update
 * @param status - New milestone status
 * @returns Promise resolving to the updated milestone
 */
export const updateMilestoneStatus = async (
  id: ID,
  status: MilestoneStatus
): Promise<ApiResponse<Milestone>> => {
  return patch<Milestone>(`/milestones/${id}/status`, { status });
};

/**
 * Deletes a milestone
 * 
 * @param id - ID of the milestone to delete
 * @returns Promise resolving when the milestone is deleted
 */
export const deleteMilestone = async (
  id: ID
): Promise<ApiResponse<void>> => {
  return deleteRequest<void>(`/milestones/${id}`);
};

/**
 * Fetches timeline visualization items for goals and milestones
 * 
 * @param organizationId - ID of the organization
 * @param goalType - Optional goal type to filter by
 * @returns Promise resolving to timeline items for visualization
 */
export const getTimelineItems = async (
  organizationId: ID,
  goalType?: GoalType
): Promise<ApiResponse<GoalTimelineItem[]>> => {
  const queryParams: Record<string, any> = {
    organizationId,
    ...(goalType ? { goalType } : {})
  };
  
  return get<GoalTimelineItem[]>('/goals/timeline', queryParams);
};

export default {
  getGoals,
  getGoalById,
  getGoalWithMilestones,
  getGoalWithMetrics,
  getGoalWithMilestonesAndMetrics,
  getGoalsByType,
  getGoalsByStatus,
  getOrganizationGoals,
  createGoal,
  updateGoal,
  updateGoalProgress,
  recalculateGoalProgress,
  deleteGoal,
  linkMetricToGoal,
  unlinkMetricFromGoal,
  updateGoalMetrics,
  getGoalMetrics,
  getMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  updateMilestoneStatus,
  deleteMilestone,
  getTimelineItems
};