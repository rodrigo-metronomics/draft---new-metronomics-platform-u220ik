import type { Config } from 'jest'; // jest v29.5.0

const config: Config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Use Node.js environment for backend tests
  testEnvironment: 'node',
  
  // Directories to search for tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Test file patterns to match
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  
  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  
  // Module path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Enable code coverage collection
  collectCoverage: true,
  
  // Files to include in coverage analysis
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/server.ts',
    '!src/app.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    },
    'src/services/**/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    },
    'src/controllers/**/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    }
  },
  
  // Where to output coverage reports
  coverageDirectory: '<rootDir>/coverage',
  
  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout in milliseconds
  testTimeout: 10000,
  
  // Verbose test output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocked functions after each test
  restoreMocks: true,
  
  // Don't reset mocked state between tests
  resetMocks: false,
  
  // Patterns to ignore for tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Patterns to ignore for watch mode
  watchPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Global configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      isolatedModules: true
    }
  }
};

export default config;