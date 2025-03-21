import React from 'react'; // react@^18.2.0
import { screen, waitFor, fireEvent } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

// Internal imports
import UserProfilePage from '../UserProfilePage';
import { renderWithProviders, createMockAuthUser, waitForLoadingToFinish } from '../../../tests/testUtils';

// Mock the useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}));

// Mock the useUsers hook
vi.mock('../../../hooks/useUsers', () => ({
  useUsers: () => mockUseUsers
}));

// Mock the Breadcrumbs component
vi.mock('../../../components/layout/Breadcrumbs', () => ({
  default: () => <div data-testid="breadcrumbs">Breadcrumbs</div>
}));

// Mock data and functions
const mockUseAuth = { state: { user: null, isAuthenticated: true, isLoading: false, error: null } };
const mockUseUsers = { getCurrentUser: vi.fn(), updateUser: vi.fn(), updateUserPreferences: vi.fn(), uploadProfileImage: vi.fn() };
const mockUserProfile = {
  id: '123',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'TEAM_MEMBER',
  status: 'ACTIVE',
  profileImageUrl: 'https://example.com/image.jpg',
  organization: { id: '456', name: 'Test Org' },
  preferences: { theme: 'light', notifications: { email: true, inApp: true } }
};

describe('UserProfilePage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Set up default mock implementations
    mockUseUsers.updateUser.mockResolvedValue(mockUserProfile);
    mockUseUsers.updateUserPreferences.mockResolvedValue({ ...mockUserProfile.preferences, email: true, inApp: true });

    // Configure mockUseAuth with an authenticated user
    mockUseAuth.state.user = createMockAuthUser({
      id: '123',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'TEAM_MEMBER',
      organizationId: '456',
      profileImageUrl: 'https://example.com/image.jpg'
    });

    // Configure mockUseUsers with getCurrentUser returning mockUserProfile
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  it('should render loading state initially', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockReturnValue(new Promise(() => { })); // Simulate pending promise

    // Act
    renderWithProviders(<UserProfilePage />);

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  it('should render user profile when data is loaded', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();

    // Assert
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('Team Member')).toBeInTheDocument();
    const profileImage = screen.getByAltText('Profile');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should render error state when data fetch fails', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockRejectedValue(new Error('Failed to fetch user profile'));

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();

    // Assert
    expect(screen.getByText('Error: Failed to fetch user profile')).toBeInTheDocument();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  it('should enter edit mode when edit button is clicked', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    // Assert
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should update user profile when form is submitted', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);
    mockUseUsers.updateUser.mockResolvedValue({ ...mockUserProfile, firstName: 'Updated', lastName: 'User' });

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Updated' } });
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    await waitForLoadingToFinish();

    // Assert
    expect(mockUseUsers.updateUser).toHaveBeenCalledWith({
      id: '123',
      firstName: 'Updated',
      lastName: 'User',
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
      photoURL: null
    });
    expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    expect(screen.getByText('Updated User')).toBeInTheDocument();
  });

  it('should show validation errors for invalid inputs', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: '' } });
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Assert
    expect(screen.getByText(/the field 'first name' is required/i)).toBeInTheDocument();
    expect(mockUseUsers.updateUser).not.toHaveBeenCalled();
  });

  it('should handle profile image upload', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);
    mockUseUsers.uploadProfileImage.mockResolvedValue('https://example.com/new-image.jpg');

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const fileInput = screen.getByLabelText(/upload new image/i);
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    userEvent.upload(fileInput, file);
    await waitForLoadingToFinish();

    // Assert
    expect(mockUseUsers.uploadProfileImage).toHaveBeenCalledWith(file);
    expect(screen.getByText(/profile image updated successfully/i)).toBeInTheDocument();
    const profileImage = screen.getByAltText('Profile');
    expect(profileImage).toHaveAttribute('src', 'https://example.com/new-image.jpg');
  });

  it('should handle preference updates', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);
    mockUseUsers.updateUserPreferences.mockResolvedValue({ ...mockUserProfile.preferences, email: false, inApp: false });

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();

    const emailSwitch = screen.getByRole('checkbox', { name: /email notifications/i });
    fireEvent.click(emailSwitch);
    const inAppSwitch = screen.getByRole('checkbox', { name: /in-app notifications/i });
    fireEvent.click(inAppSwitch);
    await waitForLoadingToFinish();

    // Assert
    expect(mockUseUsers.updateUserPreferences).toHaveBeenCalledWith({
      theme: 'light',
      notifications: {
        email: false,
        inApp: false
      }
    });
    expect(screen.getByText(/preferences updated successfully/i)).toBeInTheDocument();
  });

  it('should handle error during profile update', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);
    mockUseUsers.updateUser.mockRejectedValue(new Error('Failed to update profile'));

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Updated' } });
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    await waitForLoadingToFinish();

    // Assert
    expect(screen.getByText(/error: failed to update profile/i)).toBeInTheDocument();
  });

  it('should cancel edit mode when cancel button is clicked', async () => {
    // Arrange
    mockUseUsers.getCurrentUser.mockResolvedValue(mockUserProfile);

    // Act
    renderWithProviders(<UserProfilePage />);
    await waitForLoadingToFinish();
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Updated' } });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Assert
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(mockUseUsers.updateUser).not.toHaveBeenCalled();
  });
});