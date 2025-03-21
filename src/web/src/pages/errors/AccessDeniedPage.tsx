import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/common/Button';
import IconButton from '../../components/common/IconButton';
import Card from '../../components/common/Card';
import AuthLayout from '../../layouts/AuthLayout';
import { ROUTES } from '../../utils/constants/routes';
import useAuth from '../../hooks/useAuth';

// Styled components for the error page
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
`;

const ErrorIcon = styled.div`
  font-size: 5rem;
  color: ${props => props.theme.colors.error[500]};
  margin-bottom: 1.5rem;
`;

const ErrorCode = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.error[500]};
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.primary};
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 2rem;
  max-width: 500px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

/**
 * Page component that displays an access denied error message with navigation options
 */
const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Navigate to dashboard when the primary button is clicked
  const handleBackToDashboard = () => {
    navigate(ROUTES.DASHBOARD.ROOT);
  };

  // Log out the user when the secondary button is clicked
  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <AuthLayout 
      title="Access Denied" 
      subtitle="You don't have permission to access this page"
    >
      <ErrorContainer>
        <ErrorIcon>
          <i className="pi pi-lock"></i>
        </ErrorIcon>
        <ErrorCode>403</ErrorCode>
        <ErrorTitle>Access Denied</ErrorTitle>
        <ErrorMessage>
          You don't have sufficient permissions to access this page. 
          Please contact your administrator if you believe this is an error.
        </ErrorMessage>
        <ActionButtons>
          <Button 
            label="Back to Dashboard" 
            variant="PRIMARY"
            onClick={handleBackToDashboard}
          />
          <Button 
            label="Logout" 
            variant="TERTIARY"
            onClick={handleLogout}
          />
        </ActionButtons>
      </ErrorContainer>
    </AuthLayout>
  );
};

export default AccessDeniedPage;