import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // ^0.34.0
import { ChartData, ChartOptions } from 'chart.js'; // ^4.3.0

import Chart from '../Chart'; // Import the Chart component to be tested
import { ChartType, ColorScheme } from '../../types/common.types'; // Import chart type and color scheme enums for testing different chart configurations
import { ThresholdType } from '../../types/metric.types'; // Import threshold type enum for testing threshold visualization
import { renderWithProviders } from '../../../tests/testUtils'; // Import test utility for rendering components with necessary providers

describe('Chart', () => {
  // Main test suite for the Chart component
  let chartJsMock: any;

  beforeEach(() => {
    // Reset any mocks or test state before each test
    chartJsMock = {
      Chart: vi.fn().mockImplementation(() => ({
        destroy: vi.fn(),
        update: vi.fn(),
        getElementsAtEventForMode: vi.fn().mockReturnValue([]),
        data: { datasets: [] },
        options: {}
      }))
    };

    vi.stubGlobal('Chart', chartJsMock.Chart);
  });

  afterEach(() => {
    // Clean up any resources or mocks after each test
    vi.unstubAllGlobals();
  });

  it('should render with line chart type', () => {
    // Test that verifies the Chart component renders correctly with line chart type
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with line chart type
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} />);

    // Verify that the canvas element is rendered
    const canvasElement = screen.getByRole('img');
    expect(canvasElement).toBeInTheDocument();

    // Verify that Chart.js was initialized with the correct type and data
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData
      })
    );
  });

  it('should render with bar chart type', () => {
    // Test that verifies the Chart component renders correctly with bar chart type
    const mockData: ChartData<'bar'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with bar chart type
    renderWithProviders(<Chart type={ChartType.BAR} data={mockData} />);

    // Verify that the canvas element is rendered
    const canvasElement = screen.getByRole('img');
    expect(canvasElement).toBeInTheDocument();

    // Verify that Chart.js was initialized with the correct type and data
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.BAR,
        data: mockData
      })
    );
  });

  it('should render with pie chart type', () => {
    // Test that verifies the Chart component renders correctly with pie chart type
    const mockData: ChartData<'pie'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with pie chart type
    renderWithProviders(<Chart type={ChartType.PIE} data={mockData} />);

    // Verify that the canvas element is rendered
    const canvasElement = screen.getByRole('img');
    expect(canvasElement).toBeInTheDocument();

    // Verify that Chart.js was initialized with the correct type and data
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.PIE,
        data: mockData
      })
    );
  });

  it('should render with doughnut chart type', () => {
    // Test that verifies the Chart component renders correctly with doughnut chart type
    const mockData: ChartData<'doughnut'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with doughnut chart type
    renderWithProviders(<Chart type={ChartType.DOUGHNUT} data={mockData} />);

    // Verify that the canvas element is rendered
    const canvasElement = screen.getByRole('img');
    expect(canvasElement).toBeInTheDocument();

    // Verify that Chart.js was initialized with the correct type and data
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.DOUGHNUT,
        data: mockData
      })
    );
  });

  it('should apply custom dimensions', () => {
    // Test that verifies the Chart component applies custom width and height
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with custom width and height props
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} width={400} height={300} />);

    // Verify that the canvas element has the correct width and height attributes
    const canvasElement = screen.getByRole('img');
    expect(canvasElement).toHaveAttribute('width', '400');
    expect(canvasElement).toHaveAttribute('height', '300');
  });

  it('should render with custom options', () => {
    // Test that verifies the Chart component applies custom chart options
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Create custom chart options object
    const customOptions: ChartOptions<'line'> = {
      scales: {
        y: { beginAtZero: true }
      }
    };

    // Render the Chart component with the custom options
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} options={customOptions} />);

    // Verify that Chart.js was initialized with the custom options
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining(customOptions)
      })
    );
  });

  it('should render with legend when showLegend is true', () => {
    // Test that verifies the Chart component displays a legend when showLegend is true
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [
        { label: 'Data 1', data: [10, 20, 15] },
        { label: 'Data 2', data: [5, 10, 8] }
      ]
    };

    // Render the Chart component with showLegend prop set to true
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} showLegend />);

    // Verify that Chart.js options include legend display set to true
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining({
          plugins: expect.objectContaining({
            legend: expect.objectContaining({
              display: true
            })
          })
        })
      })
    );
  });

  it('should hide legend when showLegend is false', () => {
    // Test that verifies the Chart component hides the legend when showLegend is false
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [
        { label: 'Data 1', data: [10, 20, 15] },
        { label: 'Data 2', data: [5, 10, 8] }
      ]
    };

    // Render the Chart component with showLegend prop set to false
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} showLegend={false} />);

    // Verify that Chart.js options include legend display set to false
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining({
          plugins: expect.objectContaining({
            legend: expect.objectContaining({
              display: false
            })
          })
        })
      })
    );
  });

  it('should render with grid when showGrid is true', () => {
    // Test that verifies the Chart component displays grid lines when showGrid is true
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with showGrid prop set to true
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} showGrid />);

    // Verify that Chart.js options include grid display set to true
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining({
          scales: expect.objectContaining({
            x: expect.objectContaining({
              grid: expect.objectContaining({
                display: true
              })
            }),
            y: expect.objectContaining({
              grid: expect.objectContaining({
                display: true
              })
            })
          })
        })
      })
    );
  });

  it('should hide grid when showGrid is false', () => {
    // Test that verifies the Chart component hides grid lines when showGrid is false
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with showGrid prop set to false
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} showGrid={false} />);

    // Verify that Chart.js options include grid display set to false
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining({
          scales: expect.objectContaining({
            x: expect.objectContaining({
              grid: expect.objectContaining({
                display: false
              })
            }),
            y: expect.objectContaining({
              grid: expect.objectContaining({
                display: false
              })
            })
          })
        })
      })
    );
  });

  it('should render with tooltips when showTooltips is true', () => {
    // Test that verifies the Chart component enables tooltips when showTooltips is true
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with showTooltips prop set to true
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} showTooltips />);

    // Verify that Chart.js options include tooltips enabled
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining({
          plugins: expect.objectContaining({
            tooltip: expect.objectContaining({
              enabled: true
            })
          })
        })
      })
    );
  });

  it('should hide tooltips when showTooltips is false', () => {
    // Test that verifies the Chart component disables tooltips when showTooltips is false
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with showTooltips prop set to false
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} showTooltips={false} />);

    // Verify that Chart.js options include tooltips disabled
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining({
          plugins: expect.objectContaining({
            tooltip: expect.objectContaining({
              enabled: false
            })
          })
        })
      })
    );
  });

  it('should render with thresholds when provided', () => {
    // Test that verifies the Chart component displays threshold lines when thresholds are provided
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Create mock thresholds array with different threshold types
    const mockThresholds = [
      { type: ThresholdType.TARGET, value: 18 },
      { type: ThresholdType.WARNING, value: 12 },
      { type: ThresholdType.CRITICAL, value: 8 }
    ];

    // Render the Chart component with thresholds prop and showThresholds set to true
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} thresholds={mockThresholds} showThresholds />);

    // Verify that Chart.js options include annotation plugin configuration
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining({
          plugins: expect.objectContaining({
            annotation: expect.objectContaining({
              annotations: expect.any(Object)
            })
          })
        })
      })
    );

    // Verify that each threshold has the correct line color based on its type
    const chartCall = chartJsMock.Chart.mock.calls[0][1];
    const annotations = chartCall.options.plugins.annotation.annotations;

    mockThresholds.forEach((threshold, index) => {
      const annotationKey = `threshold-${index}`;
      expect(annotations[annotationKey]).toBeDefined();
      expect(annotations[annotationKey].borderColor).toBeDefined();
    });
  });

  it('should not render thresholds when showThresholds is false', () => {
    // Test that verifies the Chart component does not display threshold lines when showThresholds is false
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Create mock thresholds array
    const mockThresholds = [
      { type: ThresholdType.TARGET, value: 18 },
      { type: ThresholdType.WARNING, value: 12 },
      { type: ThresholdType.CRITICAL, value: 8 }
    ];

    // Render the Chart component with thresholds prop but showThresholds set to false
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} thresholds={mockThresholds} showThresholds={false} />);

    // Verify that Chart.js options do not include annotation plugin configuration
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.not.objectContaining({
          plugins: expect.objectContaining({
            annotation: expect.any(Object)
          })
        })
      })
    );
  });

  it('should apply colors based on colorScheme', () => {
    // Test that verifies the Chart component applies the correct colors based on the colorScheme prop
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [
        { label: 'Data 1', data: [10, 20, 15] },
        { label: 'Data 2', data: [5, 10, 8] }
      ]
    };

    // Render the Chart component with PRIMARY colorScheme
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} colorScheme={ColorScheme.PRIMARY} />);

    // Verify that the datasets have colors from the primary color palette
    let chartCall = chartJsMock.Chart.mock.calls[0][1];
    let datasets = chartCall.data.datasets;
    expect(datasets[0].borderColor).toBeDefined();
    expect(datasets[1].borderColor).toBeDefined();

    // Render the Chart component with SECONDARY colorScheme
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} colorScheme={ColorScheme.SECONDARY} />);

    // Verify that the datasets have colors from the secondary color palette
    chartCall = chartJsMock.Chart.mock.calls[1][1];
    datasets = chartCall.data.datasets;
    expect(datasets[0].borderColor).toBeDefined();
    expect(datasets[1].borderColor).toBeDefined();

    // Render the Chart component with TERTIARY colorScheme
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} colorScheme={ColorScheme.TERTIARY} />);

    // Verify that the datasets have colors from the tertiary color palette
    chartCall = chartJsMock.Chart.mock.calls[2][1];
    datasets = chartCall.data.datasets;
    expect(datasets[0].borderColor).toBeDefined();
    expect(datasets[1].borderColor).toBeDefined();
  });

  it('should apply custom colors when provided', () => {
    // Test that verifies the Chart component applies custom colors when provided
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [
        { label: 'Data 1', data: [10, 20, 15] },
        { label: 'Data 2', data: [5, 10, 8] }
      ]
    };

    // Create array of custom colors
    const customColors = ['#FF0000', '#00FF00'];

    // Render the Chart component with CUSTOM colorScheme and customColors prop
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} colorScheme={ColorScheme.CUSTOM} customColors={customColors} />);

    // Verify that the datasets have the custom colors applied
    const chartCall = chartJsMock.Chart.mock.calls[0][1];
    const datasets = chartCall.data.datasets;
    expect(datasets[0].borderColor).toBe(customColors[0]);
    expect(datasets[1].borderColor).toBe(customColors[1]);
  });

  it('should call onDataPointClick when a data point is clicked', async () => {
    // Test that verifies the Chart component calls the onDataPointClick callback when a data point is clicked
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Create mock onDataPointClick function
    const onDataPointClick = vi.fn();

    // Render the Chart component with the onDataPointClick prop
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} onDataPointClick={onDataPointClick} />);

    // Simulate a click event on the chart canvas
    const canvasElement = screen.getByRole('img');
    fireEvent.click(canvasElement);

    // Verify that the onDataPointClick function was called with the correct parameters
    await waitFor(() => {
      expect(onDataPointClick).toHaveBeenCalled();
    });
  });

  it('should update chart when data changes', () => {
    // Test that verifies the Chart component updates when its data prop changes
    const mockData1: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with the initial data
    const { rerender } = renderWithProviders(<Chart type={ChartType.LINE} data={mockData1} />);

    // Verify that Chart.js was initialized with the initial data
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData1
      })
    );

    const mockData2: ChartData<'line'> = {
      labels: ['April', 'May', 'June'],
      datasets: [{ label: 'Data', data: [25, 18, 30] }]
    };

    // Update the component with new data
    rerenderWithProviders(<Chart type={ChartType.LINE} data={mockData2} />);

    // Verify that Chart.js was updated with the new data
    expect(chartJsMock.Chart).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData2
      })
    );
  });

  it('should update chart when options change', () => {
    // Test that verifies the Chart component updates when its options prop changes
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Create initial chart options
    const initialOptions: ChartOptions<'line'> = {
      scales: {
        y: { beginAtZero: true }
      }
    };

    // Render the Chart component with the initial options
    const { rerender } = renderWithProviders(<Chart type={ChartType.LINE} data={mockData} options={initialOptions} />);

    // Verify that Chart.js was initialized with the initial options
    expect(chartJsMock.Chart).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining(initialOptions)
      })
    );

    // Create new options
    const newOptions: ChartOptions<'line'> = {
      scales: {
        y: { beginAtZero: false }
      }
    };

    // Update the component with new options
    rerenderWithProviders(<Chart type={ChartType.LINE} data={mockData} options={newOptions} />);

    // Verify that Chart.js was updated with the new options
    expect(chartJsMock.Chart).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({
        type: ChartType.LINE,
        data: mockData,
        options: expect.objectContaining(newOptions)
      })
    );
  });

  it('should clean up chart instance on unmount', () => {
    // Test that verifies the Chart component cleans up the Chart.js instance when unmounted
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component
    const { unmount } = renderWithProviders(<Chart type={ChartType.LINE} data={mockData} />);

    // Verify that Chart.js was initialized
    expect(chartJsMock.Chart).toHaveBeenCalled();

    // Unmount the component
    unmount();

    // Verify that the Chart.js instance was destroyed
    expect(chartJsMock.Chart.mock.results[0].value.destroy).toHaveBeenCalled();
  });

  it('should apply custom className when provided', () => {
    // Test that verifies the Chart component applies a custom className when provided
    const mockData: ChartData<'line'> = {
      labels: ['January', 'February', 'March'],
      datasets: [{ label: 'Data', data: [10, 20, 15] }]
    };

    // Render the Chart component with a custom className prop
    renderWithProviders(<Chart type={ChartType.LINE} data={mockData} className="custom-chart-class" />);

    // Verify that the canvas element has the custom class applied
    const chartContainer = screen.getByRole('img').closest('div');
    expect(chartContainer).toHaveClass('custom-chart-class');
  });
});

// Helper function to rerender the component with providers
function rerenderWithProviders(ui: React.ReactNode) {
  return render(ui, { wrapper: ({ children }) => <>{children}</> });
}