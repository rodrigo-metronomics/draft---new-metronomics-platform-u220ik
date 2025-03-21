import { GoalService } from '../../../src/services/goal/goalService';
import { MilestoneService } from '../../../src/services/goal/milestoneService';
import { GoalRepository } from '../../../src/repositories/goalRepository';
import { MetricRepository } from '../../../src/repositories/metricRepository';
import { NotificationService } from '../../../src/services/notification/notificationService';
import {
  Goal,
  GoalType,
  GoalStatus,
  GoalWithMilestones,
  GoalWithMetrics,
  GoalWithMilestonesAndMetrics,
  CreateGoalDto,
  UpdateGoalDto,
} from '../../../src/types/goal.types';
import { NotFoundError, ValidationError } from '../../../src/utils/errors';
import {
  mockBHAG,
  mockThreeHAG,
  mockOneHAG,
  mockQuarterlyGoal,
  mockActiveGoal,
  mockAtRiskGoal,
  mockGoalWithMilestones,
  mockGoalWithMetrics,
  mockGoalWithMilestonesAndMetrics,
  mockGoals,
  generateMockGoal,
} from '../../fixtures/goals';
import { mockOrganization } from '../../fixtures/organizations';
import { mockMetric, mockMetrics } from '../../fixtures/metrics';

/**
 * Helper function to create mock services and repositories for testing
 */
const createMockServices = () => {
  // Create mock instances of repositories and services
  const goalRepositoryMock = {
    findByIdOrThrow: jest.fn(),
    findWithMilestonesOrThrow: jest.fn(),
    findWithMetricsOrThrow: jest.fn(),
    findWithMilestonesAndMetricsOrThrow: jest.fn(),
    findByType: jest.fn(),
    findByStatus: jest.fn(),
    findByOrganization: jest.fn(),
    findWithFilters: jest.fn(),
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    updateProgress: jest.fn(),
    linkMetric: jest.fn(),
    unlinkMetric: jest.fn(),
    updateMetrics: jest.fn(),
    delete: jest.fn(),
  } as unknown as GoalRepository;

  const metricRepositoryMock = {
    findByGoalId: jest.fn(),
    addGoalToMetric: jest.fn(),
    removeGoalFromMetric: jest.fn(),
  } as unknown as MetricRepository;

  const milestoneServiceMock = {
    calculateGoalProgress: jest.fn(),
    getMilestonesByGoal: jest.fn(),
  } as unknown as MilestoneService;

  const notificationServiceMock = {
    createNotification: jest.fn(),
  } as unknown as NotificationService;

  // Set up common mock implementations
  goalRepositoryMock.findByIdOrThrow.mockImplementation(async (id: string) => {
    const goal = mockGoals.find((g) => g.id === id);
    if (!goal) {
      throw new NotFoundError('Goal', id);
    }
    return goal;
  });

  // Create a GoalService instance with the mock repositories
  const goalService = new GoalService(
    goalRepositoryMock,
    metricRepositoryMock,
    milestoneServiceMock,
    notificationServiceMock
  );

  return {
    goalService,
    goalRepositoryMock,
    metricRepositoryMock,
    milestoneServiceMock,
    notificationServiceMock,
  };
};

describe('GoalService', () => {
  describe('getGoal', () => {
    it('Should retrieve a goal by ID', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const mockGoal = mockOneHAG;
      goalRepositoryMock.findByIdOrThrow.mockResolvedValue(mockGoal);

      // Act
      const goal = await goalService.getGoal(mockGoal.id);

      // Assert
      expect(goalRepositoryMock.findByIdOrThrow).toHaveBeenCalledWith(mockGoal.id);
      expect(goal).toEqual(mockGoal);
    });

    it("Should throw NotFoundError when goal doesn't exist", async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      goalRepositoryMock.findByIdOrThrow.mockImplementation(() => {
        throw new NotFoundError('Goal', 'nonexistent-id');
      });

      // Act & Assert
      await expect(goalService.getGoal('nonexistent-id')).rejects.toThrow(NotFoundError);
      expect(goalRepositoryMock.findByIdOrThrow).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('getGoalWithMilestones', () => {
    it('Should retrieve a goal with its milestones', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      goalRepositoryMock.findWithMilestonesOrThrow.mockResolvedValue(mockGoalWithMilestones);

      // Act
      const goal = await goalService.getGoalWithMilestones(mockGoalWithMilestones.id);

      // Assert
      expect(goalRepositoryMock.findWithMilestonesOrThrow).toHaveBeenCalledWith(mockGoalWithMilestones.id);
      expect(goal).toEqual(mockGoalWithMilestones);
    });
  });

  describe('getGoalWithMetrics', () => {
    it('Should retrieve a goal with its metrics', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      goalRepositoryMock.findWithMetricsOrThrow.mockResolvedValue(mockGoalWithMetrics);

      // Act
      const goal = await goalService.getGoalWithMetrics(mockGoalWithMetrics.id);

      // Assert
      expect(goalRepositoryMock.findWithMetricsOrThrow).toHaveBeenCalledWith(mockGoalWithMetrics.id);
      expect(goal).toEqual(mockGoalWithMetrics);
    });
  });

  describe('getGoalWithMilestonesAndMetrics', () => {
    it('Should retrieve a goal with both milestones and metrics', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      goalRepositoryMock.findWithMilestonesAndMetricsOrThrow.mockResolvedValue(mockGoalWithMilestonesAndMetrics);

      // Act
      const goal = await goalService.getGoalWithMilestonesAndMetrics(mockGoalWithMilestonesAndMetrics.id);

      // Assert
      expect(goalRepositoryMock.findWithMilestonesAndMetricsOrThrow).toHaveBeenCalledWith(mockGoalWithMilestonesAndMetrics.id);
      expect(goal).toEqual(mockGoalWithMilestonesAndMetrics);
    });
  });

  describe('getGoalsByType', () => {
    it('Should retrieve goals filtered by type', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalType = GoalType.ONE_HAG;
      const organizationId = mockOrganization.id;
      goalRepositoryMock.findByType.mockResolvedValue([mockOneHAG]);

      // Act
      const goals = await goalService.getGoalsByType(goalType, organizationId);

      // Assert
      expect(goalRepositoryMock.findByType).toHaveBeenCalledWith(goalType, organizationId, {});
      expect(goals).toEqual([mockOneHAG]);
    });
  });

  describe('getGoalsByStatus', () => {
    it('Should retrieve goals filtered by status', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalStatus = GoalStatus.ACTIVE;
      const organizationId = mockOrganization.id;
      goalRepositoryMock.findByStatus.mockResolvedValue([mockActiveGoal]);

      // Act
      const goals = await goalService.getGoalsByStatus(goalStatus, organizationId);

      // Assert
      expect(goalRepositoryMock.findByStatus).toHaveBeenCalledWith(goalStatus, organizationId, {});
      expect(goals).toEqual([mockActiveGoal]);
    });
  });

  describe('getOrganizationGoals', () => {
    it('Should retrieve all goals for an organization', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const organizationId = mockOrganization.id;
      goalRepositoryMock.findByOrganization.mockResolvedValue(mockGoals);

      // Act
      const goals = await goalService.getOrganizationGoals(organizationId);

      // Assert
      expect(goalRepositoryMock.findByOrganization).toHaveBeenCalledWith(organizationId, {});
      expect(goals).toEqual(mockGoals);
    });
  });

  describe('findGoals', () => {
    it('Should find goals matching specified filters', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const filters = { type: GoalType.ONE_HAG, status: GoalStatus.ACTIVE };
      const params = { skip: 0, take: 10 };
      const filteredGoals = [mockOneHAG, mockActiveGoal];
      goalRepositoryMock.findWithFilters.mockResolvedValue({ data: filteredGoals, total: filteredGoals.length });

      // Act
      const result = await goalService.findGoals(filters, params);

      // Assert
      expect(goalRepositoryMock.findWithFilters).toHaveBeenCalledWith(filters, params);
      expect(result.data).toEqual(filteredGoals);
      expect(result.total).toEqual(filteredGoals.length);
    });
  });

  describe('createGoal', () => {
    it('Should create a new goal', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const createGoalDto: CreateGoalDto = {
        type: GoalType.ONE_HAG,
        title: 'New Goal',
        description: 'Description for new goal',
        startDate: new Date(),
        endDate: new Date(),
        organizationId: mockOrganization.id,
      };
      goalRepositoryMock.createGoal.mockResolvedValue(mockOneHAG);

      // Act
      const goal = await goalService.createGoal(createGoalDto);

      // Assert
      expect(goalRepositoryMock.createGoal).toHaveBeenCalledWith(createGoalDto);
      expect(goal).toEqual(mockOneHAG);
    });

    it('Should throw ValidationError when data is invalid', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const invalidGoalDto = {
        type: GoalType.ONE_HAG,
        description: 'Description for new goal',
        startDate: new Date(),
        endDate: new Date(),
        organizationId: mockOrganization.id,
      } as unknown as CreateGoalDto;

      // Act & Assert
      await expect(goalService.createGoal(invalidGoalDto)).rejects.toThrow(ValidationError);
      expect(goalRepositoryMock.createGoal).not.toHaveBeenCalled();
    });
  });

  describe('updateGoal', () => {
    it('Should update an existing goal', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalId = mockOneHAG.id;
      const updateGoalDto: UpdateGoalDto = {
        title: 'Updated Goal Title',
        description: 'Updated description',
      };
      goalRepositoryMock.updateGoal.mockResolvedValue({ ...mockOneHAG, ...updateGoalDto });

      // Act
      const goal = await goalService.updateGoal(goalId, updateGoalDto);

      // Assert
      expect(goalRepositoryMock.updateGoal).toHaveBeenCalledWith(goalId, updateGoalDto);
      expect(goal).toEqual({ ...mockOneHAG, ...updateGoalDto });
    });
  });

  describe('updateGoalProgress', () => {
    it("Should update a goal's progress percentage", async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalId = mockOneHAG.id;
      const progress = 80;
      goalRepositoryMock.updateProgress.mockResolvedValue({ ...mockOneHAG, progress });

      // Act
      const goal = await goalService.updateGoalProgress(goalId, progress);

      // Assert
      expect(goalRepositoryMock.updateProgress).toHaveBeenCalledWith(goalId, progress);
      expect(goal).toEqual({ ...mockOneHAG, progress });
    });

    it('Should update goal status to COMPLETED when progress reaches 100%', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalId = mockActiveGoal.id;
      const progress = 100;
      goalRepositoryMock.updateProgress.mockResolvedValue({ ...mockActiveGoal, progress, status: GoalStatus.COMPLETED });

      // Act
      const goal = await goalService.updateGoalProgress(goalId, progress);

      // Assert
      expect(goalRepositoryMock.updateProgress).toHaveBeenCalledWith(goalId, progress);
    });
  });

  describe('recalculateGoalProgress', () => {
    it("Should recalculate a goal's progress based on milestone completion", async () => {
      // Arrange
      const { goalService, goalRepositoryMock, milestoneServiceMock } = createMockServices();
      const goalId = mockOneHAG.id;
      const calculatedProgress = 75;
      milestoneServiceMock.calculateGoalProgress.mockResolvedValue(calculatedProgress);
      goalRepositoryMock.updateProgress.mockResolvedValue({ ...mockOneHAG, progress: calculatedProgress });

      // Act
      const goal = await goalService.recalculateGoalProgress(goalId);

      // Assert
      expect(milestoneServiceMock.calculateGoalProgress).toHaveBeenCalledWith(goalId);
      expect(goalRepositoryMock.updateProgress).toHaveBeenCalledWith(goalId, calculatedProgress);
      expect(goal).toEqual({ ...mockOneHAG, progress: calculatedProgress });
    });
  });

  describe('deleteGoal', () => {
    it('Should delete a goal by ID', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalId = mockOneHAG.id;
      goalRepositoryMock.delete.mockResolvedValue(mockOneHAG);

      // Act
      const goal = await goalService.deleteGoal(goalId);

      // Assert
      expect(goalRepositoryMock.delete).toHaveBeenCalledWith(goalId);
      expect(goal).toEqual(mockOneHAG);
    });
  });

  describe('linkMetricToGoal', () => {
    it('Should link a metric to a goal', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalId = mockOneHAG.id;
      const metricId = mockMetric.id;
      goalRepositoryMock.linkMetric.mockResolvedValue(mockOneHAG);

      // Act
      const goal = await goalService.linkMetricToGoal(goalId, metricId);

      // Assert
      expect(goalRepositoryMock.linkMetric).toHaveBeenCalledWith(goalId, metricId);
      expect(goal).toEqual(mockOneHAG);
    });
  });

  describe('unlinkMetricFromGoal', () => {
    it('Should unlink a metric from a goal', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalId = mockOneHAG.id;
      const metricId = mockMetric.id;
      goalRepositoryMock.unlinkMetric.mockResolvedValue(mockOneHAG);

      // Act
      const goal = await goalService.unlinkMetricFromGoal(goalId, metricId);

      // Assert
      expect(goalRepositoryMock.unlinkMetric).toHaveBeenCalledWith(goalId, metricId);
      expect(goal).toEqual(mockOneHAG);
    });
  });

  describe('updateGoalMetrics', () => {
    it('Should update the metrics linked to a goal', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      const goalId = mockOneHAG.id;
      const metricIds = [mockMetric.id];
      goalRepositoryMock.updateMetrics.mockResolvedValue(mockOneHAG);

      // Act
      const goal = await goalService.updateGoalMetrics(goalId, metricIds);

      // Assert
      expect(goalRepositoryMock.updateMetrics).toHaveBeenCalledWith(goalId, metricIds);
      expect(goal).toEqual(mockOneHAG);
    });
  });

  describe('getGoalMetrics', () => {
    it('Should retrieve all metrics linked to a goal', async () => {
      // Arrange
      const { goalService, metricRepositoryMock } = createMockServices();
      const goalId = mockOneHAG.id;
      metricRepositoryMock.findByGoalId.mockResolvedValue(mockMetrics);

      // Act
      const metrics = await goalService.getGoalMetrics(goalId);

      // Assert
      expect(metricRepositoryMock.findByGoalId).toHaveBeenCalledWith(goalId);
      expect(metrics).toEqual(mockMetrics);
    });
  });

  describe('checkGoalStatuses', () => {
    it('Should check and update goal statuses based on progress and dates', async () => {
      // Arrange
      const { goalService, goalRepositoryMock } = createMockServices();
      goalRepositoryMock.findByStatus.mockResolvedValue([mockActiveGoal, mockAtRiskGoal]);
      goalRepositoryMock.updateGoal.mockResolvedValue(mockActiveGoal);

      // Act
      const updatedGoals = await goalService.checkGoalStatuses();

      // Assert
      expect(goalRepositoryMock.findByStatus).toHaveBeenCalledWith(GoalStatus.ACTIVE, mockActiveGoal.organizationId);
      expect(goalRepositoryMock.findByStatus).toHaveBeenCalledWith(GoalStatus.AT_RISK, mockAtRiskGoal.organizationId);
      expect(goalRepositoryMock.updateGoal).toHaveBeenCalledTimes(0);
    });
  });
});