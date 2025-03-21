import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';
import { AuthContextType } from '../../types/auth.types';
import { AuthProvider } from '../../types/auth.types';
import { UserRole } from '../../utils/constants/roles';
import { Permission } from '../../utils/constants/permissions';

// Mock the AuthContext module
jest.mock('../../contexts/AuthContext');

describe('useAuth', () => {
  // Setup function that runs before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementation for useAuthContext
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockImplementation(() => ({
      state: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        permissions: []
      },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    }));
  });

  it('should return auth context value', () => {
    // Create a mock auth context value
    const mockAuthContextValue: AuthContextType = {
      state: {
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.CEO,
          organizationId: 'org-123',
          authId: 'auth-123',
          profileImageUrl: null,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions: [Permission.VIEW_DASHBOARD]
      },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    };
    
    // Mock useAuthContext to return the mock value
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue(mockAuthContextValue);
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Verify that the returned value matches the mock context value
    expect(result.current).toEqual(mockAuthContextValue);
  });

  it('should call login with correct parameters', () => {
    // Create a mock login function
    const mockLogin = jest.fn();
    
    // Mock useAuthContext to return an object with the mock login function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: mockLogin,
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Create test credentials
    const credentials = {
      email: 'test@example.com',
      password: 'password',
      provider: AuthProvider.EMAIL_PASSWORD
    };
    
    // Call the login function
    act(() => {
      result.current.login(credentials);
    });
    
    // Verify that the mock login function was called with the correct parameters
    expect(mockLogin).toHaveBeenCalledWith(credentials);
  });

  it('should call loginWithGoogle', () => {
    // Create a mock loginWithGoogle function
    const mockLoginWithGoogle = jest.fn();
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: mockLoginWithGoogle,
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Call the loginWithGoogle function
    act(() => {
      result.current.loginWithGoogle();
    });
    
    // Verify that the mock function was called
    expect(mockLoginWithGoogle).toHaveBeenCalled();
  });

  it('should call loginWithMicrosoft', () => {
    // Create a mock loginWithMicrosoft function
    const mockLoginWithMicrosoft = jest.fn();
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: mockLoginWithMicrosoft,
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Call the loginWithMicrosoft function
    act(() => {
      result.current.loginWithMicrosoft();
    });
    
    // Verify that the mock function was called
    expect(mockLoginWithMicrosoft).toHaveBeenCalled();
  });

  it('should call register with correct parameters', () => {
    // Create a mock register function
    const mockRegister = jest.fn();
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: mockRegister,
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Create test user data
    const userData = {
      email: 'test@example.com',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
      organizationId: 'org-123'
    };
    
    // Call the register function
    act(() => {
      result.current.register(userData);
    });
    
    // Verify that the mock function was called with the correct parameters
    expect(mockRegister).toHaveBeenCalledWith(userData);
  });

  it('should call logout', () => {
    // Create a mock logout function
    const mockLogout = jest.fn();
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Call the logout function
    act(() => {
      result.current.logout();
    });
    
    // Verify that the mock function was called
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should call resetPassword with correct email', () => {
    // Create a mock resetPassword function
    const mockResetPassword = jest.fn();
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: mockResetPassword,
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Test email
    const email = 'test@example.com';
    
    // Call the resetPassword function
    act(() => {
      result.current.resetPassword(email);
    });
    
    // Verify that the mock function was called with the correct email
    expect(mockResetPassword).toHaveBeenCalledWith(email);
  });

  it('should call changePassword with correct parameters', () => {
    // Create a mock changePassword function
    const mockChangePassword = jest.fn();
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: mockChangePassword,
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Create test password data
    const passwordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };
    
    // Call the changePassword function
    act(() => {
      result.current.changePassword(passwordData);
    });
    
    // Verify that the mock function was called with the correct parameters
    expect(mockChangePassword).toHaveBeenCalledWith(passwordData);
  });

  it('should call refreshToken', () => {
    // Create a mock refreshToken function
    const mockRefreshToken = jest.fn();
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: mockRefreshToken,
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Call the refreshToken function
    act(() => {
      result.current.refreshToken();
    });
    
    // Verify that the mock function was called
    expect(mockRefreshToken).toHaveBeenCalled();
  });

  it('should return correct value for hasPermission', () => {
    // Create a mock hasPermission function that returns true for a specific permission
    const mockHasPermission = jest.fn().mockImplementation((permission) => {
      return permission === Permission.VIEW_DASHBOARD;
    });
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: mockHasPermission,
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Test permission
    const permission = Permission.VIEW_DASHBOARD;
    
    // Call hasPermission and check the result
    const hasPermission = result.current.hasPermission(permission);
    
    // Verify the mock function was called with the correct permission
    expect(mockHasPermission).toHaveBeenCalledWith(permission);
    
    // Verify the result is correct
    expect(hasPermission).toBe(true);
    
    // Test with a different permission
    const noPermission = result.current.hasPermission(Permission.MANAGE_USERS);
    
    // Verify the result is correct
    expect(noPermission).toBe(false);
  });

  it('should return correct value for hasRole', () => {
    // Create a mock hasRole function that returns true for a specific role
    const mockHasRole = jest.fn().mockImplementation((role) => {
      return role === UserRole.CEO;
    });
    
    // Mock useAuthContext to return an object with the mock function
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: { user: null, isAuthenticated: false, isLoading: false, error: null, permissions: [] },
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: mockHasRole
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Test role
    const role = UserRole.CEO;
    
    // Call hasRole and check the result
    const hasRole = result.current.hasRole(role);
    
    // Verify the mock function was called with the correct role
    expect(mockHasRole).toHaveBeenCalledWith(role);
    
    // Verify the result is correct
    expect(hasRole).toBe(true);
    
    // Test with a different role
    const noRole = result.current.hasRole(UserRole.TEAM_MEMBER);
    
    // Verify the result is correct
    expect(noRole).toBe(false);
  });

  it('should handle authentication state correctly', () => {
    // Create a mock authentication state with isAuthenticated set to true
    const mockAuthState = {
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.CEO,
        organizationId: 'org-123',
        authId: 'auth-123',
        profileImageUrl: null,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      permissions: [Permission.VIEW_DASHBOARD]
    };
    
    // Mock useAuthContext to return an object with the mock state
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: mockAuthState,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Verify that the state is correctly exposed
    expect(result.current.state).toEqual(mockAuthState);
    expect(result.current.state.isAuthenticated).toBe(true);
  });

  it('should handle loading state correctly', () => {
    // Create a mock authentication state with isLoading set to true
    const mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      permissions: []
    };
    
    // Mock useAuthContext to return an object with the mock state
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: mockAuthState,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Verify that the loading state is correctly exposed
    expect(result.current.state.isLoading).toBe(true);
  });

  it('should handle error state correctly', () => {
    // Create a mock authentication state with an error message
    const errorMessage = 'Authentication failed';
    const mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: errorMessage,
      permissions: []
    };
    
    // Mock useAuthContext to return an object with the mock state
    const { useAuthContext } = require('../../contexts/AuthContext');
    useAuthContext.mockReturnValue({
      state: mockAuthState,
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithMicrosoft: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
      refreshToken: jest.fn(),
      hasPermission: jest.fn(),
      hasRole: jest.fn()
    });
    
    // Render the hook
    const { result } = renderHook(() => useAuth());
    
    // Verify that the error state is correctly exposed
    expect(result.current.state.error).toBe(errorMessage);
  });
});