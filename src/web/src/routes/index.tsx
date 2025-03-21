import React from 'react'; // React library for component creation - v18.2.0
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // React Router components for routing configuration - v6.10.0

// Internal imports
import AuthRoutes from './AuthRoutes'; // Routes for authentication-related pages
import DashboardRoutes from './DashboardRoutes'; // Protected routes for authenticated users
import NotFoundPage from '../pages/errors/NotFoundPage'; // 404 error page for non-existent routes
import { ROUTES } from '../utils/constants/routes'; // Route constants for defining paths

/**
 * Main routing component that defines the application's routing structure
 *
 * @returns {JSX.Element} BrowserRouter containing all application routes
 */
const AppRoutes: React.FC = () => {
  return (
    // LD1: Wrap all routes with BrowserRouter to enable routing
    <BrowserRouter>
      {/* LD1: Define Routes component to contain all route definitions */}
      <Routes>
        {/* LD1: Include root route that redirects to dashboard for authenticated users or login for unauthenticated users */}
        <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.DASHBOARD.HOME} />} />

        {/* LD1: Include AuthRoutes component for authentication-related routes */}
        <Route path={ROUTES.AUTH.ROOT} element={<AuthRoutes />} />

        {/* LD1: Include DashboardRoutes component for protected application routes */}
        <Route path={ROUTES.DASHBOARD.ROOT} element={<DashboardRoutes />} />

        {/* LD1: Define explicit route for 404 Not Found page */}
        <Route path={ROUTES.ERRORS.NOT_FOUND} element={<NotFoundPage />} />

        {/* LD1: Include catch-all route that redirects to 404 page for any undefined routes */}
        <Route path="*" element={<Navigate to={ROUTES.ERRORS.NOT_FOUND} />} />
      </Routes>
    </BrowserRouter>
  );
};

// LD1: Default export of the AppRoutes component for use in the main application
export default AppRoutes;