import React, { useState, useEffect, useCallback, useMemo } from 'react'; // React library for component creation // v18.2.0
import { useNavigate } from 'react-router-dom'; // React Router hook for programmatic navigation
import styled from 'styled-components'; // Styled components for component styling
import DashboardLayout from '../../layouts/DashboardLayout'; // Layout wrapper for dashboard pages with authentication and navigation
import MetricCard from '../../components/metrics/MetricCard'; // Card component for displaying individual metrics
import MetricFilters from '../../components/metrics/MetricFilters'; // Component for filtering metrics by various criteria
import Button from '../../components/common/Button'; // Button component for actions like adding new metrics
import Dropdown from '../../components/common/Dropdown'; // Dropdown component for selecting view options
import Spinner from '../../components/common/Spinner'; // Loading indicator component
import useMetrics from '../../hooks/useMetrics'; // Custom hook for fetching and managing metrics data
import useOrganization from '../../hooks/useOrganization'; // Hook for accessing current organization context
import useResponsive from '../../hooks/useResponsive'; // Hook for responsive design adaptations
import {
  MetricFilters,
  MetricWithValues,
  ComparisonType,
  ChartType,
  ColorScheme,
} from '../../types/metric.types'; // Type definitions for metrics data and filtering
import { DateRange, TimeRange } from '../../types/common.types'; // Common type definitions for date ranges and time periods
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation
import { COMPARISON_TYPES } from '../../utils/constants/metricTypes'; // Constants for metric comparison types

// Styled components for layout and styling
const PageContainer = styled.div`
  padding: 1.5rem;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const FiltersContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const ViewOptionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const DropdownContainer = styled.div`
  min-width: 200px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const CategorySection = styled.div`
  margin-bottom: 2rem;
`;

const CategoryTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.primary};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
`;

const EmptyStateText = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 1.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

/**
 * Main component for the metrics dashboard page
 * @returns Rendered metrics dashboard page
 */
const MetricsDashboardPage: React.FC = () => {
  // LD1: Get current organization using useOrganization hook
  const { currentOrganization } = useOrganization();

  // LD1: Initialize responsive design utilities with useResponsive hook
  const { isMobileView } = useResponsive();

  // LD1: Set up state for filters, view options, and selected metrics
  const [filters, setFilters] = useState<MetricFilters>({
    organizationId: currentOrganization?.id || '',
    teamId: null,
    type: null,
    goalId: null,
    search: null,
    dateRange: null,
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('yoy');
  const [viewType, setViewType] = useState<'grid' | 'category'>('grid');

  // LD1: Initialize navigation with useNavigate hook
  const navigate = useNavigate();

  // LD1: Set up metrics data fetching with useMetrics hook
  const { metrics, isLoading, refetch } = useMetrics();

  // LD1: Handle filter changes with useCallback to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilters: MetricFilters) => {
    setFilters({
      ...newFilters,
      organizationId: currentOrganization?.id || '', // Ensure organizationId is always set
    });
  }, [currentOrganization?.id]);

  // LD1: Handle time range changes with useCallback to prevent unnecessary re-renders
  const handleTimeRangeChange = useCallback((selectedOption: any) => {
    const value = selectedOption.value as TimeRange;
    setTimeRange(value);
    // Update dateRange in filters based on selected time range
    setFilters(prevFilters => ({
      ...prevFilters,
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      }
    }));
  }, []);

  // LD1: Handle comparison type changes with useCallback to prevent unnecessary re-renders
  const handleComparisonTypeChange = useCallback((selectedOption: any) => {
    const value = selectedOption.value as ComparisonType;
    setComparisonType(value);
  }, []);

  // LD1: Handle view type changes with useCallback to prevent unnecessary re-renders
  const handleViewTypeChange = useCallback((selectedOption: any) => {
    const value = selectedOption.value as 'grid' | 'category';
    setViewType(value);
  }, []);

  // LD1: Handle navigation to the new metric creation page
  const handleAddMetric = useCallback(() => {
    navigate(ROUTES.METRICS.NEW);
  }, [navigate]);

  // LD1: Handle click on a metric card to view details
  const handleMetricClick = useCallback((metric: MetricWithValues) => {
    navigate(ROUTES.METRICS.DETAIL.replace(':id', metric.id));
  }, [navigate]);

  // LD1: Handle edit action for a metric
  const handleMetricEdit = useCallback((metric: MetricWithValues) => {
    navigate(ROUTES.METRICS.DETAIL.replace(':id', metric.id));
  }, [navigate]);

  // LD1: Handle export action for a metric
  const handleMetricExport = useCallback((metric: MetricWithValues) => {
    alert(`Exporting metric ${metric.name}`);
  }, []);

  // LD1: Group metrics by category when category view is selected
  const groupedMetrics = useMemo(() => {
    if (viewType === 'category') {
      return groupMetricsByCategory(metrics.data || []);
    }
    return null;
  }, [metrics.data, viewType]);

  // LD1: Function to group metrics by category
  function groupMetricsByCategory(metrics: MetricWithValues[]): Record<string, MetricWithValues[]> {
    const grouped: Record<string, MetricWithValues[]> = {};
    metrics.forEach(metric => {
      const category = metric.team?.name || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(metric);
    });
    return grouped;
  }

  // LD1: Define options for time range selection
  const timeRangeOptions = useMemo(() => [
    { label: 'Last 30 Days', value: 'month' },
    { label: 'Last Quarter', value: 'quarter' },
    { label: 'Last Year', value: 'year' },
  ], []);

  // LD1: Define options for comparison type selection
  const comparisonTypeOptions = useMemo(() => [
    { label: 'Year over Year', value: 'yoy' },
    { label: 'Month to Month', value: 'mom' },
  ], []);

  // LD1: Define options for view type selection
  const viewTypeOptions = useMemo(() => [
    { label: 'Grid View', value: 'grid' },
    { label: 'Category View', value: 'category' },
  ], []);

  // LD1: Render the dashboard layout with appropriate breadcrumbs
  return (
    <DashboardLayout>
      <PageContainer>
        <Header>
          <Title>Metrics Dashboard</Title>
          <Button label="Add Metric" icon="pi pi-plus" onClick={handleAddMetric} />
        </Header>

        <FiltersContainer>
          <MetricFilters filters={filters} onFilterChange={handleFilterChange} />
        </FiltersContainer>

        <ViewOptionsContainer>
          <DropdownContainer>
            <Dropdown
              options={timeRangeOptions}
              value={timeRange}
              onChange={handleTimeRangeChange}
              placeholder="Select Time Range"
            />
          </DropdownContainer>
          <DropdownContainer>
            <Dropdown
              options={comparisonTypeOptions}
              value={comparisonType}
              onChange={handleComparisonTypeChange}
              placeholder="Select Comparison"
            />
          </DropdownContainer>
          <DropdownContainer>
            <Dropdown
              options={viewTypeOptions}
              value={viewType}
              onChange={handleViewTypeChange}
              placeholder="Select View"
            />
          </DropdownContainer>
        </ViewOptionsContainer>

        {isLoading ? (
          <LoadingContainer>
            <Spinner size="large" />
          </LoadingContainer>
        ) : !metrics.data || metrics.data.length === 0 ? (
          <EmptyState>
            <EmptyStateText>No metrics available. Please add some metrics to get started.</EmptyStateText>
          </EmptyState>
        ) : viewType === 'grid' ? (
          <MetricsGrid>
            {metrics.data.map(metric => (
              <MetricCard
                key={metric.id}
                metric={metric}
                onCardClick={handleMetricClick}
                onEditClick={handleMetricEdit}
                onExportClick={handleMetricExport}
              />
            ))}
          </MetricsGrid>
        ) : (
          <>
            {groupedMetrics && Object.entries(groupedMetrics).map(([category, metrics]) => (
              <CategorySection key={category}>
                <CategoryTitle>{category}</CategoryTitle>
                <MetricsGrid>
                  {metrics.map(metric => (
                    <MetricCard
                      key={metric.id}
                      metric={metric}
                      onCardClick={handleMetricClick}
                      onEditClick={handleMetricEdit}
                      onExportClick={handleMetricExport}
                    />
                  ))}
                </MetricsGrid>
              </CategorySection>
            ))}
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
};

export default MetricsDashboardPage;