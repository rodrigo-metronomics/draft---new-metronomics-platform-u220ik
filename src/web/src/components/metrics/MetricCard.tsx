import React, { useMemo } from 'react';
import styled from 'styled-components';

import Card from '../common/Card';
import MetricChart from './MetricChart';
import { MetricWithValues, MetricType, TrendDirection } from '../../types/metric.types';
import { ChartType, ColorScheme, TimeRange } from '../../types/common.types';
import { formatMetricValue, formatDeltaValue } from '../../utils/helpers/formatHelper';
import { colors, metricColors } from '../../styles/colors';
import useResponsive from '../../hooks/useResponsive';

/**
 * Props interface for the MetricCard component
 */
export interface MetricCardProps {
  /** The metric data to display */
  metric: MetricWithValues;
  /** Whether to show the chart visualization */
  showChart?: boolean;
  /** The type of chart to display */
  chartType?: ChartType;
  /** The time range for the chart data */
  timeRange?: TimeRange;
  /** Whether to show threshold indicators on the chart */
  showThresholds?: boolean;
  /** Whether to show the trend indicator */
  showTrend?: boolean;
  /** Color scheme for the chart and indicators */
  colorScheme?: ColorScheme;
  /** Whether higher values are better for this metric (affects trend color) */
  higherIsBetter?: boolean;
  /** Click handler for the entire card */
  onCardClick?: (metric: MetricWithValues) => void;
  /** Click handler for the details button */
  onDetailsClick?: (metric: MetricWithValues) => void;
  /** Click handler for the edit button */
  onEditClick?: (metric: MetricWithValues) => void;
  /** Click handler for the export button */
  onExportClick?: (metric: MetricWithValues) => void;
  /** Additional CSS class name */
  className?: string;
}

// Styled components
const MetricValueContainer = styled.div`
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const TrendContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const TrendIndicator = styled.span<{ color: string }>`
  color: ${props => props.color};
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
`;

const TrendValue = styled.span<{ color: string }>`
  color: ${props => props.color};
  font-weight: 500;
`;

const ChartContainer = styled.div`
  margin-top: 1rem;
`;

const ContentContainer = styled.div`
  padding: 0.5rem 0;
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  padding: 4px 8px;
  margin-left: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: ${colors.primary[600]};
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${colors.primary[50]};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${colors.primary[100]};
  }
`;

/**
 * Determines the appropriate color for a trend indicator based on direction and whether higher values are better
 * 
 * @param trend The trend direction (UP, DOWN, FLAT)
 * @param higherIsBetter Whether higher values are better for this metric
 * @returns CSS color value
 */
const getTrendColor = (trend: TrendDirection, higherIsBetter: boolean): string => {
  if (trend === TrendDirection.UP) {
    return higherIsBetter ? metricColors.positive : metricColors.negative;
  } else if (trend === TrendDirection.DOWN) {
    return higherIsBetter ? metricColors.negative : metricColors.positive;
  }
  return metricColors.neutral;
};

/**
 * A specialized card component for displaying metric data with current value, trend indicators, and optional chart visualization.
 * This component is used in the metrics dashboard to present key performance indicators in a consistent, visually appealing format.
 */
const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  showChart = true,
  chartType = ChartType.LINE,
  timeRange = 'month',
  showThresholds = true,
  showTrend = true,
  colorScheme = ColorScheme.PRIMARY,
  higherIsBetter = true,
  onCardClick,
  onDetailsClick,
  onEditClick,
  onExportClick,
  className
}) => {
  const { isMobileView } = useResponsive();
  
  // Determine the color for the trend indicator based on direction and whether higher is better
  const trendColor = useMemo(() => 
    getTrendColor(metric.trend, higherIsBetter),
  [metric.trend, higherIsBetter]);
  
  // Format the current value with appropriate units
  const formattedValue = useMemo(() => 
    formatMetricValue(metric.currentValue, metric.type, metric.unit),
  [metric.currentValue, metric.type, metric.unit]);
  
  // Format the change percentage with appropriate sign
  const formattedChange = useMemo(() => 
    formatDeltaValue(metric.changePercentage, 'percentage'),
  [metric.changePercentage]);
  
  // Determine chart height based on view size
  const chartHeight = useMemo(() => {
    if (!showChart) return 0;
    return isMobileView ? 150 : 200;
  }, [showChart, isMobileView]);
  
  // Prepare card actions with buttons for details, edit, and export
  const cardActions = useMemo(() => {
    const actions = [];
    
    if (onDetailsClick) {
      actions.push(
        <ActionButton key="details" onClick={handleDetailsClick}>
          Details
        </ActionButton>
      );
    }
    
    if (onEditClick) {
      actions.push(
        <ActionButton key="edit" onClick={handleEditClick}>
          Edit
        </ActionButton>
      );
    }
    
    if (onExportClick) {
      actions.push(
        <ActionButton key="export" onClick={handleExportClick}>
          Export
        </ActionButton>
      );
    }
    
    return actions.length > 0 ? actions : undefined;
  }, [onDetailsClick, onEditClick, onExportClick]);
  
  /**
   * Handles click events on the metric card
   * @param event React mouse event
   */
  function handleCardClick(event: React.MouseEvent) {
    if (onCardClick) {
      onCardClick(metric);
    }
  }
  
  /**
   * Handles click events on the details button
   * @param event React mouse event
   */
  function handleDetailsClick(event: React.MouseEvent) {
    event.stopPropagation(); // Prevent card click
    if (onDetailsClick) {
      onDetailsClick(metric);
    }
  }
  
  /**
   * Handles click events on the edit button
   * @param event React mouse event
   */
  function handleEditClick(event: React.MouseEvent) {
    event.stopPropagation(); // Prevent card click
    if (onEditClick) {
      onEditClick(metric);
    }
  }
  
  /**
   * Handles click events on the export button
   * @param event React mouse event
   */
  function handleExportClick(event: React.MouseEvent) {
    event.stopPropagation(); // Prevent card click
    if (onExportClick) {
      onExportClick(metric);
    }
  }
  
  return (
    <Card 
      title={metric.name}
      actions={cardActions}
      interactive={!!onCardClick}
      onClick={handleCardClick}
      className={className}
    >
      <ContentContainer>
        {/* Metric current value */}
        <MetricValueContainer>
          {formattedValue || 'N/A'}
        </MetricValueContainer>
        
        {/* Trend indicator with directional arrow and percentage change */}
        {showTrend && metric.trend !== null && (
          <TrendContainer>
            <TrendIndicator color={trendColor}>
              {metric.trend === TrendDirection.UP && '↑'}
              {metric.trend === TrendDirection.DOWN && '↓'}
              {metric.trend === TrendDirection.FLAT && '→'}
            </TrendIndicator>
            <TrendValue color={trendColor}>
              {formattedChange || '0%'}
            </TrendValue>
          </TrendContainer>
        )}
        
        {/* Chart visualization */}
        {showChart && chartHeight > 0 && (
          <ChartContainer>
            <MetricChart
              metric={metric}
              chartType={chartType}
              timeRange={timeRange}
              dateRange={{ 
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
                endDate: new Date() 
              }}
              height={chartHeight}
              showThresholds={showThresholds}
              colorScheme={colorScheme}
            />
          </ChartContainer>
        )}
      </ContentContainer>
    </Card>
  );
};

export default MetricCard;