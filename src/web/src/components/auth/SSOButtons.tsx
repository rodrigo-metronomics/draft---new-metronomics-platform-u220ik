import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGoogle, FaMicrosoft } from 'react-icons/fa'; // version ^4.0.0
import { useAuthContext } from '../../contexts/AuthContext';
import Button from '../common/Button';
import { colors } from '../../styles/colors';

/**
 * Props for the SSOButtons component
 */
interface SSOButtonsProps {
  /** Callback function triggered after successful login */
  onSuccess?: () => void;
  /** Additional CSS class to apply to the container */
  className?: string;
  /** Additional inline styles to apply to the container */
  style?: React.CSSProperties;
}

/**
 * Styled container for SSO buttons
 */
const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

/**
 * Base styled button for SSO providers
 */
const SSOButton = styled(Button)`
  width: 100%;
  justify-content: center;
  border: 1px solid ${colors.neutral.light};
  background-color: ${colors.white};
  color: ${colors.neutral.dark};
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: ${colors.neutral.lightest};
    border-color: ${colors.neutral.medium};
  }
  
  &:focus {
    outline-color: ${colors.primary.main};
  }
`;

/**
 * Google-styled SSO button
 */
const GoogleButton = styled(SSOButton)`
  border-color: #4285F4;
  
  &:hover:not(:disabled) {
    background-color: rgba(66, 133, 244, 0.04);
  }
`;

/**
 * Microsoft-styled SSO button
 */
const MicrosoftButton = styled(SSOButton)`
  border-color: #00a4ef;
  
  &:hover:not(:disabled) {
    background-color: rgba(0, 164, 239, 0.04);
  }
`;

/**
 * Wrapper for provider icons
 */
const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  font-size: 1.25rem;
`;

/**
 * A component that provides Single Sign-On (SSO) authentication options for Google and Microsoft.
 * It renders styled buttons that trigger the respective authentication flows when clicked.
 */
const SSOButtons: React.FC<SSOButtonsProps> = ({
  onSuccess = () => {},
  className,
  style
}) => {
  const { loginWithGoogle, loginWithMicrosoft, state } = useAuthContext();
  const [loginProvider, setLoginProvider] = useState<'google' | 'microsoft' | null>(null);
  
  // Reset login provider when authentication completes
  useEffect(() => {
    if (!state.isLoading && loginProvider !== null) {
      setLoginProvider(null);
    }
  }, [state.isLoading, loginProvider]);
  
  /**
   * Handles Google login button click
   */
  const handleGoogleLogin = async () => {
    setLoginProvider('google');
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (error) {
      // Error handling is managed by the AuthContext
      console.error('Google login error:', error);
    }
  };
  
  /**
   * Handles Microsoft login button click
   */
  const handleMicrosoftLogin = async () => {
    setLoginProvider('microsoft');
    try {
      await loginWithMicrosoft();
      onSuccess();
    } catch (error) {
      // Error handling is managed by the AuthContext
      console.error('Microsoft login error:', error);
    }
  };
  
  return (
    <ButtonContainer className={className} style={style}>
      <GoogleButton
        onClick={handleGoogleLogin}
        disabled={state.isLoading}
        loading={state.isLoading && loginProvider === 'google'}
        aria-label="Continue with Google"
      >
        <IconWrapper>
          <FaGoogle />
        </IconWrapper>
        Continue with Google
      </GoogleButton>
      
      <MicrosoftButton
        onClick={handleMicrosoftLogin}
        disabled={state.isLoading}
        loading={state.isLoading && loginProvider === 'microsoft'}
        aria-label="Continue with Microsoft"
      >
        <IconWrapper>
          <FaMicrosoft />
        </IconWrapper>
        Continue with Microsoft
      </MicrosoftButton>
    </ButtonContainer>
  );
};

export default SSOButtons;