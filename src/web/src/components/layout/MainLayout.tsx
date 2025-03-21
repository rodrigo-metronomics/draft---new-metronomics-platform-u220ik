import React, { useState, useEffect, useCallback } from 'react'; // React v^18.2.0
import styled from 'styled-components'; // version ^5.3.10

// Internal imports for layout components
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import Footer from './Footer';

// Internal imports for responsive hook and styles
import { useResponsive } from '../../hooks/useResponsive';
import { colors } from '../../styles/colors';
import { mediaQueries } from '../../styles/breakpoints';

// Define the props for the MainLayout component
interface MainLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
}

// Styled components for the layout
const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  position: relative;
  background-color: ${props => props.theme.colors.background.primary};
`;

const MainContent = styled.main<{ isSidebarOpen: boolean }>`
  flex: 1;
  padding: 24px;
  padding-top: 88px; /* Adjust for header height + spacing */
  transition: padding-left 0.3s ease;
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
  background-color: ${props => props.theme.colors.background.primary};

  /* Adjust padding-left based on sidebar state and screen size */
  ${mediaQueries.desktop} {
    padding-left: ${props => (props.isSidebarOpen ? '264px' : '24px')}; /* Sidebar width + spacing */
  }
`;

const ContentWrapper = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
`;

const SidebarOverlay = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  opacity: ${props => (props.isVisible ? 1 : 0)};
  visibility: ${props => (props.isVisible ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s ease;

  /* Hide on desktop */
  ${mediaQueries.desktop} {
    display: none;
  }
`;

const BreadcrumbsWrapper = styled.div`
  margin-bottom: 16px;
`;

/**
 * Main layout component that provides the application structure
 * @param children - The content to render within the layout
 * @param showBreadcrumbs - Whether to display breadcrumbs
 * @returns Rendered layout component
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, showBreadcrumbs = true }) => {
  // Get screen size information using useResponsive hook
  const { isMobileView } = useResponsive();

  // Initialize state for sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Create toggleSidebar function to show/hide the sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Create closeSidebar function to hide the sidebar
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Add effect to close sidebar when screen size changes from mobile to desktop
  useEffect(() => {
    if (!isMobileView) {
      setIsSidebarOpen(false);
    }
  }, [isMobileView]);

  // Add effect to handle body overflow when sidebar is open on mobile
  useEffect(() => {
    if (isMobileView && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Clean up body overflow style on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileView, isSidebarOpen]);

  // Return the layout structure with Header, Sidebar, main content area, and Footer
  return (
    <LayoutContainer>
      <Header onMenuToggle={toggleSidebar} />
      <SidebarOverlay isVisible={isSidebarOpen} onClick={closeSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <MainContent isSidebarOpen={isSidebarOpen}>
        <ContentWrapper>
          {/* Conditionally render Breadcrumbs based on showBreadcrumbs prop */}
          {showBreadcrumbs && (
            <BreadcrumbsWrapper>
              <Breadcrumbs />
            </BreadcrumbsWrapper>
          )}
          {children}
        </ContentWrapper>
      </MainContent>
      <Footer />
    </LayoutContainer>
  );
};

export default MainLayout;