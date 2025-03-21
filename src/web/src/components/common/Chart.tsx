import React, { useRef, useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { Chart as ChartJS, ChartData, ChartOptions, registerables } from 'chart.js'; // v4.3.0
import annotationPlugin from 'chartjs-plugin-annotation'; // v2.2.1

import { ChartType, ColorScheme } from '../../types/common.types';
import { ThresholdType } from '../../types/metric.types';
import { colors } from '../../styles/colors';

// Register Chart.js components and annotation plugin
ChartJS.register(...registerables, annotationPlugin);

/**
 * Props interface for the Chart component
 */
export interface ChartProps {
  /** Chart type (line, bar, pie, etc.) */
  type: ChartType;
  /** Data to display in the chart */
  data: ChartData<any>;
  /** Custom Chart.js options to override defaults */
  options?: Partial<ChartOptions<any>>;
  /** Width of the chart container (pixels or CSS value) */
  width?: string | number;
  /** Height of the chart container (pixels or CSS value) */
  height?: string | number;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Whether to show grid lines */
  showGrid?: boolean;
  /** Whether to show tooltips on hover */
  showTooltips?: boolean;
  /** Whether to display threshold lines */
  showThresholds?: boolean;
  /** Array of thresholds with type and value */
  thresholds?: Array<{ type: ThresholdType; value: number }>;
  /** Color scheme to use for the chart */
  colorScheme?: ColorScheme;
  /** Custom colors to use (required if colorScheme is CUSTOM) */
  customColors?: string[];
  /** Whether the chart should be responsive */
  responsive?: boolean;
  /** Callback when a data point is clicked */
  onDataPointClick?: (value: number, label: string, index: number) => void;
  /** Additional CSS class for styling */
  className?: string;
}

/**
 * Styled container for the chart
 */
const ChartContainer = styled.div<{ width: string | number; height: string | number }>`
  width: ${props => typeof props.width === 'number' ? `${props.width}px` : props.width};
  height: ${props => typeof props.height === 'number' ? `${props.height}px` : props.height};
  position: relative;
`;

/**
 * Generates default chart options based on chart type and configuration
 */
const getDefaultOptions = (
  type: ChartType,
  showLegend: boolean,
  showGrid: boolean,
  showTooltips: boolean,
  responsive: boolean
): ChartOptions<any> => {
  const options: ChartOptions<any> = {
    responsive,
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
        cornerRadius: 4
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  // Add scales based on chart type
  if (type === ChartType.LINE || type === ChartType.BAR) {
    options.scales = {
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
          precision: 0
        },
        beginAtZero: true
      }
    };
  }

  return options;
};

/**
 * Returns an array of colors based on the specified color scheme
 */
const getColorsByScheme = (
  colorScheme: ColorScheme,
  customColors?: string[]
): string[] => {
  if (colorScheme === ColorScheme.CUSTOM && customColors && customColors.length > 0) {
    return customColors;
  }

  switch (colorScheme) {
    case ColorScheme.PRIMARY:
      return [
        colors.primary[500],
        colors.primary[700],
        colors.primary[300],
        colors.primary[900],
        colors.primary[100]
      ];
    case ColorScheme.SECONDARY:
      return [
        colors.secondary[500],
        colors.secondary[700],
        colors.secondary[300],
        colors.secondary[900],
        colors.secondary[100]
      ];
    case ColorScheme.TERTIARY:
      return [
        colors.success[500],
        colors.warning[500],
        colors.error[500],
        colors.info[500],
        colors.neutral[500]
      ];
    default:
      // Default to the chartColors from metricColors if available, or fallback to a standard set
      return [
        colors.primary[500],
        colors.secondary[500],
        colors.success[500],
        colors.warning[500],
        colors.error[500],
        colors.info[600],
        colors.primary[700],
        colors.secondary[700],
        colors.success[700],
        colors.warning[700]
      ];
  }
};

/**
 * Returns the appropriate color for a threshold based on its type
 */
const getThresholdColor = (thresholdType: ThresholdType): string => {
  switch (thresholdType) {
    case ThresholdType.TARGET:
      return colors.success[500];
    case ThresholdType.WARNING:
      return colors.warning[500];
    case ThresholdType.CRITICAL:
      return colors.error[500];
    default:
      return colors.neutral[500];
  }
};

/**
 * Creates annotation configurations for threshold lines
 */
const createThresholdAnnotations = (
  thresholds: Array<{ type: ThresholdType; value: number }>
): Record<string, any> => {
  const annotations: Record<string, any> = {};

  thresholds.forEach((threshold, index) => {
    const color = getThresholdColor(threshold.type);
    annotations[`threshold-${index}`] = {
      type: 'line',
      yMin: threshold.value,
      yMax: threshold.value,
      borderColor: color,
      borderWidth: 2,
      borderDash: [5, 5],
      label: {
        display: true,
        content: `${threshold.type.charAt(0).toUpperCase() + threshold.type.slice(1)}: ${threshold.value}`,
        position: 'end',
        backgroundColor: color,
        font: {
          size: 10,
          weight: 'bold'
        },
        padding: 6
      }
    };
  });

  return annotations;
};

/**
 * A reusable chart component that wraps Chart.js to provide consistent visualization capabilities
 * throughout the Metronomics Platform. Supports various chart types, customizable styling, 
 * thresholds, and interactive features.
 */
const Chart: React.FC<ChartProps> = ({
  type,
  data,
  options = {},
  width = '100%',
  height = 300,
  showLegend = true,
  showGrid = true,
  showTooltips = true,
  showThresholds = false,
  thresholds = [],
  colorScheme = ColorScheme.PRIMARY,
  customColors,
  responsive = true,
  onDataPointClick,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Apply color scheme to the chart data
  const chartData = useMemo(() => {
    const colors = getColorsByScheme(colorScheme, customColors);
    const dataWithColors = { ...data };

    if (dataWithColors.datasets) {
      dataWithColors.datasets = dataWithColors.datasets.map((dataset, index) => {
        // For line chart, only set borderColor by default
        if (type === ChartType.LINE) {
          return {
            ...dataset,
            borderColor: dataset.borderColor || colors[index % colors.length],
            backgroundColor: dataset.backgroundColor || 'rgba(255, 255, 255, 0.5)'
          };
        }
        
        // For pie/doughnut charts, set an array of background colors
        if (type === ChartType.PIE || type === ChartType.DOUGHNUT) {
          return {
            ...dataset,
            backgroundColor: dataset.backgroundColor || colors
          };
        }
        
        // For other chart types, set both backgroundColor and borderColor
        return {
          ...dataset,
          backgroundColor: dataset.backgroundColor || colors[index % colors.length],
          borderColor: dataset.borderColor || colors[index % colors.length]
        };
      });
    }

    return dataWithColors;
  }, [data, colorScheme, customColors, type]);

  // Generate default options and merge with custom options
  const chartOptions = useMemo(() => {
    const defaultOptions = getDefaultOptions(
      type,
      showLegend,
      showGrid,
      showTooltips,
      responsive
    );

    // Add threshold annotations if enabled
    if (showThresholds && thresholds && thresholds.length > 0) {
      defaultOptions.plugins = defaultOptions.plugins || {};
      defaultOptions.plugins.annotation = {
        annotations: createThresholdAnnotations(thresholds)
      };
    }

    // Merge default options with custom options
    return { ...defaultOptions, ...options };
  }, [
    type,
    showLegend,
    showGrid,
    showTooltips,
    responsive,
    showThresholds,
    thresholds,
    options
  ]);

  // Initialize the chart
  useEffect(() => {
    if (canvasRef.current && !chartRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        chartRef.current = new ChartJS(ctx, {
          type,
          data: chartData,
          options: chartOptions
        });
        setInitialized(true);
      }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  // Update the chart when data or options change
  useEffect(() => {
    if (chartRef.current && initialized) {
      chartRef.current.data = chartData;
      chartRef.current.options = chartOptions;
      chartRef.current.update();
    }
  }, [chartData, chartOptions, initialized]);

  // Handle click events
  useEffect(() => {
    if (!canvasRef.current || !onDataPointClick) return;

    const handleClick = (event: MouseEvent) => {
      if (!chartRef.current) return;

      const elements = chartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );

      if (elements && elements.length > 0) {
        const { datasetIndex, index } = elements[0];
        const dataset = chartRef.current.data.datasets[datasetIndex];
        const value = dataset.data[index] as number;
        const label = chartRef.current.data.labels?.[index]?.toString() || '';
        
        onDataPointClick(value, label, index);
      }
    };

    canvasRef.current.addEventListener('click', handleClick);

    return () => {
      canvasRef.current?.removeEventListener('click', handleClick);
    };
  }, [onDataPointClick, initialized]);

  return (
    <ChartContainer width={width} height={height} className={className}>
      <canvas ref={canvasRef} />
    </ChartContainer>
  );
};

export default Chart;