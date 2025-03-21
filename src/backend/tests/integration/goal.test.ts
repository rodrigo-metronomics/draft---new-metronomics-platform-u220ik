import request from 'supertest'; // version ^6.3.3
import { app } from '../../src/app';
import { prismaMock } from '../mocks/prismaMock';
import {
  mockBHAG,
  mockThreeHAG,
  mockOneHAG,
  mockQuarterlyGoal,
  mockGoalWithMilestones,
  mockGoalWithMetrics,
  mockGoalWithMilestonesAndMetrics,
  mockMilestone,
  mockGoals,
  mockMilestones,
  generateMockGoal,
  generateMockMilestone,
} from '../fixtures/goals';
import { mockOrganization } from '../fixtures/organizations';
import { mockMetrics } from '../fixtures/metrics';
import { GoalType, GoalStatus, MilestoneStatus } from '../../src/types/goal.types';

describe('Goal API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/goals', () => {
    it('should retrieve all goals with pagination', async () => {
      prismaMock.goal.findMany.mockResolvedValue(mockGoals);
      prismaMock.goal.count.mockResolvedValue(mockGoals.length);

      const response = await request(app).get('/api/v1/goals');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockGoals);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.links).toBeDefined();
    });

    it('should apply filters correctly', async () => {
      const filteredGoals = mockGoals.filter(goal => goal.type === GoalType.ONE_HAG);
      prismaMock.goal.findMany.mockResolvedValue(filteredGoals);
      prismaMock.goal.count.mockResolvedValue(filteredGoals.length);

      const response = await request(app).get('/api/v1/goals?type=ONE_HAG');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(filteredGoals);
      expect(prismaMock.goal.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          type: GoalType.ONE_HAG
        })
      }));
    });
  });

  describe('GET /api/v1/goals/:id', () => {
    it('should retrieve a specific goal by ID', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);

      const response = await request(app).get(`/api/v1/goals/${mockOneHAG.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockOneHAG);
      expect(prismaMock.goal.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockOneHAG.id }
      }));
    });

    it('should return 404 for non-existent goal', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/v1/goals/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Goal with id \'non-existent-id\' was not found.');
    });
  });

  describe('GET /api/v1/goals/:id?include=milestones', () => {
    it('should retrieve goal with milestones', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockGoalWithMilestones);

      const response = await request(app).get(`/api/v1/goals/${mockGoalWithMilestones.id}?include=milestones`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockGoalWithMilestones);
      expect(prismaMock.goal.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockGoalWithMilestones.id },
        include: { milestones: true }
      }));
    });
  });

  describe('GET /api/v1/goals/:id?include=metrics', () => {
    it('should retrieve goal with metrics', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockGoalWithMetrics);

      const response = await request(app).get(`/api/v1/goals/${mockGoalWithMetrics.id}?include=metrics`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockGoalWithMetrics);
      expect(prismaMock.goal.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockGoalWithMetrics.id },
        include: { metrics: true }
      }));
    });
  });

  describe('GET /api/v1/goals/:id?include=all', () => {
    it('should retrieve goal with both milestones and metrics', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockGoalWithMilestonesAndMetrics);

      const response = await request(app).get(`/api/v1/goals/${mockGoalWithMilestonesAndMetrics.id}?include=all`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockGoalWithMilestonesAndMetrics);
      expect(prismaMock.goal.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockGoalWithMilestonesAndMetrics.id },
        include: { milestones: true, metrics: true }
      }));
    });
  });

  describe('GET /api/v1/goals/type/:type', () => {
    it('should retrieve goals by type', async () => {
      prismaMock.goal.findMany.mockResolvedValue([mockOneHAG]);

      const response = await request(app).get(`/api/v1/goals/type/ONE_HAG?organizationId=${mockOrganization.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([mockOneHAG]);
      expect(prismaMock.goal.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { type: GoalType.ONE_HAG, organizationId: mockOrganization.id }
      }));
    });
  });

  describe('GET /api/v1/goals/status/:status', () => {
    it('should retrieve goals by status', async () => {
      prismaMock.goal.findMany.mockResolvedValue([mockActiveGoal]);

      const response = await request(app).get(`/api/v1/goals/status/ACTIVE?organizationId=${mockOrganization.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([mockActiveGoal]);
      expect(prismaMock.goal.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: GoalStatus.ACTIVE, organizationId: mockOrganization.id }
      }));
    });
  });

  describe('GET /api/v1/goals/organization/:organizationId', () => {
    it('should retrieve goals by organization', async () => {
      prismaMock.goal.findMany.mockResolvedValue([mockOneHAG]);

      const response = await request(app).get(`/api/v1/goals/organization/${mockOrganization.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([mockOneHAG]);
      expect(prismaMock.goal.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { organizationId: mockOrganization.id }
      }));
    });
  });

  describe('POST /api/v1/goals', () => {
    it('should create a new goal successfully', async () => {
      const newGoal = generateMockGoal({ title: 'New Goal' });
      prismaMock.goal.create.mockResolvedValue(newGoal);

      const response = await request(app)
        .post('/api/v1/goals')
        .send({
          type: newGoal.type,
          title: newGoal.title,
          description: newGoal.description,
          startDate: newGoal.startDate,
          endDate: newGoal.endDate,
          organizationId: newGoal.organizationId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(newGoal);
      expect(prismaMock.goal.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          type: newGoal.type,
          title: newGoal.title,
          description: newGoal.description,
          startDate: newGoal.startDate,
          endDate: newGoal.endDate,
          organizationId: newGoal.organizationId,
        })
      }));
    });

    it('should return 400 for invalid goal data', async () => {
      const response = await request(app)
        .post('/api/v1/goals')
        .send({ title: 'Invalid' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle metric linking during creation', async () => {
      const newGoal = generateMockGoal({ title: 'New Goal' });
      prismaMock.goal.create.mockResolvedValue(newGoal);
      prismaMock.metricGoal.create.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/goals')
        .send({
          type: newGoal.type,
          title: newGoal.title,
          description: newGoal.description,
          startDate: newGoal.startDate,
          endDate: newGoal.endDate,
          organizationId: newGoal.organizationId,
          metricIds: [mockMetrics[0].id, mockMetrics[1].id]
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(newGoal);
      expect(prismaMock.metricGoal.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('PUT /api/v1/goals/:id', () => {
    it('should update a goal successfully', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);
      prismaMock.goal.update.mockResolvedValue({ ...mockOneHAG, title: 'Updated Title' });

      const response = await request(app)
        .put(`/api/v1/goals/${mockOneHAG.id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(prismaMock.goal.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockOneHAG.id },
        data: expect.objectContaining({ title: 'Updated Title' })
      }));
    });

    it('should return 404 for non-existent goal', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/goals/non-existent-id')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Goal with id \'non-existent-id\' was not found.');
    });

    it('should return 400 for invalid update data', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);

      const response = await request(app)
        .put(`/api/v1/goals/${mockOneHAG.id}`)
        .send({ progress: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('PATCH /api/v1/goals/:id/progress', () => {
    it('should update goal progress', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);
      prismaMock.goal.update.mockResolvedValue({ ...mockOneHAG, progress: 75 });

      const response = await request(app)
        .patch(`/api/v1/goals/${mockOneHAG.id}/progress`)
        .send({ progress: 75 });

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(75);
      expect(prismaMock.goal.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockOneHAG.id },
        data: { progress: 75 }
      }));
    });
  });

  describe('PATCH /api/v1/goals/:id/recalculate', () => {
    it('should recalculate goal progress based on milestones', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockGoalWithMilestones);
      prismaMock.milestone.findMany.mockResolvedValue(mockGoalWithMilestones.milestones);
      prismaMock.goal.update.mockResolvedValue({ ...mockGoalWithMilestones, progress: 50 });

      const response = await request(app).patch(`/api/v1/goals/${mockGoalWithMilestones.id}/recalculate`);

      expect(response.status).toBe(200);
      expect(response.body.data.progress).toBe(50);
    });
  });

  describe('DELETE /api/v1/goals/:id', () => {
    it('should delete a goal successfully', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);
      prismaMock.goal.delete.mockResolvedValue(mockOneHAG);

      const response = await request(app).delete(`/api/v1/goals/${mockOneHAG.id}`);

      expect(response.status).toBe(204);
      expect(prismaMock.goal.delete).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockOneHAG.id }
      }));
    });

    it('should return 404 for non-existent goal', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/v1/goals/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Goal with id \'non-existent-id\' was not found.');
    });
  });

  describe('POST /api/v1/goals/:id/metrics/:metricId', () => {
    it('should link a metric to a goal', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);
      prismaMock.metricGoal.create.mockResolvedValue(null);
      prismaMock.goal.findUnique.mockResolvedValue({ ...mockOneHAG, metrics: [{ id: 'metric1' }] });

      const response = await request(app).post(`/api/v1/goals/${mockOneHAG.id}/metrics/metric1`);

      expect(response.status).toBe(200);
      expect(response.body.data.metrics).toEqual([{ id: 'metric1' }]);
      expect(prismaMock.metricGoal.create).toHaveBeenCalledWith(expect.objectContaining({
        data: { goalId: mockOneHAG.id, metricId: 'metric1' }
      }));
    });
  });

  describe('DELETE /api/v1/goals/:id/metrics/:metricId', () => {
    it('should unlink a metric from a goal', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);
      prismaMock.metricGoal.delete.mockResolvedValue(null);
      prismaMock.goal.findUnique.mockResolvedValue({ ...mockOneHAG, metrics: [] });

      const response = await request(app).delete(`/api/v1/goals/${mockOneHAG.id}/metrics/metric1`);

      expect(response.status).toBe(200);
      expect(response.body.data.metrics).toEqual([]);
      expect(prismaMock.metricGoal.delete).toHaveBeenCalledWith(expect.objectContaining({
        where: { goalId: mockOneHAG.id, metricId: 'metric1' }
      }));
    });
  });

  describe('PUT /api/v1/goals/:id/metrics', () => {
    it('should update all metrics linked to a goal', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);
      prismaMock.metricGoal.deleteMany.mockResolvedValue(null);
      prismaMock.metricGoal.create.mockResolvedValue(null);
      prismaMock.goal.findUnique.mockResolvedValue({ ...mockOneHAG, metrics: [{ id: 'metric1' }, { id: 'metric2' }] });

      const response = await request(app)
        .put(`/api/v1/goals/${mockOneHAG.id}/metrics`)
        .send({ metricIds: ['metric1', 'metric2'] });

      expect(response.status).toBe(200);
      expect(response.body.data.metrics).toEqual([{ id: 'metric1' }, { id: 'metric2' }]);
      expect(prismaMock.metricGoal.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { goalId: mockOneHAG.id }
      }));
      expect(prismaMock.metricGoal.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Milestone API Integration Tests', () => {
    it('GET /api/v1/milestones/:id - should retrieve a specific milestone', async () => {
      prismaMock.milestone.findUnique.mockResolvedValue(mockMilestone);

      const response = await request(app).get(`/api/v1/milestones/${mockMilestone.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockMilestone);
      expect(prismaMock.milestone.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockMilestone.id }
      }));
    });

    it('GET /api/v1/milestones/goal/:goalId - should retrieve milestones for a goal', async () => {
      prismaMock.milestone.findMany.mockResolvedValue(mockMilestones);

      const response = await request(app).get(`/api/v1/milestones/goal/${mockOneHAG.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockMilestones);
      expect(prismaMock.milestone.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { goalId: mockOneHAG.id }
      }));
    });

    it('POST /api/v1/milestones - should create a new milestone', async () => {
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);
      prismaMock.milestone.create.mockResolvedValue(mockMilestone);

      const response = await request(app)
        .post('/api/v1/milestones')
        .send({
          title: mockMilestone.title,
          description: mockMilestone.description,
          dueDate: mockMilestone.dueDate,
          goalId: mockOneHAG.id
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockMilestone);
      expect(prismaMock.milestone.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          title: mockMilestone.title,
          description: mockMilestone.description,
          dueDate: mockMilestone.dueDate,
          goalId: mockOneHAG.id
        })
      }));
    });

    it('POST /api/v1/milestones - should return 400 for invalid milestone data', async () => {
      const response = await request(app)
        .post('/api/v1/milestones')
        .send({ title: 'Invalid' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });

    it("POST /api/v1/milestones - should return 404 if goal doesn't exist", async () => {
      prismaMock.goal.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/milestones')
        .send({
          title: mockMilestone.title,
          description: mockMilestone.description,
          dueDate: mockMilestone.dueDate,
          goalId: 'non-existent-goal-id'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Goal with id \'non-existent-goal-id\' was not found.');
    });

    it('PUT /api/v1/milestones/:id - should update a milestone', async () => {
      prismaMock.milestone.findUnique.mockResolvedValue(mockMilestone);
      prismaMock.milestone.update.mockResolvedValue({ ...mockMilestone, title: 'Updated Title' });

      const response = await request(app)
        .put(`/api/v1/milestones/${mockMilestone.id}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(prismaMock.milestone.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockMilestone.id },
        data: expect.objectContaining({ title: 'Updated Title' })
      }));
    });

    it('PUT /api/v1/milestones/:id - should return 404 for non-existent milestone', async () => {
      prismaMock.milestone.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/milestones/non-existent-id')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Milestone with id \'non-existent-id\' was not found.');
    });

    it('PATCH /api/v1/milestones/:id/status - should update milestone status', async () => {
      prismaMock.milestone.findUnique.mockResolvedValue(mockMilestone);
      prismaMock.milestone.update.mockResolvedValue({ ...mockMilestone, status: MilestoneStatus.COMPLETED });
      prismaMock.goal.findUnique.mockResolvedValue(mockOneHAG);
      prismaMock.goal.update.mockResolvedValue(mockOneHAG);

      const response = await request(app)
        .patch(`/api/v1/milestones/${mockMilestone.id}/status`)
        .send({ status: MilestoneStatus.COMPLETED });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(MilestoneStatus.COMPLETED);
      expect(prismaMock.milestone.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockMilestone.id },
        data: { status: MilestoneStatus.COMPLETED }
      }));
    });

    it('DELETE /api/v1/milestones/:id - should delete a milestone', async () => {
      prismaMock.milestone.findUnique.mockResolvedValue(mockMilestone);
      prismaMock.milestone.delete.mockResolvedValue(mockMilestone);

      const response = await request(app).delete(`/api/v1/milestones/${mockMilestone.id}`);

      expect(response.status).toBe(204);
      expect(prismaMock.milestone.delete).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockMilestone.id }
      }));
    });

    it('DELETE /api/v1/milestones/:id - should return 404 for non-existent milestone', async () => {
      prismaMock.milestone.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/api/v1/milestones/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Milestone with id \'non-existent-id\' was not found.');
    });
  });
});