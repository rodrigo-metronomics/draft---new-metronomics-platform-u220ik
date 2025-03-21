import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { KFFMNode, NodeType, CreateKFFMNodeDto, UpdateKFFMNodeDto } from '../types/kffm.types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/helpers/logger';

/**
 * Repository class for managing Key Function Flow Map (KFFM) nodes in the database.
 * Extends the BaseRepository to provide specific operations for creating, retrieving,
 * updating, and deleting nodes, as well as managing their relationships with metrics 
 * and positions within the KFFM.
 */
export class KFFMNodeRepository extends BaseRepository<KFFMNode> {
  /**
   * Initializes the repository with the KFFMNode model
   */
  constructor() {
    super('kFFMNode');
  }

  /**
   * Finds all nodes for a specific KFFM
   * @param kffmId - ID of the KFFM to find nodes for
   * @param options - Additional query options such as includes
   * @returns Array of nodes for the KFFM
   */
  async findByKFFMId(kffmId: string, options: Record<string, any> = {}): Promise<KFFMNode[]> {
    if (!kffmId) {
      throw ValidationError.requiredField('kffmId');
    }

    logger.debug(`KFFMNodeRepository.findByKFFMId`, { kffmId });
    
    const include = this.buildInclude(options);
    
    const nodes = await this.model.findMany({
      where: { kffmId },
      ...include
    });
    
    return nodes;
  }

  /**
   * Finds all nodes owned by a specific user
   * @param ownerId - ID of the owner to find nodes for
   * @param options - Additional query options such as includes
   * @returns Array of nodes owned by the user
   */
  async findByOwnerId(ownerId: string, options: Record<string, any> = {}): Promise<KFFMNode[]> {
    if (!ownerId) {
      throw ValidationError.requiredField('ownerId');
    }

    logger.debug(`KFFMNodeRepository.findByOwnerId`, { ownerId });
    
    const include = this.buildInclude(options);
    
    const nodes = await this.model.findMany({
      where: { ownerId },
      ...include
    });
    
    return nodes;
  }

  /**
   * Finds all nodes of a specific type within a KFFM
   * @param kffmId - ID of the KFFM to find nodes for
   * @param type - Type of nodes to find
   * @param options - Additional query options such as includes
   * @returns Array of nodes of the specified type
   */
  async findByType(kffmId: string, type: NodeType, options: Record<string, any> = {}): Promise<KFFMNode[]> {
    if (!kffmId) {
      throw ValidationError.requiredField('kffmId');
    }
    
    if (!type) {
      throw ValidationError.requiredField('type');
    }

    logger.debug(`KFFMNodeRepository.findByType`, { kffmId, type });
    
    const include = this.buildInclude(options);
    
    const nodes = await this.model.findMany({
      where: { kffmId, type },
      ...include
    });
    
    return nodes;
  }

  /**
   * Creates a new node in the KFFM
   * @param data - Data for the new node
   * @param options - Additional options for node creation
   * @returns The created node
   */
  async createNode(data: CreateKFFMNodeDto, options: Record<string, any> = {}): Promise<KFFMNode> {
    logger.debug(`KFFMNodeRepository.createNode`, { data });
    
    // Extract metricIds if present, as we'll handle those separately
    const { metricIds, ...nodeData } = data;
    
    // Use a transaction to ensure all operations succeed or fail together
    return await this.transaction(async (tx) => {
      // Create the node
      const node = await tx.kFFMNode.create({
        data: nodeData
      });
      
      // If metricIds are provided, create the node-metric relationships
      if (metricIds && metricIds.length > 0) {
        await tx.kFFMNodeMetric.createMany({
          data: metricIds.map(metricId => ({
            nodeId: node.id,
            metricId
          }))
        });
      }
      
      // Retrieve the created node with its relationships
      const createdNode = await tx.kFFMNode.findUnique({
        where: { id: node.id },
        include: {
          owner: true,
          metrics: true,
          outgoingConnections: true,
          incomingConnections: true,
        }
      });
      
      if (!createdNode) {
        throw new Error('Failed to retrieve created node');
      }
      
      return createdNode;
    });
  }

  /**
   * Updates an existing node in the KFFM
   * @param id - ID of the node to update
   * @param data - Updated node data
   * @param options - Additional options for node update
   * @returns The updated node
   */
  async updateNode(id: string, data: UpdateKFFMNodeDto, options: Record<string, any> = {}): Promise<KFFMNode> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug(`KFFMNodeRepository.updateNode`, { id, data });
    
    // Extract metricIds if present, as we'll handle those separately
    const { metricIds, ...nodeData } = data;
    
    // Use a transaction to ensure all operations succeed or fail together
    return await this.transaction(async (tx) => {
      // Update the node
      const node = await tx.kFFMNode.update({
        where: { id },
        data: nodeData
      });
      
      // If metricIds are provided, update the node-metric relationships
      if (metricIds !== undefined) {
        // First, remove all existing node-metric relationships
        await tx.kFFMNodeMetric.deleteMany({
          where: { nodeId: id }
        });
        
        // Then, create new relationships for the provided metricIds
        if (metricIds.length > 0) {
          await tx.kFFMNodeMetric.createMany({
            data: metricIds.map(metricId => ({
              nodeId: id,
              metricId
            }))
          });
        }
      }
      
      // Retrieve the updated node with its relationships
      const updatedNode = await tx.kFFMNode.findUnique({
        where: { id },
        include: {
          owner: true,
          metrics: true,
          outgoingConnections: true,
          incomingConnections: true,
        }
      });
      
      if (!updatedNode) {
        throw NotFoundError.resourceNotFound('KFFMNode', id);
      }
      
      return updatedNode;
    });
  }

  /**
   * Updates the position of a node in the KFFM
   * @param id - ID of the node to update
   * @param positionX - New X coordinate
   * @param positionY - New Y coordinate
   * @returns The updated node
   */
  async updateNodePosition(id: string, positionX: number, positionY: number): Promise<KFFMNode> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }
    
    if (positionX === undefined || positionY === undefined) {
      throw ValidationError.requiredField('position coordinates');
    }

    logger.debug(`KFFMNodeRepository.updateNodePosition`, { id, positionX, positionY });
    
    const node = await this.update(id, { positionX, positionY });
    
    return node;
  }

  /**
   * Deletes all nodes for a specific KFFM
   * @param kffmId - ID of the KFFM to delete nodes for
   * @returns The number of nodes deleted
   */
  async deleteNodesByKFFMId(kffmId: string): Promise<number> {
    if (!kffmId) {
      throw ValidationError.requiredField('kffmId');
    }

    logger.debug(`KFFMNodeRepository.deleteNodesByKFFMId`, { kffmId });
    
    // Use a transaction to ensure all operations succeed or fail together
    return await this.transaction(async (tx) => {
      // First, find all nodes for this KFFM
      const nodes = await tx.kFFMNode.findMany({
        where: { kffmId },
        select: { id: true }
      });
      
      const nodeIds = nodes.map(node => node.id);
      
      // First, delete all node-metric relationships for these nodes
      await tx.kFFMNodeMetric.deleteMany({
        where: { nodeId: { in: nodeIds } }
      });
      
      // Next, delete all connections for these nodes
      await tx.kFFMConnection.deleteMany({
        where: {
          OR: [
            { sourceNodeId: { in: nodeIds } },
            { targetNodeId: { in: nodeIds } }
          ]
        }
      });
      
      // Finally, delete the nodes themselves
      const result = await tx.kFFMNode.deleteMany({
        where: { kffmId }
      });
      
      return result.count;
    });
  }

  /**
   * Adds a metric to a node
   * @param nodeId - ID of the node
   * @param metricId - ID of the metric to add
   * @returns The updated node with the new metric
   */
  async addMetricToNode(nodeId: string, metricId: string): Promise<KFFMNode> {
    if (!nodeId) {
      throw ValidationError.requiredField('nodeId');
    }
    
    if (!metricId) {
      throw ValidationError.requiredField('metricId');
    }

    logger.debug(`KFFMNodeRepository.addMetricToNode`, { nodeId, metricId });
    
    // Use a transaction to ensure all operations succeed or fail together
    return await this.transaction(async (tx) => {
      // Check if the relationship already exists
      const existing = await tx.kFFMNodeMetric.findUnique({
        where: {
          nodeId_metricId: {
            nodeId,
            metricId
          }
        }
      });
      
      // If the relationship doesn't exist, create it
      if (!existing) {
        await tx.kFFMNodeMetric.create({
          data: {
            nodeId,
            metricId
          }
        });
      }
      
      // Retrieve the updated node with its relationships
      const updatedNode = await tx.kFFMNode.findUnique({
        where: { id: nodeId },
        include: {
          owner: true,
          metrics: true,
          outgoingConnections: true,
          incomingConnections: true,
        }
      });
      
      if (!updatedNode) {
        throw NotFoundError.resourceNotFound('KFFMNode', nodeId);
      }
      
      return updatedNode;
    });
  }

  /**
   * Removes a metric from a node
   * @param nodeId - ID of the node
   * @param metricId - ID of the metric to remove
   * @returns The updated node without the removed metric
   */
  async removeMetricFromNode(nodeId: string, metricId: string): Promise<KFFMNode> {
    if (!nodeId) {
      throw ValidationError.requiredField('nodeId');
    }
    
    if (!metricId) {
      throw ValidationError.requiredField('metricId');
    }

    logger.debug(`KFFMNodeRepository.removeMetricFromNode`, { nodeId, metricId });
    
    // Use a transaction to ensure all operations succeed or fail together
    return await this.transaction(async (tx) => {
      // Delete the node-metric relationship
      await tx.kFFMNodeMetric.deleteMany({
        where: {
          nodeId,
          metricId
        }
      });
      
      // Retrieve the updated node with its relationships
      const updatedNode = await tx.kFFMNode.findUnique({
        where: { id: nodeId },
        include: {
          owner: true,
          metrics: true,
          outgoingConnections: true,
          incomingConnections: true,
        }
      });
      
      if (!updatedNode) {
        throw NotFoundError.resourceNotFound('KFFMNode', nodeId);
      }
      
      return updatedNode;
    });
  }

  /**
   * Retrieves a node with all its relationships
   * @param id - ID of the node to retrieve
   * @returns The node with all its relationships
   */
  async getNodeWithRelationships(id: string): Promise<KFFMNode> {
    if (!id) {
      throw ValidationError.requiredField('id');
    }

    logger.debug(`KFFMNodeRepository.getNodeWithRelationships`, { id });
    
    const node = await this.model.findUnique({
      where: { id },
      include: {
        owner: true,
        metrics: true,
        outgoingConnections: true,
        incomingConnections: true,
      }
    });
    
    if (!node) {
      throw NotFoundError.resourceNotFound('KFFMNode', id);
    }
    
    return node;
  }
}