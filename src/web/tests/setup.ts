import '@testing-library/jest-dom'; // ^5.16.5
import 'jest-environment-jsdom'; // ^29.5.0
import 'whatwg-fetch'; // ^3.6.2
import { configure } from '@testing-library/react'; // ^14.0.0
import { vi } from 'vitest'; // v0.34.0

import { resetMockFirebase } from './mocks/firebaseMocks';
import { setupReactQueryMocks, resetReactQueryMocks } from './mocks/reactQueryMock';
import {
  mockAuthApi,
  mockMeetingApi,
  mockMetricApi,
  mockGoalApi,
  mockOrganizationApi,
  mockUserApi,
  mockKffmApi,
  mockActionItemApi,
  mockNotificationApi,
  mockTeamApi
} from './mocks/apiMocks';

// Configure React Testing Library with custom options
configure({
  testIdAttribute: 'data-testid',
});

// Mock implementation of the global fetch function
const mockFetch = (url: string, options?: any): Promise<Response> => {
  // Create a mock Response object with JSON method
  const mockResponse = {
    json: () => Promise.resolve({ data: {} }),
  } as Response;

  // Return a Promise that resolves to the mock Response
  return Promise.resolve(mockResponse);
};

// Mock implementation of the ResizeObserver API
const mockResizeObserver = (callback: Function): ResizeObserver => {
  // Create a mock object with observe, unobserve, and disconnect methods
  const mock = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };

  // Return the mock ResizeObserver instance
  return mock as unknown as ResizeObserver;
};

// Mock implementation of the IntersectionObserver API
const mockIntersectionObserver = (callback: Function, options?: any): IntersectionObserver => {
  // Create a mock object with observe, unobserve, disconnect, and root properties
  const mock = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  };

  // Return the mock IntersectionObserver instance
  return mock as unknown as IntersectionObserver;
};

// Mock implementation of the window.matchMedia function
const mockMatchMedia = (query: string): MediaQueryList => {
  // Create a mock MediaQueryList with matches, media, and addEventListener/removeEventListener methods
  const mock = {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  // Return the mock MediaQueryList object
  return mock as unknown as MediaQueryList;
};

// Sets up default implementations for all API mocks
const setupApiMocks = (): void => {
  // Configure default success responses for all API mock methods
  Object.values(mockAuthApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockMeetingApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockMetricApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockGoalApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockOrganizationApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockUserApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockKffmApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockActionItemApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockNotificationApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));
  Object.values(mockTeamApi).forEach(mock => mock.mockResolvedValue({ success: true, data: {} }));

  // Set up specific mock implementations for commonly used API calls
  // Example: mockAuthApi.login.mockResolvedValue({ success: true, data: { accessToken: 'test-token', user: { id: 'test-user' } } });
};

// Set up global mocks for browser APIs
global.fetch = vi.fn().mockImplementation(mockFetch);
global.ResizeObserver = vi.fn().mockImplementation(mockResizeObserver);
global.IntersectionObserver = vi.fn().mockImplementation(mockIntersectionObserver);
global.matchMedia = vi.fn().mockImplementation(mockMatchMedia);

// Set up global beforeEach hook to reset all mocks before each test
beforeEach(() => {
  // Reset all API mocks
  setupApiMocks();

  // Reset React Query mocks
  resetReactQueryMocks();

  // Reset Firebase mocks
  resetMockFirebase();
});

// Set up global afterEach hook to verify all mocks were called as expected
afterEach(() => {
  // Verify all mocks were called as expected
  // Example: expect(mockAuthApi.login).toHaveBeenCalled();
});

// Configure environment variables for testing
process.env.VITE_API_URL = 'http://localhost:4000/api';
process.env.VITE_API_VERSION = 'v1';
process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-auth-domain';
process.env.VITE_FIREBASE_PROJECT_ID = 'test-project-id';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = 'test-messaging-sender-id';
process.env.VITE_FIREBASE_APP_ID = 'test-app-id';