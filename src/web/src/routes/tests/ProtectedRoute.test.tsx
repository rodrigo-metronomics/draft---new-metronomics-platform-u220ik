import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import ProtectedRoute from '../ProtectedRoute';
import { ROUTES } from '../../utils/constants/routes';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * Helper function to render the component under test with router context
 */
const renderWithRouter = (ui, options = {}) => {
  const { initialEntries = ['/'] } = options;
  
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
};

/**
 * Mock component that represents a protected route's content
 */
const MockProtectedComponent = () => {
  return <div data-testid="protected-content">Protected Content</div>;
};

/**
 * Mock authentication provider for testing different auth states
 */
const MockAuthProvider = ({ children, isAuthenticated = false }) => {
  const mockAuthContext = {
    state: {
      isAuthenticated,
      user: isAuthenticated ? { id: '1', name: 'Test User' } : null,
      isLoading: false,
      error: null,
      permissions: []
    }
  };

  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Mock the Navigate component to verify redirect behavior
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        Navigate: vi.fn(props => null)
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should redirect to login when user is not authenticated', () => {
    renderWithRouter(
      <MockAuthProvider isAuthenticated={false}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
        </Routes>
      </MockAuthProvider>
    );

    // Verify that the Navigate component was called with the correct props
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ROUTES.AUTH.LOGIN,
        replace: true
      }),
      expect.anything()
    );
    
    // Protected content should not be rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should include the current location in redirect state for post-login redirect', () => {
    const testPath = '/dashboard';
    
    renderWithRouter(
      <MockAuthProvider isAuthenticated={false}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<MockProtectedComponent />} />
          </Route>
        </Routes>
      </MockAuthProvider>,
      { initialEntries: [testPath] }
    );

    // Verify that Navigate was called with the correct state containing current location
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ROUTES.AUTH.LOGIN,
        state: expect.objectContaining({
          from: expect.objectContaining({ pathname: testPath })
        })
      }),
      expect.anything()
    );
  });

  it('should render child routes when user is authenticated', () => {
    renderWithRouter(
      <MockAuthProvider isAuthenticated={true}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
        </Routes>
      </MockAuthProvider>
    );

    // Protected content should be rendered
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    
    // Navigate should not be called when user is authenticated
    expect(Navigate).not.toHaveBeenCalled();
  });

  it('should handle authentication state changes', async () => {
    const { rerender } = renderWithRouter(
      <MockAuthProvider isAuthenticated={false}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
        </Routes>
      </MockAuthProvider>
    );

    // Initially should redirect to login
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: ROUTES.AUTH.LOGIN }),
      expect.anything()
    );
    
    // Protected content should not be rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Reset mock for next assertion
    vi.clearAllMocks();

    // Update the authentication state to true
    rerender(
      <MemoryRouter>
        <MockAuthProvider isAuthenticated={true}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MockProtectedComponent />} />
            </Route>
          </Routes>
        </MockAuthProvider>
      </MemoryRouter>
    );

    // Protected content should now be rendered
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Navigate should not be called when user is authenticated
    expect(Navigate).not.toHaveBeenCalled();
  });
});