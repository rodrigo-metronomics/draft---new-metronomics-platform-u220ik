import express from 'express'; // version ^4.18.2
import cors from 'cors'; // version ^2.8.5
import helmet from 'helmet'; // version ^7.0.0
import compression from 'compression'; // version ^1.7.4
import { expressjwt as jwt } from 'express-jwt'; // version 8.4.1
import { expressjwt } from 'express-jwt'; // version 8.4.1
import { errorHandler, requestLogger, rateLimiter, createRateLimiter } from './middlewares';
import setupRoutes from './routes';
import { logger } from '../utils/helpers/logger';
import { env } from '../config';
import { OpenAPIV3 } from 'express-openapi-validator'; // version ^5.0.1
import { ExpressOpenAPI } from 'express-openapi-validator'; // version ^5.0.1

/**
 * Configures and returns an Express application with all middleware and routes
 * @returns {express.Application} Configured Express application
 */
const setupApi = (): express.Application => {
  // LD1: Create a new Express application instance
  const app = express();

  // LD1: Configure basic middleware (json parser, url-encoded parser, etc.)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // LD1: Configure security middleware (helmet, cors, etc.)
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
    credentials: true,
  }));

  // LD1: Configure performance middleware (compression)
  app.use(compression());

  // LD1: Configure request logging middleware
  app.use(requestLogger);

  // LD1: Configure rate limiting middleware
  app.use(rateLimiter);

  // LD1: Set up API routes by mounting the router from setupRoutes()
  app.use('/api', setupRoutes);

  // LD1: Configure error handling middleware
  app.use(errorHandler);

  // LD1: Log successful API configuration
  logger.info('API configuration complete');

  // LD1: Return the configured Express application
  return app;
};

// Export the setupApi function as the default export to be used by app.ts
export default setupApi;