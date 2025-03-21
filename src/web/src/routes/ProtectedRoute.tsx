import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants/routes';

/**
 * ProtectedRoute component
 * 
 * A route wrapper component that restricts access to protected routes for unauthenticated users.
 * It ensures that only authenticated users can access protected content, redirecting
 * unauthenticated users to the login page with the current location saved for redirect after login.
 * 
 * Usage in routing:
 * ```tsx
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 *   <Route path="/profile" element={<Profile />} />
 * </Route>
 * ```
 * 
 * @returns JSX.Element Either redirects to login or renders the child routes using Outlet
 */
const ProtectedRoute = (): JSX.Element => {
  // Get authentication state from AuthContext
  const { state } = useAuthContext();
  
  // Get current location for redirection after login
  const location = useLocation();
  
  // If user is not authenticated, redirect to login page
  if (!state.isAuthenticated) {
    // Save the current location in state for redirect after successful login
    return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />;
  }
  
  // User is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;