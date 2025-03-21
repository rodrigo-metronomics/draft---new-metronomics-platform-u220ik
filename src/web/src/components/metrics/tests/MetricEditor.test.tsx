import React from 'react'; // version ^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import MockAdapter from 'axios-mock-adapter'; // version ^1.21.4
import axios from 'axios'; // version ^1.4.0

import MetricEditor from '../MetricEditor'; // Component being tested
import { renderWithProviders, waitForLoadingToFinish, createMockOrganization } from '../../../tests/testUtils'; // Testing utilities for rendering components with providers and waiting for loading states
import { mockMetric, setupMetricMocks } from '../../../tests/mocks/apiMocks'; // Mock data and API setup for metrics
import { MetricType, ComparisonType, CalculationMethod, CreateMetricDto } from '../../../types/metric.types'; // Type definitions for metric data and enums

// Test suite for the MetricEditor component
describe('MetricEditor', () => {
  let mockAdapter: MockAdapter;

  // Setup mock adapter for API requests
  beforeEach(() => {
    mockAdapter = new MockAdapter(axios);
    setupMetricMocks(mockAdapter);
  });

  // Cleanup mock adapter after each test
  afterEach(() => {
    mockAdapter.restore();
    vi.clearAllMocks();
  });

  // Test that the component renders correctly in create mode
  it('should render the component in create mode', async () => {
    // Render the MetricEditor component with no initialMetric (create mode)
    renderWithProviders(<MetricEditor initialMetric={null} onSave={() => {}} onCancel={() => {}} isLoading={false} />);

    // Verify that the component renders with the correct title and form fields
    expect(screen.getByText('Create Metric')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Comparison Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Calculation Method')).toBeInTheDocument();

    // Verify that the 'details' tab is active by default
    expect(screen.getByText('Details')).toHaveClass('p-highlight');

    // Verify that the 'values' tab is not available in create mode
    expect(screen.queryByText('Values')).toBeNull();
  });

  // Test that the component renders correctly in edit mode
  it('should render the component in edit mode', async () => {
    const initialMetric = mockMetric;

    // Render the MetricEditor component with an initialMetric (edit mode)
    renderWithProviders(<MetricEditor initialMetric={initialMetric} onSave={() => {}} onCancel={() => {}} isLoading={false} />);

    // Verify that the component renders with the correct title and form fields
    expect(screen.getByText('Edit Metric')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Comparison Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Calculation Method')).toBeInTheDocument();

    // Verify that the form fields are pre-populated with the initialMetric values
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(initialMetric.name);
    expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toBe(initialMetric.description);

    // Verify that all tabs (details, thresholds, values) are available in edit mode
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Thresholds')).toBeInTheDocument();
    expect(screen.getByText('Values')).toBeInTheDocument();
  });

  // Test that tab navigation works correctly
  it('should handle tab navigation', async () => {
    // Render the MetricEditor component
    renderWithProviders(<MetricEditor initialMetric={mockMetric} onSave={() => {}} onCancel={() => {}} isLoading={false} />);

    // Click on the 'thresholds' tab
    await userEvent.click(screen.getByText('Thresholds'));

    // Verify that the thresholds tab content is displayed
    expect(screen.getByText('Add Threshold')).toBeInTheDocument();

    // Click on the 'details' tab
    await userEvent.click(screen.getByText('Details'));

    // Verify that the details tab content is displayed
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  // Test that form validation works correctly
  it('should validate form fields', async () => {
    // Render the MetricEditor component
    renderWithProviders(<MetricEditor initialMetric={null} onSave={() => {}} onCancel={() => {}} isLoading={false} />);

    // Click the save button without filling required fields
    fireEvent.click(screen.getByText('Save'));

    // Verify that validation errors are displayed for required fields
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('Type is required')).toBeInTheDocument();
      expect(screen.getByText('Unit is required')).toBeInTheDocument();
      expect(screen.getByText('Comparison Type is required')).toBeInTheDocument();
      expect(screen.getByText('Calculation Method is required')).toBeInTheDocument();
    });

    // Fill in the required fields
    await userEvent.type(screen.getByLabelText('Name'), 'Test Metric');
    await userEvent.type(screen.getByLabelText('Description'), 'Test Description');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'number');
    await userEvent.type(screen.getByLabelText('Unit'), 'count');
    await userEvent.selectOptions(screen.getByLabelText('Comparison Type'), 'ytd');
    await userEvent.selectOptions(screen.getByLabelText('Calculation Method'), 'manual');

    // Verify that validation errors are cleared
    await waitFor(() => {
      expect(screen.queryByText('Name is required')).toBeNull();
      expect(screen.queryByText('Description is required')).toBeNull();
      expect(screen.queryByText('Type is required')).toBeNull();
      expect(screen.queryByText('Unit is required')).toBeNull();
      expect(screen.queryByText('Comparison Type is required')).toBeNull();
      expect(screen.queryByText('Calculation Method is required')).toBeNull();
    });
  });

  // Test that form submission works correctly for creating a new metric
  it('should handle form submission for creating a metric', async () => {
    const onSave = vi.fn();

    // Render the MetricEditor component in create mode
    renderWithProviders(<MetricEditor initialMetric={null} onSave={onSave} onCancel={() => {}} isLoading={false} />);

    // Fill in all required form fields with valid data
    await userEvent.type(screen.getByLabelText('Name'), 'Test Metric');
    await userEvent.type(screen.getByLabelText('Description'), 'Test Description');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'number');
    await userEvent.type(screen.getByLabelText('Unit'), 'count');
    await userEvent.selectOptions(screen.getByLabelText('Comparison Type'), 'ytd');
    await userEvent.selectOptions(screen.getByLabelText('Calculation Method'), 'manual');

    // Click the save button
    fireEvent.click(screen.getByText('Save'));

    // Verify that the createMetric API is called with the correct data
    await waitFor(() => {
      expect(mockAdapter.history.post.length).toBe(1);
      const requestData = JSON.parse(mockAdapter.history.post[0].data);
      expect(requestData.name).toBe('Test Metric');
      expect(requestData.description).toBe('Test Description');
      expect(requestData.type).toBe('number');
      expect(requestData.unit).toBe('count');
      expect(requestData.comparisonType).toBe('ytd');
      expect(requestData.calculationMethod).toBe('manual');
    });

    // Verify that the onSave callback is called with the created metric
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Metric' }));
    });
  });

  // Test that form submission works correctly for updating an existing metric
  it('should handle form submission for updating a metric', async () => {
    const onSave = vi.fn();
    const initialMetric = mockMetric;

    // Render the MetricEditor component in edit mode with initialMetric
    renderWithProviders(<MetricEditor initialMetric={initialMetric} onSave={onSave} onCancel={() => {}} isLoading={false} />);

    // Modify some form fields
    await userEvent.type(screen.getByLabelText('Name'), ' Updated');
    await userEvent.selectOptions(screen.getByLabelText('Comparison Type'), 'mom');

    // Click the save button
    fireEvent.click(screen.getByText('Save'));

    // Verify that the updateMetric API is called with the correct data
    await waitFor(() => {
      expect(mockAdapter.history.put.length).toBe(1);
      const requestData = JSON.parse(mockAdapter.history.put[0].data);
      expect(requestData.name).toBe('Test Metric Updated');
      expect(requestData.comparisonType).toBe('mom');
    });

    // Verify that the onSave callback is called with the updated metric
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Metric Updated', comparisonType: 'mom' }));
    });
  });

  // Test that threshold management works correctly
  it('should handle threshold management', async () => {
    // Render the MetricEditor component
    renderWithProviders(<MetricEditor initialMetric={mockMetric} onSave={() => {}} onCancel={() => {}} isLoading={false} />);

    // Navigate to the thresholds tab
    await userEvent.click(screen.getByText('Thresholds'));

    // Add a new threshold
    await userEvent.click(screen.getByText('Add Threshold'));

    // Verify that the new threshold is displayed
    await waitFor(() => {
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    // Update the threshold value
    await userEvent.type(screen.getByLabelText('Value'), '85');

    // Remove the threshold
    await userEvent.click(screen.getAllByLabelText('Remove Warning threshold')[0]);

    // Verify that the threshold is removed
    await waitFor(() => {
      expect(screen.queryByText('Warning')).toBeNull();
    });
  });

  // Test that the cancel button works correctly
  it('should handle cancel button', async () => {
    const onCancel = vi.fn();

    // Render the MetricEditor component with the onCancel prop
    renderWithProviders(<MetricEditor initialMetric={null} onSave={() => {}} onCancel={onCancel} isLoading={false} />);

    // Click the cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Verify that the onCancel function is called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // Test that loading state is displayed during form submission
  it('should show loading state during submission', async () => {
    // Render the MetricEditor component with isLoading prop set to true
    renderWithProviders(<MetricEditor initialMetric={null} onSave={() => {}} onCancel={() => {}} isLoading={true} />);

    // Verify that the save button is disabled and shows a loading indicator
    expect(screen.getByText('Save')).toBeDisabled();
    expect(screen.getByText('Save')).toHaveClass('p-disabled');

    // Verify that form fields are disabled during loading
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  // Test that API errors are handled correctly during form submission
  it('should handle API errors during submission', async () => {
    // Mock the createMetric API call to return an error
    mockAdapter.onPost('/metrics').reply(500, { message: 'Test API Error' });

    // Render the MetricEditor component
    renderWithProviders(<MetricEditor initialMetric={null} onSave={() => {}} onCancel={() => {}} isLoading={false} />);

    // Fill in required fields
    await userEvent.type(screen.getByLabelText('Name'), 'Test Metric');
    await userEvent.type(screen.getByLabelText('Description'), 'Test Description');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'number');
    await userEvent.type(screen.getByLabelText('Unit'), 'count');
    await userEvent.selectOptions(screen.getByLabelText('Comparison Type'), 'ytd');
    await userEvent.selectOptions(screen.getByLabelText('Calculation Method'), 'manual');

    // Click the save button
    fireEvent.click(screen.getByText('Save'));

    // Verify that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Test API Error')).toBeInTheDocument();
    });

    // Verify that the form remains editable
    expect(screen.getByLabelText('Name')).toBeEnabled();
  });
});