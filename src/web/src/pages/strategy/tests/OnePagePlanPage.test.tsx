# src/web/src/pages/strategy/tests/OnePagePlanPage.test.tsx
```typescript
import React from 'react'; // React library for component testing // v18.2.0
import { render, screen, waitFor, fireEvent } from '@testing-library/react'; // Testing utilities for rendering and interacting with components // ^14.0.0
import userEvent from '@testing-library/user-event'; // Simulate user interactions in tests // ^14.0.0
import MockAdapter from 'axios-mock-adapter'; // Mock adapter for axios to simulate API responses // ^1.21.4
import axios from 'axios'; // HTTP client that needs to be mocked // ^1.4.0
import { vi } from 'vitest'; // Mocking and spying functionality for tests // ^0.34.0

import OnePagePlanPage from '../OnePagePlanPage'; // Component under test
import OnePagePlan from '../../components/strategy/OnePagePlan'; // Main component used by OnePagePlanPage
import { renderWithProviders, waitForLoadingToFinish, createMockOrganization } from '../../../tests/testUtils'; // Utility for rendering components with all necessary providers
import { setupGoalMocks, setupMetricMocks, mockGoal, mockMetric } from '../../../tests/mocks/apiMocks'; // Setup mock API responses for goals
import { GoalType } from '../../../types/goal.types'; // Enum for goal types (BHAG, 3HAG, 1HAG)

describe('OnePagePlanPage', () => {
  // Setup function to configure mocks before each test
  const setup = () => {
    // Create a mock adapter for axios
    const mock = new MockAdapter(axios);

    // Setup goal mocks with the adapter
    setupGoalMocks(mock);

    // Setup metric mocks with the adapter
    setupMetricMocks(mock);

    return mock;
  };

  beforeEach(() => {
    // Call setup function to configure mocks
    setup();

    // Reset all mocks with vi.resetAllMocks()
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Clean up any remaining mocks or side effects
  });

  it('renders the page with title and action buttons', async () => {
    // Render the OnePagePlanPage component with renderWithProviders
    renderWithProviders(<OnePagePlanPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Check that the page title 'One-Page Plan' is displayed
    expect(screen.getByText('One-Page Plan')).toBeInTheDocument();

    // Verify that Edit, Print, and Export buttons are present
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('toggles edit mode when Edit button is clicked', async () => {
    // Render the OnePagePlanPage component
    renderWithProviders(<OnePagePlanPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the Edit button
    const editButton = screen.getByRole('button', { name: 'Edit' });
    userEvent.click(editButton);

    // Verify that the button text changes to 'Save' or similar
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    // Click the button again
    const saveButton = screen.getByRole('button', { name: 'Save' });
    userEvent.click(saveButton);

    // Verify that the button text changes back to 'Edit'
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
  });

  it('triggers print dialog when Print button is clicked', async () => {
    // Mock window.print function with vi.fn()
    const printMock = vi.fn();
    global.window.print = printMock;

    // Render the OnePagePlanPage component
    renderWithProviders(<OnePagePlanPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the Print button
    const printButton = screen.getByRole('button', { name: 'Print' });
    userEvent.click(printButton);

    // Verify that window.print was called
    expect(printMock).toHaveBeenCalled();
  });

  it('exports to PDF when Export button is clicked', async () => {
    // Mock jsPDF and html2canvas modules
    const mockJsPDF = vi.fn().mockReturnValue({ save: vi.fn() });
    vi.mock('jspdf', () => ({ default: mockJsPDF }));

    const mockHtml2Canvas = vi.fn().mockResolvedValue({} as any);
    vi.mock('html2canvas', () => ({ default: mockHtml2Canvas }));

    // Render the OnePagePlanPage component
    renderWithProviders(<OnePagePlanPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the Export button
    const exportButton = screen.getByRole('button', { name: 'Export' });
    userEvent.click(exportButton);

    // Verify that jsPDF and html2canvas were called
    await waitFor(() => {
      expect(mockJsPDF).toHaveBeenCalled();
      expect(mockHtml2Canvas).toHaveBeenCalled();
    });

    // Verify that jsPDF.save was called with the correct filename
    await waitFor(() => {
      expect(mockJsPDF().save).toHaveBeenCalledWith(expect.stringContaining('One-Page Plan'));
    });
  });

  it('displays loading state while fetching data', () => {
    // Setup mocks to delay responses
    const mock = setup();
    mock.onGet('/goals/type/BHAG').reply(() => new Promise(resolve => setTimeout(() => resolve([200, []]), 100)));
    mock.onGet('/goals/type/THREE_HAG').reply(() => new Promise(resolve => setTimeout(() => resolve([200, []]), 100)));
    mock.onGet('/goals/type/ONE_HAG').reply(() => new Promise(resolve => setTimeout(() => resolve([200, []]), 100)));
    mock.onGet('/metrics/dashboard').reply(() => new Promise(resolve => setTimeout(() => resolve([200, []]), 100)));

    // Render the OnePagePlanPage component
    renderWithProviders(<OnePagePlanPage />);

    // Check that a loading indicator is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error message when data fetching fails', async () => {
    // Setup mocks to return error responses
    const mock = setup();
    mock.onGet('/goals/type/BHAG').reply(500);
    mock.onGet('/goals/type/THREE_HAG').reply(500);
    mock.onGet('/goals/type/ONE_HAG').reply(500);
    mock.onGet('/metrics/dashboard').reply(500);

    // Render the OnePagePlanPage component
    renderWithProviders(<OnePagePlanPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Error:')).toBeInTheDocument();
    });

    // Verify that an error message is displayed
    expect(screen.getByText('Error: Failed to fetch goals')).toBeInTheDocument();
  });

  it('passes correct props to OnePagePlan component', async () => {
    // Mock the OnePagePlan component
    const OnePagePlanMock = vi.fn();
    vi.mock('../../components/strategy/OnePagePlan', () => ({
      default: OnePagePlanMock,
    }));

    // Render the OnePagePlanPage component
    renderWithProviders(<OnePagePlanPage />);

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify that OnePagePlan receives the correct editable, printable, and handler props
    expect(OnePagePlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        editable: false,
        printable: false,
        onEdit: expect.any(Function),
        onPrint: expect.any(Function),
        onExport: expect.any(Function),
      }),
      expect.anything()
    );
  });

  it('shows toast notification after successful export', async () => {
    // Mock jsPDF and html2canvas modules
    const mockJsPDF = vi.fn().mockReturnValue({ save: vi.fn() });
    vi.mock('jspdf', () => ({ default: mockJsPDF }));

    const mockHtml2Canvas = vi.fn().mockResolvedValue({} as any);
    vi.mock('html2canvas', () => ({ default: mockHtml2Canvas }));

    // Mock the showToast function
    const showToastMock = vi.fn();

    // Render the OnePagePlanPage component
    renderWithProviders(<OnePagePlanPage />, {
      notificationContext: {
        showToast: showToastMock,
      },
    });

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Find and click the Export button
    const exportButton = screen.getByRole('button', { name: 'Export' });
    userEvent.click(exportButton);

    // Verify that a success toast notification is displayed
    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Export Successful',
        detail: 'One-Page Plan exported to PDF',
      });
    });
  });
});