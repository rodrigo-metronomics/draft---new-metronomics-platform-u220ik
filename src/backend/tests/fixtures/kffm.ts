/**
 * Provides mock Key Function Flow Map (KFFM) data for testing purposes in the Metronomics Platform.
 * Contains predefined KFFM fixtures with various configurations, nodes, and connections
 * to support unit and integration tests.
 */

import {
  KFFM,
  KFFMNode,
  KFFMConnection,
  KFFMStatus,
  NodeType,
  ConnectionType
} from '../../src/types/kffm.types';
import { mockOrganization } from './organizations';
import { mockCEO, mockLeadership, mockTeamMember } from './users';
import { 
  mockRevenueMetric, 
  mockCustomerSatisfactionMetric, 
  mockNewCustomersMetric 
} from './metrics';

/**
 * Helper function to generate a mock KFFM with customizable properties
 * 
 * @param overrides - Optional partial KFFM object to override default values
 * @returns A mock KFFM object with default values overridden by provided properties
 */
export const generateMockKFFM = (overrides: Partial<KFFM> = {}): KFFM => {
  const defaultKFFM: KFFM = {
    id: 'kffm-123e4567-e89b-12d3-a456-426614174000',
    title: 'Company Function Flow Map',
    description: 'Key function flow map showing departmental relationships and responsibilities',
    version: 1,
    status: KFFMStatus.PUBLISHED,
    organizationId: mockOrganization.id,
    createdAt: new Date('2023-01-15T00:00:00Z'),
    updatedAt: new Date('2023-01-15T00:00:00Z'),
    nodes: []
  };

  return {
    ...defaultKFFM,
    ...overrides,
    nodes: [...(overrides.nodes || defaultKFFM.nodes)]
  };
};

/**
 * Helper function to generate a mock KFFM node with customizable properties
 * 
 * @param overrides - Optional partial KFFMNode object to override default values
 * @returns A mock KFFMNode object with default values overridden by provided properties
 */
export const generateMockKFFMNode = (overrides: Partial<KFFMNode> = {}): KFFMNode => {
  // Set up default owner reference based on ownerId
  const ownerId = overrides.ownerId || mockCEO.id;
  let owner;
  
  if (ownerId === mockCEO.id) {
    owner = { id: mockCEO.id, name: mockCEO.name };
  } else if (ownerId === mockLeadership.id) {
    owner = { id: mockLeadership.id, name: mockLeadership.name };
  } else if (ownerId === mockTeamMember.id) {
    owner = { id: mockTeamMember.id, name: mockTeamMember.name };
  } else {
    owner = { id: mockCEO.id, name: mockCEO.name };
  }

  const defaultNode: KFFMNode = {
    id: 'kffm-node-123e4567-e89b-12d3-a456-426614174000',
    title: 'Sample Department',
    description: 'A sample department node for testing',
    type: NodeType.DEPARTMENT,
    kffmId: 'kffm-123e4567-e89b-12d3-a456-426614174000',
    ownerId: mockCEO.id,
    owner: owner,
    positionX: 100,
    positionY: 100,
    metrics: [],
    createdAt: new Date('2023-01-15T00:00:00Z'),
    updatedAt: new Date('2023-01-15T00:00:00Z')
  };

  return {
    ...defaultNode,
    ...overrides,
    owner: overrides.owner || owner,
    metrics: [...(overrides.metrics || defaultNode.metrics)]
  };
};

/**
 * Helper function to generate a mock KFFM connection with customizable properties
 * 
 * @param overrides - Optional partial KFFMConnection object to override default values
 * @returns A mock KFFMConnection object with default values overridden by provided properties
 */
export const generateMockKFFMConnection = (overrides: Partial<KFFMConnection> = {}): KFFMConnection => {
  const defaultConnection: KFFMConnection = {
    id: 'kffm-connection-123e4567-e89b-12d3-a456-426614174000',
    label: 'Reports to',
    type: ConnectionType.DIRECT,
    kffmId: 'kffm-123e4567-e89b-12d3-a456-426614174000',
    sourceNodeId: 'kffm-node-source',
    targetNodeId: 'kffm-node-target',
    createdAt: new Date('2023-01-15T00:00:00Z'),
    updatedAt: new Date('2023-01-15T00:00:00Z')
  };

  return {
    ...defaultConnection,
    ...overrides
  };
};

/**
 * A single mock KFFM for simple test cases
 */
export const mockKFFM: KFFM = generateMockKFFM();

/**
 * A mock KFFM with predefined nodes for testing node-related functionality
 */
export const mockKFFMWithNodes: KFFM = generateMockKFFM({
  id: 'kffm-with-nodes',
  nodes: [
    generateMockKFFMNode({
      id: 'kffm-node-executive',
      title: 'Executive',
      description: 'Executive leadership department',
      type: NodeType.DEPARTMENT,
      kffmId: 'kffm-with-nodes',
      ownerId: mockCEO.id,
      positionX: 400,
      positionY: 100
    }),
    generateMockKFFMNode({
      id: 'kffm-node-marketing',
      title: 'Marketing',
      description: 'Marketing department',
      type: NodeType.DEPARTMENT,
      kffmId: 'kffm-with-nodes',
      ownerId: mockLeadership.id,
      positionX: 200,
      positionY: 300
    }),
    generateMockKFFMNode({
      id: 'kffm-node-sales',
      title: 'Sales',
      description: 'Sales department',
      type: NodeType.DEPARTMENT,
      kffmId: 'kffm-with-nodes',
      ownerId: mockLeadership.id,
      positionX: 600,
      positionY: 300
    }),
    generateMockKFFMNode({
      id: 'kffm-node-customer-service',
      title: 'Customer Service',
      description: 'Customer service and support',
      type: NodeType.FUNCTION,
      kffmId: 'kffm-with-nodes',
      ownerId: mockTeamMember.id,
      positionX: 600,
      positionY: 450
    })
  ]
});

// Define nodes for connections
const executiveNode = generateMockKFFMNode({
  id: 'kffm-node-executive-c',
  title: 'Executive',
  description: 'Executive leadership department',
  type: NodeType.DEPARTMENT,
  kffmId: 'kffm-with-connections',
  ownerId: mockCEO.id,
  positionX: 400,
  positionY: 100
});

const marketingNode = generateMockKFFMNode({
  id: 'kffm-node-marketing-c',
  title: 'Marketing',
  description: 'Marketing department',
  type: NodeType.DEPARTMENT,
  kffmId: 'kffm-with-connections',
  ownerId: mockLeadership.id,
  positionX: 200,
  positionY: 300
});

const salesNode = generateMockKFFMNode({
  id: 'kffm-node-sales-c',
  title: 'Sales',
  description: 'Sales department',
  type: NodeType.DEPARTMENT,
  kffmId: 'kffm-with-connections',
  ownerId: mockLeadership.id,
  positionX: 600,
  positionY: 300
});

const customerServiceNode = generateMockKFFMNode({
  id: 'kffm-node-customer-service-c',
  title: 'Customer Service',
  description: 'Customer service and support',
  type: NodeType.FUNCTION,
  kffmId: 'kffm-with-connections',
  ownerId: mockTeamMember.id,
  positionX: 600,
  positionY: 450
});

// Define connections
const executiveToMarketingConnection = generateMockKFFMConnection({
  id: 'kffm-connection-exec-marketing',
  label: 'Directs',
  type: ConnectionType.DIRECT,
  kffmId: 'kffm-with-connections',
  sourceNodeId: executiveNode.id,
  targetNodeId: marketingNode.id
});

const executiveToSalesConnection = generateMockKFFMConnection({
  id: 'kffm-connection-exec-sales',
  label: 'Directs',
  type: ConnectionType.DIRECT,
  kffmId: 'kffm-with-connections',
  sourceNodeId: executiveNode.id,
  targetNodeId: salesNode.id
});

const salesToCustomerServiceConnection = generateMockKFFMConnection({
  id: 'kffm-connection-sales-cs',
  label: 'Manages',
  type: ConnectionType.DIRECT,
  kffmId: 'kffm-with-connections',
  sourceNodeId: salesNode.id,
  targetNodeId: customerServiceNode.id
});

const marketingToSalesConnection = generateMockKFFMConnection({
  id: 'kffm-connection-marketing-sales',
  label: 'Supports',
  type: ConnectionType.SUPPORTING,
  kffmId: 'kffm-with-connections',
  sourceNodeId: marketingNode.id,
  targetNodeId: salesNode.id
});

/**
 * A mock KFFM with predefined nodes and connections for testing connection-related functionality
 */
export const mockKFFMWithConnections: KFFM = generateMockKFFM({
  id: 'kffm-with-connections',
  nodes: [
    executiveNode,
    marketingNode,
    salesNode,
    customerServiceNode
  ]
});

/**
 * A mock KFFM in DRAFT status for testing draft-specific functionality
 */
export const mockDraftKFFM: KFFM = generateMockKFFM({
  id: 'kffm-draft',
  title: 'Draft Function Flow Map',
  status: KFFMStatus.DRAFT
});

/**
 * A mock KFFM in PUBLISHED status for testing published-specific functionality
 */
export const mockPublishedKFFM: KFFM = generateMockKFFM({
  id: 'kffm-published',
  title: 'Published Function Flow Map',
  status: KFFMStatus.PUBLISHED
});

/**
 * A mock KFFM in ARCHIVED status for testing archived-specific functionality
 */
export const mockArchivedKFFM: KFFM = generateMockKFFM({
  id: 'kffm-archived',
  title: 'Archived Function Flow Map',
  status: KFFMStatus.ARCHIVED
});

/**
 * A single mock KFFM node for simple test cases
 */
export const mockKFFMNode: KFFMNode = generateMockKFFMNode();

/**
 * A mock KFFM node of type DEPARTMENT for testing department-specific functionality
 */
export const mockDepartmentNode: KFFMNode = generateMockKFFMNode({
  id: 'kffm-node-department',
  title: 'Marketing Department',
  type: NodeType.DEPARTMENT
});

/**
 * A mock KFFM node of type FUNCTION for testing function-specific functionality
 */
export const mockFunctionNode: KFFMNode = generateMockKFFMNode({
  id: 'kffm-node-function',
  title: 'Lead Generation',
  description: 'Marketing lead generation function',
  type: NodeType.FUNCTION
});

/**
 * A mock KFFM node of type PROCESS for testing process-specific functionality
 */
export const mockProcessNode: KFFMNode = generateMockKFFMNode({
  id: 'kffm-node-process',
  title: 'Customer Onboarding',
  description: 'Customer onboarding process',
  type: NodeType.PROCESS
});

/**
 * A mock KFFM node with associated metrics for testing metric-related functionality
 */
export const mockNodeWithMetrics: KFFMNode = generateMockKFFMNode({
  id: 'kffm-node-with-metrics',
  title: 'Sales Department',
  type: NodeType.DEPARTMENT,
  metrics: [
    {
      id: mockRevenueMetric.id,
      name: mockRevenueMetric.name,
      type: mockRevenueMetric.type
    },
    {
      id: mockCustomerSatisfactionMetric.id,
      name: mockCustomerSatisfactionMetric.name,
      type: mockCustomerSatisfactionMetric.type
    },
    {
      id: mockNewCustomersMetric.id,
      name: mockNewCustomersMetric.name,
      type: mockNewCustomersMetric.type
    }
  ]
});

/**
 * A single mock KFFM connection for simple test cases
 */
export const mockKFFMConnection: KFFMConnection = generateMockKFFMConnection();

/**
 * A mock KFFM connection of type DIRECT for testing direct connection functionality
 */
export const mockDirectConnection: KFFMConnection = generateMockKFFMConnection({
  id: 'kffm-connection-direct',
  label: 'Reports to',
  type: ConnectionType.DIRECT
});

/**
 * A mock KFFM connection of type SUPPORTING for testing supporting connection functionality
 */
export const mockSupportingConnection: KFFMConnection = generateMockKFFMConnection({
  id: 'kffm-connection-supporting',
  label: 'Supports',
  type: ConnectionType.SUPPORTING
});

/**
 * A mock KFFM connection of type DEPENDENT for testing dependent connection functionality
 */
export const mockDependentConnection: KFFMConnection = generateMockKFFMConnection({
  id: 'kffm-connection-dependent',
  label: 'Depends on',
  type: ConnectionType.DEPENDENT
});

/**
 * An array of multiple mock KFFMs for testing lists and filtering
 */
export const mockKFFMs: KFFM[] = [
  mockKFFM,
  mockKFFMWithNodes,
  mockKFFMWithConnections,
  mockDraftKFFM,
  mockPublishedKFFM,
  mockArchivedKFFM
];

/**
 * An array of multiple mock KFFM nodes for testing node operations
 */
export const mockKFFMNodes: KFFMNode[] = [
  mockKFFMNode,
  mockDepartmentNode,
  mockFunctionNode,
  mockProcessNode,
  mockNodeWithMetrics,
  executiveNode,
  marketingNode,
  salesNode,
  customerServiceNode
];

/**
 * An array of multiple mock KFFM connections for testing connection operations
 */
export const mockKFFMConnections: KFFMConnection[] = [
  mockKFFMConnection,
  mockDirectConnection,
  mockSupportingConnection,
  mockDependentConnection,
  executiveToMarketingConnection,
  executiveToSalesConnection,
  salesToCustomerServiceConnection,
  marketingToSalesConnection
];