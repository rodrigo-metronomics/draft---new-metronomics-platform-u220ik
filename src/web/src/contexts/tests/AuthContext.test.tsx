import React, { ReactNode } from 'react'; // react@^18.2.0
import { render, screen, waitFor, act } from '@testing-library/react'; // ^14.0.0
import { renderHook } from '@testing-library/react-hooks'; // ^8.0.0
import { vi } from 'jest'; // ^29.0.0

// Internal imports
import { AuthContext, AuthProvider, useAuthContext } from '../AuthContext';
import { LoginRequest, RegisterRequest, ChangePasswordRequest, AuthResponse, AuthUser, Permission, UserRole } from '../../types/auth.types';
import { renderHookWithProviders, createMockAuthUser } from '../../../tests/testUtils';
import { mockAuthResponse } from '../../../tests/mocks/apiMocks';
import { setMockCurrentUser, mockSignInWithEmailPassword, mockSignInWithGoogle, mockSignInWithMicrosoft, mockCreateUser, mockSignOut, mockResetPassword, mockChangePassword, mockGetIdTokenForUser } from '../../../tests/mocks/firebaseMocks';
import { login, loginWithFirebaseToken, register, refreshToken, logout, resetPassword, changePassword } from '../../services/api/authApi';
import { setItemWithPrefix, getItemWithPrefix, removeItemWithPrefix } from '../../utils/helpers/localStorageHelper';

// Global variable
const AUTH_STORAGE_KEY = "auth_session";

/**
 * Setup function that runs before each test to reset mocks
 */
const setup = (): void => {
  // Reset all jest mocks
  vi.clearAllMocks();

  // Mock all Firebase authentication functions
  setMockCurrentUser(null);

  // Mock all API authentication functions
  (login as jest.Mock).mockResolvedValue(mockAuthResponse);
  (loginWithFirebaseToken as jest.Mock).mockResolvedValue(mockAuthResponse);
  (register as jest.Mock).mockResolvedValue(mockAuthResponse);
  (refreshToken as jest.Mock).mockResolvedValue(mockAuthResponse);
  (logout as jest.Mock).mockResolvedValue(mockAuthResponse);
  (resetPassword as jest.Mock).mockResolvedValue(mockAuthResponse);
  (changePassword as jest.Mock).mockResolvedValue(mockAuthResponse);

  // Mock local storage helper functions
  (setItemWithPrefix as jest.Mock).mockImplementation(() => true);
  (getItemWithPrefix as jest.Mock).mockImplementation(() => null);
  (removeItemWithPrefix as jest.Mock).mockImplementation(() => true);
};

/**
 * Creates a wrapper component with AuthProvider for testing
 * @param children 
 * @returns 
 */
const createTestWrapper = (children: ReactNode): JSX.Element => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    setup();
  });

  it('should initialize with unauthenticated state', async () => {
    // Render the AuthProvider component
    render(<AuthProvider>
      <div>Auth Content</div>
    </AuthProvider>);

    // Access the context value
    const contextValue = useAuthContext();

    // Verify that isAuthenticated is false
    expect(contextValue.state.isAuthenticated).toBe(false);

    // Verify that user is null
    expect(contextValue.state.user).toBeNull();

    // Verify that isLoading is false
    expect(contextValue.state.isLoading).toBe(false);

    // Verify that error is null
    expect(contextValue.state.error).toBeNull();

    // Verify that permissions is an empty array
    expect(contextValue.state.permissions).toEqual([]);
  });

  it('should load user from local storage on mount if available', async () => {
    // Mock getItemWithPrefix to return stored auth data
    const mockStoredAuth = {
      user: createMockAuthUser(),
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      permissions: [Permission.VIEW_DASHBOARD]
    };
    (getItemWithPrefix as jest.Mock).mockReturnValue(mockStoredAuth);

    // Render the AuthProvider component
    render(<AuthProvider>
      <div>Auth Content</div>
    </AuthProvider>);

    // Verify that isAuthenticated is true
    const contextValue = useAuthContext();
    expect(contextValue.state.isAuthenticated).toBe(true);

    // Verify that user matches the stored user data
    expect(contextValue.state.user).toEqual(mockStoredAuth.user);

    // Verify that permissions are loaded from stored data
    expect(contextValue.state.permissions).toEqual(mockStoredAuth.permissions);
  });

  it('should successfully login with email and password', async () => {
    // Mock signInWithEmailPassword to resolve successfully
    const mockFirebaseUser = { uid: 'mock-user-id', email: 'test@example.com' };
    (mockSignInWithEmailPassword as jest.Mock).mockResolvedValue({ user: mockFirebaseUser });

    // Mock getIdTokenForUser to return a token
    (mockGetIdTokenForUser as jest.Mock).mockResolvedValue('mock-firebase-token');

    // Mock login API to return mock auth response
    (login as jest.Mock).mockResolvedValue(mockAuthResponse);

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the login method with email and password
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123', provider: 'email_password' });
    });

    // Verify that Firebase signInWithEmailPassword was called with correct credentials
    expect(mockSignInWithEmailPassword).toHaveBeenCalledWith('test@example.com', 'password123');

    // Verify that getIdTokenForUser was called
    expect(mockGetIdTokenForUser).toHaveBeenCalledWith(mockFirebaseUser);

    // Verify that login API was called with the token
    expect(login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: '',
      provider: 'email_password',
      token: 'mock-firebase-token'
    });

    // Verify that setItemWithPrefix was called to store auth data
    expect(setItemWithPrefix).toHaveBeenCalledWith(AUTH_STORAGE_KEY, {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: mockAuthResponse.data.user,
      permissions: mockAuthResponse.data.user.role === 'COACH' ? [ 'view:dashboard', 'create:meeting' ] : []
    });

    // Verify that isAuthenticated is true
    expect(result.current.state.isAuthenticated).toBe(true);

    // Verify that user matches the response user data
    expect(result.current.state.user).toEqual(mockAuthResponse.data.user);
  });

  it('should handle login errors correctly', async () => {
    // Mock signInWithEmailPassword to reject with an error
    (mockSignInWithEmailPassword as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the login method with email and password
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'wrongpassword', provider: 'email_password' });
    });

    // Verify that isAuthenticated remains false
    expect(result.current.state.isAuthenticated).toBe(false);

    // Verify that error state contains the error message
    expect(result.current.state.error).toBe('Invalid credentials');

    // Verify that isLoading is false after error
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should successfully login with Google', async () => {
    // Mock signInWithGoogle to resolve successfully
    const mockFirebaseUser = { uid: 'google-user-id', email: 'google-user@example.com' };
    (mockSignInWithGoogle as jest.Mock).mockResolvedValue({ user: mockFirebaseUser });

    // Mock getIdTokenForUser to return a token
    (mockGetIdTokenForUser as jest.Mock).mockResolvedValue('mock-google-token');

    // Mock loginWithFirebaseToken API to return mock auth response
    (loginWithFirebaseToken as jest.Mock).mockResolvedValue(mockAuthResponse);

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the loginWithGoogle method
    await act(async () => {
      await result.current.loginWithGoogle();
    });

    // Verify that Firebase signInWithGoogle was called
    expect(mockSignInWithGoogle).toHaveBeenCalled();

    // Verify that getIdTokenForUser was called
    expect(mockGetIdTokenForUser).toHaveBeenCalledWith(mockFirebaseUser);

    // Verify that loginWithFirebaseToken API was called with the token
    expect(loginWithFirebaseToken).toHaveBeenCalledWith('mock-google-token', 'google');

    // Verify that setItemWithPrefix was called to store auth data
    expect(setItemWithPrefix).toHaveBeenCalledWith(AUTH_STORAGE_KEY, {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: mockAuthResponse.data.user,
      permissions: mockAuthResponse.data.user.role === 'COACH' ? [ 'view:dashboard', 'create:meeting' ] : []
    });

    // Verify that isAuthenticated is true
    expect(result.current.state.isAuthenticated).toBe(true);

    // Verify that user matches the response user data
    expect(result.current.state.user).toEqual(mockAuthResponse.data.user);
  });

  it('should successfully login with Microsoft', async () => {
    // Mock signInWithMicrosoft to resolve successfully
    const mockFirebaseUser = { uid: 'microsoft-user-id', email: 'microsoft-user@example.com' };
    (mockSignInWithMicrosoft as jest.Mock).mockResolvedValue({ user: mockFirebaseUser });

    // Mock getIdTokenForUser to return a token
    (mockGetIdTokenForUser as jest.Mock).mockResolvedValue('mock-microsoft-token');

    // Mock loginWithFirebaseToken API to return mock auth response
    (loginWithFirebaseToken as jest.Mock).mockResolvedValue(mockAuthResponse);

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the loginWithMicrosoft method
    await act(async () => {
      await result.current.loginWithMicrosoft();
    });

    // Verify that Firebase signInWithMicrosoft was called
    expect(mockSignInWithMicrosoft).toHaveBeenCalled();

    // Verify that getIdTokenForUser was called
    expect(mockGetIdTokenForUser).toHaveBeenCalledWith(mockFirebaseUser);

    // Verify that loginWithFirebaseToken API was called with the token
    expect(loginWithFirebaseToken).toHaveBeenCalledWith('mock-microsoft-token', 'microsoft');

    // Verify that setItemWithPrefix was called to store auth data
    expect(setItemWithPrefix).toHaveBeenCalledWith(AUTH_STORAGE_KEY, {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: mockAuthResponse.data.user,
      permissions: mockAuthResponse.data.user.role === 'COACH' ? [ 'view:dashboard', 'create:meeting' ] : []
    });

    // Verify that isAuthenticated is true
    expect(result.current.state.isAuthenticated).toBe(true);

    // Verify that user matches the response user data
    expect(result.current.state.user).toEqual(mockAuthResponse.data.user);
  });

  it('should successfully register a new user', async () => {
    // Mock createUser to resolve successfully
    const mockFirebaseUser = { uid: 'new-user-id', email: 'new@example.com' };
    (mockCreateUser as jest.Mock).mockResolvedValue({ user: mockFirebaseUser });

    // Mock getIdTokenForUser to return a token
    (mockGetIdTokenForUser as jest.Mock).mockResolvedValue('mock-register-token');

    // Mock register API to return mock auth response
    (register as jest.Mock).mockResolvedValue(mockAuthResponse);

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the register method with user data
    const registerData: RegisterRequest = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      organizationId: 'test-org-id'
    };
    await act(async () => {
      await result.current.register(registerData);
    });

    // Verify that Firebase createUser was called with correct credentials
    expect(mockCreateUser).toHaveBeenCalledWith('new@example.com', 'password123');

    // Verify that getIdTokenForUser was called
    expect(mockGetIdTokenForUser).toHaveBeenCalledWith(mockFirebaseUser);

    // Verify that register API was called with user data and token
    expect(register).toHaveBeenCalledWith(registerData, 'mock-register-token');

    // Verify that setItemWithPrefix was called to store auth data
    expect(setItemWithPrefix).toHaveBeenCalledWith(AUTH_STORAGE_KEY, {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      user: mockAuthResponse.data.user,
      permissions: mockAuthResponse.data.user.role === 'COACH' ? [ 'view:dashboard', 'create:meeting' ] : []
    });

    // Verify that isAuthenticated is true
    expect(result.current.state.isAuthenticated).toBe(true);

    // Verify that user matches the response user data
    expect(result.current.state.user).toEqual(mockAuthResponse.data.user);
  });

  it('should successfully logout', async () => {
    // Set up authenticated state
    const mockStoredAuth = {
      user: createMockAuthUser(),
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      permissions: [Permission.VIEW_DASHBOARD]
    };
    (getItemWithPrefix as jest.Mock).mockReturnValue(mockStoredAuth);

    // Mock logout API to resolve successfully
    (logout as jest.Mock).mockResolvedValue({ success: true, data: null, message: null });

    // Mock signOut to resolve successfully
    (mockSignOut as jest.Mock).mockResolvedValue(undefined);

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the logout method
    await act(async () => {
      await result.current.logout();
    });

    // Verify that logout API was called with refresh token
    expect(logout).toHaveBeenCalledWith('mock-refresh-token');

    // Verify that Firebase signOut was called
    expect(mockSignOut).toHaveBeenCalled();

    // Verify that removeItemWithPrefix was called to clear auth data
    expect(removeItemWithPrefix).toHaveBeenCalledWith(AUTH_STORAGE_KEY);

    // Verify that isAuthenticated is false
    expect(result.current.state.isAuthenticated).toBe(false);

    // Verify that user is null
    expect(result.current.state.user).toBeNull();
  });

  it('should successfully reset password', async () => {
    // Mock resetPassword Firebase function to resolve successfully
    (mockResetPassword as jest.Mock).mockResolvedValue(undefined);

    // Mock resetPassword API to resolve successfully
    (resetPassword as jest.Mock).mockResolvedValue({ success: true, data: null, message: null });

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the resetPassword method with email
    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    // Verify that Firebase resetPassword was called with email
    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');

    // Verify that resetPassword API was called with email
    expect(resetPassword).toHaveBeenCalledWith('test@example.com');

    // Verify that isLoading is false after completion
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should successfully change password', async () => {
    // Set up authenticated state
    const mockStoredAuth = {
      user: createMockAuthUser(),
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      permissions: [Permission.VIEW_DASHBOARD]
    };
    (getItemWithPrefix as jest.Mock).mockReturnValue(mockStoredAuth);

    // Mock changePassword Firebase function to resolve successfully
    (mockChangePassword as jest.Mock).mockResolvedValue(undefined);

    // Mock changePassword API to resolve successfully
    (changePassword as jest.Mock).mockResolvedValue({ success: true, data: null, message: null });

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the changePassword method with password data
    const passwordData: ChangePasswordRequest = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword'
    };
    await act(async () => {
      await result.current.changePassword(passwordData);
    });

    // Verify that Firebase changePassword was called with correct passwords
    expect(mockChangePassword).toHaveBeenCalledWith('oldpassword', 'newpassword');

    // Verify that changePassword API was called with password data and token
    expect(changePassword).toHaveBeenCalledWith(passwordData, 'mock-access-token');

    // Verify that isLoading is false after completion
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should refresh token successfully', async () => {
    // Set up authenticated state with refresh token
    const mockStoredAuth = {
      user: createMockAuthUser(),
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
      expiresIn: 3600,
      permissions: [Permission.VIEW_DASHBOARD]
    };
    (getItemWithPrefix as jest.Mock).mockReturnValue(mockStoredAuth);

    // Mock refreshToken API to return new tokens
    const newAuthResponse = {
      success: true,
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        user: createMockAuthUser(),
      },
      message: null
    };
    (refreshToken as jest.Mock).mockResolvedValue(newAuthResponse);

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext());

    // Call the refreshToken method
    await act(async () => {
      await result.current.refreshToken();
    });

    // Verify that refreshToken API was called with refresh token
    expect(refreshToken).toHaveBeenCalledWith('old-refresh-token');

    // Verify that setItemWithPrefix was called with updated tokens
    expect(setItemWithPrefix).toHaveBeenCalledWith(AUTH_STORAGE_KEY, {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
      user: createMockAuthUser(),
      permissions: createMockAuthUser().role === 'COACH' ? [ 'view:dashboard', 'create:meeting' ] : []
    });

    // Verify that auth state contains updated tokens
    expect(result.current.state.user).toEqual(createMockAuthUser());
  });

  it('should correctly check for permissions', async () => {
    // Set up authenticated state with specific permissions
    const mockAuthState = {
      user: createMockAuthUser(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
      permissions: [Permission.VIEW_DASHBOARD, Permission.CREATE_MEETING]
    };

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext(), { authContext: { state: mockAuthState } });

    // Call hasPermission with a permission the user has
    const hasViewDashboard = result.current.hasPermission(Permission.VIEW_DASHBOARD);

    // Verify that it returns true
    expect(hasViewDashboard).toBe(true);

    // Call hasPermission with a permission the user doesn't have
    const hasManageUsers = result.current.hasPermission(Permission.MANAGE_USERS);

    // Verify that it returns false
    expect(hasManageUsers).toBe(false);

    // Set up unauthenticated state
    const mockUnauthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      permissions: []
    };

    // Render the AuthProvider component
    const { result: unauthResult } = renderHookWithProviders(() => useAuthContext(), { authContext: { state: mockUnauthState } });

    // Call hasPermission with a permission when not authenticated
    const hasPermissionUnauth = unauthResult.current.hasPermission(Permission.VIEW_DASHBOARD);

    // Verify that it returns false when not authenticated
    expect(hasPermissionUnauth).toBe(false);
  });

  it('should correctly check for roles', async () => {
    // Set up authenticated state with a specific role
    const mockAuthState = {
      user: createMockAuthUser({ role: UserRole.LEADERSHIP }),
      isAuthenticated: true,
      isLoading: false,
      error: null,
      permissions: []
    };

    // Render the AuthProvider component
    const { result } = renderHookWithProviders(() => useAuthContext(), { authContext: { state: mockAuthState } });

    // Call hasRole with the user's role
    const hasLeadershipRole = result.current.hasRole(UserRole.LEADERSHIP);

    // Verify that it returns true
    expect(hasLeadershipRole).toBe(true);

    // Call hasRole with a higher role
    const hasCeoRole = result.current.hasRole(UserRole.CEO);

    // Verify that it returns false
    expect(hasCeoRole).toBe(false);

    // Call hasRole with a lower role
    const hasTeamMemberRole = result.current.hasRole(UserRole.TEAM_MEMBER);

    // Verify that it returns true
    expect(hasTeamMemberRole).toBe(true);

    // Set up unauthenticated state
    const mockUnauthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      permissions: []
    };

    // Render the AuthProvider component
    const { result: unauthResult } = renderHookWithProviders(() => useAuthContext(), { authContext: { state: mockUnauthState } });

    // Call hasRole with a role when not authenticated
    const hasRoleUnauth = unauthResult.current.hasRole(UserRole.LEADERSHIP);

    // Verify that hasRole returns false when not authenticated
    expect(hasRoleUnauth).toBe(false);
  });

  it('should set up token refresh interval when authenticated', async () => {
    // Mock global.setInterval
    const mockSetInterval = vi.spyOn(global, 'setInterval');

    // Mock global.clearInterval
    const mockClearInterval = vi.spyOn(global, 'clearInterval');

    // Set up authenticated state
    const mockAuthState = {
      user: createMockAuthUser(),
      isAuthenticated: true,
      isLoading: false,
      error: null,
      permissions: []
    };

    // Render the AuthProvider component
    const { result, unmount } = renderHookWithProviders(() => useAuthContext(), { authContext: { state: mockAuthState } });

    // Verify that setInterval was called with TOKEN_REFRESH_INTERVAL
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 300000);

    // Verify that clearInterval is called on unmount
    unmount();
    expect(mockClearInterval).toHaveBeenCalled();
  });

  it('useAuthContext hook should throw error when used outside AuthProvider', () => {
    // Render the useAuthContext hook without AuthProvider wrapper
    const { result } = renderHook(() => useAuthContext());

    // Verify that it throws an error about being used outside AuthProvider
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe('useAuthContext must be used within an AuthProvider');
  });
});