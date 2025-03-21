import React from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // v6.0.0
import { useAuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants/routes';
import { UserRole } from '../utils/constants/roles';

/**
 * Props for the RoleBasedRoute component
 */
interface RoleBasedRouteProps {
  /**
   * The minimum role required to access the protected route
   */
  requiredRole: UserRole;
}

/**
 * Component that restricts access to routes based on user roles.
 * 
 * This component checks if the current user has the required role permissions
 * to access the route. If they do, it renders child routes using Outlet.
 * If not, it redirects them to the access denied page.
 * 
 * @param props - Component props containing the required role
 * @returns JSX.Element - Either renders the child routes or redirects to access denied page
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ requiredRole }) => {
  // Get auth state and role checking function from context
  const { state, hasRole } = useAuthContext();

  // Check if the user has the required role level
  const hasRequiredRole = hasRole(requiredRole);

  // If user doesn't have the required role, redirect to access denied page
  if (!hasRequiredRole) {
    return <Navigate to={ROUTES.ERRORS.ACCESS_DENIED} replace />;
  }

  // User has the required role, render child routes
  return <Outlet />;
};

export default RoleBasedRoute;