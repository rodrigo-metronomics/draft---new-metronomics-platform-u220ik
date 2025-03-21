import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import RoleBasedRoute from '../RoleBasedRoute';
import { ROUTES } from '../../utils/constants/routes';
import { UserRole } from '../../utils/constants/roles';
import { AuthContext } from '../../contexts/AuthContext';

// Helper function to render components with router context
const renderWithRouter = (ui, options = {}) => {
  return render(
    <MemoryRouter initialEntries={options.initialEntries || ['/']}>
      {ui}
    </MemoryRouter>
  );
};

// Mock component that represents a protected route's content
const MockProtectedComponent = () => {
  return <div data-testid="protected-content">Protected Content</div>;
};

// Mock authentication provider for testing different auth states and roles
const MockAuthProvider = ({ children, hasRole }) => {
  const mockAuthContext = {
    state: { isAuthenticated: true },
    hasRole
  };

  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
};

describe('RoleBasedRoute', () => {
  // Clean up after each test
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to access denied when user doesn't have required role", async () => {
    // Mock hasRole to return false (user doesn't have the required role)
    const hasRoleMock = vi.fn().mockReturnValue(false);
    
    renderWithRouter(
      <MockAuthProvider hasRole={hasRoleMock}>
        <Routes>
          <Route element={<RoleBasedRoute requiredRole={UserRole.CEO} />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
          <Route path={ROUTES.ERRORS.ACCESS_DENIED} element={<div data-testid="access-denied">Access Denied</div>} />
        </Routes>
      </MockAuthProvider>
    );

    // Verify that hasRole was called with the correct role
    expect(hasRoleMock).toHaveBeenCalledWith(UserRole.CEO);
    
    // Verify that we see the access denied page
    await waitFor(() => {
      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    });
    
    // Verify that the protected content is not rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render child routes when user has the required role', async () => {
    // Mock hasRole to return true (user has the required role)
    const hasRoleMock = vi.fn().mockReturnValue(true);
    
    renderWithRouter(
      <MockAuthProvider hasRole={hasRoleMock}>
        <Routes>
          <Route element={<RoleBasedRoute requiredRole={UserRole.CEO} />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
          <Route path={ROUTES.ERRORS.ACCESS_DENIED} element={<div data-testid="access-denied">Access Denied</div>} />
        </Routes>
      </MockAuthProvider>
    );

    // Verify that hasRole was called with the correct role
    expect(hasRoleMock).toHaveBeenCalledWith(UserRole.CEO);
    
    // Verify that the protected content is rendered
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    
    // Verify that access denied page is not shown
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument();
  });

  it('should correctly check for COACH role', () => {
    const hasRoleMock = vi.fn().mockReturnValue(true);
    
    renderWithRouter(
      <MockAuthProvider hasRole={hasRoleMock}>
        <Routes>
          <Route element={<RoleBasedRoute requiredRole={UserRole.COACH} />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
          <Route path={ROUTES.ERRORS.ACCESS_DENIED} element={<div>Access Denied</div>} />
        </Routes>
      </MockAuthProvider>
    );

    // Verify that hasRole was called with the COACH role
    expect(hasRoleMock).toHaveBeenCalledWith(UserRole.COACH);
    
    // Verify that the correct component is rendered based on the hasRole result
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should correctly check for CEO role', () => {
    const hasRoleMock = vi.fn().mockReturnValue(true);
    
    renderWithRouter(
      <MockAuthProvider hasRole={hasRoleMock}>
        <Routes>
          <Route element={<RoleBasedRoute requiredRole={UserRole.CEO} />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
          <Route path={ROUTES.ERRORS.ACCESS_DENIED} element={<div>Access Denied</div>} />
        </Routes>
      </MockAuthProvider>
    );

    // Verify that hasRole was called with the CEO role
    expect(hasRoleMock).toHaveBeenCalledWith(UserRole.CEO);
    
    // Verify that the correct component is rendered based on the hasRole result
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should correctly check for LEADERSHIP role', () => {
    const hasRoleMock = vi.fn().mockReturnValue(true);
    
    renderWithRouter(
      <MockAuthProvider hasRole={hasRoleMock}>
        <Routes>
          <Route element={<RoleBasedRoute requiredRole={UserRole.LEADERSHIP} />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
          <Route path={ROUTES.ERRORS.ACCESS_DENIED} element={<div>Access Denied</div>} />
        </Routes>
      </MockAuthProvider>
    );

    // Verify that hasRole was called with the LEADERSHIP role
    expect(hasRoleMock).toHaveBeenCalledWith(UserRole.LEADERSHIP);
    
    // Verify that the correct component is rendered based on the hasRole result
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should correctly check for TEAM_MEMBER role', () => {
    const hasRoleMock = vi.fn().mockReturnValue(true);
    
    renderWithRouter(
      <MockAuthProvider hasRole={hasRoleMock}>
        <Routes>
          <Route element={<RoleBasedRoute requiredRole={UserRole.TEAM_MEMBER} />}>
            <Route path="/" element={<MockProtectedComponent />} />
          </Route>
          <Route path={ROUTES.ERRORS.ACCESS_DENIED} element={<div>Access Denied</div>} />
        </Routes>
      </MockAuthProvider>
    );

    // Verify that hasRole was called with the TEAM_MEMBER role
    expect(hasRoleMock).toHaveBeenCalledWith(UserRole.TEAM_MEMBER);
    
    // Verify that the correct component is rendered based on the hasRole result
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should handle role changes', async () => {
    // Create a component that can toggle its own access
    const TestComponent = () => {
      const [hasAccess, setHasAccess] = React.useState(false);
      
      return (
        <div>
          <button 
            data-testid="toggle-access" 
            onClick={() => setHasAccess(prev => !prev)}
          >
            Toggle Access
          </button>
          
          <MemoryRouter initialEntries={['/']}>
            <MockAuthProvider hasRole={() => hasAccess}>
              <Routes>
                <Route element={<RoleBasedRoute requiredRole={UserRole.CEO} />}>
                  <Route path="/" element={<MockProtectedComponent />} />
                </Route>
                <Route path={ROUTES.ERRORS.ACCESS_DENIED} element={<div data-testid="access-denied">Access Denied</div>} />
              </Routes>
            </MockAuthProvider>
          </MemoryRouter>
        </div>
      );
    };
    
    // Render our test component
    render(<TestComponent />);
    
    // Initially, should redirect to access denied
    await waitFor(() => {
      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    });
    
    // Simulate user gaining access by clicking the toggle button
    await userEvent.click(screen.getByTestId('toggle-access'));
    
    // Now, should see the protected content
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});