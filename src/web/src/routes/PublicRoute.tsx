import React from 'react';
import { Navigate, Outlet } from 'react-router-dom'; // v6.0.0
import { useAuthContext } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants/routes';

/**
 * Component that restricts access to public routes for authenticated users.
 * Redirects authenticated users to the dashboard while allowing unauthenticated users
 * to access public content like login and registration pages.
 * 
 * @returns {JSX.Element} Either redirects to dashboard or renders the child routes
 */
const PublicRoute = (): JSX.Element => {
  // Get authentication state from context
  const { state } = useAuthContext();
  
  // If user is authenticated, redirect to dashboard
  if (state.isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD.HOME} replace />;
  }
  
  // If not authenticated, render the child routes
  return <Outlet />;
};

export default PublicRoute;