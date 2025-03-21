/**
 * User role constants for the Metronomics Platform.
 * Defines roles and role hierarchy for role-based access control.
 * These roles represent different levels of access and permissions within the application.
 */

/**
 * Enum defining all possible user roles in the system.
 * The hierarchy from highest to lowest permission level is:
 * COACH > CEO > LEADERSHIP > TEAM_MEMBER > VIEWER
 */
export enum UserRole {
  COACH = 'COACH',                // Can access multiple organizations and has administrative capabilities
  CEO = 'CEO',                    // Has full access to a single organization
  LEADERSHIP = 'LEADERSHIP',      // Department/team scope with team management capabilities
  TEAM_MEMBER = 'TEAM_MEMBER',    // Has access to personal metrics and meeting participation
  VIEWER = 'VIEWER'               // Read-only access with configurable scope
}

/**
 * Defines the hierarchical relationship between roles.
 * Each role inherits permissions from roles listed in its array.
 * For example, COACH role has all permissions of CEO, LEADERSHIP, TEAM_MEMBER, and VIEWER roles.
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.COACH]: [UserRole.CEO, UserRole.LEADERSHIP, UserRole.TEAM_MEMBER, UserRole.VIEWER],
  [UserRole.CEO]: [UserRole.LEADERSHIP, UserRole.TEAM_MEMBER, UserRole.VIEWER],
  [UserRole.LEADERSHIP]: [UserRole.TEAM_MEMBER, UserRole.VIEWER],
  [UserRole.TEAM_MEMBER]: [UserRole.VIEWER],
  [UserRole.VIEWER]: []
};

/**
 * Maps role enum values to human-readable display names for UI presentation.
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.COACH]: 'Coach',
  [UserRole.CEO]: 'CEO',
  [UserRole.LEADERSHIP]: 'Leadership',
  [UserRole.TEAM_MEMBER]: 'Team Member',
  [UserRole.VIEWER]: 'Viewer'
};

/**
 * Default role assigned to new users when no specific role is provided.
 */
export const DEFAULT_ROLE = UserRole.VIEWER;

/**
 * Checks if a user's role is at least at the required level in the role hierarchy.
 * 
 * @param userRole The user's current role
 * @param requiredRole The minimum required role for an operation
 * @returns True if the user's role is at least at the required level in the hierarchy
 * 
 * Example:
 * isRoleAtLeast(UserRole.CEO, UserRole.LEADERSHIP) => true (CEO can do anything a LEADERSHIP role can)
 * isRoleAtLeast(UserRole.TEAM_MEMBER, UserRole.CEO) => false (TEAM_MEMBER cannot perform CEO actions)
 */
export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  // If roles are the same, user has exactly the required role
  if (userRole === requiredRole) {
    return true;
  }
  
  // Check if the required role is in the hierarchy of the user's role
  // If it is, that means the user's role is higher in the hierarchy
  return ROLE_HIERARCHY[userRole].includes(requiredRole);
}

/**
 * Converts role enum values to human-readable display names for UI presentation.
 * 
 * @param role The role enum value
 * @returns Human-readable role name
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role] || 'Unknown Role';
}