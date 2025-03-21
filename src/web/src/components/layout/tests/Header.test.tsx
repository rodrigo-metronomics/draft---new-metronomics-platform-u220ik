# src/web/src/components/layout/tests/Header.test.tsx
```typescript
import React from 'react'; // React v^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

import Header from '../Header';
import { renderWithProviders, createMockAuthUser, createMockOrganization } from '../../../tests/testUtils';
import { ROUTES } from '../../../utils/constants/routes';
import { UserRole } from '../../../utils/constants/roles';

describe('Header component', () => {
  // Set up mock data for authenticated user and organizations
  const mockAuthUser = createMockAuthUser();
  const mockOrganizations = [
    createMockOrganization({ id: 'org1', name: 'Organization 1' }),
    createMockOrganization({ id: 'org2', name: 'Organization 2' }),
  ];

  // Set up mock functions for context methods
  const mockToggleTheme = vi.fn();
  const mockSwitchOrganization = vi.fn();
  const mockLogout = vi.fn();
  const mockNavigate = vi.fn();
  const mockOnMenuToggle = vi.fn();

  it('renders the logo, organization selector, and user menu', async () => {
    // Render the Header component with mock providers
    renderWithProviders(
      <Header onMenuToggle={mockOnMenuToggle} />,
      {
        authContext: {
          state: { ...createMockAuthState(), user: mockAuthUser },
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: mockSwitchOrganization,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
        routes: [{ path: ROUTES.DASHBOARD.HOME, element: <div>Dashboard</div> }],
      }
    );

    // Verify the logo is rendered and links to the dashboard
    const logo = screen.getByRole('link', { name: 'Metronomics Logo' });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', ROUTES.DASHBOARD.HOME);

    // Verify the organization selector is rendered with the current organization name
    const orgSelector = screen.getByText(mockOrganizations[0].name);
    expect(orgSelector).toBeInTheDocument();

    // Verify the notification center icon is rendered
    const notificationIcon = screen.getByLabelText('Notifications');
    expect(notificationIcon).toBeInTheDocument();

    // Verify the theme toggle button is rendered
    const themeToggleButton = screen.getByLabelText('Toggle Theme');
    expect(themeToggleButton).toBeInTheDocument();

    // Verify the user menu is rendered with the user's avatar and name
    const userMenuTrigger = screen.getByText(`${mockAuthUser.firstName} ${mockAuthUser.lastName}`);
    expect(userMenuTrigger).toBeInTheDocument();
  });

  it('toggles the theme when theme button is clicked', async () => {
    // Set up mock for toggleTheme function
    const toggleThemeMock = vi.fn();

    // Render the Header component with mock providers
    renderWithProviders(
      <Header onMenuToggle={mockOnMenuToggle} />,
      {
        authContext: {
          state: createMockAuthState(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: mockSwitchOrganization,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
        themeContext: {
          theme: { colors: { background: { primary: 'white' } } } as any,
          themeMode: 'light',
          setTheme: vi.fn(),
          toggleTheme: toggleThemeMock,
        },
      }
    );

    // Find the theme toggle button
    const themeToggleButton = screen.getByLabelText('Toggle Theme');

    // Click the theme toggle button
    await userEvent.click(themeToggleButton);

    // Verify that toggleTheme function was called
    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });

  it('opens the organization selector dropdown when clicked', async () => {
    // Render the Header component with mock providers
    renderWithProviders(
      <Header onMenuToggle={mockOnMenuToggle} />,
      {
        authContext: {
          state: createMockAuthState(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: mockSwitchOrganization,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
      }
    );

    // Find the organization selector trigger
    const orgSelectorTrigger = screen.getByText(mockOrganizations[0].name);

    // Click the organization selector trigger
    await userEvent.click(orgSelectorTrigger);

    // Verify that the organization dropdown is displayed
    const orgDropdown = await screen.findByRole('listbox');
    expect(orgDropdown).toBeVisible();

    // Verify that all organizations are listed in the dropdown
    mockOrganizations.forEach((org) => {
      expect(screen.getByText(org.name)).toBeInTheDocument();
    });
  });

  it('switches organization when an organization is selected', async () => {
    // Set up mock for switchOrganization function
    const switchOrganizationMock = vi.fn();

    // Render the Header component with mock providers
    renderWithProviders(
      <Header onMenuToggle={mockOnMenuToggle} />,
      {
        authContext: {
          state: createMockAuthState(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: switchOrganizationMock,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
      }
    );

    // Open the organization selector dropdown
    const orgSelectorTrigger = screen.getByText(mockOrganizations[0].name);
    await userEvent.click(orgSelectorTrigger);

    // Find and click on a different organization in the dropdown
    const newOrg = mockOrganizations[1];
    const newOrgOption = screen.getByText(newOrg.name);
    await userEvent.click(newOrgOption);

    // Verify that switchOrganization function was called with the correct organization ID
    expect(switchOrganizationMock).toHaveBeenCalledTimes(1);
    expect(switchOrganizationMock).toHaveBeenCalledWith(newOrg.id);
  });

  it('opens the user menu dropdown when clicked', async () => {
    // Render the Header component with mock providers
    renderWithProviders(
      <Header onMenuToggle={mockOnMenuToggle} />,
      {
        authContext: {
          state: createMockAuthState(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: mockSwitchOrganization,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
      }
    );

    // Find the user menu trigger
    const userMenuTrigger = screen.getByText(`${mockAuthUser.firstName} ${mockAuthUser.lastName}`);

    // Click the user menu trigger
    await userEvent.click(userMenuTrigger);

    // Verify that the user dropdown menu is displayed
    const userDropdownMenu = await screen.findByRole('menu');
    expect(userDropdownMenu).toBeVisible();

    // Verify that the menu contains profile and logout options
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('navigates to user profile when profile option is clicked', async () => {
    // Set up mock for navigate function
    const navigateMock = vi.fn();

    // Render the Header component with mock providers
    renderWithProviders(
      <Header onMenuToggle={mockOnMenuToggle} />,
      {
        authContext: {
          state: createMockAuthState(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: mockSwitchOrganization,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
        routes: [{ path: ROUTES.USERS.PROFILE, element: <div>Profile</div> }],
        initialRoute: ROUTES.DASHBOARD.HOME,
        router: { navigate: navigateMock } as any,
      }
    );

    // Open the user menu dropdown
    const userMenuTrigger = screen.getByText(`${mockAuthUser.firstName} ${mockAuthUser.lastName}`);
    await userEvent.click(userMenuTrigger);

    // Find and click on the profile option
    const profileOption = screen.getByText('Profile');
    await userEvent.click(profileOption);

    // Verify that navigate function was called with the correct route
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.USERS.PROFILE);
  });

  it('calls logout when logout option is clicked', async () => {
    // Set up mock for logout function
    const logoutMock = vi.fn().mockResolvedValue(undefined);

    // Render the Header component with mock providers
    renderWithProviders(
      <Header onMenuToggle={mockOnMenuToggle} />,
      {
        authContext: {
          state: createMockAuthState(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: logoutMock,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: mockSwitchOrganization,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
        routes: [{ path: ROUTES.AUTH.LOGIN, element: <div>Login</div> }],
        initialRoute: ROUTES.DASHBOARD.HOME,
        router: { navigate: mockNavigate } as any,
      }
    );

    // Open the user menu dropdown
    const userMenuTrigger = screen.getByText(`${mockAuthUser.firstName} ${mockAuthUser.lastName}`);
    await userEvent.click(userMenuTrigger);

    // Find and click on the logout option
    const logoutOption = screen.getByText('Logout');
    await userEvent.click(logoutOption);

    // Verify that logout function was called
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('shows mobile menu toggle on small screens', async () => {
    // Mock useResponsive hook to return isMobile: true
    const useResponsiveMock = vi.fn().mockReturnValue({ isMobileView: true });
    vi.mock('../Header', () => {
      const originalModule = await vi.importActual('../Header');
      return {
        ...originalModule,
        useResponsive: useResponsiveMock,
      };
    });

    // Render the Header component with mock providers
    renderWithProviders(
      <Header onMenuToggle={mockOnMenuToggle} />,
      {
        authContext: {
          state: createMockAuthState(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: mockSwitchOrganization,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
      }
    );

    // Verify that the mobile menu toggle button is displayed
    const mobileMenuToggleButton = screen.getByLabelText('Toggle Menu');
    expect(mobileMenuToggleButton).toBeInTheDocument();

    // Verify that the organization selector is hidden on mobile
    expect(screen.queryByText(mockOrganizations[0].name)).toBeNull();

    // Verify that the user name is hidden on mobile
    expect(screen.queryByText(`${mockAuthUser.firstName} ${mockAuthUser.lastName}`)).toBeNull();
  });

  it('calls onMenuToggle when mobile menu button is clicked', async () => {
    // Mock useResponsive hook to return isMobile: true
    const useResponsiveMock = vi.fn().mockReturnValue({ isMobileView: true });
    vi.mock('../Header', () => {
      const originalModule = await vi.importActual('../Header');
      return {
        ...originalModule,
        useResponsive: useResponsiveMock,
      };
    });

    // Set up mock for onMenuToggle function
    const onMenuToggleMock = vi.fn();

    // Render the Header component with mock providers and onMenuToggle prop
    renderWithProviders(
      <Header onMenuToggle={onMenuToggleMock} />,
      {
        authContext: {
          state: createMockAuthState(),
          login: vi.fn(),
          loginWithGoogle: vi.fn(),
          loginWithMicrosoft: vi.fn(),
          register: vi.fn(),
          logout: mockLogout,
          resetPassword: vi.fn(),
          changePassword: vi.fn(),
          refreshToken: vi.fn(),
          hasPermission: vi.fn(),
          hasRole: vi.fn(),
        },
        organizationContext: {
          currentOrganization: mockOrganizations[0],
          organizations: mockOrganizations,
          teams: [],
          loading: false,
          error: null,
          fetchOrganizations: vi.fn(),
          fetchCurrentOrganization: vi.fn(),
          switchOrganization: mockSwitchOrganization,
          updateOrganization: vi.fn(),
          updateOrganizationSettings: vi.fn(),
          fetchTeams: vi.fn(),
        },
        realtimeContext: {
          connectionState: { status: 'connected', lastConnected: new Date(), retryCount: 0 },
          error: null,
          syncDocument: vi.fn(),
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
        },
      }
    );

    // Find the mobile menu toggle button
    const mobileMenuToggleButton = screen.getByLabelText('Toggle Menu');

    // Click the mobile menu toggle button
    await userEvent.click(mobileMenuToggleButton);

    // Verify that onMenuToggle function was called
    expect(onMenuToggleMock).toHaveBeenCalledTimes(1);
  });
});