import { get, post, put, delete as deleteRequest } from './index';
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
  KFFMQueryParams 
} from '../../types/kffm.types';
import { ApiResponse, PaginatedApiResponse } from '../../types/api.types';
import { ID } from '../../types/common.types';

/**
 * Fetches a list of KFFMs based on provided query parameters
 * @param params Query parameters for filtering KFFMs
 * @returns Promise resolving to a list of KFFMs
 */
const getKFFMs = (params: KFFMQueryParams): Promise<ApiResponse<KFFM[]>> => {
  return get<KFFM[]>('/api/kffm', params);
};

/**
 * Fetches a single KFFM by its ID
 * @param id The ID of the KFFM to fetch
 * @param includeNodes Whether to include nodes in the response
 * @param includeConnections Whether to include connections in the response
 * @returns Promise resolving to the requested KFFM
 */
const getKFFMById = (
  id: ID,
  includeNodes: boolean = false,
  includeConnections: boolean = false
): Promise<ApiResponse<KFFM>> => {
  const params = {
    includeNodes,
    includeConnections
  };
  return get<KFFM>(`/api/kffm/${id}`, params);
};

/**
 * Creates a new KFFM
 * @param kffmData The data for the new KFFM
 * @returns Promise resolving to the newly created KFFM
 */
const createKFFM = (kffmData: CreateKFFMDto): Promise<ApiResponse<KFFM>> => {
  return post<KFFM>('/api/kffm', kffmData);
};

/**
 * Updates an existing KFFM
 * @param id The ID of the KFFM to update
 * @param kffmData The updated KFFM data
 * @returns Promise resolving to the updated KFFM
 */
const updateKFFM = (id: ID, kffmData: UpdateKFFMDto): Promise<ApiResponse<KFFM>> => {
  return put<KFFM>(`/api/kffm/${id}`, kffmData);
};

/**
 * Updates only the status of a KFFM
 * @param id The ID of the KFFM to update
 * @param status The new status for the KFFM
 * @returns Promise resolving to the updated KFFM
 */
const updateKFFMStatus = (id: ID, status: KFFMStatus): Promise<ApiResponse<KFFM>> => {
  return put<KFFM>(`/api/kffm/${id}/status`, { status });
};

/**
 * Deletes a KFFM
 * @param id The ID of the KFFM to delete
 * @returns Promise resolving when the KFFM is deleted
 */
const deleteKFFM = (id: ID): Promise<ApiResponse<void>> => {
  return deleteRequest<void>(`/api/kffm/${id}`);
};

/**
 * Fetches nodes for a specific KFFM
 * @param kffmId The ID of the KFFM to fetch nodes for
 * @returns Promise resolving to a list of KFFM nodes
 */
const getKFFMNodes = (kffmId: ID): Promise<ApiResponse<KFFMNode[]>> => {
  return get<KFFMNode[]>(`/api/kffm/${kffmId}/nodes`);
};

/**
 * Fetches a single KFFM node by its ID
 * @param id The ID of the node to fetch
 * @returns Promise resolving to the requested KFFM node
 */
const getNodeById = (id: ID): Promise<ApiResponse<KFFMNode>> => {
  return get<KFFMNode>(`/api/kffm-nodes/${id}`);
};

/**
 * Creates a new KFFM node
 * @param nodeData The data for the new node
 * @returns Promise resolving to the newly created KFFM node
 */
const createNode = (nodeData: CreateKFFMNodeDto): Promise<ApiResponse<KFFMNode>> => {
  return post<KFFMNode>('/api/kffm-nodes', nodeData);
};

/**
 * Updates an existing KFFM node
 * @param id The ID of the node to update
 * @param nodeData The updated node data
 * @returns Promise resolving to the updated KFFM node
 */
const updateNode = (id: ID, nodeData: UpdateKFFMNodeDto): Promise<ApiResponse<KFFMNode>> => {
  return put<KFFMNode>(`/api/kffm-nodes/${id}`, nodeData);
};

/**
 * Updates only the position of a KFFM node
 * @param id The ID of the node to update
 * @param positionX The new X coordinate
 * @param positionY The new Y coordinate
 * @returns Promise resolving to the updated KFFM node
 */
const updateNodePosition = (
  id: ID,
  positionX: number,
  positionY: number
): Promise<ApiResponse<KFFMNode>> => {
  return put<KFFMNode>(`/api/kffm-nodes/${id}/position`, { positionX, positionY });
};

/**
 * Deletes a KFFM node
 * @param id The ID of the node to delete
 * @returns Promise resolving when the KFFM node is deleted
 */
const deleteNode = (id: ID): Promise<ApiResponse<void>> => {
  return deleteRequest<void>(`/api/kffm-nodes/${id}`);
};

/**
 * Fetches connections for a specific KFFM
 * @param kffmId The ID of the KFFM to fetch connections for
 * @returns Promise resolving to a list of KFFM connections
 */
const getKFFMConnections = (kffmId: ID): Promise<ApiResponse<KFFMConnection[]>> => {
  return get<KFFMConnection[]>(`/api/kffm/${kffmId}/connections`);
};

/**
 * Fetches a single KFFM connection by its ID
 * @param id The ID of the connection to fetch
 * @returns Promise resolving to the requested KFFM connection
 */
const getConnectionById = (id: ID): Promise<ApiResponse<KFFMConnection>> => {
  return get<KFFMConnection>(`/api/kffm-connections/${id}`);
};

/**
 * Creates a new KFFM connection between nodes
 * @param connectionData The data for the new connection
 * @returns Promise resolving to the newly created KFFM connection
 */
const createConnection = (
  connectionData: CreateKFFMConnectionDto
): Promise<ApiResponse<KFFMConnection>> => {
  return post<KFFMConnection>('/api/kffm-connections', connectionData);
};

/**
 * Updates an existing KFFM connection
 * @param id The ID of the connection to update
 * @param connectionData The updated connection data
 * @returns Promise resolving to the updated KFFM connection
 */
const updateConnection = (
  id: ID,
  connectionData: UpdateKFFMConnectionDto
): Promise<ApiResponse<KFFMConnection>> => {
  return put<KFFMConnection>(`/api/kffm-connections/${id}`, connectionData);
};

/**
 * Deletes a KFFM connection
 * @param id The ID of the connection to delete
 * @returns Promise resolving when the KFFM connection is deleted
 */
const deleteConnection = (id: ID): Promise<ApiResponse<void>> => {
  return deleteRequest<void>(`/api/kffm-connections/${id}`);
};

/**
 * Fetches all connections for a specific node
 * @param nodeId The ID of the node to fetch connections for
 * @returns Promise resolving to incoming and outgoing connections for the node
 */
const getNodeConnections = (
  nodeId: ID
): Promise<ApiResponse<{ incoming: KFFMConnection[]; outgoing: KFFMConnection[] }>> => {
  return get<{ incoming: KFFMConnection[]; outgoing: KFFMConnection[] }>(
    `/api/kffm-nodes/${nodeId}/connections`
  );
};

/**
 * Exports a KFFM to a specified format
 * @param id The ID of the KFFM to export
 * @param format The desired export format
 * @returns Promise resolving to the URL of the exported file
 */
const exportKFFM = (
  id: ID,
  format: 'pdf' | 'png' | 'svg'
): Promise<ApiResponse<{ fileUrl: string }>> => {
  return get<{ fileUrl: string }>(`/api/kffm/${id}/export`, { format });
};

// Export all KFFM API functions
export const kffmApi = {
  getKFFMs,
  getKFFMById,
  createKFFM,
  updateKFFM,
  updateKFFMStatus,
  deleteKFFM,
  getKFFMNodes,
  getNodeById,
  createNode,
  updateNode,
  updateNodePosition,
  deleteNode,
  getKFFMConnections,
  getConnectionById,
  createConnection,
  updateConnection,
  deleteConnection,
  getNodeConnections,
  exportKFFM
};