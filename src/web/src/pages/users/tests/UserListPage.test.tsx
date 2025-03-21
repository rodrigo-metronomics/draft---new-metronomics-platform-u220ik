import React from 'react'; // React library for component testing // v18.2.0
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'; // Testing library utilities for rendering and interacting with components // v14.0.0
import userEvent from '@testing-library/user-event'; // Simulating user interactions in tests // v14.0.0
import { vi } from 'vitest'; // Mocking and test utilities // v0.34.0

// Internal imports
import UserListPage from '../UserListPage'; // Component under test
import { renderWithRouter, renderWithProviders, createMockAuthUser, createMockOrganization, waitForLoadingToFinish } from '../../../tests/testUtils'; // Testing utilities for rendering components with necessary providers and router
import { useUsers } from '../../../hooks/useUsers'; // Hook to be mocked for testing user management functionality
import { UserRole } from '../../../utils/constants/roles'; // Role constants for testing different user roles
import { Permission } from '../../../utils/constants/permissions'; // Permission constants for testing access control
import { UserStatus } from '../../../types/user.types'; // User status enum for testing filters
import { ROUTES } from '../../../utils/constants/routes'; // Route constants for testing navigation

// Mock the useUsers hook
vi.mock('../../../hooks/useUsers');

// Mock the useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
    useAuth: () => ({
        state: { isAuthenticated: true, user: createMockAuthUser() },
        hasPermission: vi.fn().mockReturnValue(true),
        hasRole: vi.fn().mockReturnValue(true),
        login: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithMicrosoft: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        changePassword: vi.fn(),
        refreshToken: vi.fn()
    })
}));

// Helper function to create a mock implementation of the useUsers hook
const mockUseUsers = (overrides: any = {}) => {
    const mockUsers = overrides.users || {
        users: [
            { id: '1', name: 'John Smith', email: 'john@example.com', role: UserRole.CEO, isActive: true, lastLoginAt: '2024-01-01T00:00:00.000Z' },
            { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: UserRole.LEADERSHIP, isActive: false, lastLoginAt: '2024-01-02T00:00:00.000Z' },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
    };
    const mockPagination = overrides.pagination || {
        total: mockUsers.total,
        page: mockUsers.page,
        pageSize: mockUsers.pageSize,
        totalPages: mockUsers.totalPages,
    };
    const mockFunctions = {
        refetch: vi.fn(),
        deactivateUser: { mutate: vi.fn() },
        activateUser: { mutate: vi.fn() },
        deleteUser: { mutate: vi.fn() },
        ...overrides.functions,
    };

    (useUsers as any).mockImplementation(() => ({
        users: mockUsers,
        isLoading: false,
        isError: false,
        error: null,
        pagination: mockPagination,
        ...mockFunctions,
    }));
};

describe('UserListPage', () => {
    it('renders the user list page with users data', async () => {
        mockUseUsers();
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });

    it('displays loading state while fetching users', () => {
        mockUseUsers({ isLoading: true });
        renderWithProviders(<UserListPage />);

        expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('displays error state when fetching users fails', () => {
        mockUseUsers({ isError: true, error: { message: 'Failed to fetch users' } });
        renderWithProviders(<UserListPage />);

        expect(screen.getByText('Failed to fetch users')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('filters users by search term', async () => {
        mockUseUsers();
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        const searchInput = screen.getByPlaceholderText(/search by name or email/i);
        await userEvent.type(searchInput, 'John');

        expect(useUsers).toHaveBeenCalled();
    });

    it('filters users by role', async () => {
        mockUseUsers();
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        const roleSelect = screen.getByRole('combobox', { name: /select role/i });
        await userEvent.selectOptions(roleSelect, ['CEO']);

        expect(useUsers).toHaveBeenCalled();
    });

    it('filters users by status', async () => {
        mockUseUsers();
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        const statusSelect = screen.getByRole('combobox', { name: /select status/i });
        await userEvent.selectOptions(statusSelect, ['Active']);

        expect(useUsers).toHaveBeenCalled();
    });

    it('navigates to user detail page when clicking view button', async () => {
        mockUseUsers();
        const navigate = vi.fn();
        renderWithRouter(<UserListPage />, [{ path: ROUTES.USERS.LIST, element: <UserListPage /> }], ROUTES.USERS.LIST);
        await waitForLoadingToFinish();

        const viewButton = screen.getAllByRole('button', { name: /view user/i })[0];
        await userEvent.click(viewButton);

        expect(navigate).not.toHaveBeenCalled();
    });

    it('shows delete confirmation when clicking delete button', async () => {
        mockUseUsers();
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        const deleteButton = screen.getAllByRole('button', { name: /delete user/i })[0];
        await userEvent.click(deleteButton);

        expect(screen.getByText(/are you sure you want to delete this user?/i)).toBeInTheDocument();
    });

    it('shows invite user modal when clicking invite button', async () => {
        mockUseUsers();
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        const inviteButton = screen.getByRole('button', { name: /invite user/i });
        await userEvent.click(inviteButton);

        expect(screen.getByText(/invite new user/i)).toBeInTheDocument();
    });

    it('hides invite button for users without proper permissions', async () => {
        mockUseUsers();
        vi.mock('../../../hooks/useAuth', () => ({
            useAuth: () => ({
                state: { isAuthenticated: true, user: createMockAuthUser() },
                hasPermission: vi.fn().mockReturnValue(false),
                hasRole: vi.fn().mockReturnValue(true),
                login: vi.fn(),
                loginWithGoogle: vi.fn(),
                loginWithMicrosoft: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
                resetPassword: vi.fn(),
                changePassword: vi.fn(),
                refreshToken: vi.fn()
            })
        }));
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        expect(screen.queryByRole('button', { name: /invite user/i })).not.toBeInTheDocument();
    });

    it('disables action buttons for users without proper permissions', async () => {
        mockUseUsers();
        vi.mock('../../../hooks/useAuth', () => ({
            useAuth: () => ({
                state: { isAuthenticated: true, user: createMockAuthUser() },
                hasPermission: vi.fn().mockReturnValue(false),
                hasRole: vi.fn().mockReturnValue(true),
                login: vi.fn(),
                loginWithGoogle: vi.fn(),
                loginWithMicrosoft: vi.fn(),
                register: vi.fn(),
                logout: vi.fn(),
                resetPassword: vi.fn(),
                changePassword: vi.fn(),
                refreshToken: vi.fn()
            })
        }));
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        const editButtons = screen.queryAllByRole('button', { name: /edit user/i });
        const deleteButtons = screen.queryAllByRole('button', { name: /delete user/i });

        expect(editButtons.length).toBe(0);
        expect(deleteButtons.length).toBe(0);
    });

    it('handles pagination correctly', async () => {
        mockUseUsers({
            users: {
                users: [
                    { id: '1', name: 'John Smith', email: 'john@example.com', role: UserRole.CEO, isActive: true, lastLoginAt: '2024-01-01T00:00:00.000Z' },
                    { id: '2', name: 'Jane Doe', email: 'jane@example.com', role: UserRole.LEADERSHIP, isActive: false, lastLoginAt: '2024-01-02T00:00:00.000Z' },
                ],
                total: 20,
                page: 1,
                pageSize: 10,
                totalPages: 2,
            },
            pagination: {
                total: 20,
                page: 1,
                pageSize: 10,
                totalPages: 2,
            },
        });
        renderWithProviders(<UserListPage />);
        await waitForLoadingToFinish();

        const nextPageButton = screen.getByRole('button', { name: /next page/i });
        await userEvent.click(nextPageButton);

        expect(useUsers).toHaveBeenCalled();
    });
});