# src/backend/tests/integration/auth.test.ts
```typescript
import request from 'supertest'; // version ^6.3.3
import jwt from 'jsonwebtoken'; // version ^9.0.0
import { app } from '../../src/app';
import { prismaMock } from '../mocks/prismaMock';
import { auth } from '../mocks/firebaseMock';
import { mockUser, mockGoogleUser, mockMicrosoftUser, generateMockUser, mockOrganization } from '../fixtures/users';
import { AuthProvider } from '../../src/types/auth.types';
import { UserRole } from '../../src/utils/constants/roles';

const createTestToken = (payload: any, secret: string, options: any = {}) => {
  return jwt.sign(payload, secret, options);
};

const setupUserMocks = (userData: any) => {
  prismaMock.user.findUnique.mockResolvedValue(userData);
  auth.getUserByEmail.mockResolvedValue({ uid: userData.authId, email: userData.email });
};

describe('Authentication API Integration Tests', () => {
  describe('POST /api/v1/auth/register - should register a new user successfully', () => {
    it('POST /api/v1/auth/register - should register a new user successfully', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);
      auth.createUser.mockResolvedValue({ uid: 'test-uid' });
      prismaMock.user.create.mockResolvedValue(mockUser);

      const registrationData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        organizationId: 'org-123e4567-e89b-12d3-a456-426614174000',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationData);

      expect(response.status).toBe(201);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.TEAM_MEMBER,
          organizationId: 'org-123e4567-e89b-12d3-a456-426614174000',
          authId: 'test-uid',
          authProvider: AuthProvider.EMAIL_PASSWORD,
        })
      );
    });
  });

  it('POST /api/v1/auth/register - should return 400 for invalid registration data', async () => {
    const invalidRegistrationData = {
      email: 'invalid-email',
      password: 'short',
      firstName: '',
      lastName: '',
      organizationId: 'invalid-uuid',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(invalidRegistrationData);

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('POST /api/v1/auth/register - should return 409 if email already exists', async () => {
    auth.getUserByEmail.mockResolvedValue({});

    const registrationData = {
      email: 'existing@example.com',
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'User',
      organizationId: 'org-123e4567-e89b-12d3-a456-426614174000',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(registrationData);

    expect(response.status).toBe(409);
    expect(response.body.message).toEqual(expect.stringContaining('Email is already in use'));
  });

  it('POST /api/v1/auth/login - should login successfully with email/password', async () => {
    setupUserMocks(mockUser);

    const loginData = {
      email: 'test@example.com',
      password: 'password',
      provider: AuthProvider.EMAIL_PASSWORD
    };

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(loginData);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('POST /api/v1/auth/login - should login successfully with Google SSO', async () => {
    auth.verifyIdToken.mockResolvedValue({ sub: 'google-auth-123456', email: 'google-user@example.com' });
    setupUserMocks(mockGoogleUser);

    const loginData = {
      token: 'valid-google-token',
      provider: AuthProvider.GOOGLE,
      email: 'google-user@example.com'
    };

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(loginData);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('POST /api/v1/auth/login - should login successfully with Microsoft SSO', async () => {
    auth.verifyIdToken.mockResolvedValue({ sub: 'microsoft-auth-123456', email: 'microsoft-user@example.com' });
    setupUserMocks(mockMicrosoftUser);

    const loginData = {
      token: 'valid-microsoft-token',
      provider: AuthProvider.MICROSOFT,
      email: 'microsoft-user@example.com'
    };

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(loginData);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('POST /api/v1/auth/login - should return 401 for invalid credentials', async () => {
    auth.getUserByEmail.mockRejectedValue(new Error('Invalid credentials'));

    const loginData = {
      email: 'invalid@example.com',
      password: 'wrongpassword',
      provider: AuthProvider.EMAIL_PASSWORD
    };

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(loginData);

    expect(response.status).toBe(401);
    expect(response.body.message).toEqual(expect.stringContaining('Invalid email or password.'));
  });

  it('POST /api/v1/auth/refresh - should refresh tokens successfully', async () => {
    setupUserMocks(mockUser);

    const refreshToken = createTestToken({ id: mockUser.id }, 'secret', { expiresIn: '1h' });

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user).toBeDefined();
  });

  it('POST /api/v1/auth/refresh - should return 401 for invalid refresh token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-refresh-token' });

    expect(response.status).toBe(401);
    expect(response.body.message).toEqual(expect.stringContaining('Invalid authentication token.'));
  });

  it('POST /api/v1/auth/logout - should logout successfully', async () => {
    auth.revokeRefreshTokens.mockResolvedValue(undefined);

    const accessToken = createTestToken({ id: mockUser.id }, 'secret', { expiresIn: '1h' });

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ userId: mockUser.id });

    expect(response.status).toBe(200);
    expect(response.body.message).toEqual(expect.stringContaining('Logout successful'));
    expect(auth.revokeRefreshTokens).toHaveBeenCalledWith(mockUser.id);
  });

  it('POST /api/v1/auth/logout - should return 401 for missing token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .send();

    expect(response.status).toBe(401);
    expect(response.body.message).toEqual(expect.stringContaining('Missing Authorization header'));
  });

  it('POST /api/v1/auth/reset-password - should request password reset successfully', async () => {
    auth.getUserByEmail.mockResolvedValue({});
    auth.generatePasswordResetLink.mockResolvedValue('https://example.com/reset');

    const response = await request(app)
      .post('/api/v1/auth/resetPassword')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.message).toEqual(expect.stringContaining('Password reset email sent'));
    expect(auth.generatePasswordResetLink).toHaveBeenCalledWith('test@example.com');
  });

  it('POST /api/v1/auth/reset-password - should return 404 for non-existent email', async () => {
    auth.getUserByEmail.mockRejectedValue(new Error('User not found'));

    const response = await request(app)
      .post('/api/v1/auth/resetPassword')
      .send({ email: 'nonexistent@example.com' });

    expect(response.status).toBe(404);
    expect(response.body.message).toEqual(expect.stringContaining('User not found'));
  });

  it('POST /api/v1/auth/change-password - should change password successfully', async () => {
    setupUserMocks(mockUser);
    auth.updateUser.mockResolvedValue({});

    const accessToken = createTestToken({ id: mockUser.id }, 'secret', { expiresIn: '1h' });

    const response = await request(app)
      .post('/api/v1/auth/changePassword')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'oldpassword', newPassword: 'NewSecurePassword123!' });

    expect(response.status).toBe(200);
    expect(response.body.message).toEqual(expect.stringContaining('Password changed successfully'));
    expect(auth.updateUser).toHaveBeenCalled();
  });

  it('POST /api/v1/auth/change-password - should return 401 for invalid current password', async () => {
    setupUserMocks(mockUser);
    auth.verifyPassword = jest.fn().mockResolvedValue(false);

    const accessToken = createTestToken({ id: mockUser.id }, 'secret', { expiresIn: '1h' });

    const response = await request(app)
      .post('/api/v1/auth/changePassword')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'NewSecurePassword123!' });

    expect(response.status).toBe(401);
    expect(response.body.message).toEqual(expect.stringContaining('Invalid email or password.'));
  });
});