import React, { useCallback } from 'react'; // version ^18.2.0
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
  margin-top: 1rem;
`;

/**
 * Component that renders a user-friendly 404 not found error page
 * @returns Rendered not found error page
 */
const NotFoundPage: React.FC = () => {
  // Get navigate function from useNavigate hook
  const navigate = useNavigate();

  // Define handleGoHome function to navigate to dashboard
  const handleGoHome = useCallback(() => {
    navigate(ROUTES.DASHBOARD.HOME);
  }, [navigate]);

  // Render the ErrorContainer with error illustration and message
  return (
    <MainLayout>
      <ErrorContainer>
        {/* Display error illustration */}
        <Illustration src="/images/404-illustration.svg" alt="404 Not Found" />

        {/* Display 404 error code */}
        <ErrorCode>404</ErrorCode>

        {/* Display descriptive error message */}
        <ErrorTitle>Page Not Found</ErrorTitle>
        <ErrorDescription>
          The page you are looking for does not exist or has been moved.
          Please check the URL or return to the dashboard.
        </ErrorDescription>

        {/* Provide a Button component to navigate back to dashboard */}
        <ButtonContainer>
          <Button label="Go to Dashboard" onClick={handleGoHome} />
        </ButtonContainer>
      </ErrorContainer>
    </MainLayout>
  );
};

export default NotFoundPage;