import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query'; // react-query@^5.x
import { useState, useCallback, useEffect, useRef } from 'react'; // react@^18.x

import {
  KFFM,
  KFFMNode,
  KFFMConnection,
  KFFMStatus,
  NodeType,
  ConnectionType,
  CreateKFFMDto,
  UpdateKFFMDto,
  CreateKFFMNodeDto,
  UpdateKFFMNodeDto,
  CreateKFFMConnectionDto,
  UpdateKFFMConnectionDto,
  KFFMQueryParams,
  KFFMEditorMode,
  CanvasPosition,
  DragItem,
  ConnectionPoint,
} from '../types/kffm.types';
import { ID } from '../types/common.types';
import { kffmApi } from '../services/api/kffmApi';
import { useAuth } from './useAuth';
import { useForm } from './useForm';
import { useOrganizationContext } from '../contexts/OrganizationContext';

/**
 * Custom hook for managing KFFM data and operations
 * @param options 
 * @returns KFFM data and operations including queries, mutations, and utility functions
 */
export const useKFFM = (options?: UseQueryOptions<KFFM[]>) => {
  // Initialize React Query client for cache management
  const queryClient = useQueryClient();

  // Get current organization ID from authentication state
  const { state: authState } = useAuth();

  // Get current organization from organization context
  const { currentOrganization } = useOrganizationContext();

  // Define query key factory functions for consistent cache management
  const organizationId = currentOrganization?.id;
  const organizationIdStr = String(organizationId);

  const organizationIdExists = !!organizationId;

  const kffmQueryKeys = {
    all: () => ['kffm', organizationIdStr] as const,
    lists: (filters: KFFMQueryParams) =>
      [...kffmQueryKeys.all(), 'list', filters] as const,
    details: () => [...kffmQueryKeys.all(), 'detail'] as const,
    detail: (id: ID) => [...kffmQueryKeys.details(), id] as const,
  };

  // Implement useGetKFFMs query for fetching KFFMs with filters
  const useGetKFFMs = (filters: KFFMQueryParams, queryOptions?: UseQueryOptions<KFFM[]>) => {
    return useQuery<KFFM[]>(
      kffmQueryKeys.lists(filters),
      () => kffmApi.getKFFMs(filters).then(res => res.data),
      {
        enabled: organizationIdExists,
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetKFFM query for fetching a single KFFM by ID
  const useGetKFFM = (id: ID, queryOptions?: UseQueryOptions<KFFM>) => {
    return useQuery<KFFM>(
      kffmQueryKeys.detail(id),
      () => kffmApi.getKFFMById(id).then(res => res.data),
      {
        enabled: organizationIdExists,
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetLatestKFFM query for fetching the latest KFFM for an organization
  const useGetLatestKFFM = (queryOptions?: UseQueryOptions<KFFM>) => {
    return useQuery<KFFM>(
      [...kffmQueryKeys.all(), 'latest'],
      () => kffmApi.getLatestKFFM().then(res => res.data),
      {
        enabled: organizationIdExists,
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateKFFM mutation for creating new KFFMs
  const createKFFM = useMutation(
    (kffmData: CreateKFFMDto) => kffmApi.createKFFM(kffmData).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useUpdateKFFM mutation for updating existing KFFMs
  const updateKFFM = useMutation(
    ({ id, kffmData }: { id: ID, kffmData: UpdateKFFMDto }) =>
      kffmApi.updateKFFM(id, kffmData).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useUpdateKFFMStatus mutation for updating KFFM status
  const updateKFFMStatus = useMutation(
    ({ id, status }: { id: ID, status: KFFMStatus }) =>
      kffmApi.updateKFFMStatus(id, status).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useDeleteKFFM mutation for deleting KFFMs
  const deleteKFFM = useMutation(
    (id: ID) => kffmApi.deleteKFFM(id).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useGetKFFMNodes query for fetching nodes for a specific KFFM
  const useGetKFFMNodes = (kffmId: ID, queryOptions?: UseQueryOptions<KFFMNode[]>) => {
    return useQuery<KFFMNode[]>(
      [...kffmQueryKeys.all(), 'nodes', kffmId],
      () => kffmApi.getKFFMNodes(kffmId).then(res => res.data),
      {
        enabled: organizationIdExists,
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetKFFMNode query for fetching a single node by ID
  const useGetKFFMNode = (id: ID, queryOptions?: UseQueryOptions<KFFMNode>) => {
    return useQuery<KFFMNode>(
      [...kffmQueryKeys.all(), 'node', id],
      () => kffmApi.getNodeById(id).then(res => res.data),
      {
        enabled: organizationIdExists,
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateKFFMNode mutation for creating new nodes
  const createKFFMNode = useMutation(
    (nodeData: CreateKFFMNodeDto) => kffmApi.createNode(nodeData).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useUpdateKFFMNode mutation for updating existing nodes
  const updateKFFMNode = useMutation(
    ({ id, nodeData }: { id: ID, nodeData: UpdateKFFMNodeDto }) =>
      kffmApi.updateNode(id, nodeData).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useUpdateNodePosition mutation for updating only node positions
  const updateNodePosition = useMutation(
    ({ id, positionX, positionY }: { id: ID, positionX: number, positionY: number }) =>
      kffmApi.updateNodePosition(id, positionX, positionY).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useDeleteKFFMNode mutation for deleting nodes
  const deleteKFFMNode = useMutation(
    (id: ID) => kffmApi.deleteNode(id).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useGetKFFMConnections query for fetching connections for a specific KFFM
  const useGetKFFMConnections = (kffmId: ID, queryOptions?: UseQueryOptions<KFFMConnection[]>) => {
    return useQuery<KFFMConnection[]>(
      [...kffmQueryKeys.all(), 'connections', kffmId],
      () => kffmApi.getKFFMConnections(kffmId).then(res => res.data),
      {
        enabled: organizationIdExists,
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetKFFMConnection query for fetching a single connection by ID
  const useGetKFFMConnection = (id: ID, queryOptions?: UseQueryOptions<KFFMConnection>) => {
    return useQuery<KFFMConnection>(
      [...kffmQueryKeys.all(), 'connection', id],
      () => kffmApi.getConnectionById(id).then(res => res.data),
      {
        enabled: organizationIdExists,
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateKFFMConnection mutation for creating new connections
  const createKFFMConnection = useMutation(
    (connectionData: CreateKFFMConnectionDto) => kffmApi.createConnection(connectionData).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useUpdateKFFMConnection mutation for updating existing connections
  const updateKFFMConnection = useMutation(
    ({ id, connectionData }: { id: ID, connectionData: UpdateKFFMConnectionDto }) =>
      kffmApi.updateConnection(id, connectionData).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useDeleteKFFMConnection mutation for deleting connections
  const deleteKFFMConnection = useMutation(
    (id: ID) => kffmApi.deleteConnection(id).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );
  
  // Implement useGetNodeMetrics query for fetching metrics associated with a node
  const useGetNodeMetrics = (nodeId: ID, queryOptions?: UseQueryOptions<any>) => {
    return useQuery<any>(
      [...kffmQueryKeys.all(), 'nodeMetrics', nodeId],
      () => kffmApi.getNodeMetrics(nodeId).then(res => res.data),
      {
        enabled: organizationIdExists,
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useUpdateNodeMetrics mutation for updating metrics associated with a node
  const updateNodeMetrics = useMutation(
    ({ nodeId, metricIds }: { nodeId: ID, metricIds: ID[] }) =>
      kffmApi.updateNodeMetrics(nodeId, metricIds).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(kffmQueryKeys.all());
      },
    }
  );

  // Implement useKFFMForm hook for KFFM form state management
  const useKFFMFormHook = (initialValues: CreateKFFMDto) => {
    return useKFFMForm(initialValues, async (values: CreateKFFMDto) => {
      console.log('KFFM form submitted', values);
    });
  };

  // Implement useKFFMNodeForm hook for node form state management
  const useKFFMNodeFormHook = (initialValues: CreateKFFMNodeDto) => {
    return useKFFMNodeForm(initialValues, async (values: CreateKFFMNodeDto) => {
      console.log('KFFM node form submitted', values);
    });
  };

  // Implement useKFFMConnectionForm hook for connection form state management
  const useKFFMConnectionFormHook = (initialValues: CreateKFFMConnectionDto) => {
    return useKFFMConnectionForm(initialValues, async (values: CreateKFFMConnectionDto) => {
      console.log('KFFM connection form submitted', values);
    });
  };

    // Implement useCanvasState hook for managing canvas position and zoom
    const useCanvasStateHook = (initialPosition: CanvasPosition) => {
      return useCanvasState(initialPosition);
    };
  
    // Implement useDragAndDrop hook for handling drag and drop operations in the KFFM editor
    const useDragAndDropHook = () => {
      return useDragAndDrop();
    };

  // Return all queries, mutations, and utility functions
  return {
    kffms: fetchedOrganizations,
    isLoading: isOrganizationsLoading,
    isError: organizationsError !== null,
    error: organizationsError,
    refetch: () => queryClient.refetchQueries(kffmQueryKeys.all()),
    getKFFM: useGetKFFM,
    getLatestKFFM: useGetLatestKFFM,
    createKFFM: createKFFM.mutate,
    updateKFFM: updateKFFM.mutate,
    updateKFFMStatus: updateKFFMStatus.mutate,
    deleteKFFM: deleteKFFM.mutate,
    getKFFMNodes: useGetKFFMNodes,
    getKFFMNode: useGetKFFMNode,
    createKFFMNode: createKFFMNode.mutate,
    updateKFFMNode: updateKFFMNode.mutate,
    updateNodePosition: updateNodePosition.mutate,
    deleteKFFMNode: deleteKFFMNode.mutate,
    getKFFMConnections: useGetKFFMConnections,
    getKFFMConnection: useGetKFFMConnection,
    createKFFMConnection: createKFFMConnection.mutate,
    updateKFFMConnection: updateKFFMConnection.mutate,
    deleteKFFMConnection: deleteKFFMConnection.mutate,
    getNodeMetrics: useGetNodeMetrics,
    updateNodeMetrics: updateNodeMetrics.mutate,
    useKFFMForm: useKFFMFormHook,
    useKFFMNodeForm: useKFFMNodeFormHook,
    useKFFMConnectionForm: useKFFMConnectionFormHook,
    useCanvasState: useCanvasStateHook,
    useDragAndDrop: useDragAndDropHook
  };
};

/**
 * Custom hook for managing KFFM form state
 * @param initialValues 
 * @param onSubmit 
 * @returns Form state and handlers for KFFM form
 */
export const useKFFMForm = (initialValues: CreateKFFMDto, onSubmit: (values: CreateKFFMDto) => void) => {
  // Define validation rules for KFFM form fields
  const validationRules = {
    title: { required: true, minLength: 3 },
    description: { required: false },
  };

  // Initialize form state using useForm hook
  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, resetForm } = useForm({
    initialValues,
    validationRules,
    onSubmit,
  });

  // Return form state and handlers
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  };
};

/**
 * Custom hook for managing KFFM node form state
 * @param initialValues 
 * @param onSubmit 
 * @returns Form state and handlers for KFFM node form
 */
export const useKFFMNodeForm = (initialValues: CreateKFFMNodeDto, onSubmit: (values: CreateKFFMNodeDto) => void) => {
  // Define validation rules for KFFM node form fields
  const validationRules = {
    title: { required: true, minLength: 3 },
    description: { required: false },
    type: { required: true },
    ownerId: { required: true },
  };

  // Initialize form state using useForm hook
  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, resetForm } = useForm({
    initialValues,
    validationRules,
    onSubmit,
  });

  // Return form state and handlers
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  };
};

/**
 * Custom hook for managing KFFM connection form state
 * @param initialValues 
 * @param onSubmit 
 * @returns Form state and handlers for KFFM connection form
 */
export const useKFFMConnectionForm = (initialValues: CreateKFFMConnectionDto, onSubmit: (values: CreateKFFMConnectionDto) => void) => {
  // Define validation rules for KFFM connection form fields
  const validationRules = {
    label: { required: true, minLength: 3 },
    type: { required: true },
    sourceNodeId: { required: true },
    targetNodeId: { required: true },
  };

  // Initialize form state using useForm hook
  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, resetForm } = useForm({
    initialValues,
    validationRules,
    onSubmit,
  });

  // Return form state and handlers
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  };
};

/**
 * Custom hook for managing KFFM canvas state
 * @param initialPosition 
 * @returns Canvas position, zoom level, and related functions
 */
export const useCanvasState = (initialPosition: CanvasPosition) => {
  // Initialize canvas position state
  const [position, setPosition] = useState<CanvasPosition>(initialPosition);

  // Initialize zoom level state
  const [zoom, setZoom] = useState<number>(1);

  /**
   * Implement pan function for moving the canvas
   * @param deltaX 
   * @param deltaY 
   */
  const pan = (deltaX: number, deltaY: number) => {
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  };

  /**
   * Implement zoom function for zooming in/out
   * @param scaleFactor 
   */
  const zoomFn = (scaleFactor: number) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev * scaleFactor)));
  };

  /**
   * Implement reset function for resetting to initial position
   */
  const reset = () => {
    setPosition(initialPosition);
    setZoom(1);
  };

  // Return canvas state and functions
  return {
    position,
    zoom,
    pan,
    zoomFn,
    reset,
  };
};

/**
 * Custom hook for handling drag and drop operations in the KFFM editor
 * @param options 
 * @returns Drag and drop state and handlers
 */
export const useDragAndDrop = () => {
  // Initialize drag state for tracking dragged items
  const [dragItem, setDragItem] = useState<DragItem | null>(null);

  // Initialize drop targets state
  const [dropTargets, setDropTargets] = useState<ID[]>([]);

  /**
   * Implement handleDragStart function
   * @param item 
   */
  const handleDragStart = (item: DragItem) => {
    setDragItem(item);
  };

  /**
   * Implement handleDragOver function
   * @param event 
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  /**
   * Implement handleDrop function
   * @param event 
   * @param targetId 
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetId: ID) => {
    event.preventDefault();
    console.log(`Dropped ${dragItem?.type} ${dragItem?.id} on target ${targetId}`);
    setDragItem(null);
    setDropTargets(prev => [...prev, targetId]);
  };

  /**
   * Implement handleDragEnd function
   */
  const handleDragEnd = () => {
    setDragItem(null);
  };

  // Return drag and drop state and handlers
  return {
    dragItem,
    dropTargets,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
};