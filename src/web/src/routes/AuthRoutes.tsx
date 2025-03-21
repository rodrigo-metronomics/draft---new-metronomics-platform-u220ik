import React from 'react'; // React library for component creation - v18.2.0
import { Routes, Route } from 'react-router-dom'; // React Router components for defining routes - v6.10.0

// Internal imports
import PublicRoute from './PublicRoute'; // Route wrapper that restricts access to public routes for authenticated users
import LoginPage from '../pages/auth/LoginPage'; // Page component for user login
import RegisterPage from '../pages/auth/RegisterPage'; // Page component for user registration
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'; // Page component for requesting password reset
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'; // Page component for resetting password
import AuthLayout from '../layouts/AuthLayout'; // Layout component for authentication pages
import { ROUTES } from '../utils/constants/routes'; // Route constants for defining authentication paths

/**
 * Component that defines all authentication-related routes
 * 
 * @returns {JSX.Element} Routes component containing all authentication routes
 */
const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Wrap all routes with PublicRoute to prevent authenticated users from accessing auth pages */}
      <Route element={<PublicRoute />}>
        {/* Ensure all routes use the AuthLayout for consistent styling */}
        <Route element={<AuthLayout />}>
          {/* Define route for login page at AUTH.LOGIN path */}
          <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
          {/* Define route for registration page at AUTH.REGISTER path */}
          <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
          {/* Define route for forgot password page at AUTH.FORGOT_PASSWORD path */}
          <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          {/* Define route for reset password page at AUTH.RESET_PASSWORD path */}
          <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AuthRoutes;