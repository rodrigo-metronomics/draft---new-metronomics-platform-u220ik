import React from 'react'; // React library for component creation // v18.2.0
import { Navigate, useLocation } from 'react-router-dom'; // React Router components for navigation and location tracking // v6.10.0

import { useAuthContext } from '../contexts/AuthContext'; // Access authentication state to determine if user is authenticated
import MainLayout from '../components/layout/MainLayout'; // Main layout component that provides the application structure
import { ROUTES } from '../utils/constants/routes'; // Route constants for navigation

/**
 * @interface DashboardLayoutProps
 * Props interface for the DashboardLayout component
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
}

/**
 * @component DashboardLayout
 * Layout component that wraps dashboard content with authentication check and main layout
 * @param {DashboardLayoutProps} props - The props for the DashboardLayout component.
 * @param {ReactNode} props.children - The content to render within the layout.
 * @param {boolean} props.showBreadcrumbs - Whether to display breadcrumbs.
 * @returns {JSX.Element} Either redirects to login or renders the children within MainLayout
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, showBreadcrumbs = true }) => {
  // LD1: Get authentication state from useAuthContext hook
  const { state } = useAuthContext();
  // LD1: Get current location using useLocation hook
  const location = useLocation();

  // LD1: Check if user is authenticated
  if (!state.isAuthenticated) {
    // LD1: If not authenticated, redirect to login page with the current location stored in state for return after login
    return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />;
  }

  // LD1: If authenticated, render the MainLayout with children and showBreadcrumbs prop
  return (
    <MainLayout showBreadcrumbs={showBreadcrumbs}>
      {children}
    </MainLayout>
  );
};

export default DashboardLayout;