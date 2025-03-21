import axios from 'axios'; // v1.4.0
import MockAdapter from 'axios-mock-adapter'; // ^1.21.4
import {
  login,
  loginWithFirebaseToken,
  register,
  refreshToken,
  logout,
  resetPassword,
  changePassword
} from '../authApi';
import { ApiErrorType } from '../../../types/api.types';
import { AuthProvider } from '../../../types/auth.types';
import { mockAuthResponse } from '../../../../tests/mocks/apiMocks';
import { apiClient } from '../index';

describe('login', () => {
  // Set up mock adapter for axios
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('Test successful login with email and password', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com',
      password: 'password',
      provider: AuthProvider.EMAIL_PASSWORD
    };
    mock.onPost('/auth/login').reply(200, { data: mockAuthResponse });

    // Act
    const response = await login(credentials);

    // Assert
    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockAuthResponse);
  });

  it('Test login with invalid credentials', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com',
      password: 'wrongpassword',
      provider: AuthProvider.EMAIL_PASSWORD
    };
    mock.onPost('/auth/login').reply(401, { message: 'Invalid credentials' });

    // Act & Assert
    await expect(login(credentials)).rejects.toThrowError('Invalid credentials');
  });

  it('Test login with server error', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com',
      password: 'password',
      provider: AuthProvider.EMAIL_PASSWORD
    };
    mock.onPost('/auth/login').reply(500, { message: 'Internal server error' });

    // Act & Assert
    await expect(login(credentials)).rejects.toThrowError('Internal server error');
  });

  it('Test login with network error', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com',
      password: 'password',
      provider: AuthProvider.EMAIL_PASSWORD
    };
    mock.onPost('/auth/login').networkError();

    // Act & Assert
    await expect(login(credentials)).rejects.toThrowError('Network error: No response received from server');
  });
});

describe('loginWithFirebaseToken', () => {
  // Set up mock adapter for axios
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('Test successful login with Firebase token', async () => {
    // Arrange
    const token = 'testFirebaseToken';
    mock.onPost('/auth/login').reply(200, { data: mockAuthResponse });

    // Act
    const response = await loginWithFirebaseToken(token, AuthProvider.GOOGLE);

    // Assert
    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockAuthResponse);
  });

  it('Test login with invalid Firebase token', async () => {
    // Arrange
    const token = 'invalidFirebaseToken';
    mock.onPost('/auth/login').reply(401, { message: 'Invalid token' });

    // Act & Assert
    await expect(loginWithFirebaseToken(token, AuthProvider.GOOGLE)).rejects.toThrowError('Invalid token');
  });

  it('Test login with server error', async () => {
    // Arrange
    const token = 'testFirebaseToken';
    mock.onPost('/auth/login').reply(500, { message: 'Internal server error' });

    // Act & Assert
    await expect(loginWithFirebaseToken(token, AuthProvider.GOOGLE)).rejects.toThrowError('Internal server error');
  });
});

describe('register', () => {
  // Set up mock adapter for axios
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('Test successful user registration', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
      organizationId: 'testOrgId'
    };
    const firebaseToken = 'testFirebaseToken';
    mock.onPost('/auth/register').reply(200, { data: mockAuthResponse });

    // Act
    const response = await register(userData, firebaseToken);

    // Assert
    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockAuthResponse);
  });

  it('Test registration with validation errors', async () => {
    // Arrange
    const userData = {
      email: 'invalid-email',
      password: 'short',
      firstName: 'T',
      lastName: 'U',
      organizationId: 'testOrgId'
    };
    const firebaseToken = 'testFirebaseToken';
    mock.onPost('/auth/register').reply(400, { message: 'Validation error' });

    // Act & Assert
    await expect(register(userData, firebaseToken)).rejects.toThrowError('Validation error');
  });

  it('Test registration with existing email', async () => {
    // Arrange
    const userData = {
      email: 'existing@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
      organizationId: 'testOrgId'
    };
    const firebaseToken = 'testFirebaseToken';
    mock.onPost('/auth/register').reply(409, { message: 'Email already exists' });

    // Act & Assert
    await expect(register(userData, firebaseToken)).rejects.toThrowError('Email already exists');
  });

  it('Test registration with server error', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
      organizationId: 'testOrgId'
    };
    const firebaseToken = 'testFirebaseToken';
    mock.onPost('/auth/register').reply(500, { message: 'Internal server error' });

    // Act & Assert
    await expect(register(userData, firebaseToken)).rejects.toThrowError('Internal server error');
  });
});

describe('refreshToken', () => {
  // Set up mock adapter for axios
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('Test successful token refresh', async () => {
    // Arrange
    const refreshTokenValue = 'testRefreshToken';
    mock.onPost('/auth/refresh-token').reply(200, { data: mockAuthResponse });

    // Act
    const response = await refreshToken(refreshTokenValue);

    // Assert
    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockAuthResponse);
  });

  it('Test token refresh with invalid token', async () => {
    // Arrange
    const refreshTokenValue = 'invalidRefreshToken';
    mock.onPost('/auth/refresh-token').reply(401, { message: 'Invalid refresh token' });

    // Act & Assert
    await expect(refreshToken(refreshTokenValue)).rejects.toThrowError('Invalid refresh token');
  });

  it('Test token refresh with server error', async () => {
    // Arrange
    const refreshTokenValue = 'testRefreshToken';
    mock.onPost('/auth/refresh-token').reply(500, { message: 'Internal server error' });

    // Act & Assert
    await expect(refreshToken(refreshTokenValue)).rejects.toThrowError('Internal server error');
  });
});

describe('logout', () => {
  // Set up mock adapter for axios
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('Test successful logout', async () => {
    // Arrange
    const refreshTokenValue = 'testRefreshToken';
    mock.onPost('/auth/logout').reply(200, { data: { success: true } });

    // Act
    const response = await logout(refreshTokenValue);

    // Assert
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ success: true });
  });

  it('Test logout with invalid token', async () => {
    // Arrange
    const refreshTokenValue = 'invalidRefreshToken';
    mock.onPost('/auth/logout').reply(401, { message: 'Invalid refresh token' });

    // Act & Assert
    await expect(logout(refreshTokenValue)).rejects.toThrowError('Invalid refresh token');
  });

  it('Test logout with server error', async () => {
    // Arrange
    const refreshTokenValue = 'testRefreshToken';
    mock.onPost('/auth/logout').reply(500, { message: 'Internal server error' });

    // Act & Assert
    await expect(logout(refreshTokenValue)).rejects.toThrowError('Internal server error');
  });
});

describe('resetPassword', () => {
  // Set up mock adapter for axios
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('Test successful password reset request', async () => {
    // Arrange
    const email = 'test@example.com';
    mock.onPost('/auth/reset-password').reply(200, { data: { success: true } });

    // Act
    const response = await resetPassword(email);

    // Assert
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ success: true });
  });

  it('Test password reset with invalid email', async () => {
    // Arrange
    const email = 'invalid-email';
    mock.onPost('/auth/reset-password').reply(400, { message: 'Invalid email address' });

    // Act & Assert
    await expect(resetPassword(email)).rejects.toThrowError('Invalid email address');
  });

  it('Test password reset with server error', async () => {
    // Arrange
    const email = 'test@example.com';
    mock.onPost('/auth/reset-password').reply(500, { message: 'Internal server error' });

    // Act & Assert
    await expect(resetPassword(email)).rejects.toThrowError('Internal server error');
  });
});

describe('changePassword', () => {
  // Set up mock adapter for axios
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('Test successful password change', async () => {
    // Arrange
    const passwordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };
    const accessToken = 'testAccessToken';
    mock.onPost('/auth/change-password').reply(200, { data: { success: true } });

    // Act
    const response = await changePassword(passwordData, accessToken);

    // Assert
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ success: true });
  });

  it('Test password change with incorrect current password', async () => {
    // Arrange
    const passwordData = {
      currentPassword: 'wrongPassword',
      newPassword: 'newPassword'
    };
    const accessToken = 'testAccessToken';
    mock.onPost('/auth/change-password').reply(401, { message: 'Incorrect current password' });

    // Act & Assert
    await expect(changePassword(passwordData, accessToken)).rejects.toThrowError('Incorrect current password');
  });

  it('Test password change with validation errors', async () => {
    // Arrange
    const passwordData = {
      currentPassword: 'oldPassword',
      newPassword: 'short'
    };
    const accessToken = 'testAccessToken';
    mock.onPost('/auth/change-password').reply(400, { message: 'Validation error' });

    // Act & Assert
    await expect(changePassword(passwordData, accessToken)).rejects.toThrowError('Validation error');
  });

  it('Test password change with server error', async () => {
    // Arrange
    const passwordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword'
    };
    const accessToken = 'testAccessToken';
    mock.onPost('/auth/change-password').reply(500, { message: 'Internal server error' });

    // Act & Assert
    await expect(changePassword(passwordData, accessToken)).rejects.toThrowError('Internal server error');
  });
});