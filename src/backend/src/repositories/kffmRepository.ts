import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { 
  KFFM, 
  KFFMStatus, 
  CreateKFFMDto, 
  UpdateKFFMDto, 
  KFFMQueryParams 
} from '../types/kffm.types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { logger } from '../utils/helpers/logger';

/**
 * Repository implementation for Key Function Flow Map (KFFM) data access operations.
 * Extends the BaseRepository to provide specialized methods for managing KFFMs,
 * including operations for creating, retrieving, updating, and deleting KFFMs
 * with their associated nodes and connections.
 */
export class KFFMRepository extends BaseRepository<KFFM> {
  /**
   * Initializes the KFFM repository
   */
  constructor() {
    super('kffm');
  }

  /**
   * Finds all KFFMs belonging to a specific organization
   * @param organizationId The ID of the organization
   * @param options Additional query options such as includes
   * @returns Array of KFFMs belonging to the organization
   */
  async findByOrganizationId(
    organizationId: string,
    options: Record<string, any> = {}
  ): Promise<KFFM[]> {
    try {
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      logger.debug(`KFFMRepository.findByOrganizationId`, { organizationId });

      const include = this.buildInclude(options);

      const results = await this.model.findMany({
        where: { organizationId },
        ...include
      });

      return results;
    } catch (error) {
      logger.error(`Error in KFFMRepository.findByOrganizationId`, { organizationId, error });
      throw error;
    }
  }

  /**
   * Finds all KFFMs with a specific status
   * @param status The KFFM status to filter by
   * @param options Additional query options such as includes
   * @returns Array of KFFMs with the specified status
   */
  async findByStatus(
    status: KFFMStatus,
    options: Record<string, any> = {}
  ): Promise<KFFM[]> {
    try {
      if (!status) {
        throw ValidationError.requiredField('status');
      }

      logger.debug(`KFFMRepository.findByStatus`, { status });

      const include = this.buildInclude(options);

      const results = await this.model.findMany({
        where: { status },
        ...include
      });

      return results;
    } catch (error) {
      logger.error(`Error in KFFMRepository.findByStatus`, { status, error });
      throw error;
    }
  }

  /**
   * Finds the latest version of a KFFM for an organization
   * @param organizationId The ID of the organization
   * @param options Additional query options such as includes
   * @returns The latest KFFM or null if none exists
   */
  async findLatestVersion(
    organizationId: string,
    options: Record<string, any> = {}
  ): Promise<KFFM | null> {
    try {
      if (!organizationId) {
        throw ValidationError.requiredField('organizationId');
      }

      logger.debug(`KFFMRepository.findLatestVersion`, { organizationId });

      const include = this.buildInclude(options);

      const result = await this.model.findFirst({
        where: { organizationId },
        orderBy: { version: 'desc' },
        ...include
      });

      return result;
    } catch (error) {
      logger.error(`Error in KFFMRepository.findLatestVersion`, { organizationId, error });
      throw error;
    }
  }

  /**
   * Finds a KFFM with all its nodes and connections
   * @param id The ID of the KFFM to find
   * @returns The KFFM with all its details
   */
  async findWithDetails(id: string): Promise<KFFM> {
    try {
      this.validateId(id);

      logger.debug(`KFFMRepository.findWithDetails`, { id });

      const result = await this.model.findUnique({
        where: { id },
        include: {
          nodes: {
            include: {
              owner: true,
              metrics: true,
              outgoingConnections: {
                include: {
                  targetNode: true
                }
              },
              incomingConnections: {
                include: {
                  sourceNode: true
                }
              }
            }
          }
        }
      });

      if (!result) {
        throw NotFoundError.resourceNotFound('KFFM', id);
      }

      return result as KFFM;
    } catch (error) {
      logger.error(`Error in KFFMRepository.findWithDetails`, { id, error });
      throw error;
    }
  }

  /**
   * Finds KFFMs based on query parameters with pagination
   * @param queryParams Parameters to filter KFFMs by
   * @param pagination Pagination parameters
   * @param options Additional query options
   * @returns Paginated KFFMs matching the query
   */
  async findByQuery(
    queryParams: KFFMQueryParams,
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: KFFM[]; total: number }> {
    try {
      logger.debug(`KFFMRepository.findByQuery`, { queryParams, pagination });

      const where: Record<string, any> = {};

      // Build where clause from query parameters
      if (queryParams.organizationId) {
        where.organizationId = queryParams.organizationId;
      }

      if (queryParams.status) {
        where.status = queryParams.status;
      }

      // Add includes based on query parameters
      const include: Record<string, any> = {};
      
      if (queryParams.includeNodes) {
        include.nodes = true;
      }

      if (queryParams.includeConnections) {
        // If nodes are included, include connections on nodes
        if (queryParams.includeNodes) {
          include.nodes = {
            include: {
              outgoingConnections: true,
              incomingConnections: true
            }
          };
        }
      }

      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          skip: pagination.offset,
          take: pagination.limit,
          ...(Object.keys(include).length > 0 ? { include } : {}),
          orderBy: { createdAt: 'desc' }
        }),
        this.model.count({ where })
      ]);

      return { data, total };
    } catch (error) {
      logger.error(`Error in KFFMRepository.findByQuery`, { queryParams, error });
      throw error;
    }
  }

  /**
   * Creates a new KFFM
   * @param data The KFFM data to create
   * @returns The created KFFM
   */
  async createKFFM(data: CreateKFFMDto): Promise<KFFM> {
    try {
      logger.debug(`KFFMRepository.createKFFM`, { data });

      // Set initial values for a new KFFM
      const kffmData = {
        ...data,
        version: 1,
        status: KFFMStatus.DRAFT
      };

      const result = await this.create(kffmData);
      return result;
    } catch (error) {
      logger.error(`Error in KFFMRepository.createKFFM`, { data, error });
      throw error;
    }
  }

  /**
   * Updates an existing KFFM
   * @param id The ID of the KFFM to update
   * @param data The updated KFFM data
   * @returns The updated KFFM
   */
  async updateKFFM(id: string, data: UpdateKFFMDto): Promise<KFFM> {
    try {
      this.validateId(id);

      logger.debug(`KFFMRepository.updateKFFM`, { id, data });

      const result = await this.update(id, data);
      return result;
    } catch (error) {
      logger.error(`Error in KFFMRepository.updateKFFM`, { id, data, error });
      throw error;
    }
  }

  /**
   * Changes the status of a KFFM to PUBLISHED
   * @param id The ID of the KFFM to publish
   * @returns The published KFFM
   */
  async publishKFFM(id: string): Promise<KFFM> {
    try {
      this.validateId(id);

      logger.debug(`KFFMRepository.publishKFFM`, { id });

      const result = await this.update(id, { status: KFFMStatus.PUBLISHED });
      return result;
    } catch (error) {
      logger.error(`Error in KFFMRepository.publishKFFM`, { id, error });
      throw error;
    }
  }

  /**
   * Changes the status of a KFFM to ARCHIVED
   * @param id The ID of the KFFM to archive
   * @returns The archived KFFM
   */
  async archiveKFFM(id: string): Promise<KFFM> {
    try {
      this.validateId(id);

      logger.debug(`KFFMRepository.archiveKFFM`, { id });

      const result = await this.update(id, { status: KFFMStatus.ARCHIVED });
      return result;
    } catch (error) {
      logger.error(`Error in KFFMRepository.archiveKFFM`, { id, error });
      throw error;
    }
  }

  /**
   * Creates a new version of an existing KFFM
   * @param id The ID of the KFFM to clone
   * @returns The cloned KFFM
   */
  async cloneKFFM(id: string): Promise<KFFM> {
    try {
      this.validateId(id);

      logger.debug(`KFFMRepository.cloneKFFM`, { id });

      // Get the original KFFM with all its nodes and connections
      const original = await this.findWithDetails(id);

      return await this.transaction(async (tx) => {
        // Create a new KFFM with incremented version
        const newKffm = await tx.kffm.create({
          data: {
            title: original.title,
            description: original.description,
            version: original.version + 1,
            status: KFFMStatus.DRAFT,
            organizationId: original.organizationId
          }
        });

        // Map old node IDs to new node IDs
        const nodeIdMap = new Map<string, string>();

        // Clone all nodes
        for (const node of original.nodes) {
          const newNode = await tx.kffmNode.create({
            data: {
              title: node.title,
              description: node.description,
              type: node.type,
              kffmId: newKffm.id,
              ownerId: node.ownerId,
              positionX: node.positionX,
              positionY: node.positionY
            }
          });

          // Store the mapping of old ID to new ID
          nodeIdMap.set(node.id, newNode.id);

          // Clone node-metric relationships
          if (node.metrics && node.metrics.length > 0) {
            for (const metric of node.metrics) {
              await tx.kffmNodeMetric.create({
                data: {
                  nodeId: newNode.id,
                  metricId: metric.id
                }
              });
            }
          }
        }

        // Clone all connections using the node ID map
        for (const node of original.nodes) {
          if (node.outgoingConnections && node.outgoingConnections.length > 0) {
            for (const connection of node.outgoingConnections) {
              const sourceNodeId = nodeIdMap.get(connection.sourceNodeId);
              const targetNodeId = nodeIdMap.get(connection.targetNodeId);

              if (sourceNodeId && targetNodeId) {
                await tx.kffmConnection.create({
                  data: {
                    label: connection.label,
                    type: connection.type,
                    kffmId: newKffm.id,
                    sourceNodeId,
                    targetNodeId
                  }
                });
              }
            }
          }
        }

        // Return the new KFFM with all its details
        return await tx.kffm.findUnique({
          where: { id: newKffm.id },
          include: {
            nodes: {
              include: {
                owner: true,
                metrics: true,
                outgoingConnections: {
                  include: {
                    targetNode: true
                  }
                },
                incomingConnections: {
                  include: {
                    sourceNode: true
                  }
                }
              }
            }
          }
        }) as KFFM;
      });
    } catch (error) {
      logger.error(`Error in KFFMRepository.cloneKFFM`, { id, error });
      throw error;
    }
  }

  /**
   * Deletes a KFFM and all its related nodes and connections
   * @param id The ID of the KFFM to delete
   * @returns The deleted KFFM
   */
  async deleteKFFMWithRelations(id: string): Promise<KFFM> {
    try {
      this.validateId(id);

      logger.debug(`KFFMRepository.deleteKFFMWithRelations`, { id });

      return await this.transaction(async (tx) => {
        // First, get the KFFM to return it after deletion
        const kffm = await tx.kffm.findUnique({
          where: { id },
          include: { nodes: true }
        });

        if (!kffm) {
          throw NotFoundError.resourceNotFound('KFFM', id);
        }

        // Delete all connections for this KFFM
        await tx.kffmConnection.deleteMany({
          where: { kffmId: id }
        });

        // Get node IDs to delete node-metric relationships
        const nodeIds = kffm.nodes.map(node => node.id);

        // Delete node-metric relationships
        await tx.kffmNodeMetric.deleteMany({
          where: { nodeId: { in: nodeIds } }
        });

        // Delete all nodes
        await tx.kffmNode.deleteMany({
          where: { kffmId: id }
        });

        // Delete the KFFM itself
        await tx.kffm.delete({
          where: { id }
        });

        return kffm as KFFM;
      });
    } catch (error) {
      logger.error(`Error in KFFMRepository.deleteKFFMWithRelations`, { id, error });
      throw error;
    }
  }
}