/**
 * Permissions constants used throughout the Metronomics Platform frontend for role-based access control.
 * These define the specific actions users can perform on different resources based on their assigned roles.
 */

/**
 * Enum defining all possible permissions in the Metronomics Platform
 */
export enum Permission {
  // Dashboard permissions
  VIEW_DASHBOARD = 'view:dashboard',
  
  // Meeting permissions
  CREATE_MEETING = 'create:meeting',
  UPDATE_MEETING = 'update:meeting',
  DELETE_MEETING = 'delete:meeting',
  VIEW_MEETING = 'view:meeting',
  MODERATE_MEETING = 'moderate:meeting',
  
  // Action Item permissions
  CREATE_ACTION_ITEM = 'create:actionItem',
  UPDATE_ACTION_ITEM = 'update:actionItem',
  DELETE_ACTION_ITEM = 'delete:actionItem',
  VIEW_ACTION_ITEM = 'view:actionItem',
  
  // Strategic Goal permissions
  CREATE_GOAL = 'create:goal',
  UPDATE_GOAL = 'update:goal',
  DELETE_GOAL = 'delete:goal',
  VIEW_GOAL = 'view:goal',
  
  // Metric permissions
  CREATE_METRIC = 'create:metric',
  UPDATE_METRIC = 'update:metric',
  DELETE_METRIC = 'delete:metric',
  VIEW_METRIC = 'view:metric',
  UPDATE_METRIC_VALUE = 'update:metricValue',
  
  // KFFM permissions
  CREATE_KFFM = 'create:kffm',
  UPDATE_KFFM = 'update:kffm',
  DELETE_KFFM = 'delete:kffm',
  VIEW_KFFM = 'view:kffm',
  
  // User management permissions
  MANAGE_USERS = 'manage:users',
  MANAGE_ROLES = 'manage:roles',
  VIEW_USERS = 'view:users',
  
  // Organization permissions
  MANAGE_ORGANIZATION = 'manage:organization',
  VIEW_ORGANIZATION = 'view:organization',
  
  // Team permissions
  MANAGE_TEAMS = 'manage:teams',
  VIEW_TEAMS = 'view:teams',
  
  // Other permissions
  EXPORT_DATA = 'export:data',
  ACCESS_MULTIPLE_ORGANIZATIONS = 'access:multipleOrganizations',
  SHARE_DASHBOARDS = 'share:dashboards'
}

/**
 * Groups permissions by resource type for easier management and validation
 */
export const RESOURCE_PERMISSIONS: Record<string, Permission[]> = {
  dashboard: [
    Permission.VIEW_DASHBOARD
  ],
  meeting: [
    Permission.CREATE_MEETING,
    Permission.UPDATE_MEETING,
    Permission.DELETE_MEETING,
    Permission.VIEW_MEETING,
    Permission.MODERATE_MEETING
  ],
  actionItem: [
    Permission.CREATE_ACTION_ITEM,
    Permission.UPDATE_ACTION_ITEM,
    Permission.DELETE_ACTION_ITEM,
    Permission.VIEW_ACTION_ITEM
  ],
  goal: [
    Permission.CREATE_GOAL,
    Permission.UPDATE_GOAL,
    Permission.DELETE_GOAL,
    Permission.VIEW_GOAL
  ],
  metric: [
    Permission.CREATE_METRIC,
    Permission.UPDATE_METRIC,
    Permission.DELETE_METRIC,
    Permission.VIEW_METRIC,
    Permission.UPDATE_METRIC_VALUE
  ],
  kffm: [
    Permission.CREATE_KFFM,
    Permission.UPDATE_KFFM,
    Permission.DELETE_KFFM,
    Permission.VIEW_KFFM
  ],
  user: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_USERS
  ],
  organization: [
    Permission.MANAGE_ORGANIZATION,
    Permission.VIEW_ORGANIZATION,
    Permission.ACCESS_MULTIPLE_ORGANIZATIONS
  ],
  team: [
    Permission.MANAGE_TEAMS,
    Permission.VIEW_TEAMS
  ],
  data: [
    Permission.EXPORT_DATA,
    Permission.SHARE_DASHBOARDS
  ]
};

/**
 * Maps permission enum values to human-readable display names for UI presentation
 */
export const PERMISSION_DISPLAY_NAMES: Record<Permission, string> = {
  [Permission.VIEW_DASHBOARD]: 'View Dashboard',
  
  [Permission.CREATE_MEETING]: 'Create Meetings',
  [Permission.UPDATE_MEETING]: 'Update Meetings',
  [Permission.DELETE_MEETING]: 'Delete Meetings',
  [Permission.VIEW_MEETING]: 'View Meetings',
  [Permission.MODERATE_MEETING]: 'Moderate Meetings',
  
  [Permission.CREATE_ACTION_ITEM]: 'Create Action Items',
  [Permission.UPDATE_ACTION_ITEM]: 'Update Action Items',
  [Permission.DELETE_ACTION_ITEM]: 'Delete Action Items',
  [Permission.VIEW_ACTION_ITEM]: 'View Action Items',
  
  [Permission.CREATE_GOAL]: 'Create Strategic Goals',
  [Permission.UPDATE_GOAL]: 'Update Strategic Goals',
  [Permission.DELETE_GOAL]: 'Delete Strategic Goals',
  [Permission.VIEW_GOAL]: 'View Strategic Goals',
  
  [Permission.CREATE_METRIC]: 'Create Metrics',
  [Permission.UPDATE_METRIC]: 'Update Metrics',
  [Permission.DELETE_METRIC]: 'Delete Metrics',
  [Permission.VIEW_METRIC]: 'View Metrics',
  [Permission.UPDATE_METRIC_VALUE]: 'Update Metric Values',
  
  [Permission.CREATE_KFFM]: 'Create Function Flow Maps',
  [Permission.UPDATE_KFFM]: 'Update Function Flow Maps',
  [Permission.DELETE_KFFM]: 'Delete Function Flow Maps',
  [Permission.VIEW_KFFM]: 'View Function Flow Maps',
  
  [Permission.MANAGE_USERS]: 'Manage Users',
  [Permission.MANAGE_ROLES]: 'Manage Roles',
  [Permission.VIEW_USERS]: 'View Users',
  
  [Permission.MANAGE_ORGANIZATION]: 'Manage Organization',
  [Permission.VIEW_ORGANIZATION]: 'View Organization',
  
  [Permission.MANAGE_TEAMS]: 'Manage Teams',
  [Permission.VIEW_TEAMS]: 'View Teams',
  
  [Permission.EXPORT_DATA]: 'Export Data',
  [Permission.ACCESS_MULTIPLE_ORGANIZATIONS]: 'Access Multiple Organizations',
  [Permission.SHARE_DASHBOARDS]: 'Share Dashboards'
};

/**
 * Helper function to check if a user has a specific permission
 * 
 * @param userPermissions - Array of permissions assigned to the user
 * @param requiredPermission - The permission to check for
 * @returns True if the user has the required permission, false otherwise
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}