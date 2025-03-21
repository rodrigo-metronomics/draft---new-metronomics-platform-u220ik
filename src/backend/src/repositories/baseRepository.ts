import { Prisma } from '@prisma/client'; // ^4.15.0
import { prisma } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { PaginationParams } from '../utils/helpers/paginationHelper';
import { logger } from '../utils/helpers/logger';

/**
 * Abstract base repository class that provides common CRUD operations for database entities.
 * This class serves as a foundation for all repository implementations in the Metronomics Platform,
 * promoting code reuse and consistent data access patterns.
 * 
 * @typeParam T - The entity type this repository manages
 */
export abstract class BaseRepository<T> {
  protected model: any;
  protected modelName: string;

  /**
   * Initializes the repository with the specified Prisma model
   * @param modelName - The name of the Prisma model to use
   */
  constructor(modelName: string) {
    this.modelName = modelName;
    this.model = (prisma as any)[modelName];
    
    if (!this.model) {
      throw new Error(`Invalid model name: ${modelName}`);
    }
  }

  /**
   * Finds an entity by its ID
   * @param id - The ID of the entity to find
   * @param options - Additional query options such as includes
   * @returns The entity if found, or null if not found
   */
  async findById(id: string, options: Record<string, any> = {}): Promise<T | null> {
    try {
      this.validateId(id);
      
      const include = this.buildInclude(options);
      
      logger.debug(`Repository ${this.modelName}.findById`, { id, include });
      
      const result = await this.model.findUnique({
        where: { id },
        ...include
      });
      
      return result;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.findById`, { id, error });
      throw error;
    }
  }

  /**
   * Finds an entity by its ID or throws an error if not found
   * @param id - The ID of the entity to find
   * @param options - Additional query options such as includes
   * @returns The found entity
   * @throws NotFoundError if the entity is not found
   */
  async findByIdOrThrow(id: string, options: Record<string, any> = {}): Promise<T> {
    const result = await this.findById(id, options);
    
    if (!result) {
      throw NotFoundError.resourceNotFound(this.modelName, id);
    }
    
    return result;
  }

  /**
   * Finds multiple entities based on provided filters and pagination
   * @param filters - Filters to apply to the query
   * @param pagination - Pagination parameters
   * @param options - Additional query options such as includes and sorting
   * @returns Paginated result with entities and total count
   */
  async findMany(
    filters: Record<string, any> = {}, 
    pagination: PaginationParams,
    options: Record<string, any> = {}
  ): Promise<{ data: T[]; total: number }> {
    try {
      const where = this.buildWhere(filters);
      const paginationParams = this.buildPagination(pagination);
      const orderBy = this.buildOrderBy(options);
      const include = this.buildInclude(options);
      
      logger.debug(`Repository ${this.modelName}.findMany`, { 
        where, pagination: paginationParams, orderBy, include 
      });
      
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          ...paginationParams,
          ...(orderBy && { orderBy }),
          ...include
        }),
        this.model.count({ where })
      ]);
      
      return { data, total };
    } catch (error) {
      logger.error(`Error in ${this.modelName}.findMany`, { filters, error });
      throw error;
    }
  }

  /**
   * Finds the first entity matching the provided filters
   * @param filters - Filters to apply to the query
   * @param options - Additional query options such as includes
   * @returns The first matching entity or null if none found
   */
  async findFirst(
    filters: Record<string, any> = {}, 
    options: Record<string, any> = {}
  ): Promise<T | null> {
    try {
      const where = this.buildWhere(filters);
      const include = this.buildInclude(options);
      const orderBy = this.buildOrderBy(options);
      
      logger.debug(`Repository ${this.modelName}.findFirst`, { where, include, orderBy });
      
      const result = await this.model.findFirst({
        where,
        ...include,
        ...(orderBy && { orderBy })
      });
      
      return result;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.findFirst`, { filters, error });
      throw error;
    }
  }

  /**
   * Creates a new entity
   * @param data - The data for the new entity
   * @returns The created entity
   */
  async create(data: Record<string, any>): Promise<T> {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw ValidationError.requiredField('data');
      }
      
      logger.debug(`Repository ${this.modelName}.create`, { data });
      
      const result = await this.model.create({
        data
      });
      
      return result;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.create`, { data, error });
      throw error;
    }
  }

  /**
   * Updates an existing entity by ID
   * @param id - The ID of the entity to update
   * @param data - The data to update
   * @returns The updated entity
   * @throws NotFoundError if the entity is not found
   */
  async update(id: string, data: Record<string, any>): Promise<T> {
    try {
      this.validateId(id);
      
      if (!data || Object.keys(data).length === 0) {
        throw ValidationError.requiredField('data');
      }
      
      logger.debug(`Repository ${this.modelName}.update`, { id, data });
      
      const result = await this.model.update({
        where: { id },
        data
      });
      
      return result;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.update`, { id, data, error });
      
      // Check if it's a Prisma not found error (P2025)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound(this.modelName, id);
      }
      
      throw error;
    }
  }

  /**
   * Deletes an entity by ID
   * @param id - The ID of the entity to delete
   * @returns The deleted entity
   * @throws NotFoundError if the entity is not found
   */
  async delete(id: string): Promise<T> {
    try {
      this.validateId(id);
      
      logger.debug(`Repository ${this.modelName}.delete`, { id });
      
      const result = await this.model.delete({
        where: { id }
      });
      
      return result;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.delete`, { id, error });
      
      // Check if it's a Prisma not found error (P2025)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw NotFoundError.resourceNotFound(this.modelName, id);
      }
      
      throw error;
    }
  }

  /**
   * Counts entities matching the provided filters
   * @param filters - Filters to apply to the query
   * @returns The count of matching entities
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    try {
      const where = this.buildWhere(filters);
      
      logger.debug(`Repository ${this.modelName}.count`, { where });
      
      const count = await this.model.count({ where });
      
      return count;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.count`, { filters, error });
      throw error;
    }
  }

  /**
   * Checks if an entity exists with the provided filters
   * @param filters - Filters to apply to the query
   * @returns True if an entity exists, false otherwise
   */
  async exists(filters: Record<string, any> = {}): Promise<boolean> {
    const count = await this.count(filters);
    return count > 0;
  }

  /**
   * Executes a function within a database transaction
   * @param fn - The function to execute within the transaction
   * @returns The result of the function
   */
  async transaction<TResult>(
    fn: (tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">) => Promise<TResult>
  ): Promise<TResult> {
    try {
      logger.debug(`Repository ${this.modelName}.transaction started`);
      
      const result = await prisma.$transaction(async (tx) => {
        return await fn(tx);
      });
      
      logger.debug(`Repository ${this.modelName}.transaction completed`);
      
      return result;
    } catch (error) {
      logger.error(`Error in ${this.modelName}.transaction`, { error });
      throw error;
    }
  }

  /**
   * Validates that an ID is a non-empty string
   * @param id - The ID to validate
   * @throws ValidationError if the ID is invalid
   */
  protected validateId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw ValidationError.requiredField('id');
    }
  }

  /**
   * Builds the include object for Prisma queries
   * @param options - Query options containing include specifications
   * @returns The include object for Prisma
   */
  protected buildInclude(options: Record<string, any> = {}): Record<string, any> {
    if (options.include) {
      return { include: options.include };
    }
    return {};
  }

  /**
   * Builds the where clause for Prisma queries
   * @param filters - Filters to apply to the query
   * @returns The where clause for Prisma
   */
  protected buildWhere(filters: Record<string, any> = {}): Record<string, any> {
    // Copy filters to avoid modifying the original
    const where: Record<string, any> = {};
    
    // Process each filter to handle special cases
    Object.entries(filters).forEach(([key, value]) => {
      // Skip undefined or empty string values
      if (value === undefined || value === '') {
        return;
      }
      
      // Handle search filter with contains (case insensitive)
      if (key === 'search' && typeof value === 'string' && value.trim() !== '') {
        // Implementation depends on the specific model
        // Example: where.OR = [{ name: { contains: value, mode: 'insensitive' } }]
        return;
      }
      
      // Handle date range filters
      if (key.endsWith('_from') && value) {
        const fieldName = key.replace('_from', '');
        where[fieldName] = {
          ...(where[fieldName] || {}),
          gte: new Date(value as string)
        };
        return;
      }
      
      if (key.endsWith('_to') && value) {
        const fieldName = key.replace('_to', '');
        where[fieldName] = {
          ...(where[fieldName] || {}),
          lte: new Date(value as string)
        };
        return;
      }
      
      // Handle multi-tenant filtering
      if (key === 'organizationId' && value) {
        where.organizationId = value;
        return;
      }
      
      // Handle null/not null filters
      if (value === 'null') {
        where[key] = null;
        return;
      }
      
      if (value === 'not_null') {
        where[key] = { not: null };
        return;
      }
      
      // Handle array of values (IN operator)
      if (Array.isArray(value)) {
        where[key] = { in: value };
        return;
      }
      
      // Default case - direct equality
      where[key] = value;
    });
    
    return where;
  }

  /**
   * Builds the orderBy clause for Prisma queries
   * @param options - Query options containing sort specifications
   * @returns The orderBy clause for Prisma
   */
  protected buildOrderBy(options: Record<string, any> = {}): Record<string, any> | undefined {
    // Handle sort format: { sort: { field: 'asc' | 'desc' } }
    if (options.sort && typeof options.sort === 'object') {
      return options.sort;
    }
    
    // Handle sort format: { sortBy: 'field', sortOrder: 'asc' | 'desc' }
    if (options.sortBy) {
      const direction = options.sortOrder === 'desc' ? 'desc' : 'asc';
      return { [options.sortBy]: direction };
    }
    
    // Default sorting (can be overridden by derived repositories)
    // return { createdAt: 'desc' };
    
    return undefined;
  }

  /**
   * Builds the pagination parameters for Prisma queries
   * @param pagination - Pagination parameters
   * @returns The pagination parameters for Prisma
   */
  protected buildPagination(pagination: PaginationParams): Record<string, any> {
    return {
      skip: pagination.offset,
      take: pagination.limit
    };
  }
}