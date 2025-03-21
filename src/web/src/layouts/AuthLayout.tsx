import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import useResponsive from '../hooks/useResponsive';
import Card from '../components/common/Card';
import { ROUTES } from '../utils/constants/routes';

/**
 * Props interface for the AuthLayout component
 */
interface AuthLayoutProps {
  /** Main heading for the authentication page */
  title?: string;
  /** Secondary text providing additional context */
  subtitle?: string;
  /** Content to render within the layout (typically authentication forms) */
  children: ReactNode;
  /** Whether to display the logo in the header */
  showLogo?: boolean;
}

/**
 * Main container for the authentication layout with a two-column design
 */
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
`;

/**
 * Left column with branding background that's visible only on desktop
 */
const BrandingColumn = styled.div<{ isVisible: boolean }>`
  flex: 1;
  background-image: url('/assets/images/login-background.jpg');
  background-size: cover;
  background-position: center;
  display: ${props => props.isVisible ? 'block' : 'none'};
`;

/**
 * Right column containing the authentication content
 */
const ContentColumn = styled.div<{ fullWidth: boolean }>`
  flex: ${props => props.fullWidth ? 1 : 0.6};
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing.xl};
  background-color: ${props => props.theme.colors.background.primary};
  justify-content: center;
  align-items: center;
`;

/**
 * Container for the logo at the top of the content column
 */
const LogoContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
`;

/**
 * Logo image with consistent sizing
 */
const Logo = styled.img`
  height: 50px;
`;

/**
 * Card component styled for authentication forms
 */
const AuthCard = styled(Card)`
  width: 100%;
  max-width: 450px;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

/**
 * Main heading for the authentication page
 */
const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSizes.xl};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
`;

/**
 * Secondary text below the title
 */
const Subtitle = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.md};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`;

/**
 * Footer component with copyright and links
 */
const Footer = styled.footer`
  margin-top: auto;
  text-align: center;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

/**
 * Container for footer links with consistent spacing
 */
const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.sm};
`;

/**
 * Styled link for footer navigation
 */
const FooterLink = styled(Link)`
  color: ${props => props.theme.colors.primary.main};
  text-decoration: none;
  &:hover {
    color: ${props => props.theme.colors.primary.dark};
    text-decoration: underline;
  }
`;

/**
 * A layout component for authentication pages with responsive design.
 * Provides a consistent structure with branding and content areas.
 * 
 * @param props - Component props
 * @returns The authentication layout component
 */
const AuthLayout = ({
  title = 'Welcome to Metronomics',
  subtitle = 'Please sign in to continue',
  children,
  showLogo = true,
}: AuthLayoutProps): JSX.Element => {
  // Use the responsive hook to determine current screen size
  const { isMobileView, isDesktopView } = useResponsive();
  
  return (
    <LayoutContainer>
      {/* Branding column - only visible on desktop */}
      <BrandingColumn isVisible={isDesktopView} />
      
      {/* Content column - takes full width on mobile/tablet */}
      <ContentColumn fullWidth={!isDesktopView}>
        {/* Logo section (optional) */}
        {showLogo && (
          <LogoContainer>
            <Logo src="/assets/images/logo.png" alt="Metronomics Logo" />
          </LogoContainer>
        )}
        
        {/* Main authentication content */}
        <AuthCard>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
          {children}
        </AuthCard>
        
        {/* Footer with copyright and links */}
        <Footer>
          <div>© {new Date().getFullYear()} Metronomics. All rights reserved.</div>
          <FooterLinks>
            <FooterLink to="#">Terms of Service</FooterLink>
            <FooterLink to="#">Privacy Policy</FooterLink>
            <FooterLink to="#">Help</FooterLink>
          </FooterLinks>
        </Footer>
      </ContentColumn>
    </LayoutContainer>
  );
};

export default AuthLayout;