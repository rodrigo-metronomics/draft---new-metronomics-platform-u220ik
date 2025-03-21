import { Request, Response, NextFunction } from 'express'; // express v4.18.2
import { z, ZodSchema, ZodError } from 'zod'; // zod v3.21.4
import { ValidationError } from '../../utils/errors';
import { logger } from '../../utils/helpers/logger';

/**
 * Interface for validate function options
 */
interface ValidateOptions {
  schema: ZodSchema<any>;
  source: 'body' | 'query' | 'params';
}

/**
 * Factory function that creates middleware for validating different parts of the request against Zod schemas
 * 
 * @param options Object containing the schema and source (body, query, or params)
 * @returns Express middleware function that validates request data
 */
export function validate(options: ValidateOptions) {
  const { schema, source } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract data from the request based on the source
      const data = req[source];
      
      // Validate the data using the provided schema
      const validatedData = schema.parse(data);
      
      // Replace the original data with the validated data
      req[source] = validatedData;
      
      // Continue to next middleware
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert ZodError to ValidationError
        const validationError = ValidationError.fromZodError(error);
        
        // Log validation error for debugging
        logger.debug(`Validation failed for ${source}`, { errors: error.errors });
        
        // Pass the validation error to the next middleware (error handler)
        next(validationError);
      } else {
        // Pass any other errors to the next middleware
        next(error);
      }
    }
  };
}

/**
 * Convenience function that creates middleware specifically for validating request body data
 * 
 * @param schema Zod schema to validate against
 * @returns Express middleware function that validates request body
 */
export function validateBody(schema: ZodSchema<any>) {
  return validate({ schema, source: 'body' });
}

/**
 * Convenience function that creates middleware specifically for validating request query parameters
 * 
 * @param schema Zod schema to validate against
 * @returns Express middleware function that validates request query parameters
 */
export function validateQuery(schema: ZodSchema<any>) {
  return validate({ schema, source: 'query' });
}

/**
 * Convenience function that creates middleware specifically for validating request URL parameters
 * 
 * @param schema Zod schema to validate against
 * @returns Express middleware function that validates request URL parameters
 */
export function validateParams(schema: ZodSchema<any>) {
  return validate({ schema, source: 'params' });
}