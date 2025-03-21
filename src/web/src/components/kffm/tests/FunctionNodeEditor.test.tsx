import React from 'react'; // ^18.0.0
import { render, screen, waitFor, fireEvent } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { jest } from '@jest/globals'; // ^29.5.0

import FunctionNodeEditor from '../FunctionNodeEditor';
import { renderWithProviders } from '../../../tests/testUtils';
import * as useKFFMHook from '../../../hooks/useKFFM';
import * as useUsersHook from '../../../hooks/useUsers';
import * as useMetricsHook from '../../../hooks/useMetrics';
import { KFFMNode, NodeType } from '../../../types/kffm.types';

// Mock data for testing
const mockUsers = [
  { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { id: 'user2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
];

const mockMetrics = [
  { id: 'metric1', name: 'Revenue', type: 'FINANCIAL' },
  { id: 'metric2', name: 'Customer Satisfaction', type: 'CUSTOMER' },
];

const mockNode = {
  id: 'node1',
  title: 'Marketing',
  description: 'Marketing department',
  type: NodeType.DEPARTMENT,
  kffmId: 'kffm1',
  ownerId: 'user1',
  owner: { id: 'user1', name: 'John Doe' },
  positionX: 100,
  positionY: 200,
  metrics: [{ id: 'metric1', name: 'Revenue', type: 'FINANCIAL' }],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
} as KFFMNode;

const mockCreateKFFMNode = jest.fn().mockResolvedValue({ id: 'new-node-id' });
const mockUpdateKFFMNode = jest.fn().mockResolvedValue({ id: 'node1' });

const mockUseKFFMNodeForm = jest.fn().mockReturnValue({
  values: {},
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  handleSubmit: jest.fn(),
  setFieldValue: jest.fn(),
  resetForm: jest.fn(),
  isSubmitting: false,
});

// Setup function to configure mocks before each test
const setup = () => {
  // Mock useKFFM hook to return test data and mock functions
  jest.spyOn(useKFFMHook, 'useKFFM').mockReturnValue({
    kffms: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    getKFFM: jest.fn(),
    getLatestKFFM: jest.fn(),
    createKFFM: jest.fn(),
    updateKFFM: jest.fn(),
    updateKFFMStatus: jest.fn(),
    deleteKFFM: jest.fn(),
    getKFFMNodes: jest.fn(),
    getKFFMNode: jest.fn(),
    createKFFMNode: mockCreateKFFMNode,
    updateKFFMNode: mockUpdateKFFMNode,
    updateNodePosition: jest.fn(),
    deleteKFFMNode: jest.fn(),
    getKFFMConnections: jest.fn(),
    getKFFMConnection: jest.fn(),
    createKFFMConnection: jest.fn(),
    updateKFFMConnection: jest.fn(),
    deleteKFFMConnection: jest.fn(),
    getNodeMetrics: jest.fn(),
    updateNodeMetrics: jest.fn(),
    useKFFMForm: jest.fn(),
    useKFFMNodeForm: mockUseKFFMNodeForm,
    useKFFMConnectionForm: jest.fn(),
    useCanvasState: jest.fn(),
    useDragAndDrop: jest.fn(),
  } as any);

  // Mock useUsers hook to return test user data
  jest.spyOn(useUsersHook, 'useUsers').mockReturnValue({
    users: mockUsers as any,
    isLoading: false,
    isError: false,
    error: null,
    pagination: null,
    refetch: jest.fn(),
    getUserById: jest.fn(),
    getCurrentUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deactivateUser: jest.fn(),
    activateUser: jest.fn(),
    deleteUser: jest.fn(),
    inviteUser: jest.fn(),
    resendInvitation: jest.fn(),
    cancelInvitation: jest.fn(),
    getPendingInvitations: jest.fn(),
    uploadProfileImage: jest.fn(),
    getUsersByTeam: jest.fn(),
    useUserForm: jest.fn(),
    useUserInviteForm: jest.fn(),
  } as any);

  // Mock useMetrics hook to return test metric data
  jest.spyOn(useMetricsHook, 'useMetrics').mockReturnValue({
    metrics: mockMetrics as any,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    getMetricById: jest.fn(),
    getMetricWithValues: jest.fn(),
    createMetric: jest.fn(),
    updateMetric: jest.fn(),
    deleteMetric: jest.fn(),
    recordMetricValue: jest.fn(),
    getMetricValues: jest.fn(),
    deleteMetricValue: jest.fn(),
    createMetricThreshold: jest.fn(),
    updateMetricThreshold: jest.fn(),
    deleteMetricThreshold: jest.fn(),
    getDashboardMetrics: jest.fn(),
    exportMetrics: jest.fn(),
    getMetricsByGoal: jest.fn(),
    getMetricsByTeam: jest.fn(),
    useMetricForm: jest.fn(),
    useMetricValueForm: jest.fn(),
    useMetricThresholdForm: jest.fn(),
  } as any);
};

describe('FunctionNodeEditor', () => {
  beforeEach(() => {
    setup();
  });

  it('renders correctly in create mode', () => {
    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={true} node={null} kffmId="kffm1" onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText('Create Function Node')).toBeInTheDocument();
    expect(screen.getByLabelText('Title').value).toBe('');
    expect(screen.getByLabelText('Description').value).toBe('');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders correctly in edit mode', () => {
    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={false} node={mockNode} kffmId="kffm1" onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText('Edit Function Node')).toBeInTheDocument();
    expect(screen.getByLabelText('Title').value).toBe(mockNode.title);
    expect(screen.getByLabelText('Description').value).toBe(mockNode.description);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={true} node={null} kffmId="kffm1" onClose={() => {}} onSave={() => {}} />);
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText('The field \'Title\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Type\' is required.')).toBeInTheDocument();
      expect(screen.getByText('The field \'Owner\' is required.')).toBeInTheDocument();
    });
  });

  it('handles form submission in create mode', async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={true} node={null} kffmId="kffm1" onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Node' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Node description' } });
    fireEvent.click(screen.getByLabelText('Type'));
    fireEvent.click(await screen.findByText('Function'));
    fireEvent.click(screen.getByLabelText('Owner'));
    fireEvent.click(await screen.findByText('John Doe'));

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateKFFMNode).toHaveBeenCalled();
      expect(onSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles form submission in edit mode', async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={false} node={mockNode} kffmId="kffm1" onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated description' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateKFFMNode).toHaveBeenCalled();
      expect(onSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles cancel button click', () => {
    const onClose = jest.fn();
    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={true} node={null} kffmId="kffm1" onClose={onClose} onSave={() => {}} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalled();
    expect(mockCreateKFFMNode).not.toHaveBeenCalled();
    expect(mockUpdateKFFMNode).not.toHaveBeenCalled();
  });

  it('displays loading state during submission', async () => {
    jest.spyOn(useKFFMHook, 'useKFFM').mockReturnValue({
      ...useKFFMHook.useKFFM(),
      createKFFMNode: jest.fn().mockReturnValue({
        mutate: jest.fn().mockReturnValue(new Promise(() => {})),
        isLoading: true,
      }),
    } as any);

    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={true} node={null} kffmId="kffm1" onClose={() => {}} onSave={() => {}} />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Node' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Node description' } });
    fireEvent.click(screen.getByLabelText('Type'));
    fireEvent.click(await screen.findByText('Function'));
    fireEvent.click(screen.getByLabelText('Owner'));
    fireEvent.click(await screen.findByText('John Doe'));
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('handles error during submission', async () => {
    jest.spyOn(useKFFMHook, 'useKFFM').mockReturnValue({
      ...useKFFMHook.useKFFM(),
      createKFFMNode: jest.fn().mockReturnValue({
        mutate: jest.fn().mockRejectedValue(new Error('Submission failed')),
        isLoading: false,
      }),
    } as any);

    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={true} node={null} kffmId="kffm1" onClose={() => {}} onSave={() => {}} />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Node' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Node description' } });
    fireEvent.click(screen.getByLabelText('Type'));
    fireEvent.click(await screen.findByText('Function'));
    fireEvent.click(screen.getByLabelText('Owner'));
    fireEvent.click(await screen.findByText('John Doe'));
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });

  it('populates owner dropdown with users', async () => {
    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={true} node={null} kffmId="kffm1" onClose={() => {}} onSave={() => {}} />);
    fireEvent.click(screen.getByLabelText('Owner'));
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('populates metrics multiselect with metrics', async () => {
    renderWithProviders(<FunctionNodeEditor isOpen={true} isCreating={true} node={null} kffmId="kffm1" onClose={() => {}} onSave={() => {}} />);
    const multiselect = screen.getByText('Select Metrics');
    fireEvent.click(multiselect);
    await waitFor(() => {
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument();
    });
  });
});