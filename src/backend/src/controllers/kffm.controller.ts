import { Request, Response, NextFunction, Router } from 'express'; // express v4.18.2
import { KFFMService } from '../services/kffm/kffmService';
import { KFFMNodeService } from '../services/kffm/kffmNodeService';
import { KFFMConnectionService } from '../services/kffm/kffmConnectionService';
import {
  KFFM,
  KFFMNode,
  KFFMConnection,
  CreateKFFMDto,
  UpdateKFFMDto,
  CreateKFFMNodeDto,
  UpdateKFFMNodeDto,
  CreateKFFMConnectionDto,
  UpdateKFFMConnectionDto,
  KFFMQueryParams,
} from '../types/kffm.types';
import {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
} from '../utils/helpers/responseHelper';
import {
  parsePaginationParams,
  createPaginationLinks,
  PaginationParams,
} from '../utils/helpers/paginationHelper';
import { logger } from '../utils/helpers/logger';
import { authenticate } from '../api/middlewares/authentication';
import { authorize, authorizeResource, Permission } from '../api/middlewares/authorization';
import { validate, validateBody } from '../api/middlewares/requestValidator';
import { kffmValidation } from '../utils/validation/kffmValidation';

/**
 * Controller class that handles HTTP requests for Key Function Flow Map (KFFM) operations
 */
export class KFFMController {
  private kffmService: KFFMService;
  private nodeService: KFFMNodeService;
  private connectionService: KFFMConnectionService;
  private router: Router;

  /**
   * Initializes the controller with required services and sets up routes
   * @param kffmService Service for KFFM-related business logic
   * @param nodeService Service for KFFM node-related operations
   * @param connectionService Service for KFFM connection-related operations
   */
  constructor(
    kffmService: KFFMService,
    nodeService: KFFMNodeService,
    connectionService: KFFMConnectionService
  ) {
    this.kffmService = kffmService;
    this.nodeService = nodeService;
    this.connectionService = connectionService;
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Returns the configured Express router
   * @returns Configured Express router with KFFM routes
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Configures all routes for KFFM operations
   * @returns void
   */
  private setupRoutes(): void {
    this.setupKFFMRoutes();
    this.setupNodeRoutes();
    this.setupConnectionRoutes();
  }

  /**
   * Configures routes for KFFM operations
   * @returns void
   */
  private setupKFFMRoutes(): void {
    // GET /kffm - Retrieve all KFFMs with pagination and filtering
    this.router.get(
      '/kffm',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getAllKFFMs(req, res, next);
      }
    );

    // GET /kffm/:id - Retrieve a specific KFFM by ID
    this.router.get(
      '/kffm/:id',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getKFFMById(req, res, next);
      }
    );

    // GET /kffm/:id/details - Retrieve a KFFM with all details
    this.router.get(
      '/kffm/:id/details',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getKFFMWithDetails(req, res, next);
      }
    );

    // GET /kffm/organization/:organizationId - Retrieve KFFMs by organization
    this.router.get(
      '/kffm/organization/:organizationId',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getKFFMsByOrganization(req, res, next);
      }
    );

    // GET /kffm/organization/:organizationId/latest - Retrieve the latest KFFM for an organization
    this.router.get(
      '/kffm/organization/:organizationId/latest',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getLatestKFFM(req, res, next);
      }
    );

    // POST /kffm - Create a new KFFM
    this.router.post(
      '/kffm',
      authenticate,
      authorize(Permission.CREATE_KFFM),
      validateBody(kffmValidation.createKFFMSchema),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.createKFFM(req, res, next);
      }
    );

    // PUT /kffm/:id - Update an existing KFFM
    this.router.put(
      '/kffm/:id',
      authenticate,
      authorize(Permission.UPDATE_KFFM),
      validateBody(kffmValidation.updateKFFMSchema),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.updateKFFM(req, res, next);
      }
    );

    // PUT /kffm/:id/publish - Publish a KFFM
    this.router.put(
      '/kffm/:id/publish',
      authenticate,
      authorize(Permission.UPDATE_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.publishKFFM(req, res, next);
      }
    );

    // PUT /kffm/:id/archive - Archive a KFFM
    this.router.put(
      '/kffm/:id/archive',
      authenticate,
      authorize(Permission.UPDATE_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.archiveKFFM(req, res, next);
      }
    );

    // POST /kffm/:id/clone - Clone a KFFM
    this.router.post(
      '/kffm/:id/clone',
      authenticate,
      authorize(Permission.CREATE_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.cloneKFFM(req, res, next);
      }
    );

    // DELETE /kffm/:id - Delete a KFFM
    this.router.delete(
      '/kffm/:id',
      authenticate,
      authorize(Permission.DELETE_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.deleteKFFM(req, res, next);
      }
    );
  }

  /**
   * Configures routes for KFFM node operations
   * @returns void
   */
  private setupNodeRoutes(): void {
    // GET /kffm/:kffmId/nodes - Retrieve all nodes for a KFFM
    this.router.get(
      '/kffm/:kffmId/nodes',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getNodesByKFFMId(req, res, next);
      }
    );

    // GET /kffm/nodes/:nodeId - Retrieve a specific node
    this.router.get(
      '/kffm/nodes/:nodeId',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getNodeById(req, res, next);
      }
    );

    // POST /kffm/:kffmId/nodes - Create a new node
    this.router.post(
      '/kffm/:kffmId/nodes',
      authenticate,
      authorize(Permission.CREATE_KFFM),
      validateBody(kffmValidation.createNodeSchema),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.createNode(req, res, next);
      }
    );

    // PUT /kffm/nodes/:nodeId - Update an existing node
    this.router.put(
      '/kffm/nodes/:nodeId',
      authenticate,
      authorize(Permission.UPDATE_KFFM),
      validateBody(kffmValidation.updateNodeSchema),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.updateNode(req, res, next);
      }
    );

    // PATCH /kffm/nodes/:nodeId/position - Update a node's position
    this.router.patch(
      '/kffm/nodes/:nodeId/position',
      authenticate,
      authorize(Permission.UPDATE_KFFM),
      validateBody(kffmValidation.updateNodePositionSchema),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.updateNodePosition(req, res, next);
      }
    );

    // DELETE /kffm/nodes/:nodeId - Delete a node
    this.router.delete(
      '/kffm/nodes/:nodeId',
      authenticate,
      authorize(Permission.DELETE_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.deleteNode(req, res, next);
      }
    );
  }

  /**
   * Configures routes for KFFM connection operations
   * @returns void
   */
  private setupConnectionRoutes(): void {
    // GET /kffm/:kffmId/connections - Retrieve all connections for a KFFM
    this.router.get(
      '/kffm/:kffmId/connections',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getConnectionsByKFFMId(req, res, next);
      }
    );

    // GET /kffm/connections/:connectionId - Retrieve a specific connection
    this.router.get(
      '/kffm/connections/:connectionId',
      authenticate,
      authorize(Permission.VIEW_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.getConnectionById(req, res, next);
      }
    );

    // POST /kffm/:kffmId/connections - Create a new connection
    this.router.post(
      '/kffm/:kffmId/connections',
      authenticate,
      authorize(Permission.CREATE_KFFM),
      validateBody(kffmValidation.createConnectionSchema),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.createConnection(req, res, next);
      }
    );

    // PUT /kffm/connections/:connectionId - Update an existing connection
    this.router.put(
      '/kffm/connections/:connectionId',
      authenticate,
      authorize(Permission.UPDATE_KFFM),
      validateBody(kffmValidation.updateConnectionSchema),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.updateConnection(req, res, next);
      }
    );

    // DELETE /kffm/connections/:connectionId - Delete a connection
    this.router.delete(
      '/kffm/connections/:connectionId',
      authenticate,
      authorize(Permission.DELETE_KFFM),
      async (req: Request, res: Response, next: NextFunction) => {
        await this.deleteConnection(req, res, next);
      }
    );
  }

  /**
   * Handles GET request to retrieve all KFFMs with pagination and filtering
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getAllKFFMs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract query parameters for filtering
      const queryParams: KFFMQueryParams = req.query as any;

      // Parse pagination parameters from request
      const paginationParams: PaginationParams = parsePaginationParams(req.query);

      // Call kffmService.queryKFFMs with query and pagination parameters
      const { data, total } = await this.kffmService.queryKFFMs(queryParams, paginationParams);

      // Create pagination links
      const links = createPaginationLinks(req, paginationParams, total);

      // Return paginated response with KFFMs data
      paginatedResponse(res, data, { ...paginationParams, total, totalPages: Math.ceil(total / paginationParams.limit) }, links);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve a specific KFFM by ID
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getKFFMById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { id } = req.params;

      // Call kffmService.getKFFMById with the ID
      const kffm = await this.kffmService.getKFFMById(id);

      // Return success response with KFFM data
      successResponse(res, kffm);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve a KFFM with all its nodes and connections
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getKFFMWithDetails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { id } = req.params;

      // Call kffmService.getKFFMWithDetails with the ID
      const kffm = await this.kffmService.getKFFMWithDetails(id);

      // Return success response with detailed KFFM data
      successResponse(res, kffm);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve all KFFMs for a specific organization
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getKFFMsByOrganization(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract organization ID from request parameters
      const { organizationId } = req.params;

      // Parse pagination parameters from request
      const paginationParams: PaginationParams = parsePaginationParams(req.query);

      // Call kffmService.getKFFMsByOrganizationId with the organization ID
      const { data, total } = await this.kffmService.getKFFMsByOrganizationId(organizationId, paginationParams);

      // Return success response with KFFMs data
      successResponse(res, data, 'KFFMs retrieved successfully', 200);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve the latest KFFM for an organization
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getLatestKFFM(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract organization ID from request parameters
      const { organizationId } = req.params;

      // Call kffmService.getLatestKFFM with the organization ID
      const kffm = await this.kffmService.getLatestKFFM(organizationId);

      // Return success response with latest KFFM data or 404 if none exists
      if (kffm) {
        successResponse(res, kffm);
      } else {
        errorResponse(res, 'No KFFMs found for this organization', null, 404);
      }
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles POST request to create a new KFFM
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async createKFFM(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM data from request body
      const kffmData: CreateKFFMDto = req.body;

      // Call kffmService.createKFFM with the data
      const newKffm = await this.kffmService.createKFFM(kffmData);

      // Return created response with new KFFM data
      createdResponse(res, newKffm);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to update an existing KFFM
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async updateKFFM(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { id } = req.params;

      // Extract update data from request body
      const updateData: UpdateKFFMDto = req.body;

      // Call kffmService.updateKFFM with the ID and data
      const updatedKffm = await this.kffmService.updateKFFM(id, updateData);

      // Return success response with updated KFFM data
      successResponse(res, updatedKffm);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to publish a KFFM
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async publishKFFM(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { id } = req.params;

      // Call kffmService.publishKFFM with the ID
      const publishedKffm = await this.kffmService.publishKFFM(id);

      // Return success response with published KFFM data
      successResponse(res, publishedKffm);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to archive a KFFM
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async archiveKFFM(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { id } = req.params;

      // Call kffmService.archiveKFFM with the ID
      const archivedKffm = await this.kffmService.archiveKFFM(id);

      // Return success response with archived KFFM data
      successResponse(res, archivedKffm);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles POST request to clone a KFFM
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async cloneKFFM(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { id } = req.params;

      // Call kffmService.cloneKFFM with the ID
      const clonedKffm = await this.kffmService.cloneKFFM(id);

      // Return created response with cloned KFFM data
      createdResponse(res, clonedKffm);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles DELETE request to delete a KFFM
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async deleteKFFM(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { id } = req.params;

      // Call kffmService.deleteKFFM with the ID
      await this.kffmService.deleteKFFM(id);

      // Return no-content response
      noContentResponse(res);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve all nodes for a KFFM
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getNodesByKFFMId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { kffmId } = req.params;

      // Call nodeService.getNodesByKFFMId with the KFFM ID
      const nodes = await this.nodeService.getNodesByKFFMId(kffmId);

      // Return success response with nodes data
      successResponse(res, nodes);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve a specific node
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getNodeById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract node ID from request parameters
      const { nodeId } = req.params;

      // Call nodeService.getNodeById with the node ID
      const node = await this.nodeService.getNodeById(nodeId);

      // Return success response with node data
      successResponse(res, node);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles POST request to create a new node
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async createNode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { kffmId } = req.params;

      // Extract node data from request body
      const nodeData: CreateKFFMNodeDto = { ...req.body, kffmId };

      // Call nodeService.createNode with the data
      const newNode = await this.nodeService.createNode(nodeData);

      // Return created response with new node data
      createdResponse(res, newNode);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to update an existing node
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async updateNode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract node ID from request parameters
      const { nodeId } = req.params;

      // Extract update data from request body
      const updateData: UpdateKFFMNodeDto = req.body;

      // Call nodeService.updateNode with the ID and data
      const updatedNode = await this.nodeService.updateNode(nodeId, updateData);

      // Return success response with updated node data
      successResponse(res, updatedNode);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PATCH request to update a node's position
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async updateNodePosition(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract node ID from request parameters
      const { nodeId } = req.params;

      // Extract position data from request body
      const { positionX, positionY } = req.body;

      // Call nodeService.updateNodePosition with the ID and position data
      const updatedNode = await this.nodeService.updateNodePosition(nodeId, positionX, positionY);

      // Return success response with updated node data
      successResponse(res, updatedNode);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles DELETE request to delete a node
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async deleteNode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract node ID from request parameters
      const { nodeId } = req.params;

      // Call nodeService.deleteNode with the ID
      await this.nodeService.deleteNode(nodeId);

      // Return no-content response
      noContentResponse(res);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve all connections for a KFFM
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getConnectionsByKFFMId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { kffmId } = req.params;

      // Call connectionService.getConnectionsByKFFMId with the KFFM ID
      const connections = await this.connectionService.getConnectionsByKFFMId(kffmId);

      // Return success response with connections data
      successResponse(res, connections);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles GET request to retrieve a specific connection
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async getConnectionById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract connection ID from request parameters
      const { connectionId } = req.params;

      // Call connectionService.getConnectionById with the connection ID
      const connection = await this.connectionService.getConnectionById(connectionId);

      // Return success response with connection data
      successResponse(res, connection);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles POST request to create a new connection
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async createConnection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract KFFM ID from request parameters
      const { kffmId } = req.params;

      // Extract connection data from request body
      const connectionData: CreateKFFMConnectionDto = { ...req.body, kffmId };

      // Call connectionService.createConnection with the data
      const newConnection = await this.connectionService.createConnection(connectionData);

      // Return created response with new connection data
      createdResponse(res, newConnection);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles PUT request to update an existing connection
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async updateConnection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract connection ID from request parameters
      const { connectionId } = req.params;

      // Extract update data from request body
      const updateData: UpdateKFFMConnectionDto = req.body;

      // Call connectionService.updateConnection with the ID and data
      const updatedConnection = await this.connectionService.updateConnection(connectionId, updateData);

      // Return success response with updated connection data
      successResponse(res, updatedConnection);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles DELETE request to delete a connection
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   * @returns Promise<void> Asynchronous operation that returns no value
   */
  private async deleteConnection(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract connection ID from request parameters
      const { connectionId } = req.params;

      // Call connectionService.deleteConnection with the ID
      await this.connectionService.deleteConnection(connectionId);

      // Return no-content response
      noContentResponse(res);
    } catch (error) {
      this.handleError(error, next);
    }
  }

  /**
   * Handles errors in controller methods and passes them to the next middleware
   * @param error Error object
   * @param next Express NextFunction object
   * @returns void
   */
  private handleError(error: Error, next: NextFunction): void {
    logger.error('KFFMController error', { error });
    next(error);
  }
}