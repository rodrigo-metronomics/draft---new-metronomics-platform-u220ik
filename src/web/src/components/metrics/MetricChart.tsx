import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { ChartData, ChartOptions } from 'chart.js'; // v4.3.0

import Chart from '../common/Chart';
import { MetricWithValues, MetricThreshold, ThresholdType, TimeSeriesDataPoint } from '../../types/metric.types';
import { ChartType, ColorScheme, TimeRange, DateRange } from '../../types/common.types';
import { formatDate } from '../../utils/helpers/dateTimeHelper';
import { formatMetricValue } from '../../utils/helpers/formatHelper';
import { colors, metricColors } from '../../styles/colors';

export interface MetricChartProps {
  metric: MetricWithValues;
  chartType: ChartType;
  timeRange: TimeRange;
  dateRange: DateRange;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltips?: boolean;
  showThresholds?: boolean;
  colorScheme?: ColorScheme;
  customColors?: string[];
  onDataPointClick?: (value: number, label: string, index: number) => void;
  className?: string;
}

const formatChartLabel = (timestamp: string, timeRange: TimeRange): string => {
  const date = new Date(timestamp);
  if (!date || isNaN(date.getTime())) return '';

  switch (timeRange) {
    case 'day':
      return formatDate(date, 'h:mm a');
    case 'week':
      return formatDate(date, 'EEE');
    case 'month':
      return formatDate(date, 'd');
    case 'quarter':
      return formatDate(date, 'MMM d');
    case 'year':
      return formatDate(date, 'MMM');
    case 'custom':
      // Determine format based on date range span
      return formatDate(date, 'MMM d');
    default:
      return formatDate(date, 'MMM d');
  }
};

const prepareChartData = (
  values: TimeSeriesDataPoint[],
  metricName: string,
  metricType: string,
  metricUnit: string,
  chartType: ChartType,
  colorScheme: ColorScheme
): ChartData<any> => {
  // Sort values by timestamp to ensure chronological order
  const sortedValues = [...values].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Extract labels (timestamps) and data points
  const labels = sortedValues.map(dataPoint => dataPoint.timestamp);
  const dataPoints = sortedValues.map(dataPoint => dataPoint.value);

  // Determine appropriate colors based on colorScheme
  let chartColor = colors.primary[500]; // Default color
  
  switch (colorScheme) {
    case ColorScheme.PRIMARY:
      chartColor = colors.primary[500];
      break;
    case ColorScheme.SECONDARY:
      chartColor = colors.secondary[500];
      break;
    case ColorScheme.TERTIARY:
      chartColor = colors.success[500];
      break;
    default:
      // Use the first color from metricColors.chartColors as default
      chartColor = metricColors.chartColors[0];
  }

  // Create datasets array with appropriate configuration for the chart type
  const datasets = [{
    label: metricName,
    data: dataPoints,
    borderColor: chartType === ChartType.LINE ? chartColor : undefined,
    backgroundColor: chartType === ChartType.LINE 
      ? `${chartColor}20` // 20% opacity
      : chartType === ChartType.BAR
      ? `${chartColor}80` // 80% opacity
      : chartType === ChartType.PIE || chartType === ChartType.DOUGHNUT
      ? metricColors.chartColors.map(color => `${color}80`) // 80% opacity
      : chartColor,
    fill: chartType === ChartType.LINE ? 'start' : undefined,
    tension: chartType === ChartType.LINE ? 0.4 : undefined,
    borderWidth: chartType === ChartType.LINE ? 2 : 1,
    pointRadius: chartType === ChartType.LINE ? 3 : undefined,
    pointBackgroundColor: chartType === ChartType.LINE ? chartColor : undefined,
    pointBorderColor: chartType === ChartType.LINE ? '#fff' : undefined,
    pointHoverRadius: chartType === ChartType.LINE ? 5 : undefined,
    pointHoverBackgroundColor: chartType === ChartType.LINE ? chartColor : undefined,
    pointHoverBorderColor: chartType === ChartType.LINE ? '#fff' : undefined,
    pointHoverBorderWidth: chartType === ChartType.LINE ? 2 : undefined,
    hoverBackgroundColor: chartType === ChartType.BAR ? `${chartColor}A0` : undefined,
  }];

  return {
    labels,
    datasets
  };
};

const getChartOptions = (
  metricType: string,
  metricUnit: string,
  chartType: ChartType,
  showLegend: boolean,
  showGrid: boolean,
  showTooltips: boolean,
  thresholds: MetricThreshold[],
  showThresholds: boolean
): ChartOptions<any> => {
  // Create base options with responsive settings
  const options: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: showTooltips,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 12
        },
        padding: 10,
        cornerRadius: 4,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatMetricValue(context.parsed.y, metricType, metricUnit);
            }
            return label;
          }
        }
      }
    },
    scales: chartType === ChartType.LINE || chartType === ChartType.BAR ? {
      x: {
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          display: showGrid,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            return formatMetricValue(value, metricType, metricUnit);
          }
        },
        beginAtZero: true
      }
    } : undefined,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  // Add threshold annotations if showThresholds is true
  if (showThresholds && thresholds && thresholds.length > 0) {
    options.plugins = options.plugins || {};
    options.plugins.annotation = {
      annotations: {}
    };

    thresholds.forEach((threshold, index) => {
      if (options.plugins?.annotation?.annotations) {
        options.plugins.annotation.annotations[`threshold-${index}`] = {
          type: 'line',
          yMin: threshold.value,
          yMax: threshold.value,
          borderColor: threshold.color,
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            display: true,
            content: `${threshold.type.charAt(0).toUpperCase() + threshold.type.slice(1)}: ${formatMetricValue(threshold.value, metricType, metricUnit)}`,
            position: 'end',
            backgroundColor: threshold.color,
            font: {
              size: 10,
              weight: 'bold'
            },
            padding: 6
          }
        };
      }
    });
  }

  return options;
};

const handleDataPointClick = (
  value: number, 
  label: string, 
  index: number,
  callback?: (value: number, label: string, index: number) => void
) => {
  if (callback) {
    callback(value, label, index);
  }
};

const MetricChart: React.FC<MetricChartProps> = ({
  metric,
  chartType,
  timeRange,
  dateRange,
  height = 300,
  showLegend = true,
  showGrid = true,
  showTooltips = true,
  showThresholds = true,
  colorScheme = ColorScheme.PRIMARY,
  customColors,
  onDataPointClick,
  className
}) => {
  // Prepare chart data with formatted labels
  const chartData = useMemo(() => {
    const data = prepareChartData(
      metric.values,
      metric.name,
      metric.type,
      metric.unit,
      chartType,
      colorScheme
    );
    
    // Format labels based on time range
    if (data.labels) {
      data.labels = data.labels.map(label => 
        typeof label === 'string' ? formatChartLabel(label, timeRange) : label
      );
    }
    
    return data;
  }, [metric, chartType, colorScheme, timeRange]);

  // Configure chart options
  const chartOptions = useMemo(() => {
    return getChartOptions(
      metric.type,
      metric.unit,
      chartType,
      showLegend,
      showGrid,
      showTooltips,
      metric.thresholds,
      showThresholds
    );
  }, [
    metric.type,
    metric.unit,
    metric.thresholds,
    chartType,
    showLegend,
    showGrid,
    showTooltips,
    showThresholds
  ]);

  return (
    <Chart
      type={chartType}
      data={chartData}
      options={chartOptions}
      width="100%"
      height={height}
      showLegend={showLegend}
      showGrid={showGrid}
      showTooltips={showTooltips}
      showThresholds={showThresholds}
      thresholds={metric.thresholds}
      colorScheme={colorScheme}
      customColors={customColors}
      onDataPointClick={(value, label, index) => handleDataPointClick(value, label, index, onDataPointClick)}
      className={className}
    />
  );
};

export default MetricChart;