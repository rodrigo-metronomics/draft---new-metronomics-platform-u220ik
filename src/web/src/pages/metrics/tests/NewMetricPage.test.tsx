import React from 'react'; // React library for component testing // v18.2.0
import { render, screen, waitFor, fireEvent } from '@testing-library/react'; // Testing library utilities for rendering and interacting with components // v14.0.0
import userEvent from '@testing-library/user-event'; // Simulating user interactions in tests // v14.0.0
import { vi } from 'vitest'; // Mocking and test utilities // v0.34.0
import axios from 'axios'; // HTTP client for mocking API requests // v1.4.0
import MockAdapter from 'axios-mock-adapter'; // Mock adapter for axios to simulate API responses // v1.21.4

import NewMetricPage from '../NewMetricPage'; // Component under test
import { renderWithProviders, renderWithRouter, waitForLoadingToFinish } from '../../../tests/testUtils'; // Testing utilities for rendering components with providers and router
import { setupMetricMocks, mockMetric } from '../../../tests/mocks/apiMocks'; // Mock API responses for metric operations
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation testing
import { METRIC_TYPES, COMPARISON_TYPES, CALCULATION_METHODS, METRIC_UNITS } from '../../utils/constants/metricTypes'; // Constants for metric form options
import { CreateMetricDto, CreateMetricThresholdDto } from '../../types/metric.types'; // Type definitions for metric creation

// Describe the test suite for the NewMetricPage component
describe('NewMetricPage', () => {
  // Create a mock adapter for axios
  let mockAxios: MockAdapter;

  // Mock the useNavigate hook
  const mockNavigate = vi.fn();
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
    };
  });

  // Before each test, set up the mock adapter and metric API mocks
  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    setupMetricMocks(mockAxios);
    mockNavigate.mockClear();
  });

  // After each test, reset all mocks and restore the mock adapter
  afterEach(() => {
    vi.restoreAllMocks();
    mockAxios.restore();
  });

  // Test that the new metric form renders correctly
  it('renders the new metric form', async () => {
    // Render the NewMetricPage component with necessary providers
    renderWithProviders(<NewMetricPage />);

    // Wait for the component to finish loading
    await waitForLoadingToFinish();

    // Verify that the page title is displayed
    expect(screen.getByText('New Metric')).toBeInTheDocument();

    // Verify that the form fields are rendered (name, description, type, unit, etc.)
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Comparison Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Calculation Method')).toBeInTheDocument();

    // Verify that the submit button is present
    expect(screen.getByText('Create Metric')).toBeInTheDocument();
  });

  // Test that form validation works for required fields
  it('validates required fields', async () => {
    // Render the NewMetricPage component with necessary providers
    renderWithProviders(<NewMetricPage />);

    // Wait for the component to finish loading
    await waitForLoadingToFinish();

    // Click the submit button without filling any fields
    fireEvent.click(screen.getByText('Create Metric'));

    // Verify that validation error messages are displayed for required fields
    await waitFor(() => {
      expect(screen.getByText('The field \'Name\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Type\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Unit\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Comparison Type\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Calculation Method\' is required.')).toBeInTheDocument();
    });

    // Fill in some fields but leave others empty
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Metric' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });

    // Click the submit button again
    fireEvent.click(screen.getByText('Create Metric'));

    // Verify that validation errors are only shown for the remaining empty required fields
    await waitFor(() => {
      expect(screen.queryByText('The field \'Name\' is required.')).not.toBeInTheDocument();
      expect(screen.queryByText('The field \'Description\' is required.')).not.toBeInTheDocument();
      expect(screen.getByText('The field \'Type\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Unit\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Comparison Type\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Calculation Method\' is required.')).toBeInTheDocument();
    });
  });

  // Test that the formula field appears when the calculation method is set to FORMULA
  it('shows formula field when calculation method is FORMULA', async () => {
    // Render the NewMetricPage component with necessary providers
    renderWithProviders(<NewMetricPage />);

    // Wait for the component to finish loading
    await waitForLoadingToFinish();

    // Verify that the formula field is not initially visible
    expect(screen.queryByLabelText('Formula')).not.toBeInTheDocument();

    // Select 'Formula' as the calculation method
    fireEvent.click(screen.getByLabelText('Calculation Method'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('FORMULA'));
    });

    // Verify that the formula field appears
    expect(screen.getByLabelText('Formula')).toBeInTheDocument();

    // Select a different calculation method
    fireEvent.click(screen.getByLabelText('Calculation Method'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('MANUAL'));
    });

    // Verify that the formula field disappears
    expect(screen.queryByLabelText('Formula')).not.toBeInTheDocument();
  });

  // Test that available units update based on the selected metric type
  it('updates available units when metric type changes', async () => {
    // Render the NewMetricPage component with necessary providers
    renderWithProviders(<NewMetricPage />);

    // Wait for the component to finish loading
    await waitForLoadingToFinish();

    // Select 'Financial' as the metric type
    fireEvent.click(screen.getByLabelText('Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('CURRENCY'));
    });

    // Verify that currency units are available in the unit dropdown
    fireEvent.click(screen.getByLabelText('Unit'));
    await waitFor(() => {
      expect(screen.getByText('USD')).toBeInTheDocument();
      expect(screen.getByText('EUR')).toBeInTheDocument();
      expect(screen.getByText('GBP')).toBeInTheDocument();
    });

    // Select 'Percentage' as the metric type
    fireEvent.click(screen.getByLabelText('Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('PERCENTAGE'));
    });

    // Verify that percentage units are available in the unit dropdown
    fireEvent.click(screen.getByLabelText('Unit'));
    await waitFor(() => {
      expect(screen.getByText('%')).toBeInTheDocument();
    });

    // Select 'Count' as the metric type
    fireEvent.click(screen.getByLabelText('Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('NUMBER'));
    });

    // Verify that count units are available in the unit dropdown
    fireEvent.click(screen.getByLabelText('Unit'));
    await waitFor(() => {
      expect(screen.getByText('count')).toBeInTheDocument();
    });
  });

  // Test that users can add and remove metric thresholds
  it('allows adding and removing thresholds', async () => {
    // Render the NewMetricPage component with necessary providers
    renderWithProviders(<NewMetricPage />);

    // Wait for the component to finish loading
    await waitForLoadingToFinish();

    // Click the 'Add Threshold' button
    fireEvent.click(screen.getByText('Add Threshold'));

    // Verify that a threshold form appears
    await waitFor(() => {
      expect(screen.getByLabelText('Value')).toBeInTheDocument();
      expect(screen.getByLabelText('Color')).toBeInTheDocument();
    });

    // Fill in the threshold values
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '75' } });

    // Click the 'Add Threshold' button again
    fireEvent.click(screen.getByText('Add Threshold'));

    // Verify that a second threshold form appears
    await waitFor(() => {
      expect(screen.getAllByLabelText('Value')).toHaveLength(2);
      expect(screen.getAllByLabelText('Color')).toHaveLength(2);
    });

    // Click the remove button on the first threshold
    const removeButtons = screen.getAllByLabelText('Remove');
    fireEvent.click(removeButtons[0]);

    // Verify that the first threshold is removed but the second remains
    await waitFor(() => {
      expect(screen.getAllByLabelText('Value')).toHaveLength(1);
      expect(screen.getAllByLabelText('Color')).toHaveLength(1);
    });
  });

  // Test that the form submission creates a new metric
  it('submits the form and creates a new metric', async () => {
    // Mock the createMetric API endpoint
    mockAxios.onPost('/metrics').reply(201, mockSuccessResponse(mockMetric));

    // Render the NewMetricPage component with necessary providers
    renderWithProviders(<NewMetricPage />);

    // Wait for the component to finish loading
    await waitForLoadingToFinish();

    // Fill in all required form fields with valid data
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Metric' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });
    fireEvent.click(screen.getByLabelText('Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('NUMBER'));
    });
    fireEvent.click(screen.getByLabelText('Unit'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('count'));
    });
    fireEvent.click(screen.getByLabelText('Comparison Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('YTD'));
    });
    fireEvent.click(screen.getByLabelText('Calculation Method'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('MANUAL'));
    });

    // Add a threshold
    fireEvent.click(screen.getByText('Add Threshold'));
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Value'), { target: { value: '75' } });
    });

    // Click the submit button
    fireEvent.click(screen.getByText('Create Metric'));

    // Verify that the loading spinner appears during submission
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Verify that the API was called with the correct data
    await waitFor(() => {
      expect(mockAxios.history.post.length).toBe(1);
      expect(mockAxios.history.post[0].url).toBe('/metrics');
      expect(JSON.parse(mockAxios.history.post[0].data)).toEqual({
        name: 'Test Metric',
        description: 'Test Description',
        type: 'number',
        unit: 'count',
        comparisonType: 'ytd',
        calculationMethod: 'manual',
        formula: null,
        organizationId: 'test-org-id',
        teamId: null,
        thresholds: [
          {
            type: 'target',
            value: 75,
            color: '#4caf50'
          }
        ],
        goalIds: []
      });
    });

    // Verify that a success message is displayed
    await waitFor(() => {
      expect(screen.getByText('Metric created successfully')).toBeInTheDocument();
    });

    // Verify that navigation to the metrics dashboard occurs after successful submission
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.METRICS.DASHBOARD);
    });
  });

  // Test that API errors during form submission are handled properly
  it('handles API errors during submission', async () => {
    // Mock the createMetric API endpoint to return an error
    mockAxios.onPost('/metrics').reply(400, mockErrorResponse('Validation failed', [{ field: 'name', message: 'Name is required' }]));

    // Render the NewMetricPage component with necessary providers
    renderWithProviders(<NewMetricPage />);

    // Wait for the component to finish loading
    await waitForLoadingToFinish();

    // Fill in all required form fields with valid data
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Metric' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });
    fireEvent.click(screen.getByLabelText('Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('NUMBER'));
    });
    fireEvent.click(screen.getByLabelText('Unit'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('count'));
    });
    fireEvent.click(screen.getByLabelText('Comparison Type'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('YTD'));
    });
    fireEvent.click(screen.getByLabelText('Calculation Method'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('MANUAL'));
    });

    // Click the submit button
    fireEvent.click(screen.getByText('Create Metric'));

    // Verify that the loading spinner appears during submission
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Verify that an error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });

    // Verify that navigation does not occur
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // Test that clicking the cancel button navigates back to the metrics dashboard
  it('navigates back to metrics dashboard on cancel', async () => {
    // Render the NewMetricPage component with necessary providers
    renderWithProviders(<NewMetricPage />);

    // Wait for the component to finish loading
    await waitForLoadingToFinish();

    // Click the cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Verify that navigation to the metrics dashboard occurs
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.METRICS.DASHBOARD);
  });
});