/**
 * Constants and utilities for permission-based access control in the Metronomics Platform.
 * Defines specific permissions that can be assigned to user roles for granular access control.
 */

import { UserRole } from './roles';

/**
 * Enum defining all possible permissions in the Metronomics Platform.
 * Each permission represents a specific action that can be performed on a resource.
 */
export enum Permission {
  // Dashboard Permissions
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  
  // Meeting Permissions
  CREATE_MEETING = 'CREATE_MEETING',
  UPDATE_MEETING = 'UPDATE_MEETING',
  DELETE_MEETING = 'DELETE_MEETING',
  VIEW_MEETING = 'VIEW_MEETING',
  MODERATE_MEETING = 'MODERATE_MEETING',
  
  // Action Item Permissions
  CREATE_ACTION_ITEM = 'CREATE_ACTION_ITEM',
  UPDATE_ACTION_ITEM = 'UPDATE_ACTION_ITEM',
  DELETE_ACTION_ITEM = 'DELETE_ACTION_ITEM',
  VIEW_ACTION_ITEM = 'VIEW_ACTION_ITEM',
  
  // Strategic Goal Permissions
  CREATE_GOAL = 'CREATE_GOAL',
  UPDATE_GOAL = 'UPDATE_GOAL',
  DELETE_GOAL = 'DELETE_GOAL',
  VIEW_GOAL = 'VIEW_GOAL',
  
  // Metric Permissions
  CREATE_METRIC = 'CREATE_METRIC',
  UPDATE_METRIC = 'UPDATE_METRIC',
  DELETE_METRIC = 'DELETE_METRIC',
  VIEW_METRIC = 'VIEW_METRIC',
  UPDATE_METRIC_VALUE = 'UPDATE_METRIC_VALUE',
  
  // KFFM Permissions
  CREATE_KFFM = 'CREATE_KFFM',
  UPDATE_KFFM = 'UPDATE_KFFM',
  DELETE_KFFM = 'DELETE_KFFM',
  VIEW_KFFM = 'VIEW_KFFM',
  
  // User Management Permissions
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  VIEW_USERS = 'VIEW_USERS',
  
  // Organization Permissions
  MANAGE_ORGANIZATION = 'MANAGE_ORGANIZATION',
  VIEW_ORGANIZATION = 'VIEW_ORGANIZATION',
  
  // Team Permissions
  MANAGE_TEAMS = 'MANAGE_TEAMS',
  VIEW_TEAMS = 'VIEW_TEAMS',
  
  // Data Export Permissions
  EXPORT_DATA = 'EXPORT_DATA',
  
  // Cross-Organization Permissions
  ACCESS_MULTIPLE_ORGANIZATIONS = 'ACCESS_MULTIPLE_ORGANIZATIONS',
  
  // Dashboard Sharing Permissions
  SHARE_DASHBOARDS = 'SHARE_DASHBOARDS'
}

/**
 * Maps each user role to its default set of permissions.
 * This defines the initial permissions assigned to users based on their role.
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.COACH]: [
    // Coaches have all permissions, including access to multiple organizations
    ...Object.values(Permission),
  ],
  
  [UserRole.CEO]: [
    // CEOs have all permissions except access to multiple organizations
    ...Object.values(Permission).filter(
      (permission) => permission !== Permission.ACCESS_MULTIPLE_ORGANIZATIONS
    ),
  ],
  
  [UserRole.LEADERSHIP]: [
    // Dashboard
    Permission.VIEW_DASHBOARD,
    
    // Meetings
    Permission.CREATE_MEETING,
    Permission.UPDATE_MEETING,
    Permission.DELETE_MEETING,
    Permission.VIEW_MEETING,
    Permission.MODERATE_MEETING,
    
    // Action Items
    Permission.CREATE_ACTION_ITEM,
    Permission.UPDATE_ACTION_ITEM,
    Permission.DELETE_ACTION_ITEM,
    Permission.VIEW_ACTION_ITEM,
    
    // Strategic Goals - can edit own department's goals, view all
    Permission.CREATE_GOAL,
    Permission.UPDATE_GOAL,
    Permission.VIEW_GOAL,
    
    // Metrics - can manage department metrics, view all
    Permission.CREATE_METRIC,
    Permission.UPDATE_METRIC,
    Permission.DELETE_METRIC,
    Permission.VIEW_METRIC,
    Permission.UPDATE_METRIC_VALUE,
    
    // KFFM - can edit own department's functions, view all
    Permission.UPDATE_KFFM,
    Permission.VIEW_KFFM,
    
    // User Management - can view all users
    Permission.VIEW_USERS,
    
    // Organization - view only
    Permission.VIEW_ORGANIZATION,
    
    // Team Management - can manage own teams
    Permission.MANAGE_TEAMS,
    Permission.VIEW_TEAMS,
    
    // Data Export
    Permission.EXPORT_DATA,
    
    // Dashboard Sharing
    Permission.SHARE_DASHBOARDS,
  ],
  
  [UserRole.TEAM_MEMBER]: [
    // Dashboard
    Permission.VIEW_DASHBOARD,
    
    // Meetings - can participate but not create/delete
    Permission.VIEW_MEETING,
    
    // Action Items
    Permission.CREATE_ACTION_ITEM,
    Permission.UPDATE_ACTION_ITEM,
    Permission.VIEW_ACTION_ITEM,
    
    // Strategic Goals - view only
    Permission.VIEW_GOAL,
    
    // Metrics - can update assigned metric values, view all
    Permission.UPDATE_METRIC_VALUE,
    Permission.VIEW_METRIC,
    
    // KFFM - view only
    Permission.VIEW_KFFM,
    
    // User Management - view only
    Permission.VIEW_USERS,
    
    // Organization - view only
    Permission.VIEW_ORGANIZATION,
    
    // Team - view only
    Permission.VIEW_TEAMS,
  ],
  
  [UserRole.VIEWER]: [
    // Dashboard
    Permission.VIEW_DASHBOARD,
    
    // Meetings - view only
    Permission.VIEW_MEETING,
    
    // Action Items - view only
    Permission.VIEW_ACTION_ITEM,
    
    // Strategic Goals - view only
    Permission.VIEW_GOAL,
    
    // Metrics - view only
    Permission.VIEW_METRIC,
    
    // KFFM - view only
    Permission.VIEW_KFFM,
    
    // Organization - view only
    Permission.VIEW_ORGANIZATION,
    
    // Team - view only
    Permission.VIEW_TEAMS,
  ],
};

/**
 * Groups permissions by resource type for easier management and validation.
 * This helps when checking if a user has any permission related to a specific resource.
 */
export const RESOURCE_PERMISSIONS: Record<string, Permission[]> = {
  DASHBOARD: [
    Permission.VIEW_DASHBOARD,
  ],
  
  MEETING: [
    Permission.CREATE_MEETING,
    Permission.UPDATE_MEETING,
    Permission.DELETE_MEETING,
    Permission.VIEW_MEETING,
    Permission.MODERATE_MEETING,
  ],
  
  ACTION_ITEM: [
    Permission.CREATE_ACTION_ITEM,
    Permission.UPDATE_ACTION_ITEM,
    Permission.DELETE_ACTION_ITEM,
    Permission.VIEW_ACTION_ITEM,
  ],
  
  GOAL: [
    Permission.CREATE_GOAL,
    Permission.UPDATE_GOAL,
    Permission.DELETE_GOAL,
    Permission.VIEW_GOAL,
  ],
  
  METRIC: [
    Permission.CREATE_METRIC,
    Permission.UPDATE_METRIC,
    Permission.DELETE_METRIC,
    Permission.VIEW_METRIC,
    Permission.UPDATE_METRIC_VALUE,
  ],
  
  KFFM: [
    Permission.CREATE_KFFM,
    Permission.UPDATE_KFFM,
    Permission.DELETE_KFFM,
    Permission.VIEW_KFFM,
  ],
  
  USER: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_USERS,
  ],
  
  ORGANIZATION: [
    Permission.MANAGE_ORGANIZATION,
    Permission.VIEW_ORGANIZATION,
    Permission.ACCESS_MULTIPLE_ORGANIZATIONS,
  ],
  
  TEAM: [
    Permission.MANAGE_TEAMS,
    Permission.VIEW_TEAMS,
  ],
  
  DATA: [
    Permission.EXPORT_DATA,
    Permission.SHARE_DASHBOARDS,
  ],
};

/**
 * Converts permission enum values to human-readable display names for UI presentation.
 * 
 * @param permission - Permission from the Permission enum
 * @returns Human-readable permission name
 */
export function getPermissionDisplayName(permission: Permission): string {
  switch (permission) {
    // Dashboard Permissions
    case Permission.VIEW_DASHBOARD:
      return 'View Dashboard';
      
    // Meeting Permissions
    case Permission.CREATE_MEETING:
      return 'Create Meeting';
    case Permission.UPDATE_MEETING:
      return 'Edit Meeting';
    case Permission.DELETE_MEETING:
      return 'Delete Meeting';
    case Permission.VIEW_MEETING:
      return 'View Meeting';
    case Permission.MODERATE_MEETING:
      return 'Moderate Meeting';
      
    // Action Item Permissions
    case Permission.CREATE_ACTION_ITEM:
      return 'Create Action Item';
    case Permission.UPDATE_ACTION_ITEM:
      return 'Edit Action Item';
    case Permission.DELETE_ACTION_ITEM:
      return 'Delete Action Item';
    case Permission.VIEW_ACTION_ITEM:
      return 'View Action Item';
      
    // Strategic Goal Permissions
    case Permission.CREATE_GOAL:
      return 'Create Strategic Goal';
    case Permission.UPDATE_GOAL:
      return 'Edit Strategic Goal';
    case Permission.DELETE_GOAL:
      return 'Delete Strategic Goal';
    case Permission.VIEW_GOAL:
      return 'View Strategic Goal';
      
    // Metric Permissions
    case Permission.CREATE_METRIC:
      return 'Create Metric';
    case Permission.UPDATE_METRIC:
      return 'Edit Metric';
    case Permission.DELETE_METRIC:
      return 'Delete Metric';
    case Permission.VIEW_METRIC:
      return 'View Metric';
    case Permission.UPDATE_METRIC_VALUE:
      return 'Update Metric Value';
      
    // KFFM Permissions
    case Permission.CREATE_KFFM:
      return 'Create Function Flow Map';
    case Permission.UPDATE_KFFM:
      return 'Edit Function Flow Map';
    case Permission.DELETE_KFFM:
      return 'Delete Function Flow Map';
    case Permission.VIEW_KFFM:
      return 'View Function Flow Map';
      
    // User Management Permissions
    case Permission.MANAGE_USERS:
      return 'Manage Users';
    case Permission.MANAGE_ROLES:
      return 'Manage Roles';
    case Permission.VIEW_USERS:
      return 'View Users';
      
    // Organization Permissions
    case Permission.MANAGE_ORGANIZATION:
      return 'Manage Organization';
    case Permission.VIEW_ORGANIZATION:
      return 'View Organization';
      
    // Team Permissions
    case Permission.MANAGE_TEAMS:
      return 'Manage Teams';
    case Permission.VIEW_TEAMS:
      return 'View Teams';
      
    // Data Export Permissions
    case Permission.EXPORT_DATA:
      return 'Export Data';
      
    // Cross-Organization Permissions
    case Permission.ACCESS_MULTIPLE_ORGANIZATIONS:
      return 'Access Multiple Organizations';
      
    // Dashboard Sharing Permissions
    case Permission.SHARE_DASHBOARDS:
      return 'Share Dashboards';
      
    default:
      return 'Unknown Permission';
  }
}