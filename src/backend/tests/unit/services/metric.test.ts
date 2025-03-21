import { MetricService } from '../../../src/services/metric/metricService';
import { MetricValueService } from '../../../src/services/metric/metricValueService';
import { MetricCalculationService } from '../../../src/services/metric/metricCalculationService';
import { MetricRepository } from '../../../src/repositories/metricRepository';
import { MetricValueRepository } from '../../../src/repositories/metricValueRepository';
import { MetricThresholdRepository } from '../../../src/repositories/metricThresholdRepository';
import { FirestoreService } from '../../../src/services/realtime/firestoreService';
import { NotificationService } from '../../../src/services/notification/notificationService';
import { 
  MetricType, 
  ComparisonType, 
  CalculationMethod, 
  ThresholdType,
  TrendDirection,
  CreateMetricDto,
  UpdateMetricDto,
  CreateMetricValueDto
} from '../../../src/types/metric.types';
import { ValidationError, NotFoundError } from '../../../src/utils/errors';
import { metrics } from '../../fixtures/metrics';

// Mock the MetricRepository
const createMockMetricRepository = () => {
  const mockMetricRepository: jest.Mocked<MetricRepository> = {
    findById: jest.fn(),
    findByIdOrThrow: jest.fn(),
    findMany: jest.fn(),
    findByOrganizationId: jest.fn(),
    findByTeamId: jest.fn(),
    findByGoalId: jest.fn(),
    findWithValues: jest.fn(),
    findWithThresholds: jest.fn(),
    findWithValuesAndThresholds: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    exists: jest.fn(),
    transaction: jest.fn(),
    addGoalToMetric: jest.fn(),
    removeGoalFromMetric: jest.fn(),
    buildInclude: jest.fn(),
    buildWhere: jest.fn(),
    buildOrderBy: jest.fn(),
    buildPagination: jest.fn(),
    validateId: jest.fn(),
  };
  return mockMetricRepository;
};

// Mock the MetricValueRepository
const createMockMetricValueRepository = () => {
  const mockMetricValueRepository: jest.Mocked<MetricValueRepository> = {
    findById: jest.fn(),
    findByIdOrThrow: jest.fn(),
    findMany: jest.fn(),
    findByMetricId: jest.fn(),
    findByMetricIdAndDateRange: jest.fn(),
    findLatestByMetricId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    exists: jest.fn(),
    transaction: jest.fn(),
    createForMetric: jest.fn(),
    getAggregatedValues: jest.fn(),
    getTimeSeriesData: jest.fn(),
    buildInclude: jest.fn(),
    buildWhere: jest.fn(),
    buildOrderBy: jest.fn(),
    buildPagination: jest.fn(),
    validateId: jest.fn(),
  };
  return mockMetricValueRepository;
};

// Mock the MetricThresholdRepository
const createMockMetricThresholdRepository = () => {
  const mockMetricThresholdRepository: jest.Mocked<MetricThresholdRepository> = {
    findById: jest.fn(),
    findByIdOrThrow: jest.fn(),
    findMany: jest.fn(),
    findByMetricId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    exists: jest.fn(),
    transaction: jest.fn(),
    createForMetric: jest.fn(),
    updateForMetric: jest.fn(),
    deleteForMetric: jest.fn(),
    bulkCreateForMetric: jest.fn(),
    deleteAllForMetric: jest.fn(),
    checkThresholdCrossing: jest.fn(),
    buildInclude: jest.fn(),
    buildWhere: jest.fn(),
    buildOrderBy: jest.fn(),
    buildPagination: jest.fn(),
    validateId: jest.fn(),
  };
  return mockMetricThresholdRepository;
};

// Mock the FirestoreService
const createMockFirestoreService = () => {
  const mockFirestoreService: jest.Mocked<FirestoreService> = {
    createDocument: jest.fn(),
    getDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    queryDocuments: jest.fn(),
    batchWrite: jest.fn(),
    runTransaction: jest.fn(),
    listenToDocument: jest.fn(),
    listenToQuery: jest.fn(),
    createMeetingDocument: jest.fn(),
    updateMeetingStage: jest.fn(),
    updateMeetingStatus: jest.fn(),
    updateParticipantPresence: jest.fn(),
    closeMeetingDocument: jest.fn(),
  };
  return mockFirestoreService;
};

// Mock the NotificationService
const createMockNotificationService = () => {
  const mockNotificationService: jest.Mocked<NotificationService> = {
    createNotification: jest.fn(),
    getNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    processDeliveries: jest.fn(),
    sendHighPriorityNotification: jest.fn(),
    sendDigestEmails: jest.fn(),
    getUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
    getDefaultChannelsForNotification: jest.fn(),
    getDefaultPreferences: jest.fn(),
  };
  return mockNotificationService;
};

describe('MetricService', () => {
  let metricService: MetricService;
  let mockMetricRepository: jest.Mocked<MetricRepository>;
  let mockMetricThresholdRepository: jest.Mocked<MetricThresholdRepository>;
  let mockMetricValueService: jest.Mocked<MetricValueService>;
  let mockMetricCalculationService: jest.Mocked<MetricCalculationService>;
  let mockFirestoreService: jest.Mocked<FirestoreService>;

  beforeEach(() => {
    mockMetricRepository = createMockMetricRepository();
    mockMetricThresholdRepository = createMockMetricThresholdRepository();
    mockMetricValueService = {
      createMetricValue: jest.fn(),
      getMetricValues: jest.fn(),
      getLatestMetricValue: jest.fn(),
      getMetricTrend: jest.fn(),
      getTimeSeriesData: jest.fn(),
      checkThresholdCrossings: jest.fn(),
      sendThresholdAlerts: jest.fn(),
    } as any;
    mockMetricCalculationService = {
      calculateDerivedMetric: jest.fn(),
      evaluateFormula: jest.fn(),
      getComponentMetricValues: jest.fn(),
      enrichMetricsWithCalculatedValues: jest.fn(),
      prepareDashboardData: jest.fn(),
      calculateForecast: jest.fn(),
      calculateTrendDirection: jest.fn(),
      calculateChangePercentage: jest.fn(),
    } as any;
    mockFirestoreService = createMockFirestoreService();

    metricService = new MetricService(
      mockMetricRepository,
      mockMetricThresholdRepository,
      mockMetricValueService,
      mockMetricCalculationService,
      mockFirestoreService
    );
  });

  it('createMetric', async () => {
    const metricData: CreateMetricDto = {
      name: 'Test Metric',
      description: 'A test metric',
      type: MetricType.NUMBER,
      unit: 'units',
      comparisonType: ComparisonType.YEAR_TO_DATE,
      calculationMethod: CalculationMethod.MANUAL,
      formula: null,
      organizationId: 'test-org',
      teamId: null,
      thresholds: [{ type: ThresholdType.TARGET, value: 100, color: '#00FF00' }],
      goalIds: ['goal-1', 'goal-2'],
    };
    const createdMetric = { id: 'metric-1', ...metricData } as any;
    mockMetricRepository.create.mockResolvedValue(createdMetric);
    mockMetricRepository.findByIdOrThrow.mockResolvedValue(createdMetric);

    const metric = await metricService.createMetric(metricData);

    expect(mockMetricRepository.create).toHaveBeenCalledWith(metricData);
    expect(mockMetricThresholdRepository.bulkCreateForMetric).toHaveBeenCalledWith(
      'metric-1',
      metricData.thresholds
    );
    expect(mockMetricRepository.addGoalToMetric).toHaveBeenCalledTimes(2);
    expect(mockMetricRepository.addGoalToMetric).toHaveBeenCalledWith('metric-1', 'goal-1');
    expect(mockMetricRepository.addGoalToMetric).toHaveBeenCalledWith('metric-1', 'goal-2');
    expect(metric).toEqual(createdMetric);
  });

  it('createMetric validation', async () => {
    const metricData: CreateMetricDto = {
      name: '',
      description: '',
      type: MetricType.NUMBER,
      unit: 'units',
      comparisonType: ComparisonType.YEAR_TO_DATE,
      calculationMethod: CalculationMethod.MANUAL,
      formula: null,
      organizationId: 'test-org',
      teamId: null,
      thresholds: [{ type: ThresholdType.TARGET, value: 100, color: '#00FF00' }],
      goalIds: ['goal-1', 'goal-2'],
    };

    await expect(metricService.createMetric(metricData)).rejects.toThrow(ValidationError);
  });

  it('getMetricById', async () => {
    const metricId = 'metric-1';
    const mockMetric = { id: metricId, name: 'Test Metric' } as any;
    mockMetricRepository.findById.mockResolvedValue(mockMetric);

    const metric = await metricService.getMetricById(metricId);

    expect(mockMetricRepository.findById).toHaveBeenCalledWith(metricId, {});
    expect(metric).toEqual(mockMetric);
  });

  it('getMetricsByOrganization', async () => {
    const organizationId = 'org-1';
    const mockMetrics = [{ id: 'metric-1', name: 'Test Metric' }] as any[];
    mockMetricRepository.findByOrganizationId.mockResolvedValue(mockMetrics);

    const metrics = await metricService.getMetricsByOrganization(organizationId);

    expect(mockMetricRepository.findByOrganizationId).toHaveBeenCalledWith(organizationId, {});
    expect(metrics).toEqual(mockMetrics);
  });

  it('getMetricsByTeam', async () => {
    const teamId = 'team-1';
    const mockMetrics = [{ id: 'metric-1', name: 'Test Metric' }] as any[];
    mockMetricRepository.findByTeamId.mockResolvedValue(mockMetrics);

    const metrics = await metricService.getMetricsByTeam(teamId);

    expect(mockMetricRepository.findByTeamId).toHaveBeenCalledWith(teamId, {});
    expect(metrics).toEqual(mockMetrics);
  });

  it('getMetricsByGoal', async () => {
    const goalId = 'goal-1';
    const mockMetrics = [{ id: 'metric-1', name: 'Test Metric' }] as any[];
    mockMetricRepository.findByGoalId.mockResolvedValue(mockMetrics);

    const metrics = await metricService.getMetricsByGoal(goalId);

    expect(mockMetricRepository.findByGoalId).toHaveBeenCalledWith(goalId, {});
    expect(metrics).toEqual(mockMetrics);
  });

  it('getMetricsWithFilters', async () => {
    const filters = { organizationId: 'org-1' };
    const pagination = { page: 1, limit: 10 };
    const mockMetrics = [{ id: 'metric-1', name: 'Test Metric' }] as any[];
    mockMetricRepository.findWithValuesAndThresholds.mockResolvedValue({ data: mockMetrics, total: 1 });

    const result = await metricService.getMetricsWithFilters(filters, pagination);

    expect(mockMetricRepository.findWithValuesAndThresholds).toHaveBeenCalledWith(filters, pagination, {});
    expect(result).toEqual({ data: mockMetrics, total: 1 });
  });

  it('updateMetric', async () => {
    const metricId = 'metric-1';
    const updateData: UpdateMetricDto = { name: 'Updated Metric', description: 'Updated description', type: MetricType.NUMBER, unit: 'units', comparisonType: ComparisonType.YEAR_TO_DATE, calculationMethod: CalculationMethod.MANUAL, formula: null, teamId: null };
    const updatedMetric = { id: metricId, ...updateData } as any;
    mockMetricRepository.findByIdOrThrow.mockResolvedValue({id: metricId});
    mockMetricRepository.update.mockResolvedValue(updatedMetric);

    const metric = await metricService.updateMetric(metricId, updateData);

    expect(mockMetricRepository.update).toHaveBeenCalledWith(metricId, updateData);
    expect(metric).toEqual(updatedMetric);
  });

  it('updateMetric validation', async () => {
    const metricId = 'metric-1';
    const updateData: UpdateMetricDto = { name: '', description: '', type: MetricType.NUMBER, unit: 'units', comparisonType: ComparisonType.YEAR_TO_DATE, calculationMethod: CalculationMethod.MANUAL, formula: null, teamId: null };
    mockMetricRepository.findByIdOrThrow.mockResolvedValue({id: metricId});

    await expect(metricService.updateMetric(metricId, updateData)).rejects.toThrow(ValidationError);
  });

  it('deleteMetric', async () => {
    const metricId = 'metric-1';
    const deletedMetric = { id: metricId, name: 'Test Metric' } as any;
    mockMetricRepository.findByIdOrThrow.mockResolvedValue({id: metricId});
    mockMetricRepository.delete.mockResolvedValue(deletedMetric);

    const metric = await metricService.deleteMetric(metricId);

    expect(mockMetricThresholdRepository.deleteAllForMetric).toHaveBeenCalledWith(metricId);
    expect(mockMetricRepository.delete).toHaveBeenCalledWith(metricId);
    expect(metric).toEqual(deletedMetric);
  });

  it('linkGoalToMetric', async () => {
    const metricId = 'metric-1';
    const goalId = 'goal-1';
    const updatedMetric = { id: metricId, name: 'Test Metric', goals: [goalId] } as any;
    mockMetricRepository.addGoalToMetric.mockResolvedValue(updatedMetric);

    const metric = await metricService.linkGoalToMetric(metricId, goalId);

    expect(mockMetricRepository.addGoalToMetric).toHaveBeenCalledWith(metricId, goalId);
    expect(metric).toEqual(updatedMetric);
  });

  it('unlinkGoalFromMetric', async () => {
    const metricId = 'metric-1';
    const goalId = 'goal-1';
    const updatedMetric = { id: metricId, name: 'Test Metric', goals: [] } as any;
    mockMetricRepository.removeGoalFromMetric.mockResolvedValue(updatedMetric);

    const metric = await metricService.unlinkGoalFromMetric(metricId, goalId);

    expect(mockMetricRepository.removeGoalFromMetric).toHaveBeenCalledWith(metricId, goalId);
    expect(metric).toEqual(updatedMetric);
  });

  it('getDashboardData', async () => {
    const filters = { organizationId: 'org-1' };
    const comparisonType = ComparisonType.YEAR_TO_DATE;
    const mockMetrics = [{ id: 'metric-1', name: 'Test Metric' }] as any[];
    const mockDashboardData = { metrics: mockMetrics, timeRange: {}, categories: {} } as any;
    mockMetricRepository.findByOrganizationId.mockResolvedValue(mockMetrics);
    mockMetricCalculationService.prepareDashboardData.mockResolvedValue(mockDashboardData);

    const dashboardData = await metricService.getDashboardData(filters, comparisonType);

    expect(mockMetricRepository.findByOrganizationId).toHaveBeenCalledWith('org-1', {include: {thresholds: true, team: true}});
    expect(mockMetricCalculationService.prepareDashboardData).toHaveBeenCalledWith(mockMetrics, comparisonType, expect.any(Date));
    expect(dashboardData).toEqual(mockDashboardData);
  });

  it('getForecastData', async () => {
    const metricId = 'metric-1';
    const periods = 10;
    const mockForecastData = [{ timestamp: new Date(), value: 100 }] as any[];
    mockMetricRepository.findByIdOrThrow.mockResolvedValue({id: metricId});
    mockMetricCalculationService.calculateForecast.mockResolvedValue(mockForecastData);

    const forecastData = await metricService.getForecastData(metricId, periods);

    expect(mockMetricCalculationService.calculateForecast).toHaveBeenCalledWith(metricId, periods);
    expect(forecastData).toEqual(mockForecastData);
  });

  it('calculateDerivedMetricValue', async () => {
    const metricId = 'metric-1';
    const timestamp = new Date();
    const mockCalculatedValue = 100;
    mockMetricCalculationService.calculateDerivedMetric.mockResolvedValue(mockCalculatedValue);

    const calculatedValue = await metricService.calculateDerivedMetricValue(metricId, timestamp);

    expect(mockMetricCalculationService.calculateDerivedMetric).toHaveBeenCalledWith(metricId, timestamp);
    expect(calculatedValue).toEqual(mockCalculatedValue);
  });
});

describe('MetricValueService', () => {
  let metricValueService: MetricValueService;
  let mockMetricRepository: jest.Mocked<MetricRepository>;
  let mockMetricValueRepository: jest.Mocked<MetricValueRepository>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockFirestoreService: jest.Mocked<FirestoreService>;

  beforeEach(() => {
    mockMetricRepository = createMockMetricRepository();
    mockMetricValueRepository = createMockMetricValueRepository();
    mockNotificationService = createMockNotificationService();
    mockFirestoreService = createMockFirestoreService();

    metricValueService = new MetricValueService(
      mockMetricValueRepository,
      mockMetricRepository,
      mockNotificationService,
      mockFirestoreService
    );
  });

  it('createMetricValue', async () => {
    const metricValueData: CreateMetricValueDto = {
      value: 100,
      timestamp: new Date(),
      metricId: 'metric-1',
      note: 'Test note',
    };
    const userId = 'user-1';
    const createdMetricValue = { id: 'value-1', ...metricValueData, userId } as any;
    mockMetricRepository.findByIdOrThrow.mockResolvedValue({id: 'metric-1'});
    mockMetricValueRepository.createForMetric.mockResolvedValue(createdMetricValue);

    const metricValue = await metricValueService.createMetricValue(metricValueData, userId);

    expect(mockMetricValueRepository.createForMetric).toHaveBeenCalledWith(metricValueData, userId);
    expect(metricValue).toEqual(createdMetricValue);
  });

  it('getMetricValues', async () => {
    const filters = { metricId: 'metric-1' };
    const mockMetricValues = [{ id: 'value-1', value: 100 }] as any[];
    mockMetricValueRepository.findByMetricId.mockResolvedValue(mockMetricValues);

    const metricValues = await metricValueService.getMetricValues(filters);

    expect(mockMetricValueRepository.findByMetricId).toHaveBeenCalledWith('metric-1');
    expect(metricValues).toEqual(mockMetricValues);
  });

  it('getLatestMetricValue', async () => {
    const metricId = 'metric-1';
    const mockMetricValue = { id: 'value-1', value: 100 } as any;
    mockMetricValueRepository.findLatestByMetricId.mockResolvedValue(mockMetricValue);

    const metricValue = await metricValueService.getLatestMetricValue(metricId);

    expect(mockMetricValueRepository.findLatestByMetricId).toHaveBeenCalledWith(metricId);
    expect(metricValue).toEqual(mockMetricValue);
  });

  it('getMetricTrend', async () => {
    const metricId = 'metric-1';
    const comparisonType = ComparisonType.YEAR_TO_DATE;
    mockMetricValueRepository.getAggregatedValues.mockResolvedValue({ current: 100, previous: 80 });

    const trendData = await metricValueService.getMetricTrend(metricId, comparisonType);

    expect(mockMetricValueRepository.getAggregatedValues).toHaveBeenCalledWith(metricId, comparisonType, expect.any(Date));
    expect(trendData).toEqual({ current: 100, previous: 80, changePercentage: 25, trend: TrendDirection.UP });
  });

  it('getTimeSeriesData', async () => {
    const metricId = 'metric-1';
    const startDate = new Date();
    const endDate = new Date();
    const interval = 'day';
    const mockTimeSeriesData = [{ timestamp: new Date(), value: 100 }] as any[];
    mockMetricValueRepository.getTimeSeriesData.mockResolvedValue(mockTimeSeriesData);

    const timeSeriesData = await metricValueService.getTimeSeriesData(metricId, startDate, endDate, interval);

    expect(mockMetricValueRepository.getTimeSeriesData).toHaveBeenCalledWith(metricId, startDate, endDate, interval);
    expect(timeSeriesData).toEqual(mockTimeSeriesData);
  });

  it('checkThresholdCrossings', async () => {
    const metricId = 'metric-1';
    const value = 100;
    const mockThresholds = [{ id: 'threshold-1', type: ThresholdType.TARGET, value: 90, crossed: true }] as any[];
    mockMetricRepository.findById.mockResolvedValue({id: metricId, thresholds: [{ id: 'threshold-1', type: ThresholdType.TARGET, value: 90 }]});
    
    const crossings = await metricValueService.checkThresholdCrossings(metricId, value);

    expect(mockMetricRepository.findById).toHaveBeenCalledWith(metricId, {include: {thresholds: true}});
    expect(crossings).toEqual([{ id: 'threshold-1', type: ThresholdType.TARGET, value: 90, crossed: true }]);
  });

  it('sendThresholdAlerts', async () => {
    const metricId = 'metric-1';
    const crossings = [{ thresholdId: 'threshold-1', type: ThresholdType.TARGET, value: 90, crossed: true }] as any[];
    mockMetricRepository.findById.mockResolvedValue({id: metricId, organizationId: 'org-1', name: 'Test Metric'});

    await metricValueService.sendThresholdAlerts(metricId, crossings);

    expect(mockNotificationService.sendHighPriorityNotification).toHaveBeenCalled();
  });
});

describe('MetricCalculationService', () => {
  let metricCalculationService: MetricCalculationService;
  let mockMetricRepository: jest.Mocked<MetricRepository>;
  let mockMetricValueRepository: jest.Mocked<MetricValueRepository>;

  beforeEach(() => {
    mockMetricRepository = createMockMetricRepository();
    mockMetricValueRepository = createMockMetricValueRepository();

    metricCalculationService = new MetricCalculationService(
      mockMetricRepository,
      mockMetricValueRepository
    );
  });

  it('calculateDerivedMetric', async () => {
    const metricId = 'metric-1';
    const timestamp = new Date();
    mockMetricRepository.findById.mockResolvedValue({id: metricId, calculationMethod: CalculationMethod.SUM, formula: null});
    mockMetricValueRepository.findByMetricIdAndDateRange.mockResolvedValue([]);

    const calculatedValue = await metricCalculationService.calculateDerivedMetric(metricId, timestamp);

    expect(calculatedValue).toBeNull();
  });

  it('evaluateFormula', () => {
    const formula = 'metric_1 + metric_2';
    const variables = { metric_1: 10, metric_2: 20 };

    const result = metricCalculationService.evaluateFormula(formula, variables);

    expect(result).toBe(30);
  });

  it('getComponentMetricValues', async () => {
    const metricIds = ['metric-1', 'metric-2'];
    mockMetricValueRepository.findByMetricIdAndDateRange.mockResolvedValue([{ value: 100 }] as any[]);

    const componentValues = await metricCalculationService.getComponentMetricValues(metricIds, new Date());

    expect(mockMetricValueRepository.findByMetricIdAndDateRange).toHaveBeenCalledTimes(2);
    expect(componentValues).toEqual({ 'metric-1': 100, 'metric-2': 100 });
  });

  it('enrichMetricsWithCalculatedValues', async () => {
    const metrics = [{ id: 'metric-1', name: 'Test Metric' }] as any[];
    const comparisonType = ComparisonType.YEAR_TO_DATE;
    mockMetricValueRepository.getAggregatedValues.mockResolvedValue({ current: 100, previous: 80 });
    mockMetricValueRepository.getTimeSeriesData.mockResolvedValue([]);

    const enrichedMetrics = await metricCalculationService.enrichMetricsWithCalculatedValues(metrics, comparisonType);

    expect(mockMetricValueRepository.getAggregatedValues).toHaveBeenCalledWith('metric-1', comparisonType, expect.any(Date));
    expect(enrichedMetrics[0].currentValue).toBe(100);
  });

  it('prepareDashboardData', async () => {
    const metrics = [{ id: 'metric-1', name: 'Test Metric', type: MetricType.NUMBER }] as any[];
    const comparisonType = ComparisonType.YEAR_TO_DATE;
    mockMetricCalculationService.enrichMetricsWithCalculatedValues.mockResolvedValue(metrics);

    const dashboardData = await metricCalculationService.prepareDashboardData(metrics, comparisonType);

    expect(mockMetricCalculationService.enrichMetricsWithCalculatedValues).toHaveBeenCalledWith(metrics, comparisonType, expect.any(Date));
    expect(dashboardData.metrics).toEqual(metrics);
  });

  it('calculateForecast', async () => {
    const metricId = 'metric-1';
    const periods = 10;
    mockMetricValueRepository.getTimeSeriesData.mockResolvedValue([{ timestamp: new Date(), value: 100 }] as any[]);

    const forecastData = await metricCalculationService.calculateForecast(metricId, periods);

    expect(mockMetricValueRepository.getTimeSeriesData).toHaveBeenCalledWith(metricId, expect.any(Date), expect.any(Date), 'day');
    expect(forecastData).toEqual([]);
  });

  it('calculateTrendDirection', () => {
    expect(metricCalculationService.calculateTrendDirection(5)).toBe(TrendDirection.UP);
    expect(metricCalculationService.calculateTrendDirection(-5)).toBe(TrendDirection.DOWN);
    expect(metricCalculationService.calculateTrendDirection(0)).toBe(TrendDirection.FLAT);
    expect(metricCalculationService.calculateTrendDirection(null)).toBe(TrendDirection.FLAT);
  });

  it('calculateChangePercentage', () => {
    expect(metricCalculationService.calculateChangePercentage(100, 80)).toBe(25);
    expect(metricCalculationService.calculateChangePercentage(100, 0)).toBe(100);
    expect(metricCalculationService.calculateChangePercentage(0, 0)).toBe(0);
    expect(metricCalculationService.calculateChangePercentage(null, 80)).toBeNull();
  });
});