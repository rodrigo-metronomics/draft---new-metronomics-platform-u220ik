import React, { useState, useEffect, useMemo } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10

import Card from '../common/Card';
import MetricCard from '../metrics/MetricCard';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import { useMetrics } from '../../hooks/useMetrics';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import { MetricWithValues, ChartType, ColorScheme } from '../../types/metric.types';
import useResponsive from '../../hooks/useResponsive';
import { colors } from '../../styles/colors';

/**
 * Props interface for the KeyMetricsWidget component
 */
export interface KeyMetricsWidgetProps {
  /** Maximum number of metrics to display in the widget */
  maxMetrics?: number;
  /** Callback function to navigate to the full metrics list */
  onViewAllClick?: () => void;
  /** Callback function to navigate to the metric details page */
  onMetricDetailsClick?: (metricId: string) => void;
  /** Callback function to navigate to the metric edit page */
  onMetricEditClick?: (metricId: string) => void;
  /** Callback function to trigger metric data export */
  onMetricExportClick?: (metricId: string) => void;
  /** Optional CSS class name for styling */
  className?: string;
}

// Styled components for the widget layout and appearance
const WidgetContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  flex: 1;
  min-height: 250px;
  margin-top: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: ${colors.text.secondary};
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: ${colors.error.main};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

/**
 * A dashboard widget that displays key performance metrics
 */
export const KeyMetricsWidget: React.FC<KeyMetricsWidgetProps> = ({
  maxMetrics = 3,
  onViewAllClick,
  onMetricDetailsClick,
  onMetricEditClick,
  onMetricExportClick,
  className
}) => {
  // Access current organization from organization context
  const { currentOrganization } = useOrganizationContext();

  // Use useMetrics hook to fetch dashboard metrics data
  const { getDashboardMetrics, isLoading, isError, error } = useMetrics();

  // Use useState to track the currently selected metric for detailed view
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  // Use useResponsive hook to determine if the current viewport is mobile
  const { isMobileView } = useResponsive();

  // Fetch dashboard metrics data using the getDashboardMetrics query
  const { data: dashboardData } = getDashboardMetrics({
    organizationId: currentOrganization?.id || '',
    search: '',
    type: null,
    goalId: null,
  });

  // Memoize the limited list of metrics to display based on maxMetrics prop
  const limitedMetrics = useMemo(() => {
    if (!dashboardData?.metrics) return [];
    return dashboardData.metrics.slice(0, maxMetrics);
  }, [dashboardData?.metrics, maxMetrics]);

  // Memoize the selected metric for chart display
  const selectedMetric = useMemo(() => {
    if (selectedMetricId) {
      return dashboardData?.metrics.find(metric => metric.id === selectedMetricId) || null;
    } else if (!isMobileView && limitedMetrics.length > 0) {
      return limitedMetrics[0];
    }
    return null;
  }, [selectedMetricId, dashboardData?.metrics, limitedMetrics, isMobileView]);

  // Handle loading state by showing a skeleton loader
  if (isLoading) {
    return (
      <Card title="Key Metrics" className={className}>
        <LoadingContainer>
          <Spinner size="large" />
        </LoadingContainer>
      </Card>
    );
  }

  // Handle error state by showing an error message with retry button
  if (isError) {
    return (
      <Card title="Key Metrics" className={className}>
        <ErrorState>
          <p>Error fetching key metrics: {error?.message}</p>
          {/* <Button label="Retry" onClick={refetch} /> */}
        </ErrorState>
      </Card>
    );
  }

  // Handle empty state when no metrics are available
  if (!dashboardData?.metrics || dashboardData.metrics.length === 0) {
    return (
      <Card title="Key Metrics" className={className}>
        <EmptyState>
          <p>No key metrics available. Please add some metrics to your organization.</p>
        </EmptyState>
      </Card>
    );
  }

  // Render the KeyMetricsWidget component
  return (
    <Card
      title="Key Metrics"
      actions={onViewAllClick ? (
        <Button label="View All" onClick={onViewAllClick} />
      ) : undefined}
      className={className}
    >
      <WidgetContainer>
        <MetricsGrid>
          {limitedMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              showChart={false}
              onCardClick={() => setSelectedMetricId(metric.id)}
              onDetailsClick={onMetricDetailsClick ? () => onMetricDetailsClick(metric.id) : undefined}
              onEditClick={onMetricEditClick ? () => onMetricEditClick(metric.id) : undefined}
              onExportClick={onMetricExportClick ? () => onMetricExportClick(metric.id) : undefined}
            />
          ))}
        </MetricsGrid>
        {selectedMetric && (
          <ChartContainer>
            <MetricCard
              metric={selectedMetric}
              showChart
              chartType={ChartType.LINE}
              timeRange="month"
              showThresholds
              onDetailsClick={onMetricDetailsClick ? () => onMetricDetailsClick(selectedMetric.id) : undefined}
              onEditClick={onMetricEditClick ? () => onMetricEditClick(selectedMetric.id) : undefined}
              onExportClick={onMetricExportClick ? () => onMetricExportClick(selectedMetric.id) : undefined}
            />
          </ChartContainer>
        )}
      </WidgetContainer>
    </Card>
  );
};