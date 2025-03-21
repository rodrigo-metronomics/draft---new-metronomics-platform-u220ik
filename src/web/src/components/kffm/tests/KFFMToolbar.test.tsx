# src/web/src/components/kffm/tests/KFFMToolbar.test.tsx
```typescript
import React from 'react'; // version ^19.x
import { render, screen, fireEvent } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

import KFFMToolbar from '../KFFMToolbar';
import { KFFMEditorMode } from '../../types/kffm.types';
import { renderWithProviders } from '../../../tests/testUtils';

// Describe the test suite for the KFFMToolbar component
describe('KFFMToolbar', () => {
  // Define mock functions for props
  const onModeChange = vi.fn();
  const onSave = vi.fn();
  const onUndo = vi.fn();
  const onRedo = vi.fn();
  const onZoomIn = vi.fn();
  const onZoomOut = vi.fn();
  const onZoomReset = vi.fn();
  const onExport = vi.fn();
  const onShare = vi.fn();
  const onDelete = vi.fn();

  // Define default props for testing
  const defaultProps = {
    kffmId: 'test-kffm-id',
    editorMode: KFFMEditorMode.VIEW,
    onModeChange: onModeChange,
    onSave: onSave,
    canUndo: true,
    canRedo: true,
    onUndo: onUndo,
    onRedo: onRedo,
    zoom: 1,
    onZoomIn: onZoomIn,
    onZoomOut: onZoomOut,
    onZoomReset: onZoomReset,
    onExport: onExport,
    onShare: onShare,
    onDelete: onDelete,
    hasSelection: false,
  };

  // Setup function that runs before each test
  beforeEach(() => {
    // Reset mocks before each test
    onModeChange.mockClear();
    onSave.mockClear();
    onUndo.mockClear();
    onRedo.mockClear();
    onZoomIn.mockClear();
    onZoomOut.mockClear();
    onZoomReset.mockClear();
    onExport.mockClear();
    onShare.mockClear();
    onDelete.mockClear();
  });

  // Test case: renders in VIEW mode with correct buttons
  it('renders in VIEW mode with correct buttons', () => {
    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...defaultProps} />);

    // Assert Edit button is visible
    expect(screen.getByRole('button', { name: 'Edit Mode' })).toBeVisible();
    // Assert Save button is not visible
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
    // Assert Undo/Redo buttons are not visible
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Redo' })).not.toBeInTheDocument();
    // Assert Delete button is not visible
    expect(screen.queryByRole('button', { name: 'Delete Selected Element' })).not.toBeInTheDocument();
    // Assert Zoom controls are visible
    expect(screen.getByRole('button', { name: 'Zoom In' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset Zoom' })).toBeVisible();
    // Assert Export and Share buttons are visible
    expect(screen.getByRole('button', { name: 'Export KFFM' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Share KFFM' })).toBeVisible();
  });

  // Test case: renders in EDIT mode with correct buttons
  it('renders in EDIT mode with correct buttons', () => {
    // Set up test-specific props and mocks
    const props = { ...defaultProps, editorMode: KFFMEditorMode.EDIT };

    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...props} />);

    // Assert View button is visible
    expect(screen.getByRole('button', { name: 'View Mode' })).toBeVisible();
    // Assert Save button is visible
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    // Assert Undo/Redo buttons are visible
    expect(screen.getByRole('button', { name: 'Undo' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeVisible();
    // Assert Delete button is not visible when hasSelection is false
    expect(screen.queryByRole('button', { name: 'Delete Selected Element' })).not.toBeInTheDocument();

    // Render the component with hasSelection set to true
    renderWithProviders(<KFFMToolbar {...props, hasSelection: true} />);
    // Assert Delete button is visible when hasSelection is true
    expect(screen.getByRole('button', { name: 'Delete Selected Element' })).toBeVisible();

    // Assert Zoom controls are visible
    expect(screen.getByRole('button', { name: 'Zoom In' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reset Zoom' })).toBeVisible();
    // Assert Export and Share buttons are visible
    expect(screen.getByRole('button', { name: 'Export KFFM' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Share KFFM' })).toBeVisible();
  });

  // Test case: calls onModeChange when mode toggle button is clicked
  it('calls onModeChange when mode toggle button is clicked', () => {
    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...defaultProps} />);

    // Get the Edit button
    const editButton = screen.getByRole('button', { name: 'Edit Mode' });
    // Simulate a click event on the Edit button
    fireEvent.click(editButton);

    // Assert onModeChange mock is called with EDIT mode when clicked
    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith(KFFMEditorMode.EDIT);

    // Set up test-specific props and mocks
    const props = { ...defaultProps, editorMode: KFFMEditorMode.EDIT };

    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...props} />);

    // Get the View button
    const viewButton = screen.getByRole('button', { name: 'View Mode' });
    // Simulate a click event on the View button
    fireEvent.click(viewButton);

    // Assert onModeChange mock is called with VIEW mode when clicked
    expect(onModeChange).toHaveBeenCalledTimes(2);
    expect(onModeChange).toHaveBeenCalledWith(KFFMEditorMode.VIEW);
  });

  // Test case: calls onSave when save button is clicked
  it('calls onSave when save button is clicked', () => {
    // Set up test-specific props and mocks
    const props = { ...defaultProps, editorMode: KFFMEditorMode.EDIT };

    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...props} />);

    // Get the Save button
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    // Simulate a click event on the Save button
    fireEvent.click(saveButton);

    // Assert onSave mock is called when Save button is clicked
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  // Test case: calls onUndo and onRedo when respective buttons are clicked
  it('calls onUndo and onRedo when respective buttons are clicked', () => {
    // Set up test-specific props and mocks
    const props = { ...defaultProps, editorMode: KFFMEditorMode.EDIT };

    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...props} />);

    // Get the Undo button
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    // Simulate a click event on the Undo button
    fireEvent.click(undoButton);

    // Assert onUndo mock is called when Undo button is clicked
    expect(onUndo).toHaveBeenCalledTimes(1);

    // Get the Redo button
    const redoButton = screen.getByRole('button', { name: 'Redo' });
    // Simulate a click event on the Redo button
    fireEvent.click(redoButton);

    // Assert onRedo mock is called when Redo button is clicked
    expect(onRedo).toHaveBeenCalledTimes(1);

    // Render the component with canUndo and canRedo set to false
    renderWithProviders(<KFFMToolbar {...props, canUndo: false, canRedo: false} />);

    // Get the Undo button
    const undoButtonDisabled = screen.getByRole('button', { name: 'Undo' });
    // Assert Undo button is disabled when canUndo is false
    expect(undoButtonDisabled).toBeDisabled();

    // Get the Redo button
    const redoButtonDisabled = screen.getByRole('button', { name: 'Redo' });
    // Assert Redo button is disabled when canRedo is false
    expect(redoButtonDisabled).toBeDisabled();
  });

  // Test case: calls zoom functions when zoom buttons are clicked
  it('calls zoom functions when zoom buttons are clicked', () => {
    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...defaultProps} />);

    // Get the Zoom In button
    const zoomInButton = screen.getByRole('button', { name: 'Zoom In' });
    // Simulate a click event on the Zoom In button
    fireEvent.click(zoomInButton);

    // Assert onZoomIn mock is called when Zoom In button is clicked
    expect(onZoomIn).toHaveBeenCalledTimes(1);

    // Get the Zoom Out button
    const zoomOutButton = screen.getByRole('button', { name: 'Zoom Out' });
    // Simulate a click event on the Zoom Out button
    fireEvent.click(zoomOutButton);

    // Assert onZoomOut mock is called when Zoom Out button is clicked
    expect(onZoomOut).toHaveBeenCalledTimes(1);

    // Get the Reset Zoom button
    const zoomResetButton = screen.getByRole('button', { name: 'Reset Zoom' });
    // Simulate a click event on the Reset Zoom button
    fireEvent.click(zoomResetButton);

    // Assert onZoomReset mock is called when Reset Zoom button is clicked
    expect(onZoomReset).toHaveBeenCalledTimes(1);
  });

  // Test case: calls onDelete when delete button is clicked
  it('calls onDelete when delete button is clicked', () => {
    // Set up test-specific props and mocks
    const props = { ...defaultProps, editorMode: KFFMEditorMode.EDIT, hasSelection: true };

    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...props} />);

    // Get the Delete button
    const deleteButton = screen.getByRole('button', { name: 'Delete Selected Element' });
    // Simulate a click event on the Delete button
    fireEvent.click(deleteButton);

    // Assert onDelete mock is called when Delete button is clicked
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  // Test case: calls onExport and onShare when respective buttons are clicked
  it('calls onExport and onShare when respective buttons are clicked', () => {
    // Render the component with necessary props
    renderWithProviders(<KFFMToolbar {...defaultProps} />);

    // Get the Export button
    const exportButton = screen.getByRole('button', { name: 'Export KFFM' });
    // Simulate a click event on the Export button
    fireEvent.click(exportButton);

    // Assert onExport mock is called when Export button is clicked
    expect(onExport).toHaveBeenCalledTimes(1);

    // Get the Share button
    const shareButton = screen.getByRole('button', { name: 'Share KFFM' });
    // Simulate a click event on the Share button
    fireEvent.click(shareButton);

    // Assert onShare mock is called when Share button is clicked
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('adapts to different screen sizes', () => {
    // TODO: Implement responsive behavior tests
    console.log('Responsive behavior tests not implemented');
  });
});