import React from 'react'; // React library for component testing // v18.2.0
import { render, screen, waitFor, fireEvent } from '@testing-library/react'; // Testing library utilities for rendering and interacting with components // ^14.0.0
import userEvent from '@testing-library/user-event'; // Simulating user interactions in tests // ^14.0.0
import { act } from 'react-dom/test-utils'; // Utility for batching React updates in tests // ^18.2.0
import MockAdapter from 'axios-mock-adapter'; // Mock adapter for axios to simulate API responses // ^1.21.4

import OrganizationSettingsPage from '../OrganizationSettingsPage'; // Component under test
import { renderWithProviders } from '../../../tests/testUtils'; // Utility function to render components with all necessary providers
import { createMockAuthUser, createMockOrganization, waitForLoadingToFinish } from '../../../tests/testUtils'; // Utility function to create mock authenticated users
import { mockOrganization, setupOrganizationMocks, createMockAdapter } from '../../../tests/mocks/apiMocks'; // Setup mock API responses for organization endpoints
import { UserRole } from '../../../utils/constants/roles'; // Role constants for testing different user permissions
import { Organization } from '../../../types/organization.types'; // Type definition for organization data

// Main test suite for OrganizationSettingsPage component
describe('OrganizationSettingsPage component', () => {
  let mockAdapter: MockAdapter; // Mock axios adapter for API requests

  // Setup function that runs before each test
  beforeEach(() => {
    mockAdapter = createMockAdapter(); // Create a new mock adapter
    setupOrganizationMocks(mockAdapter); // Set up organization API mocks
  });

  // Cleanup function that runs after each test
  afterEach(() => {
    mockAdapter.restore(); // Reset all mocks
  });

  // Test that verifies the component shows a loading state initially
  it('renders loading state initially', async () => {
    // Render the OrganizationSettingsPage with a CEO user
    renderWithProviders(<OrganizationSettingsPage />);

    // Verify that a loading spinner is displayed
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for loading to finish
    await waitForLoadingToFinish();
  });

  // Test that verifies CEO users can view and edit organization settings
  it('renders organization settings form for CEO users', async () => {
    // Render the OrganizationSettingsPage with a CEO user
    renderWithProviders(<OrganizationSettingsPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify that all form sections are displayed
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Appearance Settings')).toBeInTheDocument();
    expect(screen.getByText('Meeting Settings')).toBeInTheDocument();
    expect(screen.getByText('Branding Settings')).toBeInTheDocument();

    // Verify that form fields are populated with organization data
    expect(screen.getByLabelText('Organization Name')).toHaveValue(mockOrganization.name);
    expect(screen.getByLabelText('Timezone')).toHaveTextContent('UTC');
    expect(screen.getByLabelText('Theme')).toHaveTextContent('Light');
    expect(screen.getByLabelText('Default Meeting Duration (minutes)')).toHaveValue('30');
    expect(screen.getByLabelText('Default Meeting Reminders (minutes)')).toHaveTextContent('5 minutes');

    // Verify that form fields are editable
    expect(screen.getByLabelText('Organization Name')).toBeEnabled();
    expect(screen.getByLabelText('Timezone')).toBeEnabled();
    expect(screen.getByLabelText('Theme')).toBeEnabled();
    expect(screen.getByLabelText('Default Meeting Duration (minutes)')).toBeEnabled();
    expect(screen.getByLabelText('Default Meeting Reminders (minutes)')).toBeEnabled();
  });

    // Test that verifies COACH users can view and edit organization settings
    it('renders organization settings form for COACH users', async () => {
      // Render the OrganizationSettingsPage with a COACH user
      renderWithProviders(<OrganizationSettingsPage />);
  
      // Wait for loading to finish
      await waitForLoadingToFinish();
  
      // Verify that all form sections are displayed
      expect(screen.getByText('General Settings')).toBeInTheDocument();
      expect(screen.getByText('Appearance Settings')).toBeInTheDocument();
      expect(screen.getByText('Meeting Settings')).toBeInTheDocument();
      expect(screen.getByText('Branding Settings')).toBeInTheDocument();
  
      // Verify that form fields are populated with organization data
      expect(screen.getByLabelText('Organization Name')).toHaveValue(mockOrganization.name);
      expect(screen.getByLabelText('Timezone')).toHaveTextContent('UTC');
      expect(screen.getByLabelText('Theme')).toHaveTextContent('Light');
      expect(screen.getByLabelText('Default Meeting Duration (minutes)')).toHaveValue('30');
      expect(screen.getByLabelText('Default Meeting Reminders (minutes)')).toHaveTextContent('5 minutes');
  
      // Verify that form fields are editable
      expect(screen.getByLabelText('Organization Name')).toBeEnabled();
      expect(screen.getByLabelText('Timezone')).toBeEnabled();
      expect(screen.getByLabelText('Theme')).toBeEnabled();
      expect(screen.getByLabelText('Default Meeting Duration (minutes)')).toBeEnabled();
      expect(screen.getByLabelText('Default Meeting Reminders (minutes)')).toBeEnabled();
    });

  // Test that verifies users without edit permissions see a read-only view
  it('shows read-only view for users without edit permissions', async () => {
    // Render the OrganizationSettingsPage with a TEAM_MEMBER user
    renderWithProviders(<OrganizationSettingsPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify that form fields are displayed
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Meeting Duration (minutes)')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Meeting Reminders (minutes)')).toBeInTheDocument();

    // Verify that form fields are disabled
    expect(screen.getByLabelText('Organization Name')).toBeDisabled();
    expect(screen.getByLabelText('Timezone')).toBeDisabled();
    expect(screen.getByLabelText('Theme')).toBeDisabled();
    expect(screen.getByLabelText('Default Meeting Duration (minutes)')).toBeDisabled();
    expect(screen.getByLabelText('Default Meeting Reminders (minutes)')).toBeDisabled();

    // Verify that save button is not displayed
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  // Test that verifies form submission updates organization settings
  it('submits updated organization settings successfully', async () => {
    // Set up mock for successful organization update API call
    mockAdapter.onPut(`/organizations/${mockOrganization.id}`).reply(200, mockSuccessResponse(mockOrganization));

    // Render the OrganizationSettingsPage with a CEO user
    renderWithProviders(<OrganizationSettingsPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Update form fields with new values
    await userEvent.type(screen.getByLabelText('Organization Name'), ' Updated');
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'America/Los_Angeles' } });
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify that API was called with correct data
    await waitFor(() => {
      expect(mockAdapter.history.put[0].data).toEqual(JSON.stringify({
        name: 'Test Organization Updated',
        settings: {
          theme: 'light',
          timezone: 'America/Los_Angeles',
          defaultMeetingDuration: 30,
          defaultMeetingReminders: [5, 10],
          logoUrl: null,
          customFields: {}
        }
      }));
    });

    // Verify that success message is displayed
    await waitFor(() => {
      expect(screen.getByText('Changes saved successfully')).toBeInTheDocument();
    });
  });

  // Test that verifies error handling when update fails
  it('shows error message when update fails', async () => {
    // Set up mock for failed organization update API call
    mockAdapter.onPut(`/organizations/${mockOrganization.id}`).reply(500, mockErrorResponse('Update failed'));

    // Render the OrganizationSettingsPage with a CEO user
    renderWithProviders(<OrganizationSettingsPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Update form fields with new values
    await userEvent.type(screen.getByLabelText('Organization Name'), ' Updated');
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  // Test that verifies form validation works correctly
  it('validates form fields before submission', async () => {
    // Render the OrganizationSettingsPage with a CEO user
    renderWithProviders(<OrganizationSettingsPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Clear required fields
    fireEvent.change(screen.getByLabelText('Organization Name'), { target: { value: '' } });

    // Submit the form
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify that validation error messages are displayed
    await waitFor(() => {
      expect(screen.getByText('The field \'Organization Name\' is required.')).toBeInTheDocument();
    });

    // Verify that API was not called
    expect(mockAdapter.history.put.length).toBe(0);
  });

  // Test that verifies logo upload functionality
  it('handles logo upload correctly', async () => {
    // Set up mock for successful logo upload API call
    mockAdapter.onPost(`/organizations/${mockOrganization.id}/logo`).reply(200, mockSuccessResponse({ logoUrl: 'new_logo_url' }));

    // Render the OrganizationSettingsPage with a CEO user
    renderWithProviders(<OrganizationSettingsPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Create a mock file for upload
    const file = new File(['(⌐□_□)'], 'logo.png', { type: 'image/png' });

    // Find the file upload input
    const fileInput = screen.getByLabelText('Organization Logo') as HTMLInputElement;

    // Trigger file upload event
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Verify that API was called with correct file
    await waitFor(() => {
      expect(mockAdapter.history.post[0].data.get('logo')).toBe(file);
    });

    // Verify that logo preview is updated
    await waitFor(() => {
      expect(screen.getByAltText('Organization Logo')).toHaveAttribute('src', 'new_logo_url');
    });

    // Verify that success message is displayed
    await waitFor(() => {
      expect(screen.getByText('Changes saved successfully')).toBeInTheDocument();
    });
  });
});