import React, { useEffect } from 'react'; // v18.2.0
import { useNavigate } from 'react-router-dom'; // v6.10.0

// Internal imports
import AuthLayout from '../../layouts/AuthLayout';
import RegisterForm from '../../components/auth/RegisterForm';
import { ROUTES } from '../../utils/constants/routes';
import { useAuth } from '../../hooks/useAuth';

/**
 * Page component that renders the registration form within the authentication layout
 * @returns Rendered registration page component
 */
const RegisterPage: React.FC = () => {
  // Initialize navigate function from useNavigate hook
  const navigate = useNavigate();

  // Get authentication state from useAuth hook
  const { state } = useAuth();

  /**
   * Define handleSuccess function to navigate to dashboard after successful registration
   */
  const handleSuccess = () => {
    navigate(ROUTES.DASHBOARD.HOME);
  };

  /**
   * Effect hook that redirects to dashboard if user is already authenticated
   */
  useEffect(() => {
    // Check if user is authenticated
    if (state.isAuthenticated) {
      // If authenticated, navigate to dashboard
      navigate(ROUTES.DASHBOARD.HOME);
    }
  }, [state.isAuthenticated, navigate]);

  // Render AuthLayout with appropriate title and subtitle
  // Render RegisterForm component within the layout, passing the handleSuccess callback
  return (
    <AuthLayout title="Create an Account" subtitle="Register to get started with Metronomics">
      <RegisterForm onSuccess={handleSuccess} />
    </AuthLayout>
  );
};

export default RegisterPage;