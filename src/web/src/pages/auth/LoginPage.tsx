import React, { useEffect } from 'react'; // version ^18.2.0
import { useNavigate } from 'react-router-dom'; // version ^6.10.0
import styled from 'styled-components'; // version ^5.3.10

import { useAuthContext } from '../../contexts/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import { ROUTES } from '../../utils/constants/routes';

/**
 * Styled component for the login container to center the content
 */
const LoginContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

/**
 * The main login page component that renders the authentication layout with login form
 */
const LoginPage: React.FC = () => {
  // Get authentication state from useAuthContext hook
  const { state } = useAuthContext();

  // Get navigate function from useNavigate hook
  const navigate = useNavigate();

  /**
   * Effect hook that redirects to dashboard if user is already authenticated
   */
  useEffect(() => {
    // Check if user is authenticated
    if (state.isAuthenticated) {
      // If authenticated, navigate to dashboard route
      navigate(ROUTES.DASHBOARD.HOME);
    }
  }, [state.isAuthenticated, navigate]);

  /**
   * Handler function called after successful login
   */
  const handleLoginSuccess = () => {
    // Navigate to dashboard route after successful authentication
    navigate(ROUTES.DASHBOARD.HOME);
  };

  return (
    <AuthLayout title="Welcome to Metronomics" subtitle="Sign in to your account">
      <LoginForm onSuccess={handleLoginSuccess} />
    </AuthLayout>
  );
};

export default LoginPage;