import request from 'supertest'; // version ^6.3.3
import { jest } from '@jest/globals'; // version ^29.5.0
import jwt from 'jsonwebtoken'; // version ^9.0.0
import { app } from '../../src/app';
import { prismaMock } from '../mocks/prismaMock';
import {
  mockUser,
  mockCoach,
  mockCEO,
  mockLeadership,
  mockTeamMember,
  mockViewer,
  mockUserWithRelations,
  mockUsers,
  mockOrganization,
  mockTeam,
} from '../fixtures/users';
import { UserRole } from '../../src/utils/constants/roles';
import { UserStatus } from '../../src/types/user.types';
import { AuthProvider } from '../../src/types/auth.types';

/**
 * Helper function to set up Prisma user mocks for testing
 */
const setupUserMocks = () => {
  // Reset Prisma mock implementations
  prismaMock.user.findUnique.mockReset();
  prismaMock.user.findMany.mockReset();
  prismaMock.user.create.mockReset();
  prismaMock.user.update.mockReset();
  prismaMock.user.delete.mockReset();
  prismaMock.user.count.mockReset();

  // Mock user.findUnique to return appropriate user based on ID or email
  prismaMock.user.findUnique.mockImplementation(async (args) => {
    if (args.where.id) {
      return mockUsers.find(user => user.id === args.where.id);
    }
    if (args.where.email) {
      return mockUsers.find(user => user.email === args.where.email);
    }
    return null;
  });

  // Mock user.findMany to return mock users array
  prismaMock.user.findMany.mockResolvedValue(mockUsers);

  // Mock user.create to return a new user with provided data
  prismaMock.user.create.mockImplementation(async (args) => {
    const newUser = {
      id: 'new-user-id',
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newUser as any;
  });

  // Mock user.update to return updated user with merged data
  prismaMock.user.update.mockImplementation(async (args) => {
    const updatedUser = {
      ...mockUser,
      ...args.data,
      updatedAt: new Date(),
    };
    return updatedUser as any;
  });

  // Mock user.delete to return deleted user
  prismaMock.user.delete.mockResolvedValue(mockUser);

  // Mock user.count to return appropriate count
  prismaMock.user.count.mockResolvedValue(mockUsers.length);
};

describe('User API Integration Tests', () => {
  const generateAuthToken = (user: any) => {
    return jwt.sign({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, 'your-secret-key');
  };

  describe('GET /api/v1/users', () => {
    it('Should return a paginated list of users', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/users with filters', () => {
    it('Should return filtered users based on query parameters', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const response = await request(app)
        .get('/api/v1/users?role=TEAM_MEMBER')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((user: any) => user.role === 'TEAM_MEMBER')).toBe(true);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('Should return a single user by ID', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const response = await request(app)
        .get(`/api/v1/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(mockUser.id);
    });
  });

  describe('GET /api/v1/users/:id with insufficient permissions', () => {
    it('Should return 403 when user lacks permission to view another user', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockTeamMember);

      const response = await request(app)
        .get(`/api/v1/users/${mockCEO.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it('Should return the current user\'s profile', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockUser);

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(mockUser.id);
    });
  });

  describe('POST /api/v1/users', () => {
    it('Should create a new user', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const newUser = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.TEAM_MEMBER,
        organizationId: mockOrganization.id,
        authId: 'auth-new-user',
        authProvider: AuthProvider.EMAIL_PASSWORD,
        photoURL: null,
        status: UserStatus.ACTIVE
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(newUser.email);
    });
  });

  describe('POST /api/v1/users with invalid data', () => {
    it('Should return 400 for invalid user data', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const invalidUser = {
        email: 'invalid-email',
        firstName: '',
        lastName: '',
        role: 'INVALID_ROLE',
        organizationId: 'invalid-uuid',
        authId: '',
        authProvider: 'INVALID_PROVIDER',
        photoURL: 'not a url',
        status: 'INVALID_STATUS'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidUser);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('Should update an existing user', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const updateData = {
        firstName: 'Updated',
        lastName: 'User',
        role: UserRole.LEADERSHIP,
        photoURL: 'https://example.com/updated.jpg',
        status: UserStatus.INACTIVE
      };

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
    });
  });

  describe('PUT /api/v1/users/:id/email', () => {
    it('Should update a user\'s email address', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const updateData = {
        email: 'updatedemail@example.com'
      };

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}/email`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(updateData.email);
    });
  });

  describe('PUT /api/v1/users/:id/role', () => {
    it('Should update a user\'s role', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const updateData = {
        role: UserRole.LEADERSHIP
      };

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.role).toBe(updateData.role);
    });
  });

  describe('PUT /api/v1/users/:id/role with insufficient permissions', () => {
    it('Should return 403 when user lacks permission to change role', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockTeamMember);

      const updateData = {
        role: UserRole.LEADERSHIP
      };

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/v1/users/:id/preferences', () => {
    it('Should update a user\'s preferences', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockUser);

      const updateData = {
        preferences: {
          theme: 'dark',
          timezone: 'Europe/London'
        }
      };

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}/preferences`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.theme).toBe(updateData.preferences.theme);
      expect(response.body.data.timezone).toBe(updateData.preferences.timezone);
    });
  });

  describe('PUT /api/v1/users/:id/activate', () => {
    it('Should activate a user account', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const response = await request(app)
        .put(`/api/v1/users/${mockInactiveUser.id}/activate`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isActive).toBe(true);
    });
  });

  describe('PUT /api/v1/users/:id/deactivate', () => {
    it('Should deactivate a user account', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const response = await request(app)
        .put(`/api/v1/users/${mockUser.id}/deactivate`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('POST /api/v1/users/invite', () => {
    it('Should invite a new user', async () => {
      setupUserMocks();

      const token = generateAuthToken(mockCoach);

      const inviteData = {
        email: 'invited@example.com',
        firstName: 'Invited',
        lastName: 'User',
        role: UserRole.TEAM_MEMBER,
        organizationId: mockOrganization.id,
        teamIds: [mockTeam.id]
      };

      const response = await request(app)
        .post('/api/v1/users/invite')
        .set('Authorization', `Bearer ${token}`)
        .send(inviteData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(inviteData.email);
      expect(response.body.data.status).toBe('PENDING');
    });
  });
});