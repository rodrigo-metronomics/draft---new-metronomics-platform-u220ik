/**
 * Express middleware factory functions for authorization in the Metronomics Platform.
 * Provides middleware creators for permission-based access control, resource-specific
 * authorization, and organization/team-level access control.
 */
import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import { Permission } from '../../utils/constants/permissions';
import { roleService } from '../../services/user/roleService';
import AuthorizationError from '../../utils/errors/AuthorizationError';
import { logger } from '../../utils/helpers/logger';
import { organizationRepository } from '../../repositories/organizationRepository';
import { teamRepository } from '../../repositories/teamRepository';
import { JWTPayload } from '../../types/auth.types';

/**
 * Factory function that creates middleware for permission-based authorization
 * 
 * @param requiredPermission - The permission required to access the resource
 * @returns Express middleware function that checks if the user has the required permission
 */
export const authorize = (requiredPermission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user exists in request (set by authentication middleware)
      if (!req.user) {
        logger.error('Authorization failed - user not authenticated');
        throw AuthorizationError.forbidden();
      }

      // Extract user role from request
      const { role } = req.user;

      // Check if user's role has the required permission
      if (roleService.hasPermission(role, requiredPermission)) {
        logger.debug('Authorization successful', {
          userId: req.user.id,
          role,
          permission: requiredPermission
        });
        return next();
      }

      // If user doesn't have permission, throw an error
      logger.debug('Authorization failed - insufficient permissions', {
        userId: req.user.id,
        role,
        permission: requiredPermission
      });
      throw AuthorizationError.forbidden({
        message: `User with role ${role} does not have permission: ${requiredPermission}`
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Factory function that creates middleware for resource-specific authorization
 * 
 * @param requiredPermission - The permission required to access the resource
 * @param resourceType - The type of resource being accessed
 * @param resourceAccessCheck - Function that checks if the user can access the specific resource
 * @returns Express middleware function that checks resource-specific permissions
 */
export const authorizeResource = (
  requiredPermission: Permission,
  resourceType: string,
  resourceAccessCheck: (userId: string, resourceId: string) => Promise<boolean>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user exists in request
      if (!req.user) {
        logger.error('Authorization failed - user not authenticated');
        throw AuthorizationError.forbidden();
      }

      // Extract user role and ID from request
      const { role, id: userId } = req.user;

      // Check if user's role has the required permission
      if (!roleService.hasPermission(role, requiredPermission)) {
        logger.debug('Permission check failed', {
          userId,
          role,
          permission: requiredPermission
        });
        throw AuthorizationError.forbidden({
          message: `User with role ${role} does not have permission: ${requiredPermission}`
        });
      }

      // Extract resource ID from request parameters
      const resourceId = req.params.id;

      // Check if user can access the specific resource
      const canAccess = await resourceAccessCheck(userId, resourceId);
      
      if (canAccess) {
        logger.debug('Resource authorization successful', {
          userId,
          resourceType,
          resourceId
        });
        return next();
      }

      // If user can't access resource, throw an error
      logger.debug('Resource authorization failed - access denied', {
        userId,
        resourceType,
        resourceId
      });
      throw AuthorizationError.resourceAccessDenied(resourceType, resourceId);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware that verifies a user has access to the requested organization
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authorizeOrganizationAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user exists in request
    if (!req.user) {
      logger.error('Organization access denied - user not authenticated');
      throw AuthorizationError.forbidden();
    }

    const { organizationId: userOrgId } = req.user;
    const targetOrgId = req.params.organizationId || req.body.organizationId;

    // If user belongs to the same organization, allow access
    if (userOrgId === targetOrgId) {
      logger.debug('Organization access authorized - same organization', {
        userId: req.user.id,
        organizationId: targetOrgId
      });
      return next();
    }

    // Check if user has permission to access multiple organizations (e.g., Coach role)
    if (roleService.hasPermission(req.user.role, Permission.ACCESS_MULTIPLE_ORGANIZATIONS)) {
      // Verify the organization exists
      const organization = await organizationRepository.findById(targetOrgId);
      
      if (organization) {
        logger.debug('Organization access authorized - coach role', {
          userId: req.user.id,
          organizationId: targetOrgId
        });
        return next();
      }
    }

    // If user doesn't have access, throw an error
    logger.debug('Organization access denied - no access permissions', {
      userId: req.user.id,
      userOrgId,
      targetOrgId
    });
    throw AuthorizationError.resourceAccessDenied('Organization', targetOrgId);
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware that verifies a user has access to the requested team
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authorizeTeamAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user exists in request
    if (!req.user) {
      logger.error('Team access denied - user not authenticated');
      throw AuthorizationError.forbidden();
    }

    const { id: userId, organizationId } = req.user;
    const teamId = req.params.teamId || req.body.teamId;

    // Find the team
    const team = await teamRepository.findById(teamId);
    
    if (!team) {
      throw AuthorizationError.resourceAccessDenied('Team', teamId);
    }

    // Check if team belongs to user's organization
    if (team.organizationId !== organizationId) {
      logger.debug('Team access denied - different organization', {
        userId,
        teamId,
        teamOrgId: team.organizationId,
        userOrgId: organizationId
      });
      throw AuthorizationError.resourceAccessDenied('Team', teamId);
    }

    // Check if user is a member of the team
    const isTeamMember = await teamRepository.isUserInTeam(teamId, userId);
    
    // Allow access if user is a team member or has team management permissions
    if (
      isTeamMember ||
      roleService.hasPermission(req.user.role, Permission.MANAGE_TEAMS)
    ) {
      logger.debug('Team access authorized', {
        userId,
        teamId,
        isTeamMember
      });
      return next();
    }

    // If user doesn't have access, throw an error
    logger.debug('Team access denied - not a team member', {
      userId,
      teamId
    });
    throw AuthorizationError.resourceAccessDenied('Team', teamId);
  } catch (error) {
    next(error);
  }
};