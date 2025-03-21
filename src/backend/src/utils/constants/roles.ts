/**
 * Constants and utilities for role-based access control in the Metronomics Platform.
 * Defines user roles and their hierarchical relationships for permission management.
 */

/**
 * Enum defining all possible user roles in the Metronomics Platform
 * 
 * COACH: External consultant with access to multiple organizations
 * CEO: Organization leader with full access to a single organization
 * LEADERSHIP: Department heads with access to their department and limited organization-wide access
 * TEAM_MEMBER: Regular user with access to their own data and team information
 * VIEWER: Read-only access with configurable scope
 */
export enum UserRole {
  COACH = 'COACH',
  CEO = 'CEO',
  LEADERSHIP = 'LEADERSHIP',
  TEAM_MEMBER = 'TEAM_MEMBER',
  VIEWER = 'VIEWER'
}

/**
 * Defines the hierarchical relationship between roles, where each role inherits permissions 
 * from roles below it in the hierarchy.
 * 
 * Example: CEO inherits permissions from LEADERSHIP, TEAM_MEMBER, and VIEWER
 * 
 * This hierarchy is used to determine permission inheritance throughout the application.
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.COACH]: [UserRole.CEO, UserRole.LEADERSHIP, UserRole.TEAM_MEMBER, UserRole.VIEWER],
  [UserRole.CEO]: [UserRole.LEADERSHIP, UserRole.TEAM_MEMBER, UserRole.VIEWER],
  [UserRole.LEADERSHIP]: [UserRole.TEAM_MEMBER, UserRole.VIEWER],
  [UserRole.TEAM_MEMBER]: [UserRole.VIEWER],
  [UserRole.VIEWER]: []
};

/**
 * Converts role enum values to human-readable display names for UI presentation
 * 
 * @param role - User role from the UserRole enum
 * @returns Human-readable role name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.COACH:
      return 'Coach';
    case UserRole.CEO:
      return 'CEO';
    case UserRole.LEADERSHIP:
      return 'Leadership';
    case UserRole.TEAM_MEMBER:
      return 'Team Member';
    case UserRole.VIEWER:
      return 'Viewer';
    default:
      return 'Unknown Role';
  }
}