import { UserRole, ROLE_HIERARCHY, getRoleDisplayName } from '../../utils/constants/roles';
import { Permission, DEFAULT_PERMISSIONS } from '../../utils/constants/permissions';
import { AuthorizationError } from '../../utils/errors/AuthorizationError';
import { ValidationError } from '../../utils/errors';
import { userRepository } from '../../repositories/userRepository';
import { logger } from '../../utils/helpers/logger';

/**
 * Service class for managing user roles and permissions in the Metronomics Platform
 */
class RoleService {
  /**
   * Initializes the role service
   */
  constructor() {
    // No initialization required
  }

  /**
   * Checks if a role is valid in the system
   * @param role - Role string to validate
   * @returns True if valid, false otherwise
   */
  isValidRole(role: string): boolean {
    return Object.values(UserRole).includes(role as UserRole);
  }

  /**
   * Checks if a user role has a specific permission
   * @param role - User role to check
   * @param permission - Permission to check for
   * @returns True if the role has the permission, false otherwise
   */
  hasPermission(role: UserRole, permission: Permission): boolean {
    // Get the direct permissions for this role
    const rolePermissions = DEFAULT_PERMISSIONS[role] || [];
    
    // Check if the permission is directly assigned to the role
    if (rolePermissions.includes(permission)) {
      return true;
    }
    
    // Check inherited roles for the permission
    const inheritedRoles = this.getInheritedRoles(role);
    for (const inheritedRole of inheritedRoles) {
      const inheritedPermissions = DEFAULT_PERMISSIONS[inheritedRole] || [];
      if (inheritedPermissions.includes(permission)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validates that a user role has a specific permission, throwing an error if not
   * @param role - User role to validate
   * @param permission - Permission to validate
   * @param action - Description of the action being performed (for error message)
   * @throws AuthorizationError if the role does not have the permission
   */
  validatePermission(role: UserRole, permission: Permission, action: string): void {
    if (!this.hasPermission(role, permission)) {
      logger.debug('Permission validation failed', { role, permission, action });
      throw AuthorizationError.insufficientPermissions(action);
    }
    
    logger.debug('Permission validation passed', { role, permission, action });
  }

  /**
   * Checks if a user with a specific role can manage users with another role
   * @param managerRole - The role of the user attempting to manage another user
   * @param targetRole - The role of the user being managed
   * @returns True if the manager role can manage the target role, false otherwise
   */
  canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    // Get the roles that the manager role can manage (roles below it in hierarchy)
    const managedRoles = ROLE_HIERARCHY[managerRole] || [];
    
    // Check if the target role is in the list of managed roles
    return managedRoles.includes(targetRole);
  }

  /**
   * Validates that a user with a specific role can manage users with another role,
   * throwing an error if not allowed
   * @param managerRole - The role of the user attempting to manage another user
   * @param targetRole - The role of the user being managed
   * @throws AuthorizationError if the manager role cannot manage the target role
   */
  validateRoleManagement(managerRole: UserRole, targetRole: UserRole): void {
    if (!this.canManageRole(managerRole, targetRole)) {
      logger.debug('Role management validation failed', { managerRole, targetRole });
      throw AuthorizationError.forbidden({ 
        message: `Users with role ${managerRole} cannot manage users with role ${targetRole}` 
      });
    }
    
    logger.debug('Role management validation passed', { managerRole, targetRole });
  }

  /**
   * Assigns a new role to a user, with permission validation
   * @param userId - ID of the user to update
   * @param newRole - New role to assign
   * @param currentUserRole - Role of the user making the change
   * @returns The updated user with the new role
   * @throws ValidationError if the role is invalid
   * @throws AuthorizationError if current user cannot manage the role
   */
  async assignRole(userId: string, newRole: UserRole, currentUserRole: UserRole): Promise<any> {
    // Validate that the new role is a valid role
    if (!this.isValidRole(newRole)) {
      throw ValidationError.invalidFormat('role', 'Must be a valid user role');
    }
    
    // Validate that the current user can manage the new role
    this.validateRoleManagement(currentUserRole, newRole);
    
    // Get the user's current role
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ValidationError.requiredField('userId');
    }
    
    // Validate that the current user can manage the user's current role
    this.validateRoleManagement(currentUserRole, user.role);
    
    // Update the user's role
    logger.debug('Assigning role to user', { userId, currentRole: user.role, newRole });
    const updatedUser = await userRepository.updateRole(userId, newRole);
    
    logger.info('Role assigned successfully', { userId, oldRole: user.role, newRole });
    return updatedUser;
  }

  /**
   * Gets all permissions for a specific role, including inherited permissions
   * @param role - The role to get permissions for
   * @returns Array of permissions for the role
   */
  getRolePermissions(role: UserRole): Permission[] {
    // Get direct permissions for this role
    const directPermissions = DEFAULT_PERMISSIONS[role] || [];
    
    // Get permissions from inherited roles
    const inheritedRoles = this.getInheritedRoles(role);
    const inheritedPermissions = inheritedRoles.flatMap(
      inheritedRole => DEFAULT_PERMISSIONS[inheritedRole] || []
    );
    
    // Combine and deduplicate permissions
    const allPermissions = [...directPermissions, ...inheritedPermissions];
    return [...new Set(allPermissions)];
  }

  /**
   * Gets all roles that a specific role inherits permissions from
   * @param role - The role to check inheritance for
   * @returns Array of inherited roles
   */
  getInheritedRoles(role: UserRole): UserRole[] {
    return ROLE_HIERARCHY[role] || [];
  }
}

// Create and export a singleton instance of the RoleService
export const roleService = new RoleService();