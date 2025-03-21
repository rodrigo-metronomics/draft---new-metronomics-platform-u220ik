import { z } from 'zod'; // Zod v3.x
import { KFFMStatus, NodeType, ConnectionType } from '../../types/kffm.types';
import { VALIDATION_ERRORS } from '../constants/errorMessages';

/**
 * Validates that node position coordinates are within valid ranges
 * @param positionX X-coordinate of the node position
 * @param positionY Y-coordinate of the node position
 * @returns True if position is valid, error message if invalid
 */
export const validateNodePosition = (positionX: number, positionY: number): boolean | string => {
  const minPosition = 0;
  const maxPosition = 2000; // Assuming a 2000x2000 canvas for KFFM editing

  if (positionX < minPosition || positionX > maxPosition || 
      positionY < minPosition || positionY > maxPosition) {
    return VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'position')
      .replace('{1}', minPosition.toString())
      .replace('{2}', maxPosition.toString());
  }
  
  return true;
};

/**
 * Validates that a connection between nodes is valid (not self-referential)
 * @param sourceNodeId ID of the source node
 * @param targetNodeId ID of the target node
 * @returns True if connection is valid, error message if invalid
 */
export const validateConnection = (sourceNodeId: string, targetNodeId: string): boolean | string => {
  if (sourceNodeId === targetNodeId) {
    return 'Source and target nodes cannot be the same';
  }
  
  return true;
};

// Schema for creating a new KFFM
export const createKFFMSchema = z.object({
  title: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'title'))
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'title')
      .replace('{1}', '1')
      .replace('{2}', '100')),
  description: z.string()
    .max(500, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'description')
      .replace('{1}', '0')
      .replace('{2}', '500')),
  organizationId: z.string()
    .uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'organizationId')
      .replace('{1}', 'UUID'))
});

// Schema for updating an existing KFFM
export const updateKFFMSchema = z.object({
  title: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'title'))
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'title')
      .replace('{1}', '1')
      .replace('{2}', '100')),
  description: z.string()
    .max(500, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'description')
      .replace('{1}', '0')
      .replace('{2}', '500')),
  status: z.nativeEnum(KFFMStatus, {
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'status')
      .replace('{1}', Object.values(KFFMStatus).join(', ')) })
  })
});

// Schema for creating a new KFFM node
export const createKFFMNodeSchema = z.object({
  title: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'title'))
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'title')
      .replace('{1}', '1')
      .replace('{2}', '100')),
  description: z.string()
    .max(500, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'description')
      .replace('{1}', '0')
      .replace('{2}', '500')),
  type: z.nativeEnum(NodeType, {
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'type')
      .replace('{1}', Object.values(NodeType).join(', ')) })
  }),
  kffmId: z.string()
    .uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'kffmId')
      .replace('{1}', 'UUID')),
  ownerId: z.string()
    .uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'ownerId')
      .replace('{1}', 'UUID')),
  positionX: z.number()
    .int(),
  positionY: z.number()
    .int(),
  metricIds: z.array(
    z.string().uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'metricId')
      .replace('{1}', 'UUID'))
  ).optional()
}).refine(
  (data) => validateNodePosition(data.positionX, data.positionY) === true,
  (data) => ({
    message: validateNodePosition(data.positionX, data.positionY) as string,
    path: ['position']
  })
);

// Schema for updating an existing KFFM node
export const updateKFFMNodeSchema = z.object({
  title: z.string()
    .min(1, VALIDATION_ERRORS.REQUIRED_FIELD.replace('{0}', 'title'))
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'title')
      .replace('{1}', '1')
      .replace('{2}', '100')),
  description: z.string()
    .max(500, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'description')
      .replace('{1}', '0')
      .replace('{2}', '500')),
  type: z.nativeEnum(NodeType, {
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'type')
      .replace('{1}', Object.values(NodeType).join(', ')) })
  }),
  ownerId: z.string()
    .uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'ownerId')
      .replace('{1}', 'UUID')),
  positionX: z.number()
    .int(),
  positionY: z.number()
    .int(),
  metricIds: z.array(
    z.string().uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'metricId')
      .replace('{1}', 'UUID'))
  ).optional()
}).refine(
  (data) => validateNodePosition(data.positionX, data.positionY) === true,
  (data) => ({
    message: validateNodePosition(data.positionX, data.positionY) as string,
    path: ['position']
  })
);

// Schema for creating a new connection between KFFM nodes
export const createKFFMConnectionSchema = z.object({
  label: z.string()
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'label')
      .replace('{1}', '0')
      .replace('{2}', '100')),
  type: z.nativeEnum(ConnectionType, {
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'type')
      .replace('{1}', Object.values(ConnectionType).join(', ')) })
  }),
  kffmId: z.string()
    .uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'kffmId')
      .replace('{1}', 'UUID')),
  sourceNodeId: z.string()
    .uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'sourceNodeId')
      .replace('{1}', 'UUID')),
  targetNodeId: z.string()
    .uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'targetNodeId')
      .replace('{1}', 'UUID'))
}).refine(
  (data) => validateConnection(data.sourceNodeId, data.targetNodeId) === true,
  (data) => ({
    message: validateConnection(data.sourceNodeId, data.targetNodeId) as string,
    path: ['connection']
  })
);

// Schema for updating an existing connection between KFFM nodes
export const updateKFFMConnectionSchema = z.object({
  label: z.string()
    .max(100, VALIDATION_ERRORS.INVALID_VALUE_RANGE
      .replace('{0}', 'label')
      .replace('{1}', '0')
      .replace('{2}', '100')),
  type: z.nativeEnum(ConnectionType, {
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'type')
      .replace('{1}', Object.values(ConnectionType).join(', ')) })
  })
});

// Schema for filtering KFFM entities
export const kffmFiltersSchema = z.object({
  organizationId: z.string()
    .uuid(VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'organizationId')
      .replace('{1}', 'UUID'))
    .optional(),
  status: z.nativeEnum(KFFMStatus, {
    errorMap: () => ({ message: VALIDATION_ERRORS.INVALID_FORMAT
      .replace('{0}', 'status')
      .replace('{1}', Object.values(KFFMStatus).join(', ')) })
  }).optional(),
  includeNodes: z.boolean().optional(),
  includeConnections: z.boolean().optional()
});