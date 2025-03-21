import React from 'react'; // React core library // version ^18.2.0
import { screen, waitFor, fireEvent, within } from '@testing-library/react'; // React testing utilities // version ^14.0.0
import userEvent from '@testing-library/user-event'; // Simulates user interactions // version ^14.0.0
import { createMockAdapter } from 'axios-mock-adapter'; // Creates mock API responses // version ^1.21.4
import axios from 'axios'; // HTTP client for API requests // version ^1.4.0

import KFFMEditorPage from '../KFFMEditorPage'; // Component under test
import { renderWithRouter, waitForLoadingToFinish } from '../../../tests/testUtils'; // Test utilities for rendering components with router and waiting for loading states
import { setupKFFMMocks, mockKFFM } from '../../../tests/mocks/apiMocks'; // Mock API responses for KFFM-related endpoints
import { KFFMEditorMode, NodeType, ConnectionType } from '../../../types/kffm.types'; // Type definitions for KFFM entities and editor modes
import { ROUTES } from '../../../utils/constants/routes'; // Route constants for navigation

describe('KFFMEditorPage', () => {
  let mockAdapter: any;

  beforeEach(() => {
    mockAdapter = createMockAdapter(axios);
    setupKFFMMocks(mockAdapter);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  it('should render loading state initially', async () => {
    renderWithRouter(<KFFMEditorPage />, [{ path: ROUTES.KFFM.EDIT, element: <KFFMEditorPage /> }], ROUTES.KFFM.EDIT);

    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitForLoadingToFinish();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should render the KFFM editor with nodes and connections', async () => {
    renderWithRouter(<KFFMEditorPage />, [{ path: ROUTES.KFFM.EDIT, element: <KFFMEditorPage /> }], ROUTES.KFFM.EDIT);

    await waitForLoadingToFinish();

    expect(screen.getByText('FUNCTION PALETTE')).toBeInTheDocument();
  });

  it('should switch between view and edit modes', async () => {
    renderWithRouter(<KFFMEditorPage />, [{ path: ROUTES.KFFM.EDIT, element: <KFFMEditorPage /> }], ROUTES.KFFM.EDIT);

    await waitForLoadingToFinish();

    const editModeButton = screen.getByRole('button', { name: /Edit Mode/i });
    expect(editModeButton).toBeInTheDocument();

    fireEvent.click(editModeButton);

    expect(screen.getByText('FUNCTION PALETTE')).toBeInTheDocument();

    const viewModeButton = screen.getByRole('button', { name: /View Mode/i });
    expect(viewModeButton).toBeInTheDocument();

    fireEvent.click(viewModeButton);

    expect(screen.queryByText('FUNCTION PALETTE')).not.toBeInTheDocument();
  });

  it('should navigate back to KFFM list when clicking back button', async () => {
    const navigate = jest.fn();
    renderWithRouter(<KFFMEditorPage />, [{ path: ROUTES.KFFM.EDIT, element: <KFFMEditorPage /> }], ROUTES.KFFM.EDIT);

    await waitForLoadingToFinish();

    const backButton = screen.getByRole('button', { name: /Back/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
  });
});