import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { 
  KFFMConnection, 
  CreateKFFMConnectionDto, 
  UpdateKFFMConnectionDto,
  ConnectionType 
} from '../types/kffm.types';
import { ValidationError } from '../utils/errors';

/**
 * Repository class for managing connections between nodes in Key Function Flow Maps (KFFM).
 * Provides specialized methods for creating, retrieving, updating, and deleting connections
 * between KFFM nodes, supporting the visualization of departmental ownership and accountability.
 */
export class KFFMConnectionRepository extends BaseRepository<KFFMConnection> {
  /**
   * Initializes the repository with the KFFMConnection model
   */
  constructor() {
    super('kffmConnection');
  }

  /**
   * Finds all connections for a specific KFFM
   * 
   * @param kffmId - The ID of the KFFM to find connections for
   * @param options - Additional query options such as includes
   * @returns Array of KFFM connections
   */
  async findByKFFMId(
    kffmId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    this.validateId(kffmId);
    
    const include = this.buildInclude(options);
    
    return this.model.findMany({
      where: { kffmId },
      ...include
    });
  }

  /**
   * Finds all connections involving a specific node (either as source or target)
   * 
   * @param nodeId - The ID of the node to find connections for
   * @param options - Additional query options such as includes
   * @returns Array of KFFM connections
   */
  async findByNodeId(
    nodeId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    this.validateId(nodeId);
    
    const include = this.buildInclude(options);
    
    return this.model.findMany({
      where: {
        OR: [
          { sourceNodeId: nodeId },
          { targetNodeId: nodeId }
        ]
      },
      ...include
    });
  }

  /**
   * Finds all connections where a specific node is the source
   * 
   * @param sourceNodeId - The ID of the source node
   * @param options - Additional query options such as includes
   * @returns Array of KFFM connections
   */
  async findBySourceNodeId(
    sourceNodeId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    this.validateId(sourceNodeId);
    
    const include = this.buildInclude(options);
    
    return this.model.findMany({
      where: { sourceNodeId },
      ...include
    });
  }

  /**
   * Finds all connections where a specific node is the target
   * 
   * @param targetNodeId - The ID of the target node
   * @param options - Additional query options such as includes
   * @returns Array of KFFM connections
   */
  async findByTargetNodeId(
    targetNodeId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    this.validateId(targetNodeId);
    
    const include = this.buildInclude(options);
    
    return this.model.findMany({
      where: { targetNodeId },
      ...include
    });
  }

  /**
   * Finds all connections of a specific type within a KFFM
   * 
   * @param kffmId - The ID of the KFFM
   * @param type - The type of connection to find
   * @param options - Additional query options such as includes
   * @returns Array of KFFM connections
   */
  async findByType(
    kffmId: string,
    type: ConnectionType,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    this.validateId(kffmId);
    
    if (!type || !Object.values(ConnectionType).includes(type)) {
      throw ValidationError.invalidFormat('type', 'A valid ConnectionType value');
    }
    
    const include = this.buildInclude(options);
    
    return this.model.findMany({
      where: { 
        kffmId,
        type 
      },
      ...include
    });
  }

  /**
   * Finds a connection between two specific nodes
   * 
   * @param sourceNodeId - The ID of the source node
   * @param targetNodeId - The ID of the target node
   * @param options - Additional query options such as includes
   * @returns The connection or null if not found
   */
  async findBetweenNodes(
    sourceNodeId: string,
    targetNodeId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection | null> {
    this.validateId(sourceNodeId);
    this.validateId(targetNodeId);
    
    const include = this.buildInclude(options);
    
    return this.model.findFirst({
      where: { 
        sourceNodeId,
        targetNodeId 
      },
      ...include
    });
  }

  /**
   * Creates a new connection between nodes in the KFFM
   * 
   * @param data - The connection data
   * @param options - Additional query options such as includes
   * @returns The created connection
   */
  async createConnection(
    data: CreateKFFMConnectionDto,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection> {
    // Validate input data
    if (!data) {
      throw ValidationError.requiredField('data');
    }
    
    if (!data.kffmId) {
      throw ValidationError.requiredField('kffmId');
    }
    
    if (!data.sourceNodeId) {
      throw ValidationError.requiredField('sourceNodeId');
    }
    
    if (!data.targetNodeId) {
      throw ValidationError.requiredField('targetNodeId');
    }
    
    if (data.sourceNodeId === data.targetNodeId) {
      throw new ValidationError('Source and target nodes cannot be the same');
    }
    
    if (!data.type || !Object.values(ConnectionType).includes(data.type)) {
      throw ValidationError.invalidFormat('type', 'A valid ConnectionType value');
    }
    
    // Check if connection already exists between these nodes
    const existingConnection = await this.findBetweenNodes(
      data.sourceNodeId,
      data.targetNodeId
    );
    
    if (existingConnection) {
      throw new ValidationError(
        `A connection already exists between nodes ${data.sourceNodeId} and ${data.targetNodeId}`,
        { connectionId: existingConnection.id }
      );
    }
    
    // Create the connection
    return this.create(data);
  }

  /**
   * Updates an existing connection between nodes
   * 
   * @param id - The ID of the connection to update
   * @param data - The updated connection data
   * @param options - Additional query options such as includes
   * @returns The updated connection
   */
  async updateConnection(
    id: string,
    data: UpdateKFFMConnectionDto,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection> {
    this.validateId(id);
    
    if (!data) {
      throw ValidationError.requiredField('data');
    }
    
    if (data.type && !Object.values(ConnectionType).includes(data.type)) {
      throw ValidationError.invalidFormat('type', 'A valid ConnectionType value');
    }
    
    return this.update(id, data);
  }

  /**
   * Deletes all connections for a specific KFFM
   * 
   * @param kffmId - The ID of the KFFM
   * @returns The number of connections deleted
   */
  async deleteConnectionsByKFFMId(kffmId: string): Promise<number> {
    this.validateId(kffmId);
    
    const result = await this.model.deleteMany({
      where: { kffmId }
    });
    
    return result.count;
  }

  /**
   * Deletes all connections involving a specific node
   * 
   * @param nodeId - The ID of the node
   * @returns The number of connections deleted
   */
  async deleteConnectionsByNodeId(nodeId: string): Promise<number> {
    this.validateId(nodeId);
    
    const result = await this.model.deleteMany({
      where: {
        OR: [
          { sourceNodeId: nodeId },
          { targetNodeId: nodeId }
        ]
      }
    });
    
    return result.count;
  }
}