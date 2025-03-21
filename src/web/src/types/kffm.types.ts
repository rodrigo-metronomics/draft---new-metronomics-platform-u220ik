/**
 * TypeScript type definitions for Key Function Flow Map (KFFM) entities,
 * including maps, nodes, connections, and related interfaces for the frontend application.
 * These types support the visualization and management of organizational structure
 * and accountability through an interactive diagram editor.
 */

import { ID, Coordinates } from './common.types';

/**
 * Enum representing the possible statuses of a KFFM
 */
export enum KFFMStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * Enum representing the possible types of KFFM nodes
 */
export enum NodeType {
  DEPARTMENT = 'department',
  FUNCTION = 'function',
  PROCESS = 'process'
}

/**
 * Enum representing the possible types of connections between KFFM nodes
 */
export enum ConnectionType {
  DIRECT = 'direct',
  SUPPORTING = 'supporting',
  DEPENDENT = 'dependent'
}

/**
 * Enum representing the possible modes of the KFFM editor
 */
export enum KFFMEditorMode {
  VIEW = 'view',
  EDIT = 'edit'
}

/**
 * Minimal reference to a user to avoid circular dependency
 */
export interface UserReference {
  id: ID;
  name: string;
}

/**
 * Minimal reference to a metric to avoid circular dependency
 */
export interface MetricReference {
  id: ID;
  name: string;
  type: string;
}

/**
 * Interface representing a Key Function Flow Map entity
 */
export interface KFFM {
  id: ID;
  title: string;
  description: string;
  version: number;
  status: KFFMStatus;
  organizationId: ID;
  createdAt: string;
  updatedAt: string;
  nodes: KFFMNode[];
}

/**
 * Interface representing a node in a Key Function Flow Map
 */
export interface KFFMNode {
  id: ID;
  title: string;
  description: string;
  type: NodeType;
  kffmId: ID;
  ownerId: ID;
  owner: UserReference;
  positionX: number;
  positionY: number;
  metrics: MetricReference[];
  createdAt: string;
  updatedAt: string;
  outgoingConnections: KFFMConnection[];
  incomingConnections: KFFMConnection[];
}

/**
 * Interface representing a connection between nodes in a Key Function Flow Map
 */
export interface KFFMConnection {
  id: ID;
  label: string;
  type: ConnectionType;
  kffmId: ID;
  sourceNodeId: ID;
  targetNodeId: ID;
  sourceNode: KFFMNode;
  targetNode: KFFMNode;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data transfer object for creating a new KFFM
 */
export interface CreateKFFMDto {
  title: string;
  description: string;
  organizationId: ID;
}

/**
 * Data transfer object for updating an existing KFFM
 */
export interface UpdateKFFMDto {
  title: string;
  description: string;
  status: KFFMStatus;
}

/**
 * Data transfer object for creating a new KFFM node
 */
export interface CreateKFFMNodeDto {
  title: string;
  description: string;
  type: NodeType;
  kffmId: ID;
  ownerId: ID;
  positionX: number;
  positionY: number;
  metricIds: ID[];
}

/**
 * Data transfer object for updating an existing KFFM node
 */
export interface UpdateKFFMNodeDto {
  title: string;
  description: string;
  type: NodeType;
  ownerId: ID;
  positionX: number;
  positionY: number;
  metricIds: ID[];
}

/**
 * Data transfer object for creating a new connection between KFFM nodes
 */
export interface CreateKFFMConnectionDto {
  label: string;
  type: ConnectionType;
  kffmId: ID;
  sourceNodeId: ID;
  targetNodeId: ID;
}

/**
 * Data transfer object for updating an existing connection between KFFM nodes
 */
export interface UpdateKFFMConnectionDto {
  label: string;
  type: ConnectionType;
}

/**
 * Interface for query parameters when fetching KFFMs
 */
export interface KFFMQueryParams {
  organizationId: ID;
  status: KFFMStatus;
  includeNodes: boolean;
  includeConnections: boolean;
}

/**
 * Interface for tracking the position of the canvas viewport in the KFFM editor
 */
export interface CanvasPosition {
  x: number;
  y: number;
}

/**
 * Interface for items being dragged in the KFFM editor
 */
export interface DragItem {
  type: string;
  id: ID;
  nodeType: NodeType;
  position: Coordinates;
}

/**
 * Interface for connection points on nodes in the KFFM editor
 */
export interface ConnectionPoint {
  x: number;
  y: number;
  nodeId: ID;
}