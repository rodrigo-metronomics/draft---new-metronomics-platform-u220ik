import { jest } from 'jest'; // jest version ^29.5.0
import { prismaMock } from './mocks/prismaMock';
import { 
  auth, 
  firestore, 
  messaging, 
  resetMockFirestoreData, 
  resetMockAuthData 
} from './mocks/firebaseMock';
import { redisMock, resetMockRedisData } from './mocks/redisMock';

/**
 * Mocks the configuration module to use test mocks instead of real services
 */
function mockConfig() {
  // Mock the main configuration module with test implementations
  jest.mock('../src/config/index.ts', () => ({
    database: { prisma: prismaMock },
    firebase: { auth, firestore, messaging },
    redis: { redis: redisMock },
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret',
      JWT_EXPIRES_IN: '1h',
      API_VERSION: 'v1',
      API_PREFIX: '/api',
      PORT: 4000,
      LOG_LEVEL: 'error'
    }
  }));

  // Mock individual configuration modules
  jest.mock('../src/config/database.ts', () => ({
    prisma: prismaMock
  }));

  jest.mock('../src/config/firebase.ts', () => ({
    auth,
    firestore,
    messaging
  }));

  jest.mock('../src/config/redis.ts', () => ({
    redis: redisMock
  }));
}

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.API_VERSION = 'v1';
process.env.API_PREFIX = '/api';
process.env.PORT = '4000';
process.env.LOG_LEVEL = 'error';

// Initialize mock configurations
mockConfig();

// Set up global Jest hooks
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset mock data stores to ensure tests don't affect each other
  resetMockFirestoreData();
  resetMockAuthData();
  resetMockRedisData();
});

// This setup file does not need to export anything as it configures the global test environment