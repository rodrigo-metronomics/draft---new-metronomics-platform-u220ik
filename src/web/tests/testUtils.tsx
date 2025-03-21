import React, { ReactNode } from 'react'; // react@^18.0.0
import { render, RenderOptions, RenderResult, screen, waitFor } from '@testing-library/react'; // ^14.0.0
import { QueryClient, QueryClientProvider } from 'react-query'; // ^5.0.0
import { MemoryRouter, Routes, Route } from 'react-router-dom'; // ^6.0.0
import { vi } from 'vitest'; // ^0.34.0

// Internal imports for context and types
import { AuthContext, AuthContextType } from '../src/contexts/AuthContext';
import { NotificationContext, NotificationContextType } from '../src/contexts/NotificationContext';
import { OrganizationContext, OrganizationContextType } from '../src/contexts/OrganizationContext';
import { RealtimeContext, RealtimeContextType } from '../src/contexts/RealtimeContext';
import { AuthUser, AuthState } from '../src/types/auth.types';
import { Organization, OrganizationSettings } from '../src/types/organization.types';
import { UserRole } from '../src/utils/constants/roles';
import { Permission } from '../src/utils/constants/permissions';
import { mockUseQuery, mockUseMutation } from './mocks/reactQueryMock';

// Define a global QueryClient for testing purposes
const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

/**
 * Creates a mock authenticated user for testing
 * @param overrides Optional properties to override default values
 * @returns A mock authenticated user object
 */
export const createMockAuthUser = (overrides: Partial<AuthUser> = {}): AuthUser => {
  // Create a default mock user with id, email, firstName, lastName, role, organizationId, and other required properties
  const mockUser: AuthUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.VIEWER,
    organizationId: 'test-org-id',
    authId: 'firebase-auth-id',
    profileImageUrl: null,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockUser; // Return the mock user object
};

/**
 * Creates a mock authentication state for testing
 * @param overrides Optional properties to override default values
 * @returns A mock authentication state object
 */
export const createMockAuthState = (overrides: Partial<AuthState> = {}): AuthState => {
  // Create a default mock auth state with user, isAuthenticated, isLoading, error, and permissions
  const mockAuthState: AuthState = {
    user: createMockAuthUser(),
    isAuthenticated: true,
    isLoading: false,
    error: null,
    permissions: [Permission.VIEW_DASHBOARD],
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockAuthState; // Return the mock auth state object
};

/**
 * Creates a mock organization for testing
 * @param overrides Optional properties to override default values
 * @returns A mock organization object
 */
export const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => {
  // Create a default mock organization with id, name, settings, status, createdAt, and updatedAt
  const mockOrganization: Organization = {
    id: 'test-org-id',
    name: 'Test Organization',
    settings: createMockOrganizationSettings(),
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockOrganization; // Return the mock organization object
};

/**
 * Creates mock organization settings for testing
 * @param overrides Optional properties to override default values
 * @returns A mock organization settings object
 */
export const createMockOrganizationSettings = (overrides: Partial<OrganizationSettings> = {}): OrganizationSettings => {
  // Create default mock organization settings with theme, timezone, defaultMeetingDuration, defaultMeetingReminders, logoUrl, and customFields
  const mockOrganizationSettings: OrganizationSettings = {
    theme: 'light',
    timezone: 'UTC',
    defaultMeetingDuration: 60,
    defaultMeetingReminders: [15, 5],
    logoUrl: null,
    customFields: {},
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockOrganizationSettings; // Return the mock organization settings object
};

/**
 * Creates a mock authentication context for testing
 * @param overrides Optional properties to override default values
 * @returns A mock authentication context object
 */
export const createMockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => {
  // Create a default mock auth context with state and all required methods (login, loginWithGoogle, loginWithMicrosoft, register, logout, etc.)
  const mockAuthContext: AuthContextType = {
    state: createMockAuthState(),
    login: vi.fn(), // Mock all methods with vi.fn() to allow spying and assertions
    loginWithGoogle: vi.fn(),
    loginWithMicrosoft: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    refreshToken: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockAuthContext; // Return the mock auth context object
};

/**
 * Creates a mock organization context for testing
 * @param overrides Optional properties to override default values
 * @returns A mock organization context object
 */
export const createMockOrganizationContext = (overrides: Partial<OrganizationContextType> = {}): OrganizationContextType => {
  // Create a default mock organization context with currentOrganization, organizations, isLoading, error, and all required methods
  const mockOrganizationContext: OrganizationContextType = {
    currentOrganization: createMockOrganization(),
    organizations: [createMockOrganization()],
    teams: [],
    loading: false,
    error: null,
    fetchOrganizations: vi.fn(), // Mock all methods with vi.fn() to allow spying and assertions
    fetchCurrentOrganization: vi.fn(),
    switchOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    updateOrganizationSettings: vi.fn(),
    fetchTeams: vi.fn(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockOrganizationContext; // Return the mock organization context object
};

/**
 * Creates a mock notification context for testing
 * @param overrides Optional properties to override default values
 * @returns A mock notification context object
 */
export const createMockNotificationContext = (overrides: Partial<NotificationContextType> = {}): NotificationContextType => {
  // Create a default mock notification context with notifications, unreadCount, isLoading, error, and all required methods
  const mockNotificationContext: NotificationContextType = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    preferences: null,
    markAsRead: vi.fn(), // Mock all methods with vi.fn() to allow spying and assertions
    markAllAsRead: vi.fn(),
    archiveNotification: vi.fn(),
    fetchNotifications: vi.fn(),
    updatePreferences: vi.fn(),
    showToast: vi.fn(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockNotificationContext; // Return the mock notification context object
};

/**
 * Creates a mock realtime context for testing
 * @param overrides Optional properties to override default values
 * @returns A mock realtime context object
 */
export const createMockRealtimeContext = (overrides: Partial<RealtimeContextType> = {}): RealtimeContextType => {
  // Create a default mock realtime context with isConnected, activeUsers, and all required methods
  const mockRealtimeContext: RealtimeContextType = {
    connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
    error: null,
    syncDocument: vi.fn(), // Mock all methods with vi.fn() to allow spying and assertions
    syncCollection: vi.fn(),
    updateDocument: vi.fn(),
    createDocument: vi.fn(),
    deleteDocument: vi.fn(),
    joinMeeting: vi.fn(),
    leaveMeeting: vi.fn(),
    updateUserPresence: vi.fn(),
    updateTypingStatus: vi.fn(),
    subscribeToMeeting: vi.fn(),
    subscribeToMeetingStages: vi.fn(),
    subscribeToActionItems: vi.fn(),
    subscribeToParticipants: vi.fn(),
    updateMeetingStatus: vi.fn(),
    updateCurrentStage: vi.fn(),
    updateStageContent: vi.fn(),
    createActionItem: vi.fn(),
    updateActionItem: vi.fn(),
    deleteActionItem: vi.fn(),
    startMeeting: vi.fn(),
    endMeeting: vi.fn(),
    pauseMeeting: vi.fn(),
    resumeMeeting: vi.fn(),
    subscribeToUserPresence: vi.fn(),
    subscribeToOrganizationPresence: vi.fn(),
    isUserActive: vi.fn(),
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockRealtimeContext; // Return the mock realtime context object
};

/**
 * Interface defining the props for the AllTheProviders component
 */
interface AllTheProvidersProps {
  children: ReactNode;
  authContext?: AuthContextType;
  organizationContext?: OrganizationContextType;
  notificationContext?: NotificationContextType;
  realtimeContext?: RealtimeContextType;
  queryClient?: QueryClient;
  routes?: Array<{ path: string; element: ReactNode }>;
  initialRoute?: string;
}

/**
 * Wrapper component that provides all necessary context providers for testing
 */
const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  authContext = createMockAuthContext(),
  organizationContext = createMockOrganizationContext(),
  notificationContext = createMockNotificationContext(),
  realtimeContext = createMockRealtimeContext(),
  queryClient = testQueryClient,
  routes,
  initialRoute = '/',
}) => {
  // Wrap children with AuthContext.Provider using authContext value
  return (
    <AuthContext.Provider value={authContext}>
      {/* Wrap with OrganizationContext.Provider using organizationContext value */}
      <OrganizationContext.Provider value={organizationContext}>
        {/* Wrap with NotificationContext.Provider using notificationContext value */}
        <NotificationContext.Provider value={notificationContext}>
          {/* Wrap with RealtimeContext.Provider using realtimeContext value */}
          <RealtimeContext.Provider value={realtimeContext}>
            {/* Wrap with QueryClientProvider using queryClient */}
            <QueryClientProvider client={queryClient}>
              {/* Wrap with MemoryRouter and Routes if routes are provided */}
              {routes ? (
                <MemoryRouter initialEntries={[initialRoute]}>
                  <Routes>
                    {routes.map((route, index) => (
                      <Route key={index} path={route.path} element={route.element} />
                    ))}
                  </Routes>
                  {children}
                </MemoryRouter>
              ) : (
                children
              )}
            </QueryClientProvider>
          </RealtimeContext.Provider>
        </NotificationContext.Provider>
      </OrganizationContext.Provider>
    </AuthContext.Provider>
  );
};

/**
 * Renders a component with all necessary context providers for testing
 * @param ui The component to render
 * @param options Optional properties to override default context values
 * @returns The render result from React Testing Library
 */
export const renderWithProviders = (
  ui: ReactNode,
  options: Omit<RenderOptions, 'wrapper'> & Partial<AllTheProvidersProps> = {}
): RenderResult => {
  // Render the UI with the wrapper using React Testing Library's render function
  return render(ui, { wrapper: (props) => <AllTheProviders {...props} {...options} />, ...options });
};

/**
 * Renders a component with only the authentication context provider
 * @param ui The component to render
 * @param authContextOverrides Optional properties to override default auth context values
 * @returns The render result from React Testing Library
 */
export const renderWithAuth = (
  ui: ReactNode,
  authContextOverrides: Partial<AuthContextType> = {}
): RenderResult => {
  // Create a mock auth context using the provided overrides or defaults
  const mockAuthContext = createMockAuthContext(authContextOverrides);

  // Create a wrapper component that wraps the UI with the AuthContext.Provider
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );

  // Render the UI with the wrapper using React Testing Library's render function
  return render(ui, { wrapper: Wrapper });
};

/**
 * Renders a component with React Router providers
 * @param ui The component to render
 * @param routes An array of route objects to configure the router
 * @param initialRoute The initial route for the router
 * @returns The render result from React Testing Library
 */
export const renderWithRouter = (
  ui: ReactNode,
  routes: Array<{ path: string; element: ReactNode }>,
  initialRoute: string = '/'
): RenderResult => {
  // Create a wrapper component that wraps the UI with MemoryRouter and Routes
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
      {children}
    </MemoryRouter>
  );

  // Render the UI with the wrapper using React Testing Library's render function
  return render(ui, { wrapper: Wrapper });
};

/**
 * Renders a component with React Query provider
 * @param ui The component to render
 * @param queryClient Optional QueryClient instance to use, defaults to testQueryClient
 * @returns The render result from React Testing Library
 */
export const renderWithQueryClient = (
  ui: ReactNode,
  queryClient: QueryClient = testQueryClient
): RenderResult => {
  // Create a wrapper component that wraps the UI with QueryClientProvider
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  // Render the UI with the wrapper using React Testing Library's render function
  return render(ui, { wrapper: Wrapper });
};

/**
 * Waits for an element to be removed from the DOM
 * @param callback Function that returns the element to wait for removal
 * @param options Optional timeout and interval options
 * @returns Promise that resolves when the element is removed
 */
export const waitForElementToBeRemoved = async (
  callback: () => HTMLElement | null,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> => {
  // Use React Testing Library's waitFor to repeatedly check if the element is removed
  await waitFor(() => {
    expect(callback()).toBeNull();
  }, options); // Return a promise that resolves when the element is no longer in the DOM
};