import request from 'supertest'; // version ^6.3.3
import jwt from 'jsonwebtoken'; // version ^9.0.0
import { app } from '../../src/app';
import { kffmService } from '../../src/services/kffm';
import { kffmNodeService } from '../../src/services/kffm/kffmNodeService';
import { kffmConnectionService } from '../../src/services/kffm/kffmConnectionService';
import { prismaMock } from '../mocks/prismaMock';
import { firestore } from '../mocks/firebaseMock';
import {
  KFFM,
  KFFMNode,
  KFFMConnection,
  KFFMStatus,
  NodeType,
  ConnectionType,
} from '../../src/types/kffm.types';
import { Permission } from '../../src/utils/constants/permissions';
import { generateMockKFFM, generateMockKFFMNode, generateMockKFFMConnection, mockKFFM, mockKFFMWithNodes, mockKFFMWithConnections, mockKFFMNode, mockKFFMConnection } from '../fixtures/kffm';
import { mockUsers } from '../fixtures/users';
import { mockOrganizations } from '../fixtures/organizations';
import { mockMetrics } from '../fixtures/metrics';

// Define types for helper functions
type KFFMSetup = (kffmData: Partial<KFFM>) => Promise<KFFM>;
type NodeSetup = (kffmId: string, nodesData: Partial<KFFMNode>[]) => Promise<KFFMNode[]>;
type ConnectionSetup = (kffmId: string, connectionsData: Partial<KFFMConnection>[]) => Promise<KFFMConnection[]>;
type TokenGenerator = (userData: any) => string;

/**
 * Helper function to set up a test KFFM in the database
 * @param kffmData 
 * @returns {Promise<KFFM>} The created test KFFM
 */
const setupTestKFFM: KFFMSetup = async (kffmData: Partial<KFFM>) => {
  // Set up mock Prisma KFFM with provided data
  prismaMock.kffm.create.mockResolvedValue(kffmData as KFFM);

  // Set up mock Firestore KFFM document
  firestore.collection.mockReturnValue({
    doc: jest.fn().mockReturnValue({
      set: jest.fn()
    })
  } as any);

  // Return the created KFFM object
  return kffmService.createKFFM(kffmData as any);
};

/**
 * Helper function to set up test nodes for a KFFM
 * @param kffmId 
 * @param nodesData 
 * @returns {Promise<KFFMNode[]>} The created test nodes
 */
const setupTestNodes: NodeSetup = async (kffmId: string, nodesData: Partial<KFFMNode>[]) => {
  // Set up mock Prisma KFFM nodes with provided data
  prismaMock.kffmNode.createMany.mockResolvedValue({ count: nodesData.length });

  // Set up mock Firestore node documents
  firestore.collection.mockReturnValue({
    doc: jest.fn().mockReturnValue({
      set: jest.fn()
    })
  } as any);

  // Return the created node objects
  return kffmNodeService.createNodes(kffmId, nodesData as any);
};

/**
 * Helper function to set up test connections for a KFFM
 * @param kffmId 
 * @param connectionsData 
 * @returns {Promise<KFFMConnection[]>} The created test connections
 */
const setupTestConnections: ConnectionSetup = async (kffmId: string, connectionsData: Partial<KFFMConnection>[]) => {
  // Set up mock Prisma KFFM connections with provided data
  prismaMock.kffmConnection.createMany.mockResolvedValue({ count: connectionsData.length });

  // Set up mock Firestore connection documents
  firestore.collection.mockReturnValue({
    doc: jest.fn().mockReturnValue({
      set: jest.fn()
    })
  } as any);

  // Return the created connection objects
  return kffmConnectionService.createConnections(kffmId, connectionsData as any);
};

/**
 * Helper function to generate a valid JWT token for testing
 * @param userData 
 * @returns {string} A valid JWT token
 */
const generateTestToken: TokenGenerator = (userData: any) => {
  // Create a payload with user data including ID, role, permissions, and organization
  const payload = {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    organizationId: userData.organizationId,
    permissions: userData.permissions,
  };

  // Sign the payload with the test JWT secret
  const token = jwt.sign(payload, 'test-secret');

  // Return the signed token
  return token;
};