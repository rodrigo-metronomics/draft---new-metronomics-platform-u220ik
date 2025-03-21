import React, { useState, useEffect } from 'react'; // React library for component creation // v18.2.0
import styled from 'styled-components'; // CSS-in-JS library for component styling // v5.3.10
import { useNavigate } from 'react-router-dom'; // Hook for programmatic navigation // v6.10.0

// Internal imports
import DashboardLayout from '../../layouts/DashboardLayout'; // Layout wrapper that provides authentication check and main application structure
import KeyMetricsWidget from '../../components/dashboard/KeyMetricsWidget'; // Widget displaying key performance metrics
import ActionItemsWidget from '../../components/dashboard/ActionItemsWidget'; // Widget displaying user's action items
import UpcomingMeetingsWidget from '../../components/dashboard/UpcomingMeetingsWidget'; // Widget displaying upcoming scheduled meetings
import AnnouncementsWidget from '../../components/dashboard/AnnouncementsWidget'; // Widget displaying team announcements and notifications
import useAuth from '../../hooks/useAuth'; // Hook for accessing authentication state and user information
import useOrganization from '../../hooks/useOrganization'; // Hook for accessing current organization data
import useResponsive from '../../hooks/useResponsive'; // Hook for responsive design adaptations
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation

// Styled Components
const PageContainer = styled.div`
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;
`;

const PageHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
`;

const WelcomeMessage = styled.p`
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-gap: 1.5rem;
  height: calc(100% - 5rem);

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
`;

const WidgetContainer = styled.div<{ gridColumn?: string; gridRow?: string }>`
  grid-column: ${props => props.gridColumn || 'span 6'};
  grid-row: ${props => props.gridRow || 'auto'};
  min-height: 300px;

  @media (max-width: 992px) {
    grid-column: span 12;
  }

  @media (max-width: 576px) {
    min-height: 250px;
  }
`;

/**
 * Main dashboard page component that displays an overview of key information
 */
const DashboardPage: React.FC = () => {
  // Get navigation function from useNavigate hook
  const navigate = useNavigate();

  // Get current user information from useAuth hook
  const { state: authState } = useAuth();

  // Get current organization from useOrganization hook
  const { currentOrganization } = useOrganization();

  // Get responsive design information from useResponsive hook
  const { isMobileView, isTabletView } = useResponsive();

  // Define navigation handlers for each widget's "View All" action
  const handleViewAllMeetings = () => {
    navigate(ROUTES.MEETINGS.LIST);
  };

  const handleViewAllMetrics = () => {
    navigate(ROUTES.METRICS.DASHBOARD);
  };

  const handleViewAllAnnouncements = () => {
    // Navigate to the announcements page or a dedicated notification center
    // For now, navigate to the metrics dashboard
    navigate(ROUTES.METRICS.DASHBOARD);
  };

  // Render DashboardLayout as the container component
  return (
    <DashboardLayout>
      <PageContainer>
        {/* Render page title and welcome message with user's name */}
        <PageHeader>
          <PageTitle>Dashboard</PageTitle>
          <WelcomeMessage>
            Welcome, {authState.user?.firstName} {authState.user?.lastName}!
          </WelcomeMessage>
        </PageHeader>

        {/* Render dashboard grid with responsive layout based on device type */}
        <DashboardGrid>
          {/* Include UpcomingMeetingsWidget with navigation handler */}
          <WidgetContainer gridColumn={isMobileView ? 'span 12' : 'span 6'}>
            <UpcomingMeetingsWidget onViewAll={handleViewAllMeetings} />
          </WidgetContainer>

          {/* Include ActionItemsWidget with navigation handler */}
          <WidgetContainer gridColumn={isMobileView ? 'span 12' : 'span 6'}>
            <ActionItemsWidget />
          </WidgetContainer>

          {/* Include KeyMetricsWidget with navigation handler */}
          <WidgetContainer gridColumn={isTabletView ? 'span 12' : 'span 8'}>
            <KeyMetricsWidget onViewAll={handleViewAllMetrics} />
          </WidgetContainer>

          {/* Include AnnouncementsWidget with navigation handler */}
          <WidgetContainer gridColumn={isTabletView ? 'span 12' : 'span 4'}>
            <AnnouncementsWidget onViewAll={handleViewAllAnnouncements} />
          </WidgetContainer>
        </DashboardGrid>
      </PageContainer>
    </DashboardLayout>
  );
};

export default DashboardPage;