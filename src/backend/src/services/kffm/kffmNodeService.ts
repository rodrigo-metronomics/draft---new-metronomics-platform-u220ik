import { z } from 'zod'; // v3.22.4
import { KFFMNodeRepository } from '../../repositories/kffmNodeRepository';
import { 
  KFFMNode, 
  NodeType, 
  CreateKFFMNodeDto, 
  UpdateKFFMNodeDto 
} from '../../types/kffm.types';
import { 
  createKFFMNodeSchema,
  updateKFFMNodeSchema,
  validateNodePosition
} from '../../utils/validation/kffmValidation';
import { 
  NotFoundError, 
  ValidationError 
} from '../../utils/errors';
import { KFFM_ERRORS } from '../../utils/constants/errorMessages';
import { FirestoreService } from '../realtime/firestoreService';

/**
 * Service class that provides business logic for managing nodes in the Key Function Flow Map (KFFM).
 * Handles operations for creating, retrieving, updating, and deleting nodes, as well as
 * managing their positions, metrics, and relationships within the organizational structure visualization.
 */
export class KFFMNodeService {
  private nodeRepository: KFFMNodeRepository;
  private firestoreService: FirestoreService;

  /**
   * Initializes the service with required repositories and services
   * @param nodeRepository Repository for KFFM node data access
   * @param firestoreService Service for real-time data synchronization
   */
  constructor(nodeRepository: KFFMNodeRepository, firestoreService: FirestoreService) {
    this.nodeRepository = nodeRepository;
    this.firestoreService = firestoreService;
  }

  /**
   * Retrieves a node by its ID
   * @param id ID of the node to retrieve
   * @param options Additional query options such as includes
   * @returns The requested node
   * @throws NotFoundError if node is not found
   */
  async getNodeById(id: string, options: Record<string, any> = {}): Promise<KFFMNode> {
    if (!id) {
      throw new ValidationError('Node ID is required');
    }

    const node = await this.nodeRepository.findById(id, options);
    
    if (!node) {
      throw NotFoundError.resourceNotFound('KFFMNode', id);
    }

    return node;
  }

  /**
   * Retrieves a node with all its relationships (metrics, connections)
   * @param id ID of the node to retrieve
   * @returns The node with all its relationships
   * @throws NotFoundError if node is not found
   */
  async getNodeWithRelationships(id: string): Promise<KFFMNode> {
    if (!id) {
      throw new ValidationError('Node ID is required');
    }

    return await this.nodeRepository.getNodeWithRelationships(id);
  }

  /**
   * Retrieves all nodes for a specific KFFM
   * @param kffmId ID of the KFFM
   * @param options Additional query options such as includes
   * @returns Array of nodes for the KFFM
   */
  async getNodesByKFFMId(kffmId: string, options: Record<string, any> = {}): Promise<KFFMNode[]> {
    if (!kffmId) {
      throw new ValidationError('KFFM ID is required');
    }

    return await this.nodeRepository.findByKFFMId(kffmId, options);
  }

  /**
   * Retrieves all nodes owned by a specific user
   * @param ownerId ID of the owner
   * @param options Additional query options such as includes
   * @returns Array of nodes owned by the user
   */
  async getNodesByOwnerId(ownerId: string, options: Record<string, any> = {}): Promise<KFFMNode[]> {
    if (!ownerId) {
      throw new ValidationError('Owner ID is required');
    }

    return await this.nodeRepository.findByOwnerId(ownerId, options);
  }

  /**
   * Retrieves all nodes of a specific type within a KFFM
   * @param kffmId ID of the KFFM
   * @param type Type of nodes to retrieve
   * @param options Additional query options such as includes
   * @returns Array of nodes of the specified type
   */
  async getNodesByType(kffmId: string, type: NodeType, options: Record<string, any> = {}): Promise<KFFMNode[]> {
    if (!kffmId) {
      throw new ValidationError('KFFM ID is required');
    }

    if (type === undefined || type === null) {
      throw new ValidationError('Node type is required');
    }

    return await this.nodeRepository.findByType(kffmId, type, options);
  }

  /**
   * Creates a new node in the KFFM
   * @param data Data for the new node
   * @param options Additional options for node creation
   * @returns The created node
   * @throws ValidationError if node data is invalid
   */
  async createNode(data: CreateKFFMNodeDto, options: Record<string, any> = {}): Promise<KFFMNode> {
    // Validate the node data
    const validatedData = this.validateNodeData(data, false);
    
    // Validate node position
    const positionValid = validateNodePosition(data.positionX, data.positionY);
    if (positionValid !== true) {
      throw new ValidationError(KFFM_ERRORS.INVALID_NODE_POSITION);
    }

    // Create the node
    const node = await this.nodeRepository.createNode(validatedData, options);
    
    // Sync to Firestore for real-time updates
    await this.syncNodeToFirestore(node.id);
    
    return node;
  }

  /**
   * Updates an existing node in the KFFM
   * @param id ID of the node to update
   * @param data Updated node data
   * @param options Additional options for node update
   * @returns The updated node
   * @throws NotFoundError if node is not found
   * @throws ValidationError if update data is invalid
   */
  async updateNode(id: string, data: UpdateKFFMNodeDto, options: Record<string, any> = {}): Promise<KFFMNode> {
    if (!id) {
      throw new ValidationError('Node ID is required');
    }

    // Validate the update data
    const validatedData = this.validateNodeData(data, true);
    
    // Validate node position if updating position
    if (data.positionX !== undefined && data.positionY !== undefined) {
      const positionValid = validateNodePosition(data.positionX, data.positionY);
      if (positionValid !== true) {
        throw new ValidationError(KFFM_ERRORS.INVALID_NODE_POSITION);
      }
    }

    // Verify the node exists
    await this.getNodeById(id);
    
    // Update the node
    const updatedNode = await this.nodeRepository.updateNode(id, validatedData, options);
    
    // Sync to Firestore for real-time updates
    await this.syncNodeToFirestore(id);
    
    return updatedNode;
  }

  /**
   * Updates the position of a node in the KFFM
   * @param id ID of the node to update
   * @param positionX New X coordinate
   * @param positionY New Y coordinate
   * @returns The updated node
   * @throws NotFoundError if node is not found
   * @throws ValidationError if position is invalid
   */
  async updateNodePosition(id: string, positionX: number, positionY: number): Promise<KFFMNode> {
    if (!id) {
      throw new ValidationError('Node ID is required');
    }

    // Validate node position
    const positionValid = validateNodePosition(positionX, positionY);
    if (positionValid !== true) {
      throw new ValidationError(KFFM_ERRORS.INVALID_NODE_POSITION);
    }

    // Verify the node exists
    await this.getNodeById(id);
    
    // Update the node position
    const updatedNode = await this.nodeRepository.updateNodePosition(id, positionX, positionY);
    
    // Sync to Firestore for real-time updates
    await this.syncNodeToFirestore(id);
    
    return updatedNode;
  }

  /**
   * Deletes a node from the KFFM
   * @param id ID of the node to delete
   * @returns The deleted node
   * @throws NotFoundError if node is not found
   */
  async deleteNode(id: string): Promise<KFFMNode> {
    if (!id) {
      throw new ValidationError('Node ID is required');
    }

    // Verify the node exists
    const node = await this.getNodeById(id);
    
    // Delete the node
    const deletedNode = await this.nodeRepository.delete(id);
    
    // Sync deletion to Firestore
    await this.firestoreService.deleteDocument('kffm-nodes', id);
    
    return deletedNode;
  }

  /**
   * Deletes all nodes for a specific KFFM
   * @param kffmId ID of the KFFM to delete nodes for
   * @returns The number of nodes deleted
   */
  async deleteNodesByKFFMId(kffmId: string): Promise<number> {
    if (!kffmId) {
      throw new ValidationError('KFFM ID is required');
    }

    return await this.nodeRepository.deleteNodesByKFFMId(kffmId);
  }

  /**
   * Adds a metric to a node
   * @param nodeId ID of the node
   * @param metricId ID of the metric to add
   * @returns The updated node with the new metric
   * @throws NotFoundError if node is not found
   */
  async addMetricToNode(nodeId: string, metricId: string): Promise<KFFMNode> {
    if (!nodeId) {
      throw new ValidationError('Node ID is required');
    }

    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }

    // Verify the node exists
    await this.getNodeById(nodeId);
    
    // Add the metric to the node
    const updatedNode = await this.nodeRepository.addMetricToNode(nodeId, metricId);
    
    // Sync to Firestore for real-time updates
    await this.syncNodeToFirestore(nodeId);
    
    return updatedNode;
  }

  /**
   * Removes a metric from a node
   * @param nodeId ID of the node
   * @param metricId ID of the metric to remove
   * @returns The updated node without the removed metric
   * @throws NotFoundError if node is not found
   */
  async removeMetricFromNode(nodeId: string, metricId: string): Promise<KFFMNode> {
    if (!nodeId) {
      throw new ValidationError('Node ID is required');
    }

    if (!metricId) {
      throw new ValidationError('Metric ID is required');
    }

    // Verify the node exists
    await this.getNodeById(nodeId);
    
    // Remove the metric from the node
    const updatedNode = await this.nodeRepository.removeMetricFromNode(nodeId, metricId);
    
    // Sync to Firestore for real-time updates
    await this.syncNodeToFirestore(nodeId);
    
    return updatedNode;
  }

  /**
   * Synchronizes a node to Firestore for real-time updates
   * @param nodeId ID of the node to synchronize
   * @returns Promise that resolves when sync is complete
   */
  private async syncNodeToFirestore(nodeId: string): Promise<void> {
    try {
      // Get the node with all its relationships
      const node = await this.getNodeWithRelationships(nodeId);
      
      // Update the document in Firestore
      await this.firestoreService.updateDocument('kffm-nodes', nodeId, node);
    } catch (error) {
      // Log the error but don't throw it to avoid affecting the main operation
      console.error(`Failed to sync node ${nodeId} to Firestore:`, error);
    }
  }

  /**
   * Validates node data against the appropriate schema
   * @param data Data to validate
   * @param isUpdate Whether this is an update operation (affects validation rules)
   * @returns Validated data
   * @throws ValidationError if data is invalid
   */
  private validateNodeData(data: Record<string, any>, isUpdate: boolean): Record<string, any> {
    try {
      // Select the appropriate schema based on operation type
      const schema = isUpdate ? updateKFFMNodeSchema : createKFFMNodeSchema;
      
      // Parse and validate the data
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Transform Zod validation errors into our application's ValidationError
        const details = error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);
        
        throw new ValidationError('Invalid node data', details);
      }
      
      throw error;
    }
  }
}