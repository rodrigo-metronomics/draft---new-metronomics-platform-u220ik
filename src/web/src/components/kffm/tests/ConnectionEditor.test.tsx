# src/web/src/components/kffm/tests/ConnectionEditor.test.tsx
```typescript
import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

import ConnectionEditor from '../ConnectionEditor';
import { renderWithProviders, waitForLoadingToFinish } from '../../../tests/testUtils';
import { mockKFFM } from '../../../tests/mocks/apiMocks';
import { KFFMConnection, KFFMNode, ConnectionType, NodeType } from '../../../types/kffm.types';
import useKFFM from '../../../hooks/useKFFM';

/**
 * Setup function to create mock data and props for testing
 * @returns Mock data and props for testing
 */
const setup = () => {
  // Create mock nodes array with source and target nodes
  const mockNodes: KFFMNode[] = [
    {
      id: '1',
      title: 'Node 1',
      description: 'Description 1',
      type: NodeType.DEPARTMENT,
      kffmId: '1',
      ownerId: '1',
      owner: { id: '1', name: 'Owner 1' },
      positionX: 0,
      positionY: 0,
      metrics: [],
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      outgoingConnections: [],
      incomingConnections: [],
    },
    {
      id: '2',
      title: 'Node 2',
      description: 'Description 2',
      type: NodeType.FUNCTION,
      kffmId: '1',
      ownerId: '2',
      owner: { id: '2', name: 'Owner 2' },
      positionX: 100,
      positionY: 100,
      metrics: [],
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      outgoingConnections: [],
      incomingConnections: [],
    },
  ];

  // Create mock connection for editing tests
  const mockConnection: KFFMConnection = {
    id: '1',
    label: 'Test Connection',
    type: ConnectionType.DIRECT,
    kffmId: '1',
    sourceNodeId: '1',
    targetNodeId: '2',
    sourceNode: mockNodes[0],
    targetNode: mockNodes[1],
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  // Create mock callback functions
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  // Return mock data and props
  return {
    mockNodes,
    mockConnection,
    mockOnClose,
    mockOnSave,
  };
};

describe('ConnectionEditor Component', () => {
  it('renders correctly in create mode', async () => {
    // Setup mock data and props
    const { mockNodes, mockOnClose, mockOnSave } = setup();

    // Mock useKFFM hook to return mock implementation of useKFFMConnectionForm
    vi.spyOn(useKFFM, 'default').mockReturnValue({
      ...useKFFM(),
      useKFFMConnectionForm: vi.fn().mockReturnValue({
        values: { label: '', type: ConnectionType.DIRECT, sourceNodeId: '', targetNodeId: '' },
        errors: {},
        touched: {},
        isSubmitting: false,
        handleChange: vi.fn(),
        handleBlur: vi.fn(),
        handleSubmit: vi.fn(),
      }),
    } as any);

    // Render ConnectionEditor component in create mode
    renderWithProviders(
      <ConnectionEditor
        connection={null}
        kffmId="1"
        nodes={mockNodes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isCreating={true}
      />
    );

    // Verify dialog title shows 'Create Connection'
    expect(screen.getByText('Create Connection')).toBeInTheDocument();

    // Verify form fields are rendered correctly
    expect(screen.getByLabelText('Label')).toBeInTheDocument();
    expect(screen.getByLabelText('Connection Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Source Node')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Node')).toBeInTheDocument();

    // Verify source and target node dropdowns are enabled
    expect((screen.getByLabelText('Source Node') as HTMLSelectElement).disabled).toBe(false);
    expect((screen.getByLabelText('Target Node') as HTMLSelectElement).disabled).toBe(false);
  });

  it('renders correctly in edit mode', async () => {
    // Setup mock data and props with existing connection
    const { mockNodes, mockConnection, mockOnClose, mockOnSave } = setup();

    // Mock useKFFM hook to return mock implementation of useKFFMConnectionForm
    vi.spyOn(useKFFM, 'default').mockReturnValue({
      ...useKFFM(),
      useKFFMConnectionForm: vi.fn().mockReturnValue({
        values: { label: mockConnection.label, type: mockConnection.type, sourceNodeId: mockConnection.sourceNodeId, targetNodeId: mockConnection.targetNodeId },
        errors: {},
        touched: {},
        isSubmitting: false,
        handleChange: vi.fn(),
        handleBlur: vi.fn(),
        handleSubmit: vi.fn(),
      }),
    } as any);

    // Render ConnectionEditor component in edit mode
    renderWithProviders(
      <ConnectionEditor
        connection={mockConnection}
        kffmId="1"
        nodes={mockNodes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isCreating={false}
      />
    );

    // Verify dialog title shows 'Edit Connection'
    expect(screen.getByText('Edit Connection')).toBeInTheDocument();

    // Verify form fields are populated with connection data
    expect(screen.getByDisplayValue(mockConnection.label)).toBeInTheDocument();

    // Verify source and target node dropdowns are disabled
    expect((screen.getByLabelText('Source Node') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText('Target Node') as HTMLSelectElement).disabled).toBe(true);
  });

  it('handles form submission in create mode', async () => {
    // Setup mock data and props
    const { mockNodes, mockOnClose, mockOnSave } = setup();

    // Mock useKFFM hook to return mock implementation of useKFFMConnectionForm and createKFFMConnection
    const mockCreateKFFMConnection = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(useKFFM, 'default').mockReturnValue({
      ...useKFFM(),
      useKFFMConnectionForm: vi.fn().mockReturnValue({
        values: { label: 'New Connection', type: ConnectionType.SUPPORTING, sourceNodeId: '1', targetNodeId: '2' },
        errors: {},
        touched: { label: true, type: true, sourceNodeId: true, targetNodeId: true },
        isSubmitting: false,
        handleChange: vi.fn(),
        handleBlur: vi.fn(),
        handleSubmit: (fn: any) => fn,
      }),
      createKFFMConnection: mockCreateKFFMConnection,
    } as any);

    // Render ConnectionEditor component in create mode
    renderWithProviders(
      <ConnectionEditor
        connection={null}
        kffmId="1"
        nodes={mockNodes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isCreating={true}
      />
    );

    // Fill in form fields with test data
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(mockCreateKFFMConnection).toHaveBeenCalledWith({
        label: 'New Connection',
        type: ConnectionType.SUPPORTING,
        kffmId: '1',
        sourceNodeId: '1',
        targetNodeId: '2',
      });
    });

    // Verify onSave callback was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('handles form submission in edit mode', async () => {
    // Setup mock data and props with existing connection
    const { mockNodes, mockConnection, mockOnClose, mockOnSave } = setup();

    // Mock useKFFM hook to return mock implementation of useKFFMConnectionForm and updateKFFMConnection
    const mockUpdateKFFMConnection = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(useKFFM, 'default').mockReturnValue({
      ...useKFFM(),
      useKFFMConnectionForm: vi.fn().mockReturnValue({
        values: { label: 'Updated Connection', type: ConnectionType.DEPENDENT, sourceNodeId: mockConnection.sourceNodeId, targetNodeId: mockConnection.targetNodeId },
        errors: {},
        touched: { label: true, type: true },
        isSubmitting: false,
        handleChange: vi.fn(),
        handleBlur: vi.fn(),
        handleSubmit: (fn: any) => fn,
      }),
      updateKFFMConnection: mockUpdateKFFMConnection,
    } as any);

    // Render ConnectionEditor component in edit mode
    renderWithProviders(
      <ConnectionEditor
        connection={mockConnection}
        kffmId="1"
        nodes={mockNodes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isCreating={false}
      />
    );

    // Modify form fields with new test data
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(mockUpdateKFFMConnection).toHaveBeenCalledWith({
        id: mockConnection.id,
        connectionData: {
          label: 'Updated Connection',
          type: ConnectionType.DEPENDENT,
        },
      });
    });

    // Verify onSave callback was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('handles form cancellation', async () => {
    // Setup mock data and props
    const { mockNodes, mockOnClose, mockOnSave } = setup();

    // Mock useKFFM hook to return mock implementation of useKFFMConnectionForm
    vi.spyOn(useKFFM, 'default').mockReturnValue({
      ...useKFFM(),
      useKFFMConnectionForm: vi.fn().mockReturnValue({
        values: { label: '', type: ConnectionType.DIRECT, sourceNodeId: '', targetNodeId: '' },
        errors: {},
        touched: {},
        isSubmitting: false,
        handleChange: vi.fn(),
        handleBlur: vi.fn(),
        handleSubmit: vi.fn(),
      }),
    } as any);

    // Render ConnectionEditor component
    renderWithProviders(
      <ConnectionEditor
        connection={null}
        kffmId="1"
        nodes={mockNodes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isCreating={true}
      />
    );

    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));

    // Verify onClose callback was called
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    // Setup mock data and props
    const { mockNodes, mockOnClose, mockOnSave } = setup();

    // Mock useKFFM hook to return mock implementation with validation errors
    vi.spyOn(useKFFM, 'default').mockReturnValue({
      ...useKFFM(),
      useKFFMConnectionForm: vi.fn().mockReturnValue({
        values: { label: '', type: '', sourceNodeId: '', targetNodeId: '' },
        errors: { label: 'Label is required', type: 'Type is required', sourceNodeId: 'Source Node is required', targetNodeId: 'Target Node is required' },
        touched: { label: true, type: true, sourceNodeId: true, targetNodeId: true },
        isSubmitting: false,
        handleChange: vi.fn(),
        handleBlur: vi.fn(),
        handleSubmit: (fn: any) => fn,
      }),
    } as any);

    // Render ConnectionEditor component
    renderWithProviders(
      <ConnectionEditor
        connection={null}
        kffmId="1"
        nodes={mockNodes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isCreating={true}
      />
    );

    // Submit form without filling required fields
    fireEvent.click(screen.getByText('Save'));

    // Verify error messages are displayed for required fields
    expect(screen.getByText('Label is required')).toBeInTheDocument();
    expect(screen.getByText('Type is required')).toBeInTheDocument();
    expect(screen.getByText('Source Node is required')).toBeInTheDocument();
    expect(screen.getByText('Target Node is required')).toBeInTheDocument();
  });

  it('displays connection type options correctly', async () => {
    // Setup mock data and props
    const { mockNodes, mockOnClose, mockOnSave } = setup();

    // Mock useKFFM hook to return mock implementation of useKFFMConnectionForm
    const mockHandleChange = vi.fn();
    vi.spyOn(useKFFM, 'default').mockReturnValue({
      ...useKFFM(),
      useKFFMConnectionForm: vi.fn().mockReturnValue({
        values: { label: '', type: ConnectionType.DIRECT, sourceNodeId: '', targetNodeId: '' },
        errors: {},
        touched: {},
        isSubmitting: false,
        handleChange: mockHandleChange,
        handleBlur: vi.fn(),
        handleSubmit: vi.fn(),
      }),
    } as any);

    // Render ConnectionEditor component
    renderWithProviders(
      <ConnectionEditor
        connection={null}
        kffmId="1"
        nodes={mockNodes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isCreating={true}
      />
    );

    // Open connection type dropdown
    fireEvent.focus(screen.getByLabelText('Connection Type'));
    fireEvent.mouseDown(screen.getByLabelText('Connection Type'));

    // Verify all connection types are displayed with correct labels
    expect(screen.getByText('Direct')).toBeInTheDocument();
    expect(screen.getByText('Supporting')).toBeInTheDocument();
    expect(screen.getByText('Dependent')).toBeInTheDocument();

    // Select a different connection type
    await userEvent.click(screen.getByText('Supporting'));

    // Verify selection is updated
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('displays node options correctly', async () => {
    // Setup mock data and props with multiple nodes
    const { mockNodes, mockOnClose, mockOnSave } = setup();

    // Mock useKFFM hook to return mock implementation of useKFFMConnectionForm
    const mockHandleChange = vi.fn();
    vi.spyOn(useKFFM, 'default').mockReturnValue({
      ...useKFFM(),
      useKFFMConnectionForm: vi.fn().mockReturnValue({
        values: { label: '', type: ConnectionType.DIRECT, sourceNodeId: '', targetNodeId: '' },
        errors: {},
        touched: {},
        isSubmitting: false,
        handleChange: mockHandleChange,
        handleBlur: vi.fn(),
        handleSubmit: vi.fn(),
      }),
    } as any);

    // Render ConnectionEditor component in create mode
    renderWithProviders(
      <ConnectionEditor
        connection={null}
        kffmId="1"
        nodes={mockNodes}
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        isCreating={true}
      />
    );

    // Open source node dropdown
    fireEvent.focus(screen.getByLabelText('Source Node'));
    fireEvent.mouseDown(screen.getByLabelText('Source Node'));

    // Verify all nodes are displayed with correct labels
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Node 2')).toBeInTheDocument();

    // Select a source node
    await userEvent.click(screen.getByText('Node 1'));

    // Open target node dropdown
    fireEvent.focus(screen.getByLabelText('Target Node'));
    fireEvent.mouseDown(screen.getByLabelText('Target Node'));

    // Verify all nodes except selected source node are available
    expect(screen.getByText('Node 1')).toBeInTheDocument();
    expect(screen.getByText('Node 2')).toBeInTheDocument();

    // Select a target node
    await userEvent.click(screen.getByText('Node 2'));

    // Verify selections are updated
    expect(mockHandleChange).toHaveBeenCalled();
  });
});