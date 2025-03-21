import React, { useState, useEffect, useCallback, useMemo } from 'react'; // version ^18.2.0
import { useParams } from 'react-router-dom'; // version ^6.8.0
import styled from 'styled-components'; // version ^5.3.10

import MetricFilters from '../../components/metrics/MetricFilters';
import Dropdown from '../../components/common/Dropdown';
import Spinner from '../../components/common/Spinner';
import useResponsive from '../../hooks/useResponsive';
import {
  MetricFilters,
  MetricWithValues,
  ComparisonType,
  ChartType,
  ColorScheme,
} from '../../types/metric.types';
import { DateRange, TimeRange } from '../../types/common.types';
import { COMPARISON_TYPES } from '../../utils/constants/metricTypes';
import { getDashboardData, exportMetrics } from '../../services/api/metricApi';

/**
 * Styled Components for layout and visual elements
 */
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

const Title = styled.div`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const OrganizationName = styled.div`
  font-size: 1rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 0.5rem;
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

const ExportContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;

  @media (max-width: 768px) {
    margin-left: 0;
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

const CategoryTitle = styled.div`
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

const EmptyStateText = styled.div`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 1.5rem;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
`;

const ErrorStateText = styled.div`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.error.main};
  margin-bottom: 1.5rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

/**
 * SharedDashboardPage Component
 *
 * Displays a shared metrics dashboard with read-only access.
 * Allows organizations to share specific metrics with external stakeholders without authentication.
 */
const SharedDashboardPage: React.FC = () => {
  // Extract shareId from URL parameters
  const { shareId } = useParams<{ shareId: string }>();

  // Initialize responsive design utilities
  const { isMobileView } = useResponsive();

  // State variables for filters, view options, dashboard data, and loading state
  const [filters, setFilters] = useState<MetricFilters>({
    organizationId: '',
    teamId: null,
    type: null,
    goalId: null,
    search: null,
    dateRange: null,
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('yoy');
  const [viewType, setViewType] = useState<'grid' | 'category'>('grid');
  const [dashboardData, setDashboardData] = useState<MetricWithValues[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized filter change handler
  const handleFilterChange = useCallback((newFilters: MetricFilters) => {
    setFilters(newFilters);
  }, []);

  // Memoized time range change handler
  const handleTimeRangeChange = useCallback((selectedOption: any) => {
    setTimeRange(selectedOption.value);
  }, []);

  // Memoized comparison type change handler
  const handleComparisonTypeChange = useCallback((selectedOption: any) => {
    setComparisonType(selectedOption.value);
  }, []);

  // Memoized view type change handler
  const handleViewTypeChange = useCallback((selectedOption: any) => {
    setViewType(selectedOption.value === 'category' ? 'category' : 'grid');
  }, []);

  // Memoized metric export handler
  const handleMetricExport = useCallback(async (format: string) => {
    try {
      const blob = await exportMetrics({
        format: format as 'csv' | 'xlsx' | 'pdf',
        includeValues: true,
        dateRange: filters.dateRange,
        filters: { ...filters, shareId: shareId },
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrics-export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting metrics:', err);
      setError('Failed to export metrics.');
    }
  }, [filters, shareId]);

  // Memoized function to group metrics by category
  const groupMetricsByCategory = useCallback((metrics: MetricWithValues[]) => {
    const groupedMetrics: Record<string, MetricWithValues[]> = {};
    metrics.forEach(metric => {
      const category = metric.team?.name || 'Uncategorized';
      if (!groupedMetrics[category]) {
        groupedMetrics[category] = [];
      }
      groupedMetrics[category].push(metric);
    });
    return groupedMetrics;
  }, []);

  // Memoized function to fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!shareId) {
        setError('Invalid share link.');
        return;
      }

      const response = await getDashboardData({ ...filters, shareId: shareId });
      if (response.success) {
        setDashboardData(response.data.metrics);
      } else {
        setError(response.message || 'Failed to fetch dashboard data.');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [filters, shareId]);

  // Fetch dashboard data on initial load and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Update dateRange in filters when timeRange changes
  useEffect(() => {
    setFilters(prevFilters => ({
      ...prevFilters,
      dateRange: null
    }));
  }, [timeRange]);

  // Group metrics by category if viewType is 'category'
  const groupedMetrics = useMemo(() => {
    if (viewType === 'category') {
      return groupMetricsByCategory(dashboardData);
    }
    return null;
  }, [dashboardData, viewType, groupMetricsByCategory]);

  // View options for time range, comparison type, and view type
  const timeRangeOptions = useMemo(() => [
    { label: 'Last Month', value: 'month' },
    { label: 'Last Quarter', value: 'quarter' },
    { label: 'Last Year', value: 'year' },
  ], []);

  const comparisonTypeOptions = useMemo(() => Object.values(COMPARISON_TYPES).map(type => ({
    label: type.toUpperCase(),
    value: type
  })), []);

  const viewTypeOptions = useMemo(() => [
    { label: 'Grid View', value: 'grid' },
    { label: 'Category View', value: 'category' },
  ], []);

  return (
    <PageContainer>
      <Header>
        <div>
          <OrganizationName>Shared Dashboard</OrganizationName>
          <Title>Metrics Overview</Title>
        </div>
        <ExportContainer>
          <DropdownContainer>
            <Dropdown
              id="export-format"
              placeholder="Select Format"
              options={[
                { label: 'CSV', value: 'csv' },
                { label: 'XLSX', value: 'xlsx' },
                { label: 'PDF', value: 'pdf' },
              ]}
              onChange={(e: any) => handleMetricExport(e.target.value)}
            />
          </DropdownContainer>
        </ExportContainer>
      </Header>

      <FiltersContainer>
        <MetricFilters filters={filters} onFilterChange={handleFilterChange} />
      </FiltersContainer>

      <ViewOptionsContainer>
        <DropdownContainer>
          <Dropdown
            id="time-range"
            placeholder="Select Time Range"
            options={timeRangeOptions}
            value={timeRange}
            onChange={handleTimeRangeChange}
          />
        </DropdownContainer>
        <DropdownContainer>
          <Dropdown
            id="comparison-type"
            placeholder="Select Comparison"
            options={comparisonTypeOptions}
            value={comparisonType}
            onChange={handleComparisonTypeChange}
          />
        </DropdownContainer>
        <DropdownContainer>
          <Dropdown
            id="view-type"
            placeholder="Select View"
            options={viewTypeOptions}
            value={viewType}
            onChange={handleViewTypeChange}
          />
        </DropdownContainer>
      </ViewOptionsContainer>

      {loading && (
        <LoadingContainer>
          <Spinner size="large" label="Loading dashboard data..." />
        </LoadingContainer>
      )}

      {error && (
        <ErrorState>
          <ErrorStateText>{error}</ErrorStateText>
        </ErrorState>
      )}

      {!loading && !error && dashboardData.length === 0 && (
        <EmptyState>
          <EmptyStateText>No metrics available for this dashboard.</EmptyStateText>
        </EmptyState>
      )}

      {!loading && !error && dashboardData.length > 0 && viewType === 'grid' && (
        <MetricsGrid>
          {dashboardData.map(metric => (
            <div key={metric.id}>
              {/* <MetricCard metric={metric} readOnly /> */}
              {metric.name}
            </div>
          ))}
        </MetricsGrid>
      )}

      {!loading && !error && dashboardData.length > 0 && viewType === 'category' && groupedMetrics && (
        Object.entries(groupedMetrics).map(([category, metrics]) => (
          <CategorySection key={category}>
            <CategoryTitle>{category}</CategoryTitle>
            <MetricsGrid>
              {metrics.map(metric => (
                <div key={metric.id}>
                  {/* <MetricCard metric={metric} readOnly /> */}
                  {metric.name}
                </div>
              ))}
            </MetricsGrid>
          </CategorySection>
        ))
      )}
    </PageContainer>
  );
};

export default SharedDashboardPage;