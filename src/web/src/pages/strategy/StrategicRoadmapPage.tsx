# src/web/src/pages/strategy/StrategicRoadmapPage.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // React hooks for component state and lifecycle management // v18.2.0
import styled from 'styled-components'; // Styling the component with CSS-in-JS // ^5.3.10
import { useNavigate } from 'react-router-dom'; // Hook for programmatic navigation // v6.4.0

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout component for dashboard pages
import RoadmapTimeline from '../../components/strategy/RoadmapTimeline'; // Component for visualizing goals and milestones on a timeline
import GoalCard from '../../components/strategy/GoalCard'; // Component for displaying goal details in a card format
import GoalFilters from '../../components/strategy/GoalFilters'; // Component for filtering goals by type, status, and date range
import Button from '../../components/common/Button'; // Button component for actions like creating new goals
import Card from '../../components/common/Card'; // Container component for page sections
import Tabs from '../../components/common/Tabs'; // Tab navigation for switching between timeline and list views
import Spinner from '../../components/common/Spinner'; // Loading indicator for async operations
import { useGoals } from '../../hooks/useGoals'; // Custom hook for fetching and managing goals data
import { useOrganizationContext } from '../../contexts/OrganizationContext'; // Access current organization context
import { GoalFilters as GoalFiltersType, GoalType, GoalTimelineItem } from '../../types/goal.types'; // Type definitions for goals and filters
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation

// Styled components for layout and visual presentation
const PageContainer = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
`;

const FiltersToggle = styled.button`
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  flex: 1;
`;

const MainContent = styled.div<{ hasSelectedGoal: boolean }>`
  flex: 1;
  transition: all 0.3s ease;
  width: ${props => props.hasSelectedGoal ? 'calc(100% - 350px)' : '100%'};
`;

const SidePanel = styled.div<{ visible: boolean }>`
  width: ${props => props.visible ? '350px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
`;

const GoalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--text-color-secondary);
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

/**
 * Main component for the Strategic Roadmap page
 */
const StrategicRoadmapPage: React.FC = () => {
  // LD1: Get current organization from context
  const { currentOrganization } = useOrganizationContext();

  // LD1: Initialize state for view mode (timeline or list)
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  // LD1: Initialize state for filters
  const [filters, setFilters] = useState<GoalFiltersType>({
    type: null,
    status: null,
    organizationId: currentOrganization?.id || null,
    search: null,
    dateRange: null,
  });

  // LD1: Initialize state for selected goal
  const [selectedGoal, setSelectedGoal] = useState<GoalTimelineItem | null>(null);

  // LD1: Initialize state for filter panel expansion
  const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState<boolean>(true);

  // LD1: Use useGoals hook to fetch timeline items and goals based on filters
  const { goals, getTimelineItems } = useGoals();
  const { data: timelineData, isLoading } = getTimelineItems.getTimelineItems(filters.type);

  // LD1: Handle filter changes by updating filters state
  const handleFilterChange = useCallback((newFilters: GoalFiltersType) => {
    setFilters(newFilters);
  }, []);

  // LD1: Handle goal selection by updating selectedGoal state
  const handleGoalSelect = useCallback((goal: GoalTimelineItem) => {
    setSelectedGoal(goal);
  }, []);

  // LD1: Handle view mode change by updating viewMode state
  const handleViewModeChange = useCallback((index: number) => {
    setViewMode(index === 0 ? 'timeline' : 'list');
  }, []);

  // LD1: Handle navigation to goal detail page when a goal is clicked
  const navigate = useNavigate();
  const handleGoalClick = useCallback((goal: Goal) => {
    navigate(ROUTES.STRATEGY.GOAL_DETAIL.replace(':id', goal.id.toString()));
  }, [navigate]);

  // LD1: Handle navigation to create new goal page
  const handleCreateGoalClick = useCallback(() => {
    navigate(ROUTES.STRATEGY.GOAL_NEW);
  }, [navigate]);

  // LD1: Render DashboardLayout with page title and content
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader>
          <PageTitle>Strategic Roadmap</PageTitle>
          <Button label="New Goal" icon="pi pi-plus" onClick={handleCreateGoalClick} />
        </PageHeader>

        <Card>
          <FiltersToggle onClick={() => setIsFilterPanelExpanded(prev => !prev)}>
            <i className={`pi ${isFilterPanelExpanded ? 'pi-chevron-up' : 'pi-chevron-down'}`} />
            {isFilterPanelExpanded ? 'Hide Filters' : 'Show Filters'}
          </FiltersToggle>
          <GoalFilters initialFilters={filters} onFilterChange={handleFilterChange} expanded={isFilterPanelExpanded} />
        </Card>

        <ContentContainer>
          <MainContent hasSelectedGoal={!!selectedGoal}>
            <Tabs items={[
              { label: 'Timeline', content: null },
              { label: 'List', content: null }
            ]} onTabChange={handleViewModeChange} />

            {isLoading ? (
              <LoadingContainer>
                <Spinner />
              </LoadingContainer>
            ) : timelineData && timelineData.length > 0 ? (
              viewMode === 'timeline' ? (
                <RoadmapTimeline timelineItems={timelineData} onItemClick={handleGoalSelect} />
              ) : (
                <GoalGrid>
                  {timelineData.map(goal => (
                    <GoalCard key={goal.id} goal={goal} interactive onClick={() => handleGoalClick(goal)} />
                  ))}
                </GoalGrid>
              )
            ) : (
              <EmptyState>
                No strategic goals to display.
              </EmptyState>
            )}
          </MainContent>

          <SidePanel visible={!!selectedGoal}>
            {selectedGoal && (
              <Card title={selectedGoal.title}>
                {/* Display selected goal details here */}
                <p>Details for {selectedGoal.title}</p>
              </Card>
            )}
          </SidePanel>
        </ContentContainer>
      </PageContainer>
    </DashboardLayout>
  );
};

export default StrategicRoadmapPage;