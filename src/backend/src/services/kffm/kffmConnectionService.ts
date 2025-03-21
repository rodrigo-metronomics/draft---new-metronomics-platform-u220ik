import { z } from 'zod'; // ^3.22.4
import { KFFMConnectionRepository } from '../../repositories/kffmConnectionRepository';
import { 
  KFFMConnection, 
  ConnectionType, 
  CreateKFFMConnectionDto, 
  UpdateKFFMConnectionDto 
} from '../../types/kffm.types';
import { 
  createKFFMConnectionSchema, 
  updateKFFMConnectionSchema, 
  validateConnection 
} from '../../utils/validation/kffmValidation';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { RESOURCE_ERRORS } from '../../utils/constants/errorMessages';
import { FirestoreService } from '../realtime/firestoreService';

/**
 * Service class that provides business logic for managing connections between nodes in the 
 * Key Function Flow Map (KFFM). This service handles operations like creating, retrieving, 
 * updating, and deleting connections, ensuring proper validation and real-time synchronization 
 * of connection data.
 */
export class KFFMConnectionService {
  private connectionRepository: KFFMConnectionRepository;
  private firestoreService: FirestoreService;

  /**
   * Initializes the service with required repositories and services
   * 
   * @param connectionRepository Repository for KFFM connection data access operations
   * @param firestoreService Service for real-time data synchronization with Firebase Firestore
   */
  constructor(
    connectionRepository: KFFMConnectionRepository,
    firestoreService: FirestoreService
  ) {
    this.connectionRepository = connectionRepository;
    this.firestoreService = firestoreService;
  }

  /**
   * Retrieves a connection by its ID
   * 
   * @param id The ID of the connection to retrieve
   * @param options Additional query options such as includes
   * @returns The requested connection
   * @throws NotFoundError if the connection doesn't exist
   */
  async getConnectionById(
    id: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection> {
    const connection = await this.connectionRepository.findById(id, options);
    
    if (!connection) {
      throw new NotFoundError(
        RESOURCE_ERRORS.NOT_FOUND,
        { resourceType: 'KFFMConnection', resourceId: id }
      );
    }
    
    return connection;
  }

  /**
   * Retrieves all connections for a specific KFFM
   * 
   * @param kffmId The ID of the KFFM to find connections for
   * @param options Additional query options such as includes
   * @returns Array of connections for the KFFM
   */
  async getConnectionsByKFFMId(
    kffmId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    return this.connectionRepository.findByKFFMId(kffmId, options);
  }

  /**
   * Retrieves all connections involving a specific node (either as source or target)
   * 
   * @param nodeId The ID of the node to find connections for
   * @param options Additional query options such as includes
   * @returns Array of connections involving the node
   */
  async getConnectionsByNodeId(
    nodeId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    return this.connectionRepository.findByNodeId(nodeId, options);
  }

  /**
   * Retrieves all connections where a specific node is the source
   * 
   * @param sourceNodeId The ID of the source node
   * @param options Additional query options such as includes
   * @returns Array of connections with the node as source
   */
  async getConnectionsBySourceNodeId(
    sourceNodeId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    return this.connectionRepository.findBySourceNodeId(sourceNodeId, options);
  }

  /**
   * Retrieves all connections where a specific node is the target
   * 
   * @param targetNodeId The ID of the target node
   * @param options Additional query options such as includes
   * @returns Array of connections with the node as target
   */
  async getConnectionsByTargetNodeId(
    targetNodeId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    return this.connectionRepository.findByTargetNodeId(targetNodeId, options);
  }

  /**
   * Retrieves all connections of a specific type within a KFFM
   * 
   * @param kffmId The ID of the KFFM
   * @param type The type of connection to find
   * @param options Additional query options such as includes
   * @returns Array of connections of the specified type
   */
  async getConnectionsByType(
    kffmId: string,
    type: ConnectionType,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection[]> {
    return this.connectionRepository.findByType(kffmId, type, options);
  }

  /**
   * Retrieves a connection between two specific nodes
   * 
   * @param sourceNodeId The ID of the source node
   * @param targetNodeId The ID of the target node
   * @param options Additional query options such as includes
   * @returns The connection or null if not found
   */
  async getConnectionBetweenNodes(
    sourceNodeId: string,
    targetNodeId: string,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection | null> {
    return this.connectionRepository.findBetweenNodes(
      sourceNodeId,
      targetNodeId,
      options
    );
  }

  /**
   * Creates a new connection between nodes in the KFFM
   * 
   * @param data The connection data to create
   * @param options Additional options for the creation
   * @returns The created connection
   * @throws ValidationError if validation fails
   */
  async createConnection(
    data: CreateKFFMConnectionDto,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection> {
    // Validate connection data
    const validatedData = this.validateConnectionData(data, false);
    
    // Additional validation for connection between nodes
    const connectionValidation = validateConnection(data.sourceNodeId, data.targetNodeId);
    if (connectionValidation !== true) {
      throw new ValidationError(connectionValidation as string);
    }
    
    // Create the connection using the repository
    const connection = await this.connectionRepository.createConnection(validatedData, options);
    
    // Sync to Firestore for real-time updates
    await this.syncConnectionToFirestore(connection.id);
    
    return connection;
  }

  /**
   * Updates an existing connection between nodes
   * 
   * @param id The ID of the connection to update
   * @param data The updated connection data
   * @param options Additional options for the update
   * @returns The updated connection
   * @throws NotFoundError if the connection doesn't exist
   * @throws ValidationError if validation fails
   */
  async updateConnection(
    id: string,
    data: UpdateKFFMConnectionDto,
    options: Record<string, any> = {}
  ): Promise<KFFMConnection> {
    // Validate the ID
    if (!id) {
      throw new ValidationError('Connection ID is required.');
    }
    
    // Validate the update data
    const validatedData = this.validateConnectionData(data, true);
    
    // Verify the connection exists
    await this.getConnectionById(id);
    
    // Update the connection using the repository
    const updatedConnection = await this.connectionRepository.updateConnection(
      id,
      validatedData,
      options
    );
    
    // Sync to Firestore for real-time updates
    await this.syncConnectionToFirestore(id);
    
    return updatedConnection;
  }

  /**
   * Deletes a connection from the KFFM
   * 
   * @param id The ID of the connection to delete
   * @returns The deleted connection
   * @throws NotFoundError if the connection doesn't exist
   */
  async deleteConnection(id: string): Promise<KFFMConnection> {
    // Validate the ID
    if (!id) {
      throw new ValidationError('Connection ID is required.');
    }
    
    // Verify the connection exists
    const connection = await this.getConnectionById(id);
    
    // Delete the connection using the repository
    const deletedConnection = await this.connectionRepository.delete(id);
    
    // Delete from Firestore to maintain real-time sync
    try {
      await this.firestoreService.deleteDocument('kffm-connections', id);
    } catch (error) {
      // Log the error but don't fail the operation if Firestore sync fails
      console.error('Failed to delete connection from Firestore:', error);
    }
    
    return deletedConnection;
  }

  /**
   * Deletes all connections for a specific KFFM
   * 
   * @param kffmId The ID of the KFFM
   * @returns The number of connections deleted
   */
  async deleteConnectionsByKFFMId(kffmId: string): Promise<number> {
    if (!kffmId) {
      throw new ValidationError('KFFM ID is required.');
    }
    
    // Get all connections for the KFFM to delete from Firestore
    const connections = await this.getConnectionsByKFFMId(kffmId);
    
    // Delete from database first
    const deletedCount = await this.connectionRepository.deleteConnectionsByKFFMId(kffmId);
    
    // Delete from Firestore to maintain real-time sync
    try {
      // Use batch operation for better performance with multiple deletes
      const operations = connections.map(connection => ({
        operation: 'delete' as const,
        collection: 'kffm-connections',
        documentId: connection.id
      }));
      
      if (operations.length > 0) {
        await this.firestoreService.batchWrite(operations);
      }
    } catch (error) {
      // Log the error but don't fail the operation if Firestore sync fails
      console.error('Failed to delete connections from Firestore:', error);
    }
    
    return deletedCount;
  }

  /**
   * Deletes all connections involving a specific node
   * 
   * @param nodeId The ID of the node
   * @returns The number of connections deleted
   */
  async deleteConnectionsByNodeId(nodeId: string): Promise<number> {
    if (!nodeId) {
      throw new ValidationError('Node ID is required.');
    }
    
    // Get all connections for the node to delete from Firestore
    const connections = await this.getConnectionsByNodeId(nodeId);
    
    // Delete from database first
    const deletedCount = await this.connectionRepository.deleteConnectionsByNodeId(nodeId);
    
    // Delete from Firestore to maintain real-time sync
    try {
      // Use batch operation for better performance with multiple deletes
      const operations = connections.map(connection => ({
        operation: 'delete' as const,
        collection: 'kffm-connections',
        documentId: connection.id
      }));
      
      if (operations.length > 0) {
        await this.firestoreService.batchWrite(operations);
      }
    } catch (error) {
      // Log the error but don't fail the operation if Firestore sync fails
      console.error('Failed to delete connections from Firestore:', error);
    }
    
    return deletedCount;
  }

  /**
   * Synchronizes a connection to Firestore for real-time updates
   * 
   * @param connectionId ID of the connection to synchronize
   * @private
   */
  private async syncConnectionToFirestore(connectionId: string): Promise<void> {
    try {
      // Get the connection with related nodes to ensure complete data for real-time updates
      const connection = await this.getConnectionById(connectionId, { 
        include: {
          sourceNode: true,
          targetNode: true
        }
      });
      
      // Prepare data for Firestore
      const firestoreData = {
        id: connection.id,
        label: connection.label,
        type: connection.type,
        kffmId: connection.kffmId,
        sourceNodeId: connection.sourceNodeId,
        targetNodeId: connection.targetNodeId,
        // Include minimal source and target node information
        sourceNode: connection.sourceNode ? {
          id: connection.sourceNode.id,
          title: connection.sourceNode.title,
          type: connection.sourceNode.type
        } : null,
        targetNode: connection.targetNode ? {
          id: connection.targetNode.id,
          title: connection.targetNode.title,
          type: connection.targetNode.type
        } : null,
        updatedAt: new Date()
      };
      
      // Update in Firestore
      await this.firestoreService.updateDocument(
        'kffm-connections', 
        connectionId,
        firestoreData
      );
    } catch (error) {
      console.error('Failed to sync connection to Firestore:', error);
      // Don't rethrow to avoid failing the main operation due to sync issues
    }
  }

  /**
   * Validates connection data against the appropriate schema
   * 
   * @param data The data to validate
   * @param isUpdate Whether this is an update operation (uses different schema)
   * @returns Validated data
   * @throws ValidationError if validation fails
   * @private
   */
  private validateConnectionData(data: any, isUpdate: boolean): any {
    try {
      // Select the appropriate schema based on operation type
      const schema = isUpdate ? updateKFFMConnectionSchema : createKFFMConnectionSchema;
      
      // Parse and validate the data
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        throw new ValidationError('Connection data validation failed', { details });
      }
      
      throw error;
    }
  }
}