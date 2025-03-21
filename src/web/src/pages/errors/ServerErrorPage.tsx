import React, { useCallback } from 'react'; // React v^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { useNavigate } from 'react-router-dom'; // version ^6.10.0

import Button from '../../components/common/Button';
import { ROUTES } from '../../utils/constants/routes';
import MainLayout from '../../components/layout/MainLayout';

// Styled component for the error container
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  min-height: 60vh;
`;

// Styled component for the error code
const ErrorCode = styled.h1`
  font-size: 6rem;
  font-weight: 700;
  color: ${props => props.theme.colors.error.main};
  margin-bottom: 1rem;
  line-height: 1;
`;

// Styled component for the error title
const ErrorTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.primary};
`;

// Styled component for the error description
const ErrorDescription = styled.p`
  font-size: 1.125rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 500px;
  margin-bottom: 2rem;
`;

// Styled component for the error illustration
const Illustration = styled.img`
  width: 100%;
  max-width: 400px;
  height: auto;
  margin-bottom: 2rem;
`;

// Styled component for the button container
const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-top: 1rem;
`;

/**
 * Component that renders a user-friendly 500 server error page
 * @returns Rendered server error page
 */
const ServerErrorPage: React.FC = () => {
  // Get navigate function from useNavigate hook
  const navigate = useNavigate();

  // Define handleGoHome function to navigate to dashboard
  const handleGoHome = useCallback(() => {
    navigate(ROUTES.DASHBOARD.HOME);
  }, [navigate]);

  // Define handleRefresh function to reload the current page
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Render the ErrorContainer with error illustration and message
  return (
    <MainLayout>
      <ErrorContainer>
        {/* Display 500 error code and descriptive message */}
        <Illustration src="/img/error-500.svg" alt="Server Error Illustration" />
        <ErrorCode>500</ErrorCode>
        <ErrorTitle>Server Error</ErrorTitle>
        <ErrorDescription>
          Oops! Something went wrong on our end. We're working to fix it.
          Please try refreshing the page or return to the dashboard.
        </ErrorDescription>

        {/* Provide action buttons to navigate back to dashboard or refresh the page */}
        <ButtonContainer>
          <Button label="Refresh" onClick={handleRefresh} />
          <Button variant="secondary" label="Go to Dashboard" onClick={handleGoHome} />
        </ButtonContainer>
      </ErrorContainer>
    </MainLayout>
  );
};

export default ServerErrorPage;