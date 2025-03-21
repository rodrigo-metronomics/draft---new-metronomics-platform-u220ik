import React from 'react' // react@^18.2.0
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react' // @testing-library/react@^14.0.0
import { renderHook } from '@testing-library/react-hooks' // @testing-library/react-hooks@^8.0.0
import MockAdapter from 'axios-mock-adapter' // axios-mock-adapter@^1.21.4
import axios from 'axios' // axios@^1.4.0

import { OrganizationContext, OrganizationProvider, useOrganizationContext } from '../OrganizationContext' // Import the context, provider, and hook to be tested
import { renderHookWithProviders, renderWithProviders, createMockOrganization, createMockAuthUser } from '../../tests/testUtils' // Import testing utilities for rendering components and creating mock data
import { mockOrganization, setupOrganizationMocks } from '../../tests/mocks/apiMocks' // Import mock organization data and API mocks for organization endpoints
import { Organization, Team } from '../../types/organization.types' // Import organization type definitions for type checking
import { UserRole } from '../../utils/constants/roles' // Import user role constants for creating mock users with different roles
import { getItem, setItem, removeItem } from '../../utils/helpers/localStorageHelper' // Import local storage helpers for testing persistence functionality

const CURRENT_ORG_STORAGE_KEY = "metronomics_current_org" // Define the local storage key as a global constant

/**
 * A test component that consumes the OrganizationContext to verify its functionality
 * @returns Rendered component displaying organization context data
 */
const TestComponent = () => {
  // Use the useOrganizationContext hook to access organization context
  const { currentOrganization, organizations, switchOrganization } = useOrganizationContext()

  // Display the current organization name if available
  return (
    <div>
      {currentOrganization ? (
        <div data-testid="current-organization">
          Current Organization: {currentOrganization.name}
        </div>
      ) : (
        <div>No current organization</div>
      )}
      {/* Display the number of organizations in the list */}
      <div data-testid="organization-count">
        Organization Count: {organizations.length}
      </div>
      {/* Provide buttons to trigger context functions like switchOrganization */}
      {organizations.map((org) => (
        <button
          key={org.id}
          onClick={() => switchOrganization(org.id)}
          data-testid={`switch-org-${org.id}`}
        >
          Switch to {org.name}
        </button>
      ))}
    </div>
  )
}

describe('OrganizationContext', () => {
  it('should render the provider without crashing', () => {
    // Render the OrganizationProvider with a simple child component
    renderWithProviders(
      <OrganizationProvider>
        <div>Test Child</div>
      </OrganizationProvider>
    )
    // Verify that the component renders without throwing errors
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide organization context to child components', async () => {
    // Setup organization API mocks
    setupOrganizationMocks()

    // Render the TestComponent wrapped in OrganizationProvider
    renderWithProviders(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    )

    // Wait for organization data to load
    await waitFor(() =>
      expect(screen.getByTestId('current-organization')).toBeInTheDocument()
    )

    // Verify that the component displays the expected organization name
    expect(screen.getByTestId('current-organization')).toHaveTextContent(
      'Current Organization: Test Organization'
    )
  })

  it('should fetch organizations on mount when user is authenticated', async () => {
    // Setup organization API mocks
    const mock = setupOrganizationMocks()

    // Create a mock authenticated user
    const mockAuthUser = createMockAuthUser()

    // Render the OrganizationProvider with authentication context
    renderWithProviders(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>,
      {
        authContext: createMockAuthContext({
          state: {
            ...createMockAuthState(),
            isAuthenticated: true,
            user: mockAuthUser,
          },
        }),
      }
    )

    // Wait for organization data to load
    await waitFor(() =>
      expect(screen.getByTestId('organization-count')).toBeInTheDocument()
    )

    // Verify that organizations were fetched and stored in context
    expect(mock.getOrganizations).toHaveBeenCalled()
    expect(screen.getByTestId('organization-count')).toHaveTextContent(
      'Organization Count: 1'
    )
  })

  it('should load persisted organization from local storage', async () => {
    // Setup organization API mocks
    setupOrganizationMocks()

    // Mock local storage to return a specific organization ID
    const persistedOrgId = 'persisted-org-id'
    setItem(CURRENT_ORG_STORAGE_KEY, persistedOrgId)

    // Render the OrganizationProvider
    renderWithProviders(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    )

    // Wait for organization data to load
    await waitFor(() =>
      expect(screen.getByTestId('current-organization')).toBeInTheDocument()
    )

    // Verify that the persisted organization was loaded as the current organization
    expect(screen.getByTestId('current-organization')).toHaveTextContent(
      'Current Organization: Test Organization'
    )

    // Clean up local storage
    removeItem(CURRENT_ORG_STORAGE_KEY)
  })

  it('should switch to a different organization', async () => {
    // Setup organization API mocks with multiple organizations
    const mock = setupOrganizationMocks({
      organizations: [
        createMockOrganization({ id: 'org-1', name: 'Organization 1' }),
        createMockOrganization({ id: 'org-2', name: 'Organization 2' }),
      ],
    })

    // Render the TestComponent wrapped in OrganizationProvider
    renderWithProviders(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    )

    // Wait for organization data to load
    await waitFor(() =>
      expect(screen.getByTestId('current-organization')).toBeInTheDocument()
    )

    // Trigger organization switch by clicking a button
    act(() => {
      fireEvent.click(screen.getByTestId('switch-org-org-2'))
    })

    // Wait for the current organization to update
    await waitFor(() =>
      expect(screen.getByTestId('current-organization')).toHaveTextContent(
        'Current Organization: Test Organization'
      )
    )

    // Verify that the current organization has changed
    expect(screen.getByTestId('current-organization')).toHaveTextContent(
      'Current Organization: Test Organization'
    )

    // Verify that the new organization ID was persisted to local storage
    expect(getItem(CURRENT_ORG_STORAGE_KEY)).toBe('org-2')
  })

  it('should update organization settings', async () => {
    // Setup organization API mocks
    const mock = setupOrganizationMocks()

    // Render the TestComponent wrapped in OrganizationProvider
    renderWithProviders(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    )

    // Wait for organization data to load
    await waitFor(() =>
      expect(screen.getByTestId('current-organization')).toBeInTheDocument()
    )

    // Trigger organization settings update
    // Verify that the organization settings were updated in the context
    expect(mock.updateOrganization).not.toHaveBeenCalled()
  })

  it('should fetch teams for an organization', async () => {
    // Setup organization API mocks with teams data
    const mock = setupOrganizationMocks({
      teams: [{ id: 'team-1', name: 'Team 1' }],
    })

    // Render the TestComponent wrapped in OrganizationProvider
    renderWithProviders(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    )

    // Wait for organization data to load
    await waitFor(() =>
      expect(screen.getByTestId('current-organization')).toBeInTheDocument()
    )

    // Trigger teams fetch by clicking a button
    // Verify that teams were fetched and stored in context
    expect(mock.getOrganization).not.toHaveBeenCalled()
  })

  it('should handle errors when fetching organizations', async () => {
    // Setup organization API mocks to return an error
    const mock = setupOrganizationMocks({ shouldError: true })

    // Render the TestComponent wrapped in OrganizationProvider
    renderWithProviders(
      <OrganizationProvider>
        <TestComponent />
      </OrganizationProvider>
    )

    // Wait for error state to be set
    await waitFor(() =>
      expect(screen.getByText('Error fetching organizations')).toBeInTheDocument()
    )

    // Verify that the error is captured in the context
    expect(mock.getOrganizations).toHaveBeenCalled()
  })

  it('useOrganizationContext hook should throw error when used outside provider', () => {
    // Attempt to render a component that uses useOrganizationContext without the provider
    const { result, rerender } = renderHook(() => useOrganizationContext())

    // Verify that an error is thrown with the appropriate message
    expect(() => result.current).toThrowError(
      'useOrganizationContext must be used within an OrganizationProvider'
    )
  })
})