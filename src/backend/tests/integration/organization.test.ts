import request from 'supertest'; // version ^6.3.3
import jwt from 'jsonwebtoken'; // version ^9.0.0
import { app } from '../../src/app';
import { prismaMock } from '../mocks/prismaMock';
import {
  mockOrganization,
  mockOrganizationWithRelations,
  mockOrganizations,
  generateMockOrganization,
} from '../fixtures/organizations';
import {
  mockUser,
  mockCEO,
  mockCoach,
  mockTeamMember,
  generateMockUser,
} from '../fixtures/users';
import { UserRole } from '../../src/utils/constants/roles';
import { Permission } from '../../src/utils/constants/permissions';

/**
 * Helper function to create JWT tokens for testing authentication
 * @param payload 
 * @param secret 
 * @param options 
 * @returns JWT token
 */
const createTestToken = (payload: any, secret: string, options: any): string => {
  // Use jsonwebtoken to sign the provided payload with the secret
  // Apply any provided options (expiration, algorithm, etc.)
  // Return the generated token string
  return jwt.sign(payload, secret, options);
};

/**
 * Helper function to set up common organization-related mocks
 * @param organizationData 
 */
const setupOrganizationMocks = (organizationData: any): void => {
  // Mock Prisma organization.findUnique to return the provided organization data
  prismaMock.organization.findUnique.mockResolvedValue(organizationData);
  // Mock Prisma organization.findFirst to return the provided organization data
  prismaMock.organization.findFirst.mockResolvedValue(organizationData);
  // Set up other common mocks needed for organization tests
  // (e.g., user authentication, permission checks)
};

describe('Organization API Integration Tests', () => {
  /**
   * Tests the organization API endpoints for creating, retrieving, updating, and managing organizations
   */
  describe('POST /api/organizations - should create a new organization successfully', () => {
    it('POST /api/organizations - should create a new organization successfully', async () => {
      // Create a valid access token for a user
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: null, permissions: [] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findFirst to return null (no existing org with same name)
      prismaMock.organization.findFirst.mockResolvedValue(null);

      // Mock Prisma organization.create to return a new organization record
      prismaMock.organization.create.mockResolvedValue(mockOrganization);

      // Mock Prisma user.findUnique to return mockUser
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      // Mock Prisma user.update to return updated user with organization
      prismaMock.user.update.mockResolvedValue({ ...mockUser, organizationId: mockOrganization.id });

      // Send POST request to /api/organizations with valid organization data
      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'New Org', description: 'New Organization Description' });

      // Assert response status is 201 Created
      expect(response.status).toBe(201);

      // Assert response contains organization data with correct properties
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.name).toBe(mockOrganization.name);

      // Verify Prisma organization.create was called with correct data
      expect(prismaMock.organization.create).toHaveBeenCalledWith({
        data: {
          name: 'New Org',
          description: 'New Organization Description',
          version: 1,
          status: 'DRAFT',
          settings: {
            theme: 'light',
            timezone: 'America/New_York',
            defaultMeetingDuration: 60,
            defaultMeetingReminders: [15, 5],
            logoUrl: null,
            customFields: {}
          },
          ownerId: mockUser.id
        }
      });

      // Verify Prisma user.update was called to associate user with organization
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { organizationId: mockOrganization.id, role: 'CEO' }
      });
    });
  });

  describe('POST /api/organizations - should return 400 for invalid organization data', () => {
    it('POST /api/organizations - should return 400 for invalid organization data', async () => {
      // Create a valid access token for a user
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: null, permissions: [] }, 'secret', { expiresIn: '1h' });

      // Send POST request to /api/organizations with invalid data (missing required fields)
      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // Assert response status is 400 Bad Request
      expect(response.status).toBe(400);

      // Assert response contains validation error messages
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/organizations - should return 409 if organization name already exists', () => {
    it('POST /api/organizations - should return 409 if organization name already exists', async () => {
      // Create a valid access token for a user
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: null, permissions: [] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findFirst to return an existing organization
      prismaMock.organization.findFirst.mockResolvedValue(mockOrganization);

      // Send POST request to /api/organizations with name that already exists
      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: mockOrganization.name });

      // Assert response status is 409 Conflict
      expect(response.status).toBe(409);

      // Assert response contains appropriate error message
      expect(response.body.message).toBe(`Organization with name '${mockOrganization.name}' already exists`);
    });
  });

  describe('GET /api/organizations/:organizationId - should retrieve an organization successfully', () => {
    it('GET /api/organizations/:organizationId - should retrieve an organization successfully', async () => {
      // Create a valid access token for a user with organization access
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: mockOrganization.id, permissions: [Permission.VIEW_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Send GET request to /api/organizations/:organizationId
      const response = await request(app)
        .get(`/api/organizations/${mockOrganization.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains organization data with correct properties
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.name).toBe(mockOrganization.name);

      // Verify Prisma organization.findUnique was called with correct ID
      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({ where: { id: mockOrganization.id } });
    });
  });

  describe('GET /api/organizations/:organizationId - should return 404 for non-existent organization', () => {
    it('GET /api/organizations/:organizationId - should return 404 for non-existent organization', async () => {
      // Create a valid access token for a user
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: mockOrganization.id, permissions: [Permission.VIEW_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return null
      prismaMock.organization.findUnique.mockResolvedValue(null);

      // Send GET request to /api/organizations/:organizationId
      const response = await request(app)
        .get(`/api/organizations/${mockOrganization.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 404 Not Found
      expect(response.status).toBe(404);

      // Assert response contains appropriate error message
      expect(response.body.message).toBe('Organization not found');
    });
  });

  describe('GET /api/organizations/:organizationId - should return 403 for unauthorized access', () => {
    it('GET /api/organizations/:organizationId - should return 403 for unauthorized access', async () => {
      // Create a valid access token for a user without organization access
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: 'different-org-id', permissions: [Permission.VIEW_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Mock Prisma user.findUnique to return user without organization access
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      // Send GET request to /api/organizations/:organizationId
      const response = await request(app)
        .get(`/api/organizations/${mockOrganization.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 403 Forbidden
      expect(response.status).toBe(403);

      // Assert response contains appropriate error message
      expect(response.body.message).toBe('Access denied to resource of type Organization with ID org-123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('GET /api/organizations/:organizationId/users - should retrieve organization with users', () => {
    it('GET /api/organizations/:organizationId/users - should retrieve organization with users', async () => {
      // Create a valid access token for a user with organization access
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: mockOrganization.id, permissions: [Permission.VIEW_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganizationWithRelations
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganizationWithRelations);

      // Send GET request to /api/organizations/:organizationId/users
      const response = await request(app)
        .get(`/api/organizations/${mockOrganization.id}/users`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains organization data with users array
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.users.length).toBe(mockOrganizationWithRelations.users.length);

      // Verify Prisma organization.findUnique was called with correct ID and include users
      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: mockOrganization.id },
        include: { users: true }
      });
    });
  });

  describe('GET /api/organizations/:organizationId/teams - should retrieve organization with teams', () => {
    it('GET /api/organizations/:organizationId/teams - should retrieve organization with teams', async () => {
      // Create a valid access token for a user with organization access
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: mockOrganization.id, permissions: [Permission.VIEW_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganizationWithRelations
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganizationWithRelations);

      // Send GET request to /api/organizations/:organizationId/teams
      const response = await request(app)
        .get(`/api/organizations/${mockOrganization.id}/teams`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains organization data with teams array
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.teams).toBeDefined();
      expect(response.body.data.teams.length).toBe(mockOrganizationWithRelations.teams.length);

      // Verify Prisma organization.findUnique was called with correct ID and include teams
      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({
        where: { id: mockOrganization.id },
        include: { teams: true }
      });
    });
  });

  describe("GET /api/organizations - should retrieve user's organizations", () => {
    it("GET /api/organizations - should retrieve user's organizations", async () => {
      // Create a valid access token for a user
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: mockUser.organizationId, permissions: [Permission.VIEW_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findMany to return mockOrganizations
      prismaMock.organization.findMany.mockResolvedValue(mockOrganizations);

      // Mock Prisma organization.count to return mockOrganizations.length
      prismaMock.organization.count.mockResolvedValue(mockOrganizations.length);

      // Send GET request to /api/organizations
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains organizations array and pagination info
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(mockOrganizations.length);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(mockOrganizations.length);

      // Verify Prisma organization.findMany was called with correct user filter
      expect(prismaMock.organization.findMany).toHaveBeenCalledWith({
        where: { id: mockUser.organizationId },
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' }
      });
    });
  });

  describe("GET /api/organizations/coach - should retrieve coach's organizations", () => {
    it("GET /api/organizations/coach - should retrieve coach's organizations", async () => {
      // Create a valid access token for a coach user
      const accessToken = createTestToken({ id: mockCoach.id, email: mockCoach.email, role: mockCoach.role, organizationId: null, permissions: [Permission.ACCESS_MULTIPLE_ORGANIZATIONS] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findMany to return mockOrganizations
      prismaMock.organization.findMany.mockResolvedValue(mockOrganizations);

      // Mock Prisma organization.count to return mockOrganizations.length
      prismaMock.organization.count.mockResolvedValue(mockOrganizations.length);

      // Send GET request to /api/organizations/coach
      const response = await request(app)
        .get('/api/organizations/coach')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains organizations array and pagination info
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBe(mockOrganizations.length);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(mockOrganizations.length);

      // Verify Prisma organization.findMany was called with correct coach filter
      expect(prismaMock.organization.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' }
      });
    });
  });

  describe('GET /api/organizations/coach - should return 403 for non-coach users', () => {
    it('GET /api/organizations/coach - should return 403 for non-coach users', async () => {
      // Create a valid access token for a non-coach user
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: mockUser.organizationId, permissions: [] }, 'secret', { expiresIn: '1h' });

      // Send GET request to /api/organizations/coach
      const response = await request(app)
        .get('/api/organizations/coach')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 403 Forbidden
      expect(response.status).toBe(403);

      // Assert response contains appropriate error message
      expect(response.body.message).toBe('You do not have permission to access this resource.');
    });
  });

  describe('PUT /api/organizations/:organizationId - should update organization successfully', () => {
    it('PUT /api/organizations/:organizationId - should update organization successfully', async () => {
      // Create a valid access token for a CEO user
      const accessToken = createTestToken({ id: mockCEO.id, email: mockCEO.email, role: mockCEO.role, organizationId: mockOrganization.id, permissions: [Permission.MANAGE_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Mock Prisma organization.update to return updated organization
      prismaMock.organization.update.mockResolvedValue({ ...mockOrganization, name: 'Updated Org Name' });

      // Send PUT request to /api/organizations/:organizationId with valid update data
      const response = await request(app)
        .put(`/api/organizations/${mockOrganization.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Org Name' });

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains updated organization data
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.name).toBe('Updated Org Name');

      // Verify Prisma organization.update was called with correct data
      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: mockOrganization.id },
        data: { name: 'Updated Org Name' }
      });
    });
  });

  describe('PUT /api/organizations/:organizationId - should return 403 for non-admin users', () => {
    it('PUT /api/organizations/:organizationId - should return 403 for non-admin users', async () => {
      // Create a valid access token for a team member user
      const accessToken = createTestToken({ id: mockTeamMember.id, email: mockTeamMember.email, role: mockTeamMember.role, organizationId: mockOrganization.id, permissions: [] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Mock Prisma user.findUnique to return mockTeamMember
      prismaMock.user.findUnique.mockResolvedValue(mockTeamMember);

      // Send PUT request to /api/organizations/:organizationId with valid update data
      const response = await request(app)
        .put(`/api/organizations/${mockOrganization.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Org Name' });

      // Assert response status is 403 Forbidden
      expect(response.status).toBe(403);

      // Assert response contains appropriate error message
      expect(response.body.message).toBe('You do not have permission to access this resource.');
    });
  });

  describe('PUT /api/organizations/:organizationId/settings - should update organization settings', () => {
    it('PUT /api/organizations/:organizationId/settings - should update organization settings', async () => {
      // Create a valid access token for a CEO user
      const accessToken = createTestToken({ id: mockCEO.id, email: mockCEO.email, role: mockCEO.role, organizationId: mockOrganization.id, permissions: [Permission.MANAGE_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Mock Prisma organization.update to return updated organization with new settings
      prismaMock.organization.update.mockResolvedValue({ ...mockOrganization, settings: { ...mockOrganization.settings, theme: 'dark' } });

      // Send PUT request to /api/organizations/:organizationId/settings with valid settings data
      const response = await request(app)
        .put(`/api/organizations/${mockOrganization.id}/settings`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ settings: { theme: 'dark' } });

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains organization with updated settings
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.settings.theme).toBe('dark');

      // Verify Prisma organization.update was called with correct settings data
      expect(prismaMock.organization.update).toHaveBeenCalledWith({
        where: { id: mockOrganization.id },
        data: { settings: { theme: 'dark' } }
      });
    });
  });

  describe('POST /api/organizations/:organizationId/users - should add user to organization', () => {
    it('POST /api/organizations/:organizationId/users - should add user to organization', async () => {
      // Create a valid access token for a CEO user
      const accessToken = createTestToken({ id: mockCEO.id, email: mockCEO.email, role: mockCEO.role, organizationId: mockOrganization.id, permissions: [Permission.MANAGE_USERS] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Mock Prisma user.findUnique to return mockUser (user to add)
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      // Mock Prisma user.update to return updated user with organization
      prismaMock.user.update.mockResolvedValue({ ...mockUser, organizationId: mockOrganization.id });

      // Send POST request to /api/organizations/:organizationId/users with user ID
      const response = await request(app)
        .post(`/api/organizations/${mockOrganization.id}/users`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId: mockUser.id });

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains success message
      expect(response.body.message).toBe('User added to organization successfully');

      // Verify Prisma user.update was called to associate user with organization
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { organizationId: mockOrganization.id }
      });
    });
  });

  describe('DELETE /api/organizations/:organizationId/users/:userId - should remove user from organization', () => {
    it('DELETE /api/organizations/:organizationId/users/:userId - should remove user from organization', async () => {
      // Create a valid access token for a CEO user
      const accessToken = createTestToken({ id: mockCEO.id, email: mockCEO.email, role: mockCEO.role, organizationId: mockOrganization.id, permissions: [Permission.MANAGE_USERS] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Mock Prisma user.findUnique to return mockUser with organization
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, organizationId: mockOrganization.id });

      // Mock Prisma user.update to return updated user without organization
      prismaMock.user.update.mockResolvedValue({ ...mockUser, organizationId: null });

      // Send DELETE request to /api/organizations/:organizationId/users/:userId
      const response = await request(app)
        .delete(`/api/organizations/${mockOrganization.id}/users/${mockUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains success message
      expect(response.body.message).toBe('User removed from organization successfully');

      // Verify Prisma user.update was called to remove organization from user
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { organizationId: null }
      });
    });
  });

  describe('GET /api/organizations/:organizationId/summary - should retrieve organization summary', () => {
    it('GET /api/organizations/:organizationId/summary - should retrieve organization summary', async () => {
      // Create a valid access token for a user with organization access
      const accessToken = createTestToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, organizationId: mockOrganization.id, permissions: [Permission.VIEW_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Mock Prisma user.count to return user count
      prismaMock.user.count.mockResolvedValue(10);

      // Mock Prisma team.count to return team count
      prismaMock.team.count.mockResolvedValue(5);

      // Send GET request to /api/organizations/:organizationId/summary
      const response = await request(app)
        .get(`/api/organizations/${mockOrganization.id}/summary`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains organization summary with user and team counts
      expect(response.body.data.id).toBe(mockOrganization.id);
      expect(response.body.data.name).toBe(mockOrganization.name);
      expect(response.body.data.userCount).toBe(10);
      expect(response.body.data.teamCount).toBe(5);

      // Verify Prisma organization.findUnique was called with correct ID
      expect(prismaMock.organization.findUnique).toHaveBeenCalledWith({ where: { id: mockOrganization.id } });
    });
  });

  describe('POST /api/organizations/:organizationId/announcements - should create organization announcement', () => {
    it('POST /api/organizations/:organizationId/announcements - should create organization announcement', async () => {
      // Create a valid access token for a CEO user
      const accessToken = createTestToken({ id: mockCEO.id, email: mockCEO.email, role: mockCEO.role, organizationId: mockOrganization.id, permissions: [Permission.MANAGE_ORGANIZATION] }, 'secret', { expiresIn: '1h' });

      // Mock Prisma organization.findUnique to return mockOrganization
      prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

      // Mock Prisma user.findMany to return organization users
      prismaMock.user.findMany.mockResolvedValue([mockUser, mockTeamMember]);

      // Mock notification service to return success
      // TODO: Mock notification service

      // Send POST request to /api/organizations/:organizationId/announcements with announcement data
      const response = await request(app)
        .post(`/api/organizations/${mockOrganization.id}/announcements`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'New Announcement', content: 'This is a new announcement' });

      // Assert response status is 200 OK
      expect(response.status).toBe(200);

      // Assert response contains success message
      expect(response.body.message).toBe('Announcement sent successfully');

      // Verify notification service was called for each organization user
      // TODO: Verify notification service was called for each organization user
    });
  });
});