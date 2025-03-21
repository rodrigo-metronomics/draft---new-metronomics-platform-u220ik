import { jest } from 'jest';
import { PrismaClient } from '@prisma/client';

/**
 * Creates a mock of the Prisma Client for testing purposes
 * This allows tests to run without a real database connection
 */
const mockPrismaClient = () => {
  // Create mock implementations for common model methods
  const createModelMethods = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  });

  // Create a mock client with all models
  const prismaMock = {
    user: createModelMethods(),
    organization: createModelMethods(),
    team: createModelMethods(),
    teamMember: createModelMethods(),
    meeting: createModelMethods(),
    meetingParticipant: createModelMethods(),
    meetingStage: createModelMethods(),
    meetingNote: createModelMethods(),
    actionItem: createModelMethods(),
    goal: createModelMethods(),
    milestone: createModelMethods(),
    metric: createModelMethods(),
    metricValue: createModelMethods(),
    metricThreshold: createModelMethods(),
    metricGoal: createModelMethods(),
    kffm: createModelMethods(),
    kffmNode: createModelMethods(),
    kffmConnection: createModelMethods(),
    kffmNodeMetric: createModelMethods(),
    notification: createModelMethods(),
    notificationDelivery: createModelMethods(),

    // Mock transaction capabilities
    $transaction: jest.fn().mockImplementation(callback => {
      return callback(prismaMock);
    }),

    // Mock connection methods
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return prismaMock;
};

// Create and export the mock
const prismaMock = mockPrismaClient() as unknown as PrismaClient;

export { prismaMock };

// Example usage in tests:
//
// import { prismaMock } from '../mocks/prismaMock';
//
// jest.mock('@prisma/client', () => {
//   return {
//     PrismaClient: jest.fn(() => prismaMock),
//   };
// });
//
// beforeEach(() => {
//   // Reset all mocks before each test
//   jest.clearAllMocks();
//   
//   // Setup specific mock implementations for the current test
//   prismaMock.user.findUnique.mockResolvedValue({
//     id: '1',
//     name: 'Test User',
//     email: 'test@example.com',
//   });
// });