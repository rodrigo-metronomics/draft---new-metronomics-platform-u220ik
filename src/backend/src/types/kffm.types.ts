/**
 * TypeScript type definitions for Key Function Flow Map (KFFM) entities in the Metronomics Platform.
 * This file defines interfaces, enums, and DTOs for managing organizational structure visualization
 * through function flow maps that illustrate departmental ownership and accountability.
 */

import { UserReference } from './user.types';
import { MetricReference } from './metric.types';

/**
 * Enum representing the possible statuses of a KFFM
 */
export enum KFFMStatus {
  DRAFT = 'DRAFT',          // Initial working version, not yet published
  PUBLISHED = 'PUBLISHED',  // Published version visible to the organization 
  ARCHIVED = 'ARCHIVED'     // Historical version no longer active
}

/**
 * Enum representing the possible types of KFFM nodes
 */
export enum NodeType {
  DEPARTMENT = 'DEPARTMENT', // Organizational department (e.g., Marketing, Sales)
  FUNCTION = 'FUNCTION',     // Business function (e.g., Lead Generation, Customer Support)
  PROCESS = 'PROCESS'        // Specific process (e.g., Order Fulfillment)
}

/**
 * Enum representing the possible types of connections between KFFM nodes
 */
export enum ConnectionType {
  DIRECT = 'DIRECT',           // Direct responsibility or ownership
  SUPPORTING = 'SUPPORTING',   // Supporting or auxiliary relationship
  DEPENDENT = 'DEPENDENT'      // Dependency relationship
}

/**
 * Interface representing a Key Function Flow Map entity
 */
export interface KFFM {
  id: string;                  // Unique identifier
  title: string;               // Map title
  description: string;         // Detailed description
  version: number;             // Version number for tracking changes
  status: KFFMStatus;          // Current status of the map
  organizationId: string;      // Organization this map belongs to
  createdAt: Date;             // When the map was created
  updatedAt: Date;             // When the map was last updated
  nodes: KFFMNode[];           // Array of nodes in this map
}

/**
 * Interface representing a node in a Key Function Flow Map
 */
export interface KFFMNode {
  id: string;                  // Unique identifier
  title: string;               // Node title
  description: string;         // Detailed description
  type: NodeType;              // Type of node (Department, Function, Process)
  kffmId: string;              // Parent KFFM ID
  ownerId: string;             // ID of user who owns this node
  owner: UserReference;        // User who owns this node (populated)
  positionX: number;           // X coordinate position in the visual layout
  positionY: number;           // Y coordinate position in the visual layout
  metrics: MetricReference[];  // Metrics associated with this node
  createdAt: Date;             // When the node was created
  updatedAt: Date;             // When the node was last updated
  outgoingConnections: KFFMConnection[]; // Connections originating from this node
  incomingConnections: KFFMConnection[]; // Connections targeting this node
}

/**
 * Interface representing a connection between nodes in a Key Function Flow Map
 */
export interface KFFMConnection {
  id: string;                  // Unique identifier
  label: string;               // Connection label/description
  type: ConnectionType;        // Type of connection
  kffmId: string;              // Parent KFFM ID
  sourceNodeId: string;        // Source node ID
  targetNodeId: string;        // Target node ID
  sourceNode: KFFMNode;        // Source node (populated)
  targetNode: KFFMNode;        // Target node (populated)
  createdAt: Date;             // When the connection was created
  updatedAt: Date;             // When the connection was last updated
}

/**
 * Data transfer object for creating a new KFFM
 */
export interface CreateKFFMDto {
  title: string;               // Map title
  description: string;         // Detailed description
  organizationId: string;      // Organization this map belongs to
}

/**
 * Data transfer object for updating an existing KFFM
 */
export interface UpdateKFFMDto {
  title: string;               // Updated title
  description: string;         // Updated description
  status: KFFMStatus;          // Updated status
}

/**
 * Data transfer object for creating a new KFFM node
 */
export interface CreateKFFMNodeDto {
  title: string;               // Node title
  description: string;         // Detailed description
  type: NodeType;              // Type of node
  kffmId: string;              // Parent KFFM ID
  ownerId: string;             // ID of user who owns this node
  positionX: number;           // X coordinate position
  positionY: number;           // Y coordinate position
  metricIds: string[];         // IDs of metrics to associate with this node
}

/**
 * Data transfer object for updating an existing KFFM node
 */
export interface UpdateKFFMNodeDto {
  title: string;               // Updated title
  description: string;         // Updated description
  type: NodeType;              // Updated node type
  ownerId: string;             // Updated owner ID
  positionX: number;           // Updated X position
  positionY: number;           // Updated Y position
  metricIds: string[];         // Updated metric associations
}

/**
 * Data transfer object for creating a new connection between KFFM nodes
 */
export interface CreateKFFMConnectionDto {
  label: string;               // Connection label/description
  type: ConnectionType;        // Type of connection
  kffmId: string;              // Parent KFFM ID
  sourceNodeId: string;        // Source node ID
  targetNodeId: string;        // Target node ID
}

/**
 * Data transfer object for updating an existing connection between KFFM nodes
 */
export interface UpdateKFFMConnectionDto {
  label: string;               // Updated label
  type: ConnectionType;        // Updated connection type
}

/**
 * Interface for query parameters when fetching KFFMs
 */
export interface KFFMQueryParams {
  organizationId: string;      // Filter by organization
  status: KFFMStatus;          // Filter by status
  includeNodes: boolean;       // Whether to include nodes in the response
  includeConnections: boolean; // Whether to include connections in the response
}

/**
 * Minimal reference to a user to avoid circular dependency
 */
export interface UserReference {
  id: string;
  name: string;
}

/**
 * Minimal reference to a metric to avoid circular dependency
 */
export interface MetricReference {
  id: string;
  name: string;
  type: string;
}